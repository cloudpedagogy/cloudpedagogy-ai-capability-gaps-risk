import { DOMAINS, bandForAverage, type CapabilityBand, type DiagnosticInput, type DomainKey } from "../domain/model";

export type SignalLevel = "Info" | "Watch" | "Concern";

export type RiskSignal = {
  id: string;
  level: SignalLevel;
  title: string;
  rationale: string;
  prompts: string[];
  relatedDomains: DomainKey[];
};

export type DiagnosticResult = {
  band: CapabilityBand;
  averageScore: number;
  domainStats: Array<{
    key: DomainKey;
    label: string;
    score: number;
  }>;
  signals: RiskSignal[];
  summary: {
    strengths: string[];
    gaps: string[];
    stabilisers: string[]; // what reduces risk / increases resilience
  };
};

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function sortByScoreAsc(stats: DiagnosticResult["domainStats"]) {
  return [...stats].sort((a, b) => a.score - b.score);
}

function sortByScoreDesc(stats: DiagnosticResult["domainStats"]) {
  return [...stats].sort((a, b) => b.score - a.score);
}

function spread(scores: number[]) {
  if (!scores.length) return 0;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return max - min;
}

function coverageSpread(coverage: Partial<Record<DomainKey, number>>) {
  const vals = Object.values(coverage).filter((v): v is number => typeof v === "number");
  if (!vals.length) return 0;
  return Math.max(...vals) - Math.min(...vals);
}

