// CLAUDE.md準拠: Interface Segregation Principle・型安全性
import type { AnalysisResult, ResourceWithMetrics, MetricDefinition } from '../../../types/metrics';

/**
 * HTML生成インターフェース（メイン処理）
 * Interface Segregation: 各機能を独立したインターフェースに分離
 */
export interface IHTMLGenerator {
  /**
   * 分析結果をHTML形式でフォーマット
   * @param result 分析結果
   * @returns HTML文字列
   */
  formatHTML(result: AnalysisResult): Promise<string>;
}

/**
 * リソースHTML生成インターフェース
 * Single Responsibility: リソース表示HTML生成のみ
 */
export interface IResourceHTMLGenerator {
  /**
   * リソース情報のHTML生成
   * @param resource リソース情報とメトリクス
   * @param index リソースインデックス
   * @returns HTML文字列
   */
  generateResourceHTML(resource: ResourceWithMetrics, index: number): string;
}

/**
 * メトリクスHTML生成インターフェース
 * Single Responsibility: メトリクス表示HTML生成のみ
 */
export interface IMetricHTMLGenerator {
  /**
   * メトリクス情報のHTML生成
   * @param metric メトリクス定義
   * @param resourceType リソースタイプ
   * @returns HTML文字列
   */
  generateMetricHTML(metric: MetricDefinition, resourceType: string): string;
}

/**
 * サポート外リソースHTML生成インターフェース
 * Single Responsibility: サポート外リソース表示HTML生成のみ
 */
export interface IUnsupportedHTMLGenerator {
  /**
   * サポート外リソースのHTML生成
   * @param unsupportedResources サポート外リソースのlogical ID配列
   * @returns HTML文字列
   */
  generateUnsupportedHTML(unsupportedResources: string[]): string;
}

/**
 * HTMLユーティリティインターフェース
 * DRY原則: 共通処理を集約
 */
export interface IHTMLUtility {
  /**
   * HTMLエスケープ処理
   * @param text エスケープ対象文字列
   * @returns エスケープ済み文字列
   */
  escapeHtml(text: string): string;

  /**
   * しきい値のフォーマット
   * @param value 数値
   * @param unit 単位
   * @returns フォーマット済み文字列
   */
  formatThresholdValue(value: number, unit: string): string;
}

/**
 * スタイル・スクリプト提供インターフェース
 * Single Responsibility: CSS/JSアセット管理のみ
 */
export interface IHTMLAssetProvider {
  /**
   * 埋め込みCSSの取得
   * @returns CSS文字列
   */
  getEmbeddedCSS(): string;

  /**
   * 埋め込みJavaScriptの取得
   * @returns JavaScript文字列
   */
  getEmbeddedJS(): string;
}

/**
 * HTML出力フォーマッター総合インターフェース
 * 既存のIOutputFormatterとの互換性を維持
 */
export interface IHTMLOutputFormatter {
  /**
   * 分析結果をHTML形式でフォーマット（IOutputFormatter互換）
   * @param result 分析結果
   * @returns HTML文字列
   */
  format(result: AnalysisResult): Promise<string>;
  
  /**
   * HTML形式でのフォーマット出力
   * @param result 分析結果
   * @returns HTML文字列
   */
  formatHTML(result: AnalysisResult): Promise<string>;
}