export default function SkeletonCard() {
  return (
    <div className="bg-white border border-brand-card-border rounded-xl overflow-hidden flex flex-col">
      <div className="w-full h-40 skeleton-shimmer rounded-t-xl" />
      <div className="p-4 flex flex-col gap-2">
        <div className="skeleton-shimmer rounded h-4 w-[80%]" />
        <div className="skeleton-shimmer rounded h-3 w-[50%]" />
        <div className="skeleton-shimmer rounded h-3 w-[40%] mt-2" />
      </div>
    </div>
  );
}
