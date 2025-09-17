// ValidationResult Builder Pattern
// CLAUDE.md準拠: DRY原則・Builder Pattern

/**
 * CDKバリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: {
    codeLength: number;
    alarmCount: number;
    importCount: number;
  };
}

/**
 * ValidationResultビルダー
 * テスト用バリデーション結果の段階的構築
 */
export class ValidationResultBuilder {
  private isValid = true;
  private readonly errors: string[] = [];
  private readonly warnings: string[] = [];
  private readonly suggestions: string[] = [];
  private codeLength = 0;
  private alarmCount = 0;
  private importCount = 0;

  /**
   * 有効/無効を設定
   */
  withValidity(isValid: boolean): this {
    this.isValid = isValid;
    return this;
  }

  /**
   * エラーを追加
   */
  addError(error: string): this {
    this.errors.push(error);
    this.isValid = false; // エラーがあれば自動的に無効
    return this;
  }

  /**
   * 複数のエラーを追加
   */
  addErrors(errors: string[]): this {
    this.errors.push(...errors);
    if (errors.length > 0) {
      this.isValid = false;
    }
    return this;
  }

  /**
   * 警告を追加
   */
  addWarning(warning: string): this {
    this.warnings.push(warning);
    return this;
  }

  /**
   * 複数の警告を追加
   */
  addWarnings(warnings: string[]): this {
    this.warnings.push(...warnings);
    return this;
  }

  /**
   * 提案を追加
   */
  addSuggestion(suggestion: string): this {
    this.suggestions.push(suggestion);
    return this;
  }

  /**
   * 複数の提案を追加
   */
  addSuggestions(suggestions: string[]): this {
    this.suggestions.push(...suggestions);
    return this;
  }

  /**
   * コード長を設定
   */
  withCodeLength(length: number): this {
    this.codeLength = length;
    return this;
  }

  /**
   * アラーム数を設定
   */
  withAlarmCount(count: number): this {
    this.alarmCount = count;
    return this;
  }

  /**
   * インポート数を設定
   */
  withImportCount(count: number): this {
    this.importCount = count;
    return this;
  }

  /**
   * メトリクスをまとめて設定
   */
  withMetrics(metrics: { codeLength?: number; alarmCount?: number; importCount?: number }): this {
    if (metrics.codeLength !== undefined) this.codeLength = metrics.codeLength;
    if (metrics.alarmCount !== undefined) this.alarmCount = metrics.alarmCount;
    if (metrics.importCount !== undefined) this.importCount = metrics.importCount;
    return this;
  }

  /**
   * ビルド
   */
  build(): ValidationResult {
    return {
      isValid: this.isValid,
      errors: [...this.errors],
      warnings: [...this.warnings],
      suggestions: [...this.suggestions],
      metrics: {
        codeLength: this.codeLength,
        alarmCount: this.alarmCount,
        importCount: this.importCount
      }
    };
  }

  /**
   * 成功結果のプリセット
   */
  static valid(): ValidationResultBuilder {
    return new ValidationResultBuilder()
      .withValidity(true)
      .withMetrics({ codeLength: 1000, alarmCount: 10, importCount: 5 });
  }

  /**
   * エラー結果のプリセット
   */
  static invalid(errors?: string[]): ValidationResultBuilder {
    const builder = new ValidationResultBuilder()
      .withValidity(false);

    if (errors) {
      builder.addErrors(errors);
    } else {
      builder.addError('Validation failed');
    }

    return builder.withMetrics({ codeLength: 0, alarmCount: 0, importCount: 0 });
  }

  /**
   * 警告付き結果のプリセット
   */
  static withWarnings(warnings: string[]): ValidationResultBuilder {
    return new ValidationResultBuilder()
      .withValidity(true)
      .addWarnings(warnings)
      .withMetrics({ codeLength: 1000, alarmCount: 10, importCount: 5 });
  }

  /**
   * 完全な結果のプリセット
   */
  static complete(): ValidationResultBuilder {
    return new ValidationResultBuilder()
      .withValidity(true)
      .addWarning('High alarm count')
      .addWarning('Consider using constants')
      .addSuggestion('Use CDK best practices')
      .addSuggestion('Consider splitting the stack')
      .withMetrics({ codeLength: 2500, alarmCount: 25, importCount: 10 });
  }
}

/**
 * ファクトリ関数
 */
export function validationResult(): ValidationResultBuilder {
  return new ValidationResultBuilder();
}