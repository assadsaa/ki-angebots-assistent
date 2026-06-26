'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  LayoutDashboard, Upload, FileText, Bookmark, Users, Settings,
  HelpCircle, ChevronDown, Check, Zap, Copy, ArrowRight, TrendingUp,
  Bell, Search, CloudUpload, Trash2, Plus, Eye, Save, X, Pencil,
  BarChart3, Clock, Building2, CheckCircle2, Layers, Sparkles,
  FileCheck, Timer, Mail, ChevronRight, MoreHorizontal, Send,
  UserCircle, AlertTriangle, Filter, LayoutGrid,
} from 'lucide-react'

/* ─────── TYPES ─────── */
type NavId = 'dashboard' | 'uploads' | 'angebote' | 'vorlagen' | 'kunden' | 'team' | 'einstellungen'
type ResultTab = 'positionen' | 'angebot' | 'mail'
type AngStatus = 'Entwurf' | 'In Prüfung' | 'Gesendet' | 'Angenommen' | 'Abgelehnt'

interface Position { menge: string; code: string; typ: string; technisch: string; kundensprache: string }
interface AnalysisResult { positionen: Position[]; angebot: string; begleitmail: string }
interface AppSettings { studioName: string; advisorName: string; defaultTone: string; defaultNotes: string }
interface Template { id: string; name: string; description: string; tone: string; notes: string; color: string }
interface TeamMember { id: string; name: string; email: string; role: string }
interface SavedAngebot {
  id: string; kunde: string; fileName: string; datum: string
  positionen: number; angebot: string; begleitmail: string; positionList: Position[]
  status: AngStatus
}

