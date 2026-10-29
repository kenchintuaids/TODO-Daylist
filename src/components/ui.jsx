import { useEffect, useRef, useState } from "react";

const cx = (...a) => a.filter(Boolean).join(" ");

/* A hand-drawn tick box. Filled with blue-ink scribble when done. */
export function Box({ on, onClick, disabled, label }) {
  return (
    <button type="button" className={cx("box", on && "on")} onClick={onClick} disabled={disabled}
      aria-pressed={on} aria-label={label} />
  );
}

/* The red circle: fills like a pie as non-negotiables get done. Same drawing as the tab icon. */
export function Pie({ done, total, size = 92 }) {
  const frac = total > 0 ? Math.min(1, done / total) : 0;
  const c = size / 2;
  const r = size / 2 - 4;
  const end = -Math.PI / 2 + Math.PI * 2 * frac;
  const x = c + r * Math.cos(end);
  const y = c + r * Math.sin(end);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${done} of ${total} done`}>
      <circle cx={c} cy={c} r={r} fill="var(--red)" fillOpacity="0.14" />
      {frac >= 1 ? (
        <circle cx={c} cy={c} r={r} fill="var(--red)" />
      ) : frac > 0 ? (
        <path d={`M ${c} ${c} L ${c} ${c - r} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y} Z`} fill="var(--red)" />
      ) : null}
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--red)" strokeWidth="3" />
    </svg>
  );
}

export function Seg({ value, options, onChange }) {
  return (
    <div className="seg" role="group">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Two-step button: first click asks "Sure?", second click does it. */
export function ConfirmBtn({ children, onConfirm, className = "btn sm danger", ask = "Sure?" }) {
  const [armed, setArmed] = useState(false);
  const t = useRef(null);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button type="button" className={className} onClick={() => {
      if (armed) { clearTimeout(t.current); setArmed(false); onConfirm(); }
      else { setArmed(true); t.current = setTimeout(() => setArmed(false), 3000); }
    }}>{armed ? ask : children}</button>
  );
}

/* Optional life-area picker: area, then its subcategory. */
export function AreaSelect({ areas, areaId, subId, onChange }) {
  const area = areas.find((a) => a.id === areaId) || null;
  if (!areas.length) return null;
  return (
    <div className="row">
      <select className="field sm" style={{ width: "auto", minWidth: 130 }} value={areaId || ""}
        onChange={(e) => onChange(e.target.value || null, null)} aria-label="Life area">
        <option value="">No area</option>
        {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      {area && area.subs.length > 0 && (
        <select className="field sm" style={{ width: "auto", minWidth: 120 }} value={subId || ""}
          onChange={(e) => onChange(areaId, e.target.value || null)} aria-label="Subcategory">
          <option value="">General</option>
          {area.subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}
    </div>
  );
}

/* Binding rings along the top of the notebook. */
export function Rings() {
  return (
    <div className="rings" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => <span key={i} className="ring" />)}
    </div>
  );
}
