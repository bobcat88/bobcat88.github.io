#!/usr/bin/env bun
// render.js — CV Factory render engine (Project Phoenix).
// Reads library/ content → injects into an A4 HTML template → optional print-to-PDF.
//
// Usage:
//   bun factory/render.js --variant ats                       # generic ATS CV
//   bun factory/render.js --variant premium                   # narrative CV
//   bun factory/render.js --variant ats --offer application/thales/responsable-projet-delivery-cm-2026-04-28/offer.md --pdf
//   bun factory/render.js --variant ats --pdf                 # also export PDF (needs playwright)
//

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dir, "..");
const args = parseArgs(Bun.argv.slice(2));

const profile = JSON.parse(read("library/profile.json"));
const experience = JSON.parse(read("library/experience.json"));
const skills = parseSkills();

const offerText = args.offer ? read(args.offer).toLowerCase() : "";
// Raw (case-preserving) offer content — referent names/contacts live ONLY here,
// in the PRIVATE offer.md, never in the public library/. Generic runs => no referents.
const offerRaw = args.offer ? read(args.offer) : "";
const referents = parseReferents(offerRaw);
const offerMeta = args.offer ? parseFrontmatter(offerRaw) : {};
const offerProfile = buildOfferProfile(offerRaw, offerMeta);

// --- assemble model -------------------------------------------------------
const model = {
  profile,
  variant: args.variant || "ats",
  tagline:
    args.variant === "premium"
      ? profile.positioning.tagline
      : profile.identity.headlineFr,
};

const html = renderTemplate(model);

// --- write ----------------------------------------------------------------
const outDir = args.offer
  ? dirname(join(ROOT, args.offer))
  : join(ROOT, "cv", model.variant);

mkdirSync(outDir, { recursive: true });

// Tailored runs write straight to the final deliverable name (J.PROUST_<Slug>_<TYPE>_DD.MM.YY.*) —
// no intermediate cv-ats.html/lettre.html left behind to duplicate after a manual rename.
const fileDateStr = filenameDate(offerMeta.captured || offerMeta.posted);
function finalName(type, ext) {
  return `J.PROUST_${offerProfile.fileSlug || "Candidature"}_${type}_${fileDateStr}.${ext}`;
}

const htmlPath = args.offer
  ? join(outDir, finalName(model.variant === "premium" ? "CV" : "ATS", "html"))
  : join(outDir, `cv-${model.variant}.html`);
writeFileSync(htmlPath, html);
console.log("✓ HTML (CV) →", htmlPath);

// Write dynamic data.js and base.css locally so output is self-contained
const css = read("factory/designs/base.css");
writeFileSync(join(outDir, "base.css"), css);

const dataJs = `window.CV_DATA = ${JSON.stringify(compileCvData(profile), null, 2)};`;
writeFileSync(join(outDir, "data.js"), dataJs);
console.log("✓ Data →", join(outDir, "data.js"));

// Self-contained portrait: copy the webp next to the output so the relative path always resolves.
const photoSrc = join(ROOT, "johan-proust.webp");
if (existsSync(photoSrc)) copyFileSync(photoSrc, join(outDir, "johan-proust.webp"));

// Keep the design-preview data snapshot in sync with the library (generic runs only).
if (!args.offer) writeFileSync(join(ROOT, "factory/designs/data.js"), dataJs);

if (args.pdf) await toPdf(htmlPath);

// --- generate offer letter & pitch if applicable --------------------------
if (args.offer) {
  const offerContent = read(args.offer);
  const dateStr = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  const hookRaw = parseSection(offerContent, "Angle lettre / pitch") || "Je souhaite proposer ma candidature pour ce rôle.";
  const hook = offerProfile.letterHook || cleanGeneratedText(hookRaw.split(/mission\s+18/i)[0].split("Mission")[0].split("Objet")[0]);

  const fitRaw = parseSection(offerContent, "Fit analysis") || "";
  const fit = offerProfile.letterFit || (fitRaw || args.offer
    ? "Chez Arkéa, Thales et EPSI, j'ai déjà cadré des besoins, structuré des cahiers des charges, animé les échanges métier et MOE, préparé des recettes et rendu compte à la gouvernance."
    : "");

  const valRaw = parseSection(offerContent, "Angle de positionnement") || "";
  const value = offerProfile.letterValue || (valRaw || args.offer
    ? "J'apporte une posture MOA concrète : clarifier le besoin, traduire les attentes en livrables actionnables, sécuriser la recette, documenter le déploiement et piloter les arbitrages jusqu'à la phase de garantie."
    : "");

  // Letter
  const lettreTpl = read("factory/templates/lettre.html");
  const lettreHtml = renderLetter(lettreTpl, offerMeta, hook, fit, value, profile, dateStr);
  const lettrePath = join(outDir, finalName("LM", "html"));
  writeFileSync(lettrePath, lettreHtml);
  console.log("✓ HTML (Letter) →", lettrePath);
  if (args.pdf) await toPdf(lettrePath);

  // Pitch
  const pitchTpl = read("factory/templates/pitch.html");
  const pitchHtml = pitchTpl
    .replaceAll("../designs/base.css", "base.css")
    .replaceAll("../designs/data.js", "data.js");
  const pitchPath = join(outDir, finalName("PITCH", "html"));
  writeFileSync(pitchPath, pitchHtml);
  console.log("✓ HTML (Pitch) →", pitchPath);
  if (args.pdf) await toPdf(pitchPath);
}

