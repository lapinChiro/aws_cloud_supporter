// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: HTMLフォーマッター実装 - HTML生成

import type { ResourceWithMetrics, MetricDefinition } from '../../../types/metrics';

import { HTMLUtility } from './formatter-utils';
import type { IResourceHTMLGenerator, IMetricHTMLGenerator, IUnsupportedHTMLGenerator, IHTMLUtility } from './interfaces';

/**
 * メトリクスHTML生成クラス
 * Single Responsibility: メトリクス表示用HTML生成のみ
 */
export class MetricHTMLGenerator implements IMetricHTMLGenerator {
  private readonly utility: IHTMLUtility;

  constructor() {
    this.utility = new HTMLUtility();
  }

  /**
   * 単一メトリクス用HTML生成（重要度別色分け対応）
   */
  generateMetricHTML(metric: MetricDefinition, _resourceType: string): string {
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
                        <span class="threshold-value">Warning: ${this.utility.formatThresholdValue(metric.recommended_threshold.warning, metric.unit)}</span>
                    </div>
                    <div class="threshold-item critical">
                        <span class="threshold-value">Critical: ${this.utility.formatThresholdValue(metric.recommended_threshold.critical, metric.unit)}</span>
                    </div>
                </div>
            </div>
            ${dimensionsHtml ? `<div class="dimensions-section"><div class="dimensions-title">Dimensions</div><div class="dimensions-list">${dimensionsHtml}</div></div>` : ''}
        </div>
    `;
  }
}

/**
 * リソースHTML生成クラス
 * Single Responsibility: リソース表示用HTML生成のみ
 */
export class ResourceHTMLGenerator implements IResourceHTMLGenerator {
  private readonly metricHTMLGenerator: IMetricHTMLGenerator;
  private readonly utility: IHTMLUtility;

  constructor() {
    this.metricHTMLGenerator = new MetricHTMLGenerator();
    this.utility = new HTMLUtility();
  }

  /**
   * リソース用HTML生成（詳細メトリクス表示）
   * T-014準拠: レスポンシブ・重要度別表示・検索対応
   */
  generateResourceHTML(resource: ResourceWithMetrics, _index: number): string {
    const metricsHtml = resource.metrics.map(metric => 
      this.metricHTMLGenerator.generateMetricHTML(metric, resource.resource_type)
    ).join('');
    
    return `
        <div class="resource-card" data-resource-type="${this.utility.escapeHtml(resource.resource_type)}" data-resource-id="${this.utility.escapeHtml(resource.logical_id)}">
            <div class="resource-header">
                <div class="resource-title-section">
                    <div class="resource-title">${this.utility.escapeHtml(resource.logical_id)}</div>
                    <div class="resource-type">${resource.resource_type}</div>
                    <div class="resource-metrics-count">
                        <span class="badge metrics-count">${resource.metrics.length} metrics</span>
                        <span class="badge high-importance">${resource.metrics.filter(m => m.importance === 'High').length} high</span>
                        <span class="badge medium-importance">${resource.metrics.filter(m => m.importance === 'Medium').length} medium</span>
                        <span class="badge low-importance">${resource.metrics.filter(m => m.importance === 'Low').length} low</span>
                    </div>
                </div>
                <div class="toggle-button" onclick="toggleMetrics('${this.utility.escapeHtml(resource.logical_id)}')">
                    <span class="toggle-icon">▼</span>
                </div>
            </div>
            <div class="resource-content" id="metrics-${this.utility.escapeHtml(resource.logical_id)}">
                <div class="metrics-grid">
                    ${metricsHtml}
                </div>
            </div>
        </div>
    `;
  }
}

/**
 * サポート外リソースHTML生成クラス
 * Single Responsibility: サポート外リソース表示用HTML生成のみ
 */
export class UnsupportedHTMLGenerator implements IUnsupportedHTMLGenerator {
  private readonly utility: IHTMLUtility;

  constructor() {
    this.utility = new HTMLUtility();
  }

  /**
   * サポート対象外リソース用HTML生成
   */
  generateUnsupportedHTML(unsupportedResources: string[]): string {
    return `
        <div class="unsupported-section">
            <h2>Unsupported Resources</h2>
            <p style="margin-bottom: 16px; color: #4a5568;">${unsupportedResources.length} resources were not supported</p>
            <ul>
                ${unsupportedResources.map(resource => `<li>${this.utility.escapeHtml(resource)}</li>`).join('')}
            </ul>
        </div>
    `;
  }
}