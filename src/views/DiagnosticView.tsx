import { useMemo, useState } from "react";
import Card from "../components/Card";
import { DOMAINS, clampScore, type DiagnosticInput, type DomainKey } from "../domain/model";

function NumberSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(clampScore(Number(e.target.value)))}>
      <option value={0}>0 — Not present</option>
      <option value={1}>1 — Emerging</option>
      <option value={2}>2 — Developing</option>
      <option value={3}>3 — Established</option>
      <option value={4}>4 — Leading</option>
    </select>
  );
}

export default function DiagnosticView(props: {
  onSubmit: (input: DiagnosticInput) => void;
  onBack: () => void;
}) {
  const [orgName, setOrgName] = useState("My team / organisation");
  const [contextNotes, setContextNotes] = useState("");

  const [scores, setScores] = useState<Record<DomainKey, number>>({
    awareness: 2,
    coagency: 2,
    practice: 2,
    ethics: 2,
    governance: 2,
    renewal: 2,
  });

  const [includeCoverage, setIncludeCoverage] = useState(false);
  const [coverage, setCoverage] = useState<Partial<Record<DomainKey, number>>>({
    awareness: 0,
    coagency: 0,
    practice: 0,
    ethics: 0,
    governance: 0,
    renewal: 0,
  });

  const [signals, setSignals] = useState({
    highStakesUse: false,
    publicFacing: false,
    sensitiveData: false,
    vendorReliance: false,
    unclearOwnership: false,
  });

  const canSubmit = useMemo(() => orgName.trim().length > 0, [orgName]);

  return (
    <div className="stack">
      <Card title="Context">
        <div className="grid2">
          <label className="field">
            <div className="field__label">Team / organisation name</div>
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </label>

          <label className="field">
            <div className="field__label">Notes (optional)</div>
            <input
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="e.g., higher education programme team, public service unit, research group..."
            />
          </label>
        </div>
      </Card>

      <Card title="Domain scores (0–4)">
        <p className="muted">
          These are reflective estimates. Use them to support discussion — not to “get the right number”.
        </p>
        <p className="muted">
          If completing this as a team, agree scores through discussion rather than averaging individual views.
        </p>

        <div className="domainTable">
          {DOMAINS.map((d) => (
            <div key={d.key} className="domainRow">
              <div className="domainRow__left">
                <div className="domainRow__label">{d.label}</div>
                <div className="domainRow__desc">{d.description}</div>
              </div>
              <div className="domainRow__right">
                <NumberSelect
                  value={scores[d.key]}
                  onChange={(n) => setScores((prev) => ({ ...prev, [d.key]: n }))}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Context signals (optional)"
        right={
          <span className="muted">Used to tune severity — still reflective</span>
        }
      >
        <div className="checks">
          {[
            ["highStakesUse", "High-stakes use (assessment, consequential decisions, clinical, admissions, etc.)"],
            ["publicFacing", "Public-facing outputs (published externally or used with external stakeholders)"],
            ["sensitiveData", "Sensitive / confidential data involved"],
            ["vendorReliance", "Heavy reliance on a single vendor/toolchain"],
            ["unclearOwnership", "Unclear ownership/accountability for AI-supported work"],
          ].map(([key, label]) => (
            <label key={key} className="check">
              <input
                type="checkbox"
                checked={(signals as any)[key]}
                onChange={(e) => setSignals((p) => ({ ...p, [key]: e.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card title="Programme coverage estimates (optional)">
        <label className="check">
          <input type="checkbox" checked={includeCoverage} onChange={(e) => setIncludeCoverage(e.target.checked)} />
          <span>Include rough coverage estimates (0–100%) to detect structural imbalance</span>
        </label>

        {includeCoverage && (
          <div className="domainTable">
            {DOMAINS.map((d) => (
              <div key={d.key} className="domainRow">
                <div className="domainRow__left">
                  <div className="domainRow__label">{d.label}</div>
                  <div className="domainRow__desc">Approximate proportion of attention/learning/practice in this domain.</div>
                </div>
                <div className="domainRow__right">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={coverage[d.key] ?? 0}
                    onChange={(e) =>
                      setCoverage((prev) => ({
                        ...prev,
                        [d.key]: Math.max(0, Math.min(100, Number(e.target.value))),
                      }))
                    }
                  />
                  <span className="muted">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="actions actions--between">
        <button className="btn" onClick={props.onBack}>
          Back
        </button>
        <button
          className="btn btn--primary"
          disabled={!canSubmit}
          onClick={() =>
            props.onSubmit({
              orgName: orgName.trim(),
              contextNotes: contextNotes.trim(),
              scores,
              coverage: includeCoverage ? coverage : undefined,
              signals,
            })
          }
        >
          Generate diagnostic
        </button>
      </div>
    </div>
  );
}
