# AI Capability Gaps & Risk — User Instructions

---
### 2. What This Tool Does
This tool translates raw capability scores into an active risk assessment. It pinpoints the specific "gaps" between an organization's current AI maturity and a safe baseline, detailing exactly how those deficits translate into institutional risk.

---
### 3. Role in the Ecosystem
- **Phase:** Phase 3 — Capability System
- **Role:** Diagnostic analysis of capability imbalances and floor risks.
- **Reference:** [../SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md)

---
### 4. When to Use This Tool
- When you have completed initial capability assessments and need to know "what to fix first."
- To translate abstract competency scores into concrete risk vocabulary for a governance board.
- When preparing to test organizational resilience using a scenario stress test.

---
### 5. Inputs
- Requires numerical scoring data mapping to the 6 core domains (usually derived from the Capability Assessment suite).

---
### 6. How to Use (Step-by-Step)
1. Complete the setup phase, establishing the diagnostic context and entering your baseline domain scores.
2. Select environmental risk signals (e.g., "High-stakes use", "Sensitive data").
3. View the "Diagnostic Summary" and check the organization's overarching risk band.
4. Review the "Top 3 Priority Risks" to identify the most urgent areas requiring immediate action.
5. Review the "Ranked Capability Gaps" section to see the explicit consequences of low scores (e.g., ethics deficits vs governance deficits).
6. Export the findings to JSON to feed into the Scenario Stress-Test.

---
### 7. Key Outputs
- A ranked list of the worst capability gaps and their specific institutional dangers.
- An exportable JSON file that establishes the baseline "fragility" of the organization.

---
### 8. How It Connects to Other Tools
- **Upstream:** Contextualizes data gathered from the **Capability Assessment**.
- **Downstream:** Outputs the required baseline dataset for the **Scenario Stress Test**.

---
### 9. Limitations
- It is a diagnostic engine for capability flaws; it does not scan workflows for technical errors (use the Risk Scanner for that).
- It highlights consequences but does not automatically write the policy to fix them.

---
### 10. Tips
- Use the "Why this matters" toggle on priority risks to get exact language to use in management reports.
