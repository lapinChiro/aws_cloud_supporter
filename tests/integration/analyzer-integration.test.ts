// MetricsAnalyzer統合テスト（実際のGeneratorとの結合）
// CLAUDE.md準拠: No any types、TDD実践

import { MetricsAnalyzer } from '../../src/core/analyzer';
import { TemplateParser } from '../../src/core/parser';
import { JSONOutputFormatter } from '../../src/core/json-formatter';
import { HTMLOutputFormatter } from '../../src/core/html-formatter';
import { Logger } from '../../src/utils/logger';
import { CloudFormationTemplate } from '../../src/types/cloudformation';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { dump } from 'js-yaml';

describe('MetricsAnalyzer Integration Tests', () => {
  let analyzer: MetricsAnalyzer;
  let testTemplate: CloudFormationTemplate;
  
  beforeAll(async () => {
    // 実際のコンポーネントでAnalyzerを初期化
    const parser = new TemplateParser();
    const logger = new Logger();
    
    analyzer = new MetricsAnalyzer(parser, logger);
    
    // テスト用テンプレートを作成
    testTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        Database: {
          Type: 'AWS::RDS::DBInstance',
          Properties: {
            DBInstanceClass: 'db.t3.medium',
            Engine: 'mysql',
            DBInstanceIdentifier: 'test-db',
            MasterUserPassword: 'secret123',  // サニタイズテスト用
            AllocatedStorage: '100'
          }
        },
        Function: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Runtime: 'nodejs18.x',
            MemorySize: 512,
            FunctionName: 'test-function',
            Timeout: 300
          }
        },
        Service: {
          Type: 'AWS::ECS::Service',
          Properties: {
            LaunchType: 'FARGATE',
            DesiredCount: 2,
            Cpu: '1024',
            Memory: '2048'
          }
        },
        LoadBalancer: {
          Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
          Properties: {
            Type: 'application',
            Scheme: 'internet-facing',
            IpAddressType: 'ipv4'
          }
        },
        Table: {
          Type: 'AWS::DynamoDB::Table',
          Properties: {
            BillingMode: 'PAY_PER_REQUEST',
            TableName: 'test-table',
            GlobalSecondaryIndexes: [{
              IndexName: 'GSI1',
              PartitionKey: { AttributeName: 'gsi1pk', KeyType: 'HASH' },
              Projection: { ProjectionType: 'ALL' }
            }]
          }
        },
        Api: {
          Type: 'AWS::ApiGateway::RestApi',
          Properties: {
            Name: 'test-api',
            EndpointConfiguration: { Types: ['REGIONAL'] },
            Tags: [{ Key: 'Environment', Value: 'Production' }]
          }
        }
      }
    };
  });
  
  describe('Real Generator Integration', () => {
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
                            'AWS::ECS::Service', 'AWS::DynamoDB::Table'][i % 4];
        largeTemplate.Resources[`Resource${i}`] = {
          Type: resourceType,
          Properties: {}
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
        })).rejects.toThrow('Memory usage exceeded');
        
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
            Properties: {}
          },
          UnsupportedCustom: {
            Type: 'Custom::MyResource',
            Properties: {}
          },
          UnsupportedParameter: {
            Type: 'AWS::SSM::Parameter',
            Properties: {}
          },
          SupportedFunction: {
            Type: 'AWS::Lambda::Function',
            Properties: { Runtime: 'nodejs18.x' }
          }
        }
      };
      
      const tempPath = path.join(__dirname, 'mixed-template.yaml');
      await fs.writeFile(tempPath, dump(mixedTemplate));
      
      try {
        const result = await analyzer.analyze(tempPath, {
          outputFormat: 'json'
        });
        
        expect(result.metadata.total_resources).toBe(4);
        expect(result.metadata.supported_resources).toBe(2);
        expect(result.resources).toHaveLength(2);
        expect(result.unsupported_resources).toContain('UnsupportedCustom');
        expect(result.unsupported_resources).toContain('UnsupportedParameter');
        
      } finally {
        await fs.unlink(tempPath);
      }
    });
    
    it('should generate condition-based metrics correctly', async () => {
      const conditionTemplate: CloudFormationTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          MySQLDB: {
            Type: 'AWS::RDS::DBInstance',
            Properties: {
              Engine: 'mysql',
              BackupRetentionPeriod: '7'  // BinLogMetricsが有効化されるはず
            }
          },
          TableWithGSI: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              BillingMode: 'PROVISIONED',
              GlobalSecondaryIndexes: [{
                IndexName: 'GSI1',
                PartitionKey: { AttributeName: 'pk', KeyType: 'HASH' }
              }]
            }
          }
        }
      };
      
      const tempPath = path.join(__dirname, 'condition-template.yaml');
      await fs.writeFile(tempPath, dump(conditionTemplate));
      
      try {
        const result = await analyzer.analyze(tempPath, {
          outputFormat: 'json',
          verbose: true
        });
        
        // MySQL BinLogメトリクスの確認
        const mysqlResource = result.resources.find(r => r.logical_id === 'MySQLDB');
        const binLogMetric = mysqlResource?.metrics.find(m => m.metric_name === 'BinLogDiskUsage');
        expect(binLogMetric).toBeDefined();
        
        // DynamoDB GSIメトリクスの確認
        const tableResource = result.resources.find(r => r.logical_id === 'TableWithGSI');
        const gsiMetrics = tableResource?.metrics.filter(m => 
          m.dimensions?.some(d => d.name === 'GlobalSecondaryIndexName')
        );
        expect(gsiMetrics?.length).toBeGreaterThan(0);
        
      } finally {
        await fs.unlink(tempPath);
      }
    });
  });
  
  describe('Output Format Integration', () => {
    it('should generate valid JSON output with formatter', async () => {
      const tempPath = path.join(__dirname, 'format-test.yaml');
      await fs.writeFile(tempPath, dump(testTemplate));
      
      try {
        const result = await analyzer.analyze(tempPath, {
          outputFormat: 'json'
        });
        
        // JSON形式の検証
        const jsonFormatter = new JSONOutputFormatter();
        const jsonOutput = await jsonFormatter.format(result);
        
        // JSON解析可能か確認
        const parsed = JSON.parse(jsonOutput);
        expect(parsed.metadata.version).toBe('1.0.0');
        expect(parsed.resources).toHaveLength(6);
        expect(parsed.metadata.template_path).toBe(tempPath);
        
      } finally {
        await fs.unlink(tempPath);
      }
    });
    
    it('should generate valid HTML output with formatter', async () => {
      const tempPath = path.join(__dirname, 'html-test.yaml');
      await fs.writeFile(tempPath, dump(testTemplate));
      
      try {
        const result = await analyzer.analyze(tempPath, {
          outputFormat: 'html'
        });
        
        // HTML形式の検証
        const htmlFormatter = new HTMLOutputFormatter();
        const htmlOutput = await htmlFormatter.format(result);
        
        // HTML基本構造確認
        expect(htmlOutput).toContain('<!DOCTYPE html>');
        expect(htmlOutput).toContain('CloudWatch Metrics Report');
        expect(htmlOutput).toContain('searchInput');
        expect(htmlOutput).toContain('importanceFilter');
        
      } finally {
        await fs.unlink(tempPath);
      }
    });
  });
  
  describe('Error Handling Integration', () => {
    it('should handle parse errors gracefully', async () => {
      const invalidPath = path.join(__dirname, 'invalid.yaml');
      await fs.writeFile(invalidPath, '{ invalid yaml content }}}');
      
      try {
        await expect(analyzer.analyze(invalidPath, {
          outputFormat: 'json'
        })).rejects.toThrow('Analysis failed');
        
      } finally {
        await fs.unlink(invalidPath);
      }
    });
    
    it('should handle non-existent files', async () => {
      await expect(analyzer.analyze('/non/existent/path.yaml', {
        outputFormat: 'json'
      })).rejects.toThrow();
    });
  });
});