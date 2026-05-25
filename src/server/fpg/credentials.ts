/**
 * Demo credentials for the FPG mock API.
 *
 * In a real deployment FPG would issue client_id / client_secret pairs to each
 * integration partner (here, APEX). The mock accepts a single pair sourced
 * from environment variables, with a default for local development.
 */

import { sha256 } from "@/server/crypto";
import type { ApiKeyScope } from "@/server/types";

export const FPG_DEMO_CLIENT_ID = process.env.FPG_CLIENT_ID ?? "apex_demo";
export const FPG_DEMO_CLIENT_SECRET =
  process.env.FPG_CLIENT_SECRET ?? "apex_demo_secret_change_in_prod";
export const FPG_HMAC_SECRET =
  process.env.FPG_HMAC_SECRET ?? "fpg-response-hmac-DEV-CHANGE-ME";

export const FPG_DEMO_ALLOWED_SCOPES: ApiKeyScope[] = [
  "read",
  "kyc.upload",
  "accounts.create",
  "payments.initiate",
  "reporting",
  "webhooks.replay",
];

export function verifyClientCredentials(
  clientId: string,
  clientSecret: string
): boolean {
  if (clientId !== FPG_DEMO_CLIENT_ID) return false;
  // constant-time compare via sha256 commitment
  return sha256(clientSecret) === sha256(FPG_DEMO_CLIENT_SECRET);
}
