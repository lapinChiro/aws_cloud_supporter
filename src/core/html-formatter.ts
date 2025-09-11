// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: HTMLフォーマッター実装

import type { IOutputFormatter } from '../interfaces/formatter';
import type { AnalysisResult } from '../types/metrics';
import { CloudSupporterError, ErrorType } from '../utils/error';

/**
 * HTML出力フォーマッタークラス
 * SOLID原則: 単一責任（HTML出力のみ）
 */
export class HTMLOutputFormatter implements IOutputFormatter {
  /**
   * 分析結果をHTML形式でフォーマット
   * @param result 分析結果
   * @returns HTML文字列
   */
  async format(result: AnalysisResult): Promise<string> {
    return this.formatHTML(result);
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
        ${this.getEmbeddedCSS()}
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
                ? result.resources.map(resource => this.generateResourceHTML(resource)).join('')
                : '<div class="empty-message" style="text-align: center; padding: 40px; color: #4a5568; font-size: 1.1rem;">No supported resources found</div>'
            }
        </div>
        
        ${result.unsupported_resources && result.unsupported_resources.length > 0 ? this.generateUnsupportedHTML(result.unsupported_resources) : ''}
    </div>
    
    <script>
        ${this.getEmbeddedJS()}
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

  /**
   * リソース用HTML生成（詳細メトリクス表示）
   * T-014準拠: レスポンシブ・重要度別表示・検索対応
   */
  private generateResourceHTML(resource: { 
    logical_id: string; 
    resource_type: string; 
    resource_properties: Record<string, unknown>;
    metrics: Array<{
      metric_name: string;
      namespace: string;
      unit: string;
      description: string;
      statistic: string;
      recommended_threshold: { warning: number; critical: number };
      evaluation_period: number;
      category: string;
      importance: string;
      dimensions?: Array<{ name: string; value: string }>;
    }>;
  }): string {
    const metricsHtml = resource.metrics.map(metric => this.generateMetricHTML(metric)).join('');
    
    return `
        <div class="resource-card" data-resource-type="${this.escapeHtml(resource.resource_type)}" data-resource-id="${this.escapeHtml(resource.logical_id)}">
            <div class="resource-header">
                <div class="resource-title-section">
                    <div class="resource-title">${this.escapeHtml(resource.logical_id)}</div>
                    <div class="resource-type">${resource.resource_type}</div>
                    <div class="resource-metrics-count">
                        <span class="badge metrics-count">${resource.metrics.length} metrics</span>
                        <span class="badge high-importance">${resource.metrics.filter(m => m.importance === 'High').length} high</span>
                        <span class="badge medium-importance">${resource.metrics.filter(m => m.importance === 'Medium').length} medium</span>
                        <span class="badge low-importance">${resource.metrics.filter(m => m.importance === 'Low').length} low</span>
                    </div>
                </div>
                <div class="toggle-button" onclick="toggleMetrics('${this.escapeHtml(resource.logical_id)}')">
                    <span class="toggle-icon">▼</span>
                </div>
            </div>
            <div class="resource-content" id="metrics-${this.escapeHtml(resource.logical_id)}">
                <div class="metrics-grid">
                    ${metricsHtml}
                </div>
            </div>
        </div>
    `;
  }

  /**
   * HTMLエスケープ処理
   * XSS攻撃防止のため、HTMLタグを安全にエスケープ
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * しきい値フォーマッター
   * 数値を適切にフォーマットし、単位を短縮形に変換
   */
  private formatThresholdValue(value: number, unit: string): string {
    // 単位の短縮変換
    const unitMap: Record<string, string> = {
      'Seconds': 's',
      'Milliseconds': 'ms', 
      'Percent': '%',
      'Count': '',
      'Count/Second': '/s',
      'Bytes': 'B',
      'Bytes/Second': 'B/s'
    };

    const shortUnit = unitMap[unit] || unit;

    // 数値フォーマット
    if (value >= 1000) {
      // 1000以上は3桁区切りでフォーマット
      const formatted = value.toLocaleString('en-US');
      return `${formatted}${shortUnit}`;
    } else if (value < 1 && value > 0) {
      // 1未満の小数は必要な桁数のみ表示
      const formatted = parseFloat(value.toPrecision(3)).toString();
      return `${formatted}${shortUnit}`;
    } else {
      // その他はそのまま
      return `${value}${shortUnit}`;
    }
  }

