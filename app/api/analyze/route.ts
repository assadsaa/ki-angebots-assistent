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

const SYSTEM_PROMPT = `Du bist ein KI-Angebots-Assistent für Küchenstudios in Deutschland/Österreich/Schweiz.
Analysiere die übergebene Planungsdatei und erstelle professionelle Kundendokumente auf Deutsch.

Antworte NUR als valides JSON mit dieser exakten Struktur (kein Markdown, kein Kommentar):
{
  "positionen": [
    {
      "menge": "1",
      "code": "US-60",
      "typ": "Unterschrank",
      "technisch": "originale Beschreibung aus der Datei",
      "kundensprache": "Warme, konkrete und verkaufsstarke Beschreibung für den Endkunden"
    }
  ],
  "angebot": "Vollständiger Angebotstext...",
  "begleitmail": "Vollständige E-Mail an den Kunden..."
}

Regeln:
- Maximal 15 Positionen extrahieren (nur klare Küchenpositionen)
- Kundensprache: warm, konkret, hochwertig — keine Techniker-Sprache
- Angebot: strukturiert mit Intro, Positionsliste, persönlichem Abschluss
- Begleitmail: professionell, freundlich, mit Bezug auf das Studio und den Berater
- Alles ausschließlich auf Deutsch`

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()

    const file = fd.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Keine Datei hochgeladen.' }, { status: 400 })

    const studioName = (fd.get('studioName') as string) || 'Ihr Küchenstudio'
    const advisorName = (fd.get('advisorName') as string) || 'Das Beratungsteam'
    const targetCustomer = fd.get('targetCustomer') as string
    const tone = (fd.get('tone') as string) || 'hochwertig und professionell'
    const notes = fd.get('notes') as string

    const fileContent = await extractText(file)

    const userPrompt = `Studio: ${studioName}
Berater: ${advisorName}
Zielkunde: ${targetCustomer || 'Nicht angegeben'}
Tonalität: ${tone}
Hinweise: ${notes || 'Keine'}

--- Dateiinhalt (${file.name}) ---
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
