// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: HTMLフォーマッター実装 - ベースフォーマッター

import type { AnalysisResult } from '../../../types/metrics';
import { CloudSupporterError, ErrorType } from '../../../utils/error';

import { HTMLAssetProvider } from './assets/styles';
import { ResourceHTMLGenerator , UnsupportedHTMLGenerator } from './html-generators';
import type { IHTMLGenerator, IResourceHTMLGenerator, IUnsupportedHTMLGenerator, IHTMLAssetProvider } from './interfaces';

/**
 * HTML形式のベースフォーマッタークラス
 * Single Responsibility: HTML全体構造の生成のみ
 */
export class BaseHTMLFormatter implements IHTMLGenerator {
  private readonly resourceHTMLGenerator: IResourceHTMLGenerator;
  private readonly unsupportedHTMLGenerator: IUnsupportedHTMLGenerator;
  private readonly assetProvider: IHTMLAssetProvider;

  constructor() {
    this.resourceHTMLGenerator = new ResourceHTMLGenerator();
    this.unsupportedHTMLGenerator = new UnsupportedHTMLGenerator();
    this.assetProvider = new HTMLAssetProvider();
  }

  /**
   * HTML形式でのフォーマット出力
   * レスポンシブデザイン・外部依存なし
   */
  async formatHTML(result: AnalysisResult): Promise<string> {
    const startTime = performance.now();
    
    try {
      // 入力検証（CLAUDE.md: 型安全性）
      if (!result || typeof result !== 'object') {
        throw new CloudSupporterError(
          ErrorType.OUTPUT_ERROR,
          'Invalid analysis result provided',
          { received: typeof result }
        );
      }

      const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudWatch Metrics Report</title>
    <style>
        ${this.assetProvider.getEmbeddedCSS()}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🔍 CloudWatch Metrics Report</h1>
            <div class="metadata">
                <span class="badge">Generated: ${(() => {
                    const date = new Date(result.metadata.generated_at);
                    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                })()}</span>
                <span class="badge">Resources: ${result.metadata.supported_resources}/${result.metadata.total_resources}</span>
                <span class="badge">Processing: ${result.metadata.processing_time_ms}ms</span>
                ${result.metadata.memory_peak_mb ? `<span class="badge">Memory: ${result.metadata.memory_peak_mb}MB</span>` : ''}
            </div>
        </header>
        
        <div class="controls">
            <input type="text" id="searchInput" placeholder="🔍 Search metrics..." class="search-input">
            <select id="importanceFilter" class="filter-select">
                <option value="">All Importance Levels</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
            </select>
            <select id="categoryFilter" class="filter-select">
                <option value="">All Categories</option>
                <option value="Performance">Performance</option>
                <option value="Error">Error</option>
                <option value="Saturation">Saturation</option>
                <option value="Latency">Latency</option>
            </select>
        </div>

        <div class="resources">
            ${result.resources.length > 0 
                ? result.resources.map((resource, index) => this.resourceHTMLGenerator.generateResourceHTML(resource, index)).join('')
                : '<div class="empty-message" style="text-align: center; padding: 40px; color: #4a5568; font-size: 1.1rem;">No supported resources found</div>'
            }
        </div>
        
        ${result.unsupported_resources && result.unsupported_resources.length > 0 ? this.unsupportedHTMLGenerator.generateUnsupportedHTML(result.unsupported_resources) : ''}
    </div>
    
    <script>
        ${this.assetProvider.getEmbeddedJS()}
    </script>
</body>
</html>`;

      const duration = performance.now() - startTime;
      if (duration > 3000) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️  HTML formatting slow: ${duration.toFixed(0)}ms`);
      }

      return html;
    } catch (error) {
      if (error instanceof CloudSupporterError) {
        throw error;
      }
      throw new CloudSupporterError(
        ErrorType.OUTPUT_ERROR,
        `Failed to format HTML output: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}