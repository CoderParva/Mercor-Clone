export default function AIAvatar({ mode }) {
  // mode: 'speaking' | 'listening' | 'idle'
  return (
    <div className={`ai-avatar-visual ${mode}`}>
      <svg viewBox="0 0 100 100" width="72" height="72">
        <circle cx="50" cy="50" r="46" className="ai-avatar-ring ai-avatar-ring-outer" />
        <circle cx="50" cy="50" r="36" className="ai-avatar-ring ai-avatar-ring-inner" />
        <circle cx="50" cy="50" r="24" className="ai-avatar-core" />
        {mode === 'speaking' && (
          <g className="ai-avatar-bars">
            <rect x="38" y="44" width="4" height="12" rx="2" />
            <rect x="46" y="38" width="4" height="24" rx="2" />
            <rect x="54" y="42" width="4" height="16" rx="2" />
            <rect x="62" y="46" width="4" height="8" rx="2" />
          </g>
        )}
        {mode === 'listening' && (
          <circle cx="50" cy="50" r="10" className="ai-avatar-dot" />
        )}
      </svg>
      <span className="ai-avatar-label">
        {mode === 'speaking' ? 'AI is asking...' : mode === 'listening' ? 'Listening...' : ''}
      </span>
    </div>
  );
}