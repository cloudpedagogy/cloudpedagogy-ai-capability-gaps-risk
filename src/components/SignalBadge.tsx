import type { SignalLevel } from "../engine/analysis";

export default function SignalBadge({ level }: { level: SignalLevel }) {
  const cls =
    level === "Concern" ? "badge badge--concern" : level === "Watch" ? "badge badge--watch" : "badge badge--info";
  return <span className={cls}>{level}</span>;
}