  /**
   * 単一メトリクス用HTML生成（重要度別色分け対応）
   */
  private generateMetricHTML(metric: {
    metric_name: string;
    namespace: string;
    unit: string;
    description: string;
    statistic: string;
    recommended_threshold: { warning: number; critical: number };
    evaluation_period: number;
    category: string;
    importance: string;
    dimensions?: Array<{ name: string; value: string }>;
  }): string {
    const importanceClass = `importance-${metric.importance.toLowerCase()}`;
    const categoryClass = `category-${metric.category.toLowerCase()}`;
    
    const dimensionsHtml = metric.dimensions 
      ? metric.dimensions.map(dim => `<span class="dimension">${dim.name}=${dim.value}</span>`).join(' ')
      : '';

    return `
        <div class="metric-card ${importanceClass} ${categoryClass}" 
             data-metric-name="${metric.metric_name}" 
             data-importance="${metric.importance}" 
             data-category="${metric.category}">
            <div class="metric-header">
                <div class="metric-name">${metric.metric_name}</div>
                <div class="metric-badges">
                    <span class="category-badge category-${metric.category.toLowerCase()}">${metric.category}</span>
                    <span class="metric-importance importance-${metric.importance.toLowerCase()}">${metric.importance}</span>
                </div>
            </div>
            <div class="metric-description">${metric.description}</div>
            <div class="metric-details">
                <div class="metric-info">
                    <span class="info-label">Namespace:</span>
                    <span class="info-value">${metric.namespace}</span>
                </div>
                <div class="metric-info">
                    <span class="info-label">Unit:</span>
                    <span class="info-value">${metric.unit}</span>
                </div>
                <div class="metric-info">
                    <span class="info-label">Statistic:</span>
                    <span class="info-value">${metric.statistic}</span>
                </div>
                <div class="metric-info">
                    <span class="info-label">Category:</span>
                    <span class="info-value category-${metric.category.toLowerCase()}">${metric.category}</span>
                </div>
                <div class="metric-info">
                    <span class="info-label">Evaluation Period:</span>
                    <span class="info-value">${metric.evaluation_period}s</span>
                </div>
            </div>
            <div class="threshold-section">
                <div class="threshold-title">Recommended Thresholds</div>
                <div class="threshold-values">
                    <div class="threshold-item warning">
                        <span class="threshold-value">Warning: ${this.formatThresholdValue(metric.recommended_threshold.warning, metric.unit)}</span>
                    </div>
                    <div class="threshold-item critical">
                        <span class="threshold-value">Critical: ${this.formatThresholdValue(metric.recommended_threshold.critical, metric.unit)}</span>
                    </div>
                </div>
            </div>
            ${dimensionsHtml ? `<div class="dimensions-section"><div class="dimensions-title">Dimensions</div><div class="dimensions-list">${dimensionsHtml}</div></div>` : ''}
        </div>
    `;
  }

  /**
   * サポート対象外リソース用HTML生成
   */
  private generateUnsupportedHTML(unsupportedResources: string[]): string {
    return `
        <div class="unsupported-section">
            <h2>Unsupported Resources</h2>
            <p style="margin-bottom: 16px; color: #4a5568;">${unsupportedResources.length} resources were not supported</p>
            <ul>
                ${unsupportedResources.map(resource => `<li>${this.escapeHtml(resource)}</li>`).join('')}
            </ul>
        </div>
    `;
  }

