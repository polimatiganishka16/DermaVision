
/*
  A short, general self-assessment of skin type. This is a simple lifestyle
  quiz, not a medical or dermatological test, and it never diagnoses
  anything. Each option nudges the tally toward one general skin type;
  the type with the most points at the end wins, with "combination" as the
  tie-break since it is the broadest, least specific category.
*/

export const SKIN_TYPES = {
  dry: { label: "Dry", description: "Often feels tight and can be prone to flaking." },
  oily: { label: "Oily", description: "Tends to look shiny and may be prone to clogged pores." },
  combination: {
    label: "Combination",
    description: "Oilier in some areas (often the T-zone) and drier or normal elsewhere.",
  },
  normal: { label: "Normal", description: "Generally comfortable, with few extremes." },
  sensitive: {
    label: "Sensitive",
    description: "Reacts more easily to products, weather, or friction.",
  },
};

export const ASSESSMENT_QUESTIONS = [
  {
    id: "q1",
    prompt: "A few hours after cleansing, how does your skin usually feel?",
    options: [
      { id: "a", text: "Tight or a little dry", type: "dry" },
      { id: "b", text: "Comfortable, not tight or oily", type: "normal" },
      { id: "c", text: "Shiny all over", type: "oily" },
      { id: "d", text: "Shiny mainly down the center of my face", type: "combination" },
      { id: "e", text: "Sometimes a bit red or irritated", type: "sensitive" },
    ],
  },
  {
    id: "q2",
    prompt: "How often do you notice visible shine on your face during the day?",
    options: [
      { id: "a", text: "Rarely, if ever", type: "dry" },
      { id: "b", text: "Occasionally, nothing consistent", type: "normal" },
      { id: "c", text: "Often, across most of my face", type: "oily" },
      { id: "d", text: "Mostly on my forehead and nose", type: "combination" },
      { id: "e", text: "It varies a lot with weather or products", type: "sensitive" },
    ],
  },
  {
    id: "q3",
    prompt: "When you try a new skincare product, what usually happens?",
    options: [
      { id: "a", text: "It can feel drying or leave my skin feeling tight", type: "dry" },
      { id: "b", text: "No noticeable reaction", type: "normal" },
      { id: "c", text: "It can feel heavy or make me look shinier", type: "oily" },
      { id: "d", text: "It works fine in some areas, less well in others", type: "combination" },
      { id: "e", text: "It often causes redness, itching or stinging", type: "sensitive" },
    ],
  },
  {
    id: "q4",
    prompt: "How would you describe your pores?",
    options: [
      { id: "a", text: "Small and barely visible", type: "dry" },
      { id: "b", text: "Small to medium, fairly even", type: "normal" },
      { id: "c", text: "Visibly enlarged across most of my face", type: "oily" },
      { id: "d", text: "Larger on my nose and forehead than elsewhere", type: "combination" },
      { id: "e", text: "Not sure, I'm more focused on redness or reactions", type: "sensitive" },
    ],
  },
  {
    id: "q5",
    prompt: "In a dry or air-conditioned room, what does your skin do?",
    options: [
      { id: "a", text: "Feels tight, sometimes flaky", type: "dry" },
      { id: "b", text: "Stays fairly comfortable", type: "normal" },
      { id: "c", text: "Stays oily regardless", type: "oily" },
      { id: "d", text: "Gets a little dry in some areas, fine in others", type: "combination" },
      { id: "e", text: "Gets red, itchy or easily irritated", type: "sensitive" },
    ],
  },
  {
    id: "q6",
    prompt: "Do you notice flaking or rough, dry patches?",
    options: [
      { id: "a", text: "Often, especially in colder weather", type: "dry" },
      { id: "b", text: "Rarely", type: "normal" },
      { id: "c", text: "Almost never; excess oil is more of an issue", type: "oily" },
      { id: "d", text: "Only in certain areas, like my cheeks", type: "combination" },
      { id: "e", text: "Only when a product has irritated my skin", type: "sensitive" },
    ],
  },
  {
    id: "q7",
    prompt: "How does your skin react to sun, wind or temperature swings?",
    options: [
      { id: "a", text: "Gets dry or tight quickly", type: "dry" },
      { id: "b", text: "Not much noticeable change", type: "normal" },
      { id: "c", text: "Gets oilier, especially in heat", type: "oily" },
      { id: "d", text: "Different areas react differently", type: "combination" },
      { id: "e", text: "Reacts quickly with redness or discomfort", type: "sensitive" },
    ],
  },
];

export function scoreAssessment(answers) {
  const scores = { dry: 0, oily: 0, combination: 0, normal: 0, sensitive: 0 };

  ASSESSMENT_QUESTIONS.forEach((question) => {
    const chosenId = answers[question.id];
    const option = question.options.find((item) => item.id === chosenId);

    if (option) scores[option.type] += 1;
  });

  const priority = ["combination", "oily", "dry", "sensitive", "normal"];

  let winner = "combination";
  let best = -1;

  priority.forEach((type) => {
    if (scores[type] > best) {
      best = scores[type];
      winner = type;
    }
  });

  return { skinType: winner, scores };
}
