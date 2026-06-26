'use client'

import { useState, useRef, useCallback } from 'react'

interface Position {
  menge: string
  code: string
  typ: string
  technisch: string
  kundensprache: string
}

interface AnalysisResult {
  positionen: Position[]
  angebot: string
  begleitmail: string
}

type Tab = 'positionen' | 'angebot' | 'mail'

function IconDoc() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )
}

function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function Spinner({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const s = size === 'lg' ? 'w-8 h-8' : 'w-4 h-4'
  return (
    <svg className={`${s} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const INPUT = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-300'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [studioName, setStudioName] = useState('')
  const [advisorName, setAdvisorName] = useState('')
  const [targetCustomer, setTargetCustomer] = useState('')
  const [tone, setTone] = useState('klar, hochwertig und nah an echter Küchenberatung')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('positionen')
  const [copied, setCopied] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('studioName', studioName)
      fd.append('advisorName', advisorName)
      fd.append('targetCustomer', targetCustomer)
      fd.append('tone', tone)
      fd.append('notes', notes)

      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analyse fehlgeschlagen')

      setResult(data)
      setActiveTab('positionen')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'positionen', label: 'Positionen' },
    { key: 'angebot', label: 'Angebot' },
    { key: 'mail', label: 'Begleit-E-Mail' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-jakarta">

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1e3a5f] flex items-center justify-center shadow-sm">
              <span className="text-white"><IconDoc /></span>
            </div>
            <div>
              <p className="text-[15px] font-700 text-slate-900 leading-none font-bold">KI-Angebots-Assistent</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Für Küchenstudios</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full tracking-wide">
            Beta
          </span>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#0d2444] to-[#0a3870]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-blue-200 text-[11px] font-semibold px-3 py-1 rounded-full mb-5 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse-dot" />
                GPT-4o powered
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                Datei rein.<br className="hidden sm:block" /> Angebotstext raus.
              </h1>
              <p className="text-slate-300 text-base max-w-xl leading-relaxed">
                Technische Stücklisten automatisch in professionelle Kundensprache übersetzen — inklusive fertigem Angebot und Begleit-E-Mail.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 md:gap-4 shrink-0">
              {[
                { label: 'CSV · Excel · PDF · TXT' },
                { label: 'Angebot + E-Mail' },
                { label: 'Unter 30 Sekunden' },
              ].map(({ label }) => (
                <div key={label} className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2">
                  <span className="text-blue-400"><IconCheck className="w-3.5 h-3.5" /></span>
                  <span className="text-slate-200 text-[13px] font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT PANEL ──────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Studio Setup */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Studio-Setup</p>
                <p className="text-[13px] text-slate-500 mt-0.5">Damit das Angebot wie euer Studio klingt.</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {[
                  { label: 'Studio-Name', value: studioName, setter: setStudioName, ph: 'z.B. Küchen Maier GmbH' },
                  { label: 'Ansprechpartner', value: advisorName, setter: setAdvisorName, ph: 'z.B. Thomas Maier' },
                  { label: 'Zielkunde', value: targetCustomer, setter: setTargetCustomer, ph: 'z.B. Familie, Neubau modern' },
                  { label: 'Tonalität', value: tone, setter: setTone, ph: 'z.B. hochwertig, klar' },
                ].map(({ label, value, setter, ph }) => (
                  <div key={label}>
                    <label className="text-[13px] font-semibold text-slate-600 block mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={e => setter(e.target.value)}
                      placeholder={ph}
                      className={INPUT}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[13px] font-semibold text-slate-600 block mb-1.5">Besondere Hinweise</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="z.B. Gerätemarken betonen, Fokus auf Stauraum"
                    rows={3}
                    className={`${INPUT} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Datei hochladen</p>
                <p className="text-[13px] text-slate-500 mt-0.5">CSV · Excel · PDF · TXT</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group ${
                    isDragging
                      ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                      : file
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xlsm,.csv,.tsv,.txt,.md,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2.5">
                    {file ? (
                      <>
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600"><IconCheck className="w-5 h-5" /></span>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-blue-700">{file.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · Klicken zum Ändern</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-200">
                          <span className="text-slate-400 group-hover:text-blue-500 transition-colors duration-200"><IconUpload /></span>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-600">Datei ziehen oder klicken</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Stückliste, Angebot oder Exportdatei</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!file || isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm text-white transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/30 active:scale-[0.98]"
                  style={{
                    background: (!file || isLoading) ? '#CBD5E1' : 'linear-gradient(135deg, #0369A1 0%, #0284C7 100%)',
                  }}
                >
                  {isLoading ? (
                    <><Spinner /> KI analysiert...</>
                  ) : (
                    <><IconBolt /> Analyse starten</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ─────────────────────────────────────── */}
          <div className="lg:col-span-2 min-h-[400px]">

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 animate-fade-in">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-700">Analyse fehlgeschlagen</p>
                  <p className="text-sm text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!result && !isLoading && !error && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                  <span className="text-slate-300 scale-125"><IconDoc /></span>
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-2">Bereit für die Analyse</h3>
                <p className="text-[13px] text-slate-400 max-w-xs leading-relaxed">
                  Lade eine Stückliste oder Angebotsdatei hoch — das Ergebnis erscheint hier in Sekunden.
                </p>

                {/* Vorher / Nachher teaser */}
                <div className="mt-8 flex gap-3 text-left w-full max-w-sm">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vorher</p>
                    <p className="text-[11px] text-slate-500 font-mono leading-relaxed">US-60 · BO-60E · APL-240</p>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5">Nachher</p>
                    <p className="text-[11px] text-blue-700 leading-relaxed">griffloser Unterschrank mit premium Backofen-Integration…</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                  <span className="text-blue-600"><Spinner size="lg" /></span>
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-2">GPT-4o analysiert…</h3>
                <p className="text-[13px] text-slate-400">Technik → Kundensprache. Dauert 15–30 Sekunden.</p>

                {/* Skeleton preview */}
                <div className="mt-8 w-full max-w-md space-y-2.5">
                  {[85, 70, 90, 60].map((w, i) => (
                    <div key={i} className="h-3 bg-slate-100 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">

                {/* Stats */}
                <div className="grid grid-cols-3 border-b border-slate-100">
                  {[
                    { value: result.positionen.length.toString(), label: 'Positionen erkannt', color: 'text-slate-900' },
                    { value: '✓', label: 'Angebot erstellt', color: 'text-blue-600' },
                    { value: '✓', label: 'E-Mail generiert', color: 'text-blue-600' },
                  ].map((stat, i) => (
                    <div key={i} className={`px-5 py-4 text-center ${i < 2 ? 'border-r border-slate-100' : ''}`}>
                      <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-2 gap-1">
                  {tabs.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-4 py-3.5 text-[13px] font-semibold transition-colors duration-200 border-b-2 cursor-pointer ${
                        activeTab === key
                          ? 'text-blue-700 border-blue-600'
                          : 'text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">

                  {/* Positionen */}
                  {activeTab === 'positionen' && (
                    <div className="space-y-3 animate-fade-in">
                      {result.positionen.map((pos, i) => (
                        <div key={i} className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">{pos.code}</span>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{pos.typ}</span>
                            <span className="text-[11px] text-slate-400 ml-auto font-medium">{pos.menge}×</span>
                          </div>
                          <p className="text-[14px] font-semibold text-slate-900 leading-snug mb-1.5">{pos.kundensprache}</p>
                          <p className="text-[11px] text-slate-400 font-mono leading-relaxed">{pos.technisch}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Angebot / Mail */}
                  {(activeTab === 'angebot' || activeTab === 'mail') && (
                    <div className="animate-fade-in">
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={() => copyToClipboard(activeTab === 'angebot' ? result.angebot : result.begleitmail, activeTab)}
                          className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer active:scale-95"
                        >
                          {copied === activeTab ? (
                            <><span className="text-blue-600"><IconCheck /></span><span className="text-blue-600">Kopiert!</span></>
                          ) : (
                            <><IconCopy /> Kopieren</>
                          )}
                        </button>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-[13px] text-slate-700 whitespace-pre-wrap leading-7 scrollbar-thin overflow-y-auto max-h-[520px]">
                        {activeTab === 'angebot' ? result.angebot : result.begleitmail}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-slate-400 font-medium">KI-Angebots-Assistent · Für Küchenstudios</p>
          <p className="text-[12px] text-slate-300">Powered by GPT-4o</p>
        </div>
      </footer>
    </div>
  )
}
