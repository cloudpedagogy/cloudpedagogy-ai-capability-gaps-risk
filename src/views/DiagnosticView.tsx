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

type SignalKey = keyof DiagnosticInput["signals"];

const SIGNAL_DEFINITIONS: Array<{ key: SignalKey; label: string }> = [
  { key: "highStakesUse", label: "High-stakes use (assessment, consequential decisions, clinical, admissions, etc.)" },
  { key: "publicFacing", label: "Public-facing outputs (published externally or used with external stakeholders)" },
  { key: "sensitiveData", label: "Sensitive / confidential data involved" },
  { key: "vendorReliance", label: "Heavy reliance on a single vendor/toolchain" },
  { key: "unclearOwnership", label: "Unclear ownership/accountability for AI-supported work" },
];

export default function DiagnosticView(props: {
  onSubmit: (input: DiagnosticInput) => void;
  onBack: () => void;
  initialInput?: DiagnosticInput | null;
}) {
  const [orgName, setOrgName] = useState(() => props.initialInput?.orgName ?? "My team / organisation");
  const [contextNotes, setContextNotes] = useState(() => props.initialInput?.contextNotes ?? "");

  const [scores, setScores] = useState<Record<DomainKey, number>>(() => props.initialInput?.scores ?? {
    awareness: 2,
    coagency: 2,
    practice: 2,
    ethics: 2,
    governance: 2,
    renewal: 2,
  });

  const [includeCoverage, setIncludeCoverage] = useState(() =>
    Boolean(props.initialInput?.coverage && Object.keys(props.initialInput.coverage).length > 0)
  );
  const [coverage, setCoverage] = useState<Partial<Record<DomainKey, number>>>(() => props.initialInput?.coverage ?? {
    awareness: 0,
    coagency: 0,
    practice: 0,
    ethics: 0,
    governance: 0,
    renewal: 0,
  });
  const [signals, setSignals] = useState(() => props.initialInput?.signals ?? {
    highStakesUse: false,
    publicFacing: false,
    sensitiveData: false,
    vendorReliance: false,
    unclearOwnership: false,
  });

  const [capabilityNotes, setCapabilityNotes] = useState(() => props.initialInput?.capabilityNotes ?? "");
  const [governanceNotes, setGovernanceNotes] = useState(() => props.initialInput?.governanceNotes ?? "");
  const [showNotes, setShowNotes] = useState(() =>
    Boolean(props.initialInput?.capabilityNotes || props.initialInput?.governanceNotes)
  );

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
          {SIGNAL_DEFINITIONS.map(({ key, label }) => (
            <label key={key} className="check">
              <input
                type="checkbox"
                checked={signals[key]}
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

      <Card title="Capability & Governance Notes (Optional)">
        <button 
          className="btn btn--secondary btn--small" 
          onClick={() => setShowNotes(!showNotes)}
          style={{ marginBottom: showNotes ? "16px" : 0 }}
        >
          {showNotes ? "Hide notes" : "Show notes"}
        </button>

        {showNotes && (
          <div className="stack" style={{ marginTop: "8px" }}>
            <p className="muted" style={{ fontSize: "0.8rem" }}>
              /* Lightweight capability and governance layer - Optional, non-blocking, and does not alter core workflow */
            </p>
            <div className="grid2">
              <label className="field">
                <div className="field__label" style={{ fontSize: "0.8rem" }}>Capability Notes</div>
                <textarea
                  value={capabilityNotes}
                  onChange={(e) => setCapabilityNotes(e.target.value)}
                  placeholder="What capability does this support? Suggested AI use patterns..."
                  rows={3}
                  style={{ fontSize: "0.8rem", fontFamily: "inherit", border: "1px solid #ccc", padding: "8px" }}
                />
              </label>
              <label className="field">
                <div className="field__label" style={{ fontSize: "0.8rem" }}>Governance Notes</div>
                <textarea
                  value={governanceNotes}
                  onChange={(e) => setGovernanceNotes(e.target.value)}
                  placeholder="AI involvement, assumptions, risks, rationale, human review notes..."
                  rows={3}
                  style={{ fontSize: "0.8rem", fontFamily: "inherit", border: "1px solid #ccc", padding: "8px" }}
                />
              </label>
            </div>
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
              capabilityNotes: capabilityNotes.trim() || undefined,
              governanceNotes: governanceNotes.trim() || undefined,
            })
          }
        >
          Generate diagnostic
        </button>
      </div>
    </div>
  );
}
