import React from "react";
import { BackIcon, ClipboardIcon, ImagePlaceholder, ChevronIcon } from '../components/Icons';

const issues = [
  {
    id: 1,
    title: "Problem Title",
    description: "Short description of the issue goes here...",
  },
  {
    id: 2,
    title: "Problem Title",
    description: "Short description of the issue goes here...",
  },
  {
    id: 3,
    title: "Problem Title",
    description: "Short description of the issue goes here...",
  },
  {
    id: 4,
    title: "Problem Title",
    description: "Short description of the issue goes here...",
  },
];

export default function DepartmentIssues() {
  const handleBack = () => {
    window.history.back();
  };

  const handleIssueClick = (issue) => {
    console.log("Selected issue:", issue);
  };

  return (
    <main className="page">
      <header className="header">
        <div className="header-content">
          <button
            className="back-button"
            type="button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <BackIcon />
          </button>
          <div className="header-divider" />
          <h1 className="department-name">DepartmentName</h1>
        </div>
      </header>

      <section className="content">
        <div className="issues-panel">
          <div className="section-label">
            <ClipboardIcon />
            <span>Issues</span>
          </div>

          <div className="issue-list">
            {issues.map((issue) => (
              <button
                key={issue.id}
                className="issue-card"
                type="button"
                onClick={() => handleIssueClick(issue)}
              >
                <ImagePlaceholder />
                <div className="issue-divider" />
                <div className="issue-info">
                  <h2 className="issue-title">{issue.title}</h2>
                  <p className="issue-description">{issue.description}</p>
                </div>
                <div className="issue-arrow">
                  <ChevronIcon />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}