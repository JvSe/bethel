import { Skeleton } from "@bethel/ui/components/skeleton";

export default function DespensaLoading() {
  return (
    <div style={{ padding: "26px 36px 56px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
