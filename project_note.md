---
type: note
tags:
  - domain/career
aliases:
- project_note
---
# PMO Portfolio — Notes de Projet & Documentation technique
Up: [[📍 Dashboard]]

#career #onlinecv

> **Propriétaire** : Johan Proust
> **Repo** : bobcat88.github.io
> **Objectif** : Portfolio en ligne servant de CV augmenté pour cibler des missions freelance PMO/Stratégie.

## Stack Technique
- **Structure** : Monofichier HTML dans `index.html` (hébergé via GitHub Pages).
- **Style** : Tailwind CSS (via CDN) + Custom CSS (`glass-effect`, gradients).
- **Typographie** : DM Sans (Google Fonts).
- **Icônes** : FontAwesome 6 (CDN).
- **Animations** : AOS (Animate On Scroll) via unpkg.
- **Déploiement** : Automatique via GitHub Pages sur la branche `main`.

## Modèle de Données & Structure de la Page
1. **Hero Header** : Proposition de valeur claire, positionnement Senior/Freelance, photo, CTAs principaux.
2. **Expertise** : 3 piliers détaillant la valeur ajoutée (Portfolio, Transformation, Biz Dev).
3. **Parcours Professionnel (Timeline)** : Expériences chronologiques (Arkéa en premier), formatées avec des liens Github détaillés.
4. **Réalisations (Métrique Chocs)** : Chiffres d'impact pour rassurer sur le delivery.
5. **Engagements & Formations** : Background académique et associatif, incluant les investissements personnels et la veille tech.
6. **Footer** : Liens sociaux et contact.

## Contexte pour les Agents IA (Context for Claude)
- Johan est un profil **hybride technique et business** (développeur de ses propres agents IA + PMO COMEX).
- **Ne jamais infantiliser les expériences** ou réduire ses rôles à de la pure exécution conditionnée.
- Le ton doit rester direct, professionnel et orienté *impact/executive*.
- **Entrée GitHub Pages** : le site s'exécute depuis `index.html` pour éviter le wrapper Markdown/Jekyll appliqué au README.

## Patch Notes

### v1.8 — Juin 2026 (Internationalisation FR/EN + switcher drapeau)
- **I18N** : Traduction professionnelle complète EN de tout le site (~297 chaînes). Mécanisme `data-i18n` (mode `html` pour le contenu riche, mode `text` pour les boutons à icône) + dictionnaire EN inline, fallback FR automatique pour les noms propres / dates internationales.
- **SWITCHER** : Bouton bascule FR/EN avec drapeau, placé **au-dessus de la photo de profil**. Défaut = FR. En FR il affiche le drapeau UK + « Profile available in English » ; en EN il affiche le drapeau FR + « Profil disponible en français ». Choix mémorisé via localStorage (défaut FR sinon).
- **Détail bilingue** : les principes de travail gardent toujours un libellé FR + un libellé EN (la langue inactive sert de signature), quelle que soit la langue active.
- **TITLE** : `<title>` repositionné « Systèmes de décision · Senior PMO, Product Owner & AI Delivery ».
- **Technique** : injection via DOM réel (Playwright) pour fiabilité sur le HTML formaté ; ajout `<!DOCTYPE html>` (sortie du quirks mode). Aucune dépendance JS ajoutée (vanilla).

### v1.7 — Juin 2026 (Audit→fix : proposition de conseil premium, score 9.5/10)
Boucle d'audit sur 12 métriques jusqu'à ≥9.5 partout. Gap principal comblé : « comment j'aide le client à résoudre SES problèmes ».
- **CLIENT-CENTRIC** : Nouvelle section « Comment je vous aide » — 4 cartes problème→résultat + 4 modes d'intervention (diagnostic flash / mission PMO-BA / product / AI enablement).
- **CONVERSION** : Process « comment on travaille ensemble » en 3 étapes dans le Contact.
- **NAV** : Réordonnée orientée acheteur (Vos enjeux en premier).
- **TECHNIQUE/SEO/A11Y** : landmark nav, preload + width/height photo (CLS), theme-color, og:locale + image:alt, JSON-LD Person enrichi (description, makesOffer, knowsLanguage).