// --- helpers --------------------------------------------------------------
function renderTemplate(m) {
  const tplFile = m.variant === "premium"
    ? (args.offer ? "factory/designs/cv-b.html" : "factory/designs/cv-a.html")
    : `factory/designs/cv-${m.variant}.html`;
  let htmlContent = read(tplFile);
  if (m.variant === "premium" && !args.offer) {
    htmlContent = htmlContent.replace("<title>Johan Proust — CV (A · Header Band)</title>", "<title>Johan Proust — Dossier de Compétences</title>");
  }
  // Published outputs are standalone (no design gallery): drop the gallery link, keep Print.
  htmlContent = htmlContent.replace(/<a href="gallery2\.html"[^>]*>[\s\S]*?<\/a>/, "");
  return htmlContent;
}

function renderLetter(tpl, meta, hook, fit, value, profile, dateStr) {
  const availability = args.offer
    ? "en Freelance, CDI ou CDD selon les possibilités"
    : profile.availability;
  return tpl
    .replaceAll("../designs/base.css", "base.css")
    .replaceAll("../designs/data.js", "data.js")
    .replaceAll("{{OFFER_RECIPIENT}}", meta.recipient || "Madame, Monsieur, le Responsable du Recrutement")
    .replaceAll("{{OFFER_COMPANY}}", meta.company || "votre organisation")
    .replaceAll("{{OFFER_TITLE}}", offerProfile.title || meta.title || "ce poste")
    .replaceAll("{{DATE}}", dateStr)
    .replaceAll("{{AVAILABILITY}}", availability)
    .replace(/\{\{OFFER_HOOK[^}]*\}\}/, cleanGeneratedText(hook))
    .replace(/\{\{OFFER_FIT[^}]*\}\}/, cleanGeneratedText(fit))
    .replace(/\{\{OFFER_VALUE[^}]*\}\}/, cleanGeneratedText(value));
}

function parseFrontmatter(text) {
  const meta = {};
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (match) {
    const yaml = match[1];
    const lines = yaml.split("\n");
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        meta[k] = v;
      }
    }
  }
  return meta;
}

// Parse an optional `## Référents` section from the PRIVATE offer.md.
// Preferred line: `- Nom Prénom | Rôle | Entreprise | Contact`.
// Legacy line supported: `- Nom | Rôle · Entreprise | Ce qu'il atteste | Contact`.
// Returns [] when absent (generic/public CV runs never carry referents).
function parseReferents(raw) {
  if (!raw) return [];
  const sec = parseSection(raw, "Référents");
  if (!sec) return [];
  return sec.split("\n")
    .map(l => l.trim())
    .filter(l => /^[-*]\s+/.test(l))
    .map(l => l.replace(/^[-*]\s+/, "").split("|").map(s => s.trim()))
    .filter(p => p[0])
    .map(p => {
      const roleCompany = p[1] || "";
      const legacy = /·/.test(roleCompany);
      const [legacyRole, legacyCompany] = roleCompany.split("·").map(s => s.trim());
      return {
        name: p[0] || "",
        role: legacy ? legacyRole : roleCompany,
        company: legacy ? (legacyCompany || "") : (p[2] || ""),
        contact: legacy ? (p[3] || "") : (p[3] || "")
      };
    });
}

