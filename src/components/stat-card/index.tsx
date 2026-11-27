import type { StatCardProps } from "./type";

export const StatCard = ({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  ratio,
}: StatCardProps) => (
  <article className="stat-card rounded-xl border p-5 sm:p-6" data-tone={tone}>
    <div className="flex items-center gap-3">
      <span className="stat-card-icon grid size-10 shrink-0 place-items-center rounded-lg">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="stat-card-label text-sm font-medium leading-5">{label}</h3>
    </div>
    <p className="stat-card-value mt-5 text-4xl font-semibold tracking-tight tabular-nums">
      {value}
    </p>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    {ratio !== undefined && (
      <progress
        className="stat-card-progress mt-4 h-1.5 w-full"
        value={Math.max(0, Math.min(1, ratio))}
        max={1}
        aria-label={label}
      />
    )}
  </article>
);
