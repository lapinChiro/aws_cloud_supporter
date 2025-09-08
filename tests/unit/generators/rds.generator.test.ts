import { RDSMetricsGenerator } from '../../../src/generators/rds.generator';
import { CloudFormationResource, RDSDBInstance } from '../../../src/types/cloudformation';
import { MetricDefinition } from '../../../src/types/metrics';
import { ILogger } from '../../../src/utils/logger';

describe('RDSMetricsGenerator', () => {
  let generator: RDSMetricsGenerator;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      success: jest.fn()
    };
    generator = new RDSMetricsGenerator(mockLogger);
  });

  describe('getSupportedTypes', () => {
    it('should return AWS::RDS::DBInstance', () => {
      const types = generator.getSupportedTypes();
      expect(types).toEqual(['AWS::RDS::DBInstance']);
    });
  });

  describe('generate', () => {
    it('should generate base RDS metrics for db.t3.micro instance', async () => {
      const resource: RDSDBInstance = {
        Type: 'AWS::RDS::DBInstance',
        LogicalId: 'TestDB',
        Properties: {
          DBInstanceClass: 'db.t3.micro',
          Engine: 'mysql',
          AllocatedStorage: 20
        }
      };

      const metrics = await generator.generate(resource);
      
      // メトリクス数の確認（最低20個）
      expect(metrics.length).toBeGreaterThanOrEqual(20);
      
      // 必須メトリクスの存在確認
      const metricNames = metrics.map(m => m.metric_name);
      expect(metricNames).toContain('CPUUtilization');
      expect(metricNames).toContain('DatabaseConnections');
      expect(metricNames).toContain('ReadLatency');
      expect(metricNames).toContain('WriteLatency');
      expect(metricNames).toContain('FreeStorageSpace');
      
      // しきい値検証（スケール係数0.5適用）
      const cpuMetric = metrics.find(m => m.metric_name === 'CPUUtilization');
      expect(cpuMetric?.recommended_threshold.warning).toBe(35); // 70 * 0.5 * 1.0
      expect(cpuMetric?.recommended_threshold.critical).toBe(46); // 70 * 0.5 * 1.3（四捨五入）
    });

    it('should generate metrics with higher thresholds for db.m5.xlarge instance', async () => {
      const resource: RDSDBInstance = {
        Type: 'AWS::RDS::DBInstance',
        LogicalId: 'ProdDB',
        Properties: {
          DBInstanceClass: 'db.m5.xlarge',
          Engine: 'postgresql',
          AllocatedStorage: 100
        }
      };

      const metrics = await generator.generate(resource);
      
      // しきい値検証（スケール係数2.0適用）
      const cpuMetric = metrics.find(m => m.metric_name === 'CPUUtilization');
      expect(cpuMetric?.recommended_threshold.warning).toBe(140); // 70 * 2.0 * 1.0
      expect(cpuMetric?.recommended_threshold.critical).toBe(182); // 70 * 2.0 * 1.3
    });

    it('should include BinLogDiskUsage for MySQL with backup retention', async () => {
      const resource: RDSDBInstance = {
        Type: 'AWS::RDS::DBInstance',
        LogicalId: 'MySQLDB',
        Properties: {
          DBInstanceClass: 'db.t3.medium',
          Engine: 'mysql',
          BackupRetentionPeriod: 7
        }
      };

      const metrics = await generator.generate(resource);
      const binLogMetric = metrics.find(m => m.metric_name === 'BinLogDiskUsage');
      
      expect(binLogMetric).toBeDefined();
      expect(binLogMetric?.unit).toBe('Bytes');
      expect(binLogMetric?.importance).toBe('Medium');
    });

    it('should exclude BinLogDiskUsage for PostgreSQL', async () => {
      const resource: RDSDBInstance = {
        Type: 'AWS::RDS::DBInstance',
        LogicalId: 'PostgresDB',
        Properties: {
          DBInstanceClass: 'db.t3.medium',
          Engine: 'postgresql',
          BackupRetentionPeriod: 7
        }
      };

      const metrics = await generator.generate(resource);
      const binLogMetric = metrics.find(m => m.metric_name === 'BinLogDiskUsage');
      
      expect(binLogMetric).toBeUndefined();
    });

    it('should handle unknown instance classes with default scale', async () => {
      const resource: RDSDBInstance = {
        Type: 'AWS::RDS::DBInstance',
        LogicalId: 'FutureDB',
        Properties: {
          DBInstanceClass: 'db.future.large',
          Engine: 'mysql'
        }
      };

      const metrics = await generator.generate(resource);
      
      // デフォルトスケール係数1.0適用
      const cpuMetric = metrics.find(m => m.metric_name === 'CPUUtilization');
      expect(cpuMetric?.recommended_threshold.warning).toBe(70);
      expect(cpuMetric?.recommended_threshold.critical).toBe(91);
    });

    it('should generate proper dimensions for all metrics', async () => {
      const resource: RDSDBInstance = {
        Type: 'AWS::RDS::DBInstance',
        LogicalId: 'TestDB',
        Properties: {
          DBInstanceClass: 'db.t3.micro',
          Engine: 'mysql'
        }
      };

      const metrics = await generator.generate(resource);
      
      for (const metric of metrics) {
        expect(metric.dimensions).toBeDefined();
        expect(metric.dimensions?.length).toBeGreaterThan(0);
        expect(metric.dimensions?.[0].name).toBe('DBInstanceIdentifier');
        expect(metric.dimensions?.[0].value).toBe('TestDB');
      }
    });

    it('should measure performance and complete within 1 second', async () => {
      const resource: RDSDBInstance = {
        Type: 'AWS::RDS::DBInstance',
        LogicalId: 'PerfTestDB',
        Properties: {
          DBInstanceClass: 'db.m5.large',
          Engine: 'mysql',
          MultiAZ: true,
          BackupRetentionPeriod: 7
        }
      };

      const startTime = performance.now();
      await generator.generate(resource);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Generated \d+ metrics for PerfTestDB in [\d.]+ms/)
      );
    });
  });
});