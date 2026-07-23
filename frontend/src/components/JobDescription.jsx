function Section({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="jd-section">
      <h3>{title}</h3>
      <ul className="jd-list">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

export default function JobDescription({ job }) {
  if (!job) return null;

  const hasStructure =
    job.responsibilities?.length || job.requirements?.length ||
    job.preferredQualifications?.length || job.whyJoin?.length;

  return (
    <div className="job-description-wrap">
      <div className="jd-meta-row">
        {job.contractType && <span className="jd-meta-item">▤ {job.contractType.replace('-', ' ')}</span>}
        {job.workArrangement && <span className="jd-meta-item">⌂ {job.workArrangement}</span>}
        {job.domain && <span className="jd-meta-item">◆ {job.domain}</span>}
        {job.referralAmount > 0 && <span className="jd-meta-item">◈ ${job.referralAmount} referral bonus</span>}
      </div>

      {job.locations?.length > 0 && (
        <div className="jd-section">
          <h3>Location requirements</h3>
          <div className="jd-locations">
            {job.locations.map((loc) => <span className="jd-location-chip" key={loc}>{loc}</span>)}
          </div>
        </div>
      )}

      <div className="jd-section">
        <h3>About the opportunity</h3>
        <p className="jd-overview">{job.description}</p>
      </div>

      <Section title="Responsibilities" items={job.responsibilities} />
      <Section title="Requirements" items={job.requirements} />
      <Section title="Preferred qualifications" items={job.preferredQualifications} />
      <Section title="Why join" items={job.whyJoin} />

      {!hasStructure && (
        <p className="resume-hint" style={{ marginTop: '1rem' }}>
          This role was posted without structured sections — the full details are in the overview above.
        </p>
      )}
    </div>
  );
}