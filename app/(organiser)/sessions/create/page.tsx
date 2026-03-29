'use client'

import { useState, useTransition } from 'react'
import { createSession, type SessionFormData } from '@/app/actions/organiser'

const STEPS = ['Details', 'Pricing', 'Capacity', 'Confirm']

const EMPTY: SessionFormData = {
  title: '', description: '', date: '', time: '', location: '',
  isFree: true, pricePounds: '',
  capacity: '20', waitlistEnabled: false, membersOnly: false,
}

export default function CreateSessionPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<SessionFormData>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function set<K extends keyof SessionFormData>(key: K, value: SessionFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function next() { setError(null); setStep(s => s + 1) }
  function back() { setError(null); setStep(s => s - 1) }

  function submit() {
    startTransition(async () => {
      const result = await createSession(form)
      if (result && 'error' in result) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="flex items-center gap-3 py-4">
          {step > 0 && (
            <button onClick={back} className="-ml-1 p-1 rounded-xl active:bg-ink/6">
              <svg className="w-5 h-5 text-ink/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          <div className="flex-1">
            <p className="text-xs font-bold text-ink/40">Step {step + 1} of {STEPS.length}</p>
            <h1 className="text-lg font-black text-ink">{STEPS[step]}</h1>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-ink/6 rounded-full mb-3 overflow-hidden">
          <div className="h-full bg-coral rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        {step === 0 && <StepDetails form={form} set={set} onNext={next} />}
        {step === 1 && <StepPricing form={form} set={set} onNext={next} />}
        {step === 2 && <StepCapacity form={form} set={set} onNext={next} />}
        {step === 3 && <StepConfirm form={form} onSubmit={submit} isPending={isPending} error={error} />}
      </main>
    </div>
  )
}

// ── Step components ────────────────────────────────────────────────────────

type SetFn = <K extends keyof SessionFormData>(k: K, v: SessionFormData[K]) => void

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-extrabold text-ink">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-4 py-3.5 rounded-[14px] border-2 border-ink/10 bg-white text-ink font-semibold placeholder:text-ink/30 focus:outline-none focus:border-coral transition-colors"

function NextBtn({ label = 'Continue', onClick, disabled }: { label?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-4 mt-6 rounded-btn bg-coral text-white font-extrabold text-base disabled:opacity-40 active:scale-95 transition-transform"
    >
      {label}
    </button>
  )
}

function StepDetails({ form, set, onNext }: { form: SessionFormData; set: SetFn; onNext: () => void }) {
  const valid = form.title.trim() && form.date && form.time && form.location.trim()

  // Get today's date in YYYY-MM-DD for the min attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4 pt-2">
      <Field label="Session title">
        <input className={inputCls} placeholder="e.g. Sunday 5k Run" value={form.title}
          onChange={e => set('title', e.target.value)} maxLength={80} />
      </Field>
      <Field label="Description">
        <textarea className={`${inputCls} resize-none`} rows={3} placeholder="What should attendees know?"
          value={form.description} onChange={e => set('description', e.target.value)} maxLength={500} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" className={inputCls} min={today} value={form.date}
            onChange={e => set('date', e.target.value)} />
        </Field>
        <Field label="Time">
          <input type="time" className={inputCls} value={form.time}
            onChange={e => set('time', e.target.value)} />
        </Field>
      </div>
      <Field label="Location">
        <input className={inputCls} placeholder="e.g. Victoria Park Main Gate, E3" value={form.location}
          onChange={e => set('location', e.target.value)} maxLength={120} />
      </Field>
      <NextBtn onClick={onNext} disabled={!valid} />
    </div>
  )
}

function StepPricing({ form, set, onNext }: { form: SessionFormData; set: SetFn; onNext: () => void }) {
  const valid = form.isFree || (form.pricePounds !== '' && parseFloat(form.pricePounds) > 0)

  return (
    <div className="space-y-4 pt-2">
      <div className="flex gap-3">
        {[true, false].map(free => (
          <button key={String(free)} onClick={() => set('isFree', free)}
            className={`flex-1 py-3.5 rounded-[14px] border-2 font-extrabold text-sm transition-colors ${
              form.isFree === free ? 'border-coral bg-coral/5 text-coral' : 'border-ink/10 text-ink/50'
            }`}
          >
            {free ? '🎉 Free' : '🎟 Paid'}
          </button>
        ))}
      </div>

      {!form.isFree && (
        <Field label="Ticket price (£)">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-ink/40">£</span>
            <input type="number" min="0.50" step="0.50" className={`${inputCls} pl-8`}
              placeholder="5.00" value={form.pricePounds}
              onChange={e => set('pricePounds', e.target.value)} />
          </div>
          <p className="text-xs text-ink/40 font-semibold px-1">+ £0.50 JOYN booking fee added on top</p>
        </Field>
      )}

      {form.isFree && (
        <div className="bg-green-joyn/8 rounded-card p-4">
          <p className="text-sm font-bold text-green-700">Free events build community faster.</p>
          <p className="text-xs text-green-700/70 mt-1">You can always run paid sessions later.</p>
        </div>
      )}

      <NextBtn onClick={onNext} disabled={!valid} />
    </div>
  )
}

function StepCapacity({ form, set, onNext }: { form: SessionFormData; set: SetFn; onNext: () => void }) {
  const valid = parseInt(form.capacity) > 0

  return (
    <div className="space-y-4 pt-2">
      <Field label="Max spots">
        <input type="number" min="1" max="500" className={inputCls}
          value={form.capacity} onChange={e => set('capacity', e.target.value)} />
      </Field>

      <Toggle label="Enable waitlist" sub="Let people queue if the session fills up"
        value={form.waitlistEnabled} onChange={v => set('waitlistEnabled', v)} />

      <Toggle label="Members only" sub="Only people in your community can join"
        value={form.membersOnly} onChange={v => set('membersOnly', v)} />

      <NextBtn onClick={onNext} disabled={!valid} />
    </div>
  )
}

function Toggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full bg-white rounded-card border border-ink/5 p-4 text-left"
    >
      <div>
        <p className="text-sm font-extrabold text-ink">{label}</p>
        <p className="text-xs font-semibold text-ink/50 mt-0.5">{sub}</p>
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-coral' : 'bg-ink/15'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${value ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  )
}

function StepConfirm({ form, onSubmit, isPending, error }: {
  form: SessionFormData; onSubmit: () => void; isPending: boolean; error: string | null
}) {
  const price = form.isFree ? 'Free' : `£${parseFloat(form.pricePounds || '0').toFixed(2)}`

  return (
    <div className="pt-2 space-y-4">
      <div className="bg-white rounded-card border border-ink/5 divide-y divide-ink/5">
        <Row label="Title" value={form.title} />
        <Row label="Date" value={`${form.date} at ${form.time}`} />
        <Row label="Location" value={form.location} />
        <Row label="Price" value={price} />
        <Row label="Capacity" value={`${form.capacity} spots`} />
        {form.waitlistEnabled && <Row label="Waitlist" value="Enabled" />}
        {form.membersOnly && <Row label="Access" value="Members only" />}
      </div>

      {error && <p className="text-sm font-bold text-red-500 text-center">{error}</p>}

      <button onClick={onSubmit} disabled={isPending}
        className="w-full py-4 rounded-btn bg-coral text-white font-extrabold text-base disabled:opacity-50 active:scale-95 transition-transform"
      >
        {isPending ? 'Publishing…' : '🚀 Publish session'}
      </button>
      <p className="text-center text-xs text-ink/40 font-semibold">Goes live immediately — attendees can join right away.</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-bold text-ink/50">{label}</span>
      <span className="text-sm font-extrabold text-ink">{value}</span>
    </div>
  )
}
