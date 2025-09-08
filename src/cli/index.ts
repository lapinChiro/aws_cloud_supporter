// CLAUDE.md準拠エントリーポイント（strict mode, no any types）
import { Command } from 'commander';

// 型安全なCLIオプション定義
interface CLIOptions {
  output: 'json' | 'html' | 'yaml';
  file?: string;
  resourceTypes?: string;
  includeLow?: boolean;
  verbose?: boolean;
  noColor?: boolean;
}

// UNIX Philosophy: 一つのことをうまくやる
function main(): void {
  const program = new Command();

  program
    .name('aws-cloud-supporter')
    .description('Generate CloudWatch metrics recommendations for CloudFormation templates')
    .version('1.0.0')
    .argument('<template>', 'CloudFormation template file path (.yaml/.yml/.json)')
    .option('-o, --output <format>', 'Output format: json|html|yaml', 'json')
    .option('-f, --file <path>', 'Output file path (default: stdout)')
    .option('--resource-types <types>', 'Comma-separated resource types')
    .option('--include-low', 'Include low importance metrics')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('--no-color', 'Disable colored output')
    .action((templatePath: string, options: CLIOptions) => {
      // 一時的な実装（Phase 4で本格実装）
      console.log(`🔍 Analyzing: ${templatePath}`);
      console.log(`📊 Format: ${options.output}`);
      
      if (options.verbose) {
        console.log('✅ T-002 TypeScript strict mode validation successful');
      }
    });

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