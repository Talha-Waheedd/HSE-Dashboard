import React, { type ReactNode } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "../msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};
