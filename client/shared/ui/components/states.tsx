export function LoadingState({ label = "Loading" }: { label?: string }) {
  return <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-[#EF4444]">{message}</div>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-6 text-center">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      {description ? <p className="mt-1 text-sm text-[#6B7280]">{description}</p> : null}
    </div>
  );
}
