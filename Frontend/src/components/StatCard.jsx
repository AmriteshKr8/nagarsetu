import React from 'react';
import { Icon } from './Icons';

export default function StatCard({ icon, title, value, iconBg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        <Icon type={icon} size={42} />
      </div>
      <div className="stat-copy">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}