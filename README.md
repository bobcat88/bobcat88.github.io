<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Johan Proust | Portfolio Expert PMO & Product Owner</title>
    <!-- Chargement des bibliothèques externes via CDN pour le fonctionnement local -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; scroll-behavior: smooth; }
        .glass-effect { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .gradient-text { background: linear-gradient(90deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .card-hover:hover { transform: translateY(-5px); transition: all 0.3s ease; border-color: #3b82f6; }
        
        /* Ligne de la chronologie */
        .timeline-line::before {
            content: '';
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 100%;
            background: linear-gradient(to bottom, #3b82f6, #a855f7, #3b82f6);
            opacity: 0.2;
        }
        @media (max-width: 768px) {
            .timeline-line::before { left: 20px; }
        }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 leading-relaxed overflow-x-hidden">

    <!-- Header / Section d'accueil -->
    <header class="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div class="absolute inset-0 z-0">
            <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div class="container mx-auto px-6 relative z-10 text-center" data-aos="fade-up">
            <div class="relative inline-block mb-10 group">
                <div class="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                <!-- Image de profil locale -->
                <img src="1718401060413.jpg" alt="Johan Proust" class="relative w-56 h-56 md:w-64 md:h-64 rounded-full border-4 border-slate-900 mx-auto object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105" onerror="this.src='https://via.placeholder.com/300'">
            </div>
            
            <h1 class="text-6xl md:text-8xl font-bold mb-6 tracking-tight">Johan <span class="gradient-text">Proust</span></h1>
            <p class="text-2xl md:text-3xl text-slate-400 mb-10 max-w-3xl mx-auto font-light">
                Expert Pilotage de Projets Complexes <br>
                <span class="text-slate-300 font-normal">PMO | Product Owner | Business Analyst</span>
            </p>
            
            <div class="flex flex-wrap justify-center gap-4 mb-12">
                <span class="px-6 py-2 rounded-full glass-effect border border-blue-500/30 text-sm"><i class="fas fa-briefcase mr-2 text-blue-400"></i>11 ans d'expérience</span>
                <span class="px-6 py-2 rounded-full glass-effect border border-purple-500/30 text-sm"><i class="fas fa-globe-asia mr-2 text-purple-400"></i>7 ans en Asie</span>
                <span class="px-6 py-2 rounded-full glass-effect border border-emerald-500/30 text-sm"><i class="fas fa-check-circle mr-2 text-emerald-400"></i>Bilingue Anglais</span>
            </div>

            <div class="flex flex-col md:flex-row justify-center gap-6 items-center">
                <div class="flex gap-6 text-3xl">
                    <a href="https://www.linkedin.com/in/johan-proust/" target="_blank" class="text-slate-400 hover:text-blue-400 transition-colors"><i class="fab fa-linkedin"></i></a>
                    <a href="https://wa.link/holzmf" target="_blank" class="text-slate-400 hover:text-green-400 transition-colors"><i class="fab fa-whatsapp"></i></a>
                    <a href="mailto:Johanproust@pm.me" class="text-slate-400 hover:text-purple-400 transition-colors"><i class="fas fa-envelope"></i></a>
                </div>
            </div>
        </div>
    </header>

    <!-- Section Expériences -->
    <section id="experiences" class="py-24 bg-slate-900/30 relative">
        <div class="container mx-auto px-6">
            <h2 class="text-4xl font-bold mb-20 text-center">Parcours <span class="text-blue-500">Professionnel</span></h2>
            
            <div class="relative timeline-line">
                
                <!-- 1. NeoSoft -->
                <div class="relative mb-16 md:flex justify-between items-center w-full" data-aos="fade-up">
                    <div class="hidden md:block w-5/12 text-right pr-12">
                        <span class="text-blue-500 font-bold text-lg">Oct 2025 - Déc 2025</span>
                    </div>
                    <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-950 z-10 hidden md:block"></div>
                    <div class="md:w-5/12 glass-effect p-8 rounded-3xl card-hover ml-10 md:ml-0 relative">
                        <div class="md:hidden text-blue-500 font-bold mb-2 text-sm">Oct 2025 - Déc 2025</div>
                        <h3 class="text-2xl font-bold">NeoSoft</h3>
                        <p class="text-blue-400 font-medium mb-4">Product Owner - Développement MVP</p>
                        <p class="text-slate-400 text-sm mb-6">Cadrage amont, Design Thinking et validation de concept (POC) sous Figma.</p>
                        <a href="https://docs.google.com/document/d/1xxzyoGqOU6SiQq8ci9xPORed7DPamUyGA2Xxg_xhwEA/edit?usp=drive_link" target="_blank" class="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all">
                            Descriptif Complet <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>

                <!-- 2. Thales -->
                <div class="relative mb-16 md:flex justify-between items-center w-full flex-row-reverse" data-aos="fade-up">
                    <div class="hidden md:block w-5/12 text-left pl-12">
                        <span class="text-purple-500 font-bold text-lg">Oct 2024 - Oct 2025</span>
                    </div>
                    <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-600 border-4 border-slate-950 z-10 hidden md:block"></div>
                    <div class="md:w-5/12 glass-effect p-8 rounded-3xl card-hover ml-10 md:ml-0">
                        <div class="md:hidden text-purple-500 font-bold mb-2 text-sm">Oct 2024 - Oct 2025</div>
                        <h3 class="text-2xl font-bold">Thales ISR</h3>
                        <p class="text-purple-400 font-medium mb-4">PMO & Support Bid Management</p>
                        <p class="text-slate-400 text-sm mb-6">Pilotage financier de +50 offres (> 1Md€) et audit stratégique Post-Mortem.</p>
                        <a href="https://docs.google.com/document/d/13LURIzIYDEVGRZU5gprV16Lhpt4zj_yfUqO1joVTVhw/edit?usp=drive_link" target="_blank" class="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all">
                            Descriptif Complet <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>

                <!-- 3. EPSI -->
                <div class="relative mb-16 md:flex justify-between items-center w-full" data-aos="fade-up">
                    <div class="hidden md:block w-5/12 text-right pr-12">
                        <span class="text-emerald-500 font-bold text-lg">2024 (4 mois)</span>
                    </div>
                    <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-600 border-4 border-slate-950 z-10 hidden md:block"></div>
                    <div class="md:w-5/12 glass-effect p-8 rounded-3xl card-hover ml-10 md:ml-0">
                        <div class="md:hidden text-emerald-500 font-bold mb-2 text-sm">2024 (4 mois)</div>
                        <h3 class="text-2xl font-bold">EPSI (Client Capgemini)</h3>
                        <p class="text-emerald-400 font-medium mb-4">Product Owner & Scrum Master</p>
                        <p class="text-slate-400 text-sm mb-6">Pilotage de 2 équipes de dev Java/Spring pour un CRM sécurisé. Livraison 100% conforme.</p>
                        <a href="https://docs.google.com/document/d/18pWjCAtyOMRExgEGMnvHBI772hxGsIZtfomSjvaS4t4/edit?usp=drive_link" target="_blank" class="inline-block px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all">
                            Descriptif Complet <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>

                <!-- 4. Gestion Locative -->
                <div class="relative mb-16 md:flex justify-between items-center w-full flex-row-reverse" data-aos="fade-up">
                    <div class="hidden md:block w-5/12 text-left pl-12">
                        <span class="text-orange-500 font-bold text-lg">2022 - 2023</span>
                    </div>
                    <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-orange-600 border-4 border-slate-950 z-10 hidden md:block"></div>
                    <div class="md:w-5/12 glass-effect p-8 rounded-3xl card-hover ml-10 md:ml-0">
                        <div class="md:hidden text-orange-500 font-bold mb-2 text-sm">2022 - 2023</div>
                        <h3 class="text-2xl font-bold">Auto-Entrepreneur</h3>
                        <p class="text-orange-400 font-medium mb-4">Project Manager - Gestion Locative</p>
                        <p class="text-slate-400 text-sm mb-6">Gestion autonome d'un parc immobilier saisonnier. Taux d'occupation de 90%.</p>
                        <a href="https://docs.google.com/document/d/1ol-LDjmEQJhorYPO4kL01Zx-NNv1tXec8wUHrufqFgg/edit?usp=drive_link" target="_blank" class="inline-block px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all">
                            Descriptif Complet <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>

                <!-- 5. Sichuan Shuhan -->
                <div class="relative mb-16 md:flex justify-between items-center w-full" data-aos="fade-up">
                    <div class="hidden md:block w-5/12 text-right pr-12">
                        <span class="text-pink-500 font-bold text-lg">2015 - 2020</span>
                    </div>
                    <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-pink-600 border-4 border-slate-950 z-10 hidden md:block"></div>
                    <div class="md:w-5/12 glass-effect p-8 rounded-3xl card-hover ml-10 md:ml-0">
                        <div class="md:hidden text-pink-500 font-bold mb-2 text-sm">2015 - 2020</div>
                        <h3 class="text-2xl font-bold">Sichuan Shuhan Plastics</h3>
                        <p class="text-pink-400 font-medium mb-4">Resp. Développement Commercial (Asie)</p>
                        <p class="text-slate-400 text-sm mb-6">Expansion de la part Export de 5% à 20% du CA global (15M$ CA).</p>
                        <a href="https://docs.google.com/document/d/1YrwQRrBlTZ2I9lxNmwhOv0kSdqsAalw34sNbqmhaTbk/edit?usp=drive_link" target="_blank" class="inline-block px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all">
                            Descriptif Complet <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>

                <!-- 6. Vacorda -->
                <div class="relative mb-16 md:flex justify-between items-center w-full flex-row-reverse" data-aos="fade-up">
                    <div class="hidden md:block w-5/12 text-left pl-12">
                        <span class="text-cyan-500 font-bold text-lg">2015 (6 mois)</span>
                    </div>
                    <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-600 border-4 border-slate-950 z-10 hidden md:block"></div>
                    <div class="md:w-5/12 glass-effect p-8 rounded-3xl card-hover ml-10 md:ml-0">
                        <div class="md:hidden text-cyan-500 font-bold mb-2 text-sm">2015 (6 mois)</div>
                        <h3 class="text-2xl font-bold">Vacorda Instruments</h3>
                        <p class="text-cyan-400 font-medium mb-4">Chargé de Stratégie Digitale (Chine)</p>
                        <p class="text-slate-400 text-sm mb-6">Création de l'écosystème digital et gestion de 24k$ de budget Ads annuel.</p>
                        <a href="https://docs.google.com/document/d/1PTNCRD_HBE4nENYdqwEFyFRPh0hM-eWsMrAhi75rGIM/edit?usp=drive_link" target="_blank" class="inline-block px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-all">
                            Descriptif Complet <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>

                <!-- 7. Diadom -->
                <div class="relative mb-16 md:flex justify-between items-center w-full" data-aos="fade-up">
                    <div class="hidden md:block w-5/12 text-right pr-12">
                        <span class="text-yellow-500 font-bold text-lg">2012 - 2014</span>
                    </div>
                    <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-600 border-4 border-slate-950 z-10 hidden md:block"></div>
                    <div class="md:w-5/12 glass-effect p-8 rounded-3xl card-hover ml-10 md:ml-0">
                        <div class="md:hidden text-yellow-500 font-bold mb-2 text-sm">2012 - 2014</div>
                        <h3 class="text-2xl font-bold">Diadom SAS</h3>
                        <p class="text-yellow-400 font-medium mb-4">Chef de Projet Digital / BA</p>
                        <p class="text-slate-400 text-sm mb-6">Refonte e-commerce : +196% de trafic et +23% de conversion en 2 ans.</p>
                        <a href="https://docs.google.com/document/d/1KIIt6meTpW7Xdh325C70he49OIoGGtHkd-nkTJciUzk/edit?usp=drive_link" target="_blank" class="inline-block px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold rounded-xl transition-all">
                            Descriptif Complet <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>

                <!-- 8. Justrade -->
                <div class="relative mb-8 md:flex justify-between items-center w-full flex-row-reverse" data-aos="fade-up">
                    <div class="hidden md:block w-5/12 text-left pl-12">
                        <span class="text-slate-500 font-bold text-lg">2011 - 2012</span>
                    </div>
                    <div class="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-600 border-4 border-slate-950 z-10 hidden md:block"></div>
                    <div class="md:w-5/12 glass-effect p-8 rounded-3xl card-hover ml-10 md:ml-0">
                        <div class="md:hidden text-slate-500 font-bold mb-2 text-sm">2011 - 2012</div>
                        <h3 class="text-2xl font-bold">Justrade INT Co.</h3>
                        <p class="text-slate-400 font-medium mb-4">Chargé de projet Webmarketing (Chine)</p>
                        <p class="text-slate-400 text-sm mb-6">Déploiement international et adaptation multiculturelle de plateformes web en Chine.</p>
                        <a href="https://docs.google.com/document/d/1JaOHl9brR_uOtd7ZPcN10GEvG5e1CPWp11Ufm67uctM/edit?usp=drive_link" target="_blank" class="inline-block px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all">
                            Descriptif Complet <i class="fas fa-external-link-alt ml-2"></i>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- Section Formations & Loisirs -->
    <section class="py-24">
        <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-2 gap-12">
                
                <!-- Formations -->
                <div data-aos="fade-right">
                    <h2 class="text-3xl font-bold mb-10"><i class="fas fa-graduation-cap text-blue-500 mr-4"></i>Formations & Certifications</h2>
                    <div class="space-y-6">
                        <div class="p-6 rounded-2xl glass-effect border-l-4 border-blue-500">
                            <h4 class="font-bold">Développeur en Cybersécurité (2024)</h4>
                            <p class="text-sm text-slate-400">EPSI - Formation Certifiante</p>
                        </div>
                        <div class="p-6 rounded-2xl glass-effect border-l-4 border-emerald-500">
                            <h4 class="font-bold">Certification Microsoft Project Management (2024)</h4>
                            <p class="text-sm text-slate-400">Gestion de projets industriels et complexes</p>
                        </div>
                        <div class="p-6 rounded-2xl glass-effect border-l-4 border-purple-500">
                            <h4 class="font-bold">Master 2 Gestion de Projet IT & BI (2014)</h4>
                            <p class="text-sm text-slate-400">Montpellier Business School</p>
                        </div>
                    </div>
                </div>

                <!-- Autres -->
                <div data-aos="fade-left">
                    <h2 class="text-3xl font-bold mb-10"><i class="fas fa-star text-orange-500 mr-4"></i>Loisirs & Intérêts</h2>
                    <div class="space-y-8">
                        <div>
                            <h4 class="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Innovation</h4>
                            <div class="p-6 rounded-2xl glass-effect border-l-4 border-orange-500">
                                <p class="font-bold">Veille tech et IA</p>
                                <p class="text-sm text-slate-400">Exploration continue des outils d'IA générative et automatisation.</p>
                            </div>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Ouverture</h4>
                            <div class="p-6 rounded-2xl glass-effect border-l-4 border-blue-500">
                                <p class="font-bold">Voyages & International</p>
                                <p class="text-sm text-slate-400">25 pays visités. Volontariat humanitaire au Cambodge et en Chine.</p>
                            </div>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Stratégie</h4>
                            <div class="p-6 rounded-2xl glass-effect border-l-4 border-purple-500">
                                <p class="font-bold">Jeux de Stratégie</p>
                                <p class="text-sm text-slate-400">Passionné par les mécaniques de jeux 4X et RPG complexes.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- Pied de page -->
    <footer class="py-20 border-t border-slate-900 text-center">
        <div class="container mx-auto px-6">
            <h2 class="text-4xl font-bold mb-10">Me <span class="gradient-text">contacter</span></h2>
            <div class="flex flex-wrap justify-center gap-8 mb-12">
                <a href="mailto:Johanproust@pm.me" class="flex items-center gap-3 text-slate-400 hover:text-white transition-all">
                    <i class="fas fa-envelope text-2xl text-purple-500"></i> Johanproust@pm.me
                </a>
                <a href="https://wa.link/holzmf" class="flex items-center gap-3 text-slate-400 hover:text-white transition-all">
                    <i class="fab fa-whatsapp text-2xl text-green-500"></i> WhatsApp
                </a>
                <a href="https://www.linkedin.com/in/johan-proust/" class="flex items-center gap-3 text-slate-400 hover:text-white transition-all">
                    <i class="fab fa-linkedin text-2xl text-blue-500"></i> LinkedIn
                </a>
            </div>
            <p class="text-xs text-slate-600 uppercase tracking-widest">© 2026 Johan Proust — Portfolio Professionnel</p>
        </div>
    </footer>

    <!-- Initialisation des animations -->
    <script>
        window.addEventListener('load', () => {
            AOS.init({
                duration: 800,
                once: true,
                offset: 100
            });
        });
    </script>
</body>
</html>
