// Browser-only storage layer.
// Keys are kept in either localStorage (persistent) or sessionStorage (cleared on tab close).

export const STORAGE_KEYS = {
  ghToken: 'fbc_gh_token',
  username: 'fbc_username',
  aiProvider: 'fbc_ai_provider',
  aiKey: 'fbc_ai_key',
  persist: 'fbc_persist',
};

export const storage = {
  get(key) {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key) || '';
    } catch {
      return '';
    }
  },
  set(key, value, persist) {
    try {
      (persist ? localStorage : sessionStorage).setItem(key, value);
      (persist ? sessionStorage : localStorage).removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch {
      /* ignore */
    }
  },
};