function buildOfferProfile(raw, meta) {
  if (!raw) return {};
  const title = normalizeOfferTitle(meta.title || "");
  const isThalesConfigDelivery = /thales/i.test(raw)
    && /configuration management/i.test(raw)
    && /responsable projet/i.test(raw);
  const isArkeaMoa = /cr[ée]dit mutuel ark[ée]a/i.test(raw) && /chef de projet moa/i.test(raw);
  const isEquansCnnMco = /cnn mco/i.test(raw) && /offres et chiffrage/i.test(raw);
  if (isEquansCnnMco) {
    return {
      title: "Responsable Projet Offres et Chiffrages",
      fileSlug: "RespProjetOffresChiffrages",
      summary: "Responsable pilotage d'offres et chiffrage, habitué aux environnements industriels complexes à forts enjeux financiers. Chez Thales ISR, j'ai piloté un portefeuille de plus de 50 offres Défense jusqu'à 1Md€, du chiffrage RC/NRC à la remise client, en fédérant achats, ingénierie et finance sans lien hiérarchique direct. Je transpose cette rigueur de chiffrage et de coordination transverse au MCO naval.",
      brand: "Offres chiffrées avec rigueur, contributeurs fédérés, décisions arbitrées jusqu'à la remise.",
      letterHook: "Le poste de Responsable Projet Offres et Chiffrages chez CNN MCO correspond directement à ce que j'ai déjà piloté chez Thales : construire des offres robustes et compétitives en fédérant des contributeurs multi-métiers sans lien hiérarchique, du chiffrage à la remise client.",
      letterFit: "Chez Thales ISR, j'ai soutenu 4 Bid Managers sur un portefeuille de plus de 50 offres Défense (quelques centaines de k€ à plus d'1Md€) : structures de coûts RC/NRC, animation des revues de risques et opportunités (ROR) avec experts techniques, achats et finance, industrialisation des outils de chiffrage (-92% de temps de traitement des risques), et RETEX entre offres remises et exécution des projets, jusqu'au rapport CODIR.",
      letterValue: "J'apporte une capacité directement mobilisable : chiffrer en propre, fédérer des contributeurs multiples sans autorité hiérarchique, consolider des hypothèses techniques, économiques et contractuelles, sécuriser la cohérence de l'offre avant remise et capitaliser le RETEX pour améliorer le taux de transformation.",
      experienceIds: ["thales", "shuhan", "arkea", "epsi"],
      passionProjectIds: ["datahealth", "personal-scripts-automation"],
      metrics: [
        [">1 Md€", "Portefeuille d'offres piloté", "Thales ISR"],
        ["+50 offres", "Chiffrage RC/NRC, Fixed Price/Cost-Plus", "Thales ISR"],
        ["3h -> 15 min", "Industrialisation gestion des risques (ROR)", "Thales ISR"],
        ["5% -> 20% (~15M$)", "Appels d'offres internationaux (SAP Ariba)", "Sichuan Shuhan Plastics"]
      ],
      skillGroups: [
        ["Offres & chiffrage", ["Chiffrage RC/NRC", "Fixed Price / Cost-Plus", "Structures de coûts", "Hypothèses techniques/économiques"]],
        ["Pilotage des risques", ["Revues risques & opportunités (ROR)", "Provisionnement", "Points de vigilance", "Arbitrages"]],
        ["Coordination transverse", ["Fédération sans lien hiérarchique", "Achats / Finance / Ingénierie / HSE", "Validation formelle des offres", "Amélioration continue"]],
        ["Outillage", ["QDV (chiffrage expert)", "Excel / VBA", "MS Project", "RETEX / post-mortem"]],
        ["Industriel & international", ["Environnements industriels complexes", "Défense multi-milieux", "Appels d'offres SAP Ariba", "Anglais C1-C2"]]
      ],
      experienceOverrides: {
        thales: {
          role: "PMO & Support Bid Management | Offres, chiffrage, risques",
          context: "Thales ISR Brest : portefeuille Défense multi-milieux, chiffrage RC/NRC, risques et opportunités, coordination transverse jusqu'à la remise client.",
          stack: ["Chiffrage QDV", "RC / NRC", "ROR", "Fixed Price / Cost-Plus", "RETEX CODIR"],
          bullets: [
            "Support à 4 Bid Managers sur un portefeuille de +50 offres Défense, budgets jusqu'à >1Md€, chiffrage RC/NRC et optimisation de la rentabilité.",
            "Animation des revues de risques et opportunités (ROR) avec experts techniques, achats et finance ; industrialisation Excel/VBA : 3h -> 15 min par offre (-92%).",
            "RETEX stratégique mandaté par la GBU ISR sur une offre perdue, rapport de recommandations livré au CODIR DMS France pour améliorer le Win Rate."
          ]
        },
        shuhan: {
          bullets: [
            "Réponses aux appels d'offres internationaux (SAP Ariba), négociation de contrats, part export du CA portée de 5% à 20% (~15M$ en 2019)."
          ]
        }
      }
    };
  }
  const isArkeaDataIa = /cr[ée]dit mutuel ark[ée]a/i.test(raw)
    && /consultant interne/i.test(raw)
    && /strat[ée]gie data\s*&\s*ia/i.test(raw);
  if (isThalesConfigDelivery) {
    return {
      title: "Responsable Projet & Delivery - Configuration Management",
      fileSlug: "RespProjetDeliveryCM",
      summary: "PMO et responsable delivery habitué aux environnements Défense, multi-sites et multi-acteurs. Déjà intervenu chez Thales ISR Brest, je sais remettre sous contrôle un système complexe : clarifier les rôles, installer les rituels, fiabiliser les référentiels, structurer l'outillage et rendre les arbitrages lisibles jusqu'aux instances.",
      brand: "Task force structurée, configuration fiabilisée, acteurs alignés.",
      letterHook: "Je connais déjà le site de Brest et l'univers Défense multi-milieux de Thales. Mon métier consiste à transformer des environnements complexes multi-partenaires en systèmes pilotables, exactement l'enjeu de la task force configuration du programme MMCM.",
      letterFit: "Chez Thales ISR, j'ai travaillé sur un portefeuille multi-offres à forts enjeux, avec standardisation, gestion des risques, reporting CODIR, configuration d'offres dans QDV et conduite du changement EIM/GED en contexte Besoin de Savoir. J'apporte aussi une pratique de l'outillage PMO et des référentiels chez Arkéa, ainsi qu'une expérience internationale utile dans un environnement multi-pays.",
      letterValue: "Je ne me positionne pas comme Configuration Manager PLM pur, mais comme responsable delivery capable de remettre sous contrôle un dispositif complexe : clarifier les responsabilités, rendre les écarts visibles, organiser les rituels, structurer l'outillage et faire adopter les bonnes pratiques.",
      experienceIds: ["thales", "arkea", "shuhan", "epsi"],
      passionProjectIds: ["datahealth", "personal-scripts-automation"],
      metrics: [
        [">1 Md€", "Portefeuille Défense multi-offres", "Thales ISR"],
        ["3h -> 15 min", "Industrialisation gestion des risques", "Thales ISR"],
        ["Besoin de Savoir", "EIM/GED, droits et conduite du changement", "Thales ISR"],
        ["7 ans", "International, anglais, environnements multi-pays", "Asie | UK-ready"]
      ],
      skillGroups: [
        ["Delivery & configuration", ["Gestion de configuration", "Task force", "Rituels multi-acteurs", "Traçabilité / référentiels"]],
        ["Défense & gouvernance", ["Environnement Défense", "Besoin de Savoir", "Reporting CODIR", "Gestion des risques"]],
        ["Pilotage programme", ["Management transversal", "Planning / jalons", "Arbitrages", "Conduite du changement"]],
        ["Outillage", ["QDV / configurations d'offres", "EIM / GED", "Excel / VBA", "Google Workspace"]],
        ["International", ["Anglais C1-C2", "Fournisseurs multi-pays", "Management interculturel", "Pragmatisme terrain"]]
      ],
      experienceOverrides: {
        thales: {
          role: "PMO & Support Bid Management | Configuration, risques, outillage",
          context: "Thales ISR Brest : portefeuille Défense multi-milieux, configurations d'offres, référentiels, risques, multi-sites et reporting CODIR.",
          stack: ["Thales ISR", "Configuration d'offres QDV", "EIM / GED", "Besoin de Savoir", "Risques ROR", "CODIR"],
          bullets: [
            "Support à 4 Bid Managers sur +50 offres Défense, budgets jusqu'à >1Md€, avec consolidation d'informations complexes pour décision.",
            "Industrialisation Excel/VBA de la gestion des risques : traitement réduit de 3h à 15 min par offre, méthode standardisée et réutilisable.",
            "Rôle Key User / administrateur EIM-GED en contexte Besoin de Savoir : droits, arborescences, adoption outillée et conduite du changement."
          ]
        },
        arkea: {
          context: "Structuration d'un cadre commun de pilotage : référentiels, KPI, jalons, comités, outillage et adoption par les équipes métier.",
          bullets: [
            "Clarification des rôles, jalons, KPI et arbitrages pour rendre les initiatives pilotables par les métiers et la gouvernance.",
            "Application PMO Google Workspace : Kanban, alertes, jalons, comptes rendus et traçabilité des décisions.",
            "POC d'automatisation de comptes rendus et logique de standardisation pour réduire la charge récurrente et fiabiliser le suivi."
          ]
        },
        shuhan: {
          role: "Responsable développement international | Environnement industriel",
          context: "Industrie et fournisseurs internationaux : coordination commerciale, appels d'offres, anglais quotidien et management multiculturel.",
          bullets: [
            "Pilotage export et appels d'offres SAP Ariba dans un contexte industriel international, poste exercé 100% en anglais.",
            "Management d'une équipe multiculturelle de 5 personnes et coordination d'interlocuteurs multi-pays.",
            "Part export portée de 5% à 20% du chiffre d'affaires, soit environ 15M$ en 2019."
          ]
        },
        epsi: {
          context: "Delivery logiciel sécurisé : rôle Product Owner et Coach Agile sur deux équipes avec critères d'acceptation et tests.",
          bullets: [
            "Traduction du besoin en User Stories, critères d'acceptation et tests Postman pour sécuriser la livraison.",
            "Seul Product Owner ayant livré ses 2 équipes sur 5, MVP livré en moins de 2 mois, félicitations du jury Capgemini / Orange Cyber."
          ]
        }
      }
    };
  }
  if (isArkeaDataIa) {
    return {
      title: "Consultant interne - Stratégie Data & IA",
      fileSlug: "ConsultantStrategieDataIA",
      summary: "Consultant interne orienté stratégie Data & IA, PMO transverse et gouvernance. Déjà mobilisé chez Crédit Mutuel Arkéa sur le cadrage d'initiatives stratégiques, l'animation de comités et l'industrialisation d'outils de pilotage, je structure des sujets flous en cas d'usage priorisés, arbitrables et déployables, avec une posture hybride métier, data, IT et décision.",
      brand: "Feuille de route IA structurée, gouvernance éclairée, cas d'usage rendus pilotables.",
      letterHook: "Ce poste de Consultant interne en Stratégie Data & IA correspond précisément à l'ouverture que j'attendais chez Crédit Mutuel Arkéa. Il combine mon expérience de PMO transverse, de cadrage stratégique et de structuration de dispositifs de pilotage avec le terrain Data & IA sur lequel je veux concentrer mon évolution.",
      letterFit: "Chez Arkéa, je travaille déjà à l'interface des métiers, de la data, des processus et de la gouvernance : qualification d'initiatives, KPI, jalons, comités, application PMO sur Apps Script et POC de génération automatique de comptes rendus. Chez Thales, j'ai également piloté des sujets complexes à fort niveau d'exigence, avec reporting CODIR et industrialisation de méthodes.",
      letterValue: "J'apporte une capacité directement mobilisable : clarifier les besoins, préparer les arbitrages, structurer la feuille de route, fédérer les relais et transformer les cas d'usage IA en projets cadrés, suivis et compréhensibles par les instances.",
      experienceIds: ["arkea", "thales", "neosoft", "epsi"],
      passionProjectIds: ["career-intelligence-system", "ai-knowledge-graph"],
      metrics: [
        ["440-2760 h/an", "Gain capacitaire PMO et automatisation", "Crédit Mutuel Arkéa"],
        ["IA + gouvernance", "POC comptes rendus, KPI, jalons, comités", "Arkéa | Plan stratégique"],
        [">1 Md€", "Portefeuille complexe, reporting CODIR", "Thales ISR"],
        ["2 équipes livrées", "Cadrage, User Stories, critères d'acceptation", "EPSI | CRM sécurisé"]
      ],
      skillGroups: [
        ["Data & IA", ["Gouvernance Data & IA", "Feuille de route IA", "Cas d'usage IA", "IA de confiance"]],
        ["Gouvernance", ["CODIR / COPIL", "Aide à la décision", "KPI / jalons", "Reporting exécutif"]],
        ["Cadrage", ["Pré-cadrage", "Recueil du besoin", "Scénarios / préconisations", "Conduite du changement"]],
        ["Tech & automatisation", ["Google Workspace", "Apps Script", "LLM / agents IA", "Analyse de données"]],
        ["Posture", ["Synthèse", "Communication", "Fédération d'acteurs", "Environnement à structurer"]]
      ],
      experienceOverrides: {
        arkea: {
          role: "PMO Stratégique / Business Analyst Data & Gouvernance",
          context: "Plan stratégique Banque de Détail : structuration d'un cadre commun de pilotage, alignant métiers, data, expérience client et processus.",
          stack: ["PMO stratégique", "Data / KPI", "Apps Script", "Google Workspace", "POC IA", "Gouvernance"],
          bullets: [
            "Cadrage et qualification d'initiatives transverses : objectifs, valeur, jalons, KPI, arbitrages et information des instances.",
            "Application PMO sur mesure dans Google Workspace : Kanban, KPI, jalons, alertes et socle commun de pilotage pour les équipes métier.",
            "POC de génération automatique de comptes rendus et logique d'industrialisation : gain capacitaire estimé 440-2760 h/an, traçabilité renforcée."
          ]
        },
        thales: {
          context: "Environnement Défense à forte intensité de gouvernance : portefeuille multi-offres, risques, arbitrages et reporting CODIR.",
          bullets: [
            "Pilotage PMO d'un portefeuille de +50 offres, budgets jusqu'à >1Md€, avec consolidation d'informations complexes pour décision.",
            "Industrialisation Excel/VBA de la gestion des risques : temps de traitement réduit de 3h à 15 min par offre, méthodes standardisées.",
            "RETEX stratégique mandaté par la GBU ISR, rapport CODIR et recommandations actionnables pour améliorer le pilotage."
          ]
        },
        neosoft: {
          role: "Product Owner | Pré-cadrage MVP application interne",
          context: "Pré-cadrage d'un besoin métier flou avant industrialisation, avec facilitation métier, design et développement.",
          bullets: [
            "Ateliers Design Thinking, formalisation du besoin, prototype Figma et backlog Kanban pour rendre le cas d'usage décidables.",
            "POC validé, prototype livré et roadmap MVP exploitable sans recadrage lourd par l'équipe de réalisation."
          ]
        },
        epsi: {
          context: "Livraison d'un CRM sécurisé, rôle de Product Owner et Coach Agile sur deux équipes en environnement contraint.",
          bullets: [
            "Traduction du besoin en User Stories, critères d'acceptation, tests Postman et coordination entre équipes techniques.",
            "Seul Product Owner ayant livré ses 2 équipes sur 5, MVP livré en moins de 2 mois, félicitations du jury Capgemini / Orange Cyber."
          ]
        }
      }
    };
  }
  if (isArkeaMoa) {
    return {
      title: "Chef de projet MOA",
      fileSlug: "ChefProjetMOA",
      summary: "Chef de projet MOA orienté cadrage métier, cahier des charges, recette, homologation et déploiement. Déjà mobilisé chez Crédit Mutuel Arkéa sur le pilotage d'initiatives stratégiques, je fais le lien entre métiers, MOE et gouvernance avec une forte appétence pour les données, les chiffres et les environnements SI.",
      brand: "MOA opérationnel, besoin clarifié, solution recettée, gouvernance informée.",
      letterHook: "Je travaille déjà au Crédit Mutuel Arkéa et je connais ses référentiels, ses modes de gouvernance et son niveau d'exigence. Le poste de Chef de projet MOA correspond à mon terrain naturel : faire émerger le besoin, le traduire en cahier des charges, recetter la solution et accompagner son déploiement auprès des utilisateurs.",
      letterFit: "Chez Arkéa, EPSI et NeoSoft, j'ai déjà mené des travaux proches de cette mission : cadrage d'initiatives stratégiques, formalisation du besoin, critères d'acceptation, recette et coordination entre métiers, équipes techniques et gouvernance.",
      letterValue: "J'apporte une posture MOA concrète : clarifier les arbitrages, rendre les livrables actionnables, sécuriser la phase de recette, documenter le déploiement et garder les parties prenantes alignées jusqu'à la phase de garantie.",
      experienceIds: ["arkea", "epsi", "neosoft", "thales"],
      metrics: [
        ["440-2760 h/an", "Gain capacitaire PMO", "Crédit Mutuel Arkéa"],
        ["2 équipes livrées", "Recette et critères d'acceptation", "EPSI | CRM sécurisé"],
        ["3h -> 15 min", "Industrialisation pilotage risques", "Thales ISR"],
        ["POC + roadmap", "Cadrage besoin et MVP", "NeoSoft"]
      ]
    };
  }
  return { title, fileSlug: slugifyTitle(title) };
}

