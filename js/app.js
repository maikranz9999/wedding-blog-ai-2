// Wedding Blog AI - Hauptlogik
// Globale Variablen
let currentOutline = '';
let currentBlogPost = '';
let isGenerating = false;
let selectedKeywords = [];
let currentEditingContent = null;

// Constants
const MAX_KEYWORDS = 3;

// Chat Popup Variablen
let currentChatContent = null;
let chatMessages = [];
let improvedTextContent = '';
let isChatGenerating = false;

// SEO Keyword Density Tracker für Wedding Blog AI
class KeywordDensityTracker {
    constructor(keywords) {
        this.keywords = keywords.map(k => k.toLowerCase());
        this.idealDensity = { min: 1, max: 3 }; // Prozent
    }

    analyzeContent(content) {
        const text = this.cleanText(content);
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const totalWords = words.length;
        
        const analysis = this.keywords.map(keyword => {
            const keywordCount = this.countKeywordOccurrences(text, keyword);
            const density = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
            
            return {
                keyword,
                count: keywordCount,
                density: Math.round(density * 100) / 100,
                status: this.getDensityStatus(density),
                recommendation: this.getRecommendation(density, keyword)
            };
        });

        return {
            totalWords,
            keywordAnalysis: analysis,
            overallScore: this.calculateOverallScore(analysis)
        };
    }

    cleanText(content) {
        // Entferne HTML Tags und normalisiere Text
        return content
            .replace(/<[^>]*>/g, ' ')
            .replace(/[^\w\säöüÄÖÜß]/g, ' ')
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .trim();
    }

    countKeywordOccurrences(text, keyword) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }

    getDensityStatus(density) {
        if (density < this.idealDensity.min) return 'low';
        if (density > this.idealDensity.max) return 'high';
        return 'optimal';
    }

    getRecommendation(density, keyword) {
        if (density < this.idealDensity.min) {
            return `Verwende "${keyword}" ${Math.ceil(this.idealDensity.min)} mal mehr für bessere SEO`;
        }
        if (density > this.idealDensity.max) {
            return `Reduziere "${keyword}" um ${Math.ceil(density - this.idealDensity.max)}% für natürlicheren Text`;
        }
        return `Perfekte Keyword-Dichte für "${keyword}"`;
    }

    calculateOverallScore(analysis) {
        const scores = analysis.map(item => {
            switch(item.status) {
                case 'optimal': return 100;
                case 'low': return Math.max(60, 100 - (this.idealDensity.min - item.density) * 20);
                case 'high': return Math.max(60, 100 - (item.density - this.idealDensity.max) * 15);
                default: return 60;
            }
        });
        
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    generateSEOReport(content) {
        const analysis = this.analyzeContent(content);
        
        return {
            summary: {
                totalWords: analysis.totalWords,
                score: analysis.overallScore,
                status: analysis.overallScore >= 80 ? 'excellent' : 
                        analysis.overallScore >= 60 ? 'good' : 'needs_improvement'
            },
            keywords: analysis.keywordAnalysis,
            recommendations: this.generateRecommendations(analysis)
        };
    }

    generateRecommendations(analysis) {
        const recs = [];
        
        // Wortanzahl Empfehlungen
        if (analysis.totalWords < 300) {
            recs.push('📝 Erweitere den Text auf mindestens 300 Wörter für bessere SEO');
        } else if (analysis.totalWords > 2000) {
            recs.push('✂️ Kürze den Text oder teile ihn in mehrere Artikel auf');
        }

        // Keyword-spezifische Empfehlungen
        analysis.keywordAnalysis.forEach(item => {
            if (item.status !== 'optimal') {
                recs.push(`🎯 ${item.recommendation}`);
            }
        });

        // Positive Verstärkung
        if (analysis.keywordAnalysis.every(item => item.status === 'optimal')) {
            recs.push('✨ Hervorragende Keyword-Optimierung! Der Text ist SEO-ready.');
        }

        return recs;
    }
}

// Vordefinierte Keywords für die Hochzeitsbranche
const predefinedKeywords = [
    // Allgemeine Begriffe
    "Hochzeit",
    "Hochzeitsplanung",
    "Hochzeitsideen",
    "Hochzeitsblog",
    "Hochzeitsratgeber",
    "Hochzeitscheckliste",

    // Location & Ort
    "Hochzeitslocation",
    "Standesamt",
    "Kirchliche Trauung",
    "Freie Trauung",
    "Outdoor Hochzeit",
    "Scheunenhochzeit",
    "Strandhochzeit",
    "Destination Wedding",
    "Schloss Hochzeit",
    "Gartenhochzeit",

    // Dienstleister
    "Hochzeitsfotograf",
    "Hochzeitsvideograf",
    "Freier Trauredner",
    "DJ Hochzeit",
    "Hochzeitsband",
    "Hochzeitsplaner",
    "Catering Hochzeit",
    "Hochzeitstorte",
    "Florist Hochzeit",

    // Braut & Bräutigam
    "Brautkleid",
    "Hochzeitsanzug",
    "Brautfrisur",
    "Hochzeitsmakeup",
    "Brautstrauß",
    "Brautjungfern",
    "Trauzeugen",

    // Ablauf & Programm
    "Hochzeitseinladung",
    "Hochzeitsdeko",
    "Hochzeitsfeier",
    "Hochzeitstanz",
    "Sektempfang",
    "Hochzeitsspiele",
    "Hochzeitsrede",
    "Gastgeschenke",

    // Budget & Organisation
    "Hochzeitsbudget",
    "Kosten Hochzeit",
    "Hochzeitskostenplaner",
    "Spartipps Hochzeit",

    // Trends & Stile
    "Vintage Hochzeit",
    "Boho Hochzeit",
    "Winterhochzeit",
    "Sommerhochzeit",
    "Luxushochzeit",
    "Nachhaltige Hochzeit",
    "Moderne Hochzeit"
];

// Claude API Integration über Backend
async function callAI(prompt, type = 'general') {
    try {
        const response = await fetch('/api/claude', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                type: type
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.content;

    } catch (error) {
        console.error('API Error:', error);
        throw new Error(`Fehler bei der KI-Anfrage: ${error.message}`);
    }
}

// Status Message Functions
function showStatusMessage(content) {
    const statusContainer = document.getElementById('statusMessages');
    if (!statusContainer) return;

    const message = document.createElement('div');
    message.className = 'status-message';
    message.innerHTML = content;
    
    statusContainer.appendChild(message);
    statusContainer.scrollTop = statusContainer.scrollHeight;
    
    // Auto-remove after 10 seconds for success messages
    if (content.includes('✅')) {
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 10000);
    }
}

function clearStatusMessages() {
    const statusContainer = document.getElementById('statusMessages');
    if (statusContainer) {
        statusContainer.innerHTML = '';
    }
}

