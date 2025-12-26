import { useMemo, useState } from "react";

import IntroView from "./views/IntroView";
import DiagnosticView from "./views/DiagnosticView";
import ResultsView from "./views/ResultsView";

import type { DiagnosticInput } from "./domain/model";
import { analyseGapsAndRisk, type DiagnosticResult } from "./engine/analysis";

type Stage = "intro" | "diagnostic" | "results";

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [input, setInput] = useState<DiagnosticInput | null>(null);

  const result: DiagnosticResult | null = useMemo(() => {
    if (!input) return null;
    return analyseGapsAndRisk(input);
  }, [input]);

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand__title">CloudPedagogy</div>
          <div className="brand__subtitle">Gaps &amp; Risk Diagnostic</div>
        </div>
        <nav className="nav">
          <button
            className="link"
            onClick={() => {
              setStage("intro");
              setInput(null);
            }}
          >
            Restart
          </button>
        </nav>
      </header>

      <main className="main">
        {stage === "intro" && (
          <IntroView
            onStart={() => setStage("diagnostic")}
          />
        )}

        {stage === "diagnostic" && (
          <DiagnosticView
            onSubmit={(data) => {
              setInput(data);
              setStage("results");
            }}
            onBack={() => setStage("intro")}
          />
        )}

        {stage === "results" && result && input && (
          <ResultsView
            input={input}
            result={result}
            onBack={() => setStage("diagnostic")}
          />
        )}
      </main>

      <footer className="footer">
        <div className="fineprint">
          This tool is capability-led and reflective. It supports interpretation and discussion — it is not a risk register,
          compliance audit, benchmarking instrument, or automated decision system.
        </div>
      </footer>
    </div>
  );
}
