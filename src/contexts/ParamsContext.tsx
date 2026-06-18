'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GlobalParams, Scenario, SCENARIO_PRESETS, SCENARIO_MULTS, ScenarioMult } from '@/lib/params';

interface ParamsCtx {
  params: GlobalParams;
  mult: ScenarioMult;
  activeSection: string;
  setScenario: (s: Scenario) => void;
  setParam: <K extends keyof GlobalParams>(k: K, v: GlobalParams[K]) => void;
  navigate: (sectionId: string) => void;
}

const Ctx = createContext<ParamsCtx>({
  params: SCENARIO_PRESETS.base,
  mult: SCENARIO_MULTS.base,
  activeSection: 'overview',
  setScenario: () => {},
  setParam: () => {},
  navigate: () => {},
});

export function ParamsProvider({
  children,
  activeSection,
  onNavigate,
}: {
  children: ReactNode;
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  const [params, setParams] = useState<GlobalParams>(SCENARIO_PRESETS.base);

  const setScenario = (s: Scenario) => setParams(SCENARIO_PRESETS[s]);
  const setParam = <K extends keyof GlobalParams>(k: K, v: GlobalParams[K]) =>
    setParams(prev => ({ ...prev, scenario: 'base' as Scenario, [k]: v }));
  const navigate = useCallback((id: string) => onNavigate(id), [onNavigate]);

  return (
    <Ctx.Provider value={{ params, mult: SCENARIO_MULTS[params.scenario], activeSection, setScenario, setParam, navigate }}>
      {children}
    </Ctx.Provider>
  );
}

export const useGlobalParams = () => useContext(Ctx);
