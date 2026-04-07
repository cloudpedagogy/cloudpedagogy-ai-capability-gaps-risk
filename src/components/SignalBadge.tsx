import type { SignalLevel } from "../engine/analysis";

export default function SignalBadge({ level }: { level: SignalLevel }) {
  const cls = "tag";
  return <span className={cls}>{level}</span>;

}
