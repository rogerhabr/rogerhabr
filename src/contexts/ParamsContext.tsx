'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { GlobalParams, Scenario, SCENARIO_PRESETS, SCENARIO_MULTS, ScenarioMult } from '@/lib/params';

interface ParamsCtx {
  params: GlobalParams;
  mult: ScenarioMult;
  setScenario: (s: Scenario) => void;
  setParam: <K extends keyof GlobalParams>(k: K, v: GlobalParams[K]) => void;
}

const Ctx = createContext<ParamsCtx>({
  params: SCENARIO_PRESETS.base,
  mult: SCENARIO_MULTS.base,
  setScenario: () => {},
  setParam: () => {},
});

export function ParamsProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<GlobalParams>(SCENARIO_PRESETS.base);

  const setScenario = (s: Scenario) => setParams(SCENARIO_PRESETS[s]);
  const setParam = <K extends keyof GlobalParams>(k: K, v: GlobalParams[K]) =>
    setParams(prev => ({ ...prev, scenario: 'base' as Scenario, [k]: v }));

  return (
    <Ctx.Provider value={{ params, mult: SCENARIO_MULTS[params.scenario], setScenario, setParam }}>
      {children}
    </Ctx.Provider>
  );
}

export const useGlobalParams = () => useContext(Ctx);
