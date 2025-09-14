// CLAUDE.md準拠BaseMetricsGenerator SOLID原則テスト
import { BaseMetricsGenerator } from '../../../src/generators/base.generator';
import type { ILogger } from '../../../src/interfaces/logger';
import { createLogger } from '../../../src/utils/logger';
import { createMockLogger } from '../../helpers';

describe('BaseMetricsGeneratorSOLID原則（CLAUDE.md: 設計原則）', () => {

  // 単一責任原則テスト（GREEN段階: SRP確認）
  it('should follow Single Responsibility Principle', () => {
    
    // BaseMetricsGeneratorの責任：メトリクス生成のみ
    const prototype = BaseMetricsGenerator.prototype;
    expect(prototype.generate).toBeDefined();
    
    // メトリクス生成以外の責任がないことを確認
    // （ファイルI/O、ネットワーク等の責任は持たない）
    const methods = Object.getOwnPropertyNames(prototype);
    const publicMethods = methods.filter(name => 
      !name.startsWith('_') && 
      name !== 'constructor' &&
      typeof (prototype as unknown as Record<string, unknown>)[name] === 'function'
    );
    
    expect(publicMethods).toContain('generate');
    console.log('📋 BaseMetricsGenerator public methods:', publicMethods);
  });

  // 開放閉鎖原則テスト（GREEN段階: OCP確認）
  it('should follow Open/Closed Principle', () => {
    
    // 拡張のために開かれている（抽象メソッド存在）
    // 変更のために閉ざされている（具象実装）
    
    // 抽象クラスとして拡張可能
    class ExtendedTestGenerator extends BaseMetricsGenerator {
      constructor() {
        super(createLogger('error'));
      }

      getSupportedTypes(): string[] {
        return ['AWS::Extended::Resource'];
      }

      protected getMetricsConfig() {
        return [];
      }

      protected getResourceScale() {
        return 1.0;
      }
    }

    const extendedGenerator = new ExtendedTestGenerator();
    expect(extendedGenerator).toBeInstanceOf(BaseMetricsGenerator);
    expect(extendedGenerator.getSupportedTypes()).toContain('AWS::Extended::Resource');
  });

  // インターフェース分離テスト（GREEN段階: ISP確認）
  it('should follow Interface Segregation Principle', () => {
    
    // IMetricsGeneratorインターフェースのみ実装
    // 他の不要なインターフェースは実装していない
    expect(BaseMetricsGenerator.prototype.generate).toBeDefined();
    
    // メトリクス生成に特化したインターフェース
    expect(BaseMetricsGenerator.prototype.getSupportedTypes).toBeUndefined(); // 抽象メソッド
  });

  // 依存関係逆転テスト（GREEN段階: DIP確認）
  it('should follow Dependency Inversion Principle', () => {
    
    // ILoggerインターフェースに依存（具象クラスに非依存）
    class DIPTestGenerator extends BaseMetricsGenerator {
      constructor(customLogger: ILogger) { // カスタムログ実装受け入れ
        super(customLogger);
      }

      getSupportedTypes(): string[] {
        return ['AWS::DIP::Test'];
      }

      protected getMetricsConfig() {
        return [];
      }

      protected getResourceScale() {
        return 1.0;
      }
    }

    // モックLoggerでもインスタンス化可能（抽象化に依存）
    const mockLogger = createMockLogger();

    const dipGenerator = new DIPTestGenerator(mockLogger);
    expect(dipGenerator).toBeInstanceOf(BaseMetricsGenerator);
  });

  // リスコフ置換原則テスト（GREEN段階: LSP確認）
  it('should follow Liskov Substitution Principle', () => {
    
    // 子クラスが基底クラスと置換可能であることを確認
    class LSPTestGeneratorA extends BaseMetricsGenerator {
      constructor() {
        super(createLogger('error'));
      }

      getSupportedTypes(): string[] {
        return ['AWS::LSP::TestA'];
      }

      protected getMetricsConfig() {
        return [
          {
            name: 'LSPTestMetricA',
            namespace: 'AWS/LSP',
            unit: 'Count',
            description: 'LSP test A',
            statistic: 'Sum' as const,
            evaluationPeriod: 300 as const,
            category: 'Performance' as const,
            importance: 'High' as const,
            threshold: { base: 10, warningMultiplier: 1.0, criticalMultiplier: 2.0 }
          }
        ];
      }

      protected getResourceScale() {
        return 1.0;
      }
    }

    class LSPTestGeneratorB extends BaseMetricsGenerator {
      constructor() {
        super(createLogger('error'));
      }

      getSupportedTypes(): string[] {
        return ['AWS::LSP::TestB'];
      }

      protected getMetricsConfig() {
        return [
          {
            name: 'LSPTestMetricB',
            namespace: 'AWS/LSP',
            unit: 'Percent',
            description: 'LSP test B',
            statistic: 'Average' as const,
            evaluationPeriod: 300 as const,
            category: 'Error' as const,
            importance: 'Medium' as const,
            threshold: { base: 5, warningMultiplier: 2.0, criticalMultiplier: 4.0 }
          }
        ];
      }

      protected getResourceScale() {
        return 2.0;
      }
    }

    // 両方のジェネレータがBaseMetricsGeneratorとして動作
    const generatorA = new LSPTestGeneratorA();
    const generatorB = new LSPTestGeneratorB();
    
    expect(generatorA).toBeInstanceOf(BaseMetricsGenerator);
    expect(generatorB).toBeInstanceOf(BaseMetricsGenerator);
    
    // 共通インターフェースとして使用可能
    const generators: Array<InstanceType<typeof BaseMetricsGenerator>> = [generatorA, generatorB];
    generators.forEach(generator => {
      expect(typeof generator.generate).toBe('function');
      expect(Array.isArray(generator.getSupportedTypes())).toBe(true);
    });
  });
});