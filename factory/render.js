#!/usr/bin/env bun
// render.js — CV Factory render engine (Project Phoenix).
// Reads library/ content → injects into an A4 HTML template → optional print-to-PDF.
//
// Usage:
//   bun factory/render.js --variant ats                       # generic ATS CV
//   bun factory/render.js --variant premium                   # narrative CV
//   bun factory/render.js --variant ats --offer application/thales/responsable-projet-delivery-cm-2026-04-28/offer.md --pdf
//   bun factory/render.js --variant ats --pdf                 # also export PDF (needs playwright)
//   bun factory/render.js --variant ats --lang en              # force English (default: fr, or offer.md `lang:` frontmatter)
//

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dir, "..");
const args = parseArgs(Bun.argv.slice(2));

// --- i18n --------------------------------------------------------------
// UI chrome strings (headers, contact labels, letter/pitch boilerplate). This is the
// engine-level language switch: templates read {{TOKEN}}/d.ui.* — no per-offer hand edits.
// True when the offer targets a country other than the candidate's residence (France).
// Drives the extra "EU Citizenship / current residence / relocation" contact lines —
// only relevant, and only shown, for offers outside the home country.
function isForeignOffer(country) {
  if (!country) return false;
  const normalized = String(country).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  return normalized !== "" && normalized !== "france";
}

function normalizeLang(v) {
  const s = String(v || "fr").toLowerCase();
  return s.startsWith("en") ? "en" : "fr";
}

const STRINGS = {
  fr: {
    profile: "Profil", keyResults: "Résultats clés", skills: "Compétences",
    experience: "Expérience professionnelle", experienceShort: "Expérience", experienceCont: "(suite)",
    education: "Formation", languages: "Langues", personalProjects: "Projets personnels IA / data",
    references: "Références", detailedTrack: "Parcours détaillé", skillsByDomain: "Compétences par domaine",
    educationLanguages: "Formation & Langues", docKind: "Dossier de compétences",
    resumeTitleAts: "CV ATS", resumeTitlePremium: "CV", dossierTitle: "Dossier de Compétences",
    quoteOpen: "« ", quoteClose: " »",
    contactLabels: { location: "Localisation", phone: "Téléphone", email: "Email", linkedin: "LinkedIn", portfolio: "Portfolio", citizenship: "Citoyenneté", residence: "Résidence actuelle", relocation: "Mobilité" },
    factsExperience: "Expérience", factsAsiaExpat: "Asie · Expat", factsBilingual: "Bilingue Biz", factsManaged: "Pilotés",
    yearsSuffix: "ans",
    sections: { hook: "Angle lettre / pitch", fit: "Fit analysis", value: "Angle de positionnement", letter: "Lettre de motivation" },
    letter: {
      recipient: "Madame, Monsieur, le Responsable du Recrutement",
      company: "votre organisation",
      title: "ce poste",
      subject: "Objet : candidature,",
      greeting: "Madame, Monsieur,",
      closing: "Cordialement,",
      wouldLike: "Je serais ravi d'échanger sur la manière dont je peux contribuer à",
      availabilityPrefix: "Disponible",
      priorityNote: "j'attache plus d'importance à l'adéquation de la mission qu'au format.",
      salaryLead: "Ma prétention salariale se situe autour de",
      regards: "Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
      defaultHook: "Je souhaite proposer ma candidature pour ce rôle.",
      defaultFit: "Mon parcours PMO / Business Analyst couvre le cadrage, le pilotage et la livraison de projets transverses.",
      defaultValue: "J'apporte une capacité directement mobilisable : clarifier les besoins, sécuriser la livraison et fédérer les parties prenantes.",
    },
    pitch: { pitch30: "Pitch 30 secondes", proofPoints: "3 preuves", whatISolve: "Ce que je résous", whatImLookingFor: "Ce que je cherche" },
    dateLocale: "fr-FR",
  },
  en: {
    profile: "Profile", keyResults: "Key Results", skills: "Skills",
    experience: "Professional Experience", experienceShort: "Experience", experienceCont: "(cont'd)",
    education: "Education", languages: "Languages", personalProjects: "Personal AI / Data Projects",
    references: "References", detailedTrack: "Detailed Track Record", skillsByDomain: "Skills by Domain",
    educationLanguages: "Education & Languages", docKind: "Skills Portfolio",
    resumeTitleAts: "Resume (ATS)", resumeTitlePremium: "Resume", dossierTitle: "Skills Portfolio",
    quoteOpen: "\"", quoteClose: "\"",
    contactLabels: { location: "Location", phone: "Phone", email: "Email", linkedin: "LinkedIn", portfolio: "Portfolio", citizenship: "Citizenship", residence: "Current residence", relocation: "Relocation" },
    factsExperience: "Experience", factsAsiaExpat: "Asia · Expat", factsBilingual: "Bilingual, business-fluent", factsManaged: "Managed",
    yearsSuffix: "years",
    sections: { hook: "Letter / pitch angle", fit: "Fit analysis", value: "Positioning angle", letter: "Cover Letter" },
    letter: {
      recipient: "Dear Hiring Manager",
      company: "your organization",
      title: "this role",
      subject: "Subject: Application,",
      greeting: "Dear Hiring Manager,",
      closing: "Sincerely,",
      wouldLike: "I would welcome the opportunity to discuss how I can contribute to",
      availabilityPrefix: "Available",
      priorityNote: "I place more importance on the fit of the mission than on the contract format.",
      salaryLead: "My salary expectation is around",
      regards: "Thank you for considering my application. I look forward to hearing from you.",
      defaultHook: "I would like to apply for this role.",
      defaultFit: "My PMO / Business Analyst track record covers framing, steering and delivery of cross-functional projects.",
      defaultValue: "I bring a directly mobilizable capability: clarifying needs, securing delivery and aligning stakeholders.",
    },
    pitch: { pitch30: "30-Second Pitch", proofPoints: "3 Proof Points", whatISolve: "What I Solve", whatImLookingFor: "What I'm Looking For" },
    dateLocale: "en-US",
  },
};

