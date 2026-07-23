export default function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`toggle-switch ${checked ? 'on' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    >
      <span className="toggle-knob" />
    </button>
  );
}