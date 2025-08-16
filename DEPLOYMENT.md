# 🚀 Deployment Guide für Wedding Blog AI

## Schritt-für-Schritt Anleitung für GitHub + Vercel

### 1. Dateien vorbereiten

Erstelle einen neuen Ordner und speichere folgende Dateien:

```
wedding-blog-ai/
├── index.html          (Haupt-HTML-Datei)
├── js/
│   └── app.js          (JavaScript-Datei)
├── vercel.json         (Vercel-Konfiguration)
├── package.json        (NPM-Konfiguration)
├── README.md           (Dokumentation)
└── .gitignore          (Git-Ignorierungen)
```

### 2. .gitignore erstellen

Erstelle eine `.gitignore` Datei:

```
# Dependencies
node_modules/
npm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Vercel
.vercel
```

### 3. GitHub Repository erstellen

1. **Gehe zu GitHub.com**
   - Melde dich an oder registriere dich
   - Klicke auf "New repository"

2. **Repository konfigurieren**
   - Name: `wedding-blog-ai`
   - Description: `KI-gestützter Wedding Blog Generator`
   - Public/Private: Wähle nach Belieben
   - Initialisiere NICHT mit README (da wir schon eines haben)

3. **Code hochladen**
   ```bash
   cd wedding-blog-ai
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/DEIN-USERNAME/wedding-blog-ai.git
   git push -u origin main
   ```

### 4. Vercel Deployment

1. **Vercel Account erstellen**
   - Gehe zu [vercel.com](https://vercel.com)
   - Klicke "Sign Up" und wähle "Continue with GitHub"
   - Autorisiere Vercel für dein GitHub Account

2. **Projekt importieren**
   - Klicke "Add New..." → "Project"
   - Wähle dein `wedding-blog-ai` Repository
   - Klicke "Import"

3. **Deployment konfigurieren**
   - **Project Name**: `wedding-blog-ai` (oder eigenen Namen wählen)
   - **Framework Preset**: "Other" (automatisch erkannt)
   - **Root Directory**: `./` (Standard)
   - **Build Command**: Leer lassen
   - **Output Directory**: Leer lassen
   - **Install Command**: `npm install`

4. **Deploy klicken**
   - Vercel startet automatisch das Deployment
   - Nach 1-2 Minuten ist deine App live!

### 5. Domain konfigurieren (Optional)

1. **Custom Domain hinzufügen**
   - Gehe zu deinem Vercel Dashboard
   - Klicke auf dein Projekt
   - Wähle "Settings" → "Domains"
   - Füge deine Domain hinzu

2. **DNS konfigurieren**
   - Füge einen CNAME Record hinzu:
   - `www` → `cname.vercel-dns.com`
   - Oder A Record: `@` → `76.76.19.61`

### 6. Automatische Deployments

Ab jetzt wird jeder Push zu GitHub automatisch deployed:

```bash
# Änderungen machen
git add .
git commit -m "Update feature XYZ"
git push

# Vercel deployed automatisch die neue Version!
```

### 7. Environment Variables (für KI-APIs)

Wenn du später echte KI-APIs integrierst:

1. **Vercel Dashboard**
   - Gehe zu deinem Projekt
   - Klicke "Settings" → "Environment Variables"

2. **Variables hinzufügen**
   ```
   OPENAI_API_KEY=sk-...
   CLAUDE_API_KEY=sk-...
   ```

3. **Redeployment**
   - Nach dem Hinzufügen von Umgebungsvariablen
   - Klicke "Redeploy" für sofortige Aktivierung

### 8. Lokales Testen

Bevor du pushst, teste lokal:

```bash
# Development Server starten
npm install
npm run dev

# Browser öffnen: http://localhost:8080
```

### 9. Produktions-URL

Nach erfolgreichem Deployment:
- **Vercel URL**: `https://wedding-blog-ai-xxx.vercel.app`
- **Custom Domain**: `https://deine-domain.com`

### 10. Troubleshooting

**Häufige Probleme:**

1. **Build Fehler**
   - Prüfe `vercel.json` Syntax
   - Stelle sicher, dass `index.html` im Root liegt

2. **JavaScript Fehler**
   - Prüfe Browser-Konsole
   - Stelle sicher, dass `js/app.js` richtig eingebunden ist

3. **404 Fehler**
   - Vercel sollte alle Routen zu `index.html` weiterleiten
   - Prüfe `vercel.json` routes-Konfiguration

**Logs anzeigen:**
```bash
vercel logs https://deine-app.vercel.app
```

**Lokales Vercel testen:**
```bash
npm install -g vercel
vercel dev
```

### 11. Performance Optimierung

**Später implementieren:**

1. **Minifizierung**
   - CSS/JS komprimieren
   - Build-Pipeline einrichten

2. **Caching**
   - Static Assets cachen
   - Service Worker implementieren

3. **Monitoring**
   - Vercel Analytics aktivieren
   - Performance-Metriken überwachen

---

🎉 **Herzlichen Glückwunsch!** Dein Wedding Blog AI Tool ist jetzt live und bereit für die Welt!

Teile die URL mit deinen Nutzern und sammle Feedback für weitere Verbesserungen.
