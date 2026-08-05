let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (tokens: { accessToken?: string | null; refreshToken?: string | null }) => {
    accessToken = tokens.accessToken ?? null;
    refreshToken = tokens.refreshToken ?? refreshToken;
  },
  clear: () => {
    accessToken = null;
    refreshToken = null;
  },
};
