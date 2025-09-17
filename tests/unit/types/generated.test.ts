// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// Generated typesのtype guardsテスト

import {
  isCDKGeneratedCode,
  hasGeneratedMetrics,
  type GeneratedCodeResult,
  type CDKGeneratedCode,
  type GeneratedMetric,
  type CDKConstruct
} from '../../../src/types/generated';

describe('Generated Types - Type Guards', () => {
  describe('isCDKGeneratedCode', () => {
    it('should return true for valid CDK generated code', () => {
      const validCDKCode: CDKGeneratedCode = {
        code: 'export class MyStack {}',
        language: 'typescript',
        framework: 'cdk',
        metadata: {
          generatedAt: new Date(),
          generator: 'test-generator',
          version: '1.0.0'
        },
        stackClass: 'MyStack',
        imports: ['aws-cdk-lib'],
        constructs: []
      };

      expect(isCDKGeneratedCode(validCDKCode)).toBe(true);
    });

    it('should return false for non-CDK framework', () => {
      const terraformCode: GeneratedCodeResult = {
        code: 'resource "aws_instance" "example" {}',
        language: 'typescript',
        framework: 'terraform',
        metadata: {
          generatedAt: new Date(),
          generator: 'test-generator',
          version: '1.0.0'
        }
      };

      expect(isCDKGeneratedCode(terraformCode)).toBe(false);
    });

    it('should return false for pulumi framework', () => {
      const pulumiCode: GeneratedCodeResult = {
        code: 'const bucket = new aws.s3.Bucket("bucket");',
        language: 'typescript',
        framework: 'pulumi',
        metadata: {
          generatedAt: new Date(),
          generator: 'test-generator',
          version: '1.0.0'
        }
      };

      expect(isCDKGeneratedCode(pulumiCode)).toBe(false);
    });

    it('should return false for cloudformation framework', () => {
      const cfnCode: GeneratedCodeResult = {
        code: 'AWSTemplateFormatVersion: "2010-09-09"',
        language: 'javascript',
        framework: 'cloudformation',
        metadata: {
          generatedAt: new Date(),
          generator: 'test-generator',
          version: '1.0.0'
        }
      };

      expect(isCDKGeneratedCode(cfnCode)).toBe(false);
    });
  });

  describe('hasGeneratedMetrics', () => {
    it('should return true for object with metrics array', () => {
      const validResult = {
        metrics: [
          {
            name: 'CPUUtilization',
            namespace: 'AWS/Lambda',
            dimensions: { FunctionName: 'MyFunction' },
            statistic: 'Average',
            period: 300
          }
        ]
      };

      expect(hasGeneratedMetrics(validResult)).toBe(true);
    });

    it('should return true for empty metrics array', () => {
      const emptyMetrics = {
        metrics: []
      };

      expect(hasGeneratedMetrics(emptyMetrics)).toBe(true);
    });

    it('should return false for null', () => {
      expect(hasGeneratedMetrics(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasGeneratedMetrics(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(hasGeneratedMetrics('not an object')).toBe(false);
    });

    it('should return false for number', () => {
      expect(hasGeneratedMetrics(123)).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(hasGeneratedMetrics(true)).toBe(false);
    });

    it('should return false for object without metrics property', () => {
      const noMetrics = {
        alarms: [],
        dashboard: {}
      };

      expect(hasGeneratedMetrics(noMetrics)).toBe(false);
    });

    it('should return false for object with non-array metrics', () => {
      const invalidMetrics = {
        metrics: 'not an array'
      };

      expect(hasGeneratedMetrics(invalidMetrics)).toBe(false);
    });

    it('should return false for object with null metrics', () => {
      const nullMetrics = {
        metrics: null
      };

      expect(hasGeneratedMetrics(nullMetrics)).toBe(false);
    });

    it('should return false for object with undefined metrics', () => {
      const undefinedMetrics = {
        metrics: undefined
      };

      expect(hasGeneratedMetrics(undefinedMetrics)).toBe(false);
    });

    it('should handle complex valid metric structure', () => {
      const complexResult = {
        metrics: [
          {
            name: 'CPUUtilization',
            namespace: 'AWS/ECS',
            dimensions: {
              ServiceName: 'my-service',
              ClusterName: 'my-cluster'
            },
            statistic: 'Average',
            period: 300,
            unit: 'Percent',
            threshold: {
              warning: 70,
              critical: 90
            }
          } satisfies GeneratedMetric
        ],
        alarms: [],
        dashboard: {
          name: 'MyDashboard',
          widgets: []
        }
      };

      expect(hasGeneratedMetrics(complexResult)).toBe(true);
    });
  });

  describe('Type Validation for CDK Constructs', () => {
    it('should handle CDK construct with dependencies', () => {
      const construct: CDKConstruct = {
        id: 'MyAlarm',
        type: 'cloudwatch.Alarm',
        props: {
          metric: {},
          threshold: 80
        },
        dependencies: ['MyTopic', 'MyFunction']
      };

      const cdkCode: CDKGeneratedCode = {
        code: 'export class MyStack {}',
        language: 'typescript',
        framework: 'cdk',
        metadata: {
          generatedAt: new Date(),
          generator: 'test-generator',
          version: '1.0.0'
        },
        stackClass: 'MyStack',
        imports: ['aws-cdk-lib'],
        constructs: [construct]
      };

      expect(isCDKGeneratedCode(cdkCode)).toBe(true);
      expect(cdkCode.constructs[0]?.dependencies).toHaveLength(2);
    });

    it('should handle CDK code with metadata options', () => {
      const cdkCode: CDKGeneratedCode = {
        code: 'export class MyStack {}',
        language: 'typescript',
        framework: 'cdk',
        metadata: {
          generatedAt: new Date(),
          generator: 'test-generator',
          version: '1.0.0',
          sourceTemplate: 'template.yaml',
          options: {
            includeComments: true,
            useTypeScript: true,
            targetVersion: '2.0.0'
          }
        },
        stackClass: 'MyStack',
        imports: [],
        constructs: []
      };

      expect(isCDKGeneratedCode(cdkCode)).toBe(true);
      expect(cdkCode.metadata.options).toBeDefined();
      expect(cdkCode.metadata.sourceTemplate).toBe('template.yaml');
    });
  });
});