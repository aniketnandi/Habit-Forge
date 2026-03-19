const BASE = "";

export function apiFetch(path, options = {}) {
  return fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
  });
}
