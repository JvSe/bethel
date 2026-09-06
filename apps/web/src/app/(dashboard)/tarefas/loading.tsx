import { Skeleton } from "@bethel/ui/components/skeleton";

export default function TarefasLoading() {
  return (
    <div style={{ padding: "26px 36px 56px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[0, 1, 2].map((col) => (
          <div key={col} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