/* ─────── DEFAULTS ─────── */
const DEFAULT_SETTINGS: AppSettings = {
  studioName: '', advisorName: '', defaultTone: 'klar, hochwertig und nah an echter Küchenberatung', defaultNotes: ''
}
const DEFAULT_TEMPLATES: Template[] = [
  { id: 't1', name: 'Familie Standard', description: 'Warm, alltagsnah', tone: 'warm, familiär, alltagsnah und hochwertig', notes: 'Stauraum und Alltag betonen.', color: 'blue' },
  { id: 't2', name: 'Neubau Premium', description: 'Modern, clean', tone: 'modern, klar, premium und architektonisch', notes: 'Design und Materialqualität betonen.', color: 'violet' },
  { id: 't3', name: 'Renovierung', description: 'Klar, beratend', tone: 'klar, verständlich, beratend und vertrauensvoll', notes: 'Verbesserungen gegenüber alter Küche.', color: 'emerald' },
  { id: 't4', name: 'Luxus Line', description: 'Exklusiv, elegant', tone: 'exklusiv, elegant, distinguiert und zukunftsweisend', notes: 'Einzigartigkeit und Handwerksqualität.', color: 'amber' },
]
const TC: Record<string, { bg: string; border: string; text: string; dot: string; light: string }> = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-600',    light: 'bg-blue-100' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-600',  light: 'bg-violet-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-600', light: 'bg-emerald-100' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   light: 'bg-amber-100' },
}
const STATUS_STYLE: Record<AngStatus, { bg: string; text: string; dot: string }> = {
  'Entwurf':     { bg: 'bg-slate-100',    text: 'text-slate-600',   dot: 'bg-slate-400' },
  'In Prüfung':  { bg: 'bg-amber-50',     text: 'text-amber-700',   dot: 'bg-amber-500' },
  'Gesendet':    { bg: 'bg-blue-50',      text: 'text-blue-700',    dot: 'bg-blue-500' },
  'Angenommen':  { bg: 'bg-emerald-50',   text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Abgelehnt':   { bg: 'bg-red-50',       text: 'text-red-600',     dot: 'bg-red-500' },
}

/* ─────── NAV ─────── */
type NavItem = { id: NavId; label: string; Icon: React.ElementType }
const NAV: NavItem[] = [
  { id: 'dashboard',     label: 'Dashboard',     Icon: LayoutDashboard },
  { id: 'uploads',       label: 'Uploads',       Icon: Upload },
  { id: 'angebote',      label: 'Angebote',      Icon: FileText },
  { id: 'vorlagen',      label: 'Vorlagen',       Icon: Bookmark },
  { id: 'kunden',        label: 'Kunden',         Icon: UserCircle },
  { id: 'team',          label: 'Team',           Icon: Users },
  { id: 'einstellungen', label: 'Einstellungen',  Icon: Settings },
]
const VIEW_TITLE: Record<NavId, string> = {
  dashboard: 'Dashboard', uploads: 'Stückliste hochladen',
  angebote: 'Angebote', vorlagen: 'Vorlagen', kunden: 'Kunden', team: 'Team', einstellungen: 'Einstellungen',
}
const INPUT = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white'

/* ─────── HELPERS ─────── */
function Spin({ lg }: { lg?: boolean }) {
  return <svg className={`animate-spin ${lg ? 'w-6 h-6' : 'w-3.5 h-3.5'}`} fill="none" viewBox="0 0 24 24"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
}
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??' }
function dateNow() { return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
function StatusBadge({ s }: { s: AngStatus }) {
  const st = STATUS_STYLE[s]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot} shrink-0`} />{s}
    </span>
  )
}

/* ─────── MARKDOWN ─────── */
function MdView({ content }: { content: string }) {
  return (
    <ReactMarkdown components={{
      h1: ({ children }) => <h1 className="text-[15px] font-bold text-slate-900 mb-3">{children}</h1>,
      h2: ({ children }) => <h2 className="text-[11px] font-bold text-slate-500 mb-2 mt-5 uppercase tracking-widest border-b border-slate-200 pb-1.5">{children}</h2>,
      h3: ({ children }) => <h3 className="text-[12px] font-bold text-blue-600 mb-1.5 mt-4">{children}</h3>,
      p:  ({ children }) => <p className="text-[12.5px] text-slate-700 leading-[1.8] mb-3">{children}</p>,
      strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
      ul: ({ children }) => <ul className="space-y-1 mb-3">{children}</ul>,
      li: ({ children }) => <li className="text-[12px] text-slate-700 leading-6 flex gap-2 items-start"><span className="text-emerald-500 mt-1.5 shrink-0 text-[8px]">●</span><span>{children}</span></li>,
      hr: () => <hr className="border-slate-200 my-5" />,
    }}>{content}</ReactMarkdown>
  )
}

/* ─────── SPARKLINE ─────── */
function SparkLine({ data, color = '#22c55e' }: { data: number[]; color?: string }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const W = 240, H = 60, pad = 6
  const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * (W - pad * 2)},${pad + (1 - (v - min) / range) * (H - pad * 2)}`)
  const fill = `${pts.join(' ')} ${W - pad},${H - pad} ${pad},${H - pad}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#sg)" />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={pts.join(' ')} />
      {pts.map((p, i) => { const [x, y] = p.split(','); return <circle key={i} cx={x} cy={y} r="2.5" fill={color} /> })}
    </svg>
  )
}

/* ═══════════════════════════════════════ SIDEBAR ══ */
function Sidebar({ active, setActive, studioName, advisorName, angebote }: {
  active: NavId; setActive: (v: NavId) => void; studioName: string; advisorName: string; angebote: SavedAngebot[]
}) {
  const abbr = initials(studioName || 'KS')
  const newCount = angebote.filter(a => a.status === 'In Prüfung').length
  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full select-none" style={{ background: '#0F172A' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Custom KI logo icon — matches design guide */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 17.5h7M17.5 14v7" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-tight">KI-Angebots-</p>
            <p className="text-[13px] font-bold text-white leading-tight">Assistent</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>für Küchenstudios</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button key={id} onClick={() => setActive(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer text-left group relative ${on ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              style={on ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' } : {}}>
              {on && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-blue-400" />}
              <Icon size={15} strokeWidth={on ? 2 : 1.7} className={on ? 'text-blue-400' : ''} />
              {label}
              {id === 'angebote' && newCount > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{newCount}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <div className="h-px mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer">
          <HelpCircle size={14} strokeWidth={1.7} />Hilfe & Support
        </button>
        <button onClick={() => setActive('einstellungen')}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}>{abbr}</div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[11px] font-semibold text-white truncate">{studioName || 'Mein Studio'}</p>
            <p className="text-[10px] truncate" style={{ color: '#475569' }}>{advisorName || 'Einstellungen'}</p>
          </div>
          <ChevronDown size={12} className="text-slate-600 shrink-0" />
        </button>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════ TOPBAR ══ */
function TopBar({ title, advisorName, subtitle }: { title: string; advisorName: string; subtitle?: string }) {
  const ab = initials(advisorName || 'AA')
  return (
    <header className="h-[58px] shrink-0 bg-white border-b border-slate-100 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-[15px] font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 w-56 hover:border-slate-300 transition-colors">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input placeholder="Suche (z. B. Angebote, Kunden, Uploads)" className="bg-transparent text-[11.5px] text-slate-600 placeholder-slate-400 outline-none w-full" />
        </div>
        <button className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer">
          <Bell size={14} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}>
            <span className="text-white text-[10px] font-bold">{ab}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-[12px] font-semibold text-slate-800 leading-none">{advisorName || 'Max Mustermann'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Administrator</p>
          </div>
          <ChevronDown size={13} className="text-slate-400" />
        </div>
      </div>
    </header>
  )
}

/* ─────── STAT CARD ─────── */
function StatCard({ label, value, sub, up, icon: Icon, iconBg, trend }: { label: string; value: string; sub: string; up?: boolean; icon: React.ElementType; iconBg: string; trend?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[12px] font-semibold text-slate-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={17} className="text-white" strokeWidth={1.8} />
        </div>
      </div>
      <p className="text-[32px] font-extrabold text-slate-900 leading-none mb-2 tracking-tight">{value}</p>
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${up ? 'text-emerald-600' : 'text-slate-400'}`}>
        {up && <TrendingUp size={11} strokeWidth={2.5} />}
        <span>{sub}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ DASHBOARD ══ */
