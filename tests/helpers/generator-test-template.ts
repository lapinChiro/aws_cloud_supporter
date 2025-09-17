// CLAUDE.md準拠: DRY原則違反解消 - Generator Test Template
// 6ファイルの完全重複構造 → 1つのテンプレート関数に統一

import type { IMetricsGenerator } from '../../src/interfaces/generator';
import type { ILogger } from '../../src/interfaces/logger';
import type { CloudFormationResource } from '../../src/types/cloudformation';

import { expectMetricsToContain, expectThresholds, expectMetricCount } from './assertion-helpers';
import { createMockLogger, measureGeneratorPerformance } from './test-helpers';

/**
 * Generator テスト設定インターフェース
 */
export interface GeneratorTestConfig {
  resourceType: string;
  supportedTypes: string[];
  createResource: () => CloudFormationResource;
  expectedMetrics: string[];
  thresholdTests: Array<{
    metricName: string;
    warning: number;
    critical: number;
  }>;
  expectedMetricCount: number;
  performanceTestResource?: () => CloudFormationResource;
}

/**
 * Generator テストスイート統一作成関数
 *
 * DRY原則: 6ファイルの完全重複構造を1つの関数に統一
 * - beforeEach setup: 53回重複 → 1箇所
 * - describe構造: 6回重複 → 1箇所
 * - getSupportedTypes test: 6回重複 → 1箇所
 * - generate test基本構造: 6回重複 → 1箇所
 *
 * @param GeneratorClass ジェネレータークラス
 * @param config テスト設定
 */
export function createGeneratorTestSuite(
  GeneratorClass: new (logger: ILogger) => IMetricsGenerator,
  config: GeneratorTestConfig
): void {
  describe(`${GeneratorClass.name}`, () => {
    let generator: IMetricsGenerator;
    let mockLogger: ILogger;

    beforeEach(() => {
      mockLogger = createMockLogger();
      generator = new GeneratorClass(mockLogger);
    });

    describe('getSupportedTypes', () => {
      it(`should return ${config.supportedTypes.join(', ')}`, () => {
        expect(generator.getSupportedTypes()).toEqual(config.supportedTypes);
      });
    });

    describe('generate', () => {
      it(`should generate base ${config.resourceType} metrics`, async () => {
        const resource = config.createResource();
        const metrics = await generator.generate(resource);

        // メトリクス数の確認
        expectMetricCount(metrics, config.expectedMetricCount, 'minimum');

        // 必須メトリクスの存在確認
        expectMetricsToContain(metrics, config.expectedMetrics);

        // しきい値検証
        config.thresholdTests.forEach(test => {
          expectThresholds(metrics, test.metricName, test.warning, test.critical);
        });
      });

      if (config.performanceTestResource) {
        it(`should generate ${config.resourceType} metrics within performance limits`, async () => {
          const resource = config.performanceTestResource ? config.performanceTestResource() : config.createResource();
          await measureGeneratorPerformance(generator, resource);
        });
      }
    });
  });
}