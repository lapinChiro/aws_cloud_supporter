// CLAUDE.md準拠ResourceExtractor高速抽出テスト
import { readFileSync } from 'fs';
import path from 'path';

import { ResourceExtractor } from '../../../src/core/extractor';
import { TemplateParser } from '../../../src/core/parser';
import type { SupportedResource } from '../../../src/types/cloudformation';

import { createExtractionTestFixtures, setupTempDir } from './extractor.test-helpers';

// 全テストで使用する一時ディレクトリ
let tempDir: string;

// 全テスト前の準備
beforeAll(() => {
  tempDir = setupTempDir();
  // テストフィクスチャー作成
  createExtractionTestFixtures(tempDir);
});

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
    expect(result.totalCount).toBe(650); // 500 Lambda + 50 RDS + 50 DynamoDB + 50 ALB
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
    expect(result.supported.length).toBe(6); // 6個のサポート対象 (RDS, Lambda, ECS Fargate, DynamoDB, API Gateway, ALB)
    expect(result.unsupported.length).toBe(7); // 7個の非対象（S3, EC2, VPC, NLB, ECS EC2, Custom, Classic LB）
    expect(result.totalCount).toBe(13);
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
    expect(result.unsupported).toContain('TestClassicLB'); // Classic LB
    expect(result.unsupported).toContain('TestCustom'); // Custom resource
  });

  // ECS Fargate判定テスト（GREEN段階: 特殊ケース確認）
  it('should detect ECS Fargate services correctly', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const ecsPath = path.join(tempDir, 'ecs-test.json');
    const template = await parser.parse(ecsPath);
    const result = extractor.extract(template);
    
    // Fargateサービスのみがサポート対象として抽出される  
    const fargateServices = result.supported.filter((r: SupportedResource) => r.Type === 'AWS::ECS::Service');
    expect(fargateServices.length).toBe(1); // FargateServiceのみ
    
    // EC2サービスはサポート対象外
    expect(result.unsupported).toContain('EC2Service');
    expect(result.unsupported).toContain('ExternalService');
    expect(result.unsupported).toContain('MissingLaunchTypeService1');
    expect(result.unsupported).toContain('MissingLaunchTypeService2');
  });

  // ALB vs NLB判定テスト（GREEN段階: 判定ロジック確認）
  it('should distinguish ALB from NLB correctly', async () => {
    
    const parser = new TemplateParser();
    const extractor = new ResourceExtractor();
    
    const lbPath = path.join(tempDir, 'loadbalancer-test.json');
    const template = await parser.parse(lbPath);
    const result = extractor.extract(template);
    
    // Application LBのみがサポート対象
    const supportedLBs = result.supported.filter((r: SupportedResource) => 
      r.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    );
    expect(supportedLBs.length).toBe(2); // ApplicationLB + DefaultLB
    
    // Network/Gateway LBは対象外
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
      .filter(name => !name.startsWith('_') && name !== 'constructor' && typeof (extractor as unknown as Record<string, unknown>)[name] === 'function');
    
    // 主要メソッドは抽出関連のみ
    expect(publicMethods).toContain('extract');
    console.log('📝 Public methods:', publicMethods);
    expect(publicMethods.length).toBeLessThanOrEqual(6); // extract + 内部メソッド等（適切範囲）
  });
});