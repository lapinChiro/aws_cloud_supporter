// CLAUDE.md準拠Jest設定（TDD基盤、品質保証強化）
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // TDD対応テストパターン
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
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
  
  // カスタムマッチャー設定
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // デバッグ・開発効率
  verbose: true,
  testTimeout: 10000,
  
  // 型安全性強化
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // パフォーマンス最適化
  maxWorkers: '50%',
  cacheDirectory: '<rootDir>/.jest-cache'
};