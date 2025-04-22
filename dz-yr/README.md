# 🟣 DZYR – Premium Content Platform

DZYR est une plateforme moderne de contenus exclusifs, conçue pour les créateurs souhaitant vendre ou partager des images, vidéos et messages privés via abonnement ou achats unitaires.

Développée avec **Next.js**, **TailwindCSS**, **Supabase**, et un système **d'authentification personnalisé via JWT**, elle met l’accent sur la **sécurité**, la **monétisation**, et l’expérience utilisateur.

---

## 🚀 Getting Started

Installe les dépendances :

```bash
npm install
Lance le serveur de développement :

bash
Copier
Modifier
npm run dev
Puis ouvre http://localhost:3000 pour tester la plateforme en local.

🔐 Fonctionnalités clés
✅ Authentification par e-mail avec token JWT (Resend + système custom)

📷 Gestion de contenus (images, vidéos) avec preview, achat, abonnement

🔒 Sécurisation des médias :

Proxy API

Watermark visible (@username)

Stéganographie LSB invisible

QR code dissimulé (optionnel)

💬 Messagerie en temps réel (chat privé entre abonné et créateur)

🛍 Marketplace de contenus payants

📦 Abonnements mensuels avec prix personnalisés

🎛 Page paramètres (bio, avatar, bannière, prix)

🧾 Historique des achats, feed personnalisé

⚙️ Backend custom pour toutes les interactions

🧱 Stack technique
Framework : Next.js App Router

UI : TailwindCSS + shadcn/ui

Base de données : Supabase PostgreSQL

Auth : JWT custom (stocké côté client, validé via API)

Média : Supabase Storage, Sharp, Canvas, HLS (à venir)

Sécurité : Watermark, Proxy, Protection contre inspection

📁 Architecture
components/ → composants UI et fonctionnels (auth, médias, content, feed)

app/ → pages, routes, layouts avec protection selon les rôles

lib/ → fonctions utilitaires (supabase.ts, auth.ts, etc.)

api/ → routes sécurisées (/api/auth/, /api/likes/, /api/comments/, etc.)

middleware.ts → redirection automatique selon session JWT

✅ Suivi des tâches
Toutes les prochaines étapes sont listées dans TODO.md à la racine du projet.
Ce fichier contient les points d’optimisation (auth, sécurité, composants, messagerie, etc.).

📦 Déploiement
Déploiement conseillé via Vercel (build automatique avec Next.js).
Possible aussi en self-host avec Node.js, PostgreSQL et Supabase auto-hébergé.

✍️ Contribution
Contributions bienvenues via Pull Request.
⚠️ Merci de bien documenter toute PR touchant à la sécurité (auth, contenus, accès).

👨‍💻 Auteur
Projet initié et maintenu par @StreallyX
© 2025 - Tous droits réservés.