import { getCurrentSession } from "@/server/auth";
import { jsonOk, withErrorHandling } from "@/server/http";

export async function GET() {
  return withErrorHandling(async () => {
    const cur = await getCurrentSession();
    if (!cur) return jsonOk({ session: null });
    if (cur.kind === "admin") {
      return jsonOk({
        session: {
          kind: "admin",
          twoFactorVerified: cur.session.twoFactorVerified,
          expiresAt: cur.session.expiresAt,
          user: {
            id: cur.user.id,
            name: cur.user.name,
            email: cur.user.email,
            role: cur.user.role,
            twoFAEnforced: cur.user.twoFAEnforced,
          },
        },
      });
    }
    return jsonOk({
      session: {
        kind: "client",
        expiresAt: cur.session.expiresAt,
        user: {
          apexId: cur.user.apexId,
          fpgId: cur.user.fpgId,
          firstName: cur.user.firstName,
          lastName: cur.user.lastName,
          email: cur.user.email,
          type: cur.user.type,
          status: cur.user.status,
          kyc: cur.user.kyc,
        },
      },
    });
  });
}
