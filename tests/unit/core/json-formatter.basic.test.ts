// JSONOutputFormatter基本機能テスト
// CLAUDE.md準拠: No any types、TDD実践

import type { AnalysisResult } from '../../../src/types/metrics';
import {
  createJSONFormatterTestSuite,
  parseAndValidateJSON,
  assertMetadata,
  assertResourceMetrics
} from '../../helpers/json-formatter-test-template';

import { createMockAnalysisResult } from './json-formatter.test-helpers';

createJSONFormatterTestSuite('Basic Functionality', [
  {
    name: 'should generate valid JSON output',
    test: (formatter, mockResult) => {
      const json = formatter.formatJSON(mockResult);
      const parsed = parseAndValidateJSON(json);
      expect(parsed).toBeDefined();
    }
  },
  {
    name: 'should include all required metadata fields',
    test: (formatter, mockResult) => {
      const json = formatter.formatJSON(mockResult);
      const parsed = parseAndValidateJSON(json);

      expect(parsed.metadata).toBeDefined();
      assertMetadata(parsed.metadata, {
        version: '1.0.0',
        template_path: '/path/to/template.yaml',
        total_resources: 3,
        supported_resources: 2,
        processing_time_ms: 1500
      });
      expect(parsed.metadata.generated_at).toBeDefined();
    }
  },
  {
    name: 'should include all resources with metrics',
    test: (formatter, mockResult) => {
      const json = formatter.formatJSON(mockResult);
      const parsed = parseAndValidateJSON(json);

      expect(parsed.resources).toHaveLength(2);

      // First resource
      const firstResource = parsed.resources[0];
      if (!firstResource) throw new Error('First resource not found');
      expect(firstResource.logical_id).toBe('MyDatabase');
      expect(firstResource.resource_type).toBe('AWS::RDS::DBInstance');
      assertResourceMetrics(firstResource, 1);

      // Second resource
      const secondResource = parsed.resources[1];
      if (!secondResource) throw new Error('Second resource not found');
      expect(secondResource.logical_id).toBe('MyFunction');
      expect(secondResource.resource_type).toBe('AWS::Lambda::Function');
      assertResourceMetrics(secondResource, 2);
    }
  },
  {
    name: 'should format metrics correctly',
    test: (formatter, mockResult) => {
      const json = formatter.formatJSON(mockResult);
      const parsed = parseAndValidateJSON(json);

      const firstResource = parsed.resources[0];
      if (!firstResource) throw new Error('First resource not found');
      const metric = firstResource.metrics[0];
      if (!metric) throw new Error('First metric not found');
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
    }
  },
  {
    name: 'should include unsupported resources',
    test: (formatter, mockResult) => {
      const json = formatter.formatJSON(mockResult);
      const parsed = parseAndValidateJSON(json);

      expect(parsed.unsupported_resources).toBeDefined();
      expect(parsed.unsupported_resources).toContain('S3Bucket1');
    }
  },
  {
    name: 'should handle empty results',
    test: (formatter, mockResult) => {
      const emptyResult: AnalysisResult = {
        ...mockResult,
        resources: [],
        unsupported_resources: []
      };

      const json = formatter.formatJSON(emptyResult);
      const parsed = parseAndValidateJSON(json);

      expect(parsed.resources).toEqual([]);
      expect(parsed.unsupported_resources).toEqual([]);
    }
  },
  {
    name: 'should maintain consistent output order',
    test: (formatter, mockResult) => {
      // Run formatter twice with same input
      const json1 = formatter.formatJSON(mockResult);
      const json2 = formatter.formatJSON(mockResult);

      // Should produce identical output
      expect(json1).toBe(json2);
    }
  }
], createMockAnalysisResult);