import { Skeleton } from "@bethel/ui/components/skeleton";

export default function CalendarioLoading() {
  return (
    <div style={{ padding: "26px 36px 56px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 12 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
