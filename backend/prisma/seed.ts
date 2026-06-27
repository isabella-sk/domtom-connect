import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const GUIDES = [
  {
    title: "S'inscrire à la CAF",
    category: "caf",
    isPinned: true,
    content: `La CAF (Caisse d'Allocations Familiales) peut t'aider à financer une partie de ton loyer grâce aux APL (Aide Personnalisée au Logement). C'est une des premières démarches à faire à ton arrivée.

**Délai** : faire la demande dans les 2 mois après l'emménagement.

**Étapes :**
1. Crée un compte sur caf.fr avec ton numéro de sécurité sociale
2. Remplis le formulaire de demande d'APL en ligne
3. Fournis : bail de location, RIB, justificatif d'identité, attestation d'inscription universitaire
4. Le premier versement arrive en général 2 mois après la demande

**Conseil** : n'attends pas d'avoir tout tes papiers pour commencer — la demande peut être en cours.`,
  },

  {
    title: "Ouvrir un compte bancaire étudiant",
    category: "banque",
    isPinned: true,
    content: `Avoir un compte bancaire français est indispensable pour recevoir la CAF, payer ton loyer et tes charges.

**Banques recommandées pour les étudiants ultramarins :**
- BNP Paribas : offre étudiante avec carte Visa gratuite
- La Banque Postale : accepte souvent sans justificatif de revenus
- Société Générale : package étudiant complet
- Revolut/Lydia : compte en ligne instantané (en attendant un compte physique)

**Documents nécessaires :**
- Passeport ou carte d'identité
- Justificatif de domicile (ou attestation d'hébergement)
- Attestation d'inscription universitaire
- Numéro de sécurité sociale (si tu l'as déjà)

**Conseil** : Revolut permet d'avoir un IBAN français immédiatement — très utile en attendant ton compte traditionnel.`,
  },

  {
    title: "S'inscrire à la Sécurité Sociale étudiante",
    category: "sante",
    isPinned: true,
    content: `À ton arrivée en France, tu bénéficies de la Sécurité Sociale étudiante (rattachée à l'URSSAF).

**À faire dès la première semaine :**
1. Crée ton compte sur ameli.fr
2. Rattache-toi au régime étudiant via ton université
3. Demande ta carte Vitale (délai : 2-3 mois)
4. En attendant, demande une attestation de droits sur ameli.fr

**Mutuelles :** Pour compléter la SS, souscris à une mutuelle étudiante. La LMDE et EM Student sont spécialisées étudiants.

**Attention :** Certains médecins n'acceptent pas les patients sans carte Vitale physique. Garde toujours ton attestation de droits imprimée.`,
  },

  {
    title: "Trouver un logement étudiant",
    category: "logement",
    isPinned: false,
    content: `Trouver un logement est souvent la première difficulté. Voici les options et les pièges à éviter.

**Options recommandées :**
- CROUS : résidences universitaires à prix réduit (de 200€ à 400€/mois). Candidature sur trouvermonmaster.gouv.fr
- Foyers de jeunes travailleurs : open aux étudiants, services inclus
- Colocations : plus abordables que les studios (150€-400€/mois selon la ville)
- Particuliers : leboncoin.fr, seloger.com, pap.fr

**Documents pour le dossier locataire :**
- CNI ou passeport
- 3 derniers bulletins de salaire ou attestation de bourse
- Relevé de compte bancaire
- Garant (parents ou VISALE : garantie gratuite via Action Logement)

**VISALE (indispensable) :** Si tu n'as pas de garant en France, demande la garantie VISALE sur visale.fr — gratuite, elle remplace un garant physique.`,
  },

  {
    title: "Obtenir la carte de transport Navigo / Pass Réseau",
    category: "transport",
    isPinned: false,
    content: `Pour te déplacer en Île-de-France ou dans d'autres grandes villes, le pass mensuel est indispensable.

**Île-de-France (Navigo) :**
- Navigo Mois : forfait mensuel zones 1-5 (environ 86€/mois)
- Navigo Semaine : pratique si tu viens juste d'arriver
- Navigo Annuel : le moins cher si tu restes toute l'année (~930€/an)
- Réduit étudiant : disponible sous conditions de ressources

**Pour obtenir le Navigo :**
1. Va sur une agence SNCF ou en point de vente Navigo
2. Apporte une photo d'identité + justificatif de domicile
3. La carte est remise immédiatement

**Lyon, Bordeaux, Toulouse, Marseille :** chaque ville a son propre abonnement mensuel à tarif réduit étudiant — renseigne-toi sur le site de la métropole.`,
  },

  {
    title: "S'inscrire au CROUS pour une bourse",
    category: "crous",
    isPinned: true,
    content: `Les bourses sur critères sociaux (BCS) peuvent couvrir une partie de tes études. La demande se fait avant la rentrée mais tu peux aussi la faire après.

**Montants 2024-2025 :**
- Échelon 0bis : 1 094€/an
- Échelon 1 : 1 954€/an
- Échelon 7 (max) : 6 335€/an

**Conditions :**
- Être inscrit dans un établissement d'enseignement supérieur en France
- Avoir moins de 35 ans
- Revenus du foyer fiscal en dessous d'un plafond

**Démarches :**
1. Va sur messervices.etudiant.gouv.fr → DSE (Dossier Social Étudiant)
2. Crée un dossier avec les avis d'imposition de tes parents
3. Indique ton établissement et ta filière
4. Délai de réponse : 2-4 semaines

**Important :** Même si tu penses ne pas y avoir droit, fais la demande — beaucoup d'étudiants ultramarins y ont accès.`,
  },
];

const TIPS = [
  {
    title: "Utilise VISALE, c'est gratuit et ça change tout",
    type: "tip",
    content:
      "Quand j'ai cherché mon appart, aucun propriétaire ne voulait de moi sans garant physique en France. La garantie VISALE (Action Logement) m'a permis de décrocher mon appartement. Gratuit, rapide, et accepté par la plupart des agences.",
  },
  {
    title: "Mon arrivée à Paris depuis la Martinique",
    type: "testimonial",
    content:
      "Je suis arrivée en septembre sans connaître personne. La première semaine a été difficile — j'étais hébergée en hôtel car mon logement CROUS n'était pas prêt. Ce que j'aurais voulu savoir : prévoir au moins 1500€ de trésorerie pour la première semaine, avoir tous ses documents scannés en avance, et rejoindre les groupes Facebook d'étudiants antillais dans ta ville dès avant l'arrivée.",
  },
];

async function main() {
  console.log("Seeding database...");

  // 1. Créer l'admin
  const adminHash = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@akademdomtom.fr" },
    update: {},
    create: {
      email: "admin@akademdomtom.fr",
      username: "admin_akadem",
      passwordHash: adminHash,
      originTerritory: "Nouvelle-Calédonie",
      isAdmin: true,
      isVerified: true,
    },
  });
  console.log("Admin créé :", admin.username);

  // 2. Supprimer les anciens guides (seed)
  await prisma.post.deleteMany({ where: { authorId: admin.id } });

  // 3. Créer les guides
  for (const guide of GUIDES) {
    await prisma.post.create({
      data: { ...guide, authorId: admin.id },
    });
  }
  console.log(`${GUIDES.length} guides créés`);

  // 4. Créer des tips approuvés
  await prisma.tip.deleteMany({ where: { authorId: admin.id } });
  for (const tip of TIPS) {
    await prisma.tip.create({
      data: { ...tip, authorId: admin.id, isApproved: true },
    });
  }
  console.log(`${TIPS.length} tips créés`);

  console.log("Seed terminé !");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
