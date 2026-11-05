/*
  Stores the result of the Assessment quiz (a general skin type, chosen by
  the person from a self-assessment) so the Routine page can start from it.
  Kept entirely in the browser; nothing is sent anywhere.
*/

const STORAGE_KEY = "dermavision-skin-profile";

export function getSkinProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSkinProfile(skinType, scores) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ skinType, scores, savedAt: new Date().toISOString() })
    );
    return true;
  } catch {
    return false;
  }
}

export function clearSkinProfile() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
