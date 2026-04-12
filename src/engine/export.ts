import type { DiagnosticInput } from "../domain/model";
import type { DiagnosticResult } from "./analysis";

/**
 * Generates a structured JSON snapshot of the diagnostic result.
 * Designed to be compatible with downstream simulation and stress test tools.
 */
export function generateStressTestJson(input: DiagnosticInput, result: DiagnosticResult) {
  const exportData = {
    metadata: {
      organisation: input.orgName,
      context: input.contextNotes,
      timestamp: new Date().toISOString(),
      framework: "CloudPedagogy AI Capability Framework (2026 Edition)"
    },
    capabilities: {
      overall_band: result.band,
      average_score: result.averageScore,
      scores: input.scores,
      ranked_gaps: result.rankedGaps.map(g => ({
        domain: g.label,
        severity: g.severity
      }))
    },
    risk_profile: {
      priorities: result.priorities.map(p => ({
        title: p.title,
        weight: p.weight,
        level: p.level,
        rationale: p.rationale,
        related_domains: p.relatedDomains
      })),
      all_signals: result.signals.map(s => ({
        id: s.id,
        title: s.title,
        weight: s.weight,
        level: s.level
      }))
    },
    context_flags: {
      high_stakes_use: input.signals.highStakesUse,
      public_facing: input.signals.publicFacing,
      sensitive_data: input.signals.sensitiveData,
      vendor_reliance: input.signals.vendorReliance,
      unclear_ownership: input.signals.unclearOwnership
    }
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadStressTestJson(input: DiagnosticInput, result: DiagnosticResult) {
  const json = generateStressTestJson(input, result);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const filename = `stress-test-input-${input.orgName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