function DashboardView({ setActive, angebote, settings }: { setActive: (v: NavId) => void; angebote: SavedAngebot[]; settings: AppSettings }) {
  const today = dateNow()
  const todayCount = angebote.filter(a => a.datum === today).length
  const totalPos = angebote.reduce((s, a) => s + a.positionen, 0)
  const accepted = angebote.filter(a => a.status === 'Angenommen').length
  const name = settings.advisorName ? settings.advisorName.split(' ')[0] : 'Max'
  const chartData = [10, 14, 18, 15, 22, 20, 26, 23, 29]
  const RECENT_ACTIVITY = angebote.slice(0, 5).map(a => ({ text: `Angebot ${a.id.slice(0, 14)} erstellt`, sub: a.datum }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome + CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Guten Morgen, {name}! 👋</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Hier ist das Überblick für Ihr Studio.</p>
        </div>
        <button onClick={() => setActive('uploads')}
          className="flex items-center gap-2 text-[12px] font-bold text-white px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-900/25 hover:opacity-90 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#0F172A)' }}>
          <Plus size={14} strokeWidth={2.5} />Neues Angebot erstellen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Angebote heute" value={String(todayCount || angebote.length)} sub={`${angebote.length > 0 ? '+' : ''}${angebote.length} gesamt`} up={angebote.length > 0} icon={FileText} iconBg="bg-blue-500" />
        <StatCard label="Gesparte Zeit" value={angebote.length > 0 ? `${(angebote.length * 1.5).toFixed(1)} h` : '—'} sub="+34% vs. letzte Woche" up={angebote.length > 0} icon={Clock} iconBg="bg-emerald-500" />
        <StatCard label="Aktive Studios" value="1" sub="Alle Systeme aktiv" icon={Building2} iconBg="bg-amber-500" />
        <StatCard label="Angenommen" value={String(accepted)} sub={angebote.length > 0 ? `von ${angebote.length} Angeboten` : 'Noch keine'} up={accepted > 0} icon={CheckCircle2} iconBg="bg-violet-500" />
      </div>

      {/* 3-col bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Aktivitätsfeed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[13px] font-bold text-slate-900">Aktivitätsfeed</p>
          </div>
          {RECENT_ACTIVITY.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] text-slate-400">Noch keine Aktivitäten.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={12} className="text-blue-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] text-slate-700 font-medium leading-snug">{a.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-3 border-t border-slate-50">
            <button onClick={() => setActive('angebote')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
              Alle Aktivitäten anzeigen <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* Prozess */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-900">Prozess-Überblick</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { Icon: CloudUpload, label: 'Upload', sub: 'Grundrisse, Skizzen oder PDFs hochladen', color: 'text-blue-600', bg: 'bg-blue-50' },
              { Icon: Sparkles,    label: 'KI Analyse', sub: 'Intelligente Analyse & Datenextraktion', color: 'text-violet-600', bg: 'bg-violet-50' },
              { Icon: FileCheck,   label: 'Angebot fertig', sub: 'Professionelles Angebot als PDF / Excel', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(({ Icon, label, sub, color, bg }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={17} className={color} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800">{label}</p>
                  <p className="text-[10px] text-slate-400 leading-snug">{sub}</p>
                </div>
                {i < 2 && <ArrowRight size={14} className="text-slate-300 shrink-0" />}
              </div>
            ))}
          </div>
          {angebote.length > 0 && (
            <div className="mx-5 mb-4 px-3 py-2 bg-emerald-50 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
              <p className="text-[11px] text-emerald-700 font-medium">{Math.round((angebote.length / (angebote.length + 1)) * 100)} % aller Uploads wurden erfolgreich verarbeitet.</p>
            </div>
          )}
          <div className="px-5 pb-5">
            <button onClick={() => setActive('uploads')}
              className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ background: '#0F172A' }}>
              <Plus size={14} />Neues Angebot erstellen
            </button>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[13px] font-bold text-slate-900">Angebots-Performance</p>
            <span className="text-[10px] font-semibold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-lg">Diese Woche</span>
          </div>
          <div className="px-5 pt-4">
            <p className="text-[11px] text-slate-500 font-medium mb-1">Konversionsrate</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[28px] font-extrabold text-slate-900 tracking-tight">
                {angebote.length > 0 ? `${Math.round((accepted / angebote.length) * 100)}` : '0'} %
              </span>
              {accepted > 0 && <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5"><TrendingUp size={11} />+4,3%</span>}
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mb-1 font-medium">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => <span key={d}>{d}</span>)}
            </div>
            <SparkLine data={chartData} color="#22c55e" />
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              {['10%', '', '20%', '', '30%'].map((l, i) => <span key={i}>{l}</span>)}
            </div>
          </div>
          <div className="px-5 py-4 border-t border-slate-50 mt-2">
            <button onClick={() => setActive('angebote')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
              Zur Analytics-Übersicht <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Angebote table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[13px] font-bold text-slate-900">Kürzlich bearbeitete Angebote</p>
          <button onClick={() => setActive('angebote')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
            Alle Angebote anzeigen <ChevronRight size={11} />
          </button>
        </div>
        {angebote.length === 0 ? (
          <div className="py-10 text-center">
            <FileText size={28} className="text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-[12px] text-slate-400">Noch keine Angebote erstellt.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                {['Angebot', 'Kunde', 'Status', 'Bearbeitet', 'Aktionen'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {angebote.slice(0, 4).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 text-[12px] font-bold text-slate-800">{a.id.slice(0, 14)}</td>
                    <td className="px-5 py-3 text-[12px] text-slate-700">{a.kunde}</td>
                    <td className="px-5 py-3"><StatusBadge s={a.status} /></td>
                    <td className="px-5 py-3 text-[11px] text-slate-400">{a.datum}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setActive('angebote')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">Öffnen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ UPLOADS ══ */
function UploadsView({ settings, templates, selectedTemplate, onSave, setActive }: {
  settings: AppSettings; templates: Template[]; selectedTemplate: Template | null
  onSave: (a: SavedAngebot) => void; setActive: (v: NavId) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [studioName, setStudioName] = useState(settings.studioName)
  const [advisorName, setAdvisorName] = useState(settings.advisorName)
  const [customerName, setCustomerName] = useState('')
  const [tone, setTone] = useState(settings.defaultTone)
  const [notes, setNotes] = useState(settings.defaultNotes)
  const [activeTpl, setActiveTpl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ResultTab>('positionen')
  const [copied, setCopied] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setStudioName(settings.studioName); setAdvisorName(settings.advisorName) }, [settings])
  useEffect(() => { if (selectedTemplate) { setTone(selectedTemplate.tone); setNotes(selectedTemplate.notes); setActiveTpl(selectedTemplate.id) } }, [selectedTemplate])

  const applyTpl = (t: Template) => { setTone(t.tone); setNotes(t.notes); setActiveTpl(t.id) }
  const resetTpl = () => { setActiveTpl(null); setTone(settings.defaultTone); setNotes(settings.defaultNotes) }
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const onDragLeave = useCallback(() => setIsDragging(false), [])
  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }, [])

  const analyze = async () => {
    if (!file) return
    setIsLoading(true); setError(null); setResult(null); setSavedOk(false)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('studioName', studioName); fd.append('advisorName', advisorName)
      fd.append('customerName', customerName); fd.append('tone', tone); fd.append('notes', notes)
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analyse fehlgeschlagen')
      setResult(data); setActiveTab('positionen')
      onSave({ id: `A-${Date.now()}`, kunde: customerName || file.name.replace(/\.[^/.]+$/, ''), fileName: file.name, datum: dateNow(), positionen: data.positionen?.length ?? 0, angebot: data.angebot, begleitmail: data.begleitmail, positionList: data.positionen ?? [], status: 'Entwurf' })
      setSavedOk(true)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unbekannter Fehler') }
    finally { setIsLoading(false) }
  }
  const copy = async (text: string, key: string) => { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000) }

  const STEPS = [
    { n: 1, label: 'Datei hochgeladen', sub: 'Erfolgreich', done: !!file },
    { n: 2, label: 'Daten extrahiert', sub: isLoading ? 'In Bearbeitung' : result ? 'Erfolgreich' : 'Wartet', done: !!result, loading: isLoading && !result },
    { n: 3, label: 'Positionen erkannt', sub: result ? `${result.positionen.length} erkannt` : 'Wartet', done: !!result },
    { n: 4, label: 'Angebot generieren', sub: result ? 'Erfolgreich' : 'Wartet', done: !!result },
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 animate-fade-in">
      {/* Left — Upload + Config */}
      <div className="xl:col-span-2 space-y-4">
        {/* Upload area */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
            <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.csv,.tsv,.txt,.md,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} className="hidden" />
            <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center mx-auto mb-3 transition-colors">
              <CloudUpload size={22} className="text-slate-400 group-hover:text-blue-500 transition-colors" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Datei hier ablegen</p>
            <p className="text-[11px] text-slate-400 mt-0.5">oder klicken zum Auswählen</p>
            <p className="text-[10px] text-slate-300 mt-2">Unterstützte Formate: KPL, XML, CSV, XLS</p>
          </div>

          {file && (
            <div className="mt-3 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <FileText size={16} className="text-blue-600 shrink-0" strokeWidth={2} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(2)} MB</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Check size={14} className="text-emerald-500" strokeWidth={2.5} />
                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={14} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Config */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Studio-Setup</p>
            {templates.length > 0 && (
              <div className="flex gap-1.5">
                {templates.slice(0, 3).map(t => {
                  const c = TC[t.color] || TC.blue; const on = activeTpl === t.id
                  return <button key={t.id} onClick={() => applyTpl(t)} title={t.name}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${on ? 'text-white border-transparent' : `${c.bg} ${c.border} ${c.text}`}`}
                    style={on ? { background: t.color === 'amber' ? '#f59e0b' : t.color === 'emerald' ? '#059669' : t.color === 'violet' ? '#7c3aed' : '#2563eb' } : {}}>
                    {t.name.split(' ')[0]}
                  </button>
                })}
              </div>
            )}
          </div>
          <div className="px-5 py-4 space-y-3">
            {([
              { label: 'Studio-Name', v: studioName, s: setStudioName, ph: 'z.B. Küchen Maier GmbH' },
              { label: 'Berater', v: advisorName, s: setAdvisorName, ph: 'z.B. Thomas Maier' },
              { label: 'Kundenname', v: customerName, s: setCustomerName, ph: 'z.B. Familie Müller' },
              { label: 'Tonalität', v: tone, s: setTone, ph: 'z.B. hochwertig, klar' },
            ] as { label: string; v: string; s: (x: string) => void; ph: string }[]).map(({ label, v, s, ph }) => (
              <div key={label}>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">{label}</label>
                <input value={v} onChange={e => s(e.target.value)} placeholder={ph} className={INPUT} />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Hinweise</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="z.B. Marken betonen" className={`${INPUT} resize-none`} />
            </div>
            <button onClick={analyze} disabled={!file || isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md"
              style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>
              {isLoading ? <><Spin />Wird analysiert…</> : <><Zap size={13} strokeWidth={2.5} />+ Neue Stückliste analysieren</>}
            </button>
          </div>
        </div>
      </div>

      {/* Right — Status + Results */}
      <div className="xl:col-span-3 space-y-4">
        {/* Analyse-Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-slate-900">Analyse-Status</p>
            {savedOk && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1"><Check size={9} strokeWidth={3} />Gespeichert</span>}
          </div>
          <div className="space-y-2.5">
            {STEPS.map(s => (
              <div key={s.n} className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${s.done ? 'bg-slate-50' : s.loading ? 'bg-blue-50' : 'bg-slate-50/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${s.done ? 'bg-emerald-500 text-white' : s.loading ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {s.done ? <Check size={11} strokeWidth={3} /> : s.loading ? <Spin /> : s.n}
                  </div>
                  <span className={`text-[12px] font-semibold ${s.done ? 'text-slate-800' : s.loading ? 'text-blue-700' : 'text-slate-400'}`}>{s.label}</span>
                </div>
                <span className={`text-[11px] font-semibold ${s.done ? 'text-emerald-600' : s.loading ? 'text-blue-500' : 'text-slate-300'}`}>{s.done ? 'Erfolgreich' : s.loading ? 'In Bearbeitung' : 'Wartet'}</span>
              </div>
            ))}
          </div>

          {/* Progress bar when loading */}
          {isLoading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-slate-600">Daten werden analysiert</p>
                <p className="text-[11px] text-blue-600 font-bold">~60%</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Erkannte Positionen */}
          {result && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-bold text-slate-700">Erkannte Positionen</p>
                <button onClick={() => setActive('angebote')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">Analyse anzeigen →</button>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[28px] font-extrabold text-slate-900">{result.positionen.length}</p>
                  <p className="text-[10px] text-slate-400">Gesamt</p>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Möbel', count: result.positionen.filter(p => p.typ?.toLowerCase().includes('schrank') || p.typ?.toLowerCase().includes('möbel')).length || Math.round(result.positionen.length * 0.65) },
                    { label: 'Geräte', count: result.positionen.filter(p => p.typ?.toLowerCase().includes('gerät') || p.typ?.toLowerCase().includes('herd')).length || Math.round(result.positionen.length * 0.2) },
                    { label: 'Zubehör', count: Math.max(0, result.positionen.length - Math.round(result.positionen.length * 0.85)) },
                  ].map(({ label, count }) => (
                    <div key={label} className="text-center bg-slate-50 rounded-xl py-2">
                      <p className="text-[16px] font-bold text-slate-800">{count}</p>
                      <p className="text-[10px] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-[13px] text-red-700">{error}</div>}

        {!result && !error && !isLoading && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center px-6">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText size={22} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] font-bold text-slate-700">Noch keine Analyse</p>
            <p className="text-[12px] text-slate-400 mt-1">Stückliste hochladen und analysieren.</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
            <div className="flex border-b border-slate-100 px-2 gap-1 items-center">
              {([{ k: 'positionen' as ResultTab, l: `Positionen (${result.positionen.length})` }, { k: 'angebot' as ResultTab, l: 'Angebot' }, { k: 'mail' as ResultTab, l: 'E-Mail' }]).map(({ k, l }) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`px-4 py-3 text-[12px] font-semibold transition-colors border-b-2 cursor-pointer ${activeTab === k ? 'text-blue-700 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="p-5">
              {activeTab === 'positionen' && (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {result.positionen.map((pos, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl p-3.5 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{pos.code}</span>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">{pos.typ}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{pos.menge}×</span>
                      </div>
                      <p className="text-[12px] font-semibold text-slate-900 mb-1">{pos.kundensprache}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{pos.technisch}</p>
                    </div>
                  ))}
                </div>
              )}
              {(activeTab === 'angebot' || activeTab === 'mail') && (
                <div>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => copy(activeTab === 'angebot' ? result.angebot : result.begleitmail, activeTab)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer">
                      {copied === activeTab ? <><Check size={12} className="text-blue-600" /><span className="text-blue-600">Kopiert!</span></> : <><Copy size={12} />Kopieren</>}
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 max-h-[360px] overflow-y-auto">
                    {activeTab === 'angebot' ? <MdView content={result.angebot} /> : <div className="text-[12.5px] text-slate-700 whitespace-pre-wrap leading-7">{result.begleitmail}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ ANGEBOTE ══ */
const ALL_STATUS: AngStatus[] = ['Entwurf', 'In Prüfung', 'Gesendet', 'Angenommen', 'Abgelehnt']

function AngeboteView({ angebote, onDelete, onStatusChange }: {
  angebote: SavedAngebot[]; onDelete: (id: string) => void; onStatusChange: (id: string, s: AngStatus) => void
}) {
  const [filter, setFilter] = useState<AngStatus | 'Alle'>('Alle')
  const [selected, setSelected] = useState<SavedAngebot | null>(null)
  const [tab, setTab] = useState<ResultTab>('angebot')
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (text: string, key: string) => { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000) }

  const counts = ALL_STATUS.reduce((acc, s) => { acc[s] = angebote.filter(a => a.status === s).length; return acc }, {} as Record<AngStatus, number>)
  const filtered = filter === 'Alle' ? angebote : angebote.filter(a => a.status === filter)
  const accepted = angebote.filter(a => a.status === 'Angenommen').length

  return (
    <div className="flex gap-5 animate-fade-in">
      {/* Main */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Filter tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100 overflow-x-auto">
            {(['Alle', ...ALL_STATUS] as (AngStatus | 'Alle')[]).map(s => {
              const cnt = s === 'Alle' ? angebote.length : counts[s]
              const on = filter === s
              const st = s !== 'Alle' ? STATUS_STYLE[s] : null
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap cursor-pointer transition-all ${on ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {s}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${on ? 'bg-white/20 text-white' : st ? `${st.bg} ${st.text}` : 'bg-slate-100 text-slate-500'}`}>
                    {cnt}
                  </span>
                </button>
              )
            })}
            <div className="ml-auto shrink-0">
              <button className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50">
                <Filter size={11} />Filter
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <FileText size={28} className="text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[13px] font-semibold text-slate-400">Keine Angebote {filter !== 'Alle' ? `mit Status "${filter}"` : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  {['Angebotsnummer', 'Kunde', 'Status', 'Erstellt am', 'Positionen', ''].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(a => (
                    <tr key={a.id} onClick={() => { setSelected(selected?.id === a.id ? null : a); setTab('angebot') }}
                      className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${selected?.id === a.id ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-5 py-3.5 text-[12px] font-bold text-slate-800">{a.id.slice(0, 14)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-[12px] font-semibold text-slate-800">{a.kunde}</p>
                        <p className="text-[10px] text-slate-400">{a.fileName}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <select value={a.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); onStatusChange(a.id, e.target.value as AngStatus) }}
                          className="text-[11px] font-semibold bg-transparent border-none outline-none cursor-pointer">
                          {ALL_STATUS.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <div className="mt-0.5"><StatusBadge s={a.status} /></div>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-500">{a.datum}</td>
                      <td className="px-5 py-3.5 text-[12px] font-bold text-slate-700">{a.positionen}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer px-2">Öffnen</button>
                          <button onClick={e => { e.stopPropagation(); onDelete(a.id) }}
                            className="text-slate-300 hover:text-red-400 cursor-pointer p-1 rounded hover:bg-red-50"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-slate-900">{selected.kunde} — {selected.id.slice(0, 14)}</p>
                <p className="text-[11px] text-slate-400">{selected.fileName} · {selected.datum}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="flex border-b border-slate-100 px-2 gap-1">
              {([{ k: 'angebot' as ResultTab, l: 'Angebot' }, { k: 'mail' as ResultTab, l: 'E-Mail' }, { k: 'positionen' as ResultTab, l: `Positionen (${selected.positionList.length})` }]).map(({ k, l }) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-3 text-[12px] font-semibold transition-colors border-b-2 cursor-pointer ${tab === k ? 'text-blue-700 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="p-5">
              {tab === 'positionen' ? (
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {selected.positionList.map((pos, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl p-3.5">
                      <div className="flex gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{pos.code}</span>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">{pos.typ}</span>
                      </div>
                      <p className="text-[12px] font-semibold text-slate-900 mb-1">{pos.kundensprache}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{pos.technisch}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => copy(tab === 'angebot' ? selected.angebot : selected.begleitmail, tab)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer">
                      {copied === tab ? <><Check size={12} className="text-blue-600" /><span className="text-blue-600">Kopiert!</span></> : <><Copy size={12} />Kopieren</>}
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 max-h-[360px] overflow-y-auto">
                    {tab === 'angebot' ? <MdView content={selected.angebot} /> : <div className="text-[12.5px] text-slate-700 whitespace-pre-wrap leading-7">{selected.begleitmail}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="w-72 shrink-0 space-y-4">
        {/* Conversion */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-[12px] font-bold text-slate-800 mb-3">Conversion-Übersicht</p>
          <div className="flex items-center justify-center py-2">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray={`${accepted > 0 && angebote.length > 0 ? (accepted / angebote.length * 100).toFixed(0) : 0} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[14px] font-extrabold text-slate-900">{angebote.length > 0 ? `${Math.round(accepted / angebote.length * 100)}%` : '0%'}</p>
                <p className="text-[9px] text-slate-400">Conversion</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mt-3">
            {ALL_STATUS.map(s => (
              <div key={s} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[s].dot}`} />
                  <span className="text-slate-600">{s}</span>
                </div>
                <span className="font-bold text-slate-700">{counts[s]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">Umsatz aus angenommenen Angeboten</p>
            <p className="text-[18px] font-extrabold text-slate-900 mt-0.5">—,— €</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-[12px] font-bold text-slate-800 mb-3">Schnellaktionen</p>
          <div className="space-y-2">
            {[
              { label: '+ Neues Angebot', primary: true },
              { label: 'Angebot aus Vorlage erstellen', primary: false },
              { label: 'Angebote exportieren', primary: false },
            ].map(({ label, primary }) => (
              <button key={label}
                className={`w-full text-[11px] font-semibold py-2 px-3 rounded-xl cursor-pointer text-left transition-all flex items-center gap-2 ${primary ? 'text-white' : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200'}`}
                style={primary ? { background: '#0F172A' } : {}}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ VORLAGEN ══ */
function VorlagenView({ templates, saveTemplates, setActive, setSelectedTemplate }: {
  templates: Template[]; saveTemplates: (t: Template[]) => void
  setActive: (v: NavId) => void; setSelectedTemplate: (t: Template) => void
}) {
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', tone: '', notes: '', color: 'blue' })
  const COLORS = ['blue', 'violet', 'emerald', 'amber']
  const startCreate = () => { setForm({ name: '', description: '', tone: '', notes: '', color: 'blue' }); setCreating(true); setEditing(null) }
  const startEdit = (t: Template) => { setForm({ name: t.name, description: t.description, tone: t.tone, notes: t.notes, color: t.color }); setEditing(t); setCreating(false) }
  const cancel = () => { setCreating(false); setEditing(null) }
  const save = () => {
    if (!form.name.trim()) return
    if (creating) saveTemplates([...templates, { ...form, id: `t${Date.now()}` }])
    else if (editing) saveTemplates(templates.map(t => t.id === editing.id ? { ...editing, ...form } : t))
    cancel()
  }
  const apply = (t: Template) => { setSelectedTemplate(t); setActive('uploads') }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Vorlagen definieren Tonalität und Hinweise für verschiedene Kundentypen.</p>
        <button onClick={startCreate} className="flex items-center gap-1.5 text-[12px] font-bold text-white px-4 py-2 rounded-xl cursor-pointer active:scale-95 shadow-sm" style={{ background: '#0F172A' }}>
          <Plus size={14} />Neue Vorlage
        </button>
      </div>
      {(creating || editing) && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 animate-slide-up">
          <p className="text-[13px] font-bold mb-4">{creating ? 'Neue Vorlage' : 'Bearbeiten'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[11px] font-semibold text-slate-500 block mb-1">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Familie Standard" className={INPUT} /></div>
            <div><label className="text-[11px] font-semibold text-slate-500 block mb-1">Beschreibung</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurzbeschreibung" className={INPUT} /></div>
            <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-500 block mb-1">Tonalität</label><input value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))} placeholder="z.B. warm, familiär" className={INPUT} /></div>
            <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-500 block mb-1">Hinweise</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${INPUT} resize-none`} /></div>
            <div><label className="text-[11px] font-semibold text-slate-500 block mb-2">Farbe</label><div className="flex gap-2">{COLORS.map(c => <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-6 h-6 rounded-full cursor-pointer border-2 ${TC[c].dot} ${form.color === c ? 'border-slate-800 scale-110' : 'border-transparent opacity-60'}`} />)}</div></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="flex items-center gap-1.5 text-[12px] font-bold text-white px-4 py-2 rounded-xl cursor-pointer" style={{ background: '#0F172A' }}><Save size={13} />Speichern</button>
            <button onClick={cancel} className="text-[12px] text-slate-500 px-4 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">Abbrechen</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => {
          const c = TC[t.color] || TC.blue
          return (
            <div key={t.id} className={`bg-white rounded-2xl border ${c.border} shadow-sm p-5 hover:shadow-md transition-all`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${c.light} flex items-center justify-center`}><Bookmark size={16} className={c.text} strokeWidth={2} /></div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(t)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"><Pencil size={12} /></button>
                  <button onClick={() => saveTemplates(templates.filter(x => x.id !== t.id))} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-400 cursor-pointer"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className={`text-[13px] font-bold ${c.text} mb-0.5`}>{t.name}</p>
              <p className="text-[11px] text-slate-500 mb-3">{t.description}</p>
              <div className={`${c.bg} rounded-xl px-3 py-2 mb-3`}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tonalität</p>
                <p className={`text-[11px] ${c.text} font-medium`}>{t.tone}</p>
              </div>
              <button onClick={() => apply(t)} className={`w-full py-2 rounded-xl text-[12px] font-bold text-white cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${c.dot}`}>
                Vorlage anwenden <ArrowRight size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ KUNDEN (Placeholder) ══ */
function KundenView({ setActive }: { setActive: (v: NavId) => void }) {
  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <UserCircle size={28} className="text-slate-300" strokeWidth={1.5} />
        </div>
        <p className="text-[16px] font-bold text-slate-700">Kunden-CRM</p>
        <p className="text-[13px] text-slate-400 mt-1.5 max-w-xs mx-auto">Kundenverwaltung, Projekthistorie und Notizen — kommt in der nächsten Version.</p>
        <button onClick={() => setActive('uploads')}
          className="mt-5 flex items-center gap-2 text-[12px] font-bold text-white px-5 py-2.5 rounded-xl mx-auto cursor-pointer"
          style={{ background: '#0F172A' }}>
          <Zap size={13} />Jetzt Angebot erstellen
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ TEAM ══ */
function TeamView({ team, saveTeam }: { team: TeamMember[]; saveTeam: (t: TeamMember[]) => void }) {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [role, setRole] = useState('Berater'); const [ok, setOk] = useState(false)
  const add = () => { if (!name.trim() || !email.trim()) return; saveTeam([...team, { id: `m${Date.now()}`, name: name.trim(), email: email.trim(), role }]); setName(''); setEmail(''); setOk(true); setTimeout(() => setOk(false), 2000) }
  const ROLES: Record<string, string> = { Administrator: 'bg-blue-50 text-blue-700', Berater: 'bg-emerald-50 text-emerald-700', Assistent: 'bg-slate-100 text-slate-600' }
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100"><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mitglied hinzufügen</p></div>
        <div className="px-5 py-4 space-y-3">
          {[{ label: 'Name', v: name, s: setName, ph: 'z.B. Anna Müller', t: 'text' }, { label: 'E-Mail', v: email, s: setEmail, ph: 'anna@studio.de', t: 'email' }].map(f => (
            <div key={f.label}><label className="text-[11px] font-semibold text-slate-500 block mb-1">{f.label}</label><input type={f.t} value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.ph} className={INPUT} /></div>
          ))}
          <div><label className="text-[11px] font-semibold text-slate-500 block mb-1">Rolle</label><select value={role} onChange={e => setRole(e.target.value)} className={INPUT}><option>Administrator</option><option>Berater</option><option>Assistent</option></select></div>
          <button onClick={add} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold text-white cursor-pointer active:scale-[0.98]" style={{ background: ok ? 'linear-gradient(135deg,#059669,#10b981)' : '#0F172A' }}>
            {ok ? <><Check size={13} />Hinzugefügt!</> : <><Plus size={13} />Hinzufügen</>}
          </button>
        </div>
      </div>
      <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100"><p className="text-[13px] font-bold text-slate-900">Team ({team.length})</p></div>
        {team.length === 0 ? <div className="py-16 text-center"><Users size={28} className="text-slate-200 mx-auto mb-2" strokeWidth={1.5} /><p className="text-[13px] text-slate-400">Noch keine Mitglieder.</p></div> : (
          <div className="divide-y divide-slate-50">
            {team.map(m => (
              <div key={m.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-[11px] font-bold" style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}>{initials(m.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">{m.name}</p>
                  <p className="text-[11px] text-slate-400">{m.email}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLES[m.role] || 'bg-slate-100 text-slate-600'}`}>{m.role}</span>
                <button onClick={() => saveTeam(team.filter(x => x.id !== m.id))} className="text-slate-300 hover:text-red-400 cursor-pointer p-1 rounded hover:bg-red-50"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ EINSTELLUNGEN ══ */
function EinstellungenView({ settings, saveSettings }: { settings: AppSettings; saveSettings: (s: AppSettings) => void }) {
  const [form, setForm] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)
  useEffect(() => { setForm(settings) }, [settings])
  const save = () => { saveSettings(form); setSaved(true); setTimeout(() => setSaved(false), 2500) }
  const f = (key: keyof AppSettings) => ({ value: form[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [key]: e.target.value })) })
  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100"><p className="text-[13px] font-bold text-slate-900">Studio-Informationen</p><p className="text-[11px] text-slate-400 mt-0.5">Werden automatisch in alle Angebote eingesetzt.</p></div>
        <div className="px-5 py-5 space-y-4">
          <div><label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Studio-Name</label><input {...f('studioName')} placeholder="z.B. Küchen Maier GmbH" className={INPUT} /></div>
          <div><label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Berater / Ansprechpartner</label><input {...f('advisorName')} placeholder="z.B. Thomas Maier" className={INPUT} /><p className="text-[10px] text-slate-400 mt-1.5">Erscheint in der Signatur aller Angebote.</p></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100"><p className="text-[13px] font-bold text-slate-900">Standard-Einstellungen</p><p className="text-[11px] text-slate-400 mt-0.5">Vorbefüllte Werte für neue Uploads.</p></div>
        <div className="px-5 py-5 space-y-4">
          <div><label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Standard-Tonalität</label><input {...f('defaultTone')} placeholder="z.B. klar, hochwertig" className={INPUT} /></div>
          <div><label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Standard-Hinweise</label><textarea {...f('defaultNotes')} rows={3} placeholder="z.B. Immer Hersteller nennen" className={`${INPUT} resize-none`} /></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100"><p className="text-[13px] font-bold text-slate-900">KI-Modell</p></div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Sparkles size={16} className="text-white" strokeWidth={1.8} /></div>
            <div className="flex-1"><p className="text-[12px] font-bold text-slate-800">GPT-4o</p><p className="text-[11px] text-slate-500">OpenAI · JSON Mode</p></div>
            <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full"><CheckCircle2 size={9} strokeWidth={2.5} />Verbunden</span>
          </div>
        </div>
      </div>
      <button onClick={save} className="flex items-center gap-2 text-[13px] font-bold text-white px-6 py-3 rounded-xl cursor-pointer active:scale-[0.98] shadow-md transition-all"
        style={{ background: saved ? 'linear-gradient(135deg,#059669,#10b981)' : '#0F172A' }}>
        {saved ? <><Check size={15} strokeWidth={2.5} />Gespeichert!</> : <><Save size={14} />Einstellungen speichern</>}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════ HOME ══ */
export default function Home() {
  const [active, setActive] = useState<NavId>('dashboard')
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [angebote, setAngebote] = useState<SavedAngebot[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem('ki_settings'); if (s) setSettings(JSON.parse(s))
      const t = localStorage.getItem('ki_templates'); if (t) setTemplates(JSON.parse(t))
      const tm = localStorage.getItem('ki_team'); if (tm) setTeam(JSON.parse(tm))
      const a = localStorage.getItem('ki_angebote'); if (a) setAngebote(JSON.parse(a))
    } catch { /* ignore */ }
  }, [])

  const saveSettings = (s: AppSettings) => { setSettings(s); localStorage.setItem('ki_settings', JSON.stringify(s)) }
  const saveTemplates = (t: Template[]) => { setTemplates(t); localStorage.setItem('ki_templates', JSON.stringify(t)) }
  const saveTeam = (t: TeamMember[]) => { setTeam(t); localStorage.setItem('ki_team', JSON.stringify(t)) }
  const addAngebot = (a: SavedAngebot) => { const u = [a, ...angebote].slice(0, 100); setAngebote(u); localStorage.setItem('ki_angebote', JSON.stringify(u)) }
  const deleteAngebot = (id: string) => { const u = angebote.filter(a => a.id !== id); setAngebote(u); localStorage.setItem('ki_angebote', JSON.stringify(u)) }
  const changeStatus = (id: string, s: AngStatus) => { const u = angebote.map(a => a.id === id ? { ...a, status: s } : a); setAngebote(u); localStorage.setItem('ki_angebote', JSON.stringify(u)) }

  const handleSetActive = (v: NavId) => { if (v !== 'uploads') setSelectedTemplate(null); setActive(v) }

  const SUBTITLES: Partial<Record<NavId, string>> = {
    uploads: 'Laden Sie Ihre Stückliste aus Curcad oder anderen Nachkalkulations-Programmen hoch.',
    angebote: 'Verwalten Sie alle erstellten Angebote.',
    vorlagen: 'Wiederverwendbare Vorlagen für verschiedene Kundentypen.',
  }

  return (
    <div className="flex h-full">
      <Sidebar active={active} setActive={handleSetActive} studioName={settings.studioName} advisorName={settings.advisorName} angebote={angebote} />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TopBar title={VIEW_TITLE[active]} advisorName={settings.advisorName} subtitle={SUBTITLES[active]} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin" style={{ background: '#F8FAFC' }}>
          {active === 'dashboard'     && <DashboardView setActive={handleSetActive} angebote={angebote} settings={settings} />}
          {active === 'uploads'       && <UploadsView settings={settings} templates={templates} selectedTemplate={selectedTemplate} onSave={addAngebot} setActive={handleSetActive} />}
          {active === 'angebote'      && <AngeboteView angebote={angebote} onDelete={deleteAngebot} onStatusChange={changeStatus} />}
          {active === 'vorlagen'      && <VorlagenView templates={templates} saveTemplates={saveTemplates} setActive={handleSetActive} setSelectedTemplate={setSelectedTemplate} />}
          {active === 'kunden'        && <KundenView setActive={handleSetActive} />}
          {active === 'team'          && <TeamView team={team} saveTeam={saveTeam} />}
          {active === 'einstellungen' && <EinstellungenView settings={settings} saveSettings={saveSettings} />}
        </main>
      </div>
    </div>
  )
}
