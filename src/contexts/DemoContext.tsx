import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { DemoKey, DemoProfile } from "@/data/demoProfiles";
import { demoProfiles } from "@/data/demoProfiles";

type ActiveDemo = "none" | DemoKey;

type Ctx = {
  activeDemo: ActiveDemo;
  setActiveDemo: (v: ActiveDemo) => void;
  profile: DemoProfile | null;
};

const DemoContext = createContext<Ctx>({
  activeDemo: "none",
  setActiveDemo: () => {},
  profile: null,
});

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [activeDemo, setActive] = useState<ActiveDemo>("none");
  const setActiveDemo = useCallback((v: ActiveDemo) => setActive(v), []);
  const profile = activeDemo === "none" ? null : demoProfiles[activeDemo];
  return (
    <DemoContext.Provider value={{ activeDemo, setActiveDemo, profile }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext);
