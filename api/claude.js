// api/claude.js - Vercel API Route mit Memberspot Integration & Rate Limiting

import { createClient } from '@supabase/supabase-js';

// Supabase Client Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rate Limits Configuration
const RATE_LIMITS = {
    'title-optimization': { daily: 20, hourly: 5, credits: 1 },
    'outline-generation': { daily: 10, hourly: 3, credits: 3 },
    'content-generation': { daily: 50, hourly: 10, credits: 2 },
    'text-improvement': { daily: 30, hourly: 8, credits: 1 },
    'content-regeneration': { daily: 25, hourly: 6, credits: 2 },
    'general': { daily: 100, hourly: 20, credits: 1 }
};

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-User-Token');

    // Preflight OPTIONS Request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Nur POST Requests erlauben
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, type = 'general' } = req.body;
        const userId = req.headers['x-user-id'];
        const userToken = req.headers['x-user-token'];

        // Input Validation
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required and must be a string' });
        }

        if (!userId) {
            return res.status(401).json({ 
                error: 'User ID fehlt. Bitte über Memberspot anmelden.',
                code: 'NO_USER_ID'
            });
        }

        // Memberspot Token Validation
        const isValidToken = await validateMemberspotToken(userId, userToken);
        if (!isValidToken) {
            return res.status(401).json({ 
                error: 'Ungültiger User Token. Bitte neu anmelden.',
                code: 'INVALID_TOKEN'
            });
        }

        // Rate Limiting Check
        const rateLimitResult = await checkRateLimit(userId, type);
        if (!rateLimitResult.allowed) {
            return res.status(429).json({ 
                error: rateLimitResult.message,
                code: 'RATE_LIMIT_EXCEEDED',
                limits: rateLimitResult.limits,
                resetTime: rateLimitResult.resetTime
            });
        }

        // API Key Check
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'API Key nicht konfiguriert. Kontaktiere den Support.',
                code: 'API_KEY_MISSING'
            });
        }

        // System Prompts (gleich wie vorher)
        const systemPrompts = {
            'title-optimization': 'Du bist ein SEO-Experte für die Hochzeitsbranche. Du sprichst die Zielgruppe immer in der Du-Form an und verwendest niemals die Sie-Form. Optimiere den gegebenen Titel für bessere Suchmaschinenrankings. REGELN: - Hauptkeyword möglichst weit vorne platzieren. - Länge: 50–60 Zeichen (niemals über 60). - Emotional ansprechend und relevant für Hochzeitspaare. - Zahlen und spezifische Begriffe einbauen, wenn sinnvoll. - Clickbait vermeiden, aber Neugier wecken. - Keine Füllwörter oder unnötigen Zeichen. - Verwende, wenn passend, das Format: [Keyword(s)]: [Aufruf]. - Aufruf-Beispiele: Der ultimative Guide für XXXXX / Inspiration & Tipps für eure Hochzeit am Strand! / Das sind die schönsten Spots an der Nord- und Ostsee / Alles was ihr für eure Hochzeit wissen müsst! / Das sind die 6 schönsten Orte für eure Sylt-Hochzeit. Gib NUR den optimierten Titel aus, ohne Erklärungen oder Zusatztexte.',

            'outline-generation': 'Du bist ein SEO-Experte für Hochzeitsblogs. Du sprichst die Zielgruppe immer in der Du-Form an und verwendest niemals die Sie-Form. Erstelle eine HTML-Gliederung (<h2> und <h3>) für einen Blogartikel basierend auf den angegebenen Keywords. Verwende nur die ersten 3 Keywords für die Platzierung. Regeln für Keyword 1 (das wichtigste Keyword): 1) Es MUSS in der ersten <h2>-Überschrift erscheinen. 2) Es MUSS in der letzten <h2>-Überschrift erscheinen. 3) Es oder eine semantische Alternative MUSS auch in mindestens 50 % der anderen <h2>-Überschriften vorkommen (aufgerundet). 4) Es MUSS in mindestens einer der ersten drei <h3>-Überschriften vorkommen. 5) Es MUSS in mindestens 30 % aller <h3>-Überschriften vorkommen (aufgerundet). Regeln für Keyword 2 und 3: Sollten möglichst in frühen Überschriften vorkommen und insgesamt sinnvoll verteilt werden. Stilregeln für Natürlichkeit: 1) Überschriften sollen wie von einem Menschen geschrieben wirken: variierte Satzlängen, natürliche Sprache, keine reinen Keyword-Listen. 2) Verwende hin und wieder alltagssprachliche Formulierungen oder kleine Einschübe (z. B. "... und warum das gar nicht so einfach ist"). 3) Nutze statt typografischem Gedankenstrich "—" das einfache Minuszeichen "-" für Einschübe. 4) Erzeuge Leselust durch präzise, bildhafte oder leicht unerwartete Formulierungen. Alle Keywords müssen natürlich eingebaut sein, keine unnatürlichen Wiederholungen. Antworte NUR mit <h2> und <h3>-Tags, ohne Erklärungen oder andere HTML-Elemente.',

            'content-generation': 'Du bist ein SEO-optimierter Hochzeitsexperte und Content-Writer. Du sprichst die Zielgruppe immer in der Du-Form an und verwendest niemals die Sie-Form. Schreibe einen informativen, natürlich formulierten Textabsatz für einen Hochzeitsblog. WICHTIGE KONTEXTINFORMATIONEN werden dir im Prompt mitgegeben. REGELN: - Integriere die angegebenen Keywords natürlich in den Text, platziere das Hauptkeyword möglichst im ersten Satz - Nutze passende Synonyme und verwandte Begriffe - Schreibe im angegebenen Tonfall - Der Text gehört zu einem größeren Blogbeitrag. Schreibe nur passend zur angegebenen H2- oder H3-Überschrift – nicht zum kompletten Hauptthema. Das Hauptthema dient nur als Kontext. - Wenn die Überschrift eine <h2> ist, schreibe nur eine kurze Einleitung von ca. 50 Wörtern, die in das Thema einführt und ankündigt, was in den folgenden <h3>-Abschnitten behandelt wird (z. B. "Hier erfährst du nun, wie du …"). Der Text unter einer H2 beantwortet das Thema nicht vollständig, sondern dient als Hinführung zu den H3s. - Wenn die Überschrift eine <h3> ist, schreibe den vollständigen Absatz mit 130–200 Wörtern. - Mache den Text praxisorientiert und hilfreich - Keine HTML-Tags, keine Überschriften, nur Fließtext - Schreibstil: Informativ, aktiv und leicht lesbar - Keyword-Dichte ca. 1–2 %, keine unnatürliche Wiederholung - Schreibe mit variabler Satzlänge, konkreten Beispielen, Alltagssprache (z. B. ca., u.a., naja, halt, eigentlich), persönlichen Füllwörtern (irgendwie, quasi, echt, sozusagen), subjektiven Einschüben („… was ehrlich gesagt nicht so prickelnd war"), präzisen statt generischen Formulierungen, leichten formellen Fehlern wie Minuszeichen statt Gedankenstrich und einem lockeren, beobachtenden Stil ohne lehrbuchartige Struktur. Antworte NUR mit dem Textabsatz, ohne Metakommentare.',

            'text-improvement': 'Du bist ein Texteditor für Hochzeitsblogs. Du sprichst die Zielgruppe immer in der Du-Form an und verwendest niemals die Sie-Form. Antworte NUR mit dem verbesserten Text, keine Erklärungen oder Kommentare.',

            'content-regeneration': 'Du bist ein Hochzeits-Content-Writer. Du sprichst die Zielgruppe immer in der Du-Form an und verwendest niemals die Sie-Form. Antworte NUR mit dem neuen Text-Inhalt, keine Metakommentare.',

            'general': 'Du bist ein hilfreicher Assistent für Hochzeitsplanung und Content-Erstellung. Du sprichst die Zielgruppe immer in der Du-Form an und verwendest niemals die Sie-Form.'
        };

        const systemPrompt = systemPrompts[type] || systemPrompts['general'];

        // Claude API Aufruf
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                temperature: 0.7,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Claude API Error:', errorData);
            
            if (response.status === 401) {
                return res.status(500).json({ 
                    error: 'API-Konfigurationsfehler. Kontaktiere den Support.',
                    code: 'API_UNAUTHORIZED'
                });
            }
            
            if (response.status === 429) {
                return res.status(500).json({ 
                    error: 'Claude API Limit erreicht. Versuche es später erneut.',
                    code: 'API_RATE_LIMIT'
                });
            }
            
            return res.status(500).json({ 
                error: `Claude API Fehler: ${response.status}`,
                code: 'API_ERROR'
            });
        }

        const data = await response.json();
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            return res.status(500).json({ 
                error: 'Unerwartete API-Antwort von Claude',
                code: 'INVALID_API_RESPONSE'
            });
        }

        let content = data.content[0].text;

        // Content Bereinigung für Titel-Optimierung
        if (type === 'title-optimization') {
            content = content.replace(/^["']|["']$/g, '').trim();
            const lines = content.split('\n');
            content = lines[0].trim();
            content = content.replace(/^(Titel|Optimiert|Neu|Verbesserter Titel):\s*/i, '');
        }

        // Rate Limit Usage tracken
        await trackRateLimit(userId, type);

        // Erfolgreiche Antwort mit Usage Info
        const remainingQuota = await getRemainingQuota(userId, type);
        
        res.status(200).json({ 
            content: content,
            type: type,
            usage: data.usage || null,
            quota: remainingQuota
        });

    } catch (error) {
        console.error('API Route Error:', error);
        
        res.status(500).json({ 
            error: `Server-Fehler: ${error.message}`,
            code: 'INTERNAL_ERROR'
        });
    }
}