// WordPress Download Funktion
function downloadForWordpress() {
    const titleInput = document.getElementById('blogTitle');
    const outlineContent = document.getElementById('outlineContent');
    
    if (!titleInput || !outlineContent) {
        showStatusMessage('❌ Keine Gliederung zum Download gefunden!');
        return;
    }

    const title = titleInput.value.trim() || 'Hochzeitsblog';
    const keywords = getKeywordsString();
    const wordCount = document.getElementById('wordCount')?.value || '1500';
    const tone = document.getElementById('toneStyle')?.value || 'freundlich-beratend';
    
    // Sammle alle Inhalte aus der Outline
    let wordpressContent = '';
    let excerpt = '';
    let firstParagraph = '';
    
    // Durchlaufe alle Kinder der Outline
    const allElements = Array.from(outlineContent.children);
    
    allElements.forEach((element, index) => {
        if (element.tagName === 'H2') {
            // Entferne Action-Buttons aus dem Text
            const headingText = element.textContent.replace(/✎×✦/g, '').trim();
            wordpressContent += `<!-- wp:heading {"level":2} -->\n<h2 class="wp-block-heading">${headingText}</h2>\n<!-- /wp:heading -->\n\n`;
        } else if (element.tagName === 'H3') {
            // Entferne Action-Buttons aus dem Text
            const headingText = element.textContent.replace(/✎×✦/g, '').trim();
            wordpressContent += `<!-- wp:heading {"level":3} -->\n<h3 class="wp-block-heading">${headingText}</h3>\n<!-- /wp:heading -->\n\n`;
        } else if (element.classList.contains('generated-content')) {
            // Füge generierten Content hinzu
            const paragraphs = element.querySelectorAll('p');
            paragraphs.forEach(paragraph => {
                if (paragraph) {
                    const paragraphText = paragraph.textContent.trim();
                    wordpressContent += `<!-- wp:paragraph -->\n<p>${paragraphText}</p>\n<!-- /wp:paragraph -->\n\n`;
                    
                    // Verwende ersten Paragraph als Excerpt
                    if (!firstParagraph && paragraphText.length > 50) {
                        firstParagraph = paragraphText;
                        // Erstelle Excerpt (erste 155 Zeichen für SEO)
                        excerpt = paragraphText.substring(0, 155);
                        if (paragraphText.length > 155) {
                            excerpt += '...';
                        }
                    }
                }
            });
        }
    });

    // Fallback Excerpt falls kein Content generiert wurde
    if (!excerpt) {
        excerpt = `Entdecke alles über ${title}. Ein umfassender Guide mit praktischen Tipps und Expertenwissen für deine perfekte Hochzeit.`;
    }

    // WordPress-spezifisches Format erstellen
    const wordpressPost = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>WordPress Import: ${title}</title>
</head>
<body>

<!-- ========================================= -->
<!-- WORDPRESS POST DATEN                     -->
<!-- ========================================= -->

POST TITEL:
${title}

POST EXCERPT (Meta Description):
${excerpt}

KATEGORIEN:
Hochzeitsplanung, Hochzeitstipps

TAGS:
${keywords}

FOKUS KEYWORD (SEO):
${keywords.split(',')[0]?.trim() || 'Hochzeit'}

<!-- ========================================= -->
<!-- WORDPRESS GUTENBERG CONTENT              -->
<!-- ========================================= -->

<!-- Kopiere den folgenden Content direkt in den WordPress Gutenberg Editor: -->

${wordpressContent}

<!-- ========================================= -->
<!-- SEO OPTIMIERUNGEN                        -->
<!-- ========================================= -->

YOAST/RANKMATH SEO EINSTELLUNGEN:

Meta Title: ${title}
Meta Description: ${excerpt}
Focus Keyword: ${keywords.split(',')[0]?.trim() || 'Hochzeit'}
Canonical URL: https://deine-website.de/${title.toLowerCase().replace(/[^a-zA-Z0-9äöüß\s]/g, '').replace(/\s+/g, '-')}/

Open Graph:
- OG Title: ${title}
- OG Description: ${excerpt}
- OG Image: [Hochzeitsbild hinzufügen]

Schema Markup (JSON-LD):
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title}",
  "description": "${excerpt}",
  "keywords": "${keywords}",
  "author": {
    "@type": "Person",
    "name": "[Dein Name]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "[Deine Website]"
  },
  "datePublished": "${new Date().toISOString()}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://deine-website.de/${title.toLowerCase().replace(/[^a-zA-Z0-9äöüß\s]/g, '').replace(/\s+/g, '-')}/"
  }
}

<!-- ========================================= -->
<!-- WORDPRESS IMPORT ANLEITUNG               -->
<!-- ========================================= -->

IMPORT SCHRITTE:

1. WordPress Admin → Beiträge → Erstellen
2. Titel einfügen: "${title}"
3. Gutenberg Content (oben) kopieren und einfügen
4. Kategorien setzen: Hochzeitsplanung, Hochzeitstipps
5. Tags hinzufügen: ${keywords}
6. Excerpt/Auszug setzen: "${excerpt}"

SEO PLUGIN KONFIGURATION:
7. Yoast/RankMath: Focus Keyword eintragen
8. Meta Description überprüfen
9. Schema Markup hinzufügen (falls nicht automatisch)
10. Featured Image hochladen
11. Interne Links zu verwandten Artikeln hinzufügen

ZUSÄTZLICHE OPTIMIERUNGEN:
- Alt-Texte für Bilder mit Keywords
- Interne Verlinkung zu anderen Hochzeitsartikeln  
- Call-to-Action am Ende hinzufügen
- Social Media Sharing Buttons aktivieren

<!-- ========================================= -->
<!-- BLOG METADATEN                           -->
<!-- ========================================= -->

Erstellt: ${new Date().toLocaleDateString('de-DE')}
Zielwortanzahl: ${wordCount}
Stil: ${tone.replace('-', ' & ')}
Tool: Wedding Blog AI
Version: 1.0

