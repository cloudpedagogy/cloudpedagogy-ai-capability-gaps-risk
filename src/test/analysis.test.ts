import { describe, it, expect } from "vitest";
import { analyseGapsAndRisk } from "../engine/analysis";
import type { DiagnosticInput, DomainKey } from "../domain/model";

describe("Analysis Engine (analyseGapsAndRisk)", () => {
  const balancedBaselineInput: DiagnosticInput = {
    orgName: "Test University",
    contextNotes: "Faculty of Science",
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

  it("calculates domain stats, gaps, averageScore and band for balanced baseline", () => {
    const result = analyseGapsAndRisk(balancedBaselineInput);

    expect(result.averageScore).toBe(2.0);
    expect(result.band).toBe("Developing");
    expect(result.domainStats).toHaveLength(6);

    result.domainStats.forEach((stat) => {
      expect(stat.score).toBe(2);
      expect(stat.gap).toBe(2); // 4 - 2 = 2
    });

    // Gap severity for gap 2 is 'High'
    result.rankedGaps.forEach((g) => {
      expect(g.severity).toBe("High");
    });

    // When no specific risks trigger, fallback "no-major-signals" is generated
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0].id).toBe("no-major-signals");
    expect(result.signals[0].level).toBe("Info");
  });

  it("triggers low-floor signal when any domain has score <= 1", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        ...balancedBaselineInput.scores,
        ethics: 1,
      },
    };

    const result = analyseGapsAndRisk(input);
    const lowFloor = result.signals.find((s) => s.id === "low-floor");

    expect(lowFloor).toBeDefined();
    expect(lowFloor?.level).toBe("Concern");
    expect(lowFloor?.weight).toBe(4); // 4 without high stakes
    expect(lowFloor?.relatedDomains).toContain("ethics");
  });

  it("applies high-stakes multiplier to low-floor signal weight", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        ...balancedBaselineInput.scores,
        governance: 0,
      },
      signals: {
        ...balancedBaselineInput.signals,
        highStakesUse: true,
      },
    };

    const result = analyseGapsAndRisk(input);
    const lowFloor = result.signals.find((s) => s.id === "low-floor");

    expect(lowFloor).toBeDefined();
    expect(lowFloor?.weight).toBe(5); // 4 + 1
  });

  it("triggers imbalance signal when spread is >= 2 and elevates to Concern at >= 3", () => {
    // Spread = 2 (scores: 2 and 4)
    const inputSpread2: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        awareness: 4,
        coagency: 2,
        practice: 2,
        ethics: 2,
        governance: 2,
        renewal: 2,
      },
    };
    const res2 = analyseGapsAndRisk(inputSpread2);
    const imb2 = res2.signals.find((s) => s.id === "imbalance");
    expect(imb2).toBeDefined();
    expect(imb2?.level).toBe("Watch");
    expect(imb2?.weight).toBe(3);

    // Spread = 3 (scores: 1 and 4)
    const inputSpread3: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        awareness: 4,
        coagency: 3,
        practice: 2,
        ethics: 1,
        governance: 2,
        renewal: 2,
      },
    };
    const res3 = analyseGapsAndRisk(inputSpread3);
    const imb3 = res3.signals.find((s) => s.id === "imbalance");
    expect(imb3).toBeDefined();
    expect(imb3?.level).toBe("Concern");
    expect(imb3?.weight).toBe(5);
  });

  it("triggers ethics/governance exposure signal under high-stakes use", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        ...balancedBaselineInput.scores,
        ethics: 2,
        governance: 2,
      },
      signals: {
        ...balancedBaselineInput.signals,
        highStakesUse: true,
      },
    };

    const result = analyseGapsAndRisk(input);
    const ethicsGov = result.signals.find((s) => s.id === "ethics-gov-exposure");

    expect(ethicsGov).toBeDefined();
    expect(ethicsGov?.level).toBe("Concern");
    expect(ethicsGov?.weight).toBe(5);
    expect(ethicsGov?.relatedDomains).toEqual(["ethics", "governance"]);
  });

  it("does not trigger ethics/governance exposure if both are > 2 even under high-stakes use", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        ...balancedBaselineInput.scores,
        ethics: 3,
        governance: 3,
      },
      signals: {
        ...balancedBaselineInput.signals,
        highStakesUse: true,
      },
    };

    const result = analyseGapsAndRisk(input);
    const ethicsGov = result.signals.find((s) => s.id === "ethics-gov-exposure");
    expect(ethicsGov).toBeUndefined();
  });

  it("triggers vendor fragility when vendorReliance is true and renewal or governance <= 2", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        ...balancedBaselineInput.scores,
        renewal: 2,
        governance: 3,
      },
      signals: {
        ...balancedBaselineInput.signals,
        vendorReliance: true,
      },
    };

    const result = analyseGapsAndRisk(input);
    const vf = result.signals.find((s) => s.id === "vendor-fragility");
    expect(vf).toBeDefined();
    expect(vf?.level).toBe("Watch");
    expect(vf?.weight).toBe(3);
  });

  it("triggers ownership ambiguity when unclearOwnership is true and coagency or governance <= 2", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        ...balancedBaselineInput.scores,
        coagency: 2,
        governance: 3,
      },
      signals: {
        ...balancedBaselineInput.signals,
        unclearOwnership: true,
      },
    };

    const result = analyseGapsAndRisk(input);
    const oa = result.signals.find((s) => s.id === "ownership-ambiguity");
    expect(oa).toBeDefined();
    expect(oa?.level).toBe("Watch");
    expect(oa?.weight).toBe(3);
  });

  it("triggers coverage imbalance when optional coverage spread is >= 25", () => {
    const inputWatch: DiagnosticInput = {
      ...balancedBaselineInput,
      coverage: {
        awareness: 60,
        coagency: 35, // spread = 25
      },
    };
    const resWatch = analyseGapsAndRisk(inputWatch);
    const ciWatch = resWatch.signals.find((s) => s.id === "coverage-imbalance");
    expect(ciWatch).toBeDefined();
    expect(ciWatch?.level).toBe("Watch");
    expect(ciWatch?.weight).toBe(2);

    const inputConcern: DiagnosticInput = {
      ...balancedBaselineInput,
      coverage: {
        awareness: 80,
        coagency: 40, // spread = 40
      },
    };
    const resConcern = analyseGapsAndRisk(inputConcern);
    const ciConcern = resConcern.signals.find((s) => s.id === "coverage-imbalance");
    expect(ciConcern).toBeDefined();
    expect(ciConcern?.level).toBe("Concern");
    expect(ciConcern?.weight).toBe(4);
  });

  it("ranks gaps by deficit correctly with severity thresholds", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        awareness: 4, // gap 0 -> Low
        coagency: 3, // gap 1 -> Moderate
        practice: 2, // gap 2 -> High
        ethics: 1, // gap 3 -> Critical
        governance: 0, // gap 4 -> Critical
        renewal: 3.5, // gap 0.5 -> Low
      },
    };

    const result = analyseGapsAndRisk(input);

    expect(result.rankedGaps[0].key).toBe("governance");
    expect(result.rankedGaps[0].severity).toBe("Critical");

    expect(result.rankedGaps[1].key).toBe("ethics");
    expect(result.rankedGaps[1].severity).toBe("Critical");

    expect(result.rankedGaps[2].key).toBe("practice");
    expect(result.rankedGaps[2].severity).toBe("High");

    expect(result.rankedGaps[3].key).toBe("coagency");
    expect(result.rankedGaps[3].severity).toBe("Moderate");

    expect(result.rankedGaps[4].key).toBe("renewal");
    expect(result.rankedGaps[4].severity).toBe("Low");

    expect(result.rankedGaps[5].key).toBe("awareness");
    expect(result.rankedGaps[5].severity).toBe("Low");
  });

  it("selects top 3 priority risks sorted by weight descending", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        awareness: 4,
        coagency: 1,
        practice: 1,
        ethics: 1,
        governance: 1,
        renewal: 1,
      },
      signals: {
        highStakesUse: true,
        publicFacing: true,
        sensitiveData: true,
        vendorReliance: true,
        unclearOwnership: true,
      },
    };

    const result = analyseGapsAndRisk(input);
    expect(result.priorities.length).toBeLessThanOrEqual(3);

    // Verify weights are in descending order
    for (let i = 1; i < result.priorities.length; i++) {
      expect(result.priorities[i - 1].weight).toBeGreaterThanOrEqual(result.priorities[i].weight);
    }
  });

  it("identifies stabilisers based on high domain scores and average baseline", () => {
    const input: DiagnosticInput = {
      ...balancedBaselineInput,
      scores: {
        awareness: 3,
        coagency: 3,
        practice: 3,
        ethics: 3,
        governance: 3,
        renewal: 3,
      },
    };

    const result = analyseGapsAndRisk(input);
    expect(result.summary.stabilisers).toHaveLength(4);
    expect(result.summary.stabilisers).toContain("A generally developing-to-established baseline across domains.");
    expect(result.summary.stabilisers).toContain("Strong orientation reduces misuse and unrealistic expectations.");
    expect(result.summary.stabilisers).toContain("Renewal practices support continuous improvement and resilience.");
    expect(result.summary.stabilisers).toContain("Governance strength improves defensibility of decisions.");
  });

  it("handles invalid or incomplete input gracefully without throwing", () => {
    // Missing domains and null/undefined values
    const partialInput = {
      orgName: "Incomplete Unit",
      contextNotes: "",
      scores: {
        awareness: 3,
      } as unknown as Record<DomainKey, number>,
      signals: {} as unknown as DiagnosticInput["signals"],
    };

    const result = analyseGapsAndRisk(partialInput);
    expect(result).toBeDefined();
    expect(result.domainStats).toHaveLength(6);
    expect(result.domainStats.find((d) => d.key === "awareness")?.score).toBe(3);
    expect(result.domainStats.find((d) => d.key === "ethics")?.score).toBe(0);
    expect(result.band).toBeDefined();
    expect(result.rankedGaps).toHaveLength(6);
  });
});
