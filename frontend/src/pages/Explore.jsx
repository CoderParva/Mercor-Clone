import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AvatarStack from '../components/AvatarStack';
import FilterDropdown from '../components/FilterDropdown';
import JobDetailPanel from '../components/JobDetailPanel';
import ApplicationModal from '../components/ApplicationModal';
import { JobGridSkeleton } from '../components/Skeleton';

const TABS = ['Project-based', 'One-time', 'Talent Network'];
const PAGE_SIZE = 12;

export default function Explore() {
  const [tab, setTab] = useState('Project-based');
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [facets, setFacets] = useState({});
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [modalJob, setModalJob] = useState(null);
  const [filters, setFilters] = useState({
    minPay: '', location: '', domain: '', minReferral: '', workArrangement: '', contractType: '',
  });

  useEffect(() => {
    api.get('/jobs/meta/categories').then((res) => setCategories(res.data.categories));
    api.get('/jobs/meta/facets').then((res) => setFacets(res.data)).catch(() => {});
  }, []);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort && sort !== 'newest') params.set('sort', sort);
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    api
      .get(`/jobs?${params.toString()}`)
      .then((res) => setJobs(res.data.jobs))
      .finally(() => setLoading(false));
  }, [q, category, sort, filters]);

  useEffect(() => {
    fetchJobs();
    setPage(1);
  }, [category, sort, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const clearFilters = () =>
    setFilters({ minPay: '', location: '', domain: '', minReferral: '', workArrangement: '', contractType: '' });
  const activeFilterEntries = Object.entries(filters).filter(([, v]) => v);

  const visibleJobs = tab === 'Project-based' ? jobs : [];
  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / PAGE_SIZE));
  const pageJobs = visibleJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page explore-page">
      <h1>Explore opportunities</h1>

      <div className="explore-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`explore-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="explore-toolbar">
        <form
          className="search-bar compact"
          onSubmit={(e) => {
            e.preventDefault();
            fetchJobs();
          }}
        >
          <input placeholder="Type to search" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Priority: Newest</option>
          <option value="payHigh">Priority: Highest pay</option>
          <option value="payLow">Priority: Lowest pay</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <FilterDropdown
          facets={facets}
          filters={filters}
          onChange={updateFilter}
          onClear={clearFilters}
        />
        <Link to="/referrals" className="btn primary refer-btn">Refer &amp; earn</Link>
      </div>

      {activeFilterEntries.length > 0 && (
        <div className="active-filter-chips">
          {activeFilterEntries.map(([k, v]) => (
            <span className="active-chip" key={k}>
              {k === 'minPay' ? `Min $${v}/hr` : k === 'minReferral' ? `Referral $${v}+` : v}
              <button type="button" onClick={() => updateFilter(k, '')}>✕</button>
            </span>
          ))}
        </div>
      )}

      <div className={`explore-split ${selectedJobId ? 'has-panel' : ''}`}>
      <div className="explore-split-list">
      {loading ? (
        <JobGridSkeleton count={9} />
      ) : (
        <>
          <div className="explore-grid">
            {pageJobs.map((job) => (
              <button
                type="button"
                key={job._id}
                className={`explore-card ${selectedJobId === job._id ? 'selected' : ''}`}
                onClick={() => setSelectedJobId(job._id)}
              >
                <div className="explore-card-top">
                  <h3>{job.title}</h3>
                  {job.applicantCount === 0 && <span className="new-op-badge">New opportunity</span>}
                </div>
                <p className="pay">
                  {job.payMin === job.payMax ? `$${job.payMin}` : `$${job.payMin} - $${job.payMax}`} / hour
                </p>
                <div className="explore-card-bottom">
                  <div className="hired-row">
                    <AvatarStack seed={job._id} count={Math.max(1, Math.min(3, job.hiresCount || 1))} />
                    <span>{job.hiresCount || 0} hired this month</span>
                  </div>
                  <span className="applicant-count">👤 {job.applicantCount} applied</span>
                </div>
              </button>
            ))}
          </div>
          {tab !== 'Project-based' && (
            <p className="center-msg">No {tab.toLowerCase()} roles yet — check back soon.</p>
          )}
          {tab === 'Project-based' && visibleJobs.length === 0 && (
            <p className="center-msg">No roles match your search.</p>
          )}

          {tab === 'Project-based' && totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹ Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={n === page ? 'active' : ''}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          )}
        </>
      )}
      </div>

      {selectedJobId && (
        <JobDetailPanel
          jobId={selectedJobId}
          onApply={(job) => setModalJob(job)}
          onClose={() => setSelectedJobId(null)}
        />
      )}
      </div>

      {modalJob && <ApplicationModal job={modalJob} onClose={() => setModalJob(null)} />}
    </div>
  );
}