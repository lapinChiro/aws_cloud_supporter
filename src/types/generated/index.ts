// Generated code types for CDK and other outputs

export interface GeneratedCodeResult {
  code: string;
  language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp';
  framework: 'cdk' | 'terraform' | 'pulumi' | 'cloudformation';
  metadata: GeneratedCodeMetadata;
}

export interface GeneratedCodeMetadata {
  generatedAt: Date;
  generator: string;
  version: string;
  sourceTemplate?: string;
  options?: Record<string, unknown>;
}

// CDK-specific generated types
export interface CDKGeneratedCode extends GeneratedCodeResult {
  framework: 'cdk';
  stackClass: string;
  imports: string[];
  constructs: CDKConstruct[];
}

export interface CDKConstruct {
  id: string;
  type: string;
  props: Record<string, unknown>;
  dependencies?: string[];
}

// Template data for handlebars
export interface CDKTemplateData {
  imports: Array<{
    module: string;
    items: string[];
  }>;
  stackName: string;
  resources: Array<{
    constructId: string;
    constructType: string;
    props: string;
    resourceType: string;
  }>;
  hasLambda?: boolean;
  hasRDS?: boolean;
  hasDynamoDB?: boolean;
  hasECS?: boolean;
  hasALB?: boolean;
  hasApiGateway?: boolean;
}

// Metric generation types
export interface GeneratedMetric {
  name: string;
  namespace: string;
  dimensions: Record<string, string>;
  statistic: string;
  period: number;
  unit?: string;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface MetricGenerationResult {
  metrics: GeneratedMetric[];
  alarms: GeneratedAlarm[];
  dashboard?: GeneratedDashboard;
}

export interface GeneratedAlarm {
  name: string;
  metricName: string;
  threshold: number;
  comparisonOperator: string;
  evaluationPeriods: number;
  treatMissingData?: string;
  actionsEnabled?: boolean;
}

export interface GeneratedDashboard {
  name: string;
  widgets: DashboardWidget[];
  periodOverride?: string;
}

export interface DashboardWidget {
  type: 'metric' | 'text' | 'log';
  properties: Record<string, unknown>;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

// Test helper types
export interface TestGenerationOptions {
  mockData?: boolean;
  includeEdgeCases?: boolean;
  coverage?: 'minimal' | 'standard' | 'comprehensive';
}

export interface GeneratedTestCase {
  name: string;
  description?: string;
  input: unknown;
  expectedOutput: unknown;
  assertions?: string[];
}

// Export aggregated types
export * from '../aws/cloudformation';
export * from '../internal/parser';

// Type guards
export function isCDKGeneratedCode(result: GeneratedCodeResult): result is CDKGeneratedCode {
  return result.framework === 'cdk';
}

export function hasGeneratedMetrics(result: unknown): result is { metrics: GeneratedMetric[] } {
  return typeof result === 'object' && 
         result !== null && 
         'metrics' in result && 
         Array.isArray((result as { metrics: unknown }).metrics);
}