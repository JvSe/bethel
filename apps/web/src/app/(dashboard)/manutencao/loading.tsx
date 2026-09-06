import { Skeleton } from "@bethel/ui/components/skeleton";

export default function ManutencaoLoading() {
  return (
    <div style={{ padding: "26px 36px 56px" }}>
      <Skeleton className="h-16 w-full rounded-2xl mb-3" />
      <Skeleton className="h-16 w-full rounded-2xl mb-3" />
      <Skeleton className="h-16 w-full rounded-2xl mb-3" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
}
