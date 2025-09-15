// 統合テスト用の最適化セットアップ
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// CLIのビルド状態を確認
const CLI_PATH = path.join(__dirname, '../../dist/cli/index.js');
let isBuilt = false;

// テスト開始前に一度だけCLIをビルド
beforeAll(() => {
  if (!isBuilt) {
    try {
      fs.accessSync(CLI_PATH);
      // eslint-disable-next-line no-console
      console.log('✅ CLI already built at:', CLI_PATH);
      isBuilt = true;
    } catch {
      // eslint-disable-next-line no-console
      console.log('🔨 Building CLI for integration tests...');
      try {
        execSync('npm run build', { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '../../')
        });
        // eslint-disable-next-line no-console
        console.log('✅ CLI build completed');
        isBuilt = true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ CLI build failed:', error);
        throw error;
      }
    }
  }
});

// グローバルタイムアウトの調整
jest.setTimeout(30000); // デフォルト30秒

// 環境変数の設定
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // テスト中はエラーログのみ

// テスト後のクリーンアップ
afterAll(async () => {
  // 一時ファイルのクリーンアップなど
  // 非同期操作の完了を待つ
  await new Promise(resolve => setImmediate(resolve));
});