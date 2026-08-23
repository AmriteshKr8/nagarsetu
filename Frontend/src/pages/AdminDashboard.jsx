import React, { useState } from 'react';
import StatCard from '../components/StatCard';

const departments = [
  "Disaster Management",
  "Drainage and Sewage",
  "Electricity and Power",
  "Fire Emergency",
  "Roads and Public Work",
  "Solid Waste and Sanitation",
  "Water Supply",
  "Parks and Recreation",
];

const chartData = [
  ["Water supply", 0],
  ["Trees and greenery", 23],
  ["Sanitation", 40],
  ["Roads", 80],
  ["Fire emergency", 2],
  ["Electricity and power", 40],
  ["Drainage", 30],
  ["Disaster Management", 15],
];

const logoSrc ="https://i.pinimg.com/1200x/95/e0/fc/95e0fc8d455e9e77733fefb4637e0c21.jpg";
export default function AdminDashboard() {
  const [department, setDepartment] = useState("");
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo-wrap">
            <img src={logoSrc} alt="Logo" className="logo" />
          </div>
          <div className="brand-text">
            <h1>Admin Dashboard</h1>
            <p>Overview of complaints and resolution status</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="select-wrap">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              aria-label="Department"
            >
              <option value="">Department</option>
              {departments.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="divider" />

          <div className="profile-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="19" stroke="white" strokeWidth="3"/>
              <circle cx="24" cy="18" r="6" stroke="white" strokeWidth="3"/>
              <path d="M12 38c2.7-6.2 7-9 12-9s9.3 2.8 12 9" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </header>

      <main className="content">
        <section className="stats-grid">
          <StatCard icon="folder" title="Total Complaints" value="250" iconBg="#8CE5C3" />
          <StatCard icon="clock" title="Pending" value="50" iconBg="#E875D0" />
          <StatCard icon="check" title="Resolved" value="120" iconBg="#12D57C" />
          <StatCard icon="warning" title="Overdue" value="30" iconBg="#F1A13F" />
        </section>

        <section className="chart-card">
          <div className="chart">
            <div className="y-axis">
              {chartData.map(([label]) => (
                <div className="y-label" key={label}>{label}</div>
              ))}
            </div>

            <div className="plot">
              <div className="grid-line x0" />
              <div className="grid-line x20" />
              <div className="grid-line x40" />
              <div className="grid-line x60" />
              <div className="grid-line x80" />

              <div className="bars">
                {chartData.map(([label, value]) => (
                  <div className="bar-row" key={label}>
                    <div className="bar" style={{ width: `${value}%` }} />
                  </div>
                ))}
              </div>

              <div className="x-axis">
                <span>0</span>
                <span>20</span>
                <span>40</span>
                <span>60</span>
                <span>80</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}