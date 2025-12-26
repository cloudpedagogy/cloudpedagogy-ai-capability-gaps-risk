import Card from "../components/Card";

export default function IntroView({ onStart }: { onStart: () => void }) {
  return (
    <div className="stack">
      <Card title="What this tool does">
        <p>
          The <strong>Gaps &amp; Risk Diagnostic</strong> helps teams interpret AI capability patterns using the
          CloudPedagogy AI Capability Framework. It turns a reflective baseline into <em>risk signals</em>,
          <em>discussion prompts</em>, and <em>areas to stabilise</em> before scaling.
        </p>
        <ul>
          <li>Capability-led (framework language, not vendor tools)</li>
          <li>Interpretive, not judgemental</li>
          <li>Signals, not flags — supports governance conversations</li>
          <li>Runs entirely in your browser (no accounts, no data upload)</li>
        </ul>
      </Card>

      <Card title="What it is not">
        <ul>
          <li>Not a compliance audit, benchmark, or maturity ranking</li>
          <li>Not a risk register or legal assessment</li>
          <li>Not an automated decision-making system</li>
        </ul>
      </Card>

      <div className="actions">
        <button className="btn btn--primary" onClick={onStart}>
          Start diagnostic
        </button>
      </div>
    </div>
  );
}

