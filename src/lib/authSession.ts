const AUTH_TOKEN_KEY = "carteira-auth-token";

let currentToken: string | null = null;

export function getStoredToken() {
  if (typeof window === "undefined") {
    return currentToken;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  currentToken = token;
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getCurrentToken() {
  return currentToken ?? getStoredToken();
}