// Static header/meta replacements applied to each template when lang === "en".
// FR templates are the source of truth and need no rewrite when lang === "fr".
const TEMPLATE_I18N = {
  ats: {
    en: [
      ['<html lang="fr">', '<html lang="en">'],
      ["<title>Johan Proust — CV ATS</title>", "<title>Johan Proust — Resume (ATS)</title>"],
      ["<h2>Profil</h2>", "<h2>Profile</h2>"],
      ["<h2>Résultats clés</h2>", "<h2>Key Results</h2>"],
      ["<h2>Compétences</h2>", "<h2>Skills</h2>"],
      ["<h2>Expérience professionnelle</h2>", "<h2>Professional Experience</h2>"],
      ["<h2>Formation</h2>", "<h2>Education</h2>"],
      ["Projets personnels IA / data", "Personal AI / Data Projects"],
      ["<h2>Langues</h2>", "<h2>Languages</h2>"],
      ["<h2>Références</h2>", "<h2>References</h2>"],
    ],
  },
  premium: {
    en: [
      ['<html lang="fr">', '<html lang="en">'],
      ["<title>Johan Proust — CV (B · Plum Sidebar)</title>", "<title>Johan Proust — Resume</title>"],
      ["<h2>Profil</h2>", "<h2>Profile</h2>"],
      ["<h2>Résultats clés</h2>", "<h2>Key Results</h2>"],
      [">Formation</h3>", ">Education</h3>"],
      [">Langues</h3>", ">Languages</h3>"],
      ["<h2>Expérience <span", "<h2>Experience <span"],
      ["<h2>Expérience</h2>", "<h2>Experience</h2>"],
      [">(suite)<", ">(cont'd)<"],
      ["Projets personnels IA / data", "Personal AI / Data Projects"],
      ["<h2>Références</h2>", "<h2>References</h2>"],
    ],
  },
  dossier: {
    en: [
      ['<html lang="fr">', '<html lang="en">'],
      ["<title>Johan Proust — CV (A · Header Band)</title>", "<title>Johan Proust — Skills Portfolio</title>"],
      ["<title>Johan Proust — Dossier de Compétences</title>", "<title>Johan Proust — Skills Portfolio</title>"],
      ["<h2>Profil</h2>", "<h2>Profile</h2>"],
      ["<h2>Résultats clés</h2>", "<h2>Key Results</h2>"],
      ["<h2>Parcours détaillé</h2>", "<h2>Detailed Track Record</h2>"],
      ["Projets personnels IA / data", "Personal AI / Data Projects"],
      ["<h2>Compétences par domaine</h2>", "<h2>Skills by Domain</h2>"],
      ["<h2>Formation & Langues</h2>", "<h2>Education & Languages</h2>"],
      [">Dossier de compétences<", ">Skills Portfolio<"],
    ],
  },
  lettre: {
    en: [
      ['<html lang="fr">', '<html lang="en">'],
      ["<title>Johan Proust — Lettre de motivation</title>", "<title>Johan Proust — Cover Letter</title>"],
    ],
  },
  pitch: {
    en: [
      ['<html lang="fr">', '<html lang="en">'],
      ["<h2>Pitch 30 secondes</h2>", "<h2>30-Second Pitch</h2>"],
      ["<h2>3 preuves</h2>", "<h2>3 Proof Points</h2>"],
      ["<h2>Ce que je résous</h2>", "<h2>What I Solve</h2>"],
      ["<h2>Ce que je cherche</h2>", "<h2>What I'm Looking For</h2>"],
    ],
  },
};

function applyI18n(html, key, curLang) {
  if (curLang === "fr") return html;
  const pairs = TEMPLATE_I18N[key]?.[curLang] || [];
  let out = html;
  for (const [from, to] of pairs) out = out.split(from).join(to);
  return out;
}


const profile = JSON.parse(read("library/profile.json"));
const experienceLib = JSON.parse(read("library/experience.json"));
const skillsLib = JSON.parse(read("library/skills.json"));

const offerText = args.offer ? read(args.offer).toLowerCase() : "";
// Raw (case-preserving) offer content — referent names/contacts live ONLY here,
// in the PRIVATE offer.md, never in the public library/. Generic runs => no referents.
const offerRaw = args.offer ? read(args.offer) : "";
const referents = parseReferents(offerRaw);
const offerMeta = args.offer ? parseFrontmatter(offerRaw) : {};

// --- language resolution ----------------------------------------------------
// Priority: --lang flag > offer.md `lang:` frontmatter > default fr.
// This is the ONLY place language is decided — no per-offer manual translation.
const lang = normalizeLang(args.lang || offerMeta.lang || "fr");
const L = STRINGS[lang];

const skills = parseSkills(lang);
const offerProfile = buildOfferProfile(offerRaw, offerMeta, lang);
const offerPitchSeek = buildPitchSeek(offerMeta, lang);

// --- assemble model -------------------------------------------------------
const model = {
  profile,
  variant: args.variant || "ats",
  lang,
};

const html = renderTemplate(model);