</body>
</html>`;

    // Download starten
    const blob = new Blob([wordpressPost], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wordpress-${title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '').replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatusMessage('📄 <strong>WordPress-Import erfolgreich!</strong><br><br>✅ Die Datei enthält:<br>• Gutenberg-kompatiblen Content<br>• SEO-Metadaten<br>• Import-Anleitung<br>• Schema Markup<br><br>💡 <em>Öffne die Datei und folge der Schritt-für-Schritt Anleitung!</em>');
}

// Tag-System für Keywords (MODIFIZIERT für max 3 Keywords)
function initKeywordTagSystem() {
    const input = document.getElementById('mainKeyword');
    const dropdown = document.getElementById('keywordDropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function(e) {
        const value = e.target.value.trim();
        if (value.length > 0) {
            showKeywordDropdown(value);
        } else {
            showAllKeywords();
        }
    });

    input.addEventListener('click', function(e) {
        const value = e.target.value.trim();
        if (value.length > 0) {
            showKeywordDropdown(value);
        } else {
            showAllKeywords();
        }
    });

    input.addEventListener('focus', function(e) {
        const value = e.target.value.trim();
        if (value.length > 0) {
            showKeywordDropdown(value);
        } else {
            showAllKeywords();
        }
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = e.target.value.trim();
            if (value) {
                addKeyword(value);
                e.target.value = '';
                hideKeywordDropdown();
            }
        }
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.tag-input-container') && !e.target.closest('.dropdown')) {
            hideKeywordDropdown();
        }
    });
}

function addKeyword(keywordText) {
    // Check if maximum keywords reached
    if (selectedKeywords.length >= MAX_KEYWORDS) {
        showStatusMessage(`❌ Maximum ${MAX_KEYWORDS} Keywords erreicht! Entferne erst ein Keyword, um ein neues hinzuzufügen.`);
        return;
    }
    
    if (!selectedKeywords.includes(keywordText)) {
        selectedKeywords.push(keywordText);
        renderKeywords();
        updateKeywordCounter();
        const input = document.getElementById('mainKeyword');
        if (input) input.value = '';
        hideKeywordDropdown();
        
        // Show special message for primary keyword
        if (selectedKeywords.length === 1) {
            showStatusMessage(`👑 <strong>Primäres Keyword gesetzt:</strong> "${keywordText}"<br><br>💡 <em>Das erste Keyword wird als Haupt-SEO-Keyword verwendet und ist farblich hervorgehoben.</em>`);
        }
    }
}

function removeKeyword(keywordText) {
    const wasFirst = selectedKeywords[0] === keywordText;
    selectedKeywords = selectedKeywords.filter(keyword => keyword !== keywordText);
    renderKeywords();
    updateKeywordCounter();
    
    if (wasFirst && selectedKeywords.length > 0) {
        showStatusMessage(`👑 <strong>Neues primäres Keyword:</strong> "${selectedKeywords[0]}"<br><br>💡 <em>Das erste Keyword in der Liste ist immer das primäre SEO-Keyword.</em>`);
    }
}

function getKeywordsString() {
    return selectedKeywords.join(', ');
}

function updateKeywordCounter() {
    const counter = document.getElementById('keywordCounter');
    if (counter) {
        counter.textContent = `${selectedKeywords.length}/${MAX_KEYWORDS}`;
        
        if (selectedKeywords.length >= MAX_KEYWORDS) {
            counter.classList.add('full');
        } else {
            counter.classList.remove('full');
        }
    }
}

function showAllKeywords() {
    // Don't show dropdown if max keywords reached
    if (selectedKeywords.length >= MAX_KEYWORDS) {
        hideKeywordDropdown();
        return;
    }
    
    const dropdown = document.getElementById('keywordDropdown');
    if (!dropdown) return;

    const availableKeywords = predefinedKeywords.filter(keyword => !selectedKeywords.includes(keyword));

    let dropdownHTML = '';
    availableKeywords.slice(0, 10).forEach(keyword => {
        dropdownHTML += `<div class="dropdown-item" onclick="addKeyword('${keyword.replace(/'/g, "\\'")}')">${keyword}</div>`;
    });

    if (dropdownHTML) {
        dropdown.innerHTML = dropdownHTML;
        dropdown.style.display = 'block';
    } else {
        hideKeywordDropdown();
    }
}

function showKeywordDropdown(searchTerm) {
    // Don't show dropdown if max keywords reached
    if (selectedKeywords.length >= MAX_KEYWORDS) {
        hideKeywordDropdown();
        return;
    }
    
    const dropdown = document.getElementById('keywordDropdown');
    if (!dropdown) return;

    const matches = predefinedKeywords.filter(keyword => 
        keyword.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedKeywords.includes(keyword)
    );

    let dropdownHTML = '';

    matches.slice(0, 8).forEach(keyword => {
        dropdownHTML += `<div class="dropdown-item" onclick="addKeyword('${keyword.replace(/'/g, "\\'")}')">${keyword}</div>`;
    });

    if (!matches.includes(searchTerm) && !selectedKeywords.includes(searchTerm)) {
        dropdownHTML += `<div class="dropdown-item create-new" onclick="addKeyword('${searchTerm.replace(/'/g, "\\'")}')">\u002B "${searchTerm}" hinzufügen</div>`;
    }

    if (dropdownHTML) {
        dropdown.innerHTML = dropdownHTML;
        dropdown.style.display = 'block';
    } else {
        hideKeywordDropdown();
    }
}

