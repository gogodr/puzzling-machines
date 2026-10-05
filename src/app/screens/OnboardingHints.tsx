import { STR } from '../strings'

export function OnboardingHints({ step, onNext }: { step: number; onNext(): void }) {
  const text = STR.onboarding[step]
  if (!text) return null
  return (
    <aside className="hint-card" data-testid="onboarding">
      <p>
        {step + 1}/{STR.onboarding.length} · {text}
      </p>
      <button type="button" className="primary" onClick={onNext}>
        {STR.gotIt}
      </button>
    </aside>
  )
}
