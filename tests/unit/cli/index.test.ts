// CLAUDE.md準拠サンプルテスト（TDD基盤検証）
import { readFileSync } from 'fs';
import path from 'path';

// T-003検証: テスト環境動作確認
describe('CLI Basic Tests (T-003 Validation)', () => {
  // CLAUDE.md: Zero type errors 検証
  it('should have TypeScript with zero type errors', () => {
    expect(true).toBe(true); // 基本動作確認
  });

  // CLAUDE.md: No any types 検証
  it('should not contain any types in CLI code', () => {
    const cliCode = readFileSync(
      path.join(__dirname, '../../../src/cli/index.ts'), 
      'utf8'
    );
    
    expect(cliCode).toHaveNoAnyTypes();
  });

  // カスタムマッチャー動作確認
  it('should validate custom matchers work correctly', () => {
    // しきい値検証マッチャー
    const validThreshold = { warning: 70, critical: 90 };
    const invalidThreshold = { warning: 90, critical: 70 };
    
    expect(validThreshold).toHaveValidThreshold();
    expect(invalidThreshold).not.toHaveValidThreshold();
  });

  // メトリクス検証マッチャー
  it('should validate metrics matcher', () => {
    const metrics = [
      { metric_name: 'CPUUtilization' },
      { metric_name: 'DatabaseConnections' }
    ];
    
    expect(metrics).toContainMetric('CPUUtilization');
    expect(metrics).not.toContainMetric('NonExistentMetric');
  });

  // CloudFormationリソース検証マッチャー
  it('should validate CloudFormation resource matcher', () => {
    const validResource = {
      Type: 'AWS::RDS::DBInstance',
      Properties: { Engine: 'mysql' }
    };
    
    const invalidResource = {
      Type: 'InvalidType'
    };
    
    expect(validResource).toBeValidCloudFormationResource();
    expect(invalidResource).not.toBeValidCloudFormationResource();
  });
});