  /**
   * 組み込みCSS（外部依存なし・T-014準拠完全版）
   * レスポンシブ・重要度色分け・インタラクティブ対応
   */
  private getEmbeddedCSS(): string {
    return `
        /* ベース設定 */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        
        /* コンテナ・レイアウト */
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        
        /* ヘッダーセクション */
        .header { 
          background: white; 
          border-radius: 12px; 
          padding: 32px; 
          margin-bottom: 24px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          border-left: 4px solid #667eea;
        }
        .header h1 { 
          font-size: 2.5rem; 
          margin-bottom: 16px; 
          color: #2d3748; 
          font-weight: 700;
        }
        .metadata { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
        .badge { 
          padding: 8px 16px; 
          border-radius: 25px; 
          font-size: 0.9rem; 
          font-weight: 500;
          transition: transform 0.2s ease;
          background: #e3f2fd; 
          color: #1565c0; 
        }
        .badge:hover { transform: translateY(-1px); }
        
        /* 重要度別バッジカラー */
        .badge.high-importance { background: #ffebee; color: #c62828; }
        .badge.medium-importance { background: #fff3e0; color: #ef6c00; }
        .badge.low-importance { background: #e8f5e8; color: #2e7d32; }
        .badge.metrics-count { background: #f3e5f5; color: #7b1fa2; }
        
        /* コントロールセクション */
        .controls { 
          display: flex; 
          gap: 16px; 
          margin-bottom: 24px; 
          flex-wrap: wrap;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .search-input, .filter-select { 
          padding: 12px 16px; 
          border: 2px solid #e2e8f0; 
          border-radius: 8px; 
          font-size: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .search-input:focus, .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .search-input { flex: 1; min-width: 250px; }
        .filter-select { min-width: 180px; }
        
        /* リソースカード */
        .resource-card { 
          background: white; 
          border-radius: 12px; 
          margin-bottom: 24px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .resource-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
        }
        
        /* リソースヘッダー */
        .resource-header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px; 
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .resource-title-section { flex: 1; }
        .resource-title { 
          font-size: 1.4rem; 
          font-weight: 600; 
          margin-bottom: 4px;
        }
        .resource-type { 
          font-size: 0.9rem; 
          opacity: 0.9;
          margin-bottom: 12px;
        }
        .resource-metrics-count { display: flex; gap: 8px; flex-wrap: wrap; }
        .resource-metrics-count .badge { font-size: 0.8rem; padding: 4px 10px; }
        
        /* トグルボタン */
        .toggle-button { 
          cursor: pointer; 
          padding: 8px; 
          border-radius: 6px; 
          transition: background-color 0.2s ease;
          user-select: none;
        }
        .toggle-button:hover { background-color: rgba(255,255,255,0.1); }
        .toggle-icon { 
          font-size: 1.2rem; 
          transition: transform 0.3s ease;
        }
        
        /* リソースコンテンツ */
        .resource-content { 
          padding: 20px;
          transition: max-height 0.3s ease;
        }
        
        /* メトリクスグリッド */
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
          gap: 16px; 
        }
        
        /* メトリクスカード */
        .metric-card { 
          background: #fafafa; 
          border-radius: 8px; 
          padding: 16px;
          border-left: 4px solid #e2e8f0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .metric-card:hover { 
          transform: translateY(-1px); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        /* 重要度別メトリクスカラー */
        .metric-card.importance-high { border-left-color: #e53e3e; background: #fdf2f2; }
        .metric-card.importance-medium { border-left-color: #dd6b20; background: #fef5e7; }
        .metric-card.importance-low { border-left-color: #38a169; background: #f0fff4; }
        
        /* カテゴリ別アクセント */
        .metric-card.category-performance { border-top: 2px solid #3182ce; }
        .metric-card.category-error { border-top: 2px solid #e53e3e; }
        .metric-card.category-saturation { border-top: 2px solid #d69e2e; }
        .metric-card.category-latency { border-top: 2px solid #9f7aea; }
        
        /* メトリクスヘッダー */
        .metric-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 12px; 
        }
        .metric-name { 
          font-size: 1.1rem; 
          font-weight: 600; 
          color: #2d3748; 
        }
        .metric-importance { 
          padding: 4px 10px; 
          border-radius: 15px; 
          font-size: 0.8rem; 
          font-weight: 600;
          text-transform: uppercase;
        }
        .metric-importance.importance-high { background: #feb2b2; color: #c53030; }
        .metric-importance.importance-medium { background: #fbd38d; color: #c05621; }
        .metric-importance.importance-low { background: #9ae6b4; color: #276749; }
        
        /* カテゴリバッジ */
        .metric-badges { display: flex; gap: 8px; align-items: center; }
        .category-badge { 
          padding: 3px 8px; 
          border-radius: 12px; 
          font-size: 0.75rem; 
          font-weight: 500;
          text-transform: capitalize;
        }
        .category-badge.category-performance { background: #bee3f8; color: #2b6cb0; }
        .category-badge.category-error { background: #fed7d7; color: #c53030; }
        .category-badge.category-latency { background: #e9d8fd; color: #805ad5; }
        .category-badge.category-saturation { background: #feebc8; color: #c05621; }
        
        /* メトリクス説明 */
        .metric-description { 
          color: #4a5568; 
          margin-bottom: 16px; 
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        /* メトリクス詳細情報 */
        .metric-details { margin-bottom: 16px; }
        .metric-info { 
          display: flex; 
          justify-content: space-between; 
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .metric-info:last-child { border-bottom: none; }
        .info-label { 
          font-weight: 500; 
          color: #4a5568; 
          font-size: 0.9rem;
        }
        .info-value { 
          color: #2d3748; 
          font-weight: 400;
          font-size: 0.9rem;
        }
        
        /* カテゴリ値の色分け */
        .info-value.category-performance { color: #3182ce; font-weight: 500; }
        .info-value.category-error { color: #e53e3e; font-weight: 500; }
        .info-value.category-saturation { color: #d69e2e; font-weight: 500; }
        .info-value.category-latency { color: #9f7aea; font-weight: 500; }
        
        /* しきい値セクション */
        .threshold-section { 
          background: white; 
          border-radius: 6px; 
          padding: 12px;
          margin-bottom: 12px;
        }
        .threshold-title { 
          font-weight: 600; 
          color: #2d3748; 
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
        .threshold-values { display: flex; gap: 16px; flex-wrap: wrap; }
        .threshold-item { 
          display: flex; 
          align-items: center; 
          gap: 8px;
          padding: 6px 12px;
          border-radius: 6px;
        }
        .threshold-item.warning { background: #fef5e7; }
        .threshold-item.critical { background: #fdf2f2; }
        .threshold-label { 
          font-weight: 600; 
          font-size: 0.85rem;
        }
        .threshold-item.warning .threshold-label { color: #c05621; }
        .threshold-item.critical .threshold-label { color: #c53030; }
        .threshold-value { 
          font-weight: 500;
          font-size: 0.9rem;
          color: #2d3748;
        }
        
        /* ディメンションセクション */
        .dimensions-section { margin-top: 12px; }
        .dimensions-title { 
          font-weight: 600; 
          color: #4a5568; 
          margin-bottom: 6px;
          font-size: 0.85rem;
        }
        .dimensions-list { display: flex; gap: 8px; flex-wrap: wrap; }
        .dimension { 
          background: #e2e8f0; 
          color: #4a5568; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 0.8rem;
          font-family: 'Monaco', 'Consolas', monospace;
        }
        
        /* サポート対象外セクション */
        .unsupported-section { 
          background: white; 
          border-radius: 12px; 
          padding: 24px; 
          margin-top: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-left: 4px solid #ed8936;
        }
        .unsupported-section h2 {
          color: #c05621;
          margin-bottom: 16px;
          font-size: 1.3rem;
        }
        .unsupported-section ul {
          list-style: none;
          padding-left: 0;
        }
        .unsupported-section li {
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
        }
        .unsupported-section li:last-child { border-bottom: none; }
        
        /* レスポンシブデザイン */
        @media (max-width: 1024px) {
            .metrics-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
            .container { padding: 16px; }
            .header { padding: 24px; }
            .header h1 { font-size: 2rem; }
        }
        
        @media (max-width: 768px) {
            .controls { flex-direction: column; }
            .search-input, .filter-select { width: 100%; }
            .metadata { flex-direction: column; gap: 8px; }
            .resource-header { flex-direction: column; align-items: flex-start; gap: 12px; }
            .metrics-grid { grid-template-columns: 1fr; }
            .threshold-values { flex-direction: column; gap: 8px; }
            .dimensions-list { flex-direction: column; }
        }
        
        @media (max-width: 480px) {
            .container { padding: 12px; }
            .header { padding: 16px; }
            .header h1 { font-size: 1.6rem; }
            .metric-header { flex-direction: column; align-items: flex-start; gap: 8px; }
            .resource-metrics-count { flex-direction: column; }
        }
        
        /* 印刷対応 */
        @media print {
            body { background: white; }
            .container { max-width: none; padding: 0; }
            .resource-card, .header { box-shadow: none; border: 1px solid #e2e8f0; }
            .toggle-button { display: none; }
        }
    `;
  }

