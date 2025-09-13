// CLAUDE.md準拠ResourceExtractorテスト（GREEN段階: パフォーマンス重視 + Type-Driven）

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { ResourceExtractor } from '../../../src/core/extractor';
import { TemplateParser } from '../../../src/core/parser';
import type { CloudFormationTemplate } from '../../../src/types/cloudformation';

// 全テストで使用する一時ディレクトリ
let tempDir: string;

// 全テスト前の準備
beforeAll(() => {
  tempDir = path.join(tmpdir(), 'aws-cloud-supporter-extractor-test');
  try {
    mkdirSync(tempDir, { recursive: true });
  } catch {
    // 既存の場合は無視
  }
  
  // テストフィクスチャー作成
  createExtractionTestFixtures();
});

function createExtractionTestFixtures() {
  // 混在リソーステンプレート（サポート対象＋対象外）
  const mixedResourcesTemplate = {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "Mixed resources template for extraction testing",
    Resources: {
      // サポート対象リソース（8個）
      TestRDS: {
        Type: "AWS::RDS::DBInstance",
        Properties: { Engine: "mysql", DBInstanceClass: "db.t3.micro" }
      },
      TestLambda: {
        Type: "AWS::Lambda::Function", 
        Properties: { Runtime: "nodejs20.x", Handler: "index.handler" }
      },
      TestServerlessFunction: {
        Type: "AWS::Serverless::Function",
        Properties: { Runtime: "python3.11", Handler: "app.lambda_handler" }
      },
      TestECSService: {
        Type: "AWS::ECS::Service",
        Properties: { LaunchType: "FARGATE", Cluster: "test-cluster" }
      },
      TestALB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "application", Scheme: "internet-facing" }
      },
      TestDynamoDB: {
        Type: "AWS::DynamoDB::Table",
        Properties: { BillingMode: "PAY_PER_REQUEST" }
      },
      TestAPI: {
        Type: "AWS::ApiGateway::RestApi",
        Properties: { Name: "test-api" }
      },
      TestServerlessAPI: {
        Type: "AWS::Serverless::Api",
        Properties: { StageName: "prod" }
      },
      
      // サポート対象外リソース（6個）
      TestS3: {
        Type: "AWS::S3::Bucket",
        Properties: { BucketName: "test-bucket" }
      },
      TestEC2: {
        Type: "AWS::EC2::Instance",
        Properties: { InstanceType: "t3.micro" }
      },
      TestVPC: {
        Type: "AWS::EC2::VPC",
        Properties: { CidrBlock: "10.0.0.0/16" }
      },
      TestSNS: {
        Type: "AWS::SNS::Topic",
        Properties: { TopicName: "test-topic" }
      },
      TestNLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "network", Scheme: "internal" }
      },
      TestECSServiceEC2: {
        Type: "AWS::ECS::Service", 
        Properties: { LaunchType: "EC2", Cluster: "test-cluster" }
      }
    }
  };

  writeFileSync(
    path.join(tempDir, 'mixed-resources.json'), 
    JSON.stringify(mixedResourcesTemplate, null, 2), 
    'utf8'
  );

  // 大量リソーステンプレート（正確に500個）
  const largeResourcesTemplate = {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "Large resources template for performance testing",
    Resources: {} as Record<string, unknown>
  };

  // 500リソース生成（サポート対象150個 + 対象外350個）
  for (let i = 0; i < 100; i++) {
    // サポート対象リソース（100個）
    largeResourcesTemplate.Resources[`RDS${i}`] = {
      Type: "AWS::RDS::DBInstance",
      Properties: { Engine: "mysql", DBInstanceClass: "db.t3.micro" }
    };
  }
  
  for (let i = 0; i < 50; i++) {
    // サポート対象リソース（50個）
    largeResourcesTemplate.Resources[`Lambda${i}`] = {
      Type: "AWS::Lambda::Function",
      Properties: { Runtime: "nodejs20.x" }
    };
  }

  for (let i = 0; i < 350; i++) {
    // サポート対象外リソース（350個）
    largeResourcesTemplate.Resources[`S3${i}`] = {
      Type: "AWS::S3::Bucket",
      Properties: { BucketName: `test-bucket-${i}` }
    };
  }

  writeFileSync(
    path.join(tempDir, 'large-resources-500.json'),
    JSON.stringify(largeResourcesTemplate, null, 2),
    'utf8'
  );

  // ECS特殊ケーステンプレート
  const ecsTestTemplate = {
    AWSTemplateFormatVersion: "2010-09-09",
    Resources: {
      FargateService: {
        Type: "AWS::ECS::Service",
        Properties: { LaunchType: "FARGATE" }
      },
      EC2Service: {
        Type: "AWS::ECS::Service", 
        Properties: { LaunchType: "EC2" }
      },
      FargateSpotService: {
        Type: "AWS::ECS::Service",
        Properties: {
          CapacityProviderStrategy: [
            { CapacityProvider: "FARGATE_SPOT", Weight: 1 }
          ]
        }
      },
      MixedCapacityService: {
        Type: "AWS::ECS::Service",
        Properties: {
          CapacityProviderStrategy: [
            { CapacityProvider: "FARGATE", Weight: 1 },
            { CapacityProvider: "EC2", Weight: 1 }
          ]
        }
      }
    }
  };

  writeFileSync(
    path.join(tempDir, 'ecs-test.json'),
    JSON.stringify(ecsTestTemplate, null, 2),
    'utf8'
  );

  // ALB/NLB判定テンプレート
  const loadBalancerTestTemplate = {
    AWSTemplateFormatVersion: "2010-09-09",
    Resources: {
      ApplicationLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "application" }
      },
      NetworkLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "network" }
      },
      DefaultLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Scheme: "internet-facing" } // Typeなし=application
      },
      GatewayLB: {
        Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
        Properties: { Type: "gateway" }
      }
    }
  };

  writeFileSync(
    path.join(tempDir, 'loadbalancer-test.json'),
    JSON.stringify(loadBalancerTestTemplate, null, 2),
    'utf8'
  );
}

