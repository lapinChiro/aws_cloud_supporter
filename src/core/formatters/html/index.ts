// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: HTMLフォーマッター実装 - ファサードパターンによる統合

import type { IHTMLOutputFormatter } from './interfaces';
import type { AnalysisResult } from '../../../types/metrics';
import { BaseHTMLFormatter } from './base-formatter';
import { Logger } from '../../../utils/logger';

/**
 * HTMLOutputFormatterクラス（ファサードパターン）
 * 
 * 既存のインポートとの互換性を維持しつつ、
 * 内部実装は分割されたモジュールに委譲する
 */
export class HTMLOutputFormatter implements IHTMLOutputFormatter {
  private logger?: Logger;
  private baseFormatter: BaseHTMLFormatter;

  constructor(logger?: Logger) {
    if (logger) {
      this.logger = logger;
    }
    this.baseFormatter = new BaseHTMLFormatter();
  }

  /**
   * 結果をHTMLフォーマットで出力
   * 
   * @param result - 分析結果
   * @returns フォーマットされたHTML文字列
   */
  async format(result: AnalysisResult): Promise<string> {
    this.logger?.info('📄 Formatting output as HTML');
    return this.baseFormatter.formatHTML(result);
  }

  /**
   * HTMLフォーマット処理（formatメソッドへの委譲）
   * 
   * @param result - 分析結果
   * @returns フォーマットされたHTML文字列
   */
  async formatHTML(result: AnalysisResult): Promise<string> {
    return this.format(result);
  }

  /**
   * 組み込みCSS取得（静的メソッドとして提供）
   * 
   * @returns CSS文字列
   */
  static getEmbeddedCSS(): string {
    const { HTMLAssetProvider } = require('./assets/styles');
    const provider = new HTMLAssetProvider();
    return provider.getEmbeddedCSS();
  }

  /**
   * 組み込みJS取得（静的メソッドとして提供）
   * 
   * @returns JavaScript文字列
   */
  static getEmbeddedJS(): string {
    const { getEmbeddedJS } = require('./assets/scripts');
    return getEmbeddedJS();
  }
}