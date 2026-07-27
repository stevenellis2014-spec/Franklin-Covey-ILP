import { statusLabel, statusColor } from "@/lib/format";

export function Pill({ status }: { status: string }) {
  const { bg, fg } = statusColor(status);
  return (
    <span
      className="inline-block text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
      style={{ background: bg, color: fg }}
    >
      {statusLabel(status)}
    </span>
  );
}

export function ProgressBar({ percent, status }: { percent: number; status?: string }) {
  const fill =
    status === "off_track" ? "#B94A48" : status === "at_risk" ? "#C97A2B" : "#2E7D5B";
  return (
    <div className="h-2 bg-[#EEE8DC] rounded-full overflow-hidden w-full">
      <div
        className="h-full rounded-full"
        style={{ width: `${percent}%`, background: fill }}
      />
    </div>
  );
}
