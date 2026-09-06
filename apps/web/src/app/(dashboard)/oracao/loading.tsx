import { Skeleton } from "@bethel/ui/components/skeleton";

export default function OracaoLoading() {
  return (
    <div style={{ padding: "26px 36px 56px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
