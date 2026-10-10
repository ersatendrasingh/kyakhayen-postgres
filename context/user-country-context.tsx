"use client";

import React, { ReactNode, createContext, useContext } from "react";

type UserCountryContextValue = {
  userCountry: string;
  userCurrency: string;
};

// Keep pricing stable until a first-party geo/pricing strategy is introduced.
const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "IN";
const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "INR";

const UserCountryContext = createContext<UserCountryContextValue>({
  userCountry: DEFAULT_COUNTRY,
  userCurrency: DEFAULT_CURRENCY,
});

export const useUserCountry = () => useContext(UserCountryContext);

export const UserCountryProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <UserCountryContext.Provider
      value={{
        userCountry: DEFAULT_COUNTRY,
        userCurrency: DEFAULT_CURRENCY,
      }}
    >
      {children}
    </UserCountryContext.Provider>
  );
};
