#!/usr/bin/env bun
// render.js — CV Factory render engine (Project Phoenix).
// Reads library/ content → injects into an A4 HTML template → optional print-to-PDF.
//
// Usage:
//   bun factory/render.js --variant ats                       # generic ATS CV
//   bun factory/render.js --variant premium                   # narrative CV
//   bun factory/render.js --variant ats --offer application/thales/responsable-projet-delivery-cm-2026-04-28/offer.md --pdf
//   bun factory/render.js --variant ats --pdf                 # also export PDF (needs playwright)
//   bun factory/render.js --variant ats --platform malt       # platform variant
//

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dir, "..");
const args = parseArgs(Bun.argv.slice(2));

const profile = JSON.parse(read("library/profile.json"));
const experience = JSON.parse(read("library/experience.json"));
const skills = parseSkills();

const offerText = args.offer ? read(args.offer).toLowerCase() : "";

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

const htmlPath = join(outDir, `cv-${model.variant}${args.platform ? "-" + args.platform : ""}.html`);
writeFileSync(htmlPath, html);
console.log("✓ HTML (CV) →", htmlPath);

// Write dynamic data.js and base.css locally so output is self-contained
const css = read("factory/designs/base.css");
writeFileSync(join(outDir, "base.css"), css);

const dataJs = `window.CV_DATA = ${JSON.stringify(compileCvData(profile), null, 2)};`;
writeFileSync(join(outDir, "data.js"), dataJs);
console.log("✓ Data →", join(outDir, "data.js"));

if (args.pdf) await toPdf(htmlPath);

// --- generate offer letter & pitch if applicable --------------------------
if (args.offer) {
  const offerContent = read(args.offer);
  const offerMeta = parseFrontmatter(offerContent);
  const dateStr = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  const hookRaw = parseSection(offerContent, "Angle lettre / pitch") || "Je souhaite proposer ma candidature pour ce rôle.";
  const hook = hookRaw.split("Mission")[0].split("Objet")[0].trim();

  const fitRaw = parseSection(offerContent, "Fit analysis") || "";
  const fit = fitRaw ? "Mes expériences passées correspondent à vos enjeux et besoins." : "";

  const valRaw = parseSection(offerContent, "Angle de positionnement") || "";
  const value = valRaw ? "J'apporte une rigueur de PMO éprouvée et une capacité à structurer vos process." : "";

  // Letter
  const lettreTpl = read("factory/templates/lettre.html");
  const lettreHtml = renderLetter(lettreTpl, offerMeta, hook, fit, value, profile, dateStr);
  const lettrePath = join(outDir, "lettre.html");
  writeFileSync(lettrePath, lettreHtml);
  console.log("✓ HTML (Letter) →", lettrePath);
  if (args.pdf) await toPdf(lettrePath);

  // Pitch
  const pitchTpl = read("factory/templates/pitch.html");
  const pitchHtml = pitchTpl
    .replaceAll("../designs/base.css", "base.css")
    .replaceAll("../designs/data.js", "data.js");
  const pitchPath = join(outDir, "pitch.html");
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
  return htmlContent;
}

