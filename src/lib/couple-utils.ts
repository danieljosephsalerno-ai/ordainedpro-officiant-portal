/**
 * Utility functions for managing active couple ID across the application.
 * This ensures data isolation between different couples for the same officiant.
 */

const STORAGE_KEY = "ceremonyDetails";

/**
 * Get the active couple ID from localStorage
 * @returns The couple ID or null if not set
 */
export function getActiveCoupleId(): number | null {
  if (typeof window === "undefined") return null;

  const savedRaw = localStorage.getItem(STORAGE_KEY);
  if (!savedRaw) return null;

  try {
    const savedData = JSON.parse(savedRaw);
    return savedData.coupleId || savedData.couple_id || null;
  } catch {
    return null;
  }
}

/**
 * Set the active couple ID in localStorage
 * @param coupleId The couple ID to set
 */
export function setActiveCoupleId(coupleId: number): void {
  if (typeof window === "undefined") return;

  const savedRaw = localStorage.getItem(STORAGE_KEY);
  let existingData: Record<string, any> = {};

  if (savedRaw) {
    try {
      existingData = JSON.parse(savedRaw);
    } catch {
      existingData = {};
    }
  }

  existingData.coupleId = coupleId;
  existingData.couple_id = coupleId; // Keep both for compatibility
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
}

/**
 * Get the active couple ID, with validation and error handling
 * @param propCoupleId Optional couple ID passed as prop (takes priority)
 * @returns The couple ID or null if not available
 */
export function getValidCoupleId(propCoupleId?: number | null): number | null {
  // Prop takes priority
  if (propCoupleId) return propCoupleId;

  // Fall back to localStorage
  return getActiveCoupleId();
}

/**
 * Check if a valid couple is selected
 * @param propCoupleId Optional couple ID passed as prop
 * @returns True if a valid couple ID is available
 */
export function hasValidCouple(propCoupleId?: number | null): boolean {
  return getValidCoupleId(propCoupleId) !== null;
}
