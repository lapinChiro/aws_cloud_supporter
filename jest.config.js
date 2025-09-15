// CLAUDE.md準拠Jest設定（TDD基盤、品質保証強化）
// パフォーマンス最適化版 - プロジェクト分割による並列実行

const commonConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // 型安全性強化
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // ESMモジュール対応（chalk v5等）
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|p-limit|yocto-queue)/)'
  ],
  
  // キャッシュ設定
  cacheDirectory: '<rootDir>/.jest-cache',
};

module.exports = {
  // プロジェクト分割による並列実行最適化
  projects: [
    {
      ...commonConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      maxWorkers: 2,  // 単体テストの並列度を下げて安定性向上
    },
    {
      ...commonConfig,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.ts',
        '<rootDir>/tests/integration/setup-optimized.ts'  // 統合テスト用セットアップ
      ],
      maxWorkers: 2,  // 統合テストは並列度を制限
    },
    {
      ...commonConfig,
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      maxWorkers: 1,  // E2Eテストは逐次実行
    },
    {
      ...commonConfig,
      displayName: 'security',
      testMatch: ['<rootDir>/tests/security/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      maxWorkers: 2,
    }
  ],
  
  // グローバルタイムアウト設定
  testTimeout: 180000,  // デフォルト180秒に延長（integration testタイムアウト対策）
  
  // CLAUDE.md: 品質指標（カバレッジ90%+）
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli/index.ts', // エントリーポイントは除外
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts'
  ],
  
  // 厳格な品質基準（CLAUDE.md準拠）
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    }
  },
  
  // レポート形式
  coverageReporters: [
    'text',           // CLI表示
    'lcov',           // CI連携
    'html',           // ブラウザ表示
    'json-summary'    // 数値確認
  ],
  
  // グローバル設定（一時ディレクトリ対応）
  globals: {
    TEST_TMP_DIR: '<rootDir>/tmp/test-' + process.pid + '-' + Date.now()
  },
  
  // 全体設定
  verbose: true,
  roots: ['<rootDir>/src', '<rootDir>/tests'],
};