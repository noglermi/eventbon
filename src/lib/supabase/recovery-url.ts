export type PasswordRecoveryUrlParameters = {
  accessToken: string | null;
  code: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
  type: string | null;
};

export function readPasswordRecoveryUrlParameters(): PasswordRecoveryUrlParameters {
  if (typeof window === "undefined") {
    return {
      accessToken: null,
      code: null,
      refreshToken: null,
      tokenHash: null,
      type: null,
    };
  }

  const hash = window.location.hash;
  const search = window.location.search;
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

  return {
    accessToken: searchParams.get("access_token") ?? hashParams.get("access_token"),
    code: searchParams.get("code") ?? hashParams.get("code"),
    refreshToken: searchParams.get("refresh_token") ?? hashParams.get("refresh_token"),
    tokenHash: searchParams.get("token_hash") ?? hashParams.get("token_hash"),
    type: searchParams.get("type") ?? hashParams.get("type"),
  };
}

export function hasPasswordRecoveryParameters() {
  if (typeof window === "undefined") {
    return false;
  }

  const hash = window.location.hash;
  const search = window.location.search;

  return (
    hash.includes("access_token") ||
    hash.includes("refresh_token") ||
    hash.includes("type=recovery") ||
    hash.includes("token_hash") ||
    search.includes("access_token") ||
    search.includes("refresh_token") ||
    search.includes("type=recovery") ||
    search.includes("token_hash")
  );
}
