/**
 * /api/fpg/v1/clients
 *
 *  POST  Create a new client on FPG side. Requires Idempotency-Key.
 *  GET   List clients with pagination & filters.
 *
 * Scopes: accounts.create (POST), read (GET).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { newFpgClientId } from "@/lib/ids";
import { nowIso } from "@/lib/now";
import { tx, getDb } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import type { Client } from "@/server/types";

const CreateBody = z.object({
  apex_correlation_id: z.string().regex(/^APX-\d+$/),
  type: z.enum(["Retail", "Pro", "Corporate"]).default("Retail"),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nationality: z.string().min(2),
  country_of_residence: z.string().min(2),
  country_of_tax_residence: z.string().min(2),
  is_us_person: z.boolean().default(false),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postal_code: z.string().min(1),
  }),
  language: z.enum(["EN", "FR", "DE", "ES", "IT", "JA"]).default("EN"),
  ib_code: z.string().default("APEX-IB-01"),
  registration_source: z.literal("APEX_PORTAL").default("APEX_PORTAL"),
  registration_ip: z.string().min(1),
  user_agent: z.string().min(1),
  consents: z
    .array(
      z.object({
        document: z.string(),
        version: z.string(),
        accepted_at: z.string(),
        ip: z.string(),
      })
    )
    .default([]),
  marketing_source: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      referral: z.string().optional(),
    })
    .default({}),
});

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
  };
}

/* -------------------------------------------------------------------------- */
/*  POST /clients                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/clients", scopes: ["accounts.create"] },
    async ({ ctx, body, finalize }) => {
      const parsed = CreateBody.safeParse(body);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Body validation failed", ctx, {
          details: parsed.error.issues,
        });
      }
      const b = parsed.data;

      // Reject if the apex_correlation_id already maps to an existing FPG client
      const db = await getDb();
      const existing = db.clients.find((c) => c.apexId === b.apex_correlation_id);
      if (existing && existing.fpgId) {
        return fpgError(
          409,
          "fpg.client_already_exists",
          `Client with apex_correlation_id ${b.apex_correlation_id} already has fpg_client_id=${existing.fpgId}. ` +
            `Use the Idempotency-Key with the same body to replay safely.`,
          ctx
        );
      }

      // Upsert: if the APEX side has a pending record (created at signup time),
      // attach FPG id. Otherwise create a new client on FPG side and APEX side.
      const now = nowIso();
      const fpgId = newFpgClientId();
      let client: Client | null = null;
      await tx(async (d) => {
        client = d.clients.find((c) => c.apexId === b.apex_correlation_id) ?? null;
        if (client) {
          client.fpgId = fpgId;
          client.updatedAt = now;
        } else {
          client = {
            id: `c_${b.apex_correlation_id.toLowerCase()}`,
            apexId: b.apex_correlation_id,
            fpgId,
            type: b.type,
            status: "pending_kyc",
            kyc: "pending",
            firstName: b.first_name,
            lastName: b.last_name,
            email: b.email,
            phone: b.phone,
            dateOfBirth: b.date_of_birth,
            nationality: b.nationality,
            countryOfResidence: b.country_of_residence,
            countryOfTaxResidence: b.country_of_tax_residence,
            isUsPerson: b.is_us_person,
            address: {
              street: b.address.street,
              city: b.address.city,
              postalCode: b.address.postal_code,
            },
            language: b.language,
            ibCode: b.ib_code,
            registrationSource: "APEX_PORTAL",
            registrationIp: b.registration_ip,
            userAgent: b.user_agent,
            consents: b.consents.map((c) => ({
              document: c.document,
              version: c.version,
              acceptedAt: c.accepted_at,
              ip: c.ip,
              userAgent: b.user_agent,
            })),
            suitability: null,
            passwordHash: "",
            passwordSalt: "",
            totpSecret: null,
            totalDeposits: 0,
            netDeposit: 0,
            volume30d: 0,
            accountsCount: 0,
            createdAt: now,
            updatedAt: now,
            lastActivityAt: now,
            marketingSource: b.marketing_source,
          };
          d.clients.unshift(client);
        }
      });
      if (!client) {
        return fpgError(500, "fpg.client.unknown_error", "Failed to persist client", ctx);
      }

      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "POST /v1/clients",
        target: `${b.apex_correlation_id} → ${fpgId}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });

      // Emit client_created webhook (FPG-side acknowledgement)
      await dispatchEvent(
        "client_created",
        { apex_correlation_id: b.apex_correlation_id, fpg_client_id: fpgId },
        { clientApexId: b.apex_correlation_id, clientFpgId: fpgId }
      );

      const responseBody = { client: presentClient(client) };
      await finalize({ body: responseBody, status: 201 });
      return signAndSend(responseBody, ctx, { status: 201 });
    }
  );
}

/* -------------------------------------------------------------------------- */
/*  GET /clients                                                               */
/* -------------------------------------------------------------------------- */

const ListQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
  apex_correlation_id: z.string().optional(),
  email: z.string().optional(),
  status: z.string().optional(),
  kyc_status: z.string().optional(),
  ib_code: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/clients", scopes: ["read"] },
    async ({ ctx }) => {
      const params: Record<string, string> = {};
      req.nextUrl.searchParams.forEach((v, k) => (params[k] = v));
      const parsed = ListQuery.safeParse(params);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Invalid query", ctx, {
          details: parsed.error.issues,
        });
      }
      const q = parsed.data;
      const db = await getDb();
      let rows = db.clients;
      if (q.apex_correlation_id) {
        rows = rows.filter((c) => c.apexId === q.apex_correlation_id);
      }
      if (q.email) {
        rows = rows.filter((c) => c.email.toLowerCase() === q.email!.toLowerCase());
      }
      if (q.status) rows = rows.filter((c) => c.status === q.status);
      if (q.kyc_status) rows = rows.filter((c) => c.kyc === q.kyc_status);
      if (q.ib_code) rows = rows.filter((c) => c.ibCode === q.ib_code);
      const total = rows.length;
      const start = (q.page - 1) * q.page_size;
      const items = rows.slice(start, start + q.page_size).map(presentClient);
      return signAndSend(
        { items, page: q.page, page_size: q.page_size, total },
        ctx
      );
    }
  );
}
