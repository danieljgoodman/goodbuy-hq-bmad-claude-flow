# Enterprise Tier Questionnaire Components

This directory contains comprehensive components for the Enterprise tier business valuation questionnaire, implementing sections 7-10 of the assessment.

## Components Overview

### Section Components

#### 1. OperationalScalabilitySection (Section 7)
Evaluates operational processes, management systems, technology infrastructure, and scalability metrics.

**Features:**
- Process documentation assessment
- Management systems analysis
- Technology infrastructure evaluation
- Scalability metrics and bottleneck identification
- Real-time progress indicators and scoring

#### 2. FinancialOptimizationSection (Section 8)
Analyzes tax strategy, working capital, capital structure, and owner compensation optimization.

**Features:**
- Tax optimization opportunities
- Working capital efficiency analysis
- Capital structure optimization
- Owner compensation benchmarking
- Financial health visualization

#### 3. StrategicScenarioPlanningSection (Section 9)
Comprehensive scenario planning with exit strategy optimization and value maximization.

**Features:**
- Multi-scenario growth modeling with the MultiScenarioWizard
- Investment strategy prioritization
- Exit planning and readiness assessment
- Value driver prioritization
- Risk mitigation strategies

#### 4. MultiYearProjectionsSection (Section 10)
5-year financial projections and strategic options analysis.

**Features:**
- Revenue, margin, and capital requirement projections
- Market evolution assessment
- Strategic options evaluation (international expansion, platform development, etc.)
- Investment sequencing and prioritization
- Sensitivity analysis

### Utility Components

#### MultiScenarioWizard
Advanced scenario comparison tool with tabbed interface for modeling different growth scenarios.

**Features:**
- Scenario creation and management
- Side-by-side comparison view
- Weighted expected value calculations
- Risk assessment integration
- Export and analysis capabilities

## Styling and Theming

All components use the `tier-enterprise` CSS class for consistent Enterprise tier styling:
- Purple-to-blue gradient color schemes
- Enhanced visual hierarchy
- Premium typography and spacing
- Professional animations using Framer Motion

## Validation

Comprehensive Zod-based validation schemas ensure data integrity:

```typescript
import { validateSection, validateEntireQuestionnaire } from './schemas';

// Validate individual section
const result = validateSection('operationalScalability', sectionData);

// Validate entire questionnaire
const fullResult = validateEntireQuestionnaire(questionnaireData);
```

## Data Structure

Each section follows a consistent data structure pattern:

```typescript
interface SectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}
```

## Usage Example

```typescript
import {
  OperationalScalabilitySection,
  FinancialOptimizationSection,
  StrategicScenarioPlanningSection,
  MultiYearProjectionsSection
} from '@/components/questionnaire/enterprise';

// In your questionnaire component
const [currentSection, setCurrentSection] = useState(7);
const [questionnaireData, setQuestionnaireData] = useState({});

const handleSectionUpdate = (data) => {
  setQuestionnaireData(prev => ({ ...prev, ...data }));
};

// Render appropriate section based on currentSection
{currentSection === 7 && (
  <OperationalScalabilitySection
    data={questionnaireData}
    onUpdate={handleSectionUpdate}
    onNext={() => setCurrentSection(8)}
    onPrevious={() => setCurrentSection(6)}
  />
)}
```

## Key Features

### 1. Comprehensive Assessment
- 4 major sections covering operational, financial, strategic, and projection aspects
- Over 50 individual metrics and assessments
- Industry-standard benchmarking

### 2. Advanced Scenario Modeling
- Multi-scenario wizard with comparison capabilities
- Probability-weighted analysis
- Risk assessment integration
- Investment sequencing optimization

### 3. Real-time Validation
- Input validation with immediate feedback
- Progress tracking and completion percentages
- Data integrity enforcement

### 4. Professional UX
- Smooth animations and transitions
- Responsive design for all screen sizes
- Accessible form controls and navigation
- Visual progress indicators

### 5. Export and Integration
- Structured data output for API integration
- PDF report generation ready
- Analytics and insights preparation

## File Structure

```
enterprise/
├── OperationalScalabilitySection.tsx      # Section 7
├── FinancialOptimizationSection.tsx       # Section 8
├── StrategicScenarioPlanningSection.tsx   # Section 9
├── MultiYearProjectionsSection.tsx        # Section 10
├── MultiScenarioWizard.tsx                # Scenario modeling tool
├── StrategicValueDriversSection.tsx       # Section 6 (existing)
├── schemas.ts                             # Validation schemas
├── index.ts                               # Component exports
└── README.md                              # This documentation
```

## Development Notes

### Dependencies
- React 18+
- Framer Motion for animations
- Zod for validation
- Radix UI components via shadcn/ui
- Lucide React for icons

### Performance Considerations
- Components use React.memo for optimization
- Validation is debounced to prevent excessive re-renders
- Large arrays use virtualization where appropriate
- Image and heavy content is lazy-loaded

### Accessibility
- ARIA labels on all form controls
- Keyboard navigation support
- Screen reader compatible
- High contrast support
- Focus management

## Future Enhancements

1. **Advanced Analytics**: Integration with business intelligence tools
2. **Collaborative Features**: Multi-user editing and commenting
3. **Template System**: Industry-specific questionnaire templates
4. **Integration APIs**: Direct connection to accounting and CRM systems
5. **Mobile App**: Native mobile application for on-the-go assessments

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.