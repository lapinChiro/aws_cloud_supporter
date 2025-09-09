// CLAUDE.md準拠: 型安全性・SOLID原則・Interface Segregation
// requirement.md準拠: MetricsAnalyzer統合インターフェース

import { AnalysisResult } from '../types/metrics';

/**
 * 分析オプションインターフェース
 * requirement.md 4.3節準拠
 */
export interface AnalysisOptions {
  outputFormat: 'json' | 'html';
  includeUnsupported?: boolean;
  includeLowImportance?: boolean;  // 低重要度メトリクスを含める
  resourceTypes?: string[];  // フィルタリング対象のリソースタイプ
  concurrency?: number;  // 並列処理数（デフォルト: 6）
  memoryLimit?: number;  // メモリ制限（バイト）
  timeout?: number;      // タイムアウト（ミリ秒）
  verbose?: boolean;     // 詳細ログ出力
  collectMetrics?: boolean;  // パフォーマンスメトリクス収集
  continueOnError?: boolean;  // エラー時も継続
  performanceMode?: boolean;  // パフォーマンス優先モード
}

/**
 * パフォーマンスメトリクスインターフェース
 */
export interface PerformanceMetrics {
  parseTime: number;
  generatorTime: number;
  formatterTime?: number;
  totalTime: number;
  memoryPeak: number;
  resourceCount: number;
  concurrentTasks?: number;
}

/**
 * 分析統計インターフェース
 */
export interface AnalysisStatistics {
  totalResources: number;
  supportedResources: number;
  unsupportedResources: number;
  resourcesByType: Record<string, number>;
  processingTimeMs: number;
  memoryUsageMB: number;
}

/**
 * エラー情報インターフェース
 */
export interface AnalysisError {
  resourceId: string;
  resourceType: string;
  error: string;
  stack?: string | undefined;
}

/**
 * 拡張分析結果インターフェース
 */
export interface ExtendedAnalysisResult extends AnalysisResult {
  performanceMetrics?: PerformanceMetrics;
  errors?: AnalysisError[];
}

/**
 * MetricsAnalyzerインターフェース
 * SOLID原則: Interface Segregation Principle準拠
 */
export interface IMetricsAnalyzer {
  /**
   * CloudFormationテンプレートを分析してメトリクスを生成
   * @param templatePath テンプレートファイルパス
   * @param options 分析オプション
   * @returns 拡張分析結果
   * @throws CloudSupporterError 分析エラー時
   */
  analyze(templatePath: string, options: AnalysisOptions): Promise<ExtendedAnalysisResult>;
  
  /**
   * 登録されているGeneratorの一覧を取得
   * @returns Generator名の配列
   */
  getRegisteredGenerators(): string[];
  
  /**
   * 分析統計情報を取得
   * @returns 統計情報（分析前はnull）
   */
  getAnalysisStatistics(): AnalysisStatistics | null;
}