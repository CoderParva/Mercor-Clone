export function JobCardSkeleton() {
  return (
    <div className="job-card skeleton-card">
      <div className="skel-line skel-title" />
      <div className="skel-line skel-pay" />
      <div className="skel-line skel-tags" />
    </div>
  );
}

export function JobGridSkeleton({ count = 6 }) {
  return (
    <div className="job-grid">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
