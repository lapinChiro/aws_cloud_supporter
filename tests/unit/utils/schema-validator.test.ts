import type { ValidationError } from '../../../src/utils/schema-validator';
import { JsonSchemaValidator, validateJsonSchema } from '../../../src/utils/schema-validator';

describe('JsonSchemaValidator', () => {
  let validator: JsonSchemaValidator;

  beforeEach(() => {
    validator = new JsonSchemaValidator();
  });

  describe('validateAnalysisResult', () => {
    it('should validate a correct analysis result', () => {
      const validResult = {
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
        unsupported_resources: ['UnsupportedResource1']
      };

      const errors = validator.validateAnalysisResult(validResult);
      expect(errors).toEqual([]);
    });

    it('should detect missing metadata fields', () => {
      const invalidResult = {
        metadata: {
          version: '1.0.0'
          // missing required fields
        },
        resources: [],
        unsupported_resources: []
      };

      const errors = validator.validateAnalysisResult(invalidResult);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.path === 'metadata.generated_at')).toBe(true);
      expect(errors.some(e => e.path === 'metadata.template_path')).toBe(true);
      expect(errors.some(e => e.path === 'metadata.total_resources')).toBe(true);
      expect(errors.some(e => e.path === 'metadata.supported_resources')).toBe(true);
    });

    it('should detect invalid metadata types', () => {
      const invalidResult = {
        metadata: {
          version: 123, // should be string
          generated_at: 'invalid-date',
          template_path: null,
          total_resources: 'ten', // should be number
          supported_resources: -1 // should be non-negative
        },
        resources: [],
        unsupported_resources: []
      };

      const errors = validator.validateAnalysisResult(invalidResult);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.path === 'metadata.version' && e.message.includes('string'))).toBe(true);
      expect(errors.some(e => e.path === 'metadata.generated_at' && e.message.includes('ISO-8601'))).toBe(true);
      expect(errors.some(e => e.path === 'metadata.total_resources' && e.message.includes('integer'))).toBe(true);
      expect(errors.some(e => e.path === 'metadata.supported_resources' && e.message.includes('integer'))).toBe(true);
    });

    it('should validate metric category values', () => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: '2025-09-08T12:00:00.000Z',
          template_path: '/test/template.yaml',
          total_resources: 1,
          supported_resources: 1
        },
        resources: [
          {
            logical_id: 'TestResource',
            resource_type: 'AWS::RDS::DBInstance',
            resource_properties: {},
            metrics: [
              {
                metric_name: 'TestMetric',
                namespace: 'AWS/RDS',
                unit: 'Count',
                description: 'Test metric',
                statistic: 'Average',
                recommended_threshold: {
                  warning: 10,
                  critical: 20
                },
                evaluation_period: 300,
                category: 'InvalidCategory', // should be Performance|Error|Saturation|Latency
                importance: 'High'
              }
            ]
          }
        ],
        unsupported_resources: []
      };

      const errors = validator.validateAnalysisResult(invalidResult);
      expect(errors.some(e => e.path.includes('category') && e.message.includes('Performance, Error, Saturation, Latency'))).toBe(true);
    });

    it('should validate importance values', () => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: '2025-09-08T12:00:00.000Z',
          template_path: '/test/template.yaml',
          total_resources: 1,
          supported_resources: 1
        },
        resources: [
          {
            logical_id: 'TestResource',
            resource_type: 'AWS::RDS::DBInstance',
            resource_properties: {},
            metrics: [
              {
                metric_name: 'TestMetric',
                namespace: 'AWS/RDS',
                unit: 'Count',
                description: 'Test metric',
                statistic: 'Average',
                recommended_threshold: {
                  warning: 10,
                  critical: 20
                },
                evaluation_period: 300,
                category: 'Performance',
                importance: 'Critical' // should be High|Medium|Low
              }
            ]
          }
        ],
        unsupported_resources: []
      };

      const errors = validator.validateAnalysisResult(invalidResult);
      expect(errors.some(e => e.path.includes('importance') && e.message.includes('High, Medium, Low'))).toBe(true);
    });

    it('should validate threshold structure', () => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: '2025-09-08T12:00:00.000Z',
          template_path: '/test/template.yaml',
          total_resources: 1,
          supported_resources: 1
        },
        resources: [
          {
            logical_id: 'TestResource',
            resource_type: 'AWS::RDS::DBInstance',
            resource_properties: {},
            metrics: [
              {
                metric_name: 'TestMetric',
                namespace: 'AWS/RDS',
                unit: 'Count',
                description: 'Test metric',
                statistic: 'Average',
                recommended_threshold: {
                  warning: '10', // should be number
                  // missing critical
                },
                evaluation_period: 300,
                category: 'Performance',
                importance: 'High'
              }
            ]
          }
        ],
        unsupported_resources: []
      };

      const errors = validator.validateAnalysisResult(invalidResult);
      expect(errors.some(e => e.path.includes('recommended_threshold.warning') && e.message.includes('number'))).toBe(true);
      expect(errors.some(e => e.path.includes('recommended_threshold.critical') && e.message.includes('missing'))).toBe(true);
    });

    it('should validate dimensions array', () => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: '2025-09-08T12:00:00.000Z',
          template_path: '/test/template.yaml',
          total_resources: 1,
          supported_resources: 1
        },
        resources: [
          {
            logical_id: 'TestResource',
            resource_type: 'AWS::RDS::DBInstance',
            resource_properties: {},
            metrics: [
              {
                metric_name: 'TestMetric',
                namespace: 'AWS/RDS',
                unit: 'Count',
                description: 'Test metric',
                statistic: 'Average',
                recommended_threshold: {
                  warning: 10,
                  critical: 20
                },
                evaluation_period: 300,
                category: 'Performance',
                importance: 'High',
                dimensions: [
                  {
                    name: 'TestDimension',
                    // missing value
                  },
                  {
                    name: 123, // should be string
                    value: 'TestValue'
                  }
                ]
              }
            ]
          }
        ],
        unsupported_resources: []
      };

      const errors = validator.validateAnalysisResult(invalidResult);
      expect(errors.some(e => e.path.includes('dimensions[0].value') && e.message.includes('missing'))).toBe(true);
      expect(errors.some(e => e.path.includes('dimensions[1].name') && e.message.includes('string'))).toBe(true);
    });

    it('should validate unsupported_resources as string array', () => {
      const invalidResult = {
        metadata: {
          version: '1.0.0',
          generated_at: '2025-09-08T12:00:00.000Z',
          template_path: '/test/template.yaml',
          total_resources: 1,
          supported_resources: 0
        },
        resources: [],
        unsupported_resources: [
          'ValidString',
          123, // should be string
          null // should be string
        ]
      };

      const errors = validator.validateAnalysisResult(invalidResult);
      expect(errors.some(e => e.path === 'unsupported_resources[1]' && e.message.includes('string'))).toBe(true);
      expect(errors.some(e => e.path === 'unsupported_resources[2]' && e.message.includes('string'))).toBe(true);
    });

    it('should handle non-object input', () => {
      const errors = validator.validateAnalysisResult('invalid');
      expect(errors).toEqual([{
        path: 'root',
        message: 'Root must be an object',
        value: 'invalid'
      }]);
    });

    it('should handle null input', () => {
      const errors = validator.validateAnalysisResult(null);
      expect(errors).toEqual([{
        path: 'root',
        message: 'Root must be an object',
        value: null
      }]);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format errors correctly', () => {
      const errors: ValidationError[] = [
        { path: 'metadata.version', message: 'must be string', value: 123 },
        { path: 'resources[0].logical_id', message: 'is required', value: undefined }
      ];

      const formatted = validator.formatValidationErrors(errors);
      expect(formatted).toContain('metadata.version: must be string (received: 123)');
      expect(formatted).toContain('resources[0].logical_id: is required (received: undefined)');
    });

    it('should handle empty errors array', () => {
      const formatted = validator.formatValidationErrors([]);
      expect(formatted).toBe('No validation errors');
    });
  });

  describe('getValidationSummary', () => {
    it('should categorize errors correctly', () => {
      const errors: ValidationError[] = [
        { path: 'metadata.version', message: 'error1', value: null },
        { path: 'metadata.total_resources', message: 'error2', value: null },
        { path: 'resources[0].logical_id', message: 'error3', value: null },
        { path: 'unsupported_resources[1]', message: 'error4', value: null }
      ];

      const summary = validator.getValidationSummary(errors);
      expect(summary.isValid).toBe(false);
      expect(summary.errorCount).toBe(4);
      expect(summary.categories).toEqual({
        metadata: 2,
        resources: 1,
        unsupported_resources: 1
      });
    });

    it('should handle valid case', () => {
      const summary = validator.getValidationSummary([]);
      expect(summary.isValid).toBe(true);
      expect(summary.errorCount).toBe(0);
      expect(summary.categories).toEqual({});
    });
  });

  describe('validateJsonSchema helper', () => {
    it('should return validation result', () => {
      const validResult = {
        metadata: {
          version: '1.0.0',
          generated_at: '2025-09-08T12:00:00.000Z',
          template_path: '/test/template.yaml',
          total_resources: 1,
          supported_resources: 1
        },
        resources: [],
        unsupported_resources: []
      };

      const result = validateJsonSchema(validResult);
      expect(result.isValid).toBe(true);
      expect(result.summary).toBe('✅ JSON Schema validation passed');
    });

    it('should return validation errors', () => {
      const invalidResult = { invalid: 'data' };

      const result = validateJsonSchema(invalidResult);
      expect(result.isValid).toBe(false);
      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('validation errors found');
    });
  });
});