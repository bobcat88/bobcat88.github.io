# PMO Portfolio — Notes de Projet & Documentation technique

> **Propriétaire** : Johan Proust
> **Repo** : bobcat88.github.io
> **Objectif** : Portfolio en ligne servant de CV augmenté pour cibler des missions freelance PMO/Stratégie.

## Stack Technique
- **Structure** : Monofichier HTML dans `README.md` (hébergé via GitHub Pages).
- **Style** : Tailwind CSS (via CDN) + Custom CSS (`glass-effect`, gradients).
- **Typographie** : DM Sans (Google Fonts).
- **Icônes** : FontAwesome 6 (CDN).
- **Animations** : AOS (Animate On Scroll) via unpkg.
- **Déploiement** : Automatique via GitHub Pages sur la branche `main`.

## Modèle de Données & Structure de la Page
1. **Hero Header** : Proposition de valeur claire, positionnement Senior/Freelance, photo, CTAs principaux.
2. **Expertise** : 3 piliers détaillant la valeur ajoutée (Portfolio, Transformation, Biz Dev).
3. **Parcours Professionnel (Timeline)** : Expériences chronologiques (Arkéa en premier), formatées avec des liens GDocs détaillés.
4. **Réalisations (Métrique Chocs)** : Chiffres d'impact massifs pour rassurer sur le delivery.
5. **Engagements & Formations** : Background académique et associatif, incluant les investissements personnels et la veille tech.
6. **Footer** : Liens sociaux et contact.

## Contexte pour les Agents IA (Context for Claude)
- Johan est un profil **hybride technique et business** (développeur de ses propres agents IA + PMO COMEX).
- **Ne jamais infantiliser les expériences** ou réduire ses rôles à de la pure exécution conditionnée.
- Le ton doit rester direct, professionnel et orienté *impact massif/executive*.
- **Ne pas renommer** `README.md` en `index.html`, le site s'exécute directement depuis le README sur GitHub Pages.

## Patch Notes

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
