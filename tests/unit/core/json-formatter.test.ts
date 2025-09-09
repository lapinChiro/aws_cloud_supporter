// JSONOutputFormatter単体テスト
// CLAUDE.md準拠: No any types、TDD実践

import { JSONOutputFormatter } from '../../../src/core/json-formatter';
import { AnalysisResult } from '../../../src/types/metrics';
import { validateMetricsOutput } from '../../../src/utils/schema-validator';

// Mock schema validator
jest.mock('../../../src/utils/schema-validator');
const mockValidateMetricsOutput = validateMetricsOutput as jest.MockedFunction<typeof validateMetricsOutput>;

describe('JSONOutputFormatter', () => {
  let formatter: JSONOutputFormatter;
  let mockResult: AnalysisResult;

  beforeEach(() => {
    formatter = new JSONOutputFormatter();
    jest.clearAllMocks();
    
    // Default: validation passes
    mockValidateMetricsOutput.mockReturnValue({ valid: true, errors: [] });
    
    // Mock analysis result
    mockResult = {
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
              description: 'The number of invocations that result in a function error',
              statistic: 'Sum',
              recommended_threshold: { warning: 5, critical: 10 },
              evaluation_period: 300,
              category: 'Error',
              importance: 'High',
              dimensions: [
                { name: 'FunctionName', value: 'MyFunction' }
              ]
            },
            {
              metric_name: 'Duration',
              namespace: 'AWS/Lambda',
              unit: 'Milliseconds',
              description: 'The amount of time your function code spends processing an event',
              statistic: 'Average',
              recommended_threshold: { warning: 1000, critical: 3000 },
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
  });

  describe('formatJSON', () => {
    test('should generate valid JSON output', async () => {
      const json = await formatter.formatJSON(mockResult);
      
      // Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();
      
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });

    test('should include all required metadata fields', async () => {
      const json = await formatter.formatJSON(mockResult);
      const parsed = JSON.parse(json);
      
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.version).toBe('1.0.0');
      expect(parsed.metadata.generated_at).toBeDefined();
      expect(parsed.metadata.template_path).toBe('/path/to/template.yaml');
      expect(parsed.metadata.total_resources).toBe(3);
      expect(parsed.metadata.supported_resources).toBe(2);
      expect(parsed.metadata.processing_time_ms).toBe(1500);
    });

    test('should include all resources with metrics', async () => {
      const json = await formatter.formatJSON(mockResult);
      const parsed = JSON.parse(json);
      
      expect(parsed.resources).toHaveLength(2);
      
      // First resource
      expect(parsed.resources[0].logical_id).toBe('MyDatabase');
      expect(parsed.resources[0].resource_type).toBe('AWS::RDS::DBInstance');
      expect(parsed.resources[0].metrics).toHaveLength(1);
      
      // Second resource
      expect(parsed.resources[1].logical_id).toBe('MyFunction');
      expect(parsed.resources[1].resource_type).toBe('AWS::Lambda::Function');
      expect(parsed.resources[1].metrics).toHaveLength(2);
    });

    test('should format metrics correctly', async () => {
      const json = await formatter.formatJSON(mockResult);
      const parsed = JSON.parse(json);
      
      const metric = parsed.resources[0].metrics[0];
      expect(metric.metric_name).toBe('CPUUtilization');
      expect(metric.namespace).toBe('AWS/RDS');
      expect(metric.unit).toBe('Percent');
      expect(metric.description).toBeDefined();
      expect(metric.statistic).toBe('Average');
      expect(metric.recommended_threshold.warning).toBe(70);
      expect(metric.recommended_threshold.critical).toBe(90);
      expect(metric.evaluation_period).toBe(300);
      expect(metric.category).toBe('Performance');
      expect(metric.importance).toBe('High');
    });

    test('should include unsupported resources', async () => {
      const json = await formatter.formatJSON(mockResult);
      const parsed = JSON.parse(json);
      
      expect(parsed.unsupported_resources).toBeDefined();
      expect(parsed.unsupported_resources).toContain('S3Bucket1');
    });

    test('should handle empty results', async () => {
      const emptyResult: AnalysisResult = {
        ...mockResult,
        resources: [],
        unsupported_resources: []
      };
      
      const json = await formatter.formatJSON(emptyResult);
      const parsed = JSON.parse(json);
      
      expect(parsed.resources).toEqual([]);
      expect(parsed.unsupported_resources).toEqual([]);
    });

    test('should validate output against schema', async () => {
      await formatter.formatJSON(mockResult);
      
      expect(mockValidateMetricsOutput).toHaveBeenCalledTimes(1);
      expect(mockValidateMetricsOutput).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should throw error if validation fails', async () => {
      mockValidateMetricsOutput.mockReturnValue({
        valid: false,
        errors: ['Invalid metric structure', 'Missing required field']
      });
      
      await expect(formatter.formatJSON(mockResult)).rejects.toThrow(
        'JSON output validation failed: Invalid metric structure; Missing required field'
      );
    });

    test('should pretty print JSON with 2 space indentation', async () => {
      const json = await formatter.formatJSON(mockResult);
      
      // Check for proper indentation
      expect(json).toContain('\n  "metadata"');
      expect(json).toContain('\n    "version"');
      expect(json).not.toContain('\t'); // No tabs
    });

    test('should handle metrics without dimensions', async () => {
      const resultNoDims: AnalysisResult = {
        ...mockResult,
        resources: [{
          logical_id: 'Test',
          resource_type: 'AWS::Lambda::Function',
          resource_properties: {},
          metrics: [{
            metric_name: 'TestMetric',
            namespace: 'AWS/Lambda',
            unit: 'Count',
            description: 'Test metric',
            statistic: 'Sum',
            recommended_threshold: { warning: 1, critical: 2 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High'
          }]
        }]
      };
      
      const json = await formatter.formatJSON(resultNoDims);
      const parsed = JSON.parse(json);
      
      const metric = parsed.resources[0].metrics[0];
      expect(metric.dimensions).toBeUndefined();
    });

    test('should sanitize sensitive properties', async () => {
      const resultWithSecrets: AnalysisResult = {
        ...mockResult,
        resources: [{
          logical_id: 'DB',
          resource_type: 'AWS::RDS::DBInstance',
          resource_properties: {
            DBInstanceClass: 'db.t3.medium',
            MasterUserPassword: 'actual-password',
            DBPassword: 'another-password',
            SecretString: 'secret-value'
          },
          metrics: []
        }]
      };
      
      const json = await formatter.formatJSON(resultWithSecrets);
      const parsed = JSON.parse(json);
      
      const props = parsed.resources[0].resource_properties;
      expect(props.MasterUserPassword).toBe('[REDACTED]');
      expect(props.DBPassword).toBe('[REDACTED]');
      expect(props.SecretString).toBe('[REDACTED]');
      expect(props.DBInstanceClass).toBe('db.t3.medium');
    });

    test('should preserve resource property types', async () => {
      const resultWithTypes: AnalysisResult = {
        ...mockResult,
        resources: [{
          logical_id: 'Mixed',
          resource_type: 'AWS::DynamoDB::Table',
          resource_properties: {
            TableName: 'MyTable',
            BillingMode: 'PAY_PER_REQUEST',
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            },
            Tags: [
              { Key: 'Environment', Value: 'Production' }
            ],
            StreamEnabled: true,
            PointInTimeRecoveryEnabled: false
          },
          metrics: []
        }]
      };
      
      const json = await formatter.formatJSON(resultWithTypes);
      const parsed = JSON.parse(json);
      
      const props = parsed.resources[0].resource_properties;
      expect(typeof props.TableName).toBe('string');
      expect(typeof props.StreamEnabled).toBe('boolean');
      expect(props.StreamEnabled).toBe(true);
      expect(props.PointInTimeRecoveryEnabled).toBe(false);
      expect(Array.isArray(props.Tags)).toBe(true);
      expect(typeof props.ProvisionedThroughput).toBe('object');
    });

    test('should handle large outputs efficiently', async () => {
      const largeResult: AnalysisResult = {
        ...mockResult,
        resources: Array(500).fill(null).map((_, i) => ({
          logical_id: `Resource${i}`,
          resource_type: 'AWS::Lambda::Function',
          resource_properties: {
            Runtime: 'nodejs20.x',
            MemorySize: 512,
            Timeout: 30,
            Environment: {
              Variables: Object.fromEntries(
                Array(10).fill(null).map((_, j) => [`VAR_${j}`, `value_${j}`])
              )
            }
          },
          metrics: Array(20).fill(null).map((_, j) => ({
            metric_name: `Metric${j}`,
            namespace: 'AWS/Lambda',
            unit: 'Count',
            description: `Description for metric ${j}`,
            statistic: 'Sum',
            recommended_threshold: { warning: 5, critical: 10 },
            evaluation_period: 300,
            category: 'Performance',
            importance: 'High',
            dimensions: [
              { name: 'FunctionName', value: `Resource${i}` }
            ]
          }))
        }))
      };
      
      const startTime = Date.now();
      const json = await formatter.formatJSON(largeResult);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // 2 seconds max
      expect(json.length).toBeGreaterThan(1000000); // Should be > 1MB
      
      // Should still be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();
    });

    test('should maintain consistent output order', async () => {
      // Run formatter twice with same input
      const json1 = await formatter.formatJSON(mockResult);
      const json2 = await formatter.formatJSON(mockResult);
      
      // Should produce identical output
      expect(json1).toBe(json2);
    });
  });
});