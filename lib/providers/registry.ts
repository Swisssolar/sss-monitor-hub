import type { ProviderCode } from "@prisma/client";
import type { ProviderAdapter } from "./types";
import { enphaseAdapter } from "./enphase";
import { froniusAdapter } from "./fronius";
import { victronAdapter } from "./victron";
import { huaweiAdapter } from "./huawei";
import { genericLinkAdapter } from "./generic-link";

/**
 * Lookup table: ProviderCode → adapter.
 *
 * SOLAX is currently handled through GENERIC_LINK (the SolaX Cloud portal);
 * a dedicated adapter can be added later using the same pattern without
 * touching the rest of the app.
 */
export const providerRegistry: Record<ProviderCode, ProviderAdapter> = {
  ENPHASE: enphaseAdapter,
  FRONIUS: froniusAdapter,
  VICTRON: victronAdapter,
  HUAWEI: huaweiAdapter,
  SOLAX: genericLinkAdapter,
  GENERIC_LINK: genericLinkAdapter,
};

export function getAdapter(code: ProviderCode): ProviderAdapter {
  return providerRegistry[code];
}

export interface ProviderDescriptor {
  code: ProviderCode;
  displayName: string;
  /** What the admin needs to set up this provider, shown as help text. */
  setupHint: string;
  /** True when direct API sync is available (vs launch-only). */
  hasDirectSync: boolean;
}

export const providerCatalog: ProviderDescriptor[] = [
  {
    code: "FRONIUS",
    displayName: "Fronius",
    setupHint:
      "Renseigner l'URL locale de la Datamanager (ex. http://192.168.1.50). Aucune clé cloud nécessaire.",
    hasDirectSync: true,
  },
  {
    code: "VICTRON",
    displayName: "Victron VRM",
    setupHint:
      "Se connecter au VRM avec un compte installateur dédié, puis sélectionner l'installation.",
    hasDirectSync: true,
  },
  {
    code: "ENPHASE",
    displayName: "Enphase Enlighten",
    setupHint:
      "Utilise OAuth 2.0. Nécessite l'enregistrement d'une application sur developer-v4.enphase.com.",
    hasDirectSync: true,
  },
  {
    code: "HUAWEI",
    displayName: "Huawei FusionSolar",
    setupHint:
      "Nécessite un compte API Northbound (niveau entreprise). En attendant, utiliser le lien externe.",
    hasDirectSync: false,
  },
  {
    code: "SOLAX",
    displayName: "SolaX Cloud",
    setupHint:
      "Lien direct vers SolaXCloud.com. Monitoring natif côté client, intégration API prévue.",
    hasDirectSync: false,
  },
  {
    code: "GENERIC_LINK",
    displayName: "Portail externe",
    setupHint:
      "Enregistrer l'URL du portail officiel. Le client y accède en un clic depuis son tableau de bord.",
    hasDirectSync: false,
  },
];
