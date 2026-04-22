"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/services/audit";
import { encryptSecret } from "@/lib/crypto";
import { syncConnection } from "@/lib/services/sync";
import {
  enphaseAuthorizeUrl,
  enphaseIsConfigured,
} from "@/lib/providers/enphase";

// -----------------------------------------------------------------------------
// Organizations
// -----------------------------------------------------------------------------

const OrgSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createOrganization(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = OrgSchema.parse({
    name: formData.get("name"),
    contactName: formData.get("contactName") || null,
    contactEmail: formData.get("contactEmail") || null,
    phone: formData.get("phone") || null,
    notes: formData.get("notes") || null,
  });

  const org = await prisma.organization.create({ data: parsed });
  await audit({
    actorUserId: admin.userId,
    action: "organization.create",
    entityType: "Organization",
    entityId: org.id,
    payload: { name: org.name },
  });
  revalidatePath("/admin/organisations");
  redirect("/admin/organisations");
}

// -----------------------------------------------------------------------------
// Users + memberships
// -----------------------------------------------------------------------------

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "CLIENT"]),
  organizationId: z.string().optional().nullable(),
});

export async function createUser(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = UserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    organizationId: formData.get("organizationId") || null,
  });

  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.password),
      role: parsed.role,
    },
  });

  if (parsed.organizationId) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: parsed.organizationId,
        roleWithinOrganization: "MANAGER",
      },
    });
  }

  await audit({
    actorUserId: admin.userId,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
    payload: { email: user.email, role: user.role },
  });
  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs");
}

// -----------------------------------------------------------------------------
// Sites
// -----------------------------------------------------------------------------

const SiteSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default("CH"),
  kwcInstalled: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().nullable()
  ),
  batteryKwh: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().nullable()
  ),
  providerPrimary: z
    .enum(["ENPHASE", "FRONIUS", "VICTRON", "HUAWEI", "SOLAX", "GENERIC_LINK"])
    .optional()
    .nullable(),
  externalPortalUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .nullable(),
  notes: z.string().optional().nullable(),
});

export async function createSite(formData: FormData) {
  const admin = await requireAdmin();
  const raw = {
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    address: formData.get("address") || null,
    city: formData.get("city") || null,
    postalCode: formData.get("postalCode") || null,
    country: formData.get("country") || "CH",
    kwcInstalled: formData.get("kwcInstalled"),
    batteryKwh: formData.get("batteryKwh"),
    providerPrimary: formData.get("providerPrimary") || null,
    externalPortalUrl: formData.get("externalPortalUrl") || null,
    notes: formData.get("notes") || null,
  };
  const parsed = SiteSchema.parse(raw);

  const site = await prisma.site.create({
    data: {
      organizationId: parsed.organizationId,
      name: parsed.name,
      address: parsed.address ?? null,
      city: parsed.city ?? null,
      postalCode: parsed.postalCode ?? null,
      country: parsed.country,
      kwcInstalled: parsed.kwcInstalled,
      batteryKwh: parsed.batteryKwh,
      providerPrimary: parsed.providerPrimary ?? null,
      externalPortalUrl: parsed.externalPortalUrl || null,
      notes: parsed.notes ?? null,
    },
  });
  await audit({
    actorUserId: admin.userId,
    action: "site.create",
    entityType: "Site",
    entityId: site.id,
    payload: { name: site.name, orgId: site.organizationId },
  });
  revalidatePath("/admin/sites");
  redirect("/admin/sites");
}

// -----------------------------------------------------------------------------
// Connections
// -----------------------------------------------------------------------------

const ConnSchema = z.object({
  siteId: z.string().min(1),
  providerTypeId: z.string().min(1),
  apiBaseUrl: z.string().optional().nullable(),
  externalAccountIdentifier: z.string().optional().nullable(),
  apiSecret: z.string().optional().nullable(),
  demoMode: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  metadata: z.string().optional().nullable(),
});

export async function createConnection(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = ConnSchema.parse({
    siteId: formData.get("siteId"),
    providerTypeId: formData.get("providerTypeId"),
    apiBaseUrl: formData.get("apiBaseUrl") || null,
    externalAccountIdentifier: formData.get("externalAccountIdentifier") || null,
    apiSecret: formData.get("apiSecret") || null,
    demoMode: formData.get("demoMode") === "on",
    metadata: formData.get("metadata") || null,
  });

  const providerType = await prisma.providerType.findUniqueOrThrow({
    where: { id: parsed.providerTypeId },
  });

  const meta =
    parsed.metadata && parsed.metadata.trim().length
      ? safeJson(parsed.metadata)
      : undefined;

  const conn = await prisma.providerConnection.create({
    data: {
      siteId: parsed.siteId,
      providerTypeId: parsed.providerTypeId,
      apiBaseUrl: parsed.apiBaseUrl,
      externalAccountIdentifier: parsed.externalAccountIdentifier,
      accessTokenEncrypted: parsed.apiSecret
        ? encryptSecret(parsed.apiSecret)
        : null,
      demoMode: parsed.demoMode,
      status: parsed.demoMode
        ? "DEMO"
        : providerType.authMode === "LINK_ONLY"
        ? "LINK_ONLY"
        : "PENDING",
      metadataJson: meta,
    },
  });

  await audit({
    actorUserId: admin.userId,
    action: "connection.create",
    entityType: "ProviderConnection",
    entityId: conn.id,
    payload: { siteId: conn.siteId, provider: providerType.code },
  });

  revalidatePath("/admin/connexions");
  redirect("/admin/connexions");
}

/** Toggle demo mode on a connection. Accepts FormData with `connectionId`. */
export async function toggleDemoMode(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const connectionId = String(formData.get("connectionId") ?? "");
  if (!connectionId) return;

  const conn = await prisma.providerConnection.findUnique({
    where: { id: connectionId },
  });
  if (!conn) return;

  const newDemo = !conn.demoMode;
  const updated = await prisma.providerConnection.update({
    where: { id: connectionId },
    data: {
      demoMode: newDemo,
      status: newDemo ? "DEMO" : "PENDING",
      lastError: null,
    },
  });
  await audit({
    actorUserId: admin.userId,
    action: "connection.toggle_demo",
    entityType: "ProviderConnection",
    entityId: updated.id,
    payload: { demoMode: updated.demoMode },
  });
  revalidatePath("/admin/connexions");
}

/** Run sync-now on a single connection. Accepts FormData with `connectionId`. */
export async function syncConnectionNow(formData: FormData): Promise<void> {
  await requireAdmin();
  const connectionId = String(formData.get("connectionId") ?? "");
  if (!connectionId) return;
  await syncConnection(connectionId);
  revalidatePath("/admin/connexions");
  revalidatePath("/dashboard");
}

/** Start the Enphase OAuth dance. Accepts FormData with `connectionId`. */
export async function startEnphaseOAuth(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!enphaseIsConfigured()) {
    redirect("/admin/connexions?error=enphase_not_configured");
  }
  const connectionId = String(formData.get("connectionId") ?? "");
  if (!connectionId) redirect("/admin/connexions");
  redirect(enphaseAuthorizeUrl(connectionId));
}

function safeJson(s: string): Record<string, unknown> | undefined {
  try {
    const v = JSON.parse(s);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
