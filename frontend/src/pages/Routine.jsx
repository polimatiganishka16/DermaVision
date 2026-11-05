
import React, { useEffect, useState } from "react";
import { Info, Moon, Sparkles, Sun } from "lucide-react";

import { CONCERN_OPTIONS, SKIN_TYPE_OPTIONS, generateRoutine } from "../data/routineData";
import { getSkinProfile } from "../utils/skinProfile";

export default function Routine() {
  const [skinType, setSkinType] = useState("normal");
  const [concerns, setConcerns] = useState([]);
  const [period, setPeriod] = useState("am");
  const [routine, setRoutine] = useState(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    const profile = getSkinProfile();

    if (profile?.skinType) {
      setSkinType(profile.skinType);
      setPrefilled(true);
    }
  }, []);

  const toggleConcern = (id) => {
    setConcerns((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleGenerate = () => {
    setRoutine(generateRoutine({ skinType, concerns }));
  };

  const activeSteps = routine ? routine[period] : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">SKIN ROUTINE</div>
          <h1>Routine builder</h1>
          <p>
            A simple, general morning and evening routine, built from ingredient
            categories rather than specific products.
          </p>
        </div>
      </div>

      <section className="card">
        <div className="section-heading">
          <div className="section-icon">
            <Sparkles size={19} aria-hidden="true" />
          </div>
          <div>
            <div className="eyebrow">STEP 1</div>
            <h2>Your skin type</h2>
            <p>
              {prefilled
                ? "Pre-filled from your Assessment result. Change it any time."
                : "Not sure? Take the Assessment quiz first for a general estimate."}
            </p>
          </div>
        </div>

        <div className="chip-row">
          {SKIN_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={skinType === option.id ? "chip-button is-selected" : "chip-button"}
              onClick={() => setSkinType(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <div className="section-icon">
            <Sparkles size={19} aria-hidden="true" />
          </div>
          <div>
            <div className="eyebrow">STEP 2</div>
            <h2>Main concerns</h2>
            <p>Select any that apply. This is optional.</p>
          </div>
        </div>

        <div className="chip-row">
          {CONCERN_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={concerns.includes(option.id) ? "chip-button is-selected" : "chip-button"}
              onClick={() => toggleConcern(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button type="button" className="button primary-button routine-generate" onClick={handleGenerate}>
          <Sparkles size={16} aria-hidden="true" />
          Generate my routine
        </button>
      </section>

      {routine && (
        <section className="card">
          <div className="section-heading">
            <div className="section-icon">
              <Sun size={19} aria-hidden="true" />
            </div>
            <div>
              <div className="eyebrow">YOUR ROUTINE</div>
              <h2>Suggested steps</h2>
              <p>General educational guidance, not a treatment plan for a diagnosed condition.</p>
            </div>
          </div>

          <div className="segmented" role="tablist" aria-label="Morning or evening routine">
            <button
              type="button"
              role="tab"
              aria-selected={period === "am"}
              className={period === "am" ? "segmented-button is-active" : "segmented-button"}
              onClick={() => setPeriod("am")}
            >
              <Sun size={14} aria-hidden="true" />
              AM
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={period === "pm"}
              className={period === "pm" ? "segmented-button is-active" : "segmented-button"}
              onClick={() => setPeriod("pm")}
            >
              <Moon size={14} aria-hidden="true" />
              PM
            </button>
          </div>

          <ol className="routine-steps">
            {activeSteps.map((item, index) => (
              <li className="routine-step" key={`${period}-${index}`}>
                <span className="routine-step-num">{index + 1}</span>
                <div>
                  <div className="routine-step-title">
                    {item.title}
                    <span className="routine-step-category">{item.category}</span>
                  </div>
                  <p>{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="disclaimer-box">
        <Info size={17} aria-hidden="true" />
        <p>
          This routine is general educational guidance based on ingredient categories.
          It is not a prescription and is not tailored to any diagnosed skin condition.
          Introduce new active ingredients one at a time and stop if irritation occurs.
        </p>
      </div>
    </div>
  );
}
