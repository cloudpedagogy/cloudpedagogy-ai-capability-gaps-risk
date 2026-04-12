import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import DomainBars from "../components/DomainBars";
import SignalBadge from "../components/SignalBadge";
import type { DiagnosticInput, DomainKey } from "../domain/model";
import type { DiagnosticResult } from "../engine/analysis";
import { DOMAINS } from "../domain/model";
import { downloadStressTestJson } from "../engine/export";

const FRAMEWORK_EDITION = "CloudPedagogy AI Capability Framework (2026 Edition)";

function domainLabel(key: DomainKey): string {
  return DOMAINS.find((d) => d.key === key)?.label ?? key;
}

function domainDescription(key: DomainKey): string {
  return DOMAINS.find((d) => d.key === key)?.description ?? "";
}

function WeightBadge({ weight }: { weight: number }) {
  const label = weight >= 5 ? "Critical" : weight >= 4 ? "High" : weight >= 3 ? "Medium" : "Low";
  const color = weight >= 4 ? "#dc2626" : weight >= 3 ? "#d97706" : "#4b5563";
  
  return (
    <span style={{ 
      fontSize: "10px", 
      fontWeight: 700, 
      textTransform: "uppercase", 
      padding: "2px 6px", 
      borderRadius: "4px", 
      border: `1px solid ${color}`,
      color: color,
      marginLeft: "8px"
    }}>
      Weight: {label}
    </span>
  );
}

function whyThisMattersTextForSignal(relatedDomains: DomainKey[]): string {
  const labels = relatedDomains.map(domainLabel);

  if (labels.length === 0) {
    return "This signal connects to multiple capability domains. Use it to prompt discussion about where the system is strong, fragile, or under-supported.";
  }
  if (labels.length === 1) {
    return `This signal is primarily about ${labels[0]}. Weakness here can create downstream fragility even when other areas look strong.`;
  }
  if (labels.length === 2) {
    return `This signal sits at the intersection of ${labels[0]} and ${labels[1]}. Tensions here often show up as “it works in practice, but it isn’t defensible” (or the reverse).`;
  }
  return `This signal spans several domains (${labels.slice(0, 3).join(", ")}${
    labels.length > 3 ? "…" : ""
  }). Multi-domain signals usually indicate a system-level pattern rather than a single fix.`;
}

function nowTimestampUTC(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}

function buildExportText(input: DiagnosticInput, result: DiagnosticResult, generatedAt: string): string {
  const lines: string[] = [];

  lines.push("CloudPedagogy — Gaps & Risk Diagnostic");
  lines.push("-----------------------------------");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Framework: ${FRAMEWORK_EDITION}`);
  lines.push("");

  lines.push(`Organisation/Team: ${input.orgName}${input.contextNotes ? ` — ${input.contextNotes}` : ""}`);
  lines.push(`Overall band: ${result.band}`);
  lines.push(`Average score: ${result.averageScore}/4`);
  lines.push("");

  lines.push("TOP PRIORITIES:");
  result.priorities.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.title} (Weight: ${p.weight})`);
  });
  lines.push("");

  lines.push("Domain scores (0–4):");
  for (const d of DOMAINS) {
    const score = input.scores[d.key] ?? 0;
    lines.push(`- ${d.label}: ${score}/4`);
  }
  lines.push("");

  lines.push("RANKED CAPABILITY GAPS:");
  result.rankedGaps.forEach(g => {
    lines.push(`- [${g.severity}] ${g.label}`);
  });
  lines.push("");

  lines.push("Gaps & risk signals (for discussion):");
  result.signals.forEach((sig, idx) => {
    lines.push("");
    lines.push(`${idx + 1}. [${sig.level}] ${sig.title} (Weight: ${sig.weight})`);
    lines.push(`   Rationale: ${sig.rationale}`);
    if (sig.relatedDomains?.length) {
      lines.push(`   Related domains: ${sig.relatedDomains.map(domainLabel).join("; ")}`);
    }
    lines.push("   Discussion prompts:");
    sig.prompts.forEach((p) => lines.push(`   - ${p}`));
  });

  lines.push("");
  lines.push(
    "Note: This output is reflective and interpretive. It is not a compliance audit, risk register, or automated decision system."
  );

  return lines.join("\n");
}