  /**
   * 組み込みJavaScript（T-014準拠完全版）
   * インタラクティブフィルタ・検索・トグル機能実装
   */
  private getEmbeddedJS(): string {
    return `
        console.log('🔍 CloudWatch Metrics Report initialized');
        
        // グローバル状態管理
        let currentFilters = {
            search: '',
            importance: '',
            category: ''
        };
        
        // DOM要素の初期化
        document.addEventListener('DOMContentLoaded', function() {
            initializeEventListeners();
            initializeStatistics();
            console.log('✅ Interactive features enabled');
        });
        
        /**
         * イベントリスナーの初期化
         */
        function initializeEventListeners() {
            // 検索フィルタ
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', function(e) {
                    currentFilters.search = e.target.value.toLowerCase();
                    applyFilters();
                });
            }
            
            // 重要度フィルタ
            const importanceFilter = document.getElementById('importanceFilter');
            if (importanceFilter) {
                importanceFilter.addEventListener('change', function(e) {
                    currentFilters.importance = e.target.value;
                    applyFilters();
                });
            }
            
            // カテゴリフィルタ  
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', function(e) {
                    currentFilters.category = e.target.value;
                    applyFilters();
                });
            }
            
            // ESCキーでフィルタリセット
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    resetFilters();
                }
            });
        }
        
        /**
         * フィルタリングの適用
         */
        function applyFilters() {
            const resourceCards = document.querySelectorAll('.resource-card');
            let visibleResources = 0;
            let visibleMetrics = 0;
            
            resourceCards.forEach(card => {
                const resourceId = card.dataset.resourceId || '';
                const resourceType = card.dataset.resourceType || '';
                let hasVisibleMetrics = false;
                
                // リソース名・タイプでの検索フィルタ
                const matchesSearch = !currentFilters.search || 
                    resourceId.toLowerCase().includes(currentFilters.search) ||
                    resourceType.toLowerCase().includes(currentFilters.search);
                
                // メトリクスフィルタリング
                const metricCards = card.querySelectorAll('.metric-card');
                metricCards.forEach(metricCard => {
                    const metricName = metricCard.dataset.metricName || '';
                    const importance = metricCard.dataset.importance || '';
                    const category = metricCard.dataset.category || '';
                    
                    const matchesMetricSearch = !currentFilters.search || 
                        metricName.toLowerCase().includes(currentFilters.search);
                    
                    const matchesImportance = !currentFilters.importance || 
                        importance === currentFilters.importance;
                    
                    const matchesCategory = !currentFilters.category || 
                        category === currentFilters.category;
                    
                    const isVisible = matchesSearch && matchesMetricSearch && 
                        matchesImportance && matchesCategory;
                    
                    metricCard.style.display = isVisible ? 'block' : 'none';
                    
                    if (isVisible) {
                        hasVisibleMetrics = true;
                        visibleMetrics++;
                    }
                });
                
                // リソースカード全体の表示/非表示
                card.style.display = (matchesSearch && hasVisibleMetrics) ? 'block' : 'none';
                if (matchesSearch && hasVisibleMetrics) {
                    visibleResources++;
                }
            });
            
            // 統計情報の更新
            updateFilterStatistics(visibleResources, visibleMetrics);
            
            // アニメーション効果
            addFilterAnimation();
        }
        
        /**
         * メトリクストグル機能
         */
        function toggleMetrics(resourceId) {
            const metricsContent = document.getElementById('metrics-' + resourceId);
            const toggleIcon = document.querySelector('[onclick="toggleMetrics(\\''+resourceId+'\\')"] .toggle-icon');
            
            if (metricsContent && toggleIcon) {
                const isVisible = metricsContent.style.display !== 'none';
                
                if (isVisible) {
                    metricsContent.style.display = 'none';
                    toggleIcon.textContent = '▶';
                    toggleIcon.style.transform = 'rotate(-90deg)';
                } else {
                    metricsContent.style.display = 'block';
                    toggleIcon.textContent = '▼';
                    toggleIcon.style.transform = 'rotate(0deg)';
                }
            }
        }
        
        /**
         * フィルタのリセット
         */
        function resetFilters() {
            currentFilters = { search: '', importance: '', category: '' };
            
            const searchInput = document.getElementById('searchInput');
            const importanceFilter = document.getElementById('importanceFilter');
            const categoryFilter = document.getElementById('categoryFilter');
            
            if (searchInput) searchInput.value = '';
            if (importanceFilter) importanceFilter.value = '';
            if (categoryFilter) categoryFilter.value = '';
            
            applyFilters();
            console.log('🔄 Filters reset');
        }
        
        /**
         * 統計情報の初期化
         */
        function initializeStatistics() {
            const resourceCards = document.querySelectorAll('.resource-card');
            const totalMetrics = document.querySelectorAll('.metric-card').length;
            
            console.log(\`📊 Loaded \${resourceCards.length} resources with \${totalMetrics} metrics\`);
        }
        
        /**
         * フィルタリング結果の統計更新
         */
        function updateFilterStatistics(visibleResources, visibleMetrics) {
            // フィルタ結果を画面に表示（オプション）
            let statusElement = document.getElementById('filter-status');
            if (!statusElement) {
                statusElement = document.createElement('div');
                statusElement.id = 'filter-status';
                statusElement.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(102, 126, 234, 0.9);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: opacity 0.3s ease;
                    z-index: 1000;
                \`;
                document.body.appendChild(statusElement);
            }
            
            const hasActiveFilters = currentFilters.search || 
                currentFilters.importance || currentFilters.category;
            
            if (hasActiveFilters) {
                statusElement.textContent = \`📊 \${visibleResources} resources, \${visibleMetrics} metrics\`;
                statusElement.style.opacity = '1';
            } else {
                statusElement.style.opacity = '0';
            }
        }
        
        /**
         * フィルタアニメーション効果
         */
        function addFilterAnimation() {
            const visibleCards = document.querySelectorAll('.metric-card[style*="display: block"], .metric-card:not([style*="display: none"])');
            visibleCards.forEach((card, index) => {
                card.style.animation = 'none';
                setTimeout(() => {
                    card.style.animation = \`fadeInUp 0.3s ease forwards \${index * 0.05}s\`;
                }, 10);
            });
        }
        
        /**
         * キーボードショートカット
         */
        document.addEventListener('keydown', function(e) {
            // Ctrl+F でサーチにフォーカス
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Ctrl+R でフィルタリセット
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                resetFilters();
            }
        });
        
        // CSSアニメーション定義
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; }
                10%, 90% { opacity: 1; }
            }
        \`;
        document.head.appendChild(style);
        
        // グローバル関数として公開（HTML内から呼び出し可能）
        window.toggleMetrics = toggleMetrics;
        window.resetFilters = resetFilters;
        
        console.log('🎯 Interactive CloudWatch Metrics Report ready!');
    `;
  }
}