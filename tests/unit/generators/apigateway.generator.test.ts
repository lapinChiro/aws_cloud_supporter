import { APIGatewayMetricsGenerator } from '../../../src/generators/apigateway.generator';
import { CloudFormationResource } from '../../../src/types/cloudformation';
import { ILogger } from '../../../src/utils/logger';

describe('APIGatewayMetricsGenerator', () => {
  let generator: APIGatewayMetricsGenerator;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      success: jest.fn()
    };
    generator = new APIGatewayMetricsGenerator(mockLogger);
  });

  describe('getSupportedTypes', () => {
    it('should return AWS::ApiGateway::RestApi and AWS::Serverless::Api', () => {
      const types = generator.getSupportedTypes();
      expect(types).toEqual(['AWS::ApiGateway::RestApi', 'AWS::Serverless::Api']);
    });
  });

  describe('generate', () => {
    it('should generate base API Gateway metrics for REST API', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::ApiGateway::RestApi',
        LogicalId: 'TestApi',
        Properties: {
          Name: 'test-api',
          Description: 'Test API Gateway'
        }
      };

      const metrics = await generator.generate(resource);
      
      // API Gateway固有の14個のメトリクス
      expect(metrics.length).toBe(14);
      
      // 必須メトリクスの存在確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('Count');
      expect(metricNames).toContain('4XXError');
      expect(metricNames).toContain('5XXError');
      expect(metricNames).toContain('CacheHitCount');
      expect(metricNames).toContain('CacheMissCount');
      expect(metricNames).toContain('Latency');
      expect(metricNames).toContain('IntegrationLatency');
      
      // しきい値検証（標準スケール係数1.0）
      const countMetric = metrics.find(m => m.metric_name === 'Count');
      expect(countMetric?.recommended_threshold.warning).toBe(10000); // 1000 * 1.0 * 10.0
      expect(countMetric?.recommended_threshold.critical).toBe(100000); // 1000 * 1.0 * 100.0
    });

    it('should generate metrics for SAM API', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::Serverless::Api',
        LogicalId: 'SamApi',
        Properties: {
          Name: 'sam-api',
          StageName: 'prod'
        }
      };

      const metrics = await generator.generate(resource);
      
      // SAM APIも同じメトリクスセット
      expect(metrics.length).toBe(14);
      
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('Count');
      expect(metricNames).toContain('4XXError');
      expect(metricNames).toContain('5XXError');
    });

    it('should scale thresholds based on stage configuration', async () => {
      const prodApi: CloudFormationResource = {
        Type: 'AWS::ApiGateway::RestApi',
        LogicalId: 'ProdApi',
        Properties: {
          Name: 'prod-api',
          Tags: [
            { Key: 'Environment', Value: 'Production' }
          ]
        }
      };

      const devApi: CloudFormationResource = {
        Type: 'AWS::ApiGateway::RestApi',
        LogicalId: 'DevApi',
        Properties: {
          Name: 'dev-api',
          Tags: [
            { Key: 'Environment', Value: 'Development' }
          ]
        }
      };

      const prodMetrics = await generator.generate(prodApi);
      const devMetrics = await generator.generate(devApi);
      
      // プロダクション環境は高いしきい値を持つ
      const prodCount = prodMetrics.find(m => m.metric_name === 'Count');
      const devCount = devMetrics.find(m => m.metric_name === 'Count');
      
      expect(prodCount?.recommended_threshold.warning).toBeGreaterThan(
        devCount?.recommended_threshold.warning || 0
      );
    });

    it('should generate proper dimensions for all metrics', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::ApiGateway::RestApi',
        LogicalId: 'TestApi',
        Properties: {
          Name: 'test-api'
        }
      };

      const metrics = await generator.generate(resource);
      
      for (const metric of metrics) {
        expect(metric.dimensions).toBeDefined();
        expect(metric.dimensions?.length).toBeGreaterThan(0);
        
        // API Gatewayのプライマリディメンション
        const apiNameDimension = metric.dimensions?.find(d => d.name === 'ApiName');
        expect(apiNameDimension).toBeDefined();
        expect(apiNameDimension?.value).toBe('TestApi');
      }
    });

    it('should handle custom domain configurations', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::ApiGateway::RestApi',
        LogicalId: 'ApiWithDomain',
        Properties: {
          Name: 'api-with-domain',
          Tags: [
            { Key: 'HasCustomDomain', Value: 'true' }
          ]
        }
      };

      const metrics = await generator.generate(resource);
      
      // カスタムドメインがある場合も同じメトリクスセット
      expect(metrics.length).toBe(14);
      
      // カスタムドメインの場合はスケール係数が調整される（1.2）
      const countMetric = metrics.find(m => m.metric_name === 'Count');
      expect(countMetric?.recommended_threshold.warning).toBe(12000); // 1000 * 1.2 * 10.0
    });

    it('should handle API with authorization', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::ApiGateway::RestApi',
        LogicalId: 'AuthorizedApi',
        Properties: {
          Name: 'authorized-api',
          Policy: {
            Statement: [{
              Effect: 'Allow',
              Principal: '*',
              Action: 'execute-api:Invoke'
            }]
          }
        }
      };

      const metrics = await generator.generate(resource);
      
      // 認証ありAPIでも標準メトリクスが含まれる
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('4XXError'); // 認証エラーは4XXに含まれる
      expect(metricNames).toContain('ClientError');
    });

    it('should measure performance and complete within 1 second', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::ApiGateway::RestApi',
        LogicalId: 'PerfTestApi',
        Properties: {
          Name: 'performance-test-api'
        }
      };

      const startTime = performance.now();
      await generator.generate(resource);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Generated \d+ metrics for PerfTestApi in [\d.]+ms/)
      );
    });

    it('should handle minimal configuration', async () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::ApiGateway::RestApi',
        LogicalId: 'MinimalApi',
        Properties: {}
      };

      const metrics = await generator.generate(resource);
      
      // 最小構成でも標準メトリクスセットが生成される
      expect(metrics.length).toBe(14);
    });
  });
});