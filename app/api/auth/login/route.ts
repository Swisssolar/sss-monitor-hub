import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  setSessionCookie,
  verifyCredentials,
} from "@/lib/auth";
import { audit } from "@/lib/services/audit";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const user = await verifyCredentials(email, password);
  if (!user) {
    await audit({
      action: "login.failed",
      entityType: "User",
      payload: { email },
    });
    return NextResponse.redirect(new URL("/login?error=1", req.url), { status: 303 });
  }

  const token = await createSession(user);
  await setSessionCookie(token);

  await audit({
    actorUserId: user.userId,
    action: "login.success",
    entityType: "User",
    entityId: user.userId,
  });

  const dest = user.role === "ADMIN" ? "/admin" : "/dashboard";
  return NextResponse.redirect(new URL(dest, req.url), { status: 303 });
}