function hideKeywordDropdown() {
    const dropdown = document.getElementById('keywordDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function renderKeywords() {
    const container = document.getElementById('keywordsDisplay');
    if (!container) return;

    container.innerHTML = '';

    selectedKeywords.forEach((keyword, index) => {
        const pill = document.createElement('div');
        pill.className = index === 0 ? 'keyword-pill primary' : 'keyword-pill secondary';
        pill.innerHTML = `
            <span>${keyword}</span>
            <span class="keyword-remove" onclick="removeKeyword('${keyword.replace(/'/g, "\\'")}')">\u00D7</span>
        `;
        container.appendChild(pill);
    });
}

function showTyping() {
    const typing = document.getElementById('typing');
    if (typing) typing.style.display = 'block';
    
    // Auto-Scrolling entfernt - Seite bleibt an aktueller Position
}

function hideTyping() {
    const typing = document.getElementById('typing');
    if (typing) typing.style.display = 'none';
}

async function optimizeTitle() {
    const titleInput = document.getElementById('blogTitle');
    if (!titleInput) return;

    const originalTitle = titleInput.value.trim();
    
    if (!originalTitle) {
        showStatusMessage('❌ Bitte gib zuerst einen Titel ein!');
        return;
    }

    const optimizeBtn = document.getElementById('optimizeTitleBtn');
    if (optimizeBtn) {
        optimizeBtn.classList.add('loading');
        optimizeBtn.disabled = true;
    }

    showTyping();

    try {
        const optimizedTitle = await callAI(
            `Optimiere diesen Hochzeitsblog-Titel für SEO: "${originalTitle}"

Anforderungen:
- Maximal 60 Zeichen
- Keyword-optimiert für Hochzeitsbranche
- Ansprechend für Hochzeitspaare
- Aktuelle Jahreszahl wenn sinnvoll

Antworte NUR mit dem optimierten Titel, ohne Anführungszeichen oder Erklärungen.`, 
            'title-optimization'
        );
        
        titleInput.value = optimizedTitle;
        
        hideTyping();
        showStatusMessage(`✅ <strong>SEO-optimierter Titel:</strong><br>"${optimizedTitle}"<br><br>💡 <em>Optimiert für: Keyword-Integration, Länge, Klick-Appeal</em>`);
        
    } catch (error) {
        hideTyping();
        showStatusMessage(`❌ <strong>Fehler bei der Titel-Optimierung:</strong> ${error.message}`);
    } finally {
        if (optimizeBtn) {
            optimizeBtn.classList.remove('loading');
            optimizeBtn.disabled = false;
        }
    }
}

async function generateOutline() {
    const titleInput = document.getElementById('blogTitle');
    const wordCountSelect = document.getElementById('wordCount');
    const toneSelect = document.getElementById('toneStyle');

    if (!titleInput || !wordCountSelect || !toneSelect) return;

    const title = titleInput.value.trim();
    const keywords = getKeywordsString();
    const wordCount = wordCountSelect.value;
    const tone = toneSelect.value;
    
    if (!title) {
        showStatusMessage('❌ Bitte gib zuerst einen Titel ein!');
        return;
    }

    if (isGenerating) return;
    isGenerating = true;

    const generateBtn = document.getElementById('generateOutlineBtn');
    const downloadBtn = document.getElementById('downloadOutlineBtn');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '⏳ Generiere Gliederung...';
    }

    showTyping();
    clearStatusMessages();

    try {
        const outline = await callAI(`Erstelle eine SEO-optimierte Gliederung für diesen Hochzeitsblog:

TITEL: "${title}"

PFLICHT-KEYWORDS (MÜSSEN in Überschriften verwendet werden):
${keywords}

ZWINGENDE ANFORDERUNGEN:
- JEDES der oben genannten Keywords MUSS mindestens 1x in einer H2 oder H3 Überschrift vorkommen
- Verwende weitere relevante Begriffe, aber die Pflicht-Keywords sind NICHT optional
- Wortanzahl: ${wordCount}
- Stil: ${tone}
- Format: NUR HTML <h2> und <h3> Tags

Beispiel einer korrekten Verwendung:
<h2>Die perfekte Hochzeitslocation finden</h2>
<h3>Hochzeitsplanung leicht gemacht</h3>

WICHTIG: Überprüfe vor der Antwort, dass wirklich ALLE Keywords in den Überschriften verwendet wurden!`, 'outline-generation');
        
        currentOutline = outline;
        
        const outlineContent = document.getElementById('outlineContent');
        const outlineContainer = document.getElementById('outlineContainer');
        
        if (outlineContent) outlineContent.innerHTML = outline;
        if (outlineContainer) outlineContainer.classList.add('visible');
        if (downloadBtn) downloadBtn.style.display = 'block';
        
        setTimeout(() => {
            addHeadingActions();
            
            // Test: Add a visible inserter for debugging
            const testInserter = createBlockInserter();
            testInserter.style.marginTop = '20px';
            testInserter.style.position = 'relative';
            testInserter.style.height = '40px';
            testInserter.querySelector('.block-inserter-trigger').style.opacity = '1';
            testInserter.querySelector('.block-inserter-trigger').style.position = 'relative';
            testInserter.querySelector('.block-inserter-trigger').style.top = '0';
            testInserter.querySelector('.block-inserter-trigger').style.transform = 'none';
            testInserter.querySelector('.block-inserter-trigger').style.left = '50%';
            testInserter.querySelector('.block-inserter-trigger').style.marginLeft = '-12px';
            outlineContent.appendChild(testInserter);
        }, 100);
        
        hideTyping();
        showStatusMessage('✅ <strong>Gliederung erfolgreich erstellt!</strong><br><br>📋 Die H2 und H3-Struktur wurde automatisch generiert und ist SEO-optimiert.<br><br>💡 <em>Generiere Texte zu einzelnen Überschriften oder lade die Outline als HTML herunter!</em>');
        
    } catch (error) {
        hideTyping();
        showStatusMessage(`❌ <strong>Fehler bei der Gliederung-Generierung:</strong> ${error.message}`);
    } finally {
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '🪄 Gliederung generieren';
        }
        isGenerating = false;
    }
}

function addHeadingActions() {
    const outlineContent = document.getElementById('outlineContent');
    if (!outlineContent) return;

    // Remove existing block inserters first
    const existingInserters = outlineContent.querySelectorAll('.block-inserter');
    existingInserters.forEach(inserter => inserter.remove());

    const headings = outlineContent.querySelectorAll('h2, h3');
    
    headings.forEach((heading, index) => {
        const existingActions = heading.querySelector('.heading-actions');
        if (existingActions) {
            existingActions.remove();
        }

        const actions = document.createElement('div');
        actions.className = 'heading-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit';
        editBtn.innerHTML = '✎';
        editBtn.title = 'Bearbeiten';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editHeading(heading);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Löschen';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteHeading(heading);
        };

        const generateBtn = document.createElement('button');
        generateBtn.className = 'action-btn generate';
        generateBtn.innerHTML = '✦';
        generateBtn.title = 'Text generieren';
        generateBtn.onclick = (e) => {
            e.stopPropagation();
            generateContentForHeading(heading);
        };

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        actions.appendChild(generateBtn);
        heading.appendChild(actions);

        // Add block inserter after each heading (except the last one)
        addBlockInserterAfter(heading);
    });

    // Add block inserter at the very beginning if there are headings
    if (headings.length > 0) {
        addBlockInserterBefore(headings[0]);
    }

    // Add block inserter at the very end
    addBlockInserterAtEnd();
}

function addBlockInserterBefore(element) {
    const inserter = createBlockInserter();
    element.parentNode.insertBefore(inserter, element);
}

function addBlockInserterAfter(element) {
    const inserter = createBlockInserter();
    
    // Find the next heading or end of content
    let nextElement = element.nextElementSibling;
    while (nextElement && nextElement.classList.contains('generated-content')) {
        nextElement = nextElement.nextElementSibling;
    }
    
    if (nextElement) {
        element.parentNode.insertBefore(inserter, nextElement);
    } else {
        element.parentNode.appendChild(inserter);
    }
}

function addBlockInserterAtEnd() {
    const outlineContent = document.getElementById('outlineContent');
    if (!outlineContent) return;
    
    const inserter = createBlockInserter();
    outlineContent.appendChild(inserter);
}

function createBlockInserter() {
    const inserter = document.createElement('div');
    inserter.className = 'block-inserter';
    
    const trigger = document.createElement('div');
    trigger.className = 'block-inserter-trigger';
    trigger.innerHTML = '+';
    trigger.title = 'Überschrift hinzufügen';
    
    const options = document.createElement('div');
    options.className = 'block-inserter-options';
    
    const h2Btn = document.createElement('button');
    h2Btn.className = 'block-option-btn';
    h2Btn.innerHTML = 'H2';
    h2Btn.title = 'Hauptüberschrift hinzufügen';
    h2Btn.onclick = (e) => {
        e.stopPropagation();
        insertHeading('h2', inserter);
    };
    
    const h3Btn = document.createElement('button');
    h3Btn.className = 'block-option-btn';
    h3Btn.innerHTML = 'H3';
    h3Btn.title = 'Unterüberschrift hinzufügen';
    h3Btn.onclick = (e) => {
        e.stopPropagation();
        insertHeading('h3', inserter);
    };
    
    options.appendChild(h2Btn);
    options.appendChild(h3Btn);
    
    inserter.appendChild(trigger);
    inserter.appendChild(options);
    
    // Event listeners for show/hide
    inserter.addEventListener('mouseenter', () => {
        inserter.classList.add('show');
        trigger.style.opacity = '1';
    });
    
    inserter.addEventListener('mouseleave', () => {
        if (!options.classList.contains('show')) {
            inserter.classList.remove('show');
            trigger.style.opacity = '0';
        }
        options.classList.remove('show');
    });
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        options.classList.toggle('show');
    });
    
    // Hide options when clicking outside
    document.addEventListener('click', (e) => {
        if (!inserter.contains(e.target)) {
            options.classList.remove('show');
            inserter.classList.remove('show');
        }
    });
    
    return inserter;
}

