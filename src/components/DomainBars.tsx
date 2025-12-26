import { DOMAINS, type DomainKey } from "../domain/model";

export default function DomainBars(props: { scores: Record<DomainKey, number> }) {
  return (
    <div className="bars">
      {DOMAINS.map((d) => {
        const s = props.scores[d.key] ?? 0;
        const pct = Math.round((s / 4) * 100);
        return (
          <div key={d.key} className="barrow">
            <div className="barrow__label">{d.label}</div>
            <div className="barrow__bar">
              <div className="barrow__fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="barrow__value">{s}/4</div>
          </div>
        );
      })}
    </div>
  );
}
