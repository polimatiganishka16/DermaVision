/*
  A small, curated reference of common skincare ingredient categories.
  General educational information only: no dosing, no medical claims,
  and no treatment instructions. Matching is by name and by the aliases
  listed for each entry, case-insensitive.
*/

export const INGREDIENTS = [
  {
    id: "hyaluronic-acid",
    name: "Hyaluronic acid",
    aliases: ["ha", "sodium hyaluronate"],
    category: "Hydrating",
    summary: "A humectant that attracts and holds water in the skin's surface layers.",
    use: "Commonly used in serums and moisturizers for most skin types, including sensitive skin.",
    cautions: ["Works best applied to damp skin and followed by a moisturizer to help seal it in."],
  },
  {
    id: "glycerin",
    name: "Glycerin",
    aliases: ["glycerol"],
    category: "Hydrating",
    summary: "A widely used humectant that helps the skin retain moisture.",
    use: "Found in many cleansers, moisturizers, and serums across skin types.",
    cautions: [],
  },
  {
    id: "ceramides",
    name: "Ceramides",
    aliases: [],
    category: "Barrier-support",
    summary: "Lipids that occur naturally in skin and help form its protective barrier.",
    use: "Used in moisturizers to help support a compromised or sensitive skin barrier.",
    cautions: [],
  },
  {
    id: "niacinamide",
    name: "Niacinamide",
    aliases: ["vitamin b3", "nicotinamide"],
    category: "Barrier-support",
    summary: "A form of vitamin B3 used to support the skin barrier and even out skin tone.",
    use: "Common in serums and moisturizers; generally well tolerated alongside most other ingredients.",
    cautions: ["Very high concentrations can occasionally cause flushing in some people."],
  },
  {
    id: "centella-asiatica",
    name: "Centella asiatica",
    aliases: ["cica", "gotu kola"],
    category: "Soothing",
    summary: "A plant extract often used in products aimed at calming and comforting skin.",
    use: "Common in soothing serums and creams, often marketed toward sensitive or reactive skin.",
    cautions: [],
  },
  {
    id: "allantoin",
    name: "Allantoin",
    aliases: [],
    category: "Soothing",
    summary: "A soothing agent often included in gentle, comfort-focused formulas.",
    use: "Frequently paired with other calming ingredients in creams and after-sun products.",
    cautions: [],
  },
  {
    id: "aloe-vera",
    name: "Aloe vera",
    aliases: [],
    category: "Soothing",
    summary: "A plant-derived ingredient often used for its soothing, cooling feel.",
    use: "Common in gels and after-sun or after-treatment products.",
    cautions: [],
  },
  {
    id: "glycolic-acid",
    name: "Glycolic acid",
    aliases: ["aha"],
    category: "Exfoliating",
    summary: "An alpha-hydroxy acid (AHA) that exfoliates the surface of the skin.",
    use: "Used in toners, serums, and peels to help smooth texture and tone.",
    cautions: [
      "Can increase sun sensitivity; daytime sunscreen is important while using it.",
      "Introduce gradually and avoid combining with other strong exfoliants on the same night.",
    ],
  },
  {
    id: "salicylic-acid",
    name: "Salicylic acid",
    aliases: ["bha"],
    category: "Exfoliating",
    summary: "A beta-hydroxy acid (BHA) that can penetrate into pores, often used for breakout-prone skin.",
    use: "Common in cleansers, toners, and spot products for oily or blemish-prone skin.",
    cautions: [
      "Can be drying; start with less frequent use, especially on dry or sensitive skin.",
      "Increases sun sensitivity; pair with daytime sunscreen.",
    ],
  },
  {
    id: "retinol",
    name: "Retinol",
    aliases: ["retinoid", "retinaldehyde"],
    category: "Exfoliating",
    summary: "A vitamin A derivative that speeds up skin cell turnover.",
    use: "Used in the evening to help with texture, fine lines, and uneven tone.",
    cautions: [
      "Can cause dryness, peeling or irritation, especially when starting out.",
      "Increases sun sensitivity; daytime sunscreen is important.",
      "Not generally recommended during pregnancy; check with a healthcare professional.",
    ],
  },
  {
    id: "vitamin-c",
    name: "Vitamin C",
    aliases: ["ascorbic acid", "l-ascorbic acid"],
    category: "Antioxidant",
    summary: "An antioxidant often used to help brighten skin tone and support sun-protection efforts.",
    use: "Typically applied in the morning under sunscreen.",
    cautions: ["Some forms can be unstable in light or air; store as directed by the product."],
  },
  {
    id: "vitamin-e",
    name: "Vitamin E",
    aliases: ["tocopherol"],
    category: "Antioxidant",
    summary: "An antioxidant often paired with vitamin C to help stabilize it.",
    use: "Common in serums and moisturizers.",
    cautions: [],
  },
  {
    id: "zinc-oxide",
    name: "Zinc oxide",
    aliases: ["mineral spf", "titanium dioxide"],
    category: "Sun-protection",
    summary: "A mineral sunscreen ingredient that sits on the skin's surface to reflect UV light.",
    use: "Used in mineral and hybrid sunscreens; often better tolerated by sensitive or reactive skin.",
    cautions: [],
  },
  {
    id: "chemical-spf",
    name: "Chemical sunscreen filters",
    aliases: ["avobenzone", "octocrylene", "homosalate"],
    category: "Sun-protection",
    summary: "Organic (carbon-based) filters that absorb UV light and convert it to heat.",
    use: "Common in lightweight, cosmetically elegant sunscreens.",
    cautions: ["Occasionally cause stinging around the eyes or on very sensitive skin."],
  },
  {
    id: "benzoyl-peroxide",
    name: "Benzoyl peroxide",
    aliases: ["bpo"],
    category: "Exfoliating",
    summary: "An over-the-counter antibacterial ingredient often used for breakout-prone skin.",
    use: "Used as a spot treatment or wash for acne-prone skin.",
    cautions: [
      "Can bleach fabrics, towels, and pillowcases.",
      "Can be drying; often used at a different time of day than retinoid-category products.",
    ],
  },
  {
    id: "azelaic-acid",
    name: "Azelaic acid",
    aliases: [],
    category: "Exfoliating",
    summary: "A gentler acid sometimes used for both breakouts and uneven tone.",
    use: "Generally considered one of the milder active ingredients, tolerated by many skin types.",
    cautions: ["Mild tingling on application is common and usually settles."],
  },
  {
    id: "peptides",
    name: "Peptides",
    aliases: [],
    category: "Barrier-support",
    summary: "Small protein fragments included in many formulas aimed at supporting skin structure.",
    use: "Common in serums and moisturizers, often layered with other actives.",
    cautions: [],
  },
  {
    id: "squalane",
    name: "Squalane",
    aliases: [],
    category: "Barrier-support",
    summary: "A lightweight emollient that helps soften skin and reduce moisture loss.",
    use: "Suitable for most skin types, including oily skin, in lightweight formulas.",
    cautions: [],
  },
  {
    id: "witch-hazel",
    name: "Witch hazel",
    aliases: [],
    category: "Soothing",
    summary: "A plant extract sometimes used as a mild astringent or toner ingredient.",
    use: "Found in some toners, though formulas vary widely in strength.",
    cautions: ["Some formulations contain alcohol, which can be drying for some skin types."],
  },
  {
    id: "fragrance",
    name: "Fragrance",
    aliases: ["parfum"],
    category: "Other",
    summary: "Added scent, from a single ingredient or a blend, in many cosmetic products.",
    use: "Common across product categories for scent.",
    cautions: ["A frequent trigger for irritation in sensitive or reactive skin."],
  },
];

