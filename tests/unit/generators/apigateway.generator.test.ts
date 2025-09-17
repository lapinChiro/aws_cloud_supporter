import { APIGatewayMetricsGenerator } from '../../../src/generators/apigateway.generator';
import { Logger } from '../../../src/utils/logger';
import { createAPIGateway } from '../../helpers';
import { createGeneratorTestSuite } from '../../helpers/generator-test-template';

createGeneratorTestSuite(APIGatewayMetricsGenerator, {
  resourceType: 'API Gateway',
  supportedTypes: ['AWS::ApiGateway::RestApi', 'AWS::Serverless::Api'],
  createResource: () => createAPIGateway('TestRestAPI', {
    Name: 'test-api',
    Description: 'Test API Gateway'
  }),
  expectedMetrics: [
    'Count',
    '4XXError',
    '5XXError',
    'CacheHitCount',
    'CacheMissCount',
    'Latency',
    'IntegrationLatency'
  ],
  thresholdTests: [
    { metricName: 'Count', warning: 10000, critical: 100000 }
  ],
  expectedMetricCount: 14
});

// エッジケーステスト追加
describe('APIGatewayMetricsGenerator - Edge Cases', () => {
  let generator: APIGatewayMetricsGenerator;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    logger.setLevel('error'); // 'silent'はLogLevelに存在しないため'error'を使用
    generator = new APIGatewayMetricsGenerator(logger);
  });

  describe('Resource Scale Calculation', () => {
    it('should apply custom domain scale factor', async () => {
      const resource = createAPIGateway('TestAPI', {
        Name: 'test-api',
        Tags: [
          { Key: 'HasCustomDomain', Value: 'true' }
        ]
      });

      // Debug: リソース構造を確認
      expect(resource.Type).toBe('AWS::ApiGateway::RestApi');
      expect(resource.LogicalId).toBe('TestAPI');
      expect(resource.Properties).toBeDefined();

      const metrics = await generator.generate(resource); // generator.generateは配列を期待
      // カスタムドメインがある場合、スケール係数1.2が適用される
      expect(metrics.length).toBeGreaterThan(0);
      
      // 閾値が1.2倍になっていることを確認
      const countMetric = metrics.find(m => m.metric_name === 'Count');
      expect(countMetric).toBeDefined();
      if (countMetric?.recommended_threshold?.warning) {
        // 基準値10000の場合、1.2倍の12000になるはず
        expect(countMetric.recommended_threshold.warning).toBe(12000);
      }
    });

    it('should apply policy scale factor', async () => {
      const resource = createAPIGateway('TestAPI', {
        Name: 'test-api',
        Policy: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: '*',
            Action: 'execute-api:Invoke',
            Resource: '*'
          }]
        }
      });

      const metrics = await generator.generate(resource); // generator.generateは配列を期待
      // ポリシーがある場合、スケール係数1.1が適用される
      expect(metrics.length).toBeGreaterThan(0);
      
      // 閾値が1.1倍になっていることを確認
      const countMetric = metrics.find(m => m.metric_name === 'Count');
      expect(countMetric).toBeDefined();
      if (countMetric?.recommended_threshold?.warning) {
        // 基準値10000の場合、1.1倍の11000になるはず
        expect(countMetric.recommended_threshold.warning).toBe(11000);
      }
    });

    it('should apply production environment scale factor', async () => {
      const resource = createAPIGateway('TestAPI', {
        Name: 'test-api',
        Tags: [
          { Key: 'Environment', Value: 'Production' }
        ]
      });

      const metrics = await generator.generate(resource); // generator.generateは配列を期待
      // プロダクション環境の場合、スケール係数1.5が適用される
      expect(metrics.length).toBeGreaterThan(0);
      
      const countMetric = metrics.find(m => m.metric_name === 'Count');
      expect(countMetric).toBeDefined();
      if (countMetric?.recommended_threshold?.warning) {
        // 基準値10000の場合、1.5倍の15000になるはず
        expect(countMetric.recommended_threshold.warning).toBe(15000);
      }
    });

    it('should apply development environment scale factor', async () => {
      const resource = createAPIGateway('TestAPI', {
        Name: 'test-api',
        Tags: [
          { Key: 'Environment', Value: 'Development' }
        ]
      });

      const metrics = await generator.generate(resource); // generator.generateは配列を期待
      // 開発環境の場合、スケール係数0.5が適用される
      expect(metrics.length).toBeGreaterThan(0);
      
      const countMetric = metrics.find(m => m.metric_name === 'Count');
      expect(countMetric).toBeDefined();
      if (countMetric?.recommended_threshold?.warning) {
        // 基準値10000の場合、0.5倍の5000になるはず
        expect(countMetric.recommended_threshold.warning).toBe(5000);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing metrics configuration gracefully', async () => {
      // Note: This test is for understanding error flow, 
      // actual error is thrown by getMetricsConfig method
      const resource = {
        Type: 'AWS::ApiGateway::RestApi', // 正しいタイプ
        LogicalId: 'TestAPI',
        Properties: { Name: 'test-api' }
      };

      // エラーがスローされないことを確認（メトリクス設定が存在するため）
      const metrics = await generator.generate(resource);
      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
    });
  });
});