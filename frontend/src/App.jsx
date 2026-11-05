import React, { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import Home from "./pages/Home";
import Analyze from "./pages/Analyze";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import { NAV_ITEMS } from "./config";

/* Pages that are not built yet. Each one gets replaced by a real page
   component as it is completed; the wording is unchanged from before. */
const PLACEHOLDER_PAGES = {
  assessment: {
    eyebrow: "ASSESSMENT",
    title: "Assessment",
    description: "Review prediction confidence, uncertainty, and analysis results.",
    icon: <Activity size={22} />,
  },
  routine: {
    eyebrow: "SKIN ROUTINE",
    title: "Routine",
    description: "Build and track your personalized skincare routine.",
    icon: <Clock3 size={22} />,
  },
  ingredients: {
    eyebrow: "INGREDIENTS",
    title: "Ingredients",
    description:
      "Explore educational information about common skincare ingredients.",
    icon: <Sparkles size={22} />,
  },
  progress: {
    eyebrow: "PROGRESS",
    title: "Progress",
    description: "Track your previous analysis results over time.",
    icon: <TrendingUp size={22} />,
  },
  history: {
    eyebrow: "HISTORY",
    title: "History",
    description: "View your previous DermaVision analysis sessions.",
    icon: <Clock3 size={22} />,
  },
  learn: {
    eyebrow: "LEARN",
    title: "Learn",
    description:
      "Explore educational information about common skin conditions.",
    icon: <BookOpen size={22} />,
  },
  metrics: {
    eyebrow: "MODEL METRICS",
    title: "Model Metrics",
    description:
      "Explore the performance and evaluation information of the trained AI model.",
    icon: <BarChart3 size={22} />,
  },
};

const THEME_KEY = "dermavision-theme";

function App() {
  const [activePage, setActivePage] = useState("home");

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "dark";
    } catch {
      return false;
    }
  });

  /* The page background lives on <html>/<body>, outside .app, so the theme
     class is mirrored there too. The choice is remembered between visits. */
  useEffect(() => {
    document.documentElement.classList.toggle("dv-dark", darkMode);

    try {
      localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
    } catch {
      /* storage unavailable (e.g. private mode): theme still works this session */
    }
  }, [darkMode]);

  const navigate = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0 });
  };

  const renderPage = () => {
    if (activePage === "analyze") return <Analyze />;

    const placeholder = PLACEHOLDER_PAGES[activePage];

    if (placeholder) return <PlaceholderPage {...placeholder} />;

    return <Home onNavigate={navigate} />;
  };

  const pageTitle =
    NAV_ITEMS.find((item) => item.id === activePage)?.label || "Home";

  return (
    <div className={darkMode ? "app dark-mode" : "app"}>
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
      />

      <main className="main-area">
        <Header title={pageTitle} />

        <div className="page-content">{renderPage()}</div>
      </main>
    </div>
  );
}

function PlaceholderPage({ eyebrow, title, description, icon }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">{icon}</div>

      <p className="eyebrow">{eyebrow}</p>

      <h3>{title}</h3>

      <p className="page-description">{description}</p>

      <div className="placeholder-card">
        <Sparkles size={20} />
        <div>
          <strong>Coming next</strong>
          <p>
            This section is part of the DermaVision dashboard and will be
            connected to the analysis system.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
