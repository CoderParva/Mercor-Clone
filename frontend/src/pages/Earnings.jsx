export default function Earnings() {
  return (
    <div className="page">
      <h1>Earnings</h1>
      <p className="section-label">
        Your total earnings to date are <strong>$0.00</strong>.
      </p>

      <div className="earnings-banner">
        <h3>Unlock more work with referrals</h3>
        <p>Invite people you know — TalentMarket handles the outreach, so you don't have to.</p>
        <button className="btn primary">Explore referrals</button>
      </div>

      <section className="dashboard-section">
        <div className="earnings-chart-header">
          <h2>Earnings over time</h2>
          <span className="earnings-total">$0.00</span>
        </div>
        <div className="earnings-chart-placeholder">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="chart-bar" style={{ height: '4px' }} />
          ))}
        </div>
        <p className="center-msg small">Data refreshes every hour.</p>
      </section>

      <section className="dashboard-section">
        <h2>Payments</h2>
        <table className="table">
          <thead>
            <tr><th>Payout date</th><th>Type</th><th>Description</th><th>Status</th><th>Earned</th></tr>
          </thead>
          <tbody />
        </table>
        <p className="center-msg">No payment history yet. Once you receive your first payout, it will appear here.</p>
      </section>
    </div>
  );
}
