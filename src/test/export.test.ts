import { describe, it, expect, vi } from "vitest";
import { generateStressTestJson, downloadStressTestJson } from "../engine/export";
import { analyseGapsAndRisk } from "../engine/analysis";
import type { DiagnosticInput } from "../domain/model";

describe("Stress Test Export Compatibility Contract", () => {
  const representativeInput: DiagnosticInput = {
    orgName: "Global Academy of Health",
    contextNotes: "Admissions and diagnostic AI rollout",
    scores: {
      awareness: 3,
      coagency: 2,
      practice: 3,
      ethics: 1,
      governance: 1,
      renewal: 2,
    },
    signals: {
      highStakesUse: true,
      publicFacing: true,
      sensitiveData: true,
      vendorReliance: true,
      unclearOwnership: true,
    },
    capabilityNotes: "Exploring multi-agent tutoring and intake triaging",
    governanceNotes: "Clinical oversight committee review pending",
  };

  it("generates a JSON snapshot that strictly matches the Scenario Stress Test contract schema", () => {
    const result = analyseGapsAndRisk(representativeInput);
    const jsonString = generateStressTestJson(representativeInput, result);

    expect(typeof jsonString).toBe("string");
    const parsed = JSON.parse(jsonString);

    // 1. Metadata block
    expect(parsed).toHaveProperty("metadata");
    expect(parsed.metadata).toMatchObject({
      organisation: "Global Academy of Health",
      context: "Admissions and diagnostic AI rollout",
      capability_notes: "Exploring multi-agent tutoring and intake triaging",
      governance_notes: "Clinical oversight committee review pending",
      framework: "CloudPedagogy AI Capability Framework (2026 Edition)",
    });
    expect(typeof parsed.metadata.timestamp).toBe("string");
    expect(new Date(parsed.metadata.timestamp).toISOString()).toBe(parsed.metadata.timestamp);

    // 2. Capabilities block
    expect(parsed).toHaveProperty("capabilities");
    expect(parsed.capabilities).toMatchObject({
      overall_band: "Developing",
      average_score: 2.0,
      scores: {
        awareness: 3,
        coagency: 2,
        practice: 3,
        ethics: 1,
        governance: 1,
        renewal: 2,
      },
    });

    expect(Array.isArray(parsed.capabilities.ranked_gaps)).toBe(true);
    expect(parsed.capabilities.ranked_gaps).toHaveLength(6);
    parsed.capabilities.ranked_gaps.forEach((g: { domain: string; severity: string }) => {
      expect(typeof g.domain).toBe("string");
      expect(["Critical", "High", "Moderate", "Low"]).toContain(g.severity);
    });

    // 3. Risk Profile block
    expect(parsed).toHaveProperty("risk_profile");
    expect(Array.isArray(parsed.risk_profile.priorities)).toBe(true);
    expect(parsed.risk_profile.priorities.length).toBeLessThanOrEqual(3);

    parsed.risk_profile.priorities.forEach(
      (p: { title: string; weight: number; level: string; rationale: string; related_domains: string[] }) => {
        expect(typeof p.title).toBe("string");
        expect(typeof p.weight).toBe("number");
        expect(p.weight).toBeGreaterThanOrEqual(1);
        expect(p.weight).toBeLessThanOrEqual(5);
        expect(["Info", "Watch", "Concern"]).toContain(p.level);
        expect(typeof p.rationale).toBe("string");
        expect(Array.isArray(p.related_domains)).toBe(true);
      }
    );

    expect(Array.isArray(parsed.risk_profile.all_signals)).toBe(true);
    parsed.risk_profile.all_signals.forEach(
      (s: { id: string; title: string; weight: number; level: string }) => {
        expect(typeof s.id).toBe("string");
        expect(typeof s.title).toBe("string");
        expect(typeof s.weight).toBe("number");
        expect(["Info", "Watch", "Concern"]).toContain(s.level);
      }
    );

    // 4. Context Flags block
    expect(parsed).toHaveProperty("context_flags");
    expect(parsed.context_flags).toEqual({
      high_stakes_use: true,
      public_facing: true,
      sensitive_data: true,
      vendor_reliance: true,
      unclear_ownership: true,
    });
  });

  it("handles empty or optional metadata fields safely without breaking contract", () => {
    const minimalInput: DiagnosticInput = {
      orgName: "Minimal Lab",
      contextNotes: "",
      scores: {
        awareness: 2,
        coagency: 2,
        practice: 2,
        ethics: 2,
        governance: 2,
        renewal: 2,
      },
      signals: {
        highStakesUse: false,
        publicFacing: false,
        sensitiveData: false,
        vendorReliance: false,
        unclearOwnership: false,
      },
    };

    const result = analyseGapsAndRisk(minimalInput);
    const parsed = JSON.parse(generateStressTestJson(minimalInput, result));

    expect(parsed.metadata.organisation).toBe("Minimal Lab");
    expect(parsed.metadata.context).toBe("");
    expect(parsed.metadata.capability_notes).toBeUndefined();
    expect(parsed.metadata.governance_notes).toBeUndefined();
    expect(parsed.context_flags.high_stakes_use).toBe(false);
  });

  it("triggers browser download with formatted filename when downloadStressTestJson is called", () => {
    const result = analyseGapsAndRisk(representativeInput);

    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    const clickMock = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      (node as HTMLElement).click = clickMock;
      return node;
    });
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

    downloadStressTestJson(representativeInput, result);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
