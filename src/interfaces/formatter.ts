// CLAUDE.md準拠: Interface Segregation Principle
// Output formatter interface

import type { AnalysisResult } from '../types/metrics';

/**
 * Output formatter interface
 * SOLID原則: Interface Segregation
 */
export interface IOutputFormatter {
  /**
   * Format analysis result as output
   * @param result Analysis result
   * @returns Formatted output string
   * @throws CloudSupporterError on format failure
   */
  format(result: AnalysisResult): Promise<string> | string;
  
  /**
   * Format as JSON
   * @param result Analysis result
   * @returns JSON formatted string
   */
  formatJSON?(result: AnalysisResult): string;
  
  /**
   * Format as HTML
   * @param result Analysis result
   * @returns HTML formatted string
   */
  formatHTML?(result: AnalysisResult): string;
}