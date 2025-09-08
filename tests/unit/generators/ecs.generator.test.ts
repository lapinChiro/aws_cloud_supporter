import { ECSMetricsGenerator } from '../../../src/generators/ecs.generator';
import { CloudFormationResource, ECSService } from '../../../src/types/cloudformation';
import { MetricDefinition } from '../../../src/types/metrics';
import { ILogger } from '../../../src/utils/logger';

describe('ECSMetricsGenerator', () => {
  let generator: ECSMetricsGenerator;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      success: jest.fn()
    };
    generator = new ECSMetricsGenerator(mockLogger);
  });

  describe('getSupportedTypes', () => {
    it('should return AWS::ECS::Service', () => {
      const types = generator.getSupportedTypes();
      expect(types).toEqual(['AWS::ECS::Service']);
    });
  });

  describe('generate', () => {
    it('should generate base ECS metrics for Fargate service with LaunchType', async () => {
      const resource: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'TestService',
        Properties: {
          ServiceName: 'test-service',
          LaunchType: 'FARGATE',
          DesiredCount: 2
        }
      };

      const metrics = await generator.generate(resource);
      
      // メトリクス数の確認（ECS固有の17個）
      expect(metrics.length).toBeGreaterThanOrEqual(15);
      
      // 必須メトリクスの存在確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('CPUUtilization');
      expect(metricNames).toContain('MemoryUtilization');
      expect(metricNames).toContain('CPUReservation');
      expect(metricNames).toContain('MemoryReservation');
      expect(metricNames).toContain('TaskCount');
      expect(metricNames).toContain('RunningCount');
      
      // しきい値検証（小規模サービスDesiredCount=2でスケール係数0.7適用）
      const cpuMetric = metrics.find(m => m.metric_name === 'CPUUtilization');
      expect(cpuMetric?.recommended_threshold.warning).toBe(49); // 70 * 0.7 * 1.0
      expect(cpuMetric?.recommended_threshold.critical).toBe(64); // 70 * 0.7 * 1.3（端数切り上げ）
    });

    it('should generate metrics for Fargate service with CapacityProviderStrategy', async () => {
      const resource: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'FargateSpotService',
        Properties: {
          CapacityProviderStrategy: [
            {
              CapacityProvider: 'FARGATE',
              Weight: 1,
              Base: 2
            },
            {
              CapacityProvider: 'FARGATE_SPOT',
              Weight: 4
            }
          ],
          DesiredCount: 10
        }
      };

      const metrics = await generator.generate(resource);
      
      expect(metrics.length).toBeGreaterThanOrEqual(15);
      
      // 高いDesiredCountのためスケール係数が大きくなる
      const cpuMetric = metrics.find(m => m.metric_name === 'CPUUtilization');
      expect(cpuMetric?.recommended_threshold.warning).toBeGreaterThan(80); // スケール調整
    });

    it('should exclude non-Fargate services (EC2 launch type)', async () => {
      const resource: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'EC2Service',
        Properties: {
          LaunchType: 'EC2',
          DesiredCount: 5
        }
      };

      // EC2タイプはサポート外として例外を投げることを期待
      await expect(generator.generate(resource)).rejects.toThrow('Only Fargate services are supported');
    });

    it('should handle services without explicit launch type', async () => {
      const resource: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'DefaultService',
        Properties: {
          ServiceName: 'default-service'
          // LaunchTypeもCapacityProviderStrategyも未定義
        }
      };

      // デフォルトではEC2と見なされ、サポート外
      await expect(generator.generate(resource)).rejects.toThrow('Only Fargate services are supported');
    });

    it('should scale thresholds based on desired count', async () => {
      const smallService: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'SmallService',
        Properties: {
          LaunchType: 'FARGATE',
          DesiredCount: 1
        }
      };

      const largeService: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'LargeService',
        Properties: {
          LaunchType: 'FARGATE',
          DesiredCount: 50
        }
      };

      const smallMetrics = await generator.generate(smallService);
      const largeMetrics = await generator.generate(largeService);
      
      // 大規模サービスはより高いしきい値を持つ
      const smallCpu = smallMetrics.find(m => m.metric_name === 'CPUUtilization');
      const largeCpu = largeMetrics.find(m => m.metric_name === 'CPUUtilization');
      
      expect(smallCpu?.recommended_threshold.warning).toBeLessThan(
        largeCpu?.recommended_threshold.warning || 0
      );
    });

    it('should generate proper dimensions for all metrics', async () => {
      const resource: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'TestService',
        Properties: {
          ServiceName: 'test-service',
          LaunchType: 'FARGATE',
          Cluster: 'test-cluster'
        }
      };

      const metrics = await generator.generate(resource);
      
      for (const metric of metrics) {
        expect(metric.dimensions).toBeDefined();
        expect(metric.dimensions?.length).toBeGreaterThan(0);
        
        // ECSサービスのプライマリディメンション
        const serviceDimension = metric.dimensions?.find(d => d.name === 'ServiceName');
        expect(serviceDimension).toBeDefined();
        expect(serviceDimension?.value).toBe('TestService');
        
        // 注: 基底クラスの制約により、現在は単一ディメンションのみサポート
        // TODO: 将来的にClusterNameディメンションも追加する場合は基底クラスの拡張が必要
      }
    });

    it('should measure performance and complete within 1 second', async () => {
      const resource: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'PerfTestService',
        Properties: {
          LaunchType: 'FARGATE',
          DesiredCount: 20,
          ServiceName: 'performance-test'
        }
      };

      const startTime = performance.now();
      await generator.generate(resource);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Generated \d+ metrics for PerfTestService in [\d.]+ms/)
      );
    });

    it('should include GPU metrics for GPU-enabled tasks', async () => {
      const resource: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'GPUService',
        Properties: {
          LaunchType: 'FARGATE',
          DesiredCount: 2,
          ServiceName: 'gpu-service',
          // Fargateではまだ一般的でないが、将来的な対応を想定
          RequiresCompatibilities: ['GPU']
        }
      };

      const metrics = await generator.generate(resource);
      
      // GPU関連メトリクスの存在を確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('GPUUtilization');
    });

    it('should handle services with auto scaling configuration', async () => {
      const resource: ECSService = {
        Type: 'AWS::ECS::Service',
        LogicalId: 'AutoScalingService',
        Properties: {
          LaunchType: 'FARGATE',
          DesiredCount: 10,
          ServiceName: 'auto-scaling-service'
        }
      };

      const metrics = await generator.generate(resource);
      
      // オートスケーリング対応のメトリクス確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('TaskCount');
      expect(metricNames).toContain('RunningCount');
      expect(metricNames).toContain('PendingCount');
      
      // スケーリングメトリクスは重要度が高い
      const taskCount = metrics.find(m => m.metric_name === 'TaskCount');
      expect(taskCount?.importance).toBe('High');
    });
  });
});