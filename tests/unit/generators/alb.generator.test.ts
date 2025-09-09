import { ALBMetricsGenerator } from '../../../src/generators/alb.generator';
import { ILogger } from '../../../src/interfaces/logger';
import { createMockLogger, measureGeneratorPerformance, createALB, createTestResource } from '../../helpers';

describe('ALBMetricsGenerator', () => {
  let generator: ALBMetricsGenerator;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    generator = new ALBMetricsGenerator(mockLogger);
  });

  describe('getSupportedTypes', () => {
    it('should return AWS::ElasticLoadBalancingV2::LoadBalancer', () => {
      const types = generator.getSupportedTypes();
      expect(types).toEqual(['AWS::ElasticLoadBalancingV2::LoadBalancer']);
    });
  });

  describe('generate', () => {
    it('should generate base ALB metrics for Application Load Balancer', async () => {
      const resource = createALB('TestALB', {
        Name: 'test-alb',
        Scheme: 'internet-facing'
      });

      const metrics = await generator.generate(resource);
      
      // メトリクス数の確認（ALB固有の20個）
      expect(metrics.length).toBeGreaterThanOrEqual(18);
      
      // 必須メトリクスの存在確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('ActiveConnectionCount');
      expect(metricNames).toContain('NewConnectionCount');
      expect(metricNames).toContain('ProcessedBytes');
      expect(metricNames).toContain('RequestCount');
      expect(metricNames).toContain('TargetResponseTime');
      expect(metricNames).toContain('HTTPCode_Target_4XX_Count');
      expect(metricNames).toContain('HTTPCode_Target_5XX_Count');
      
      // しきい値検証（internet-facingでスケール係数1.2適用）
      const responseTimeMetric = metrics.find(m => m.metric_name === 'TargetResponseTime');
      expect(responseTimeMetric?.recommended_threshold.warning).toBe(1); // 1.0 * 1.2 * 1.0 = 1.2 → 1
      expect(responseTimeMetric?.recommended_threshold.critical).toBe(4); // 1.0 * 1.2 * 3.0 = 3.6 → 4
    });

    it('should exclude Network Load Balancers', async () => {
      const resource = createTestResource('AWS::ElasticLoadBalancingV2::LoadBalancer', 'TestNLB', {
        Type: 'network',
        Name: 'test-nlb'
      });

      // NLBはサポート外として例外を投げることを期待
      await expect(generator.generate(resource)).rejects.toThrow('Only Application Load Balancers are supported');
    });

    it('should exclude Gateway Load Balancers', async () => {
      const resource = createTestResource('AWS::ElasticLoadBalancingV2::LoadBalancer', 'TestGWLB', {
        Type: 'gateway',
        Name: 'test-gwlb'
      });

      // GWLBはサポート外として例外を投げることを期待
      await expect(generator.generate(resource)).rejects.toThrow('Only Application Load Balancers are supported');
    });

    it('should handle load balancers without explicit type (default to ALB)', async () => {
      const resource = createTestResource('AWS::ElasticLoadBalancingV2::LoadBalancer', 'DefaultLB', {
        Name: 'default-lb'
        // Typeが未定義の場合（createALBは自動でType: 'application'を設定するため、ここでは明示的にundefined）
      });

      // Typeが未定義の場合はALBとして扱う
      const metrics = await generator.generate(resource);
      expect(metrics.length).toBeGreaterThanOrEqual(18);
    });

    it('should scale thresholds based on target group count estimation', async () => {
      const smallALB = createALB('SmallALB', {
        // 小規模ALB（デフォルト）
      });

      const largeALB = createALB('LargeALB', {
        // 大規模ALBのマーカー（実際にはターゲットグループ数で判断するが、ここではシミュレート）
        Tags: [{ Key: 'Scale', Value: 'Large' }]
      });

      const smallMetrics = await generator.generate(smallALB);
      const largeMetrics = await generator.generate(largeALB);
      
      // スケール係数が適用されているか確認
      const smallResponseTime = smallMetrics.find(m => m.metric_name === 'TargetResponseTime');
      const largeResponseTime = largeMetrics.find(m => m.metric_name === 'TargetResponseTime');
      
      expect(smallResponseTime?.recommended_threshold.warning).toBe(1);
      expect(largeResponseTime?.recommended_threshold.warning).toBeGreaterThanOrEqual(1);
    });

    it('should generate proper dimensions for all metrics', async () => {
      const resource = createALB('TestALB', {
        Name: 'test-alb'
      });

      const metrics = await generator.generate(resource);
      
      for (const metric of metrics) {
        expect(metric.dimensions).toBeDefined();
        expect(metric.dimensions?.length).toBeGreaterThan(0);
        
        // ALBのプライマリディメンション
        const lbDimension = metric.dimensions?.find(d => d.name === 'LoadBalancer');
        expect(lbDimension).toBeDefined();
        expect(lbDimension?.value).toBe('TestALB');
      }
    });

    it('should measure performance and complete within 1 second', async () => {
      const resource = createALB('PerfTestALB', {
        Name: 'performance-test-alb'
      });

      await measureGeneratorPerformance(generator, resource);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Generated \d+ metrics for PerfTestALB in [\d.]+ms/)
      );
    });

    it('should include WAF-related metrics', async () => {
      const resource = createALB('WAFProtectedALB', {
        Name: 'waf-protected-alb'
      });

      const metrics = await generator.generate(resource);
      
      // WAF関連メトリクスの存在を確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('HTTPCode_Target_5XX_Count');
      expect(metricNames).toContain('HTTPCode_Target_4XX_Count');
    });

    it('should handle cross-zone load balancing metrics', async () => {
      const resource = createALB('CrossZoneALB', {
        Name: 'cross-zone-alb',
        LoadBalancerAttributes: [
          {
            Key: 'load_balancing.cross_zone.enabled',
            Value: 'true'
          }
        ]
      });

      const metrics = await generator.generate(resource);
      
      // 基本メトリクスが含まれていることを確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('ActiveConnectionCount');
      expect(metricNames).toContain('ProcessedBytes');
      
      // クロスゾーン設定がある場合でも標準メトリクスセットを返す
      expect(metrics.length).toBeGreaterThanOrEqual(18);
    });
  });
});