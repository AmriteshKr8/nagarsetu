import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Centralized configuration for category buttons and theme colors
const DASHBOARD_CONFIG = [
  { id: 'raise', name: 'Raise Complaint', icon: '📝', color: '#ff7265' },
  { id: 'status', name: 'Check Complaint', icon: '🔍', color: '#4facf7' },
  { id: 'budget', name: 'Budget Status', icon: '📊', color: '#20c997' },
  { id: 'accomplishments', name: 'Accomplishments', icon: '🏆', color: '#a27bee' },
  { id: 'alerts', name: 'City Alerts', icon: '🚨', color: '#f5a623' },
];

export default function Home() {
  const navigate = useNavigate();
  const [activeDashboard, setActiveDashboard] = useState(null);

  const activeColor = DASHBOARD_CONFIG.find(c => c.id === activeDashboard)?.color;

  return (
    <div className="home-page-content">
      {/* Hero Banner */}
      <section className="image-feed-container">
        <div className="image-photo">
          <img 
            src="https://images.unsplash.com/photo-1667646639408-b320d58836e5?q=80&w=1931&auto=format&fit=crop" 
            alt="Municipal tracking" 
            className="feed-image" 
          />
          <div className="image-overlay">
            <p>Track ongoing municipal projects, community infrastructure improvements, progress of filed requests, and budget allocation.</p>
            <button className="overlay-btn" onClick={() => navigate('/form')}>
              File Complaint Report
            </button>
          </div>
        </div>
      </section>

      {/* Category Selection Grid */}
      <section className="category-section">
        <h2 className="section-title">Civic Action Dashboard</h2>
        <div className="grid">
          {DASHBOARD_CONFIG.map(({ id, name, icon, color }) => (
            <button 
              key={id}
              className="rect-design" 
              style={{ backgroundColor: color }} 
              onClick={() => setActiveDashboard(id)}
            > 
              <span className="icon">{icon}</span>
              <span className="cat-name">{name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Dynamic Content Panel */}
      {activeDashboard && (
        <section className="dashboard-container">
          <div className="dashboard-card" style={{ backgroundColor: activeColor }}>
            {activeDashboard === 'raise' && <RaiseComplaintView onNavigate={() => navigate('/form')} />}
            {activeDashboard === 'status' && <StatusTrackerView />}
            {activeDashboard === 'budget' && <BudgetView />}
            {activeDashboard === 'accomplishments' && <AccomplishmentsView />}
            {activeDashboard === 'alerts' && <AlertsView />}
          </div>
        </section>
      )}
    </div>
  );
}

// Sub-component handling API fetching for DB reports
function StatusTrackerView() {
  const [complaintId, setComplaintId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (id) => {
    const trimmedId = id.trim();
    if (!trimmedId) {
      setError('Please enter a valid Complaint ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch from backend API using MongoDB _id
      const response = await fetch(`/api/complaints/${trimmedId}`, {
        headers: {
          'Content-Type': 'application/json',
          // Pass token if your backend requires authorization
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error('No complaint found with this ID.');
        if (response.status === 403) throw new Error('You do not have permission to view this complaint.');
        throw new Error('Failed to retrieve complaint details.');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert string status into zero-based index for the timeline
  const getStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted': return 0;
      case 'dept assigned':
      case 'assigned': return 1;
      case 'in progress': return 2;
      case 'resolved': return 3;
      default: return 0;
    }
  };

  return (
    <div>
      <h3>🔍 Your Complaints</h3>
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Enter Complaint ID (e.g., 64b8f1...)" 
          value={complaintId} 
          onChange={(e) => setComplaintId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchReport(complaintId)}
        />
        <button 
          className="action-btn solid" 
          style={{ backgroundColor: '#334155' }} 
          onClick={() => fetchReport(complaintId)}
        >
          Track
        </button>
      </div>

      {loading && <p style={{ color: '#fff', marginTop: '15px' }}>Fetching status from database...</p>}
      {error && <p className="error-text" style={{ color: '#ffdddd', marginTop: '15px' }}>{error}</p>}

      {report && (
        <div className="report-details" style={{ marginTop: '20px', textAlign: 'left' }}>
          <h4>Report #{report._id || report.id}: {report.title}</h4>
          <p><strong>Department:</strong> {report.department || 'Unassigned'}</p>
          <p><strong>Status:</strong> {report.status || 'Pending'}</p>

          <div className="timeline" style={{ marginTop: '15px' }}>
            {['Submitted', 'Dept Assigned', 'In Progress', 'Resolved'].map((step, idx) => {
              const currentStep = report.currentStepIndex ?? getStepIndex(report.status);
              const isCompleted = idx <= currentStep;
              const isActive = idx === currentStep;

              return (
                <div key={step} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  {isCompleted ? '✔️' : '⏳'} {step}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Views
const RaiseComplaintView = ({ onNavigate }) => (
  <div>
    <h3>📝 Submit a New Complaint</h3>
    <p style={{ color: '#ffffff', marginBottom: '30px', fontSize: '1.1rem' }}>
      We will redirect you to the authorised corporations for all civic issues.
    </p>
    <button className="overlay-btn" onClick={onNavigate}>
      File Complaint Report
    </button>
  </div>
);

const BudgetView = () => (
  <div>
    <h3>📊 Participatory Budgeting</h3>
    <p>Remaining Monthly Allocation: <strong>₹12,00,000</strong></p>
    <div className="budget-poll">
      <h4>Vote on the next micro-project to fund:</h4>
      <div className="poll-option">
        <span>Locality's Park Renovation (72% Funded)</span>
        <div className="progress-bar"><div className="fill green-fill" style={{ width: '72%' }}></div></div>
        <button className="vote-btn">Vote</button>
      </div>
      <div className="poll-option">
        <span>New LED Streetlights (36% Funded)</span>
        <div className="progress-bar"><div className="fill blue-fill" style={{ width: '36%' }}></div></div>
        <button className="vote-btn">Vote</button>
      </div>
    </div>
  </div>
);

const AccomplishmentsView = () => (
  <div>
    <h3>🏆 Department Performance (This Month)</h3>
    <div className="scorecard-grid">
      <div className="scorecard">
        <h2 style={{ color: '#a27bee' }}>542</h2>
        <p style={{ color: '#000' }}>Issues Resolved</p>
      </div>
      <div className="scorecard">
        <h2 style={{ color: '#a27bee' }}>1.4 Days</h2>
        <p style={{ color: '#000' }}>Avg Resolution Time</p>
      </div>
    </div>
    <ul className="leaderboard" style={{ color: '#ffffff' }}>
      <li>🥇 Electricity Dept: 98% Resolution Rate</li>
      <li>🥈 Water & Sewage: 92% Resolution Rate</li>
      <li>🥉 Public Works: 88% Resolution Rate</li>
    </ul>
  </div>
);

const AlertsView = () => (
  <div>
    <h3>📢 Critical City Notices</h3>
    <ul className="alert-list">
      <li className="alert-item high-priority">🔴 <strong>WATER CUT:</strong> Sector 4 and 5 water supply off 2 PM - 5 PM.</li>
      <li className="alert-item medium-priority">🟡 <strong>ROAD CLOSURE:</strong> City Underpass closed for maintenance.</li>
      <li className="alert-item low-priority">🟢 <strong>COLLECTORATE OFFICE:</strong> Open budget planning meeting this Sunday.</li>
    </ul>
  </div>
);