import { classNames } from "@/shared/styles/classNames";

export default function Stat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div>
      <div className="text-xl font-semibold">{value}</div>
      <div className={`text-xs ${classNames.text.secondary}`}>{label}</div>
    </div>
  );
}
