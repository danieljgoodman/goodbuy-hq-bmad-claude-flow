-- Professional Tier Schema Migration
-- Creates tables and structures for professional tier functionality

BEGIN;

-- Create professional_evaluations table
CREATE TABLE IF NOT EXISTS public.professional_evaluations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  tier text NOT NULL CHECK (tier IN ('basic', 'professional', 'enterprise')),
  evaluation_data jsonb NOT NULL,
  health_score integer CHECK (health_score >= 0 AND health_score <= 100),
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),

  -- Professional tier specific fields
  advanced_analytics jsonb,
  benchmark_comparison jsonb,
  predictive_modeling jsonb,
  sensitivity_analysis jsonb,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create financial_metrics_extended table
CREATE TABLE IF NOT EXISTS public.financial_metrics_extended (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id uuid REFERENCES public.professional_evaluations(id) ON DELETE CASCADE NOT NULL,

  -- Enhanced financial metrics (15 fields)
  net_profit numeric,
  ebitda numeric,
  burn_rate numeric CHECK (burn_rate >= 0),
  runway_months numeric CHECK (runway_months >= 0),
  debt_to_equity_ratio numeric CHECK (debt_to_equity_ratio >= 0),
  current_ratio numeric CHECK (current_ratio >= 0),
  quick_ratio numeric CHECK (quick_ratio >= 0),
  inventory_turnover numeric CHECK (inventory_turnover >= 0),
  receivables_turnover numeric CHECK (receivables_turnover >= 0),
  working_capital numeric,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customer_analytics table
CREATE TABLE IF NOT EXISTS public.customer_analytics (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id uuid REFERENCES public.professional_evaluations(id) ON DELETE CASCADE NOT NULL,

  -- Customer analytics & segmentation (8 fields)
  customer_acquisition_cost numeric CHECK (customer_acquisition_cost >= 0),
  customer_lifetime_value numeric CHECK (customer_lifetime_value >= 0),
  churn_rate numeric CHECK (churn_rate >= 0 AND churn_rate <= 100),
  net_promoter_score numeric CHECK (net_promoter_score >= -100 AND net_promoter_score <= 100),
  monthly_active_users integer CHECK (monthly_active_users >= 0),
  conversion_rate numeric CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
  average_order_value numeric CHECK (average_order_value >= 0),
  repeat_customer_rate numeric CHECK (repeat_customer_rate >= 0 AND repeat_customer_rate <= 100),

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create operational_efficiency table
CREATE TABLE IF NOT EXISTS public.operational_efficiency (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id uuid REFERENCES public.professional_evaluations(id) ON DELETE CASCADE NOT NULL,

  -- Operational efficiency metrics (7 fields)
  employee_productivity numeric CHECK (employee_productivity >= 0),
  operating_expense_ratio numeric CHECK (operating_expense_ratio >= 0 AND operating_expense_ratio <= 100),
  capacity_utilization numeric CHECK (capacity_utilization >= 0 AND capacity_utilization <= 100),
  inventory_days_on_hand numeric CHECK (inventory_days_on_hand >= 0),
  payment_terms_days numeric CHECK (payment_terms_days >= 0),
  vendor_payment_days numeric CHECK (vendor_payment_days >= 0),
  cash_conversion_cycle numeric,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create market_intelligence table
CREATE TABLE IF NOT EXISTS public.market_intelligence (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id uuid REFERENCES public.professional_evaluations(id) ON DELETE CASCADE NOT NULL,

  -- Market intelligence data (6+ fields)
  market_share numeric CHECK (market_share >= 0 AND market_share <= 100),
  market_growth_rate numeric,
  competitor_analysis jsonb NOT NULL,
  market_trends jsonb NOT NULL,
  threat_level text CHECK (threat_level IN ('low', 'medium', 'high')),
  opportunity_score numeric CHECK (opportunity_score >= 0 AND opportunity_score <= 100),

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create financial_planning table
CREATE TABLE IF NOT EXISTS public.financial_planning (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id uuid REFERENCES public.professional_evaluations(id) ON DELETE CASCADE NOT NULL,

  -- Financial planning & forecasting (5+ fields)
  revenue_forecast_12_month jsonb NOT NULL,
  expense_forecast_12_month jsonb NOT NULL,
  cash_flow_forecast_12_month jsonb NOT NULL,
  scenario_analysis jsonb NOT NULL,
  budget_variance numeric CHECK (budget_variance >= -100 AND budget_variance <= 100),

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create compliance_data table
CREATE TABLE IF NOT EXISTS public.compliance_data (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id uuid REFERENCES public.professional_evaluations(id) ON DELETE CASCADE NOT NULL,

  -- Compliance & risk management (4+ fields)
  regulatory_compliance jsonb NOT NULL,
  risk_assessment jsonb NOT NULL,
  insurance_coverage jsonb NOT NULL,
  audit_trail jsonb NOT NULL,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prof_eval_user_id ON public.professional_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_prof_eval_business_id ON public.professional_evaluations(business_id);
CREATE INDEX IF NOT EXISTS idx_prof_eval_tier ON public.professional_evaluations(tier);
CREATE INDEX IF NOT EXISTS idx_prof_eval_status ON public.professional_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_prof_eval_created_at ON public.professional_evaluations(created_at);
CREATE INDEX IF NOT EXISTS idx_prof_eval_health_score ON public.professional_evaluations(health_score);

-- Indexes for extended tables
CREATE INDEX IF NOT EXISTS idx_financial_metrics_eval_id ON public.financial_metrics_extended(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_eval_id ON public.customer_analytics(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_operational_efficiency_eval_id ON public.operational_efficiency(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_eval_id ON public.market_intelligence(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_financial_planning_eval_id ON public.financial_planning(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_compliance_data_eval_id ON public.compliance_data(evaluation_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.professional_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_efficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for professional_evaluations
CREATE POLICY "Users can view own professional evaluations" ON public.professional_evaluations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own professional evaluations" ON public.professional_evaluations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own professional evaluations" ON public.professional_evaluations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own professional evaluations" ON public.professional_evaluations
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for extended tables (via evaluation ownership)
CREATE POLICY "Users can view own financial metrics" ON public.financial_metrics_extended
  FOR SELECT USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create own financial metrics" ON public.financial_metrics_extended
  FOR INSERT WITH CHECK (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own financial metrics" ON public.financial_metrics_extended
  FOR UPDATE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own financial metrics" ON public.financial_metrics_extended
  FOR DELETE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

-- Repeat similar policies for other extended tables
CREATE POLICY "Users can view own customer analytics" ON public.customer_analytics
  FOR SELECT USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create own customer analytics" ON public.customer_analytics
  FOR INSERT WITH CHECK (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own customer analytics" ON public.customer_analytics
  FOR UPDATE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own customer analytics" ON public.customer_analytics
  FOR DELETE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own operational efficiency" ON public.operational_efficiency
  FOR SELECT USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create own operational efficiency" ON public.operational_efficiency
  FOR INSERT WITH CHECK (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own operational efficiency" ON public.operational_efficiency
  FOR UPDATE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own operational efficiency" ON public.operational_efficiency
  FOR DELETE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own market intelligence" ON public.market_intelligence
  FOR SELECT USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create own market intelligence" ON public.market_intelligence
  FOR INSERT WITH CHECK (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own market intelligence" ON public.market_intelligence
  FOR UPDATE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own market intelligence" ON public.market_intelligence
  FOR DELETE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own financial planning" ON public.financial_planning
  FOR SELECT USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create own financial planning" ON public.financial_planning
  FOR INSERT WITH CHECK (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own financial planning" ON public.financial_planning
  FOR UPDATE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own financial planning" ON public.financial_planning
  FOR DELETE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own compliance data" ON public.compliance_data
  FOR SELECT USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create own compliance data" ON public.compliance_data
  FOR INSERT WITH CHECK (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own compliance data" ON public.compliance_data
  FOR UPDATE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own compliance data" ON public.compliance_data
  FOR DELETE USING (evaluation_id IN (
    SELECT id FROM public.professional_evaluations WHERE user_id = auth.uid()
  ));

-- Create triggers for updated_at
CREATE TRIGGER handle_professional_evaluations_updated_at
  BEFORE UPDATE ON public.professional_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_financial_metrics_extended_updated_at
  BEFORE UPDATE ON public.financial_metrics_extended
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_customer_analytics_updated_at
  BEFORE UPDATE ON public.customer_analytics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_operational_efficiency_updated_at
  BEFORE UPDATE ON public.operational_efficiency
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_market_intelligence_updated_at
  BEFORE UPDATE ON public.market_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_financial_planning_updated_at
  BEFORE UPDATE ON public.financial_planning
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_compliance_data_updated_at
  BEFORE UPDATE ON public.compliance_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add helpful functions for professional tier operations
CREATE OR REPLACE FUNCTION public.get_professional_evaluation_summary(eval_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'evaluation', pe.*,
    'financial_metrics', fm.*,
    'customer_analytics', ca.*,
    'operational_efficiency', oe.*,
    'market_intelligence', mi.*,
    'financial_planning', fp.*,
    'compliance_data', cd.*
  ) INTO result
  FROM public.professional_evaluations pe
  LEFT JOIN public.financial_metrics_extended fm ON pe.id = fm.evaluation_id
  LEFT JOIN public.customer_analytics ca ON pe.id = ca.evaluation_id
  LEFT JOIN public.operational_efficiency oe ON pe.id = oe.evaluation_id
  LEFT JOIN public.market_intelligence mi ON pe.id = mi.evaluation_id
  LEFT JOIN public.financial_planning fp ON pe.id = fp.evaluation_id
  LEFT JOIN public.compliance_data cd ON pe.id = cd.evaluation_id
  WHERE pe.id = eval_id AND pe.user_id = auth.uid();

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate professional tier data completeness
CREATE OR REPLACE FUNCTION public.validate_professional_tier_completeness(eval_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  missing_tables text[] := '{}';
BEGIN
  -- Check which professional tier tables have data
  IF NOT EXISTS (SELECT 1 FROM public.financial_metrics_extended WHERE evaluation_id = eval_id) THEN
    missing_tables := array_append(missing_tables, 'financial_metrics_extended');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.customer_analytics WHERE evaluation_id = eval_id) THEN
    missing_tables := array_append(missing_tables, 'customer_analytics');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.operational_efficiency WHERE evaluation_id = eval_id) THEN
    missing_tables := array_append(missing_tables, 'operational_efficiency');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.market_intelligence WHERE evaluation_id = eval_id) THEN
    missing_tables := array_append(missing_tables, 'market_intelligence');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.financial_planning WHERE evaluation_id = eval_id) THEN
    missing_tables := array_append(missing_tables, 'financial_planning');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.compliance_data WHERE evaluation_id = eval_id) THEN
    missing_tables := array_append(missing_tables, 'compliance_data');
  END IF;

  result := jsonb_build_object(
    'is_complete', array_length(missing_tables, 1) = 0,
    'missing_tables', missing_tables,
    'completion_percentage', (6 - coalesce(array_length(missing_tables, 1), 0)) * 100.0 / 6
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;