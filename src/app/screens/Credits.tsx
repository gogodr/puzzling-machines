import { STR } from '../strings'

export function Credits({ onBack }: { onBack(): void }) {
  return (
    <div className="overlay overlay--menu" role="dialog" aria-labelledby="credits-title">
      <section className="panel">
        <h2 id="credits-title">{STR.credits}</h2>
        <p>{STR.creditsBody}</p>
        <div className="actions">
          <button type="button" className="primary" onClick={onBack} autoFocus>
            {STR.back}
          </button>
        </div>
      </section>
    </div>
  )
}