function insertHeading(type, inserter) {
    const newHeading = document.createElement(type);
    newHeading.textContent = 'Neue Überschrift';
    
    // Insert the heading before the inserter
    inserter.parentNode.insertBefore(newHeading, inserter);
    
    // Refresh all heading actions and inserters
    setTimeout(() => {
        addHeadingActions();
        
        // Automatically start editing the new heading
        editHeading(newHeading);
        
        showStatusMessage(`✅ ${type.toUpperCase()}-Überschrift hinzugefügt! Bearbeite den Text direkt.`);
    }, 100);
    
    // Hide the options
    const options = inserter.querySelector('.block-inserter-options');
    if (options) {
        options.classList.remove('show');
    }
    inserter.classList.remove('show');
}

function editHeading(heading) {
    const actionsElement = heading.querySelector('.heading-actions');
    
    let currentText = heading.textContent.trim();
    if (actionsElement) {
        const actionsText = actionsElement.textContent.trim();
        currentText = currentText.replace(actionsText, '').trim();
    }
    
    const originalActions = actionsElement ? actionsElement.cloneNode(true) : null;
    
    if (actionsElement) {
        actionsElement.remove();
    }
    
    const input = document.createElement('input');
    input.className = 'heading-edit-input';
    input.type = 'text';
    input.value = currentText;
    
    heading.innerHTML = '';
    heading.appendChild(input);
    
    input.focus();
    input.select();
    
    let isHandled = false;
    
    function saveEdit() {
        if (isHandled) return;
        isHandled = true;
        
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            heading.textContent = newText;
            if (originalActions) {
                heading.appendChild(originalActions);
                reattachEventListeners(heading);
            }
        } else if (newText === currentText) {
            heading.textContent = currentText;
            if (originalActions) {
                heading.appendChild(originalActions);
                reattachEventListeners(heading);
            }
        } else {
            heading.textContent = currentText;
            if (originalActions) {
                heading.appendChild(originalActions);
                reattachEventListeners(heading);
            }
            showStatusMessage('❌ Überschrift-Änderung abgebrochen (leerer Text)');
        }
    }
    
    function cancelEdit() {
        if (isHandled) return;
        isHandled = true;
        
        heading.textContent = currentText;
        if (originalActions) {
            heading.appendChild(originalActions);
            reattachEventListeners(heading);
        }
    }
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
    
    input.addEventListener('blur', saveEdit);
}

function reattachEventListeners(heading) {
    const actions = heading.querySelector('.heading-actions');
    if (!actions) return;
    
    const editBtn = actions.querySelector('.edit');
    const deleteBtn = actions.querySelector('.delete');
    const generateBtn = actions.querySelector('.generate');
    
    if (editBtn) {
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editHeading(heading);
        };
    }
    
    if (deleteBtn) {
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteHeading(heading);
        };
    }
    
    if (generateBtn) {
        generateBtn.onclick = (e) => {
            e.stopPropagation();
            generateContentForHeading(heading);
        };
    }
}

function deleteHeading(heading) {
    const actionsElement = heading.querySelector('.heading-actions');
    let headingText = heading.textContent.trim();
    
    if (actionsElement) {
        const actionsText = actionsElement.textContent.trim();
        headingText = headingText.replace(actionsText, '').trim();
    }
    
    const isH2 = heading.tagName === 'H2';
    
    if (!confirm(`Möchtest du "${headingText}" wirklich löschen?${isH2 ? '\n\n(Alle untergeordneten H3-Überschriften werden mitgelöscht)' : ''}`)) {
        return;
    }
    
    try {
        const outlineContent = document.getElementById('outlineContent');
        if (!outlineContent || !outlineContent.contains(heading)) {
            return;
        }
        
        if (isH2) {
            let currentElement = heading;
            const elementsToDelete = [heading];
            
            while (currentElement.nextElementSibling) {
                const nextElement = currentElement.nextElementSibling;
                
                if (nextElement.tagName === 'H2') {
                    break;
                }
                
                if (nextElement.tagName === 'H3' || nextElement.classList.contains('generated-content')) {
                    elementsToDelete.push(nextElement);
                }
                
                currentElement = nextElement;
            }
            
            elementsToDelete.forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
            
        } else {
            const elementsToDelete = [heading];
            
            let nextElement = heading.nextElementSibling;
            while (nextElement && nextElement.classList.contains('generated-content')) {
                elementsToDelete.push(nextElement);
                nextElement = nextElement.nextElementSibling;
            }
            
            elementsToDelete.forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        }
        
    } catch (error) {
        showStatusMessage(`❌ Fehler beim Löschen: ${error.message}`);
    }
}

// VERBESSERTE generateContentForHeading Funktion mit vollem Kontext
async function generateContentForHeading(heading) {
    const headingText = heading.textContent.trim();
    const headingLevel = heading.tagName;
    const isH2 = headingLevel === 'H2';
    
    const outlineContent = document.getElementById('outlineContent');
    const allElements = Array.from(outlineContent.children);
    const headingIndex = allElements.indexOf(heading);
    
    let hasSubHeadings = false;
    if (isH2) {
        for (let i = headingIndex + 1; i < allElements.length; i++) {
            const element = allElements[i];
            if (element.tagName === 'H2') break;
            if (element.tagName === 'H3') {
                hasSubHeadings = true;
                break;
            }
        }
    }
    
    const generateBtn = heading.querySelector('.action-btn.generate');
    if (generateBtn) {
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
    }
    
    showTyping();
    
    try {
        // Sammle alle Kontextinformationen
        const blogTitle = document.getElementById('blogTitle')?.value.trim() || '';
        const keywords = getKeywordsString();
        const wordCount = document.getElementById('wordCount')?.value || '1500';
        const tone = document.getElementById('toneStyle')?.value || 'freundlich-beratend';
        
        // Erweiterte Prompt mit allen Kontextinformationen
        const enhancedPrompt = `BLOG-HAUPTTITEL: "${blogTitle}"

AKTUELLE HEADLINE: "${headingText}"

KEYWORDS (integriere diese natürlich): ${keywords || 'Hochzeit, Hochzeitsplanung'}

TONFALL & STIL: ${tone.replace('-', ' & ')}

ZIELWORTANZAHL GESAMT: ${wordCount} Wörter

TEXTTYP: ${hasSubHeadings ? 'Kurze Einleitung (da Unterüberschriften folgen)' : 'Vollständiger Abschnitt'}

WICHTIG FÜR SEO: Strukturiere den Text in mehrere Absätze (2-4 Sätze pro Absatz) für bessere Lesbarkeit. Nutze <br><br> zwischen den Absätzen.

AUFGABE: Generiere einen informativen Text für die oben genannte Headline. Der Text soll sich nahtlos in den Gesamtblog einfügen, die Keywords natürlich verwenden und in sinnvolle Absätze unterteilt sein.`;

        const demoContent = await callAI(enhancedPrompt, 'content-generation');
        
        hideTyping();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'generated-content';
        
        // Konvertiere Zeilenwechsel zu HTML-Absätzen
        const formattedContent = demoContent.split('\n\n').map(paragraph => 
            paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
        ).filter(p => p).join('');
        
        contentDiv.innerHTML = formattedContent || `<p>${demoContent}</p>`;
        
        heading.insertAdjacentElement('afterend', contentDiv);
        
        // Füge Content-Actions hinzu
        addContentActions(contentDiv);
        
        const contentType = hasSubHeadings ? 'Einleitungstext' : 'Vollständiger Abschnitt';
        showStatusMessage(`✅ ${contentType} erfolgreich generiert für "${headingText}"`);
        
    } catch (error) {
        hideTyping();
        showStatusMessage(`❌ <strong>Fehler bei der Content-Generierung:</strong> ${error.message}`);
    } finally {
        if (generateBtn) {
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
        }
    }
}