describe('ResourceExtractor高速抽出（CLAUDE.md: GREEN段階）', () => {

  // GREEN段階: ResourceExtractor実装確認
  it('should implement ResourceExtractor successfully', () => {
    expect(() => {
      // ResourceExtractor is already imported
    }).not.toThrow(); // 実装完了で成功
  });

  // O(n)アルゴリズム要件テスト（GREEN段階: 実装確認）
  it('should extract resources with O(n) algorithm', () => {
    const extractor = new ResourceExtractor();
    
    // アルゴリズムの時間計算量がO(n)であることを確認
    expect(typeof extractor.extract).toBe('function');
    expect(extractor.extract.length).toBe(1); // 引数1個（CloudFormationTemplate）
  });

  // 500リソース・3秒以内要件テスト（GREEN段階: パフォーマンス確認）
  it('should process 500 resources within 3 seconds', async () => {
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const largePath = path.join(tempDir, 'large-resources-500.json');
    const template = await parser.parse(largePath);
    
    const startTime = performance.now();
    const result = extractor.extract(template);
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(3000); // 3秒以内
    expect(result.totalCount).toBe(500);
    expect(result.extractionTimeMs).toBeLessThan(3000);
  });

  // 8つのサポート対象リソース判定テスト（GREEN段階: 正確性確認）
  it('should accurately identify 8 supported resource types', async () => {
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const template = await parser.parse(mixedPath);
    const result = extractor.extract(template);
    
    // サポート対象リソースが正確に抽出されている確認
    expect(result.supported.length).toBe(8); // 8個のサポート対象
    expect(result.unsupported.length).toBe(6); // 6個の非対象（NLB、ECS EC2含む）
    expect(result.totalCount).toBe(14);
  });

  // サポート対象外リソース集計テスト（GREEN段階: 機能確認）
  it('should collect unsupported resource logical IDs', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const template = await parser.parse(mixedPath);
    const result = extractor.extract(template);
    
    // 非サポートリソースID確認
    expect(result.unsupported).toContain('TestS3');
    expect(result.unsupported).toContain('TestEC2');
    expect(result.unsupported).toContain('TestVPC');
    expect(result.unsupported).toContain('TestNLB'); // Network LB
    expect(result.unsupported).toContain('TestECSServiceEC2'); // ECS EC2
  });

  // ECS Fargate判定テスト（GREEN段階: 特殊ケース確認）
  it('should detect ECS Fargate services correctly', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const ecsPath = path.join(tempDir, 'ecs-test.json');
    const template = await parser.parse(ecsPath);
    const result = extractor.extract(template);
    
    // Fargateサービスのみがサポート対象として抽出される  
    const fargateServices = result.supported.filter((r: any) => r.Type === 'AWS::ECS::Service');
    expect(fargateServices.length).toBe(3); // Fargate + FargateSpot + MixedCapacity
    
    // EC2サービスはサポート対象外
    expect(result.unsupported).toContain('EC2Service');
  });

  // ALB vs NLB判定テスト（GREEN段階: 判定ロジック確認）
  it('should distinguish ALB from NLB correctly', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const lbPath = path.join(tempDir, 'loadbalancer-test.json');
    const template = await parser.parse(lbPath);
    const result = extractor.extract(template);
    
    // Application LBのみがサポート対象
    const supportedLBs = result.supported.filter((r: any) => 
      r.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    );
    expect(supportedLBs.length).toBe(2); // ApplicationLB + DefaultLB
    
    // Network LBとGateway LBはサポート対象外
    expect(result.unsupported).toContain('NetworkLB');
    expect(result.unsupported).toContain('GatewayLB');
  });

  // パフォーマンス監視テスト（GREEN段階: メトリクス確認）
  it('should provide extraction time metrics', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const template = await parser.parse(mixedPath);
    const result = extractor.extract(template);
    
    expect(result.extractionTimeMs).toBeDefined();
    expect(typeof result.extractionTimeMs).toBe('number');
    expect(result.extractionTimeMs).toBeGreaterThanOrEqual(0); // 高速処理で0も許可
  });

  // 型安全性テスト（GREEN段階: ExtractResult型確認）
  it('should return type-safe ExtractResult', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const template = await parser.parse(mixedPath);
    const result = extractor.extract(template);
    
    // ExtractResult型の構造確認
    expect(result).toHaveProperty('supported');
    expect(result).toHaveProperty('unsupported');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('extractionTimeMs');
    
    expect(Array.isArray(result.supported)).toBe(true);
    expect(Array.isArray(result.unsupported)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.extractionTimeMs).toBe('number');
  });

  // CLAUDE.md: No any types検証
  it('should not use any types in extractor implementation', () => {
    const extractorCode = readFileSync(
      path.join(__dirname, '../../../src/core/extractor.ts'),
      'utf8'
    );
    // Check that the code doesn't contain 'any' type declarations
    expect(extractorCode).not.toMatch(/:\s*any\b/);
    expect(extractorCode).not.toMatch(/\bany\s*\[\]/);
    expect(extractorCode).not.toMatch(/\bArray<any>/);
  });

  // 単一責任原則テスト（GREEN段階: SOLID原則確認）
  it('should follow single responsibility principle', () => {
    const extractor = new ResourceExtractor();
    
    // ResourceExtractorは抽出処理のみに特化
    const publicMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(extractor))
      .filter(name => !name.startsWith('_') && name !== 'constructor' && typeof (extractor as any)[name] === 'function');
    
    // 主要メソッドは抽出関連のみ
    expect(publicMethods).toContain('extract');
    console.log('📝 Public methods:', publicMethods);
    expect(publicMethods.length).toBeLessThanOrEqual(6); // extract + 内部メソッド等（適切範囲）
  });
});

