import React from "react";
import { Moon, Sparkles, Sun } from "lucide-react";

import { NAV_ITEMS } from "../config";

export default function Sidebar({
  activePage,
  onNavigate,
  darkMode,
  onToggleTheme,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <Sparkles size={22} />
        </div>

        <div>
          <h1>DermaVision</h1>
          <p>AI Skin Insights</p>
        </div>
      </div>

      <div className="sidebar-label">MAIN MENU</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={activePage === id ? "nav-item active" : "nav-item"}
            aria-current={activePage === id ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="insight-box">
          <div className="insight-icon">
            <Sparkles size={16} />
          </div>

          <div>
            <strong>AI-powered insights</strong>
            <p>Educational support only. Not a medical diagnosis.</p>
          </div>
        </div>

        <button type="button" className="theme-button" onClick={onToggleTheme}>
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}