// --- write ----------------------------------------------------------------
const outDir = args.offer
  ? dirname(join(ROOT, args.offer))
  : join(ROOT, "cv", lang === "en" ? `${model.variant}-en` : model.variant);

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
if (args.offer) {
  const signatureSrc = join(ROOT, "application", "_assets", "johan-signature.png");
  if (existsSync(signatureSrc)) copyFileSync(signatureSrc, join(outDir, "johan-signature.png"));
}

// Keep the design-preview data snapshot in sync with the library (generic FR runs only).
if (!args.offer && lang === "fr") writeFileSync(join(ROOT, "factory/designs/data.js"), dataJs);

if (args.pdf) await toPdf(htmlPath);

// --- generate offer letter & pitch if applicable --------------------------
if (args.offer) {
  const offerContent = read(args.offer);
  const dateStr = new Date().toLocaleDateString(L.dateLocale, { year: "numeric", month: "long", day: "numeric" });

  const hookRaw = parseSection(offerContent, L.sections.hook) || "";
  const hook = offerProfile.letterHook || cleanGeneratedText(hookRaw) || L.letter.defaultHook;

  const fitRaw = parseSection(offerContent, L.sections.fit);
  const fit = offerProfile.letterFit || cleanGeneratedText(fitRaw) || L.letter.defaultFit;

  const valRaw = parseSection(offerContent, L.sections.value);
  const value = offerProfile.letterValue || cleanGeneratedText(valRaw) || L.letter.defaultValue;
  const directLetter = parseSection(offerContent, L.sections.letter);

  // Letter
  const lettreTpl = read("factory/templates/lettre.html");
  const letterParagraphs = directLetter
    ? directLetter.split(/\r?\n\s*\r?\n/).map(cleanGeneratedText).filter(p => p && p !== L.letter.greeting)
    : composeLetter(hook, fit, value);
  const lettreHtml = renderLetter(lettreTpl, offerMeta, letterParagraphs, profile, dateStr, Boolean(directLetter));
  const lettrePath = join(outDir, finalName("LM", "html"));
  writeFileSync(lettrePath, lettreHtml);
  console.log("✓ HTML (Letter) →", lettrePath);
  if (args.pdf) await toPdf(lettrePath);

  // Pitch
  const pitchTpl = applyI18n(read("factory/templates/pitch.html"), "pitch", lang);
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
  const i18nKey = m.variant === "premium" ? (args.offer ? "premium" : "dossier") : "ats";
  return applyI18n(htmlContent, i18nKey, m.lang);
}

function renderLetter(tpl, meta, paragraphs, profile, dateStr, hasDirectLetter) {
  const availability = args.offer
    ? (lang === "en" ? profile.availabilityOfferEn : profile.availabilityOfferFr)
    : (lang === "en" ? profile.availabilityEn : profile.availability);
  const availabilitySentence = /permanent/i.test(meta.contract || "") ? "" : `${L.letter.availabilityPrefix} ${availability}.`;
  const recipientBlock = meta.recipient
    ? `<div class="recipient"><b id="recip">${meta.recipient}</b><br><span id="company">${cleanTerminalPunctuation(meta.company || L.letter.company)}</span></div>`
    : "";
  const closingParagraph = hasDirectLetter ? "" : `<p>${L.letter.wouldLike} ${cleanTerminalPunctuation(meta.company || L.letter.company)}. ${availabilitySentence}</p>`;
  return applyI18n(tpl, "lettre", lang)
    .replaceAll("../designs/base.css", "base.css")
    .replaceAll("../designs/data.js", "data.js")
    .replace("{{RECIPIENT_BLOCK}}", recipientBlock)
    .replaceAll("{{OFFER_TITLE}}", offerProfile.title || meta.title || L.letter.title)
    .replaceAll("{{DATE}}", dateStr)
    .replaceAll("{{PLACE_DATE}}", lang === "en" ? `Brest, ${dateStr}` : `Brest, le ${dateStr}`)
    .replaceAll("{{GREETING}}", L.letter.greeting)
    .replaceAll("{{CLOSING}}", L.letter.closing)
    .replaceAll("{{SUBJECT_PREFIX}}", L.letter.subject)
    .replaceAll("{{REGARDS}}", L.letter.regards)
    .replace("{{LETTER_BODY}}", paragraphs.map(p => `<p>${p}</p>`).join(""))
    .replace("{{LETTER_CLOSING}}", closingParagraph);
}

// A letter has three jobs: motivation, one proof, then one contribution.
// Selecting one non-overlapping sentence per source keeps offer notes from echoing.
function composeLetter(hook, fit, value) {
  const picked = [];
  for (const source of [hook, fit, value]) {
    const sentence = splitSentences(source).find(x => !picked.some(y => sentenceSimilarity(x, y) >= 0.35));
    if (sentence) picked.push(sentence);
  }
  return picked;
}

