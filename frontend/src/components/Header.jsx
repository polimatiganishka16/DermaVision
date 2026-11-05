import React, { useEffect, useState } from "react";

import { API_URL } from "../config";

/*
  Checks whether the backend is reachable (on load, every 30 s, and when the
  tab regains focus) so the status pill reflects reality instead of always
  saying "online". It only tests reachability, not the model itself.
*/
function useBackendStatus() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      try {
        /* no-cors: we only care that the server answered, not what it said. */
        await fetch(`${API_URL}/docs`, {
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!cancelled) setStatus("online");
      } catch {
        if (!cancelled) setStatus("offline");
      } finally {
        clearTimeout(timer);
      }
    };

    check();

    const interval = setInterval(check, 30000);
    window.addEventListener("focus", check);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", check);
    };
  }, []);

  return status;
}

const STATUS_LABELS = {
  checking: "Checking system…",
  online: "AI System Online",
  offline: "Backend offline",
};

export default function Header({ title }) {
  const status = useBackendStatus();

  return (
    <header className="top-header">
      <div>
        <span className="header-eyebrow">DERMAVISION</span>
        <h2>{title}</h2>
      </div>

      <div
        className={`system-status is-${status}`}
        role="status"
        title={
          status === "offline"
            ? "Start the backend with: uvicorn backend.api:app --reload"
            : undefined
        }
      >
        <span className="status-dot"></span>
        {STATUS_LABELS[status]}
      </div>
    </header>
  );
}
