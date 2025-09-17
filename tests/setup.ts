// CLAUDE.md準拠カスタムマッチャー（型安全、TDD支援）
import { mkdirSync, rmSync } from 'fs';

// テスト環境の統一設定（ローカルとCIの環境を揃える）
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // テスト中はエラーログのみ

// 型安全なカスタムマッチャー定義
declare global {
  namespace jest {
    interface Matchers<R> {
      toContainMetric(metricName: string): R;
      toHaveValidThreshold(): R;
      toBeValidCloudFormationResource(): R;
      toHaveNoAnyTypes(): R; // CLAUDE.md: No any types検証
    }
  }
  
  // テスト環境用のグローバル変数の型定義
  var TEST_TMP_DIR: string | undefined;
}

// メトリクス検証マッチャー
expect.extend({
  // メトリクス存在確認
  toContainMetric(received: unknown[], metricName: string) {
    const metrics = received as Array<{ metric_name: string }>;
    const hasMetric = metrics.some(m => m.metric_name === metricName);
    
    return {
      message: () => 
        hasMetric 
          ? `Expected metrics NOT to contain ${metricName}`
          : `Expected metrics to contain ${metricName}. Available: ${metrics.map(m => m.metric_name).join(', ')}`,
      pass: hasMetric,
    };
  },

  // しきい値妥当性検証（CLAUDE.md: Type-Driven Development）
  toHaveValidThreshold(received: unknown) {
    const threshold = received as { warning: number; critical: number };
    
    const isValid = 
      typeof threshold.warning === 'number' &&
      typeof threshold.critical === 'number' &&
      threshold.warning < threshold.critical &&
      threshold.warning > 0 &&
      threshold.critical > 0;
    
    return {
      message: () => 
        isValid 
          ? `Expected threshold to be invalid`
          : `Expected valid threshold (warning < critical, both > 0). Got: warning=${threshold.warning}, critical=${threshold.critical}`,
      pass: isValid,
    };
  },

  // CloudFormationリソース妥当性検証
  toBeValidCloudFormationResource(received: unknown) {
    const resource = received as { Type: string; Properties?: unknown };
    
    const isValid = 
      typeof resource.Type === 'string' &&
      resource.Type.startsWith('AWS::') &&
      (resource.Properties === undefined || typeof resource.Properties === 'object');
    
    return {
      message: () => 
        isValid 
          ? `Expected invalid CloudFormation resource`
          : `Expected valid CloudFormation resource. Got: ${JSON.stringify(resource, null, 2)}`,
      pass: isValid,
    };
  },

  // CLAUDE.md: No any types 検証マッチャー
  toHaveNoAnyTypes(received: string) {
    const codeContent = received;
    const hasAnyType = /:\s*any(\s|;|,|\)|]|}|$)/.test(codeContent);
    
    return {
      message: () => 
        hasAnyType 
          ? `Expected code to have no 'any' types (CLAUDE.md violation detected)`
          : `Expected code to contain 'any' types`,
      pass: !hasAnyType,
    };
  }
});

// テスト環境セットアップ
beforeAll(() => {
  // 全テストでCLAUDE.md準拠確認
  // Jest Test Environment Setup - CLAUDE.md準拠
  
  // 一時ディレクトリの作成
  const tmpDir = global.TEST_TMP_DIR;
  if (tmpDir) {
    mkdirSync(tmpDir, { recursive: true });
  }
});

// テスト後クリーンアップ
afterAll(async () => {
  // 一時ディレクトリのクリーンアップ
  const tmpDir = global.TEST_TMP_DIR;
  if (tmpDir) {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to clean up temp directory:', error);
    }
  }

  // メモリクリーンアップ
  if (global.gc) {
    global.gc();
  }

  // すべての非同期操作の完了を確実に待つ
  await new Promise(resolve => setImmediate(resolve));

  // タイマーのクリア（念のため）
  jest.clearAllTimers();

  // 追加の待機（非同期操作の確実な完了のため）
  await new Promise(resolve => setTimeout(resolve, 100));
});

// TypeScript型安全性の確保
export {};