// Fallback PascalCase slug for offers without a hand-tuned profile (e.g. "Chef de projet MOA" -> "ChefProjetMOA").
function slugifyTitle(title) {
  const stop = new Set(["de", "du", "des", "le", "la", "les", "et", "en", "à", "au", "aux", "un", "une", "the", "of", "and", "for"]);
  return String(title || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .filter(w => !stop.has(w.toLowerCase()))
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join("") || "Candidature";
}

function normalizeOfferTitle(title) {
  return cleanGeneratedText(title)
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanGeneratedText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\n?---+\n?/g, " ")
    .replace(/\s+--+\s+/g, ", ")
    .replace(/\s+—\s+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function cvText(text) {
  return cleanGeneratedText(text)
    .replace(/[–—]/g, "-")
    .replace(/→/g, "->")
    .replace(/\s+\/\s+/g, " / ");
}

function parseSection(text, title) {
  const rx = new RegExp(`(?:##|###)\\s+${title}[\\s\\S]*?\\r?\\n([\\s\\S]*?)(?:\\r?\\n(?:##|###)|$)`, "i");
  const m = text.match(rx);
  return m ? m[1].trim() : "";
}

function parseSkills() {
  const content = read("library/skills.md");
  const sections = content.split(/^##\s+/m).slice(1);
  const groups = [];
  const flat = [];
  for (const sect of sections) {
    const lines = sect.split("\n");
    const titleLine = lines[0].trim();
    if (titleLine.startsWith("Tech stack reference")) continue;
    const groupName = titleLine.replace(/^\d+\.\s+/, "");
    const groupSkills = [];
    for (const line of lines.slice(1)) {
      if (line.trim().startsWith("|") && !line.includes("---") && !line.includes("Skill |")) {
        const parts = line.split("|");
        if (parts.length >= 3) {
          const skillName = parts[1].trim();
          groupSkills.push(skillName);
          flat.push(skillName);
        }
      }
    }
    if (groupSkills.length > 0) {
      groups.push([groupName, groupSkills.slice(0, 4)]);
    }
  }
  return { groups, flat };
}

function selectTailoredExperiences(offer, exps) {
  if (offerProfile.experienceIds) {
    return scoreAndSelect(exps, offer, {
      limit: 4,
      getText: experienceText,
      getSelection: item => item.selection || {},
      preferredIds: offerProfile.experienceIds,
      debugLabel: "experiences"
    });
  }

  if (!offer) {
    const genericIds = ["arkea", "thales", "neosoft", "epsi", "shuhan", "diadom"];
    return exps.filter(x => genericIds.includes(x.id));
  }

  return scoreAndSelect(exps, offer, {
    limit: 4,
    getText: experienceText,
    getSelection: item => item.selection || {},
    debugLabel: "experiences"
  });
}

function selectPassionProjects(offer, projects) {
  if (!projects?.length) return [];

  if (!args.offer) {
    const genericIds = ["career-intelligence-system", "borginvestor-trading-algo"];
    const rank = new Map(genericIds.map((id, i) => [id, i]));
    return projects
      .filter(project => rank.has(project.id))
      .sort((a, b) => rank.get(a.id) - rank.get(b.id))
      .slice(0, 2)
      .map(formatPassionProject);
  }

  if (offerProfile.passionProjectIds) {
    return scoreAndSelect(projects, offer, {
      limit: 2,
      getText: passionProjectText,
      getSelection: item => item.selection || {},
      preferredIds: offerProfile.passionProjectIds,
      debugLabel: "passion-projects"
    }).map(formatPassionProject);
  }

  return scoreAndSelect(projects, offer, {
    limit: 2,
    getText: passionProjectText,
    getSelection: item => item.selection || {},
    debugLabel: "passion-projects"
  }).map(formatPassionProject);
}

function scoreAndSelect(items, offer, options) {
  const normalizedOffer = normalizeForScore(offer);
  const offerTokens = tokenizeForScore(normalizedOffer);
  const preferredRank = new Map((options.preferredIds || []).map((id, i) => [id, i]));
  const preferredSet = new Set(options.preferredIds || []);
  const hasPreference = preferredSet.size > 0;
  const scored = items.map(item => {
    const result = scoreItem(item, normalizedOffer, offerTokens, options);
    if (hasPreference && preferredSet.has(item.id)) {
      result.score += 45 - (preferredRank.get(item.id) || 0) * 4;
      result.preferred = true;
    }
    return result;
  });

  debugSelection(options.debugLabel || "selection", scored);

  const relevant = scored.filter(result => result.relevance > 0 || result.preferred);
  const pool = relevant.length >= options.limit ? relevant : scored;
  return pool
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit)
    .map(result => result.item);
}

function scoreItem(item, normalizedOffer, offerTokens, options) {
  const selection = options.getSelection(item);
  const stack = item.stack || item.tags || [];
  const text = normalizeForScore([
    options.getText(item),
    ...(selection.themes || []),
    ...(selection.keywords || []),
    ...stack
  ].join(" "));
  const itemTokens = tokenizeForScore(text);

  const proof = (selection.proofWeight || 0) * 4
    + (selection.scopeWeight || 0) * 3
    + Math.min(selection.durationMonths || 0, 24) * 0.35
    + (selection.recency || 0) * 2
    + (selection.proofType === "flagship" ? 12 : 0)
    + (selection.proofType === "solid" ? 6 : 0);

  let relevance = 0;
  for (const keyword of selection.keywords || []) {
    const normalized = normalizeForScore(keyword);
    if (normalized && normalizedOffer.includes(normalized)) relevance += 18;
  }
  for (const theme of selection.themes || []) {
    const normalized = normalizeForScore(theme);
    if (normalized && normalizedOffer.includes(normalized)) relevance += 12;
  }
  for (const item of stack) {
    const normalized = normalizeForScore(item);
    if (normalized && normalizedOffer.includes(normalized)) relevance += 10;
  }
  for (const token of itemTokens) {
    if (offerTokens.has(token)) relevance += 2;
  }

  return {
    item,
    proof,
    relevance,
    score: relevance * 4 + proof,
    preferred: false
  };
}

function tokenizeForScore(text) {
  const stop = new Set([
    "avec", "pour", "dans", "des", "les", "une", "aux", "sur", "par", "est", "sont",
    "plus", "moins", "entre", "chez", "dont", "leur", "leurs", "vous", "nous", "votre",
    "the", "and", "for", "with", "from", "that", "this", "are", "will", "your",
    "chef", "projet", "project", "manager", "management", "responsable", "mission",
    "role", "poste", "experience", "profil", "equipe", "equipes"
  ]);
  return new Set(
    normalizeForScore(text)
      .split(/[^a-z0-9]+/)
      .filter(token => token.length > 3 && !stop.has(token))
  );
}

function debugSelection(label, scored) {
  if (!process.env.CV_DEBUG_SELECTION) return;
  console.log(`\n[selection:${label}]`);
  for (const result of [...scored].sort((a, b) => b.score - a.score)) {
    console.log([
      result.item.id,
      `score=${result.score.toFixed(1)}`,
      `rel=${result.relevance.toFixed(1)}`,
      `proof=${result.proof.toFixed(1)}`,
      result.preferred ? "preferred" : ""
    ].filter(Boolean).join(" | "));
  }
}

function experienceText(exp) {
  return [
    exp.role,
    exp.company,
    exp.context,
    ...(exp.bullets || []),
    ...(exp.stack || [])
  ].join(" ");
}

function passionProjectText(project) {
  return [
    project.name,
    project.labelFr,
    project.descriptionFr,
    project.descriptionEn,
    project.valueSignal,
    ...(project.tags || [])
  ].join(" ");
}

function normalizeForScore(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[€$]/g, " ")
    .replace(/&/g, " et ");
}

function formatPassionProject(project) {
  return {
    name: cvText(project.labelFr || project.name),
    proof: cvText(project.descriptionFr || project.descriptionEn),
    signal: cvText(project.valueSignal || ""),
    tags: (project.tags || []).slice(0, 4).map(cvText)
  };
}

function compileCvData(profile) {
  let filteredExp;
  if (args.offer) {
    filteredExp = selectTailoredExperiences(offerText, experience)
      .map(x => {
        const override = offerProfile.experienceOverrides?.[x.id] || {};
        return [
          cvText(override.role || x.role),
          cvText(override.company || x.company),
          cvText(override.period || x.period),
          cvText(override.location || x.location),
          (override.bullets || x.bullets).map(cvText),
          cvText(override.context || x.context || ""),
          (override.stack || x.stack || []).map(cvText)
        ];
      });
  } else if (model.variant === "premium") {
    // Generic Premium is a Dossier de Compétences: export all 9 experiences!
    filteredExp = experience
      .map(x => [x.role, x.company, x.period, x.location, x.bullets, x.context || "", x.stack || []].map((value, idx) => idx === 4 || idx === 6 ? value.map(cvText) : cvText(value)));
  } else {
    // Generic ATS is a single-page CV: export the tightest top 4 experiences.
    const genericExperienceIds = ["arkea", "thales", "neosoft", "epsi"];
    filteredExp = experience.filter(x => genericExperienceIds.includes(x.id))
      .map(x => [x.role, x.company, x.period, x.location, x.bullets, x.context || "", x.stack || []].map((value, idx) => idx === 4 || idx === 6 ? value.map(cvText) : cvText(value)));
  }

  return {
    name: cvText(profile.identity.fullName),
    photo: "johan-proust.webp",
    first: profile.identity.fullName.split(" ")[0],
    last: profile.identity.fullName.split(" ").slice(1).join(" "),
    monogram: profile.identity.fullName.split(" ").map(x => x[0]).join(""),
    title: cvText(offerProfile.title || profile.identity.titleAts.join(" · ")),
    brand: cvText(offerProfile.brand || profile.positioning.valueProposition),
    tagline: cvText(profile.positioning.tagline),
    contact: [
      ["Localisation", profile.identity.location, null],
      ["Téléphone", profile.contact.phone, null],
      ["Email", profile.contact.email, `mailto:${profile.contact.email}`],
      ["LinkedIn", "in/johan-proust", profile.contact.linkedin],
      ["Portfolio", "johanproust.me", profile.contact.portfolio]
    ],
    summary: cleanGeneratedText(offerProfile.summary || profile.summary.fr),
    metrics: (offerProfile.metrics || profile.headlineMetrics.map(x => [x.value, x.label, x.context]))
      .map(([value, label, context]) => [cleanGeneratedText(value), cleanGeneratedText(label), cleanGeneratedText(context)]),
    referents,
    experience: filteredExp,
    passionProjects: selectPassionProjects(offerText, profile.passionProjects || []),
    skillGroups: (offerProfile.skillGroups || skills.groups).map(([group, items]) => [cvText(group), items.map(cvText)]),
    skillsFlat: skills.flat.map(cvText),
    education: profile.education.map(x => [x.year, cvText(x.title), cvText(x.school)]),
    languages: profile.languages.map(x => [cvText(x.name), cvText(x.level)]),
    facts: [
      [`${profile.summary.experienceYears} ans`, "Expérience"],
      [`${profile.summary.internationalYears} ans`, "Asie · Expat"],
      ["FR · EN", "Bilingue Biz"],
      ["> 1 Md€", "Pilotés"]
    ]
  };
}

async function toPdf(htmlPath) {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto("file://" + htmlPath, { waitUntil: "networkidle" });
    const pdfPath = htmlPath.replace(/\.html$/, ".pdf");
    // preferCSSPageSize honours each design's @page rules (size + margins),
    // so multi-page CVs get clean top/bottom breathing room at page breaks.
    await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });
    await browser.close();
    console.log("✓ PDF  →", pdfPath);
  } catch (e) {
    console.error("PDF export failed:");
    console.error(String(e.message || e));
  }
}

// "2026-07-07" (or "captured 2026-07-07" from a "posted" field) -> "07.07.26"; falls back to today.
function filenameDate(raw) {
  const m = String(raw || "").match(/(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`) : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

function read(p) { return readFileSync(join(ROOT, p), "utf8"); }
function parseArgs(a) {
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith("--")) { const k = a[i].slice(2); const v = a[i + 1] && !a[i + 1].startsWith("--") ? a[++i] : true; o[k] = v; }
  }
  return o;
}
