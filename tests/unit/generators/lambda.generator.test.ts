import { LambdaMetricsGenerator } from '../../../src/generators/lambda.generator';
import { LambdaFunction } from '../../../src/types/cloudformation';
import { ILogger } from '../../../src/interfaces/logger';
import { createMockLogger, measureGeneratorPerformance, createLambdaFunction, createTestResource } from '../../helpers';

describe('LambdaMetricsGenerator', () => {
  let generator: LambdaMetricsGenerator;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    generator = new LambdaMetricsGenerator(mockLogger);
  });

  describe('getSupportedTypes', () => {
    it('should return Lambda and SAM function types', () => {
      const types = generator.getSupportedTypes();
      expect(types).toEqual(['AWS::Lambda::Function', 'AWS::Serverless::Function']);
    });
  });

  describe('generate', () => {
    it('should generate base Lambda metrics for 128MB memory function', async () => {
      const resource = createLambdaFunction('TestFunction128MB', {
        Runtime: 'nodejs18.x',
        MemorySize: 128,
        Timeout: 30
      });

      const metrics = await generator.generate(resource);
      
      // メトリクス数の確認（最低15個）
      expect(metrics.length).toBeGreaterThanOrEqual(15);
      
      // 必須メトリクスの存在確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('Duration');
      expect(metricNames).toContain('Errors');
      expect(metricNames).toContain('Throttles');
      expect(metricNames).toContain('ConcurrentExecutions');
      expect(metricNames).toContain('ProvisionedConcurrencyUtilization');
      
      // しきい値検証（スケール係数0.5適用 - 128MB）
      const durationMetric = metrics.find(m => m.metric_name === 'Duration');
      expect(durationMetric?.recommended_threshold.warning).toBe(2000); // 5000 * 0.5 * 0.8
      expect(durationMetric?.recommended_threshold.critical).toBe(2500); // 5000 * 0.5 * 1.0
    });

    it('should generate metrics with higher thresholds for 3008MB memory function', async () => {
      const resource = createLambdaFunction('TestFunction3GB', {
        Runtime: 'python3.11',
        MemorySize: 3008,
        Timeout: 900
      });

      const metrics = await generator.generate(resource);
      
      // しきい値検証（スケール係数2.0適用 - 3008MB）
      const durationMetric = metrics.find(m => m.metric_name === 'Duration');
      expect(durationMetric?.recommended_threshold.warning).toBe(8000); // 5000 * 2.0 * 0.8
      expect(durationMetric?.recommended_threshold.critical).toBe(10000); // 5000 * 2.0 * 1.0
    });

    it('should handle Serverless Function type', async () => {
      const resource = createTestResource('AWS::Serverless::Function', 'ServerlessFunction', {
        Runtime: 'java17',
        MemorySize: 512,
        Timeout: 60
      });

      const metrics = await generator.generate(resource);
      
      expect(metrics.length).toBeGreaterThanOrEqual(15);
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('Duration');
      expect(metricNames).toContain('Errors');
    });

    it('should include runtime-specific metrics for container functions', async () => {
      const resource = createLambdaFunction('ContainerFunction', {
        PackageType: 'Image',
        MemorySize: 1024,
        Timeout: 180
      });

      const metrics = await generator.generate(resource);
      
      // コンテナイメージ関連のメトリクスを確認（InitDurationなど）
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('InitDuration');
    });

    it('should handle functions with provisioned concurrency', async () => {
      const resource = createLambdaFunction('ProvisionedFunction', {
        Runtime: 'nodejs18.x',
        MemorySize: 256,
        ReservedConcurrentExecutions: 100
      });

      const metrics = await generator.generate(resource);
      
      // 並行実行関連メトリクスの確認
      const provisionedMetric = metrics.find(m => m.metric_name === 'ProvisionedConcurrencyUtilization');
      expect(provisionedMetric).toBeDefined();
      expect(provisionedMetric?.importance).toBe('High');
    });

    it('should handle unknown memory sizes with appropriate scale', async () => {
      const resource = createLambdaFunction('DefaultMemoryFunction', {
        Runtime: 'nodejs18.x'
        // MemorySizeが未定義
      });

      const metrics = await generator.generate(resource);
      
      // デフォルトメモリサイズ（128MB）のスケール係数適用
      const durationMetric = metrics.find(m => m.metric_name === 'Duration');
      expect(durationMetric?.recommended_threshold.warning).toBe(2000); // デフォルトスケール
    });

    it('should generate proper dimensions for all metrics', async () => {
      const resource = createLambdaFunction('TestFunction', {
        Runtime: 'python3.11',
        MemorySize: 512
      });

      const metrics = await generator.generate(resource);
      
      for (const metric of metrics) {
        expect(metric.dimensions).toBeDefined();
        expect(metric.dimensions?.length).toBeGreaterThan(0);
        expect(metric.dimensions?.[0]?.name).toBe('FunctionName');
        expect(metric.dimensions?.[0]?.value).toBe('TestFunction');
      }
    });

    it('should measure performance and complete within 1 second', async () => {
      const resource: LambdaFunction = {
        Type: 'AWS::Lambda::Function',
        LogicalId: 'PerfTestFunction',
        Properties: {
          Runtime: 'python3.11',
          MemorySize: 1024,
          Timeout: 300,
          ReservedConcurrentExecutions: 50
        }
      };

      await measureGeneratorPerformance(generator, resource);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Generated \d+ metrics for PerfTestFunction in [\d.]+ms/)
      );
    });

    it('should handle edge runtime functions appropriately', async () => {
      const resource = createLambdaFunction('EdgeFunction', {
        Runtime: 'nodejs18.x',
        MemorySize: 128,
        Timeout: 5 // Edge関数は最大5秒
      });

      const metrics = await generator.generate(resource);
      
      // Edge関数用のメトリクス確認
      const durationMetric = metrics.find(m => m.metric_name === 'Duration');
      expect(durationMetric).toBeDefined();
      // Edge関数は低レイテンシが重要なので、より厳しいしきい値
      expect(durationMetric?.recommended_threshold.warning).toBeLessThan(3000);
    });
  });
});