export default function ResultsView(props: {
  input: DiagnosticInput;
  result: DiagnosticResult;
  onBack: () => void;
}) {
  const { input, result } = props;

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [openWhy, setOpenWhy] = useState<Record<string, boolean>>({});
  const [generatedAt] = useState<string>(() => nowTimestampUTC());

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const sig of result.signals) {
      if (sig.level === "Concern") initial[sig.id] = true;
    }
    setOpenWhy(initial);
  }, [result]);

  const exportText = useMemo(
    () => buildExportText(input, result, generatedAt),
    [input, result, generatedAt]
  );

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1600);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = exportText;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopyStatus("copied");
        window.setTimeout(() => setCopyStatus("idle"), 1600);
      } catch {
        setCopyStatus("error");
        window.setTimeout(() => setCopyStatus("idle"), 2000);
      }
    }
  }

  function toggleWhy(id: string) {
    setOpenWhy((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="stack">
      <Card
        title="Diagnostic Summary"
        right={
          <span className="pill">
            {result.band} · Avg {result.averageScore}/4
          </span>
        }
      >
        <p>
          <strong>{input.orgName}</strong>
          {input.contextNotes ? (
            <>
              {" "}
              — <span className="muted">{input.contextNotes}</span>
            </>
          ) : null}
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
          Generated: {generatedAt} · {FRAMEWORK_EDITION}
        </p>
      </Card>

      <div style={{ borderLeft: "4px solid #111" }}>
        <Card title="Top 3 Priority Risks">
          <p className="muted" style={{ marginBottom: "16px" }}>
            These are the most critical risk signals identified based on your organisational context and capability floor.
          </p>
          <div className="signals">
            {result.priorities.map((p, idx) => (
              <div key={p.id} className="signal" style={{ paddingBottom: idx === result.priorities.length -1 ? 0 : "16px", borderBottom: idx === result.priorities.length -1 ? "none" : "1px solid #EEE" }}>
                 <div className="signal__head" style={{ marginBottom: "8px" }}>
                    <SignalBadge level={p.level} />
                    <div className="signal__title" style={{ fontSize: "1rem" }}>{p.title}</div>
                    <WeightBadge weight={p.weight} />
                 </div>
                 <p className="signal__rationale" style={{ fontSize: "0.875rem", marginBottom: 0 }}>{p.rationale}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid2">
        <Card title="Domain profile">
          <DomainBars scores={input.scores} />
        </Card>

        <Card title="Ranked Capability Gaps">
          <p className="muted" style={{ marginBottom: "16px" }}>
            The largest deficits between current capability and an established baseline (score 4).
          </p>
          <div className="domainTable">
            {(() => {
              const GAP_EXPLANATIONS: Record<DomainKey, string> = {
                awareness: "Low score in Awareness → limited system visibility and frontline understanding",
                coagency: "Low score in Co-agency → reduced student-staff partnership and agency",
                practice: "Low score in Practice → lack of applied AI experience and workflow integration",
                ethics: "Low score in Ethics → increased governance and academic integrity risk",
                governance: "Low score in Governance → unclear institutional accountability and risk controls",
                renewal: "Low score in Renewal → system fragility and lack of long-term sustainability"
              };

              return result.rankedGaps.map((g) => (
                <div key={g.key} className="domainRow" style={{ padding: "12px 0", borderBottom: "1px solid #f9fafb" }}>
                  <div className="domainRow__left">
                    <div className="domainRow__label" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{g.label}</div>
                    <div className="text-secondary" style={{ fontSize: "11px", marginTop: "4px", fontStyle: "italic", color: "#b45309" }}>
                      {GAP_EXPLANATIONS[g.key] || "Gap identified in domain capability."}
                    </div>
                  </div>
                  <div className="domainRow__right">
                    <span className={`tag ${g.severity === 'Critical' ? 'tag--critical' : ''}`} style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                      {g.severity}
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </Card>
      </div>

      <Card title="Full Risk Signals & Discussion Prompts">
        <div className="signals">
          {result.signals.map((s) => {
            const isOpen = !!openWhy[s.id];
            const related = (s.relatedDomains ?? []) as DomainKey[];

            return (
              <div key={s.id} className="signal">
                <div className="signal__head">
                  <SignalBadge level={s.level} />
                  <div className="signal__title">{s.title}</div>
                  <WeightBadge weight={s.weight} />
                </div>

                <p className="signal__rationale">{s.rationale}</p>

                <div className="signal__meta">
                  {related.length > 0 ? (
                    <div className="metaPills">
                      {related.map((dk) => (
                        <span key={dk} className="metaPill">
                          {domainLabel(dk)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="muted">Related domains: not specified</span>
                  )}

                  <button className="btn btn--small" onClick={() => toggleWhy(s.id)}>
                    {isOpen ? "Hide why this matters" : "Why this matters"}
                  </button>
                </div>

                {isOpen && (
                  <div className="whyPanel">
                    <div className="whyPanel__lead">{whyThisMattersTextForSignal(related)}</div>
                    {related.length > 0 && (
                      <>
                        <div className="kicker">Domain context</div>
                        <ul className="whyList">
                          {related.map((dk) => (
                            <li key={dk}>
                              <strong>{domainLabel(dk)}:</strong>{" "}
                              <span className="muted">{domainDescription(dk)}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}

                <div className="kicker">Discussion prompts</div>
                <ul>
                  {s.prompts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Export / Use">
        <p className="muted">
          Use the <strong>Stress Test Export</strong> to feed these results into simulation tools, or copy the summary for discussion.
        </p>

        <div className="actions actions--between">
          <button className="btn" onClick={props.onBack}>
            Back
          </button>

          <div className="actions">
            <button className="btn" onClick={() => downloadStressTestJson(input, result)}>
              Download for Stress Test (.json)
            </button>
            <button className="btn btn--primary" onClick={copyToClipboard}>
              {copyStatus === "copied"
                ? "Copied ✓"
                : copyStatus === "error"
                ? "Copy failed"
                : "Copy summary for discussion"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
