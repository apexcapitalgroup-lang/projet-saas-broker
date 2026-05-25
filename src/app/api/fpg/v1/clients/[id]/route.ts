/**
 * /api/fpg/v1/clients/[id]
 *
 *   GET    Retrieve client by FPG id or APEX correlation id
 *   PATCH  Update client fields (limited; status changes go through dedicated endpoints)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { nowIso } from "@/lib/now";
import { tx, getDb } from "@/server/store";
import type { Client } from "@/server/types";

function findById(db: Awaited<ReturnType<typeof getDb>>, id: string): Client | undefined {
  return db.clients.find((c) => c.fpgId === id || c.apexId === id);
}

function presentClient(c: Client) {
  return {
    fpg_client_id: c.fpgId,
    apex_correlation_id: c.apexId,
    type: c.type,
    status: c.status,
    kyc_status: c.kyc,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email,
    phone: c.phone,
    nationality: c.nationality,
    country_of_residence: c.countryOfResidence,
    country_of_tax_residence: c.countryOfTaxResidence,
    is_us_person: c.isUsPerson,
    address: c.address,
    language: c.language,
    ib_code: c.ibCode,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    consents: c.consents,
    suitability: c.suitability,
  };
}

const PatchBody = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      postal_code: z.string().optional(),
    })
    .optional(),
  language: z.enum(["EN", "FR", "DE", "ES", "IT", "JA"]).optional(),
  suitability: z
    .object({
      experience: z.enum(["none", "lt1y", "1to2y", "3to5y", "gt5y"]),
      risk_tolerance: z.enum(["conservative", "balanced", "growth", "aggressive"]),
      net_worth: z.enum(["lt50k", "50k_250k", "250k_1m", "gt1m"]),
      objective: z.enum(["preservation", "income", "growth", "speculation"]),
    })
    .optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/clients/:id", scopes: ["read"] },
    async ({ ctx }) => {
      const { id } = await params;
      const db = await getDb();
      const c = findById(db, id);
      if (!c) return fpgError(404, "fpg.client_not_found", `No client with id=${id}`, ctx);
      return signAndSend({ client: presentClient(c) }, ctx);
    }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/clients/:id", scopes: ["accounts.create"] },
    async ({ ctx, body, finalize }) => {
      const { id } = await params;
      const parsed = PatchBody.safeParse(body);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Body validation failed", ctx, {
          details: parsed.error.issues,
        });
      }
      const b = parsed.data;
      let updated: Client | null = null;
      await tx(async (d) => {
        const c = d.clients.find((x) => x.fpgId === id || x.apexId === id);
        if (!c) return;
        if (b.phone) c.phone = b.phone;
        if (b.email) c.email = b.email;
        if (b.language) c.language = b.language;
        if (b.address) {
          if (b.address.street) c.address.street = b.address.street;
          if (b.address.city) c.address.city = b.address.city;
          if (b.address.postal_code) c.address.postalCode = b.address.postal_code;
        }
        if (b.suitability) {
          c.suitability = {
            experience: b.suitability.experience,
            riskTolerance: b.suitability.risk_tolerance,
            netWorth: b.suitability.net_worth,
            objective: b.suitability.objective,
            filledAt: nowIso(),
          };
        }
        c.updatedAt = nowIso();
        updated = c;
      });
      if (!updated) {
        return fpgError(404, "fpg.client_not_found", `No client with id=${id}`, ctx);
      }
      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "PATCH /v1/clients/:id",
        target: id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });
      const resp = { client: presentClient(updated) };
      await finalize({ body: resp, status: 200 });
      return signAndSend(resp, ctx);
    }
  );
}
