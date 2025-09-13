// CLAUDE.md準拠: 単一責任原則・No any types・SOLID設計
// T-016: HTMLフォーマッター実装 - ユーティリティ関数

import type { IHTMLUtility } from './interfaces';

/**
 * HTMLユーティリティクラス
 * Single Responsibility: HTML生成に関する共通処理のみ
 * DRY原則: 共通処理を集約
 */
export class HTMLUtility implements IHTMLUtility {
  /**
   * HTMLエスケープ処理
   * XSS攻撃防止のため、HTMLタグを安全にエスケープ
   */
  escapeHtml(text: string): string {
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
  formatThresholdValue(value: number, unit: string): string {
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

    const shortUnit = unitMap[unit] ?? unit;

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
}