import { Skeleton } from "@bethel/ui/components/skeleton";

export default function GratidaoLoading() {
  return (
    <div style={{ padding: "26px 36px 56px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[170px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
