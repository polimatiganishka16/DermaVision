
import React, { useState } from "react";
import { AlertTriangle, FlaskConical, Info, Sparkles, X } from "lucide-react";

import { findIngredient, findInteractions } from "../data/ingredientsData";

export default function Ingredients() {
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [checked, setChecked] = useState(false);

  const addFromInput = () => {
    const parts = inputValue
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    const nextSelected = [...selected];
    const nextUnmatched = [];

    parts.forEach((part) => {
      const match = findIngredient(part);

      if (match) {
        if (!nextSelected.some((item) => item.id === match.id)) nextSelected.push(match);
      } else {
        nextUnmatched.push(part);
      }
    });

    setSelected(nextSelected);
    setUnmatched(nextUnmatched);
    setInputValue("");
    setChecked(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFromInput();
    }
  };

  const removeIngredient = (id) => {
    setSelected(selected.filter((item) => item.id !== id));
    setChecked(false);
  };

  const handleCheck = () => {
    setChecked(true);
  };

  const interactions = checked ? findInteractions(selected.map((item) => item.id)) : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">INGREDIENTS</div>
          <h1>Ingredient checker</h1>
          <p>
            Look up common skin-care ingredients and how they generally combine. General
            educational reference, not a substitute for reading a product's own label.
          </p>
        </div>
      </div>

      <section className="card">
        <div className="section-heading">
          <div className="section-icon">
            <FlaskConical size={19} aria-hidden="true" />
          </div>
          <div>
            <div className="eyebrow">ADD INGREDIENTS</div>
            <h2>What's in your routine?</h2>
            <p>Type a name and press Enter, or separate several with commas.</p>
          </div>
        </div>

        <div className="ingredient-input-row">
          <input
            type="text"
            className="ingredient-input"
            placeholder="e.g. niacinamide, retinol, vitamin C"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="button secondary-button" onClick={addFromInput}>
            Add
          </button>
        </div>

        {selected.length > 0 && (
          <div className="chip-row" style={{ marginTop: 14 }}>
            {selected.map((item) => (
              <span className="chip-button is-selected" key={item.id}>
                {item.name}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeIngredient(item.id)}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}

        {unmatched.length > 0 && (
          <p className="muted-text" style={{ marginTop: 12 }}>
            Not in our reference list yet: {unmatched.join(", ")}
          </p>
        )}

        <button
          type="button"
          className="button primary-button routine-generate"
          onClick={handleCheck}
          disabled={selected.length === 0}
        >
          <Sparkles size={16} aria-hidden="true" />
          Check ingredients
        </button>
      </section>

      {checked && selected.length > 0 && (
        <>
          {interactions.length > 0 && (
            <section className="card">
              <div className="section-heading">
                <div className="section-icon">
                  <AlertTriangle size={19} aria-hidden="true" />
                </div>
                <div>
                  <div className="eyebrow">HOW THEY COMBINE</div>
                  <h2>Cautions and synergies</h2>
                  <p>Based on the ingredients you added.</p>
                </div>
              </div>

              <div className="interaction-list">
                {interactions.map((pair, index) => (
                  <div
                    key={index}
                    className={`interaction-row ${pair.type === "caution" ? "is-caution" : "is-synergy"}`}
                  >
                    <span className="interaction-tag">
                      {pair.type === "caution" ? "Caution" : "Works well together"}
                    </span>
                    <p>{pair.note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card">
            <div className="section-heading">
              <div className="section-icon">
                <Info size={19} aria-hidden="true" />
              </div>
              <div>
                <div className="eyebrow">REFERENCE</div>
                <h2>About each ingredient</h2>
              </div>
            </div>

            <div className="medical-grid">
              {selected.map((item) => (
                <div className="medical-box" key={item.id}>
                  <div className="medical-box-icon">
                    <FlaskConical size={17} aria-hidden="true" />
                  </div>
                  <div>
                    <h3>
                      {item.name} <span className="ingredient-category-tag">{item.category}</span>
                    </h3>
                    <p>{item.summary}</p>
                    <p className="muted-text">{item.use}</p>
                    {item.cautions.length > 0 && (
                      <ul className="medical-list">
                        {item.cautions.map((caution, index) => (
                          <li key={index}>{caution}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="disclaimer-box">
        <Info size={17} aria-hidden="true" />
        <p>
          General educational information only. It is not personalized advice, and it
          does not cover every product formulation or every possible interaction.
        </p>
      </div>
    </div>
  );
}
