# ✅ TODO LIST - Projet DZYR (Avril 2025)

## 🔐 AUTHENTIFICATION

- [ ] Créer un middleware `authMiddleware.ts` pour les routes API (validation JWT)
- [ ] Créer un hook `useViewer()` centralisé (user, token, droits d’accès, abonnements, achats)
- [ ] Vérifier l’expiration automatique du token → rediriger vers `/auth/login`
- [ ] Ajouter un loader global dans `ClientLayout.tsx` pendant vérification de session

---

## 🔒 SÉCURITÉ DES ROUTES

- [ ] Protéger toutes les routes API avec `getUserIdFromToken(req)`
- [ ] Côté backend : revérifier les droits d’accès avant d’envoyer un contenu ou de valider un like/commentaire
- [ ] Côté backend : vérifier `user.id === content.user_id` avant modification/suppression de contenu

---

## 🖼️ PROTECTION DU CONTENU

- [ ] Créer un `SecureContentWrapper` (logique commune pour image/vidéo protégée)
- [ ] Gérer les erreurs dans `SecureImageViewer` et `SecureVideoPlayer`
- [ ] Fallback thumbnail si pas de preview vidéo
- [ ] Empêcher le drag & drop sur les images protégées

---

## 💬 MESSAGERIE PRIVÉE

- [ ] Limiter le chargement initial à 10 messages
- [ ] Chargement progressif des anciens messages via scroll (avec `isLoadingOldMessages`)
- [ ] Composant de séparation des messages par date (`Jour 1`, `Jour 2`, etc.)
- [ ] Scroll auto en bas à l’ouverture + bouton "⬇️ Aller en bas" si nouveau message

---

## 📦 UI / UX

- [ ] Ne pas afficher de contenu payant dans le feed d’un creator si non débloqué
- [ ] Badge "Déjà acheté" sur les contenus accessibles
- [ ] Bouton "Payer" → remplacé par "Ouvrir" si déjà acheté
- [ ] Composant de retour dynamique dans les pages settings

---

## ⚙️ UTILITAIRES / COMPOSANTS

- [ ] Créer `useSecureFetch()` pour ajouter automatiquement le token dans tous les fetch()
- [ ] Refactoriser les appels `fetch()` pour utiliser `useSecureFetch()`
- [ ] Créer `ContentActionBar` (like/comment/share) dans `SecureContentCard`

---

## 🧪 TESTS À EFFECTUER

- [ ] Visiteur non connecté
- [ ] Utilisateur abonné actif
- [ ] Utilisateur désabonné (accès révoqué)
- [ ] Utilisateur ayant acheté un contenu à l’unité
- [ ] Creator consultant ses propres contenus

---

## 🧠 BONUS

- [ ] Ajouter un bouton "Refresh droits" dans `AccountSettingsPage` pour tester l’état du viewer en live
