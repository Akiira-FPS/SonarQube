## SonarQube – Interface Web

Application front-end basée sur **Vue 3** et **Vite**.  
Elle fournit une interface web pour visualiser et piloter des informations liées à SonarQube (qualité de code, projets, métriques, etc.).

> Remarque : adapte la description fonctionnelle ci‑dessus si besoin pour refléter précisément ton cas d’usage.

---

### 1. Prérequis

- **Node.js**: version LTS recommandée (≥ 18.x)
- **npm** (ou **pnpm** / **yarn**, si tu préfères)
- Accès à une instance **SonarQube** (locale ou distante), si l’application consomme une API SonarQube

Vérifier les versions installées :

```sh
node -v
npm -v
```

---

### 2. Installation du projet (setup local)

1. **Cloner le dépôt**

```sh
git clone <URL_DU_DEPOT>
cd SonarQube
```

2. **Installer les dépendances**

```sh
npm install
```

3. **Configuration via `.env`**

Un fichier `.env` est présent à la racine du projet (ou à créer s’il n’existe pas).  
Exemples de variables typiques (à adapter selon ton projet) :

```env
VITE_SONAR_TOKEN=SONAR_TOKEN
VITE_SONAR_URL=SONAR_URL
```

> Ne jamais committer les secrets (tokens, mots de passe, etc.) dans le dépôt Git.

---

### 3. Lancement en local pour les développeurs

Pour démarrer le serveur de développement avec hot-reload :

```sh
npm run dev
```

Par défaut, Vite lance l’application sur `http://localhost:5173` (ou un autre port libre).  
Ouvre ce lien dans ton navigateur.

#### Commandes utiles en développement

- **Lancer le dev server** :

```sh
npm run dev
```

- **Vérifier la qualité/lint du code** :

```sh
npm run lint
```

- **Build de production local** :

```sh
npm run build
```

---

### 4. Build de production

Pour générer un bundle optimisé pour la production :

```sh
npm run build
```

Les fichiers statiques générés sont placés dans le dossier `dist/`.  
Ce dossier contient tout ce qu’il faut servir sur un serveur web (Nginx, Apache, etc.).

Pour tester le build localement (optionnel), tu peux utiliser par exemple `serve` :

```sh
npm install -g serve
serve -s dist
```

Puis ouvrir l’URL indiquée dans le terminal.

---

### 5. Déploiement sur un serveur AWS

Le déploiement dépend de ton environnement (EC2, S3 + CloudFront, ECS, etc.).  
Voici un exemple simple basé sur **AWS S3 + CloudFront** pour servir les fichiers statiques générés par Vite.

#### 5.1. Étapes de build (CI ou machine locale)

1. Récupérer le code :

```sh
git pull origin main
```

2. Installer les dépendances (si pas déjà fait) :

```sh
npm install
```

3. Construire l’application :

```sh
npm run build
```

4. Le dossier `dist/` contient les fichiers statiques prêts à être déployés.

---

### 6. Scripts npm disponibles

Récapitulatif des scripts principaux (voir `package.json`) :

- `npm run dev` : démarrage du serveur de développement.
- `npm run build` : build de production.
- `npm run preview` (si présent) : prévisualisation locale du build.
- `npm run lint` : lint du code avec ESLint.
