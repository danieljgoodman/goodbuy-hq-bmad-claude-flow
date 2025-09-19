// Lazy loaded main section components for code splitting
import { lazy } from 'react';

export const OperationalScalabilitySection = lazy(() =>
  import('./OperationalScalabilitySection').then(module => ({
    default: module.OperationalScalabilitySection
  }))
);

export const FinancialOptimizationSection = lazy(() =>
  import('./FinancialOptimizationSection').then(module => ({
    default: module.FinancialOptimizationSection
  }))
);

export const StrategicScenarioPlanningSection = lazy(() =>
  import('./StrategicScenarioPlanningSection').then(module => ({
    default: module.StrategicScenarioPlanningSection
  }))
);

export const MultiYearProjectionsSection = lazy(() =>
  import('./MultiYearProjectionsSection').then(module => ({
    default: module.MultiYearProjectionsSection
  }))
);

// Utility components - already optimized
export { MultiScenarioWizard } from './MultiScenarioWizard';

// Schemas and validation
export {
  operationalScalabilitySchema,
  financialOptimizationSchema,
  strategicScenarioPlanningSchema,
  multiYearProjectionsSchema,
  enterpriseQuestionnaireSchema,
  validateSection,
  validateEntireQuestionnaire,
  transformDataForAPI,
  getCompletionPercentage,
  type OperationalScalabilityData,
  type FinancialOptimizationData,
  type StrategicScenarioPlanningData,
  type MultiYearProjectionsData,
  type EnterpriseQuestionnaireData
} from './schemas';

// Re-export existing components for compatibility
export { StrategicValueDriversSection } from './StrategicValueDriversSection';