import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Info, Sparkles } from "lucide-react";

import { ASSESSMENT_QUESTIONS, SKIN_TYPES, scoreAssessment } from "../data/assessmentQuestions";
import { saveSkinProfile } from "../utils/skinProfile";

export default function Assessment({ onNavigate }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const total = ASSESSMENT_QUESTIONS.length;
  const question = ASSESSMENT_QUESTIONS[step];

  const handleSelect = (optionId) => {
    const nextAnswers = { ...answers, [question.id]: optionId };
    setAnswers(nextAnswers);

    if (step < total - 1) {
      setStep(step + 1);
      return;
    }

    const scored = scoreAssessment(nextAnswers);
    setResult(scored);
    saveSkinProfile(scored.skinType, scored.scores);
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">SKIN ASSESSMENT</div>
          <h1>Skin Assessment</h1>
          <p>
            Answer {total} quick questions for a general sense of your skin type. This is
            a self-assessment, not a medical or dermatological test.
          </p>
        </div>
      </div>

      <div className="card assessment-card">
        <div className="assessment-progress-track">
          {ASSESSMENT_QUESTIONS.map((item, index) => (
            <div
              key={item.id}
              className={`assessment-progress-seg ${index < step + (result ? 1 : 0) ? "is-filled" : ""}`}
            />
          ))}
        </div>

        {!result ? (
          <>
            <div className="assessment-question-meta">
              QUESTION {step + 1} OF {total}
            </div>

            <h2 className="assessment-prompt">{question.prompt}</h2>

            <div className="assessment-options">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={
                    answers[question.id] === option.id
                      ? "assessment-option is-selected"
                      : "assessment-option"
                  }
                  onClick={() => handleSelect(option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>

            <div className="assessment-nav">
              <button
                type="button"
                className="button secondary-button"
                onClick={handleBack}
                disabled={step === 0}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Back
              </button>

              <span className="assessment-step-count">
                {step + 1} / {total}
              </span>
            </div>
          </>
        ) : (
          <div className="assessment-result">
            <div className="assessment-result-icon">
              <Sparkles size={24} aria-hidden="true" />
            </div>

            <div className="eyebrow">YOUR GENERAL SKIN TYPE</div>
            <h2>{SKIN_TYPES[result.skinType].label}</h2>
            <p>{SKIN_TYPES[result.skinType].description}</p>

            <div className="assessment-result-actions">
              <button
                type="button"
                className="button primary-button"
                onClick={() => onNavigate && onNavigate("routine")}
              >
                Build my routine
                <ChevronRight size={16} aria-hidden="true" />
              </button>

              <button type="button" className="button secondary-button" onClick={handleRestart}>
                Retake assessment
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="disclaimer-box">
        <Info size={17} aria-hidden="true" />
        <p>
          This is a general self-assessment for skin-care guidance, not a diagnosis of
          any skin condition.
        </p>
      </div>
    </div>
  );
}
