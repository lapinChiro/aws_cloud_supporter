// JSONOutputFormatter基本機能テスト
// CLAUDE.md準拠: No any types、TDD実践

import { JSONOutputFormatter } from '../../../src/core/json-formatter';
import type { AnalysisResult } from '../../../src/types/metrics';
import { validateMetricsOutput } from '../../../src/utils/schema-validator';

import type { ParsedAnalysisResult } from './json-formatter.test-helpers';
import { createMockAnalysisResult } from './json-formatter.test-helpers';

// Mock schema validator
jest.mock('../../../src/utils/schema-validator');
const mockValidateMetricsOutput = validateMetricsOutput as jest.MockedFunction<typeof validateMetricsOutput>;

describe('JSONOutputFormatter - Basic Functionality', () => {
  let formatter: JSONOutputFormatter;
  let mockResult: AnalysisResult;

  beforeEach(() => {
    formatter = new JSONOutputFormatter();
    jest.clearAllMocks();
    
    // Default: validation passes
    mockValidateMetricsOutput.mockReturnValue({ valid: true, errors: [] });
    
    // Mock analysis result
    mockResult = createMockAnalysisResult();
  });

  test('should generate valid JSON output', () => {
    const json = formatter.formatJSON(mockResult);
    
    // Should be valid JSON
    expect(() => { JSON.parse(json); }).not.toThrow();
    
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe('object');
  });

  test('should include all required metadata fields', () => {
    const json = formatter.formatJSON(mockResult);
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    
    expect(parsed.metadata).toBeDefined();
    expect(parsed.metadata.version).toBe('1.0.0');
    expect(parsed.metadata.generated_at).toBeDefined();
    expect(parsed.metadata.template_path).toBe('/path/to/template.yaml');
    expect(parsed.metadata.total_resources).toBe(3);
    expect(parsed.metadata.supported_resources).toBe(2);
    expect(parsed.metadata.processing_time_ms).toBe(1500);
  });

  test('should include all resources with metrics', () => {
    const json = formatter.formatJSON(mockResult);
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    
    expect(parsed.resources).toHaveLength(2);
    
    // First resource
    const firstResource = parsed.resources[0];
    if (!firstResource) throw new Error('First resource not found');
    expect(firstResource.logical_id).toBe('MyDatabase');
    expect(firstResource.resource_type).toBe('AWS::RDS::DBInstance');
    expect(firstResource.metrics).toHaveLength(1);
    
    // Second resource
    const secondResource = parsed.resources[1];
    if (!secondResource) throw new Error('Second resource not found');
    expect(secondResource.logical_id).toBe('MyFunction');
    expect(secondResource.resource_type).toBe('AWS::Lambda::Function');
    expect(secondResource.metrics).toHaveLength(2);
  });

  test('should format metrics correctly', () => {
    const json = formatter.formatJSON(mockResult);
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    
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
  });

  test('should include unsupported resources', () => {
    const json = formatter.formatJSON(mockResult);
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    
    expect(parsed.unsupported_resources).toBeDefined();
    expect(parsed.unsupported_resources).toContain('S3Bucket1');
  });

  test('should handle empty results', () => {
    const emptyResult: AnalysisResult = {
      ...mockResult,
      resources: [],
      unsupported_resources: []
    };
    
    const json = formatter.formatJSON(emptyResult);
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    
    expect(parsed.resources).toEqual([]);
    expect(parsed.unsupported_resources).toEqual([]);
  });

  test('should maintain consistent output order', () => {
    // Run formatter twice with same input
    const json1 = formatter.formatJSON(mockResult);
    const json2 = formatter.formatJSON(mockResult);
    
    // Should produce identical output
    expect(json1).toBe(json2);
  });
});