// Memberspot Token Validation
async function validateMemberspotToken(userId, token) {
    if (!token) return false;
    
    try {
        // Einfache Token-Validation - in Production sollte das ein JWT sein
        // oder eine Anfrage an Memberspot API
        const expectedToken = process.env.MEMBERSPOT_SECRET_KEY + userId;
        return token === expectedToken;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Rate Limiting Check
async function checkRateLimit(userId, requestType) {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentHour = now.getHours();
        
        const limits = RATE_LIMITS[requestType] || RATE_LIMITS['general'];
        
        // Daily Check
        const { data: dailyData, error: dailyError } = await supabase
            .from('user_requests')
            .select('request_count, credits_used')
            .eq('memberspot_user_id', userId)
            .eq('request_date', today)
            .eq('request_type', requestType)
            .single();

        if (dailyError && dailyError.code !== 'PGRST116') {
            throw dailyError;
        }

        const dailyCount = dailyData?.request_count || 0;
        const dailyCredits = dailyData?.credits_used || 0;

        if (dailyCount >= limits.daily) {
            return {
                allowed: false,
                message: `Tageslimit erreicht: ${limits.daily} ${requestType} Anfragen pro Tag. Morgen geht's weiter!`,
                limits: { daily: limits.daily, current: dailyCount },
                resetTime: new Date(now.getTime() + (24 - now.getHours()) * 60 * 60 * 1000)
            };
        }

        // Hourly Check
        const { data: hourlyData, error: hourlyError } = await supabase
            .from('user_requests_hourly')
            .select('request_count')
            .eq('memberspot_user_id', userId)
            .eq('request_date', today)
            .eq('request_hour', currentHour)
            .eq('request_type', requestType)
            .single();

        if (hourlyError && hourlyError.code !== 'PGRST116') {
            throw hourlyError;
        }

        const hourlyCount = hourlyData?.request_count || 0;

        if (hourlyCount >= limits.hourly) {
            return {
                allowed: false,
                message: `Stundenlimit erreicht: ${limits.hourly} ${requestType} Anfragen pro Stunde. Versuche es in ${60 - now.getMinutes()} Minuten erneut.`,
                limits: { hourly: limits.hourly, current: hourlyCount },
                resetTime: new Date(now.getTime() + (60 - now.getMinutes()) * 60 * 1000)
            };
        }

        return { allowed: true };

    } catch (error) {
        console.error('Rate limit check error:', error);
        // Bei Datenbankfehlern erlauben wir die Anfrage
        return { allowed: true };
    }
}

// Rate Limit Usage tracking
async function trackRateLimit(userId, requestType) {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentHour = now.getHours();
        const credits = RATE_LIMITS[requestType]?.credits || 1;

        // Daily tracking
        await supabase
            .from('user_requests')
            .upsert({
                memberspot_user_id: userId,
                request_date: today,
                request_type: requestType,
                request_count: 1,
                credits_used: credits
            }, {
                onConflict: 'memberspot_user_id,request_date,request_type',
                update: {
                    request_count: 'request_count + 1',
                    credits_used: 'credits_used + ' + credits,
                    updated_at: 'NOW()'
                }
            });

        // Hourly tracking
        await supabase
            .from('user_requests_hourly')
            .upsert({
                memberspot_user_id: userId,
                request_date: today,
                request_hour: currentHour,
                request_type: requestType,
                request_count: 1
            }, {
                onConflict: 'memberspot_user_id,request_date,request_hour,request_type',
                update: {
                    request_count: 'request_count + 1',
                    updated_at: 'NOW()'
                }
            });

    } catch (error) {
        console.error('Rate limit tracking error:', error);
        // Tracking-Fehler sollten die API-Anfrage nicht blockieren
    }
}

// Remaining Quota berechnen
async function getRemainingQuota(userId, requestType) {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentHour = now.getHours();
        
        const limits = RATE_LIMITS[requestType] || RATE_LIMITS['general'];

        // Daily remaining
        const { data: dailyData } = await supabase
            .from('user_requests')
            .select('request_count')
            .eq('memberspot_user_id', userId)
            .eq('request_date', today)
            .eq('request_type', requestType)
            .single();

        const dailyUsed = dailyData?.request_count || 0;

        // Hourly remaining
        const { data: hourlyData } = await supabase
            .from('user_requests_hourly')
            .select('request_count')
            .eq('memberspot_user_id', userId)
            .eq('request_date', today)
            .eq('request_hour', currentHour)
            .eq('request_type', requestType)
            .single();

        const hourlyUsed = hourlyData?.request_count || 0;

        return {
            daily: {
                limit: limits.daily,
                used: dailyUsed,
                remaining: limits.daily - dailyUsed
            },
            hourly: {
                limit: limits.hourly,
                used: hourlyUsed,
                remaining: limits.hourly - hourlyUsed
            }
        };

    } catch (error) {
        console.error('Get remaining quota error:', error);
        return null;
    }
}