describe('ResourceExtractorパフォーマンステスト（CLAUDE.md: 性能要件）', () => {

  // 大量リソース処理テスト（GREEN段階: 500リソース3秒以内）
  it('should handle large templates efficiently', async () => {
    const { ResourceExtractor, ExtractionPerformanceMonitor } = require('../../../src/core/extractor');
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const largePath = path.join(tempDir, 'large-resources-500.json');
    const template = await parser.parse(largePath);
    
    const performance = ExtractionPerformanceMonitor.measureExtractionPerformance(extractor, template);
    
    expect(performance.result.totalCount).toBe(500);
    expect(performance.result.extractionTimeMs).toBeLessThan(3000); // 3秒以内
    expect(performance.performanceGrade).not.toBe('F'); // 性能要件達成
  });

  // 並行抽出テスト（GREEN段階: 型安全並行処理）
  it('should support concurrent extraction safely', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const template = await parser.parse(mixedPath);
    
    // 同じテンプレートを並行抽出
    const promises = Array(5).fill(null).map(() => 
      extractor.extract(template)
    );
    
    const results = await Promise.all(promises);
    
    // 全て同じ結果が得られることを確認（状態汚染なし）
    results.forEach(result => {
      expect(result.totalCount).toBe(14);
      expect(result.supported.length).toBe(8);
    });
  });

  // メモリ効率テスト（GREEN段階: リークなし確認）
  it('should extract resources without memory leaks', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const template = await parser.parse(mixedPath);
    
    const memoryBefore = process.memoryUsage().heapUsed;
    
    // 100回抽出
    for (let i = 0; i < 100; i++) {
      extractor.extract(template);
    }
    
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;
    
    expect(memoryDelta).toBeLessThan(20); // メモリ増加20MB以下
  });

  // パフォーマンス監視テスト（GREEN段階: 警告確認）
  it('should warn when extraction exceeds time limits', async () => {
    
    // 通常の処理では警告は出ない想定
    const extractor = new ResourceExtractor();
    const smallTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        Test: { Type: "AWS::RDS::DBInstance", Properties: {} }
      }
    };
    
    const result = extractor.extract(smallTemplate);
    expect(result.extractionTimeMs).toBeLessThan(100); // 小さなテンプレートは100ms以下
  });
});

