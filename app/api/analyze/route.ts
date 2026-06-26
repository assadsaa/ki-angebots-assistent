import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import * as XLSX from 'xlsx'

export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (['csv', 'tsv', 'txt', 'md'].includes(ext)) {
    for (const enc of ['utf-8', 'latin1', 'utf16le'] as BufferEncoding[]) {
      try { return buffer.toString(enc) } catch { /* try next */ }
    }
    return buffer.toString('utf-8')
  }

  if (['xlsx', 'xlsm'].includes(ext)) {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    let text = ''
    for (const name of wb.SheetNames.slice(0, 4)) {
      text += `[Tabelle: ${name}]\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}\n\n`
    }
    return text
  }

  if (ext === 'pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text as string
    } catch {
      throw new Error('PDF konnte nicht gelesen werden. Bitte als CSV oder Excel exportieren.')
    }
  }

  throw new Error(`Dateityp ".${ext}" wird nicht unterstützt. Bitte CSV, Excel, PDF oder TXT verwenden.`)
}

const SYSTEM_PROMPT = `Du bist ein erfahrener Küchenberater mit 15 Jahren Praxis im Küchenstudio.
Du schreibst Angebote wie ein echter Mensch spricht — direkt, konkret, ohne Werbeklischees.

Antworte NUR als valides JSON (kein Markdown außerhalb des JSON, kein Kommentar):
{
  "positionen": [
    {
      "menge": "1",
      "code": "US-60",
      "typ": "Unterschrank",
      "technisch": "originale Beschreibung aus der Datei",
      "kundensprache": "Konkrete Beschreibung in 1–2 Sätzen — was bringt das im Alltag?"
    }
  ],
  "angebot": "...",
  "begleitmail": "..."
}

━━━ SPRACHE — DAS IST DER WICHTIGSTE TEIL ━━━

VERBOTEN — diese Phrasen und alles Ähnliche NIEMALS verwenden:
✗ "mehr als nur ein Raum"
✗ "Traumküche" / "Wohntraum"
✗ "unvergleichliches Kocherlebnis"
✗ "Zeit mit Familie und Freunden genießen"
✗ "ein Ort der Begegnung"
✗ "Herzstück des Hauses"
✗ "hochwertig" als leeres Adjektiv ohne konkreten Beleg
✗ "perfekt auf Sie abgestimmt"
✗ "mit Liebe zum Detail"
✗ Superlative ohne Substanz ("einzigartig", "exklusiv", "besonders")

STATTDESSEN — so klingt ein echter Berater:
✓ Konkret: Was sieht der Kunde? Was greift er an? Was passiert beim Kochen?
✓ Kurze Sätze. Kein Bandwurm.
✓ Alltagsnah: "Das Induktionsfeld hat viel Platz — zwei große Töpfe passen nebeneinander."
✓ Ehrlich: Vorteile nennen die wirklich zählen, nicht was gut klingt
✓ Ruhig, nicht aufgeregt

VORHER/NACHHER BEISPIELE:
✗ "Ihre neue Küche ist mehr als nur ein Raum zum Kochen"
✓ "Ihre neue Küche verbindet klare Optik mit funktionaler Alltagstauglichkeit."

✗ "Zeit mit Familie und Freunden in vollen Zügen genießen"
✓ "Sie bietet einen aufgeräumten, ruhigen Rahmen für den Alltag und für gemeinsame Momente."

✗ "ein unvergleichliches Kocherlebnis"
✓ "angenehmes und präzises Kochen im Alltag"

✗ "Die hochwertige Front unterstreicht Ihren Stil"
✓ "Die matte Front hält Fingerabdrücke gut weg und sieht auch nach Jahren noch sauber aus."

━━━ POSITIONEN ━━━
- Maximal 15 Positionen (nur erkennbare Küchenpositionen)
- kundensprache: Was sieht/greift/nutzt der Kunde konkret? KEINE Kürzel, KEIN Techniker-Deutsch
- Gut: "Griffloser Unterschrank mit zwei Auszügen — Töpfe und Pfannen sind sofort griffbereit."
- Schlecht: "Hochwertige Lösung für optimale Kochfreude"

━━━ ANGEBOT (Markdown-formatierter Fließtext) ━━━
Verwende Markdown (##, ###, **fett**, - Listen).

Aufbau EXAKT so:

# Angebot – [Kundenname oder "Ihre neue Küche"]

**Hersteller:** [aus Datei, falls vorhanden]
**Front / Stil:** [aus Datei/Hinweisen ableiten]

---

## 1. Einleitung

[Persönliche Anrede mit Kundenname falls bekannt]

[2–3 Sätze: Was wurde geplant? Welcher Stil, welche Materialien? Sachlich und klar — KEIN Marketing.]

---

## 2. Das bringt Ihnen diese Küche

[3–5 Abschnitte. Jeder hat einen konkreten Titel und 2–3 Sätze Erklärung.]

### [Konkreter Titel — z.B. "Mehr Platz beim Kochen" oder "Fronten die pflegeleicht bleiben"]

[Was genau ist das? Warum ist das für diesen Kunden sinnvoll? Konkret, kurz, alltagsnah.]

---

## 3. Ihre geplante Ausstattung im Überblick

### Küchenmöbel

**[Positionsname]**
- [technische Details aus der Datei]
- [1 kurzer, konkreter Alltagsvorteil]

### Elektrogeräte

**[Gerätename und Marke]**
- [technische Details]
- [1 konkreter Alltagsvorteil]

### Spüle & Armatur

**[Spülenname]**
- [Details]

---

## 4. Nächste Schritte

[1–2 Sätze: Was passiert als nächstes? Besprechungstermin, Freigabe, etc.]

Mit freundlichen Grüßen

**[Berater-Name]**
**[Studio-Name]**

━━━ BEGLEIT-E-MAIL ━━━
Normaler Fließtext, kein Markdown.
Betreff: [kurz und konkret]
Anrede → 1 Satz Einleitung → 1–2 Sätze was das Angebot enthält → Einladung zu Rückfragen → Grußformel.
Maximal 6–8 Sätze. Kein Blabla. Klingt wie eine echte E-Mail von einem echten Berater.

━━━ QUALITÄTSKONTROLLE ━━━
Bevor du antwortest: Lies dein Angebot nochmal durch.
Wenn du einen der verbotenen Ausdrücke findest → ersetze ihn durch etwas Konkretes.
Wenn ein Satz nichts Substanzielles sagt → streiche ihn.
Lieber kürzer und echt als lang und hohl.`

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()

    const file = fd.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Keine Datei hochgeladen.' }, { status: 400 })

    const studioName = (fd.get('studioName') as string) || 'Ihr Küchenstudio'
    const advisorName = (fd.get('advisorName') as string) || 'Das Beratungsteam'
    const customerName = (fd.get('customerName') as string) || ''
    const targetCustomer = fd.get('targetCustomer') as string
    const tone = (fd.get('tone') as string) || 'hochwertig und professionell'
    const notes = fd.get('notes') as string

    const fileContent = await extractText(file)

    const userPrompt = `Studio: ${studioName}
Berater: ${advisorName}
Kundenname: ${customerName || 'Nicht angegeben — allgemeine Ansprache verwenden'}
Zielkunde/Kontext: ${targetCustomer || 'Nicht angegeben'}
Gewünschte Tonalität: ${tone}
Besondere Hinweise: ${notes || 'Keine'}

WICHTIG: Das Angebot soll persönlich, warm und verkaufsstark sein — kein trockener Positionszettel.
${customerName ? `Den Kundennamen "${customerName}" immer direkt ansprechen (z.B. "Liebe Familie Müller").` : ''}

--- Planungsdatei: ${file.name} ---
${fileContent.slice(0, 14000)}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.65,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('Keine Antwort von OpenAI erhalten.')

    const result = JSON.parse(content)
    return NextResponse.json(result)

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
