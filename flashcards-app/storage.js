/**
 * Storage helpers with versioning and safe parsing
 */

const STORAGE_KEY = 'flashcards_app_state';
const STORAGE_VERSION = 1;

/**
 * Load application state from localStorage with version checking
 * @returns {Object} parsed state or default empty state
 */
function loadState() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return { version: STORAGE_VERSION, decks: [] };
		}

		const parsed = JSON.parse(stored);

		// Version check
		if (parsed.version !== STORAGE_VERSION) {
			console.warn(`Storage version mismatch: expected ${STORAGE_VERSION}, got ${parsed.version}. Using defaults.`);
			return { version: STORAGE_VERSION, decks: [] };
		}

		// Validate structure
		if (!Array.isArray(parsed.decks)) {
			console.warn('Invalid decks array in storage. Using defaults.');
			return { version: STORAGE_VERSION, decks: [] };
		}

		return parsed;
	} catch (err) {
		console.error('Failed to parse localStorage:', err);
		// Fallback to safe default
		return { version: STORAGE_VERSION, decks: [] };
	}
}

/**
 * Save application state to localStorage with version
 * @param {Object} state - Application state to save
 * @returns {boolean} true if successful, false otherwise
 */
function saveState(state) {
	try {
		const toStore = {
			version: STORAGE_VERSION,
			...state
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
		return true;
	} catch (err) {
		console.error('Failed to save to localStorage:', err);
		// Graceful failure - app continues to work in-memory
		return false;
	}
}

/**
 * Clear all application state from localStorage
 * @returns {boolean} true if successful
 */
function clearState() {
	try {
		localStorage.removeItem(STORAGE_KEY);
		return true;
	} catch (err) {
		console.error('Failed to clear localStorage:', err);
		return false;
	}
}

// Expose for use
if (typeof window !== 'undefined') {
	window.appStorage = { loadState, saveState, clearState };
}

// Also export for module systems
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { loadState, saveState, clearState };
}
