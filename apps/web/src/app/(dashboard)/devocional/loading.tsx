import { Skeleton } from "@bethel/ui/components/skeleton";

export default function DevocionalLoading() {
  return (
    <div style={{ padding: "26px 36px 56px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 16 }}>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
