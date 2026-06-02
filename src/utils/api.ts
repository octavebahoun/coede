import { auth } from "../firebase";

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const user = auth.currentUser;

  const headers = new Headers(options.headers || {});

  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    } catch (error) {
      console.warn("Failed to retrieve Firebase ID token", error);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