### v1.6 — Juin 2026 (Refonte "Systèmes de décision" — recommandations CV en ligne)
Implémentation du dossier de recommandations `maj_pour_CV_en_ligne` (10 axes). Objectif : rendre visible le **mode de pensée**, pas ajouter des compétences.
- **POSITIONING (Axe 2 & 9)** : Hero repositionné valeur-d'abord — « Je conçois des systèmes de décision » ; les métiers (PMO/PO/BA/AI) deviennent une conséquence (ligne mono secondaire). Meta title/description/keywords enrichis « systèmes de décision / decision systems ».
- **MANIFESTO (Axe 8)** : Nouvelle section `#manifesto` — les organisations échouent par priorités floues, visibilité partielle et systèmes de décision faibles.
- **HOW I THINK (Axe 1 & 7)** : Nouvelle section `#method` — méthode de raisonnement en 7 étapes + flux « Mission → Observation → Hypothèses → Analyse → Décision → Résultat » pour rendre le raisonnement visible.
- **WORKING PRINCIPLES (Axe 3)** : Nouvelle section `#principles` — 6 principes (FR + signature EN).
- **CASE STUDY (Axe 6)** : Nouvelle section `#case-study` — étude de cas PilotageProjet (Arkéa DDM) structurée Contexte / Vrai problème / Approche (et pourquoi ces choix) / Résultat. Met en avant le raisonnement : contrainte = direction de conception, maintenabilité post-départ, confidentialité par rôle, Data Santé, découpage modulaire + analyse d'impact. Aucune donnée confidentielle.
- **HUMAN SIDE (Axe 4)** : Nouvelle section `#human` — faciliter, aligner, créer la confiance, rendre les décisions compréhensibles.
- **FIL CONDUCTEUR (Axe 5)** : Bandeau de progression en tête du Parcours — Business International → Transformation Digitale → Gestion de Projet → PMO Stratégique → IA & Automatisation → Systèmes de Décision.
- **VISION (Axe 10)** : Bande de clôture avant le Contact — fermer sur une vision (stratégie × technologie × humain) plutôt que sur une liste de compétences.
- **NAV** : Ajout des entrées « Méthode » et « Étude de cas » ; retrait de « AI Stack » et « Formations » pour garder la barre lisible.

### v1.5 — Juin 2026 (AI Practice & Gate Discipline)
- **CONTENT** : Ajout d'un bloc pleine largeur "AI Practice" pour distinguer les réalisations et projets IA concrets de la section méthodologique "AI Stack".
- **FINANCE** : Ajout du projet personnel d'investissement structuré assisté par IA : thèses documentées, scénarios, allocation, risk review, audit trail et gates Go/No-go.
- **POSITIONING** : Retrait de l'entrée IA dans "Engagements & Loisirs" afin de repositionner l'IA comme expertise appliquée, non comme simple veille off-mission.
- **QUALITY** : Mise en avant d'une chaîne de vérification stricte : contexte, risque, preuve, décision journalisée.

### v1.4 — Juin 2026 (Audit contenu & AI Delivery)
- **POSITIONING** : Recentrage de la proposition de valeur sur "PMO augmenté" et "AI Delivery" plutôt qu'une mention générique d'AI Architect.
- **CONTENT** : Ajout d'une section dédiée "AI Stack" expliquant ce que font les algorithmes : cartographie contexte, analyse d'impact, exécution contrôlée, vérification.
- **STACK** : Mise en avant de GitNexus, GSD, RTK, Memory MCP, Context7, Claude/Codex et Apps Script comme système opérationnel.
- **SEO** : Mise à jour des titres, descriptions Open Graph/Twitter et mots-clés pour refléter les systèmes d'agents IA auditables.
- **CONSISTENCY** : Harmonisation des mentions Velocity Lab, Formations, Metrics et CTA final avec le nouveau positionnement.
- **UX** : Suppression du CTA mobile flottant qui pouvait masquer le contenu lors du scroll ; le CTA mobile reste disponible dans la navigation sticky.

### v1.3 — Mars 2026 (Security, SEO & A11y Polish)
- **SECURITY** : Fix de la vulnérabilité Reverse Tabnabbing (ajout `rel="noopener noreferrer"` sur tous les liens externes).
- **SEO** : Utilisation d'URLs absolues pour les balises Open Graph et Twitter Cards afin de garantir l'affichage des miniatures.
- **ACCESSIBILITY** : Ajout de balises `aria-hidden` et `aria-label` sur le composant Hero.
- **UI** : Ajout d'un point d'état animé (pulse) sur le badge "Freelance disponible".

### v1.2 — Mars 2026 (Asset Optimization & SEO)
- **TECH** : Conversion du portrait en WebP HD (`johan-proust.webp`), ajout de hints de preconnect (Google Fonts, CDNs), ajout de lien canonique et robots meta.
- **UX** : Amélioration de l'obfuscation d'email (header/footer) via JS.
- **ACCESSIBILITY** : Gestion de la préférence "Reduced Motion" pour désactiver les animations AOS si nécessaire.
- **UI** : Intégration du portrait le plus récent.

### v1.1 — Mars 2026 (Refonte Audit Antigravity)
- **TECH** : Fix double meta viewport/charset, passage à DM Sans, ajout meta-description SEO, sémantique `<main>`.
- **UI** : Ajout sections Expertise et Réalisations (Chiffres clés).
- **UX** : Refonte de la proposition de valeur du Hero pour affirmer le positionnement "Strategic PMO & AI Architect".
- **FUNCTION** : Ajout d'indicateur de scroll, CTAs rafraîchis.
- **CONTENT** : Mise à jour du compteur à "13 ans", confirmation du statut "Freelance disponible", ajout du PnL sur la section engagements.

### v1.0 — Initial
- Mise en ligne initiale du CV monopage avec Tailwind et AOS.
