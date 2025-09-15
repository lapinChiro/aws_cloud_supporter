// JsonSchemaValidator テストヘルパー
// CLAUDE.md準拠: No any types、TDD実践

import type { AnalysisResultSchema } from '../../../src/utils/schema-validator';

// テスト用の柔軟な型定義 - 無効なデータを作成するため
type TestData = Record<string, unknown>;

export function createValidAnalysisResult(): AnalysisResultSchema {
  return {
    metadata: {
      version: '1.0.0',
      generated_at: '2025-09-08T12:00:00.000Z',
      template_path: '/test/template.yaml',
      total_resources: 10,
      supported_resources: 6,
      processing_time_ms: 1500
    },
    resources: [
      {
        logical_id: 'TestDB',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {
          DBInstanceClass: 'db.t3.micro',
          Engine: 'mysql'
        },
        metrics: [
          {
            metric_name: 'CPUUtilization',
            namespace: 'AWS/RDS',
            unit: 'Percent',
            description: 'データベースインスタンスのCPU使用率',
            statistic: 'Average',
            recommended_threshold: {
              warning: 70,
              critical: 90
            },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High',
            dimensions: [
              { name: 'DBInstanceIdentifier', value: 'TestDB' }
            ]
          }
        ]
      }
    ],
    unsupported_resources: ['UnsupportedResource1', 'UnsupportedResource2']
  };
}

export function createResultWithMissingMetadata(): TestData {
  const result = createValidAnalysisResult() as unknown as TestData;
  // Remove version to cause validation error
  const metadata = result.metadata as Record<string, unknown>;
  delete metadata.version;
  return result;
}

export function createResultWithInvalidTypes(): TestData {
  const result = createValidAnalysisResult() as unknown as TestData;
  // Make total_resources a string instead of number
  const metadata = result.metadata as Record<string, unknown>;
  metadata.total_resources = 'not-a-number';
  return result;
}

export function createResultWithInvalidCategory(): TestData {
  const result = createValidAnalysisResult() as unknown as TestData;
  // Set invalid category
  const resources = result.resources as Array<Record<string, unknown>>;
  const firstResource = resources[0];
  if (firstResource) {
    const metrics = firstResource.metrics as Array<Record<string, unknown>>;
    const firstMetric = metrics[0];
    if (firstMetric) {
      firstMetric.category = 'InvalidCategory';
    }
  }
  return result;
}

export function createResultWithInvalidImportance(): TestData {
  const result = createValidAnalysisResult() as unknown as TestData;
  // Set invalid importance
  const resources = result.resources as Array<Record<string, unknown>>;
  const firstResource = resources[0];
  if (firstResource) {
    const metrics = firstResource.metrics as Array<Record<string, unknown>>;
    const firstMetric = metrics[0];
    if (firstMetric) {
      firstMetric.importance = 'InvalidImportance';
    }
  }
  return result;
}

export function createResultWithInvalidThreshold(): TestData {
  const result = createValidAnalysisResult() as unknown as TestData;
  // Set invalid threshold structure
  const resources = result.resources as Array<Record<string, unknown>>;
  const firstResource = resources[0];
  if (firstResource) {
    const metrics = firstResource.metrics as Array<Record<string, unknown>>;
    const firstMetric = metrics[0];
    if (firstMetric) {
      firstMetric.recommended_threshold = {
        warning: 'not-a-number',
        critical: 90
      };
    }
  }
  return result;
}

export function createResultWithInvalidDimensions(): TestData {
  const result = createValidAnalysisResult() as unknown as TestData;
  // Set invalid dimensions
  const resources = result.resources as Array<Record<string, unknown>>;
  const firstResource = resources[0];
  if (firstResource) {
    const metrics = firstResource.metrics as Array<Record<string, unknown>>;
    const firstMetric = metrics[0];
    if (firstMetric) {
      firstMetric.dimensions = [
        { name: 123, value: 'TestDB' }
      ];
    }
  }
  return result;
}

export function createResultWithInvalidUnsupportedResources(): TestData {
  const result = createValidAnalysisResult() as unknown as TestData;
  // Set invalid unsupported_resources
  result.unsupported_resources = [123, 456];
  return result;
}