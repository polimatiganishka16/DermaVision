import React from "react";
import { HeartPulse, CheckCircle2 } from "lucide-react";

/*
  General, non-specific skin-care habits. This card is NOT tied to the model's
  prediction and is not a treatment plan. It can be reused on the Routine page.
*/

const GUIDANCE = [
  "Cleanse gently and avoid harsh scrubbing.",
  "Avoid products that irritate the skin, especially if it is sensitive.",
  "Protect skin from excessive UV exposure.",
  "Avoid picking or squeezing lesions.",
  "Monitor changes over time, for example by taking photos in similar lighting.",
  "Seek professional care for rapidly changing or unexplained lesions.",
];

export default function SkincareGuidance() {
  return (
    <section className="card guidance-card">
      <div className="section-heading">
        <div className="section-icon">
          <HeartPulse size={19} />
        </div>

        <div>
          <div className="eyebrow">EDUCATIONAL SUPPORT</div>
          <h2>General skin-care guidance</h2>
          <p>
            General habits that apply to most skin. They are not specific to the
            predicted class and are not a treatment plan.
          </p>
        </div>
      </div>

      <ul className="guidance-grid">
        {GUIDANCE.map((item) => (
          <li className="guidance-item" key={item}>
            <CheckCircle2 size={17} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