function renderLetter(tpl, meta, hook, fit, value, profile, dateStr) {
  return tpl
    .replaceAll("../designs/base.css", "base.css")
    .replaceAll("../designs/data.js", "data.js")
    .replaceAll("{{OFFER_RECIPIENT}}", meta.recipient || "Madame, Monsieur, le Responsable du Recrutement")
    .replaceAll("{{OFFER_COMPANY}}", meta.company || "votre organisation")
    .replaceAll("{{OFFER_TITLE}}", meta.title || "ce poste")
    .replaceAll("{{DATE}}", dateStr)
    .replaceAll("{{AVAILABILITY}}", profile.availability)
    .replace(/\{\{OFFER_HOOK[^}]*\}\}/, hook)
    .replace(/\{\{OFFER_FIT[^}]*\}\}/, fit)
    .replace(/\{\{OFFER_VALUE[^}]*\}\}/, value);
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
  if (!offer) {
    const genericIds = ["arkea", "thales", "neosoft", "epsi", "shuhan", "diadom"];
    return exps.filter(x => genericIds.includes(x.id));
  }

  const scored = exps.map(exp => {
    let score = 0;
    const companyWords = exp.company.toLowerCase().split(/[\s|()—,·]+/);
    const roleWords = exp.role.toLowerCase().split(/[\s|()—,·]+/);
    
    for (const w of companyWords) {
      if (w.length > 2 && offer.includes(w)) score += 10;
    }
    for (const w of roleWords) {
      if (w.length > 2 && offer.includes(w)) score += 5;
    }
    for (const bullet of exp.bullets) {
      const bulletWords = bullet.toLowerCase().split(/[\s|()—,·]+/);
      for (const w of bulletWords) {
        if (w.length > 3 && offer.includes(w)) score += 1;
      }
    }
    
    // Boost recent primary experiences
    if (exp.id === "arkea") score += 2;
    if (exp.id === "thales") score += 3;
    if (exp.id === "neosoft") score += 1;
    
    return { exp, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map(x => x.exp);
}

function compileCvData(profile) {
  let filteredExp;
  if (args.offer) {
    filteredExp = selectTailoredExperiences(offerText, experience)
      .map(x => [x.role, x.company, x.period, x.location, x.bullets]);
  } else if (model.variant === "premium") {
    // Generic Premium is a Dossier de Compétences: export all 9 experiences!
    filteredExp = experience
      .map(x => [x.role, x.company, x.period, x.location, x.bullets]);
  } else {
    // Generic ATS is a single-page CV: export top 6 experiences
    const genericExperienceIds = ["arkea", "thales", "neosoft", "epsi", "shuhan", "diadom"];
    filteredExp = experience.filter(x => genericExperienceIds.includes(x.id))
      .map(x => [x.role, x.company, x.period, x.location, x.bullets]);
  }

  return {
    name: profile.identity.fullName,
    photo: args.offer ? "../../_assets/johan-proust.webp" : "../../johan-proust.webp",
    first: profile.identity.fullName.split(" ")[0],
    last: profile.identity.fullName.split(" ").slice(1).join(" "),
    monogram: profile.identity.fullName.split(" ").map(x => x[0]).join(""),
    title: profile.identity.titleAts.join(" · "),
    brand: profile.positioning.valueProposition,
    tagline: profile.positioning.tagline,
    contact: [
      ["Localisation", profile.identity.location, null],
      ["Téléphone", profile.contact.phone, null],
      ["Email", profile.contact.email, `mailto:${profile.contact.email}`],
      ["LinkedIn", "in/johan-proust", profile.contact.linkedin],
      ["Portfolio", "johanproust.me", profile.contact.portfolio]
    ],
    summary: profile.summary.fr,
    metrics: profile.headlineMetrics.map(x => [x.value, x.label, x.context]),
    experience: filteredExp,
    skillGroups: skills.groups,
    skillsFlat: skills.flat,
    education: profile.education.map(x => [x.year, x.title, x.school]),
    languages: profile.languages.map(x => [x.name, x.level]),
    facts: [
      ["13 ans", "Expérience"],
      ["7 ans", "Asie · Expat"],
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
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
    await browser.close();
    console.log("✓ PDF  →", pdfPath);
  } catch (e) {
    console.error("PDF export failed:");
    console.error(String(e.message || e));
  }
}

function read(p) { return readFileSync(join(ROOT, p), "utf8"); }
function base(p) { return p.split("/").pop().replace(/\.[^.]+$/, ""); }
function parseArgs(a) {
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith("--")) { const k = a[i].slice(2); const v = a[i + 1] && !a[i + 1].startsWith("--") ? a[++i] : true; o[k] = v; }
  }
  return o;
}
