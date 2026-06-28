// Shared CV data for all design archetypes (Project Phoenix). window.CV_DATA.
// Mirrors ../../library/profile.json + condensed missions. Edit library/ as SSOT;
// keep this in sync (v1 render.js will generate it).
window.CV_DATA = {
  name: "Johan PROUST",
  first: "Johan", last: "PROUST",
  monogram: "JP",
  title: "Chef de projet senior · PMO · Product Owner · Business Analyst",
  brand: "J'aide les organisations à reprendre le contrôle de systèmes complexes.",
  tagline: "Je structure ce qui est complexe, je pilote ce qui est risqué, je livre ce qui compte.",
  contact: [
    ["Localisation", "Brest, France", null],
    ["Téléphone", "07 45 65 45 82", null],
    ["Email", "johanproust@pm.me", "mailto:johanproust@pm.me"],
    ["LinkedIn", "in/johan-proust", "https://www.linkedin.com/in/johan-proust/"],
    ["Portfolio", "johanproust.me", "https://bobcat88.github.io/"]
  ],
  summary: "Senior PMO & Product Owner | 13 ans d'expérience dont 7 en Asie, sur tout le cycle projet : cadrage stratégique (BA), pilotage (PMO) et livraison produit (PO). Profil hybride tech × business : aussi à l'aise en COMEX que pour coder un outil PMO sur mesure. Secteurs : Défense · Banque · Industrie · Digital.",
  metrics: [
    ["> 1 Md€", "portefeuilles pilotés", "Thales ISR"],
    ["-92%", "gestion risques : 3h → 15 min/offre", "Thales ISR"],
    ["5% → 20%", "part export du CA (~15M$)", "Sichuan Shuhan"],
    ["+196% / +23%", "trafic / conversion e-commerce", "Diadom"],
    ["440–2760 h/an", "gain capacitaire PMO (~31–135 k€)", "Crédit Mutuel Arkéa"],
    ["MVP < 2 mois", "seul PO ayant livré ses 2 équipes", "EPSI / Capgemini"]
  ],
  experience: [
    ["PMO Stratégique / Business Analyst", "Crédit Mutuel Arkéa | Banque de Détail", "Mars 2026 – Présent", "Brest", [
      "Cadre commun de qualification des initiatives du Plan stratégique (12-18 mois), alignant marketing, data, expérience client et process.",
      "Application PMO sur mesure (Apps Script : Kanban, KPI, jalons, alertes) + POC génération auto de comptes rendus.",
      "Gain capacitaire estimé 440–2760 h/an (~31–135 k€/an), traçabilité des décisions, effet plateforme."
    ]],
    ["PMO & Support Bid Management", "Thales ISR (via MIGSO-PCUBED)", "Oct. 2024 – Oct. 2025", "Brest", [
      "Portefeuille +50 offres Défense multi-milieux, budgets jusqu'à >1Md€ ; pilotage financier RC/NRC, optimisation marge.",
      "Industrialisation Excel/VBA de la gestion des risques (ROR) : 3h → 15 min par offre (-92%).",
      "RETEX stratégique mandaté par la GBU ISR, rapport CODIR ; « au-dessus des attentes sur 7 livrables / 10 »."
    ]],
    ["Product Owner | MVP application interne", "NeoSoft", "Oct. 2025 – Déc. 2025", "Brest / Rennes", [
      "Design Thinking, prototypage Figma, parcours UX/UI, backlog Kanban itératif, facilitation Dev-Design.",
      "POC validé + prototype livré + roadmap MVP exploitable sans retro-cadrage."
    ]],
    ["Product Owner + Coach Agile | CRM sécurisé", "EPSI (client Capgemini)", "Avr. 2024 – Juil. 2024", "Rennes", [
      "Double rôle PO + Coach Agile sur 2 équipes ; cérémonies Scrum, User Stories, critères d'acceptation, tests Postman.",
      "Seul PO ayant livré ses 2 équipes (sur 5), MVP < 2 mois ; félicitations jury (Lead Tech Capgemini + Expert Cyber Orange)."
    ]],
    ["Resp. Développement Commercial International", "Sichuan Shuhan Plastics (Chine)", "Juin 2015 – Janv. 2020", "Deyang", [
      "Stratégie export marchés émergents asiatiques, management équipe multiculturelle, appels d'offres SAP Ariba.",
      "Part export 5% → 20% du CA (~15M$ en 2019) ; poste exercé 100% en anglais."
    ]],
    ["Chef de Projet Digital / Business Analyst", "Diadom SAS", "Sept. 2012 – Oct. 2014", "Montpellier", [
      "MOE refonte e-commerce (sponsor PDG), chemin critique MS Project, SEO/SEA 30 k€/an, reporting CODIR.",
      "Trafic +196% · conversion +23% sur 2 ans, livré dans les jalons."
    ]]
  ],
  skillGroups: [
    ["Pilotage & Gouvernance", ["Gouvernance PMO / EVM", "Gestion des risques (ROR)", "Reporting COMEX/CODIR", "Bid Management"]],
    ["Product & Agile", ["Product Ownership", "Business Analysis", "Coach Agile (Scrum/Kanban)", "Design Thinking"]],
    ["Tech & AI", ["Apps Script / VBA", "Java / SQL", "Automatisation & AI (LLM/MCP)", "Data / KPI"]],
    ["Leadership", ["Management multiculturel", "Conduite du changement", "Bilingue EN/FR (C1-C2)"]]
  ],
  skillsFlat: ["Gouvernance PMO / EVM", "Gestion des risques (ROR)", "Product Ownership", "Business Analysis", "Coach Agile", "Apps Script / VBA", "Java / SQL", "Automatisation & AI", "Design Thinking", "Conduite du changement", "Reporting COMEX/CODIR", "Management multiculturel"],
  education: [
    ["2014", "Master 2 | Gestion de Projet IT & BI", "ESC Montpellier"],
    ["2024", "Développeur Cybersécurité", "EPSI Rennes"],
    ["2024", "Certified Agile Master (Scrum/Kanban)", ""],
    ["2024", "Career Essentials in PM", "LinkedIn · Microsoft"]
  ],
  languages: [["Français", "Natif"], ["Anglais", "Professionnel C1-C2"]],
  facts: [["13 ans", "Expérience"], ["7 ans", "Asie · Expat"], ["FR · EN", "Bilingue Biz"], ["> 1 Md€", "Pilotés"]]
};