function splitSentences(text) {
  return cleanGeneratedText(text).replace(/^['"«]\s*|\s*['"»]$/g, "").split(/(?<=[.!?])\s+/).filter(Boolean);
}

function sentenceSimilarity(a, b) {
  const words = s => new Set(s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{4,}/g) || []);
  const left = words(a), right = words(b);
  const overlap = [...left].filter(x => right.has(x)).length;
  return overlap / Math.max(1, Math.min(left.size, right.size));
}

function cleanTerminalPunctuation(text) {
  return cleanGeneratedText(text).replace(/[.]+$/, "");
}

function buildPitchSeek(meta, curLang) {
  const title = normalizeOfferTitle(meta.title || (curLang === "en" ? "senior role" : "role senior"));
  const salary = cleanGeneratedText(meta.salary_expectation || "");
  const country = String(meta.country || "").toLowerCase();
  const contract = cleanGeneratedText(meta.contract || "");
  if (country === "switzerland") {
    return curLang === "en"
      ? [`A senior ${title} mandate with clear ownership and scope.`, salary ? `A Swiss package aligned with the stated scope: ${salary}, with bonus, pension and relocation terms assessed separately.` : "A Swiss package aligned with senior market conventions, with bonus, pension and relocation terms assessed separately.", "A French-English environment where measurable delivery matters."]
      : [`Un mandat senior de ${title}, avec un perimetre et une responsabilite clairs.`, salary ? `Un package suisse aligne avec le perimetre annonce : ${salary}, bonus, LPP et relocation evalues separement.` : "Un package suisse aligne avec les conventions senior du marche, bonus, LPP et relocation evalues separement.", "Un environnement francais-anglais ou la valeur se mesure dans l'execution."];
  }
  if (/retainer/i.test(contract)) {
    const band = (meta.title || "").match(/\(([^)]*(?:ICS|LICA)[^)]*)\)/i)?.[1] || "UNOPS contract";
    return [
      `A ${title} mandate with clear delivery ownership.`,
      `A retainer structure and compensation aligned with the advertised ${band} level, workload and responsibility.`,
      "An international environment where reliable data improves delivery."
    ];
  }
  return [];
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
  const sec = parseSection(raw, "Référents") || parseSection(raw, "References");
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