function addContentActions(contentDiv) {
    const actions = document.createElement('div');
    actions.className = 'content-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit';
    editBtn.innerHTML = '✎';
    editBtn.title = 'Text bearbeiten';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        editContent(contentDiv);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Löschen';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteContent(contentDiv);
    };

    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'action-btn magic';
    regenerateBtn.innerHTML = '🪄';
    regenerateBtn.title = 'Neu generieren';
    regenerateBtn.onclick = (e) => {
        e.stopPropagation();
        regenerateContent(contentDiv);
    };

    const improveBtn = document.createElement('button');
    improveBtn.className = 'action-btn magic';
    improveBtn.innerHTML = '✨';
    improveBtn.title = 'Mit KI verbessern';
    improveBtn.onclick = (e) => {
        e.stopPropagation();
        openChatPopup(contentDiv);
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(regenerateBtn);
    actions.appendChild(improveBtn);
    contentDiv.appendChild(actions);
}

function editContent(contentDiv) {
    const currentParagraphs = Array.from(contentDiv.querySelectorAll('p')).map(p => p.textContent).join('\n\n');
    const textarea = document.createElement('textarea');
    textarea.value = currentParagraphs;
    textarea.style.width = '100%';
    textarea.style.minHeight = '120px';
    textarea.style.background = 'rgba(0, 0, 0, 0.5)';
    textarea.style.border = '1px solid #7209b7';
    textarea.style.borderRadius = '8px';
    textarea.style.color = 'white';
    textarea.style.padding = '12px';
    textarea.style.fontFamily = 'inherit';
    textarea.style.fontSize = '14px';
    textarea.style.outline = 'none';
    textarea.style.resize = 'vertical';
    
    contentDiv.innerHTML = '';
    contentDiv.appendChild(textarea);
    textarea.focus();
    
    function saveEdit() {
        const newText = textarea.value.trim();
        if (newText) {
            // Konvertiere Absätze zu HTML
            const formattedContent = newText.split('\n\n').map(paragraph => 
                paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
            ).filter(p => p).join('');
            
            contentDiv.innerHTML = formattedContent || `<p>${newText}</p>`;
            addContentActions(contentDiv);
        } else {
            deleteContent(contentDiv);
        }
    }
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            const formattedContent = currentParagraphs.split('\n\n').map(paragraph => 
                paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
            ).filter(p => p).join('');
            contentDiv.innerHTML = formattedContent || `<p>${currentParagraphs}</p>`;
            addContentActions(contentDiv);
        }
    });
    
    textarea.addEventListener('blur', saveEdit);
}

function deleteContent(contentDiv) {
    if (confirm('Möchtest du diesen generierten Content wirklich löschen?')) {
        contentDiv.remove();
    }
}

async function regenerateContent(contentDiv) {
    const regenerateBtn = contentDiv.querySelector('.action-btn.magic');
    if (regenerateBtn) {
        regenerateBtn.classList.add('loading');
        regenerateBtn.disabled = true;
    }
    
    showTyping();
    
    try {
        const newContent = await callAI(`Generiere einen neuen, alternativen Text für diesen Abschnitt eines Hochzeitsblogs. Der Text sollte das gleiche Thema behandeln, aber anders formuliert und mit frischen Ideen. 

WICHTIG: Strukturiere den Text in mehrere sinnvolle Absätze (2-4 Sätze pro Absatz) für bessere SEO-Lesbarkeit. Verwende doppelte Zeilenwechsel zwischen den Absätzen.`, 'content-regeneration');
        
        hideTyping();
        
        const currentActions = contentDiv.querySelector('.content-actions');
        if (currentActions) currentActions.remove();
        
        // Konvertiere Zeilenwechsel zu HTML-Absätzen
        const formattedContent = newContent.split('\n\n').map(paragraph => 
            paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
        ).filter(p => p).join('');
        
        contentDiv.innerHTML = formattedContent || `<p>${newContent}</p>`;
        addContentActions(contentDiv);
        
        showStatusMessage('✅ Content erfolgreich neu generiert!');
        
    } catch (error) {
        hideTyping();
        showStatusMessage(`❌ <strong>Fehler bei der Neu-Generierung:</strong> ${error.message}`);
    } finally {
        if (regenerateBtn) {
            regenerateBtn.classList.remove('loading');
            regenerateBtn.disabled = false;
        }
    }
}

