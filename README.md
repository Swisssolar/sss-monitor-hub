# SSS Monitor Hub

**Un seul portail pour superviser toutes vos installations photovoltaïques — quel que soit le fabricant.**

Plateforme web développée pour Swiss Solar System Sàrl. Elle agrège les données de monitoring Enphase, Fronius, Victron, SolaX et Huawei dans une interface unique, mobile-first et premium. Quand une intégration API directe n'est pas disponible, l'application bascule proprement vers un lien vers le portail officiel du fabricant. Conçue pour les clients finaux, les régies et les gestionnaires de patrimoine.

---

## Lancer localement

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# → Renseigner les 3 variables obligatoires (voir section ci-dessous)

# 3. Générer les secrets (copier la sortie dans .env.local)
node -e "console.log('AUTH_SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('PROVIDER_TOKEN_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"

# 4. Initialiser la base de données
npx prisma migrate dev --name init

# 5. Charger les données de démonstration
npm run db:seed

# 6. Démarrer
npm run dev
```

Accessible sur **http://localhost:3000**

---

## Variables d'environnement obligatoires

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL — ex. `postgresql://user:pass@localhost:5432/sss_hub` |
| `AUTH_SESSION_SECRET` | 32 octets base64 — signe les JWT de session |
| `PROVIDER_TOKEN_ENCRYPTION_KEY` | 32 octets base64 — chiffre les tokens fournisseurs (AES-256-GCM) |

Toutes les autres variables sont optionnelles et activent les intégrations réelles (Enphase, Victron, Huawei). Voir `.env.example` pour le détail complet.

---

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur (SSS) | `adson@swisssolarsystem.com` | `admin1234` |
| Client / Régie | `regie@demo.ch` | `regie1234` |

> Changer ces mots de passe avant tout déploiement en production.

---

## Ce qui est réellement connecté

| Fournisseur | Statut | Ce qu'il faut |
|---|---|---|
| **Fronius** | Opérationnel | URL locale de la Datamanager (ex. `http://192.168.1.50`) |
| **Victron VRM** | Opérationnel | Username + password du compte VRM installateur |
| **Enphase Enlighten** | Opérationnel | OAuth 2.0 — nécessite une app sur developer-v4.enphase.com |
| **SolaX** | Lien externe | URL SolaXCloud — le client clique pour accéder à son portail |
| **Portail externe** | Lien externe | N'importe quelle URL de portail fabricant |
| **Huawei FusionSolar** | Scaffold prêt | Attend les credentials API Northbound (validation entreprise Huawei) |

---

## Mode démonstration

Le mode démo génère des métriques réalistes sans aucune clé API.

**Qualité des données synthétiques :**
- Courbe de production diurne centrée sur 13h30 (midi solaire)
- Modulation saisonnière : pic juin, creux décembre
- Bruit stochastique ±15 % pour un rendu non-robotique
- Cohérence physique : batterie qui se charge le jour, injection réseau uniquement si PV > conso
- CO₂ calculé depuis l'énergie lifetime (mix suisse — 0.128 kg/kWh)
- Mise à l'échelle par kWc installé — une installation 10 kWc à 14h en avril affiche ~6–8 kW

**Activer le mode démo :**
- Par connexion : bouton « Activer démo » dans `/admin/connexions`
- Global (fallback) : `ENABLE_GLOBAL_DEMO_MODE=true` dans `.env.local`

Les données démo ne sont jamais persistées en base — générées à la volée à chaque affichage.

---

## Structure du projet

```
app/
  (admin)/          → Console SSS : organisations, sites, connexions, utilisateurs
  (client)/         → Portail client : tableau de bord, détail site, paramètres
  api/              → Routes API : auth, sync cron, callback OAuth Enphase
  login/            → Page de connexion publique

components/
  layout/           → AppShell (nav + footer), LogoMark
  site/             → SiteCard, MetricsGrid, ProductionChart, StatusPill, ProviderBadge
  ui/               → Button, Input, Card

lib/
  providers/        → Adaptateurs fournisseurs (Enphase, Fronius, Victron, Huawei, démo)
  services/         → Logique métier : sites, sync, audit
  actions/          → Server actions Next.js (CRUD admin)
  auth.ts           → JWT session, bcrypt, guards requireSession / requireAdmin
  crypto.ts         → AES-256-GCM pour les tokens fournisseurs

prisma/
  schema.prisma     → Modèle complet (User, Site, ProviderConnection, SiteMetricSnapshot…)
  seed.ts           → Données de démo idempotentes (4 sites, 1 admin, 1 client)
```

---

## Déploiement Vercel

```bash
# Variables à configurer côté Vercel :
DATABASE_URL
AUTH_SESSION_SECRET
PROVIDER_TOKEN_ENCRYPTION_KEY
SYNC_CRON_SECRET
NEXT_PUBLIC_APP_URL   # https://monitor.swisssolarsystem.com

# Une seule fois depuis votre poste, pointé sur la DB prod :
DATABASE_URL="..." npx prisma migrate deploy
```

Cron de synchronisation automatique (toutes les 15 min) via `vercel.json` :

```json
{ "crons": [{ "path": "/api/sync", "schedule": "*/15 * * * *" }] }
```

---

## Pitcher le produit à une régie en 30 secondes

> « Vous gérez des immeubles avec des systèmes solaires de marques différentes — Fronius ici, Victron là, Enphase ailleurs. Aujourd'hui vous avez autant de portails que de marques, avec des identifiants différents partout.
>
> Monitor Hub, c'est un seul lien pour tout voir : production instantanée, batterie, énergie du jour, courbe 24h — tous vos bâtiments sur un seul écran. Si on n'a pas encore l'intégration API directe pour un fabricant, on place un bouton qui ouvre le portail officiel en un clic.
>
> Vos locataires ou co-propriétaires peuvent y avoir accès aussi, avec leur propre compte, sur mobile. »

---

Swiss Solar System Sàrl · Chavannes-près-Renens · contact@swisssolarsystem.com · +41 21 552 04 40
