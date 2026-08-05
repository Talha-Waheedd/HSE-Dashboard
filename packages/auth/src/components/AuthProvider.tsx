import React, { type ReactNode, useEffect, useState } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "../msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        await msalInstance.handleRedirectPromise();
      } catch (e) {
        console.error("MSAL initialization failed", e);
      } finally {
        setIsInitialized(true);
      }
    };
    initializeMsal();
  }, []);

  if (!isInitialized) {
    return null; // Don't render until MSAL is ready to process redirects/popups
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};
