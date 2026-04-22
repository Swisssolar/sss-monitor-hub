import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding database…");

  // ---------------------------------------------------------------------------
  // Provider types — static reference data
  // ---------------------------------------------------------------------------
  const providerSeeds = [
    { code: "ENPHASE",      displayName: "Enphase Enlighten",  authMode: "OAUTH"          },
    { code: "FRONIUS",      displayName: "Fronius",            authMode: "LOCAL_ENDPOINT" },
    { code: "VICTRON",      displayName: "Victron VRM",        authMode: "API_TOKEN"      },
    { code: "HUAWEI",       displayName: "Huawei FusionSolar", authMode: "API_TOKEN"      },
    { code: "SOLAX",        displayName: "SolaX Cloud",        authMode: "LINK_ONLY"      },
    { code: "GENERIC_LINK", displayName: "Portail externe",    authMode: "LINK_ONLY"      },
  ] as const;

  for (const p of providerSeeds) {
    await prisma.providerType.upsert({
      where: { code: p.code },
      update: { displayName: p.displayName, authMode: p.authMode, isActive: true },
      create: { code: p.code, displayName: p.displayName, authMode: p.authMode, isActive: true },
    });
  }

  const allProviders = await prisma.providerType.findMany();
  const providerByCode = Object.fromEntries(
    allProviders.map((p: (typeof allProviders)[number]) => [p.code, p])
  );

  // ---------------------------------------------------------------------------
  // Users: 1 admin + 1 property manager (client role)
  // ---------------------------------------------------------------------------
  const adminPassword = await bcrypt.hash("admin1234", 12);
  const clientPassword = await bcrypt.hash("regie1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "adson@swisssolarsystem.com" },
    update: { passwordHash: adminPassword, role: "ADMIN", name: "Adson Bailly" },
    create: {
      email: "adson@swisssolarsystem.com",
      name: "Adson Bailly",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "regie@demo.ch" },
    update: { passwordHash: clientPassword, role: "CLIENT", name: "Régie Lémanique SA" },
    create: {
      email: "regie@demo.ch",
      name: "Régie Lémanique SA",
      passwordHash: clientPassword,
      role: "CLIENT",
    },
  });

  // ---------------------------------------------------------------------------
  // One property manager organization
  // ---------------------------------------------------------------------------
  let regie = await prisma.organization.findFirst({
    where: { name: "Régie Lémanique SA" },
  });
  if (!regie) {
    regie = await prisma.organization.create({
      data: {
        name: "Régie Lémanique SA",
        contactName: "Claire Fontanet",
        contactEmail: "c.fontanet@regie-lemanique.ch",
        phone: "+41 21 123 45 67",
        notes: "Gestion d'immeubles résidentiels dans le canton de Vaud.",
      },
    });
  }

  // Memberships (admin as OWNER for supervision, client as MANAGER)
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: admin.id, organizationId: regie.id } },
    update: { roleWithinOrganization: "OWNER" },
    create: {
      userId: admin.id,
      organizationId: regie.id,
      roleWithinOrganization: "OWNER",
    },
  });
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: client.id, organizationId: regie.id } },
    update: { roleWithinOrganization: "MANAGER" },
    create: {
      userId: client.id,
      organizationId: regie.id,
      roleWithinOrganization: "MANAGER",
    },
  });

  // ---------------------------------------------------------------------------
  // Four demo sites — one per provider family
  // ---------------------------------------------------------------------------
  // Each site uses DEMO mode so the dashboard shows credible metrics without
  // requiring real API credentials. Flip `demoMode: false` on the connection
  // once real credentials are configured via the admin UI.
  // ---------------------------------------------------------------------------
  const siteSeeds = [
    {
      name: "Résidence du Léman",
      address: "Chemin des Cèdres 4",
      city: "Pully",
      postalCode: "1009",
      kwcInstalled: 22.5,
      batteryKwh: 15,
      provider: "ENPHASE" as const,
      externalPortalUrl: "https://enlighten.enphaseenergy.com/systems/DEMO-1001",
      notes: "Toit en shed, 45 modules MaviWatt PULSE 500 Wc, stockage Enphase IQ 5P ×3.",
    },
    {
      name: "Villa Bonvin — Crans-Montana",
      address: "Route du Rawyl 22",
      city: "Crans-Montana",
      postalCode: "3963",
      kwcInstalled: 12,
      batteryKwh: 10,
      provider: "VICTRON" as const,
      externalPortalUrl: "https://vrm.victronenergy.com/installation/DEMO-2002/dashboard",
      notes: "AC coupling batterie rétrofit, système Victron.",
    },
    {
      name: "Ferme solaire Vonlanthen",
      address: "Route de Matran 18",
      city: "Neyruz",
      postalCode: "1740",
      kwcInstalled: 48.5,
      batteryKwh: 20,
      provider: "FRONIUS" as const,
      externalPortalUrl: "https://www.solarweb.com/Home/GuestLogOn?pvSystemid=DEMO-3003",
      notes: "Fronius GEN24 24kW + Fronius Datamanager, deux trackers MPPT.",
    },
    {
      name: "Immeuble Riverside — Lausanne",
      address: "Avenue de Cour 140",
      city: "Lausanne",
      postalCode: "1007",
      kwcInstalled: 85,
      batteryKwh: 50,
      provider: "HUAWEI" as const,
      externalPortalUrl: "https://eu5.fusionsolar.huawei.com",
      notes: "Installation commerciale Huawei Luna 2000, API Northbound en attente.",
    },
  ];

  // Clean previous demo sites so re-seeding is idempotent.
  await prisma.site.deleteMany({
    where: {
      organizationId: regie.id,
      name: { in: siteSeeds.map((s) => s.name) },
    },
  });

  for (const s of siteSeeds) {
    const site = await prisma.site.create({
      data: {
        organizationId: regie.id,
        name: s.name,
        address: s.address,
        city: s.city,
        postalCode: s.postalCode,
        country: "CH",
        kwcInstalled: s.kwcInstalled,
        batteryKwh: s.batteryKwh,
        providerPrimary: s.provider,
        externalPortalUrl: s.externalPortalUrl,
        notes: s.notes,
      },
    });

    await prisma.providerConnection.create({
      data: {
        siteId: site.id,
        providerTypeId: providerByCode[s.provider]!.id,
        status: "DEMO",
        demoMode: true,
        apiBaseUrl: s.externalPortalUrl,
        metadataJson: { seededAt: new Date().toISOString() },
        externalAccountIdentifier: `DEMO-${Math.floor(Math.random() * 9000 + 1000)}`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "seed.completed",
      entityType: "System",
      payloadJson: { sites: siteSeeds.length },
    },
  });

  console.log("✓ Seed complete");
  console.log("");
  console.log("  Admin login : adson@swisssolarsystem.com / admin1234");
  console.log("  Client login: regie@demo.ch / regie1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
