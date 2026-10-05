import type { Settings } from '../storage/settings'
import { STR } from '../strings'

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange(next: boolean): void
}) {
  return (
    <label className="toggle" htmlFor={id}>
      <span>{label}</span>
      <button type="button" id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
        {checked ? STR.on : STR.off}
      </button>
    </label>
  )
}

export function SettingsPanel({
  settings,
  onChange,
  onReset,
  onBack,
  showUnlockAll,
}: {
  settings: Settings
  onChange(next: Settings): void
  onReset(): void
  onBack(): void
  showUnlockAll: boolean
}) {
  return (
    <div className="overlay overlay--menu" role="dialog" aria-labelledby="settings-title">
      <section className="panel">
        <h2 id="settings-title">{STR.settings}</h2>
        <div className="settings-list">
          <Toggle
            id="set-sound"
            label={STR.sound}
            checked={settings.sound}
            onChange={(sound) => onChange({ ...settings, sound })}
          />
          <Toggle
            id="set-motion"
            label={STR.reducedMotion}
            checked={settings.reducedMotion}
            onChange={(reducedMotion) => onChange({ ...settings, reducedMotion })}
          />
          <Toggle
            id="set-follow"
            label={STR.cameraFollow}
            checked={settings.cameraFollow}
            onChange={(cameraFollow) => onChange({ ...settings, cameraFollow })}
          />
          {showUnlockAll && (
            <Toggle
              id="set-unlock"
              label={STR.unlockAll}
              checked={settings.unlockAll}
              onChange={(unlockAll) => onChange({ ...settings, unlockAll })}
            />
          )}
        </div>
        <div className="actions">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(STR.resetConfirm)) onReset()
            }}
          >
            {STR.resetProgress}
          </button>
          <button type="button" className="primary" onClick={onBack} autoFocus>
            {STR.back}
          </button>
        </div>
      </section>
    </div>
  )
}
