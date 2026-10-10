"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type HomePreferenceContextValue = {
  preference: string;
  setPreference: (preference: string) => void;
};

const HomePreferenceContext =
  createContext<HomePreferenceContextValue | null>(null);

export function HomePreferenceProvider({
  children,
  defaultPreference,
}: {
  children: ReactNode;
  defaultPreference: string;
}) {
  const [preference, setPreference] = useState(defaultPreference);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
    }),
    [preference],
  );

  return (
    <HomePreferenceContext.Provider value={value}>
      {children}
    </HomePreferenceContext.Provider>
  );
}

export function useHomePreference() {
  const context = useContext(HomePreferenceContext);

  if (!context) {
    throw new Error(
      "useHomePreference must be used within HomePreferenceProvider",
    );
  }

  return context;
}
