// tests/helpers/json-formatter-test-template.ts
// JSONフォーマッターテスト用の共通テンプレート

import { JSONOutputFormatter } from '../../src/core/json-formatter';
import type { AnalysisResult } from '../../src/types/metrics';
import { validateMetricsOutput } from '../../src/utils/schema-validator';

// Mock schema validator
jest.mock('../../src/utils/schema-validator');

export interface JSONTestCase {
  name: string;
  test: (
    formatter: JSONOutputFormatter,
    mockResult: AnalysisResult,
    mockValidateMetricsOutput: jest.MockedFunction<typeof validateMetricsOutput>
  ) => void;
}

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

/**
 * JSONフォーマッターのテストスイートを作成
 * @param testCategory テストカテゴリ名
 * @param testCases テストケース配列
 * @param createMockResult モック結果作成関数
 */
export function createJSONFormatterTestSuite(
  testCategory: string,
  testCases: JSONTestCase[],
  createMockResult: () => AnalysisResult
): void {
  const mockValidateMetricsOutput = validateMetricsOutput as jest.MockedFunction<typeof validateMetricsOutput>;

  describe(`JSONOutputFormatter - ${testCategory}`, () => {
    let formatter: JSONOutputFormatter;
    let mockResult: AnalysisResult;

    beforeEach(() => {
      formatter = new JSONOutputFormatter();
      jest.clearAllMocks();

      // Default: validation passes
      mockValidateMetricsOutput.mockReturnValue({ valid: true, errors: [] });

      // Mock analysis result
      mockResult = createMockResult();
    });

    testCases.forEach(testCase => {
      test(testCase.name, () => {
        testCase.test(formatter, mockResult, mockValidateMetricsOutput);
      });
    });
  });
}

/**
 * JSON出力をパースして検証
 * @param json JSON文字列
 * @returns パースされた結果
 */
export function parseAndValidateJSON(json: string): ParsedAnalysisResult {
  // Should be valid JSON
  expect(() => { JSON.parse(json); }).not.toThrow();

  const parsed = JSON.parse(json) as ParsedAnalysisResult;
  expect(parsed).toBeDefined();
  expect(typeof parsed).toBe('object');

  return parsed;
}

/**
 * メタデータフィールドをアサート
 * @param metadata メタデータオブジェクト
 * @param expected 期待される値
 */
export function assertMetadata(
  metadata: ParsedAnalysisResult['metadata'],
  expected: Partial<ParsedAnalysisResult['metadata']>
): void {
  Object.entries(expected).forEach(([key, value]) => {
    expect(metadata[key as keyof typeof metadata]).toBe(value);
  });
}

/**
 * リソースのメトリクスをアサート
 * @param resource リソースオブジェクト
 * @param expectedMetricsCount 期待されるメトリクス数
 */
export function assertResourceMetrics(
  resource: ParsedAnalysisResult['resources'][0],
  expectedMetricsCount: number
): void {
  expect(resource).toBeDefined();
  expect(resource?.metrics).toHaveLength(expectedMetricsCount);
}

/**
 * JSON出力に特定の文字列が含まれないことをアサート
 * @param json JSON文字列
 * @param redactedStrings 含まれてはいけない文字列の配列
 */
export function assertRedacted(json: string, redactedStrings: string[]): void {
  redactedStrings.forEach(str => {
    expect(json).not.toContain(str);
  });
}

/**
 * プロパティがREDACTEDされていることをアサート
 * @param properties リソースプロパティ
 * @param sensitiveKeys センシティブなキーの配列
 */
export function assertSensitivePropertiesRedacted(
  properties: Record<string, unknown>,
  sensitiveKeys: string[]
): void {
  sensitiveKeys.forEach(key => {
    if (key in properties) {
      expect(properties[key]).toBe('[REDACTED]');
    }
  });
}

/**
 * 大規模な分析結果を作成
 * @param resourceCount リソース数
 * @param metricsPerResource 各リソースのメトリクス数
 * @returns 大規模な分析結果
 */
export function createLargeAnalysisResult(
  resourceCount: number = 500,
  metricsPerResource: number = 20
): AnalysisResult {
  return {
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      template_path: '/path/to/large-template.yaml',
      total_resources: resourceCount,
      supported_resources: resourceCount,
      processing_time_ms: 5000
    },
    resources: Array(resourceCount).fill(null).map((_elem, i) => ({
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
      metrics: Array(metricsPerResource).fill(null).map((_metric, j) => ({
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
    })),
    unsupported_resources: []
  };
}

/**
 * パフォーマンステストを実行
 * @param formatter フォーマッター
 * @param result 分析結果
 * @param maxDurationMs 最大許容時間（ミリ秒）
 * @param minOutputSize 最小出力サイズ
 */
export function runPerformanceTest(
  formatter: JSONOutputFormatter,
  result: AnalysisResult,
  maxDurationMs: number = 2000,
  minOutputSize: number = 1000000
): void {
  const startTime = Date.now();
  const json = formatter.formatJSON(result);
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(maxDurationMs);
  expect(json.length).toBeGreaterThan(minOutputSize);

  // Should still be valid JSON
  const parsed = parseAndValidateJSON(json);
  expect(parsed).toBeDefined();
}