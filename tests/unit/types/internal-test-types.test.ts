// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// Internal test typesのtype guardsとfactory関数テスト

import {
  isMockResource,
  isExtendedAnalysisResult,
  defaultMockResource,
  defaultMockAnalysis,
  type MockResource,
  type ExtendedAnalysisResult
} from '../../../src/types/internal/test-types';

describe('Internal Test Types', () => {
  describe('isMockResource', () => {
    it('should return true for valid mock resource', () => {
      const validResource: MockResource = {
        resource_type: 'AWS::Lambda::Function',
        logical_id: 'MyFunction',
        resource_name: 'my-function',
        properties: {
          Runtime: 'nodejs18.x'
        }
      };

      expect(isMockResource(validResource)).toBe(true);
    });

    it('should return true for minimal mock resource', () => {
      const minimalResource = {
        resource_type: 'AWS::S3::Bucket',
        logical_id: 'MyBucket'
      };

      expect(isMockResource(minimalResource)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isMockResource(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isMockResource(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isMockResource('not a resource')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isMockResource(123)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isMockResource([])).toBe(false);
    });

    it('should return false for object missing resource_type', () => {
      const missingType = {
        logical_id: 'MyResource',
        properties: {}
      };

      expect(isMockResource(missingType)).toBe(false);
    });

    it('should return false for object missing logical_id', () => {
      const missingId = {
        resource_type: 'AWS::Lambda::Function',
        properties: {}
      };

      expect(isMockResource(missingId)).toBe(false);
    });
  });

  describe('isExtendedAnalysisResult', () => {
    it('should return true for valid extended analysis result', () => {
      const validResult: ExtendedAnalysisResult = {
        resources: [],
        metadata: {
          template_path: 'test.yaml',
          analysis_version: '1.0.0',
          timestamp: '2023-12-01T00:00:00.000Z'
        },
        testMetadata: {
          testName: 'unit test',
          testCase: 'validation',
          mockData: true
        }
      };

      expect(isExtendedAnalysisResult(validResult)).toBe(true);
    });

    it('should return true without test metadata', () => {
      const withoutTestMeta = {
        resources: [],
        metadata: {
          template_path: 'test.yaml'
        }
      };

      expect(isExtendedAnalysisResult(withoutTestMeta)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isExtendedAnalysisResult(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isExtendedAnalysisResult(undefined)).toBe(false);
    });

    it('should return false for object missing resources', () => {
      const missingResources = {
        metadata: {
          template_path: 'test.yaml'
        }
      };

      expect(isExtendedAnalysisResult(missingResources)).toBe(false);
    });

    it('should return false for object missing metadata', () => {
      const missingMetadata = {
        resources: []
      };

      expect(isExtendedAnalysisResult(missingMetadata)).toBe(false);
    });
  });

  describe('defaultMockResource', () => {
    it('should create default Lambda function resource', () => {
      const resource = defaultMockResource();

      expect(resource.Type).toBe('AWS::Lambda::Function');
      expect(resource.Properties).toHaveProperty('Runtime', 'nodejs18.x');
      expect(resource.Properties).toHaveProperty('Handler', 'index.handler');
    });

    it('should apply overrides to Type', () => {
      const resource = defaultMockResource({
        Type: 'AWS::S3::Bucket'
      });

      expect(resource.Type).toBe('AWS::S3::Bucket');
      // Default properties should still be there
      expect(resource.Properties).toHaveProperty('Runtime', 'nodejs18.x');
    });

    it('should replace Properties when overriding', () => {
      const resource = defaultMockResource({
        Properties: {
          MemorySize: 512,
          Timeout: 30
        }
      });

      // When overriding Properties, defaults are replaced, not merged
      expect(resource.Properties).not.toHaveProperty('Runtime');
      expect(resource.Properties).not.toHaveProperty('Handler');
      expect(resource.Properties).toHaveProperty('MemorySize', 512);
      expect(resource.Properties).toHaveProperty('Timeout', 30);
    });

    it('should override existing Properties', () => {
      const resource = defaultMockResource({
        Properties: {
          Runtime: 'python3.9',
          Handler: 'main.lambda_handler'
        }
      });

      expect(resource.Properties).toHaveProperty('Runtime', 'python3.9');
      expect(resource.Properties).toHaveProperty('Handler', 'main.lambda_handler');
    });

    it('should handle additional resource attributes', () => {
      const resource = defaultMockResource({
        DependsOn: ['MyRole'],
        Condition: 'IsProduction'
      });

      expect(resource).toHaveProperty('DependsOn', ['MyRole']);
      expect(resource).toHaveProperty('Condition', 'IsProduction');
    });
  });

  describe('defaultMockAnalysis', () => {
    it('should create default analysis with default resources', () => {
      const analysis = defaultMockAnalysis();

      expect(analysis.resources).toHaveLength(1);
      expect(analysis.resources[0]).toEqual({
        resource_type: 'AWS::Lambda::Function',
        logical_id: 'TestFunction',
        resource_name: 'test-function'
      });
      expect(analysis.metadata.template_path).toBe('test-template.yaml');
    });

    it('should use provided resources', () => {
      const customResources: MockResource[] = [
        {
          resource_type: 'AWS::S3::Bucket',
          logical_id: 'MyBucket'
        },
        {
          resource_type: 'AWS::DynamoDB::Table',
          logical_id: 'MyTable',
          resource_name: 'my-table'
        }
      ];

      const analysis = defaultMockAnalysis(customResources);

      expect(analysis.resources).toHaveLength(2);
      expect(analysis.resources).toEqual(customResources);
    });

    it('should handle empty resources array', () => {
      const analysis = defaultMockAnalysis([]);

      expect(analysis.resources).toHaveLength(1);
      expect(analysis.resources[0]?.resource_type).toBe('AWS::Lambda::Function');
    });

    it('should maintain consistent metadata structure', () => {
      const analysis = defaultMockAnalysis();

      expect(analysis.metadata).toBeDefined();
      expect(analysis.metadata.template_path).toBe('test-template.yaml');
      expect(Object.keys(analysis.metadata)).toContain('template_path');
    });
  });
});