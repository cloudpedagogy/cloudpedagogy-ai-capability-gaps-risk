# PROJECT_SPEC: cloudpedagogy-ai-capability-gaps-risk

## 1. Repo Name
`cloudpedagogy-ai-capability-gaps-risk`

## 2. One-Sentence Purpose
A diagnostic calculator for identifying institutional risks and maturity gaps across 6 capability domains.

## 3. Problem the App Solves
Organizational uncertainty regarding AI adoption risks; clarifies which capability domains require urgent investment to avoid institutional or ethical failure.

## 4. Primary User / Audience
Strategy teams, risk officers, and institutional leaders.

## 5. Core Role in the CloudPedagogy Ecosystem
The "Risk Layer"; converts qualitative capability scores into quantitative risk signals (e.g., vendor reliance, sensitive data handling).

## 6. Main Entities / Data Structures
- **DomainKey**: Standard 6 domains (Awareness, Coagency, Practice, Ethics, Governance, Renewal).
- **CapabilityBand**: Maturity levels (Emerging, Developing, Established, Leading).
- **DiagnosticInput**: Central dataset storing scores, coverage, and specific risk "signals" (High-stakes use, public-facing, etc.).

## 7. Main User Workflows
1. **Context Entry**: Define organisational context and high-level stressors.
2. **Capability Input**: Assign maturity scores across the 6 core domains.
3. **Signal Evaluation**: Toggle specific risk triggers (e.g., "Unclear Ownership", "Vendor Reliance").
4. **Risk Review**: Analyze the resulting maturity/risk mapping to prioritize interventions.

## 8. Current Features
- Stateless interactive calculator.
- 6-domain maturity and risk scoring.
- 5 core risk signal indicators.
- Reflective analysis based on capability/risk collision.

## 9. Stubbed / Partial / Incomplete Features
- "Coverage" metrics are supported in the data model but appear partially implemented in current views.

## 10. Import / Export and Storage Model
- **Storage**: Stateless by design (no defaults found); intended for session-based evaluation.
- **Export**: Results intended for capture via reporting or manual note-taking.

## 11. Relationship to Other CloudPedagogy Apps
Shares the 6-domain model with `ai-capability-assessment`; identifies the environmental risks that the `programme-governance-dashboard` attempts to mitigate.

## 12. Potential Overlap or Duplication Risks
Significant logical overlap with `scenario-stress-test` (which adds dynamic stressors); distinguished by its focus on static "Risk Signals."

## 13. Distinctive Value of This App
Focuses on systemic "Signals" (like Vendor Reliance or High Stakes) that transcend simple domain scores.

## 14. Recommended Future Enhancements
(Inferred) Persistent local storage for longitudinal tracking; automated signal generation via import of active `programme` manifests.

## 15. Anything Unclear or Inferred from Repo Contents
The exact weightings between "Signals" and "Maturity Scores" in the final risk calculation are inferred to be a simple additive model.
