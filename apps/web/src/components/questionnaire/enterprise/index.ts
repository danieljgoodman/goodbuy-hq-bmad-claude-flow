// Main section components
export { OperationalScalabilitySection } from './OperationalScalabilitySection';
export { FinancialOptimizationSection } from './FinancialOptimizationSection';
export { StrategicScenarioPlanningSection } from './StrategicScenarioPlanningSection';
export { MultiYearProjectionsSection } from './MultiYearProjectionsSection';

// Utility components
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