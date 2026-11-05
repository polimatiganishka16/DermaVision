import React from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Clock3,
  Info,
  Microscope,
  Sparkles,
  TrendingUp,
} from "lucide-react";

/*
  Usage: <Home onNavigate={navigate} />
  `onNavigate` receives a page id from config.js (e.g. "analyze").
*/

const STEPS = [
  {
    title: "Upload a clear photo",
    text: "Choose a well-lit, in-focus image of the skin area. It is checked for basic quality first.",
  },
  {
    title: "The model analyzes it",
    text: "An EfficientNet-B4 model ranks the most likely skin categories and reports how uncertain it is.",
  },
  {
    title: "See what influenced it",
    text: "A Grad-CAM visualization shows which image regions affected the prediction, alongside educational information.",
  },
];

const FEATURES = [
  {
    id: "analyze",
    icon: Microscope,
    title: "Analyze",
    text: "Upload a skin image for an AI prediction with a visual explanation.",
  },
  {
    id: "assessment",
    icon: Activity,
    title: "Assessment",
    text: "Answer a few questions to find out your general skin type.",
  },
  {
    id: "routine",
    icon: Clock3,
    title: "Routine",
    text: "Build a simple, general morning and evening skin-care routine.",
  },
  {
    id: "ingredients",
    icon: Sparkles,
    title: "Ingredients",
    text: "Look up common skin-care ingredients and how they combine.",
  },
  {
    id: "progress",
    icon: TrendingUp,
    title: "Progress",
    text: "See a summary of your past analyses in this app.",
  },
  {
    id: "learn",
    icon: BookOpen,
    title: "Learn",
    text: "Read sourced, educational information about skin conditions.",
  },
];

export default function Home({ onNavigate }) {
  return (
    <div className="page-container home-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          <Sparkles size={14} />
          AI-assisted skin image analysis
        </div>

        <h1 className="hero-title">
          Explainable AI for
          <span> skin image analysis</span>
        </h1>

        <p className="hero-text">
          Upload a photo of a skin area to receive an AI model prediction, a
          visual explanation of what influenced it, and educational
          information. DermaVision supports learning and decision-making. It
          does not diagnose.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="hero-button hero-button-primary"
            onClick={() => onNavigate?.("analyze")}
          >
            Start analysis
            <ArrowRight size={17} />
          </button>

          <button
            type="button"
            className="hero-button hero-button-ghost"
            onClick={() => onNavigate?.("learn")}
          >
            Learn more
          </button>
        </div>

        <div className="hero-stats">
          <div>
            <strong>19</strong>
            <span>Skin categories</span>
          </div>

          <div>
            <strong>Grad-CAM</strong>
            <span>Visual explanations</span>
          </div>

          <div>
            <strong>EfficientNet-B4</strong>
            <span>Model architecture</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="home-section">
        <div className="eyebrow">HOW IT WORKS</div>
        <h2>Three steps, with the uncertainty shown</h2>

        <div className="steps-grid">
          {STEPS.map((step, index) => (
            <div className="step-card" key={step.title}>
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EXPLORE */}
      <section className="home-section">
        <div className="eyebrow">EXPLORE</div>
        <h2>Everything in DermaVision</h2>

        <div className="feature-grid">
          {FEATURES.map(({ id, icon: Icon, title, text }) => (
            <button
              type="button"
              className="feature-card"
              key={id}
              onClick={() => onNavigate?.(id)}
            >
              <span className="feature-icon">
                <Icon size={20} />
              </span>

              <span className="feature-body">
                <strong>{title}</strong>
                <span>{text}</span>
              </span>

              <ArrowRight size={16} className="feature-arrow" />
            </button>
          ))}
        </div>
      </section>

      <div className="disclaimer-box">
        <Info size={17} />

        <p>
          This is an AI-generated prediction tool for educational and
          decision-support purposes only. It is not a medical diagnosis. If you
          are concerned about your skin, please consult a qualified healthcare
          professional.
        </p>
      </div>
    </div>
  );
}