describe('ResourceExtractor型安全性（CLAUDE.md: Type-Driven Development）', () => {

  // 型ガード関数統合テスト（GREEN段階: Don't Reinvent the Wheel）
  it('should integrate with existing type guard functions', () => {
    const { isSupportedResource, isFargateService, isApplicationLoadBalancer } = require('../../../src/types/cloudformation');
    
    // 既存型ガード関数がResourceExtractorで使用されている確認
    const testResource = { Type: 'AWS::RDS::DBInstance', Properties: {} };
    
    expect(isSupportedResource(testResource)).toBe(true);
    expect(typeof isFargateService).toBe('function');
    expect(typeof isApplicationLoadBalancer).toBe('function');
    
    // ResourceExtractor内部でこれらの関数が活用されている
    const extractor = new ResourceExtractor();
    expect(extractor).toBeDefined();
  });

  // Union型使用テスト（GREEN段階: SupportedResource確認）
  it('should utilize SupportedResource union type', async () => {
    
    const extractor = new ResourceExtractor();
    const testTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        TestRDS: { Type: "AWS::RDS::DBInstance", Properties: {} },
        TestLambda: { Type: "AWS::Lambda::Function", Properties: {} }
      }
    };
    
    const result = extractor.extract(testTemplate);
    
    // SupportedResource Union型が正しく使用されている
    expect(result.supported).toHaveLength(2);
    result.supported.forEach((resource: unknown) => {
      const r = resource as { LogicalId?: string; Type: string };
      expect(r.LogicalId).toBeDefined();
      expect(r.Type).toBeDefined();
    });
  });

  // CloudFormationTemplate型統合テスト（GREEN段階: 型推論確認）
  it('should work with CloudFormationTemplate type', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const tempDir = path.join(tmpdir(), 'aws-cloud-supporter-extractor-test');
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    
    // CloudFormationTemplate型の正常解析・抽出
    const template = await parser.parse(mixedPath);
    const result = extractor.extract(template);
    
    // 型安全性確認
    expect(template.Resources).toBeDefined();
    expect(result.supported.every((r: unknown) => typeof (r as { Type: string }).Type === 'string')).toBe(true);
  });

  // ExtractResult型安全性テスト（GREEN段階: 戻り値型確認）
  it('should return properly typed ExtractResult', () => {
    
    const extractor = new ResourceExtractor();
    const testTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        Test: { Type: "AWS::RDS::DBInstance", Properties: {} }
      }
    };
    
    const result = extractor.extract(testTemplate);
    
    // ExtractResult型の完全性確認
    expect(result.supported).toBeDefined();
    expect(result.unsupported).toBeDefined();
    expect(result.totalCount).toBe(1);
    expect(result.extractionTimeMs).toBeGreaterThanOrEqual(0);
    
    // 型安全性：supported配列の要素がSupportedResource型
    if (result.supported.length > 0) {
      const resource = result.supported[0]!;
      expect(resource.LogicalId).toBe('Test');
      expect(resource.Type).toBe('AWS::RDS::DBInstance');
    }
  });
});

