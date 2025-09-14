// JSON formatter test helpers and mock data
// CLAUDE.md準拠: No any types、TDD実践

import type { AnalysisResult } from '../../../src/types/metrics';

// Type for JSON.parse output
export interface ParsedAnalysisResult {
  metadata: {
    version: string;
    generated_at: string;
    template_path: string;
    total_resources: number;
    supported_resources: number;
    processing_time_ms: number;
    parse_time_ms?: number;
    extract_time_ms?: number;
    generator_time_ms?: number;
    total_time_ms?: number;
    memory_peak_mb?: number;
  };
  resources: Array<{
    logical_id: string;
    resource_type: string;
    resource_properties: Record<string, unknown>;
    metrics: Array<{
      metric_name: string;
      namespace: string;
      unit: string;
      description: string;
      statistic: string;
      recommended_threshold: { warning: number; critical: number };
      evaluation_period: number;
      category: string;
      importance: string;
      dimensions?: Array<{ name: string; value: string }>;
    }>;
  }>;
  unsupported_resources: string[];
}

export function createMockAnalysisResult(): AnalysisResult {
  return {
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: '/path/to/template.yaml',
      total_resources: 3,
      supported_resources: 2,
      processing_time_ms: 1500,
      parse_time_ms: 100,
      extract_time_ms: 200,
      generator_time_ms: 1000,
      total_time_ms: 1500,
      memory_peak_mb: 125.5
    },
    resources: [
      {
        logical_id: 'MyDatabase',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {
          DBInstanceClass: 'db.t3.medium',
          Engine: 'mysql',
          MasterUserPassword: '[REDACTED]',
          AllocatedStorage: 100
        },
        metrics: [
          {
            metric_name: 'CPUUtilization',
            namespace: 'AWS/RDS',
            unit: 'Percent',
            description: 'The percentage of CPU utilization',
            statistic: 'Average',
            recommended_threshold: { warning: 70, critical: 90 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High',
            dimensions: [
              { name: 'DBInstanceIdentifier', value: 'MyDatabase' }
            ]
          }
        ]
      },
      {
        logical_id: 'MyFunction',
        resource_type: 'AWS::Lambda::Function',
        resource_properties: {
          Runtime: 'nodejs20.x',
          MemorySize: 512,
          Timeout: 30
        },
        metrics: [
          {
            metric_name: 'Errors',
            namespace: 'AWS/Lambda',
            unit: 'Count',
            description: 'The number of errors',
            statistic: 'Sum',
            recommended_threshold: { warning: 5, critical: 10 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High',
            dimensions: [
              { name: 'FunctionName', value: 'MyFunction' }
            ]
          },
          {
            metric_name: 'Duration',
            namespace: 'AWS/Lambda',
            unit: 'Milliseconds',
            description: 'Function execution duration',
            statistic: 'Average',
            recommended_threshold: { warning: 3000, critical: 5000 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'Medium',
            dimensions: [
              { name: 'FunctionName', value: 'MyFunction' }
            ]
          }
        ]
      }
    ],
    unsupported_resources: ['S3Bucket1']
  };
}