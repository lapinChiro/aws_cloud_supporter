// MetricsAnalyzer統合テスト - Generator統合
// CLAUDE.md準拠: No any types、TDD実践

import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

import { dump } from 'js-yaml';

import type { CloudFormationTemplate } from '../../src/types/cloudformation';

import {
  createTestAnalyzer,
  createTestTemplate
} from './metrics-analyzer.integration.test-helpers';

describe('MetricsAnalyzer Integration - Real Generator', () => {
  const analyzer = createTestAnalyzer();
  const testTemplate = createTestTemplate();

  it('should generate metrics for all 6 resource types', async () => {
    // 一時ファイルとしてテンプレートを保存
    const tempPath = path.join(__dirname, 'test-template.yaml');
    await fs.writeFile(tempPath, dump(testTemplate));
    
    try {
      const result = await analyzer.analyze(tempPath, {
        outputFormat: 'json'
      });
      
      // 結果検証
      expect(result.metadata.total_resources).toBe(6);
      expect(result.metadata.supported_resources).toBe(6);
      expect(result.resources).toHaveLength(6);
      expect(result.unsupported_resources).toEqual([]);
      
      // 各リソースのメトリクスを検証
      const resourceTypes = result.resources.map(r => r.resource_type);
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::ECS::Service');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::ApiGateway::RestApi');
      
      // メトリクス数を検証（実際の定義に基づく）
      const rdsResource = result.resources.find(r => r.resource_type === 'AWS::RDS::DBInstance');
      expect(rdsResource?.metrics.length).toBeGreaterThanOrEqual(15); // MySQL固有メトリクス含む
      
      const lambdaResource = result.resources.find(r => r.resource_type === 'AWS::Lambda::Function');
      expect(lambdaResource?.metrics.length).toBeGreaterThanOrEqual(10);
      
      // セキュリティ: パスワードがサニタイズされているか確認
      expect(rdsResource?.resource_properties.MasterUserPassword).toBe('[REDACTED]');
      
    } finally {
      // クリーンアップ
      await fs.unlink(tempPath);
    }
  });

  it('should handle large templates efficiently', async () => {
    // 100リソースのテンプレート作成
    const largeTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {}
    };
    
    for (let i = 0; i < 100; i++) {
      const resourceType = ['AWS::RDS::DBInstance', 'AWS::Lambda::Function', 
                          'AWS::ECS::Service', 'AWS::DynamoDB::Table'][i % 4] ?? 'AWS::RDS::DBInstance';
      
      let properties = {};
      if (resourceType === 'AWS::ECS::Service') {
        properties = { LaunchType: 'FARGATE' }; // Ensure ECS services are Fargate
      }
      
      largeTemplate.Resources[`Resource${i}`] = {
        Type: resourceType,
        Properties: properties
      };
    }
    
    const tempPath = path.join(__dirname, 'large-template.yaml');
    await fs.writeFile(tempPath, dump(largeTemplate));
    
    try {
      const startTime = performance.now();
      const result = await analyzer.analyze(tempPath, {
        outputFormat: 'json',
        concurrency: 6
      });
      const duration = performance.now() - startTime;
      
      // パフォーマンス検証
      expect(duration).toBeLessThan(30000); // 30秒以内
      expect(result.metadata.processing_time_ms).toBeLessThan(30000);
      
      // 結果検証
      expect(result.metadata.total_resources).toBe(100);
      expect(result.metadata.supported_resources).toBe(100);
      expect(result.resources).toHaveLength(100);
      
      // メトリクス総数確認
      const totalMetrics = result.resources.reduce((sum, r) => sum + r.metrics.length, 0);
      console.log(`Total metrics generated: ${totalMetrics} for 100 resources in ${duration.toFixed(0)}ms`);
      expect(totalMetrics).toBeGreaterThan(1000); // 少なくとも1000個以上のメトリクス
      
    } finally {
      await fs.unlink(tempPath);
    }
  });

  it('should respect memory limits', async () => {
    const tempPath = path.join(__dirname, 'memory-test.yaml');
    await fs.writeFile(tempPath, dump(testTemplate));
    
    try {
      // 非常に低いメモリ制限を設定
      const lowLimit = 1 * 1024 * 1024; // 1MB（すぐに超過するはず）
      
      await expect(analyzer.analyze(tempPath, {
        outputFormat: 'json',
        memoryLimit: lowLimit
      })).rejects.toThrow('Memory usage already exceeds limit');
      
    } finally {
      await fs.unlink(tempPath);
    }
  });

  it('should handle mixed supported/unsupported resources', async () => {
    const mixedTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        SupportedDB: {
          Type: 'AWS::RDS::DBInstance',
          Properties: {
            DBInstanceClass: 'db.t3.medium'
          }
        },
        SupportedFunction: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Runtime: 'nodejs18.x'
          }
        },
        UnsupportedBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: 'test-bucket'
          }
        },
        UnsupportedVpc: {
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: '10.0.0.0/16'
          }
        }
      }
    };
    
    const tempPath = path.join(__dirname, 'mixed-template.yaml');
    await fs.writeFile(tempPath, dump(mixedTemplate));
    
    try {
      const result = await analyzer.analyze(tempPath, {
        outputFormat: 'json'
      });
      
      // 結果検証
      expect(result.metadata.total_resources).toBe(4);
      expect(result.metadata.supported_resources).toBe(2);
      expect(result.resources).toHaveLength(2);
      expect(result.unsupported_resources).toHaveLength(2);
      expect(result.unsupported_resources).toContain('UnsupportedBucket');
      expect(result.unsupported_resources).toContain('UnsupportedVpc');
      
      // サポートされているリソースはメトリクスを持つ
      expect(result.resources.every(r => r.metrics.length > 0)).toBe(true);
      
    } finally {
      await fs.unlink(tempPath);
    }
  });
});