export function analyseGapsAndRisk(input: DiagnosticInput): DiagnosticResult {
  const domainStats = DOMAINS.map((d) => ({
    key: d.key,
    label: d.label,
    score: input.scores[d.key] ?? 0,
  }));

  const scores = domainStats.map((d) => d.score);
  const averageScore = Number(avg(scores).toFixed(2));
  const band = bandForAverage(averageScore);

  const lowest = sortByScoreAsc(domainStats).slice(0, 2);
  const highest = sortByScoreDesc(domainStats).slice(0, 2);
  const scoreSpread = spread(scores);

  const signals: RiskSignal[] = [];

  // 1) Low-floor signal (any domain <= 1)
  const veryLow = domainStats.filter((d) => d.score <= 1);
  if (veryLow.length > 0) {
    signals.push({
      id: "low-floor",
      level: "Concern",
      title: "Low capability floor in key areas",
      rationale:
        `One or more domains are at a very early stage (${veryLow.map((d) => d.label).join(", ")}). ` +
        "This can create fragility: strong practice in one area may still fail if foundational supports are weak.",
      prompts: [
        "Where do people currently rely on informal knowledge or ‘hero individuals’ to compensate?",
        "What would break first if the most capable person left the team?",
        "What is the smallest, safest ‘next practice’ you could embed in the next 30 days?",
      ],
      relatedDomains: veryLow.map((d) => d.key),
    });
  }

  // 2) Imbalance signal (spread >= 2)
  if (scoreSpread >= 2) {
    signals.push({
      id: "imbalance",
      level: scoreSpread >= 3 ? "Concern" : "Watch",
      title: "Capability imbalance across domains",
      rationale:
        `Your scores vary widely (spread = ${scoreSpread}). Imbalance often indicates uneven development: ` +
        "innovation may be outpacing governance, or awareness may not translate into applied practice.",
      prompts: [
        "Which domain is carrying the most ‘load’ right now — and is that sustainable?",
        "Where are people improvising because the system lacks guidance or structure?",
        "If you strengthened just one low domain, which would reduce the most downstream risk?",
      ],
      relatedDomains: [lowest[0].key, lowest[1].key, highest[0].key, highest[1].key],
    });
  }

  // 3) Ethics/governance under-strength (contextual severity)
  const ethics = input.scores.ethics ?? 0;
  const governance = input.scores.governance ?? 0;
  const highStakesMultiplier = input.signals.highStakesUse || input.signals.publicFacing || input.signals.sensitiveData;

  if ((ethics <= 2 || governance <= 2) && highStakesMultiplier) {
    signals.push({
      id: "ethics-gov-exposure",
      level: "Concern",
      title: "Ethics/Governance exposure under high-stakes conditions",
      rationale:
        "You’ve indicated high-stakes, public-facing, or sensitive-data use. When Ethics/Equity/Impact " +
        "and Decision-Making/Governance are not yet established, the organisation is more exposed to harm, reputational risk, and poor decisions.",
      prompts: [
        "What are the current ‘red lines’ (non-negotiables) for AI use — and are they shared and documented?",
        "Where does accountability sit today (named role), and where is it ambiguous?",
        "What review step could you introduce before outputs are used externally or in consequential decisions?",
      ],
      relatedDomains: ["ethics", "governance"],
    });
  }

  // 4) Vendor reliance + low renewal/governance
  const renewal = input.scores.renewal ?? 0;
  if (input.signals.vendorReliance && (renewal <= 2 || governance <= 2)) {
    signals.push({
      id: "vendor-fragility",
      level: "Watch",
      title: "Potential fragility from vendor/tool reliance",
      rationale:
        "Heavy reliance on a single toolchain can create brittleness if policies, pricing, access, or features change. " +
        "This risk increases when governance or renewal practices are still developing.",
      prompts: [
        "If access to your primary tool changed tomorrow, what would stop working?",
        "Do you have a ‘minimum viable practice’ that is tool-agnostic?",
        "What knowledge or templates should be captured so capability survives tool changes?",
      ],
      relatedDomains: ["governance", "renewal", "practice"],
    });
  }

  // 5) Unclear ownership + co-agency/governance
  const coagency = input.scores.coagency ?? 0;
  if (input.signals.unclearOwnership && (coagency <= 2 || governance <= 2)) {
    signals.push({
      id: "ownership-ambiguity",
      level: "Watch",
      title: "Role clarity and accountability may be under-defined",
      rationale:
        "You’ve indicated unclear ownership. Without explicit roles for AI-supported work, responsibility can drift " +
        "and decisions become harder to defend — especially when systems produce confident outputs.",
      prompts: [
        "Who is responsible for validating outputs in your most common use cases?",
        "What is the ‘human sign-off point’ — and is it consistent?",
        "Where could you make role expectations explicit (policy, team agreements, workflow steps)?",
      ],
      relatedDomains: ["coagency", "governance"],
    });
  }

  // 6) Optional coverage imbalance (from programme mapping lens)
  if (input.coverage && Object.keys(input.coverage).length > 0) {
    const cSpread = coverageSpread(input.coverage);
    if (cSpread >= 25) {
      signals.push({
        id: "coverage-imbalance",
        level: cSpread >= 40 ? "Concern" : "Watch",
        title: "Capability coverage may be uneven across the programme/system",
        rationale:
          `Your optional coverage estimates vary significantly (spread ≈ ${Math.round(cSpread)}%). ` +
          "This often means learners/teams encounter some domains repeatedly while others remain implicit or absent.",
        prompts: [
          "Which domains are ‘assumed’ rather than taught or practiced?",
          "Where do people learn ethics/governance/renewal informally — and is that reliable?",
          "What is one small structural change that would increase coverage of a neglected domain?",
        ],
        relatedDomains: DOMAINS.map((d) => d.key),
      });
    }
  }

  // Summary lists (simple, readable)
  const strengths = highest.map((d) => `${d.label} (score ${d.score}/4)`);
  const gaps = lowest.map((d) => `${d.label} (score ${d.score}/4)`);

  const stabilisers: string[] = [];
  if (averageScore >= 2.5) stabilisers.push("A generally developing-to-established baseline across domains.");
  if ((input.scores.awareness ?? 0) >= 3) stabilisers.push("Strong orientation reduces misuse and unrealistic expectations.");
  if ((input.scores.renewal ?? 0) >= 3) stabilisers.push("Renewal practices support continuous improvement and resilience.");
  if ((input.scores.governance ?? 0) >= 3) stabilisers.push("Governance strength improves defensibility of decisions.");

  // If no signals, still output something helpful
  if (signals.length === 0) {
    signals.push({
      id: "no-major-signals",
      level: "Info",
      title: "No major risk patterns detected from the inputs provided",
      rationale:
        "Based on your inputs, there are no standout imbalance or low-floor patterns. Use the prompts below to deepen reflection and validate this with stakeholders.",
      prompts: [
        "Which assumptions in your scoring would others challenge — and why?",
        "Where are you overconfident because things have ‘worked so far’?",
        "What evidence would you collect in the next month to confirm your current view?",
      ],
      relatedDomains: DOMAINS.map((d) => d.key),
    });
  }

  return {
    band,
    averageScore,
    domainStats,
    signals,
    summary: { strengths, gaps, stabilisers },
  };
}
