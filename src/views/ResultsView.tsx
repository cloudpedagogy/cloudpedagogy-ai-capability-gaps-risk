import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import DomainBars from "../components/DomainBars";
import SignalBadge from "../components/SignalBadge";
import type { DiagnosticInput, DomainKey } from "../domain/model";
import type { DiagnosticResult } from "../engine/analysis";
import { DOMAINS } from "../domain/model";

const FRAMEWORK_EDITION = "CloudPedagogy AI Capability Framework (2026 Edition)";

function domainLabel(key: DomainKey): string {
  return DOMAINS.find((d) => d.key === key)?.label ?? key;
}

function domainDescription(key: DomainKey): string {
  return DOMAINS.find((d) => d.key === key)?.description ?? "";
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

  lines.push("Domain scores (0–4):");
  for (const d of DOMAINS) {
    const score = input.scores[d.key] ?? 0;
    lines.push(`- ${d.label}: ${score}/4`);
  }
  lines.push("");

  if (input.coverage && Object.keys(input.coverage).length > 0) {
    lines.push("Optional coverage estimates (0–100%):");
    for (const d of DOMAINS) {
      const v = input.coverage[d.key];
      if (typeof v === "number") lines.push(`- ${d.label}: ${v}%`);
    }
    lines.push("");
  }

  lines.push("Strength signals:");
  for (const s of result.summary.strengths) lines.push(`- ${s}`);
  lines.push("");

  lines.push("Gap signals:");
  for (const g of result.summary.gaps) lines.push(`- ${g}`);
  lines.push("");

  if (result.summary.stabilisers.length > 0) {
    lines.push("Stabilisers already present:");
    for (const x of result.summary.stabilisers) lines.push(`- ${x}`);
    lines.push("");
  }

  lines.push("Gaps & risk signals (for discussion):");
  result.signals.forEach((sig, idx) => {
    lines.push("");
    lines.push(`${idx + 1}. [${sig.level}] ${sig.title}`);
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

  // Auto-open “Why this matters” for Concern signals only
  const [openWhy, setOpenWhy] = useState<Record<string, boolean>>({});

  // Freeze a generated-at timestamp for this render (so copy/export is consistent)
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
      // Fallback for older/locked-down browsers
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
        title="Summary"
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

        <div className="split">
          <div>
            <div className="kicker">Strength signals</div>
            <ul>
              {result.summary.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="kicker">Gap signals</div>
            <ul>
              {result.summary.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </div>

        {result.summary.stabilisers.length > 0 && (
          <>
            <div className="kicker">Stabilisers already present</div>
            <ul>
              {result.summary.stabilisers.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card title="Domain profile">
        <DomainBars scores={input.scores} />
      </Card>

      <Card title="Gaps & risk signals">
        <div className="signals">
          {result.signals.map((s) => {
            const isOpen = !!openWhy[s.id];
            const related = (s.relatedDomains ?? []) as DomainKey[];

            return (
              <div key={s.id} className="signal">
                <div className="signal__head">
                  <SignalBadge level={s.level} />
                  <div className="signal__title">{s.title}</div>
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

                        <div className="kicker">How to use this in a committee or workshop</div>
                        <ul className="whyList">
                          <li>
                            Ask: <strong>“Where does this show up in our current workflow?”</strong>
                          </li>
                          <li>
                            Ask: <strong>“Who carries responsibility here — and is that explicit?”</strong>
                          </li>
                          <li>
                            Agree one: <strong>evidence to collect</strong> or <strong>small stabilising step</strong>{" "}
                            before scaling use.
                          </li>
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

      <Card title="Export / use">
        <p className="muted">
          Tip: copy/paste the summary and signals into committee papers, QA notes, workshop minutes, or programme
          documentation. The value is in the discussion you run next.
        </p>

        <div className="actions actions--between">
          <button className="btn" onClick={props.onBack}>
            Back
          </button>

          <div className="actions">
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