// Bespoke, hand-tuned per-offer copy (used for a handful of historical French applications).
// These blocks are FR-only by construction — English offers always use the generic,
// scoring-based tailoring pipeline below instead of a hand-written override.
function buildOfferProfile(raw, meta, curLang) {
  if (!raw) return {};
  const title = normalizeOfferTitle(meta.title || "");
  if (curLang !== "fr") return { title, fileSlug: slugifyTitle(title) };

  const isBinchamCyber = /bincham/i.test(raw) || (/business analyst/i.test(raw) && /cybers[ée]curit[ée]/i.test(raw));
  if (isBinchamCyber) {
    return {
      title: "Business Analyst Cybersécurité & Gouvernance",
      fileSlug: "BusinessAnalystCybersecurite",
      summary: "Senior PMO & Product Owner (13 ans d'expérience, diplômé EPSI 2024 en Cybersécurité). Je conçois des systèmes de décision pour les organisations complexes : comprendre rapidement les mécanismes, structurer les arbitrages (Banque, Défense) et outiller sur-mesure le pilotage (Apps Script, Python, IA) pour rendre le delivery factuel et auditable.",
      brand: "Faciliter le dialogue métier-IT-sécurité et traduire la conformité en exigences projet claires.",
      letterHook: "C'est avec intérêt que je vous adresse ma candidature pour le poste de Business Analyst Cybersécurité à Genève. Cette opportunité retient mon attention car elle correspond à mon cœur de métier : structurer le besoin fonctionnel, faire l'interface entre les métiers et les équipes IT/sécurité, et décliner les exigences de conformité en livrables projet.",
      letterFit: "Fort de 13 ans d'expérience en Business Analysis et PMO (Crédit Mutuel Arkéa en Banque, Thales ISR en Défense sur des portefeuilles complexes), j'ai mené la structuration fonctionnelle d'initiatives stratégiques et l'outillage de gouvernance. Diplômé Développeur Cybersécurité en 2024 (EPSI Rennes), je dispose d'une bonne compréhension des enjeux techniques et de sécurité applicative.",
      letterValue: "Sans me positionner en juriste ou en expert GRC pur, j'apporte la rigueur méthodologique du Business Analyst pour dialoguer avec vos équipes sécurité (SOC, GRC, Architecture) et vos directions opérationnelles, afin de transformer les cadres réglementaires (FINMA, ISO 27001, NIS2, DORA) en cahiers des charges et matrices d'exigences clairs.",
      experienceIds: ["arkea", "thales", "epsi", "shuhan", "vacorda"],
      passionProjectIds: ["idnum-ia", "career-intelligence-system"],
      passionProjects: [
        {
          name: "Projet IDNUM / PEIN — IA & Cadrage Réglementaire EUDI Wallet",
          proof: "Cadrage de l'Instance de Partie Utilisatrice EUDI Wallet chez Crédit Mutuel Arkéa (DDM) : matrice entière de conformité et de spécifications (29 textes CIR/CID, 82 fonctionnalités sur 11 thèmes) réalisée en moins de 5 jours ouvrés avec 3 itérations validées par les équipes DSI (couverture complète).",
          tags: ["EUDI Wallet (eIDAS 2)", "Conformité & IA", "Matrice DSI", "5 jours ouvrés"]
        },
        {
          name: "Career Intelligence System & Prompt Security",
          proof: "Graphe de connaissances personnel, audit d'invites (Prompt Hardening), serveurs MCP et orchestration LLM pour la gouvernance de données et l'analyse d'offres.",
          tags: ["Prompt Security", "Knowledge Graph", "MCP", "AI Governance"]
        },
        {
          name: "BorgInvestor / Trading Algo Stack — Screener & Risk",
          proof: "Stack personnel de trading algorithmique et screening financier : backtesting, télémétrie, contrôle des risques et modélisation de scénarios décisionnels.",
          tags: ["Trading Algo", "Backtesting", "Telemetry", "Decision Systems"]
        }
      ],
      metrics: [
        ["< 5 jours ouvrés", "Matrice IDNUM validée DSI (3 itérations, couverture complète)", "Crédit Mutuel Arkéa (DDM)"],
        ["> 1 Md€", "Portefeuilles pilotés Défense", "Thales ISR"],
        ["3h → 15 min", "Industrialisation risques (-92%)", "Thales ISR"],
        ["Bac+5 / Cyber", "M2 IT/BI & Développeur Cybersécurité", "EPSI Rennes & ESC"]
      ],
      skillGroups: [
        ["Business Analysis & Gouvernance", ["Recueil de besoins & ateliers métier", "Spécifications fonctionnelles & CDC", "Matrices d'exigences & traçabilité", "Pilotage Agile (Scrum / Kanban / PO)", "Gestion des parties prenantes & COPIL"]],
        ["Cybersécurité & Conformité", ["Culture GRC & Gestion des risques (ROR/EMV)", "Sensibilité FINMA, ISO 27001, NIS2 & DORA", "Gouvernance des accès & Besoin de Savoir", "Plans de remédiation & Suivi d'audits", "Sécurité applicative (OWASP, RBAC, PAM)"]],
        ["Outils & Méthodologies", ["Jira, Miro, MS Project, QDV, PowerBI", "SQL, REST APIs, Postman, Python, Apps Script", "Model Context Protocol (MCP), LLMs & Prompt Hardening"]]
      ],
      experienceOverrides: {
        arkea: {
          role: "PMO Stratégique / Business Analyst",
          company: "Crédit Mutuel Arkéa",
          period: "Nov 2024 – Présent",
          location: "Brest, France",
          context: "Direction du cadre commun de pilotage des initiatives du Plan stratégique en banque de détail.",
          stack: ["Banque de détail", "PMO Stratégique", "Plan Stratégique", "Gouvernance IT", "Apps Script (440-2760h)", "Business Analysis"],
          bullets: [
            "Cadre commun de qualification des initiatives du Plan stratégique en banque de détail (12-18 mois), alignant marketing, data, expérience client et IT.",
            "Formalisation des exigences fonctionnelles, règles de gouvernance, matrices de traçabilité et animation des comités de pilotage (COPIL / CODIR).",
            "Conception d'une application PMO sur-mesure (Apps Script : Kanban, KPI, alertes) centralisant les arbitrages stratégiques (gain capacitaire de 440h à 2760h/an).",
            "Accompagnement du changement et diffusion des référentiels de cadrage auprès des directions métier et IT."
          ]
        },
        thales: {
          role: "PMO & Support Bid Management",
          company: "Thales ISR (via MIGSO-PCUBED)",
          period: "Avr 2020 – Oct 2023",
          location: "Brest, France",
          context: "Pilotage des risques et de la gouvernance documentaire sur un portefeuille d'offres stratégiques >1 Md€.",
          stack: ["Défense (>1Md€)", "Gestion des Risques", "Besoin de Savoir", "ISO 27001 context", "Audit Compliance"],
          bullets: [
            "Industrialisation du processus d'analyse des risques (ROR/EMV), réduisant le délai de traitement de 3h à 15 min par offre (-92%).",
            "Gestion de la gouvernance EIM/GED (« Besoin de Savoir »), garantissant le respect strict des politiques d'accès et des audits de conformité interne.",
            "Structuration des matrices d'exigences et des données de chiffrage d'offres complexes dans QDV."
          ]
        },
        epsi: {
          role: "Product Owner + Coach Agile",
          company: "EPSI (client Capgemini)",
          period: "Nov 2023 – Nov 2024",
          location: "Rennes, France",
          context: "Spécialisation intensive en architecture applicative sécurisée et gouvernance cyber.",
          stack: ["Diplôme Cybersécurité", "OWASP", "RBAC", "Sécurité Applicative", "Agile Master"],
          bullets: [
            "Conception et validation d'architectures applicatives N-tiers sécurisées (Java/Spring Boot, PostgreSQL, APIs REST).",
            "Mise en place de tests de sécurité applicative, contrôle d'accès RBAC et recettes fonctionnelles sous Postman.",
            "Étude des référentiels de sécurité (OWASP Top 10, ISO 27001) et sécurisation des flux de données."
          ]
        },
        shuhan: {
          role: "Resp. Développement Commercial International",
          company: "Sichuan Shuhan Plastics (Chine)",
          period: "Juin 2015 – Janv. 2020",
          location: "Deyang, Chine",
          context: "Direction des opérations export (Juin 2015 – Janv. 2020 ; 7 ans en Asie au cumul avec Justrade & Vacorda).",
          stack: ["International (7 ans Asie)", "Anglais Bilingue", "Gestion Transverse", "Négociation"],
          bullets: [
            "Croissance de la part export de 5% à 20% du CA (~15 M$ en 2019) par la conduite de projets complexes en environnement multiculturel.",
            "Négociation de contrats internationaux et gestion des exigences de conformité douanière et qualité.",
            "Management d'équipes pluridisciplinaires 100% en anglais."
          ]
        },
        vacorda: {
          role: "Chargé de Stratégie Digitale & Business Dev",
          company: "Vacorda Instruments (Chine)",
          period: "Janv. 2015 – Juin 2015",
          location: "Chengdu, Chine",
          context: "Création d'un écosystème digital from-scratch pour la conquête de la zone francophone.",
          stack: ["Stratégie digitale", "SEO / SEA", "Google Ads", "Lead Generation"],
          bullets: [
            "Création écosystème digital from-scratch, SEO/SEA, lead generation zone francophone.",
            "Gestion budget publicitaire 24k$/an Google Ads ; poste exercé 90% en anglais."
          ]
        }
      }
    };
  }
  const isThalesConfigDelivery = /thales/i.test(raw)
    && /configuration management/i.test(raw)
    && /responsable projet/i.test(raw);
  const isArkeaAssetManagementMoa = /ark[ée]a asset management/i.test(raw) && /chef de projet moa/i.test(raw);
  const isArkeaMoa = !isArkeaAssetManagementMoa && /cr[ée]dit mutuel ark[ée]a/i.test(raw) && /chef de projet moa/i.test(raw);
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
  if (isArkeaAssetManagementMoa) {
    return {
      title: "Chef de projet MOA",
      fileSlug: "ChefProjetMOAPerformance",
      summary: "Chef de projet MOA orienté cadrage métier, cahier des charges, recette et pilotage de déploiement outillé. Déjà mobilisé chez Crédit Mutuel Arkéa sur le pilotage d'initiatives stratégiques, je transpose cette maîtrise du groupe à l'implémentation d'un outil de calcul de performance : cadrer le besoin, formaliser le cahier des charges, piloter la recette avec l'éditeur et accompagner le déploiement jusqu'aux utilisateurs.",
      brand: "Besoin cadré, cahier des charges actionnable, recette pilotée, déploiement accompagné.",
      letterHook: "Je travaille déjà au Crédit Mutuel Arkéa et je connais ses référentiels, sa gouvernance et ses méthodologies projet. Le poste de Chef de projet MOA chez Arkéa Asset Management correspond à mon terrain naturel : faire émerger le besoin métier, le traduire en cahier des charges, piloter la recette avec l'éditeur retenu et accompagner le déploiement de l'outil de calcul de performance jusqu'aux utilisateurs.",
      letterFit: "Chez Diadom, j'ai piloté un projet SI de bout en bout : cadrage, sélection et coordination de prestataires techniques, déploiement, recette et mise en production, puis formation des équipes métier. Chez Thales, j'ai industrialisé les processus de pilotage (risques, plannings) et animé des comités et ateliers avec reporting CODIR. Chez Arkéa, je structure déjà un cadre de qualification, des KPI et des comités pour la direction. Chez EPSI, j'ai sécurisé une recette applicative avec critères d'acceptation et tests.",
      letterValue: "J'apporte une posture MOA concrète directement mobilisable : formaliser les besoins métiers en cahier des charges actionnable, piloter le plan de recette et le suivi des anomalies avec l'éditeur, coordonner IT/métiers/éditeur, organiser les comités de pilotage, produire le reporting d'avancement et accompagner le changement (formation, documentation) jusqu'au démarrage.",
      experienceIds: ["arkea", "diadom", "thales", "epsi"],
      metrics: [
        ["Cadrage à mise en production", "Cycle projet complet : cahier des charges, recette, déploiement, formation", "Diadom SAS"],
        ["440-2760 h/an", "Gain capacitaire PMO, KPI et comités", "Crédit Mutuel Arkéa"],
        ["3h -> 15 min", "Industrialisation du pilotage des risques", "Thales ISR"],
        ["2 équipes livrées", "Recette et critères d'acceptation", "EPSI | CRM sécurisé"]
      ],
      skillGroups: [
        ["MOA & cadrage", ["Recueil du besoin", "Cahier des charges fonctionnel", "Traduction besoin -> MOE", "Documentation"]],
        ["Recette & déploiement", ["Plan de recette", "Scénarios de tests", "Suivi des anomalies", "Mise en production"]],
        ["Gouvernance & reporting", ["Comités de pilotage", "Ateliers métiers", "Indicateurs de suivi", "Reporting direction"]],
        ["Coordination", ["IT / éditeur / métiers", "Conduite du changement", "Formation utilisateurs", "Multi-parties prenantes"]],
        ["Outillage & groupe", ["Jira", "Excel / VBA", "Google Workspace", "Méthodologies groupe Crédit Mutuel Arkéa"]]
      ],
      experienceOverrides: {
        arkea: {
          context: "Groupe Crédit Mutuel Arkéa : cadre de qualification d'initiatives, KPI, jalons et comités pour la direction du plan de développement.",
          bullets: [
            "Cadrage des initiatives : objectifs, besoins métiers, dépendances et prérequis formalisés pour une lecture homogène.",
            "Application PMO sur mesure (Google Apps Script) : Kanban, KPI, jalons, alertes, source de vérité unique pour reporting et comités.",
            "Industrialisation documentaire et méthodologique adoptée par les contributeurs, gain capacitaire 440-2760 h/an."
          ]
        },
        diadom: {
          role: "Chef de Projet MOA / Business Analyst",
          context: "Refonte SI (site institutionnel + portail e-commerce) : cadrage du besoin, coordination prestataires, recette, déploiement, formation.",
          stack: ["Cahier des charges", "Coordination éditeur", "Recette", "Mise en production", "Formation utilisateurs"],
          bullets: [
            "Maîtrise d'œuvre complète du cycle projet : cadrage, sélection et coordination des prestataires techniques, déploiement, recette, mise en production.",
            "Gestion rigoureuse du planning et du chemin critique (MS Project), respect des jalons de mise en production.",
            "Formation des équipes métier pour l'autonomie sur le nouvel outil ; reporting mensuel à la direction (CODIR/PDG)."
          ]
        },
        thales: {
          context: "Industrialisation des processus de pilotage (risques, plannings), animation de comités et ateliers, reporting CODIR.",
          bullets: [
            "Animation de revues (ROR) et de workshops avec experts techniques, achats et métiers pour cadrer et arbitrer.",
            "Industrialisation Excel/VBA du traitement des risques : 3h -> 15 min par offre (-92%), templates standardisés adoptés par les centres de compétences.",
            "RETEX stratégique livré au CODIR DMS France avec recommandations actionnables."
          ]
        },
        epsi: {
          context: "Delivery logiciel sécurisé : plan de recette, critères d'acceptation et tests sur deux équipes.",
          bullets: [
            "Traduction du besoin en User Stories, critères d'acceptation et tests Postman pour sécuriser la recette.",
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
  if (!title) return "";
  const rx = new RegExp(`(?:##|###)\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?\\r?\\n([\\s\\S]*?)(?:\\r?\\n(?:##|###)|$)`, "i");
  const m = text.match(rx);
  return m ? m[1].trim() : "";
}

// Reads the bilingual skills.json and projects it down to a single language.
function parseSkills(curLang) {
  const groups = skillsLib.groups.map(g => [
    g.group[curLang] || g.group.fr,
    g.skills.map(s => s.skill[curLang] || s.skill.fr).slice(0, 4),
  ]);
  const flat = skillsLib.groups.flatMap(g => g.skills.map(s => s.skill[curLang] || s.skill.fr));
  return { groups, flat };
}

// Projects a bilingual experience.json entry down to a single language.
function pickExperience(exp, curLang) {
  return {
    id: exp.id,
    role: exp.role[curLang] || exp.role.fr,
    company: exp.company[curLang] || exp.company.fr,
    period: exp.period[curLang] || exp.period.fr,
    location: exp.location[curLang] || exp.location.fr,
    context: (exp.context && (exp.context[curLang] || exp.context.fr)) || "",
    bullets: exp.bullets[curLang] || exp.bullets.fr,
    stack: (exp.stack && (exp.stack[curLang] || exp.stack.fr)) || [],
    selection: exp.selection || {},
  };
}

function selectTailoredExperiences(offer, exps) {
  const libRank = new Map(exps.map((x, i) => [x.id, i]));
  let selected;
  if (args.variant === "ats") {
    // ATS CV exports ALL experiences so every historical role (including Vacorda Instruments, Diadom, Justrade) is fully indexed by ATS parsers!
    selected = exps;
  } else if (offerProfile.experienceIds) {
    const preferredSet = new Set(offerProfile.experienceIds);
    selected = exps.filter(x => preferredSet.has(x.id));
  } else if (!offer) {
    const genericIds = ["arkea", "thales", "neosoft", "epsi", "shuhan", "vacorda", "diadom"];
    selected = exps.filter(x => genericIds.includes(x.id));
  } else {
    selected = scoreAndSelect(exps, offer, {
      limit: 5,
      getText: experienceText,
      getSelection: item => item.selection || {},
      debugLabel: "experiences"
    });
  }
  return selected.sort((a, b) => (libRank.get(a.id) ?? 0) - (libRank.get(b.id) ?? 0));
}

function selectPassionProjects(offer, projects) {
  if (offerProfile.passionProjects) return offerProfile.passionProjects.slice(0, 3);
  if (!projects?.length) return [];

  if (!args.offer) {
    const genericIds = ["career-intelligence-system", "borginvestor-trading-algo"];
    const rank = new Map(genericIds.map((id, i) => [id, i]));
    return projects
      .filter(project => rank.has(project.id))
      .sort((a, b) => rank.get(a.id) - rank.get(b.id))
      .slice(0, 3)
      .map(formatPassionProject);
  }

  const metaPreferredIds = offerMeta.passion_project_ids
    ? String(offerMeta.passion_project_ids).split(",").map(s => s.trim()).filter(Boolean)
    : null;
  const preferredIds = offerProfile.passionProjectIds || metaPreferredIds;
  if (preferredIds) {
    const rank = new Map(preferredIds.map((id, i) => [id, i]));
    return projects
      .filter(project => rank.has(project.id))
      .sort((a, b) => rank.get(a.id) - rank.get(b.id))
      .slice(0, 3)
      .map(formatPassionProject);
  }

  return scoreAndSelect(projects, offer, {
    limit: 3,
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
  const rawStack = item.stack || item.tags || [];
  const stack = Array.isArray(rawStack) ? rawStack : (rawStack[lang] || rawStack.fr || []);
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

// Scoring runs against the raw bilingual library entry (before language projection).
// Pick only the render language's text — an offer written in French should score
// against French copy, an English offer against English copy. Mixing both would let
// shared tokens (numbers, brand names) double-count and skew the ranking.
function langField(field) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[lang] || field.fr || "";
}
function experienceText(exp) {
  return [
    langField(exp.role),
    langField(exp.company),
    langField(exp.context),
    ...((exp.bullets && (exp.bullets[lang] || exp.bullets.fr)) || []),
    ...((exp.stack && (exp.stack[lang] || exp.stack.fr)) || []),
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
  const label = lang === "en" ? (project.name || project.labelFr) : (project.labelFr || project.name);
  const desc = lang === "en" ? (project.descriptionEn || project.descriptionFr) : (project.descriptionFr || project.descriptionEn);
  return {
    name: cvText(label),
    proof: cvText(desc),
    signal: cvText(project.valueSignal || ""),
    tags: (project.tags || []).slice(0, 4).map(cvText)
  };
}

function compileCvData(profile) {
  // scoreAndSelect works on the language-neutral experienceLib (selection metadata is
  // shared across languages); only the DISPLAY text is picked per-language, at the end.
  let filteredExpRaw;
  if (model.variant === "ats" || args.variant === "ats") {
    // ATS CV exports ALL experiences so every historical role (including Vacorda Instruments, Diadom, Justrade) is fully indexed by ATS parsers!
    const libRank = new Map(experienceLib.map((x, i) => [x.id, i]));
    filteredExpRaw = [...experienceLib].sort((a, b) => (libRank.get(a.id) ?? 0) - (libRank.get(b.id) ?? 0));
  } else if (args.offer) {
    filteredExpRaw = selectTailoredExperiences(offerText, experienceLib);
  } else {
    filteredExpRaw = experienceLib;
  }

  const filteredExp = filteredExpRaw.map(x => {
    const picked = pickExperience(x, lang);
    // Bespoke per-offer overrides are FR-only (gated in buildOfferProfile: never present when lang!=='fr').
    const override = offerProfile.experienceOverrides?.[x.id] || {};
    return [
      cvText(override.role || picked.role),
      cvText(override.company || picked.company),
      cvText(override.period || picked.period),
      cvText(override.location || picked.location),
      (override.bullets || picked.bullets).map(cvText),
      cvText(override.context || picked.context || ""),
      (override.stack || picked.stack || []).map(cvText)
    ];
  });

  const titleAts = lang === "en" ? (profile.identity.titleAtsEn || profile.identity.titleAts) : profile.identity.titleAts;
  const brandValue = offerProfile.brand || (lang === "en" ? profile.positioning.valuePropositionEn : profile.positioning.valueProposition);
  const taglineValue = lang === "en" ? profile.positioning.taglineEn : profile.positioning.tagline;
  const summaryValue = offerProfile.summary || (lang === "en" ? profile.summary.en : profile.summary.fr);
  let metricsValue = offerProfile.metrics
    || profile.headlineMetrics.map(x => lang === "en"
      ? [x.valueEn || x.value, x.labelEn || x.label, x.contextEn || x.context]
      : [x.value, x.label, x.context]);
  // Same content-density trim as passion projects: the foreign-offer contact block
  // costs 3 lines, so cap the generic (non-bespoke) metrics list at 4 on the ATS.
  if (isForeignOffer(offerMeta.country) && !offerProfile.metrics) {
    metricsValue = metricsValue.slice(0, 4);
  }

  return {
    name: cvText(profile.identity.fullName),
    photo: "johan-proust.webp",
    first: profile.identity.fullName.split(" ")[0],
    last: profile.identity.fullName.split(" ").slice(1).join(" "),
    monogram: profile.identity.fullName.split(" ").map(x => x[0]).join(""),
    title: cvText(offerProfile.title || titleAts.join(" · ")),
    brand: cvText(brandValue),
    tagline: cvText(taglineValue),
    contact: [
      [L.contactLabels.location, profile.identity.location, null],
      [L.contactLabels.phone, profile.contact.phone, null],
      [L.contactLabels.email, profile.contact.email, `mailto:${profile.contact.email}`],
      [L.contactLabels.linkedin, "in/johan-proust", profile.contact.linkedin],
      [L.contactLabels.portfolio, "johanproust.me", profile.contact.portfolio],
      ...(isForeignOffer(offerMeta.country) ? [
        [L.contactLabels.citizenship, lang === "en" ? "EU Citizen" : "Citoyen UE", null],
        [L.contactLabels.relocation, lang === "en" ? profile.identity.relocationStanceEn : profile.identity.relocationStance, null],
      ] : []),
    ],
    summary: cleanGeneratedText(summaryValue),
    metrics: metricsValue.map(([value, label, context]) => [cleanGeneratedText(value), cleanGeneratedText(label), cleanGeneratedText(context)]),
    referents,
    experience: filteredExp,
    // The foreign-offer contact block (citizenship/residence/relocation) adds 3 lines, so
    // passion projects are trimmed by default on foreign offers to protect page fit — unless
    // the offer explicitly opts back in via `passion_projects: true` frontmatter (e.g. when the
    // role itself is AI/Data and the side projects are direct evidence, not filler).
    // data.js is shared between the ATS and premium renders of the same offer (whichever
    // variant runs last wins), so this trim must be variant-independent, not "ATS only" —
    // applying it unconditionally keeps both renders consistent regardless of run order.
    passionProjects: (isForeignOffer(offerMeta.country) && !offerMeta.passion_projects)
      ? []
      : selectPassionProjects(offerText, profile.passionProjects || []),
    skillGroups: (offerProfile.skillGroups || skills.groups).map(([group, items]) => [cvText(group), items.map(cvText)]),
    skillsFlat: skills.flat.map(cvText),
    education: (isForeignOffer(offerMeta.country) ? profile.education.slice(0, 3) : profile.education)
      .map(x => lang === "en"
        ? [x.year, cvText(x.titleEn || x.title), cvText(x.schoolEn ?? x.school)]
        : [x.year, cvText(x.title), cvText(x.school)]),
    languages: profile.languages.map(x => lang === "en"
      ? [cvText(x.nameEn || x.name), cvText(x.levelEn || x.level)]
      : [cvText(x.name), cvText(x.level)])
      .sort(([name]) => (name.toLowerCase().startsWith(lang === "en" ? "english" : "fran") ? -1 : 1)),
    facts: [
      [`${profile.summary.experienceYears} ${L.yearsSuffix}`, L.factsExperience],
      [`${profile.summary.internationalYears} ${L.yearsSuffix}`, L.factsAsiaExpat],
      ["FR · EN", L.factsBilingual],
      [lang === "en" ? "> EUR 1B" : "> 1 Md€", L.factsManaged]
    ],
    pitch: {
      p30: profile.pitch.p30[lang],
      solve: profile.pitch.solve[lang],
      seek: offerPitchSeek.length ? offerPitchSeek : profile.pitch.seek[lang],
    },
    // Compensation belongs in a letter only when the posting explicitly asks for it.
    salaryExpectation: offerMeta.salary_requested === "true" ? cleanGeneratedText(offerMeta.salary_expectation) : null,
    ui: L,
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
