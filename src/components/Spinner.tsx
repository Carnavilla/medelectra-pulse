export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full bg-coral heartbeat" />
        <div className="absolute inset-0 loader-ring" />
      </div>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
