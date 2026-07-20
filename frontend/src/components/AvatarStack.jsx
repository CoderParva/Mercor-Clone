const COLORS = ['#c7d2fe', '#fecaca', '#bbf7d0', '#fde68a', '#ddd6fe', '#bfdbfe'];

function hueFor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function AvatarStack({ seed, count = 3 }) {
  const items = Array.from({ length: Math.min(count, 3) }, (_, i) => `${seed}-${i}`);
  return (
    <div className="avatar-stack">
      {items.map((key, i) => (
        <span
          key={key}
          className="avatar-dot"
          style={{ background: hueFor(key), zIndex: items.length - i }}
        >
          {String.fromCharCode(65 + ((i + seed.length) % 26))}
        </span>
      ))}
    </div>
  );
}
