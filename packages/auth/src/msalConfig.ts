import { type Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env?.VITE_MSAL_CLIENT_ID || "PLACEHOLDER_CLIENT_ID",
    authority: `https://login.microsoftonline.com/${
      import.meta.env?.VITE_MSAL_TENANT_ID || "PLACEHOLDER_TENANT_ID"
    }`,
    redirectUri: "/",
    postLogoutRedirectUri: "/",
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
  },
  system: {
    loggerOptions: {
      loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
      ) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
