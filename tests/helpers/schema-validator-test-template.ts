// tests/helpers/schema-validator-test-template.ts
// Schemaバリデーターテスト用の共通テンプレート

import type { AnalysisResult } from '../../src/types/metrics';
import { JsonSchemaValidator } from '../../src/utils/schema-validator';

import { expectValidationResult } from './assertion-helpers';

export interface SchemaValidatorTestCase {
  name: string;
  test: (validator: JsonSchemaValidator) => void;
}

/**
 * Schemaバリデーターのテストスイートを作成
 * @param testCategory テストカテゴリ名
 * @param testCases テストケース配列
 */
export function createSchemaValidatorTestSuite(
  testCategory: string,
  testCases: SchemaValidatorTestCase[]
): void {
  describe(`JsonSchemaValidator - ${testCategory}`, () => {
    let validator: JsonSchemaValidator;

    beforeEach(() => {
      validator = new JsonSchemaValidator();
    });

    testCases.forEach(testCase => {
      it(testCase.name, () => {
        testCase.test(validator);
      });
    });
  });
}

/**
 * バリデーション結果のアサーションを実行
 * @param validator バリデーター
 * @param testData テストデータ
 * @param expectedValid 期待される有効性
 * @param expectedErrorPatterns 期待されるエラーパターン（オプション）
 */
export function validateAndAssert(
  validator: JsonSchemaValidator,
  testData: unknown,
  expectedValid: boolean,
  expectedErrorPatterns?: Array<{ path?: string; message?: string }>
): void {
  const result = validator.validateAnalysisResult(testData as AnalysisResult);

  expectValidationResult(result, expectedValid);

  if (expectedErrorPatterns && !expectedValid) {
    expectedErrorPatterns.forEach(pattern => {
      const error = result.errors.find(err => {
        const pathMatch = pattern.path ? err.path?.includes(pattern.path) : true;
        const messageMatch = pattern.message ? err.message.includes(pattern.message) : true;
        return pathMatch && messageMatch;
      });
      expect(error).toBeDefined();
    });
  }
}

/**
 * 有効なバリデーション結果をアサート
 * @param validator バリデーター
 * @param testData テストデータ
 */
export function assertValid(
  validator: JsonSchemaValidator,
  testData: unknown
): void {
  const result = validator.validateAnalysisResult(testData as AnalysisResult);
  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
}

/**
 * 無効なバリデーション結果をアサート
 * @param validator バリデーター
 * @param testData テストデータ
 * @param minErrorCount 最小エラー数（オプション）
 */
export function assertInvalid(
  validator: JsonSchemaValidator,
  testData: unknown,
  minErrorCount: number = 1
): void {
  const result = validator.validateAnalysisResult(testData as AnalysisResult);
  expect(result.isValid).toBe(false);
  expect(result.errors.length).toBeGreaterThanOrEqual(minErrorCount);
}

/**
 * 特定のエラーパスをアサート
 * @param validator バリデーター
 * @param testData テストデータ
 * @param expectedPath 期待されるエラーパス
 */
export function assertErrorPath(
  validator: JsonSchemaValidator,
  testData: unknown,
  expectedPath: string
): void {
  const result = validator.validateAnalysisResult(testData as AnalysisResult);
  const error = result.errors.find(err => err.path === expectedPath);
  expect(error).toBeDefined();
}

/**
 * 特定のエラーメッセージを含むかをアサート
 * @param validator バリデーター
 * @param testData テストデータ
 * @param expectedMessage 期待されるメッセージの一部
 */
export function assertErrorMessage(
  validator: JsonSchemaValidator,
  testData: unknown,
  expectedMessage: string
): void {
  const result = validator.validateAnalysisResult(testData as AnalysisResult);
  const error = result.errors.find(err => err.message.includes(expectedMessage));
  expect(error).toBeDefined();
}

/**
 * 複数のバリデーションテストを一括実行
 * @param validator バリデーター
 * @param testCases テストケース配列
 */
export function runBatchValidations(
  validator: JsonSchemaValidator,
  testCases: Array<{
    data: unknown;
    expectedValid: boolean;
    description?: string;
  }>
): void {
  testCases.forEach(testCase => {
    const result = validator.validateAnalysisResult(testCase.data as AnalysisResult);
    expect(result.isValid).toBe(testCase.expectedValid);

    if (testCase.description) {
      // テストケースの説明をコンソールに出力（デバッグ用）
      if (!testCase.expectedValid && !result.isValid) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    }
  });
}