export const INTERACTIONS = [
  {
    a: "retinol",
    b: "glycolic-acid",
    type: "caution",
    note: "Both increase cell turnover and sun sensitivity. Many people alternate nights rather than using them together.",
  },
  {
    a: "retinol",
    b: "salicylic-acid",
    type: "caution",
    note: "Combining two strong actives can increase the chance of dryness or irritation. Consider alternating nights.",
  },
  {
    a: "retinol",
    b: "benzoyl-peroxide",
    type: "caution",
    note: "Often used at different times of day, since combining them can be more irritating for some skin.",
  },
  {
    a: "glycolic-acid",
    b: "salicylic-acid",
    type: "caution",
    note: "Layering two exfoliating acids raises the risk of over-exfoliation. Many routines use one or the other on a given night.",
  },
  {
    a: "vitamin-c",
    b: "niacinamide",
    type: "synergy",
    note: "Commonly used together without issue in modern formulas; an older idea that they conflict is not well supported.",
  },
  {
    a: "vitamin-c",
    b: "vitamin-e",
    type: "synergy",
    note: "Often paired, since vitamin E can help stabilize vitamin C in a formula.",
  },
  {
    a: "hyaluronic-acid",
    b: "niacinamide",
    type: "synergy",
    note: "A common, generally well-tolerated pairing across skin types.",
  },
  {
    a: "chemical-spf",
    b: "vitamin-c",
    type: "synergy",
    note: "An antioxidant underneath sunscreen is a common daytime pairing.",
  },
  {
    a: "fragrance",
    b: "retinol",
    type: "caution",
    note: "Adding a fragranced product on top of an active ingredient can make irritation more likely on reactive skin.",
  },
  {
    a: "azelaic-acid",
    b: "vitamin-c",
    type: "caution",
    note: "Both can be mildly active on the skin; introducing one at a time can help identify what your skin tolerates.",
  },
];

export function findIngredient(query) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return null;

  return (
    INGREDIENTS.find((item) => item.name.toLowerCase() === normalized) ||
    INGREDIENTS.find((item) => item.aliases.some((alias) => alias.toLowerCase() === normalized)) ||
    INGREDIENTS.find((item) => item.name.toLowerCase().includes(normalized)) ||
    null
  );
}

export function findInteractions(ingredientIds) {
  const idSet = new Set(ingredientIds);

  return INTERACTIONS.filter((pair) => idSet.has(pair.a) && idSet.has(pair.b));
}