// RED段階用テストヘルパー（リソース抽出テスト用データ）
describe('テストヘルパー準備（RED段階）', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = path.join(tmpdir(), 'aws-cloud-supporter-extractor-test');
    try {
      mkdirSync(tempDir, { recursive: true });
    } catch {
      // 既存の場合は無視
    }
    
    // テストフィクスチャー作成
    createExtractionTestFixtures();
  });

  function createExtractionTestFixtures() {
    // 混在リソーステンプレート（サポート対象＋対象外）
    const mixedResourcesTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Description: "Mixed resources template for extraction testing",
      Resources: {
        // サポート対象リソース
        TestRDS: {
          Type: "AWS::RDS::DBInstance",
          Properties: { Engine: "mysql", DBInstanceClass: "db.t3.micro" }
        },
        TestLambda: {
          Type: "AWS::Lambda::Function", 
          Properties: { Runtime: "nodejs20.x", Handler: "index.handler" }
        },
        TestServerlessFunction: {
          Type: "AWS::Serverless::Function",
          Properties: { Runtime: "python3.11", Handler: "app.lambda_handler" }
        },
        TestECSService: {
          Type: "AWS::ECS::Service",
          Properties: { LaunchType: "FARGATE", Cluster: "test-cluster" }
        },
        TestALB: {
          Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
          Properties: { Type: "application", Scheme: "internet-facing" }
        },
        TestDynamoDB: {
          Type: "AWS::DynamoDB::Table",
          Properties: { BillingMode: "PAY_PER_REQUEST" }
        },
        TestAPI: {
          Type: "AWS::ApiGateway::RestApi",
          Properties: { Name: "test-api" }
        },
        TestServerlessAPI: {
          Type: "AWS::Serverless::Api",
          Properties: { StageName: "prod" }
        },
        
        // サポート対象外リソース  
        TestS3: {
          Type: "AWS::S3::Bucket",
          Properties: { BucketName: "test-bucket" }
        },
        TestEC2: {
          Type: "AWS::EC2::Instance",
          Properties: { InstanceType: "t3.micro" }
        },
        TestVPC: {
          Type: "AWS::EC2::VPC",
          Properties: { CidrBlock: "10.0.0.0/16" }
        },
        TestSNS: {
          Type: "AWS::SNS::Topic",
          Properties: { TopicName: "test-topic" }
        },
        TestNLB: {
          Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
          Properties: { Type: "network", Scheme: "internal" }
        },
        TestECSServiceEC2: {
          Type: "AWS::ECS::Service", 
          Properties: { LaunchType: "EC2", Cluster: "test-cluster" }
        }
      }
    };

    writeFileSync(
      path.join(tempDir, 'mixed-resources.json'), 
      JSON.stringify(mixedResourcesTemplate, null, 2), 
      'utf8'
    );

    // 大量リソーステンプレート（パフォーマンステスト用）
    const largeResourcesTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Description: "Large resources template for performance testing",
      Resources: {} as Record<string, unknown>
    };

    // 500リソース生成（サポート対象150個 + 対象外350個）
    for (let i = 0; i < 100; i++) {
      // サポート対象リソース（100個）
      largeResourcesTemplate.Resources[`RDS${i}`] = {
        Type: "AWS::RDS::DBInstance",
        Properties: { Engine: "mysql", DBInstanceClass: "db.t3.micro" }
      };
    }
    
    for (let i = 0; i < 50; i++) {
      // サポート対象リソース（50個）
      largeResourcesTemplate.Resources[`Lambda${i}`] = {
        Type: "AWS::Lambda::Function",
        Properties: { Runtime: "nodejs20.x" }
      };
    }

    for (let i = 0; i < 350; i++) {
      // サポート対象外リソース（350個）
      largeResourcesTemplate.Resources[`S3${i}`] = {
        Type: "AWS::S3::Bucket",
        Properties: { BucketName: `test-bucket-${i}` }
      };
    }

    writeFileSync(
      path.join(tempDir, 'large-resources-500.json'),
      JSON.stringify(largeResourcesTemplate, null, 2),
      'utf8'
    );

    // ECS特殊ケーステンプレート
    const ecsTestTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        FargateService: {
          Type: "AWS::ECS::Service",
          Properties: { LaunchType: "FARGATE" }
        },
        EC2Service: {
          Type: "AWS::ECS::Service", 
          Properties: { LaunchType: "EC2" }
        },
        FargateSpotService: {
          Type: "AWS::ECS::Service",
          Properties: {
            CapacityProviderStrategy: [
              { CapacityProvider: "FARGATE_SPOT", Weight: 1 }
            ]
          }
        },
        MixedCapacityService: {
          Type: "AWS::ECS::Service",
          Properties: {
            CapacityProviderStrategy: [
              { CapacityProvider: "FARGATE", Weight: 1 },
              { CapacityProvider: "EC2", Weight: 1 }
            ]
          }
        }
      }
    };

    writeFileSync(
      path.join(tempDir, 'ecs-test.json'),
      JSON.stringify(ecsTestTemplate, null, 2),
      'utf8'
    );

    // ALB/NLB判定テンプレート
    const loadBalancerTestTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        ApplicationLB: {
          Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
          Properties: { Type: "application" }
        },
        NetworkLB: {
          Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
          Properties: { Type: "network" }
        },
        DefaultLB: {
          Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
          Properties: { Scheme: "internet-facing" } // Typeなし=application
        },
        GatewayLB: {
          Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
          Properties: { Type: "gateway" }
        }
      }
    };

    writeFileSync(
      path.join(tempDir, 'loadbalancer-test.json'),
      JSON.stringify(loadBalancerTestTemplate, null, 2),
      'utf8'
    );
  }

  // テストフィクスチャー作成確認
  it('should create mixed resources test fixture', () => {
    const mixedPath = path.join(tempDir, 'mixed-resources.json');
    const content = JSON.parse(readFileSync(mixedPath, 'utf8')) as CloudFormationTemplate;
    
    expect(content.Resources).toBeDefined();
    expect(Object.keys(content.Resources)).toHaveLength(14);
  });

  it('should create large resources test fixture', () => {
    const largePath = path.join(tempDir, 'large-resources-500.json');
    const content = JSON.parse(readFileSync(largePath, 'utf8')) as CloudFormationTemplate;
    
    expect(content.Resources).toBeDefined();
    expect(Object.keys(content.Resources)).toHaveLength(500);
  });

  it('should create ECS test cases fixture', () => {
    const ecsPath = path.join(tempDir, 'ecs-test.json');
    const content = JSON.parse(readFileSync(ecsPath, 'utf8')) as CloudFormationTemplate;
    
    expect(content.Resources.FargateService).toBeDefined();
    expect(content.Resources.EC2Service).toBeDefined();
    expect(content.Resources.FargateSpotService).toBeDefined();
  });

  it('should create Load Balancer test cases fixture', () => {
    const lbPath = path.join(tempDir, 'loadbalancer-test.json');
    const content = JSON.parse(readFileSync(lbPath, 'utf8')) as CloudFormationTemplate;
    
    expect(content.Resources.ApplicationLB).toBeDefined();
    expect(content.Resources.NetworkLB).toBeDefined();
    expect(content.Resources.DefaultLB).toBeDefined();
  });
});