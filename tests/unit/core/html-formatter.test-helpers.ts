// HTMLOutputFormatter テストヘルパー
// CLAUDE.md準拠: No any types、TDD実践

import type { AnalysisResult } from '../../../src/types/metrics';

export function createMockAnalysisResult(): AnalysisResult {
  return {
    metadata: {
      version: '1.0.0',
      generated_at: '2024-01-01T00:00:00Z',
      template_path: '/path/to/template.yaml',
      total_resources: 2,
      supported_resources: 2,
      processing_time_ms: 1234,
      parse_time_ms: 100,
      extract_time_ms: 200,
      generator_time_ms: 900,
      total_time_ms: 1234,
      memory_peak_mb: 100
    },
    resources: [
      {
        logical_id: 'MyDatabase',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {
          DBInstanceClass: 'db.t3.medium',
          Engine: 'mysql',
          MasterUserPassword: '[REDACTED]'
        },
        metrics: [
          {
            metric_name: 'CPUUtilization',
            namespace: 'AWS/RDS',
            unit: 'Percent',
            description: 'CPU使用率',
            statistic: 'Average',
            recommended_threshold: { warning: 70, critical: 90 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High',
            dimensions: [{ name: 'DBInstanceIdentifier', value: 'MyDatabase' }]
          },
          {
            metric_name: 'DatabaseConnections',
            namespace: 'AWS/RDS',
            unit: 'Count',
            description: 'データベース接続数',
            statistic: 'Average',
            recommended_threshold: { warning: 100, critical: 200 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'Medium',
            dimensions: [{ name: 'DBInstanceIdentifier', value: 'MyDatabase' }]
          }
        ]
      },
      {
        logical_id: 'MyFunction',
        resource_type: 'AWS::Lambda::Function',
        resource_properties: {
          Runtime: 'nodejs18.x'
        },
        metrics: [
          {
            metric_name: 'Duration',
            namespace: 'AWS/Lambda',
            unit: 'Milliseconds',
            description: '実行時間',
            statistic: 'Average',
            recommended_threshold: { warning: 1000, critical: 3000 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High',
            dimensions: [{ name: 'FunctionName', value: 'MyFunction' }]
          }
        ]
      }
    ],
    unsupported_resources: ['UnsupportedResource1', 'UnsupportedResource2']
  };
}

export function createEmptyAnalysisResult(): AnalysisResult {
  return {
    metadata: {
      version: '1.0.0',
      generated_at: '2024-01-01T00:00:00Z',
      template_path: '/path/to/empty.yaml',
      total_resources: 0,
      supported_resources: 0,
      processing_time_ms: 10,
      parse_time_ms: 5,
      extract_time_ms: 2,
      generator_time_ms: 3,
      total_time_ms: 10,
      memory_peak_mb: 20
    },
    resources: [],
    unsupported_resources: []
  };
}

export function createLargeAnalysisResult(resourceCount: number = 100): AnalysisResult {
  const resources = Array.from({ length: resourceCount }, (_, i) => ({
    logical_id: `Resource${i}`,
    resource_type: 'AWS::Lambda::Function' as const,
    resource_properties: {},
    metrics: Array.from({ length: 20 }, (_never, metricIndex) => ({
      metric_name: `Metric${metricIndex}`,
      namespace: 'AWS/Lambda',
      unit: 'Count',
      description: 'Test metric',
      statistic: 'Sum' as const,
      recommended_threshold: { warning: 5, critical: 10 },
      evaluation_period: 300 as const,
      category: 'Performance' as const,
      importance: 'High' as const,
      dimensions: [] as Array<{ name: string; value: string }>
    }))
  }));

  return {
    metadata: {
      version: '1.0.0',
      generated_at: '2024-01-01T00:00:00Z',
      template_path: '/path/to/large.yaml',
      total_resources: resourceCount,
      supported_resources: resourceCount,
      processing_time_ms: 5000,
      parse_time_ms: 500,
      extract_time_ms: 1000,
      generator_time_ms: 3500,
      total_time_ms: 5000,
      memory_peak_mb: 500
    },
    resources,
    unsupported_resources: []
  };
}

export function createResultWithUnsupportedResources(): AnalysisResult {
  const mockResult = createMockAnalysisResult();
  mockResult.unsupported_resources = ['UnsupportedVPC', 'UnsupportedBucket'];
  mockResult.metadata.total_resources = 4;
  mockResult.metadata.supported_resources = 2;
  
  return mockResult;
}