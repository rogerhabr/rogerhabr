export type Scenario = 'bear' | 'base' | 'bull';

export interface ScenarioMult {
  tam: number;
  gpuDemand: number;
  revenue: number;
  utilizationOffset: number; // percentage points
  roicOffset: number;        // percentage points
}

export const SCENARIO_MULTS: Record<Scenario, ScenarioMult> = {
  bear: { tam: 0.60, gpuDemand: 0.68, revenue: 0.62, utilizationOffset: -17, roicOffset: -9 },
  base: { tam: 1.00, gpuDemand: 1.00, revenue: 1.00, utilizationOffset:   0, roicOffset:  0 },
  bull: { tam: 1.60, gpuDemand: 1.48, revenue: 1.65, utilizationOffset: +10, roicOffset: +13 },
};

export interface GlobalParams {
  scenario: Scenario;
  gpuUtilizationPct: number;
  inferenceSharePct: number;
  tokenDemandCAGRPct: number;
  powerCostPerKwh: number;
  gpuDepreciationYears: number;
}

export const SCENARIO_PRESETS: Record<Scenario, GlobalParams> = {
  bear: { scenario: 'bear', gpuUtilizationPct: 65, inferenceSharePct: 68, tokenDemandCAGRPct: 75,  powerCostPerKwh: 0.055, gpuDepreciationYears: 4 },
  base: { scenario: 'base', gpuUtilizationPct: 82, inferenceSharePct: 75, tokenDemandCAGRPct: 150, powerCostPerKwh: 0.040, gpuDepreciationYears: 3 },
  bull: { scenario: 'bull', gpuUtilizationPct: 93, inferenceSharePct: 82, tokenDemandCAGRPct: 290, powerCostPerKwh: 0.033, gpuDepreciationYears: 3 },
};
