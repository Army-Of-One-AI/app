/* eslint-disable @next/next/no-img-element */
export default function MemberRow({
  name,
  avatar,
}: {
  name: string;
  avatar?: string;
}) {
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--text-primary)]">
        {avatar ? (
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {name}
        </p>
      </div>
    </div>
  );
}
