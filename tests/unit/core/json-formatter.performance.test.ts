// JSONOutputFormatterパフォーマンステスト
// CLAUDE.md準拠: No any types、TDD実践

import { JSONOutputFormatter } from '../../../src/core/json-formatter';
import type { AnalysisResult } from '../../../src/types/metrics';
import { validateMetricsOutput } from '../../../src/utils/schema-validator';

import type { ParsedAnalysisResult } from './json-formatter.test-helpers';
import { createMockAnalysisResult } from './json-formatter.test-helpers';

// Mock schema validator
jest.mock('../../../src/utils/schema-validator');
const mockValidateMetricsOutput = validateMetricsOutput as jest.MockedFunction<typeof validateMetricsOutput>;

describe('JSONOutputFormatter - Performance', () => {
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

  test('should handle large outputs efficiently', () => {
    const largeResult: AnalysisResult = {
      ...mockResult,
      resources: Array(500).fill(null).map((_elem, i) => ({
        logical_id: `Resource${i}`,
        resource_type: 'AWS::Lambda::Function',
        resource_properties: {
          Runtime: 'nodejs20.x',
          MemorySize: 512,
          Timeout: 30,
          Environment: {
            Variables: Object.fromEntries(
              Array(10).fill(null).map((_el, j) => [`VAR_${j}`, `value_${j}`])
            )
          }
        },
        metrics: Array(20).fill(null).map((_metric, j) => ({
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
    const json = formatter.formatJSON(largeResult);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(2000); // 2 seconds max
    expect(json.length).toBeGreaterThan(1000000); // Should be > 1MB
    
    // Should still be valid JSON
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    expect(parsed).toBeDefined();
  });
});