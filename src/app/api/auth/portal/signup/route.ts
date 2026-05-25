import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { createSession, writeSessionCookie } from "@/server/auth";
import { hashPassword } from "@/server/crypto";
import { newApexId } from "@/lib/ids";
import { nowIso } from "@/lib/now";
import { findClientByEmail, tx } from "@/server/store";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  readJson,
  withErrorHandling,
} from "@/server/http";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import type { Client, ConsentRecord } from "@/server/types";

const Body = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  password: z.string().min(8),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nationality: z.string().min(2),
  countryOfResidence: z.string().min(2),
  countryOfTaxResidence: z.string().min(2),
  isUsPerson: z.boolean().default(false),
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  language: z.enum(["EN", "FR", "DE", "ES", "IT", "JA"]).default("EN"),
  ibCode: z.string().default("APEX-IB-01"),
  marketingOptIn: z.boolean().default(false),
  acceptedTerms: z.boolean().refine((v) => v, "Terms must be accepted"),
  acceptedRiskDisclosure: z.boolean().refine((v) => v, "Risk disclosure must be accepted"),
  acceptedExecutionPolicy: z.boolean().refine((v) => v, "Execution policy must be accepted"),
  acceptedPrivacy: z.boolean().refine((v) => v, "Privacy notice must be accepted"),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const parsed = await readJson(req, Body);
    if ("error" in parsed) return parsed.error;
    const b = parsed.data;
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const existing = await findClientByEmail(b.email);
    if (existing) {
      return jsonError(409, "client.email_taken", "An account already exists for this email");
    }

    const { hash, salt } = hashPassword(b.password);
    const apexId = newApexId();
    const consentTs = nowIso();
    const consents: ConsentRecord[] = [
      { document: "FPG T&C", version: "v4.2", acceptedAt: consentTs, ip, userAgent },
      { document: "Risk disclosure", version: "v3.1", acceptedAt: consentTs, ip, userAgent },
      { document: "Execution policy", version: "v2.4", acceptedAt: consentTs, ip, userAgent },
      { document: "Privacy notice", version: "v5.0", acceptedAt: consentTs, ip, userAgent },
    ];

    const newClient: Client = {
      id: `c_${apexId.toLowerCase()}`,
      apexId,
      fpgId: null, // FPG client creation pending — webhook will fill this in
      type: "Retail",
      status: "pending_kyc",
      kyc: "pending",
      firstName: b.firstName,
      lastName: b.lastName,
      email: b.email,
      phone: b.phone,
      dateOfBirth: b.dateOfBirth,
      nationality: b.nationality,
      countryOfResidence: b.countryOfResidence,
      countryOfTaxResidence: b.countryOfTaxResidence,
      isUsPerson: b.isUsPerson,
      address: { street: b.street, city: b.city, postalCode: b.postalCode },
      language: b.language,
      ibCode: b.ibCode,
      registrationSource: "APEX_PORTAL",
      registrationIp: ip,
      userAgent,
      consents,
      suitability: null,
      passwordHash: hash,
      passwordSalt: salt,
      totpSecret: null,
      totalDeposits: 0,
      netDeposit: 0,
      volume30d: 0,
      accountsCount: 0,
      createdAt: consentTs,
      updatedAt: consentTs,
      lastActivityAt: consentTs,
      marketingSource: {},
    };

    await tx(async (db) => {
      db.clients.unshift(newClient);
    });

    // Dispatch FPG-side webhook: client_created (FPG would assign an FPG ID)
    await dispatchEvent("client_created", {
      apex_correlation_id: apexId,
      email: b.email,
      country_of_residence: b.countryOfResidence,
      registration_ip: ip,
    }, { clientApexId: apexId });

    // Session
    const session = await createSession({
      kind: "client",
      refId: newClient.id,
      twoFactorVerified: true,
      ip,
      userAgent,
    });
    await writeSessionCookie(session);
    await audit({
      actor: `${b.firstName} ${b.lastName}`,
      actorRole: "Client",
      action: "Created portal account",
      target: apexId,
      ip,
      userAgent,
      result: "success",
    });

    return jsonOk({
      ok: true,
      profile: {
        apexId,
        fpgId: null,
        firstName: b.firstName,
        lastName: b.lastName,
        email: b.email,
        status: "pending_kyc",
        kyc: "pending",
      },
      next: "/portal/onboarding/kyc",
    });
  });
}