// Chat Popup Functions
function openChatPopup(contentElement) {
    const allParagraphs = Array.from(contentElement.querySelectorAll('p')).map(p => p.textContent).join('\n\n');
    const textContent = allParagraphs || contentElement.textContent || '';
    
    if (!textContent.trim()) {
        showStatusMessage('❌ Kein Text zum Verbessern gefunden!');
        return;
    }

    currentChatContent = contentElement;
    chatMessages = [];
    improvedTextContent = '';
    
    // Set original text
    const originalTextDisplay = document.getElementById('originalTextDisplay');
    if (originalTextDisplay) {
        originalTextDisplay.textContent = textContent;
    }
    
    // Clear chat messages
    const chatPopupMessages = document.getElementById('chatPopupMessages');
    if (chatPopupMessages) {
        chatPopupMessages.innerHTML = '';
    }
    
    // Reset input
    const chatInput = document.getElementById('chatPopupInput');
    if (chatInput) {
        chatInput.value = '';
        chatInput.style.height = 'auto';
    }
    
    // Disable confirm button initially
    const confirmBtn = document.getElementById('confirmImprovedTextBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
    }
    
    // Show popup
    const overlay = document.getElementById('chatPopupOverlay');
    if (overlay) {
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
    
    // Add initial AI message
    setTimeout(() => {
        addChatMessage('bot', '👋 Hallo! Ich helfe dir dabei, deinen Text zu verbessern. Beschreibe einfach, was geändert werden soll - zum Beispiel:<br><br>• "Mache den Text emotionaler"<br>• "Füge mehr praktische Tipps hinzu"<br>• "Verkürze den Text auf die Kernpunkte"<br>• "Mache ihn SEO-freundlicher"<br>• "Teile den Text in mehr Absätze auf"');
        
        // Focus input
        const chatInput = document.getElementById('chatPopupInput');
        if (chatInput) {
            chatInput.focus();
        }
    }, 300);
}

function closeChatPopup() {
    const overlay = document.getElementById('chatPopupOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }
    
    // Reset variables
    currentChatContent = null;
    chatMessages = [];
    improvedTextContent = '';
    isChatGenerating = false;
}

function addChatMessage(type, content, isImprovedText = false) {
    const chatPopupMessages = document.getElementById('chatPopupMessages');
    if (!chatPopupMessages) return;
    
    const message = document.createElement('div');
    message.className = `popup-message ${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'popup-message-content';
    
    if (isImprovedText) {
        messageContent.innerHTML = `
            <div class="improved-text-label">✨ Verbesserter Text:</div>
            <div class="improved-text-preview">${content}</div>
        `;
    } else {
        messageContent.innerHTML = content;
    }
    
    message.appendChild(messageContent);
    chatPopupMessages.appendChild(message);
    
    // Scroll to bottom
    chatPopupMessages.scrollTop = chatPopupMessages.scrollHeight;
    
    // Store message
    chatMessages.push({ type, content, isImprovedText });
}

function showPopupTyping() {
    const popupTyping = document.getElementById('popupTyping');
    const chatPopupMessages = document.getElementById('chatPopupMessages');
    if (popupTyping) {
        popupTyping.style.display = 'block';
    }
    if (chatPopupMessages) {
        chatPopupMessages.scrollTop = chatPopupMessages.scrollHeight + 100;
    }
}

function hidePopupTyping() {
    const popupTyping = document.getElementById('popupTyping');
    if (popupTyping) {
        popupTyping.style.display = 'none';
    }
}

async function sendChatMessage() {
    const chatInput = document.getElementById('chatPopupInput');
    const sendBtn = document.getElementById('chatPopupSendBtn');
    
    if (!chatInput || !sendBtn) return;
    
    const message = chatInput.value.trim();
    if (!message || isChatGenerating) return;
    
    // Add user message
    addChatMessage('user', message);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Disable send button
    sendBtn.disabled = true;
    isChatGenerating = true;
    
    // Show typing
    showPopupTyping();
    
    try {
        // Get original text
        const originalText = document.getElementById('originalTextDisplay')?.textContent || '';
        
        // Call AI for text improvement
        const improvedText = await callAI(`Verbessere folgenden Text basierend auf dieser Anweisung: "${message}"

Originaltext: "${originalText}"

Anweisung: ${message}

WICHTIG: Strukturiere den verbesserten Text in sinnvolle Absätze (2-4 Sätze pro Absatz) für bessere SEO-Lesbarkeit. Verwende doppelte Zeilenwechsel zwischen den Absätzen.

Gib nur den verbesserten Text zurück, ohne zusätzliche Erklärungen.`, 'text-improvement');
        
        improvedTextContent = improvedText;
        
        hidePopupTyping();
        
        // Add AI response with improved text
        addChatMessage('bot', improvedText, true);
        
        // Enable confirm button
        const confirmBtn = document.getElementById('confirmImprovedTextBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
        
        // Add follow-up message
        setTimeout(() => {
            addChatMessage('bot', '✅ Perfekt! Der Text wurde entsprechend deiner Anfrage überarbeitet. Du kannst weitere Änderungen vornehmen oder den verbesserten Text übernehmen.');
        }, 1000);
        
    } catch (error) {
        hidePopupTyping();
        addChatMessage('bot', `❌ Fehler bei der Text-Verbesserung: ${error.message}`);
    } finally {
        sendBtn.disabled = false;
        isChatGenerating = false;
        chatInput.focus();
    }
}

function confirmImprovedText() {
    if (!currentChatContent || !improvedTextContent.trim()) {
        return;
    }
    
    // Remove existing content-actions to avoid duplication
    const existingActions = currentChatContent.querySelector('.content-actions');
    if (existingActions) {
        existingActions.remove();
    }
    
    // Replace the entire content with improved text
    // Konvertiere Zeilenwechsel zu HTML-Absätzen
    const formattedContent = improvedTextContent.split('\n\n').map(paragraph => 
        paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
    ).filter(p => p).join('');
    
    currentChatContent.innerHTML = formattedContent || `<p>${improvedTextContent.replace(/\n/g, '<br>')}</p>`;
    
    // Re-add content actions
    addContentActions(currentChatContent);
    
    // Close popup
    closeChatPopup();
    
    // Show success message
    showStatusMessage('✅ Text erfolgreich verbessert und übernehmen!');
}

// Auto-resize textarea
function setupTextareaAutoResize() {
    const chatInput = document.getElementById('chatPopupInput');
    if (!chatInput) return;
    
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

// Erweiterte generateSEOReport Funktion mit Keyword Density Tracker
function generateSEOReport() {
    const outlineContent = document.getElementById('outlineContent');
    if (!outlineContent) {
        showStatusMessage('❌ Kein Blog-Content für SEO-Analyse gefunden!');
        return;
    }

    // Sammle allen Content für die Analyse
    let allText = '';
    const allElements = Array.from(outlineContent.children);
    
    allElements.forEach(element => {
        if (element.tagName === 'H2' || element.tagName === 'H3') {
            allText += ' ' + element.textContent.replace(/✎×✦/g, '').trim();
        } else if (element.classList.contains('generated-content')) {
            const paragraphs = element.querySelectorAll('p');
            paragraphs.forEach(p => {
                allText += ' ' + p.textContent.trim();
            });
        }
    });

    // Basis-Metriken berechnen
    const title = document.getElementById('blogTitle')?.value || '';
    const h2Count = outlineContent.querySelectorAll('h2').length;
    const h3Count = outlineContent.querySelectorAll('h3').length;
    const paragraphs = outlineContent.querySelectorAll('.generated-content p').length;
    const wordCount = allText.split(' ').filter(word => word.trim().length > 0).length;
    
    // Keyword-Density Analyse (falls Keywords vorhanden)
    let keywordAnalysis = null;
    if (selectedKeywords.length > 0) {
        const tracker = new KeywordDensityTracker(selectedKeywords);
        keywordAnalysis = tracker.generateSEOReport(allText);
    }
    
    // Basis SEO-Score berechnen
    let baseScore = 50;
    if (title.length >= 30 && title.length <= 60) baseScore += 15;
    if (wordCount >= 300) baseScore += 15;
    if (h2Count >= 3) baseScore += 10;
    if (h3Count >= 4) baseScore += 5;
    if (paragraphs >= 5) baseScore += 5;
    
    // Kombiniere mit Keyword-Score falls vorhanden
    const finalScore = keywordAnalysis ? 
        Math.round((baseScore + keywordAnalysis.summary.score) / 2) : 
        Math.min(baseScore, 85); // Max 85 ohne Keywords

    const seoReport = `
        <div style="background: rgba(40, 167, 69, 0.1); border: 1px solid rgba(40, 167, 69, 0.3); border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h4 style="color: #28a745; margin-bottom: 16px; font-size: 18px;">📊 SEO-Analyse Report</h4>
            
            <!-- Basis-Metriken -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <h5 style="color: #20c997; margin-bottom: 8px;">📈 Basis-Metriken</h5>
                <p style="margin: 6px 0;"><strong>Titel-Länge:</strong> ${title.length >= 30 && title.length <= 60 ? '✅' : '⚠️'} ${title.length} Zeichen ${title.length >= 30 && title.length <= 60 ? '(optimal)' : title.length < 30 ? '(zu kurz)' : '(zu lang)'}</p>
                <p style="margin: 6px 0;"><strong>Wortanzahl:</strong> ${wordCount >= 300 ? '✅' : '⚠️'} ${wordCount} Wörter ${wordCount >= 300 ? '(gut)' : '(zu kurz)'}</p>
                <p style="margin: 6px 0;"><strong>H2-Struktur:</strong> ${h2Count >= 3 ? '✅' : '⚠️'} ${h2Count} H2-Überschriften ${h2Count >= 3 ? '(gut strukturiert)' : '(mehr H2s empfohlen)'}</p>
                <p style="margin: 6px 0;"><strong>H3-Struktur:</strong> ${h3Count >= 4 ? '✅' : '⚠️'} ${h3Count} H3-Überschriften</p>
                <p style="margin: 6px 0;"><strong>Absätze:</strong> ${paragraphs >= 5 ? '✅' : '⚠️'} ${paragraphs} Absätze ${paragraphs >= 5 ? '(gute Lesbarkeit)' : '(mehr Absätze empfohlen)'}</p>
            </div>

            ${keywordAnalysis ? `
            <!-- Keyword-Density Analyse -->
            <div style="background: rgba(114, 9, 183, 0.1); border: 1px solid rgba(114, 9, 183, 0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <h5 style="color: #7209b7; margin-bottom: 8px;">🎯 Keyword-Density Analyse</h5>
                
                ${keywordAnalysis.keywords.map(kw => `
                    <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${kw.status === 'optimal' ? '#28a745' : kw.status === 'low' ? '#ffc107' : '#dc3545'};">
                        <strong>"${kw.keyword}":</strong> 
                        ${kw.count} mal (${kw.density}%) 
                        <span style="color: ${kw.status === 'optimal' ? '#28a745' : kw.status === 'low' ? '#ffc107' : '#dc3545'};">
                            ${kw.status === 'optimal' ? '✅ Optimal' : kw.status === 'low' ? '⚠️ Zu wenig' : '🚨 Zu viel'}
                        </span>
                        <br><small style="opacity: 0.8; color: #ccc;">${kw.recommendation}</small>
                    </div>
                `).join('')}
                
                ${keywordAnalysis.recommendations.length > 0 ? `
                <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <strong style="color: #7209b7;">💡 Empfehlungen:</strong>
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        ${keywordAnalysis.recommendations.map(rec => `<li style="margin: 4px 0; color: #e0e0e0;">${rec}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            ` : `
            <!-- Keine Keywords definiert -->
            <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <p style="color: #ffc107; margin: 0;">⚠️ <strong>Keine Keywords definiert:</strong> Füge Keywords hinzu für erweiterte SEO-Analyse</p>
            </div>
            `}

            <!-- Gesamtscore -->
            <div style="text-align: center; padding: 16px; background: linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(32, 201, 151, 0.2)); border-radius: 8px;">
                <h4 style="color: #28a745; margin-bottom: 8px;">🏆 Gesamt SEO-Score</h4>
                <div style="font-size: 32px; font-weight: bold; color: ${finalScore >= 80 ? '#28a745' : finalScore >= 60 ? '#ffc107' : '#dc3545'};">
                    ${finalScore}/100
                </div>
                <p style="margin: 8px 0; color: #ccc;">
                    ${finalScore >= 80 ? '🎉 Hervorragend! SEO-ready.' : 
                      finalScore >= 60 ? '👍 Gut! Noch kleine Verbesserungen möglich.' : 
                      '🔧 Verbesserungsbedarf vorhanden.'}
                </p>
            </div>

            <!-- Quick Actions -->
            <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
                ${wordCount < 300 ? '<button onclick="generateMoreContent()" style="background: #7209b7; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">📝 Mehr Content generieren</button>' : ''}
                ${selectedKeywords.length === 0 ? '<button onclick="focusKeywordInput()" style="background: #ff6b35; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">🎯 Keywords hinzufügen</button>' : ''}
                ${h2Count < 3 ? '<button onclick="addMoreHeadings()" style="background: #20c997; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">📋 Mehr Überschriften</button>' : ''}
            </div>
        </div>
    `;
    
    showStatusMessage(seoReport);
}

// Hilfsfunktionen für Quick Actions
function generateMoreContent() {
    showStatusMessage('💡 Tipp: Nutze die ✦ Buttons bei den Überschriften um mehr Content zu generieren!');
}

function focusKeywordInput() {
    const keywordInput = document.getElementById('mainKeyword');
    if (keywordInput) {
        keywordInput.focus();
        keywordInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showStatusMessage('🎯 Füge hier deine Haupt-Keywords hinzu für bessere SEO-Analyse!');
    }
}

function addMoreHeadings() {
    showStatusMessage('📋 Nutze die + Buttons in der Gliederung um mehr Überschriften hinzuzufügen!');
}

// Add initial block inserter for empty outline
function addInitialBlockInserter() {
    const outlineContainer = document.getElementById('outlineContainer');
    const outlineContent = document.getElementById('outlineContent');
    
    if (!outlineContent || !outlineContainer) return;
    
    // Check if outline is visible and empty
    if (!outlineContainer.classList.contains('visible')) {
        return;
    }
    
    const hasContent = outlineContent.children.length > 0;
    if (!hasContent) {
        const inserter = createBlockInserter();
        outlineContent.appendChild(inserter);
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    initKeywordTagSystem();
    setupTextareaAutoResize();
    updateKeywordCounter(); // Initialize counter
    
    // Add initial block inserter even without outline
    addInitialBlockInserter();
    
    setTimeout(() => {
        showStatusMessage("🎯 <strong>Wedding Blog AI ist bereit!</strong><br><br>Konfiguriere deine KI-API und beginne mit der Eingabe deines Blog-Titels. Klicke auf den Zauberstab für SEO-Optimierung und generiere anschließend eine strukturierte Gliederung.<br><br>💡 <em>Tipp: Nutze aussagekräftige Keywords für bessere SEO-Ergebnisse! Maximal 3 Keywords, das erste wird als primäres SEO-Keyword hervorgehoben.</em>");
    }, 1000);

    // Enter-Taste für Titel-Input
    const titleInput = document.getElementById('blogTitle');
    if (titleInput) {
        titleInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                optimizeTitle();
            }
        });
    }

    // Close popup on overlay click
    const overlay = document.getElementById('chatPopupOverlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeChatPopup();
            }
        });
    }

    // ESC key to close popup
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.getElementById('chatPopupOverlay');
            if (popup && popup.classList.contains('visible')) {
                closeChatPopup();
            }
        }
    });
});
