# 💍 Wedding Blog AI

Ein intelligenter Blog-Generator speziell für die Hochzeitsbranche mit KI-Unterstützung und SEO-Optimierung.

## 🚀 Features

- **KI-gestützte Content-Erstellung**: Automatische Generierung von Blogbeiträgen
- **SEO-Optimierung**: Integrierte Keywords und Meta-Optimierung
- **Interaktive Gliederung**: Bearbeitbare H2/H3-Struktur
- **Keyword-Management**: Vordefinierte Hochzeits-Keywords
- **Export-Funktionen**: HTML, Markdown und Clipboard-Export
- **Responsive Design**: Funktioniert auf Desktop und Mobile
- **Demo-Modus**: Läuft ohne API-Abhängigkeiten

## 🛠️ Installation & Setup

### Lokale Entwicklung

1. **Repository klonen**
   ```bash
   git clone https://github.com/yourusername/wedding-blog-ai.git
   cd wedding-blog-ai
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

4. **Browser öffnen**: `http://localhost:8080`

### Vercel Deployment

1. **GitHub Repository erstellen**
   - Erstelle ein neues Repository auf GitHub
   - Pushe den Code dorthin

2. **Vercel Account verbinden**
   - Gehe zu [vercel.com](https://vercel.com)
   - Verbinde dein GitHub Account
   - Importiere das Repository

3. **Automatisches Deployment**
   - Vercel erkennt automatisch die Konfiguration
   - Jeder Push triggert ein neues Deployment

## 📁 Projektstruktur

```
wedding-blog-ai/
│
├── index.html          # Haupt-HTML-Datei
├── js/
│   └── app.js          # JavaScript-Logik
├── vercel.json         # Vercel-Konfiguration
├── package.json        # NPM-Konfiguration
└── README.md           # Dokumentation
```

## 🔧 Konfiguration

### KI-API Integration

Der aktuelle Code läuft im Demo-Modus. Für die Vollversion integriere deine bevorzugte KI-API:

```javascript
// In js/app.js - Ersetze mockAPICall mit echter API
async function callRealAPI(prompt, isOutline = false) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${YOUR_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }]
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}
```

### Umgebungsvariablen

Erstelle eine `.env.local` Datei für Vercel:

```env
OPENAI_API_KEY=your_api_key_here
CLAUDE_API_KEY=your_api_key_here
```

## 🎨 Anpassungen

### Keywords erweitern

In `js/app.js` kannst du die Keyword-Liste erweitern:

```javascript
const predefinedKeywords = [
    "Hochzeitslocation",
    "Hochzeitsplanung",
    // Füge weitere Keywords hinzu
    "Dein neues Keyword"
];
```

### Styling anpassen

Das CSS ist direkt in `index.html` eingebettet. Hauptfarben:

- Primary: `#7209b7` (Lila)
- Secondary: `#ff6b35` (Orange)
- Success: `#28a745` (Grün)
- Background: Gradient von Dunkelblau zu Lila

## 📱 Browser-Kompatibilität

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🚧 Roadmap

- [ ] Echte KI-API Integration
- [ ] Benutzer-Authentifizierung
- [ ] Blog-Vorlagen
- [ ] Erweiterte SEO-Analyse
- [ ] Social Media Integration
- [ ] Multi-Language Support

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT Lizenz - siehe [LICENSE.md](LICENSE.md) für Details.

## 🙏 Danksagungen

- Design inspiriert von modernen KI-Tools
- Icons von verschiedenen Open-Source-Projekten
- Hochzeits-Keywords basierend auf Branchenanalysen

## 📞 Support

Bei Fragen oder Problemen:

- 📧 Email: support@wedding-blog-ai.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/wedding-blog-ai/issues)
- 💬 Diskussionen: [GitHub Discussions](https://github.com/yourusername/wedding-blog-ai/discussions)

---

**Made with ❤️ for the wedding industry**
