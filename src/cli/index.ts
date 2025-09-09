#!/usr/bin/env node
// CLAUDE.md準拠エントリーポイント（strict mode, no any types）
// T-016: CLI完全実装・統合

import { createCLICommand } from './commands';
import { MetricsAnalyzer } from '../core/analyzer';
import { TemplateParser } from '../core/parser';
import { JSONOutputFormatter } from '../core/json-formatter';
import { HTMLOutputFormatter } from '../core/html-formatter';
import { Logger } from '../utils/logger';

// UNIX Philosophy: 一つのことをうまくやる
function main(): void {
  // 依存性注入（SOLID原則: Dependency Inversion）
  // CLI用に静かなロガーを使用（verboseオプション後に更新される）
  const logger = new Logger('error', false);
  const parser = new TemplateParser();
  const jsonFormatter = new JSONOutputFormatter();
  const htmlFormatter = new HTMLOutputFormatter();
  const analyzer = new MetricsAnalyzer(parser, logger);
  
  // CLIコマンド作成
  const program = createCLICommand({
    analyzer,
    parser,
    jsonFormatter,
    htmlFormatter,
    logger
  });
  
  // コマンドライン解析・実行
  program.parse();
}

// エラーハンドリング（CLAUDE.md: 適切なエラー処理）
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

if (require.main === module) {
  main();
}

export default main;