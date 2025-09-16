// tests/helpers/html-formatter-test-template.ts
// HTMLフォーマッターテスト用の共通テンプレート

import { HTMLOutputFormatter } from '../../src/core/formatters/html';
import type { ExtendedAnalysisResult } from '../../src/interfaces/analyzer';

export interface HTMLTestCase {
  name: string;
  test: (formatter: HTMLOutputFormatter, mockResult: ExtendedAnalysisResult) => void;
}

/**
 * HTMLフォーマッターのテストスイートを作成
 * @param testCategory テストカテゴリ名
 * @param testCases テストケース配列
 * @param createMockResult モック結果作成関数
 */
export function createHTMLFormatterTestSuite(
  testCategory: string,
  testCases: HTMLTestCase[],
  createMockResult: () => ExtendedAnalysisResult
): void {
  describe(`HTMLOutputFormatter - ${testCategory}`, () => {
    let formatter: HTMLOutputFormatter;

    beforeEach(() => {
      formatter = new HTMLOutputFormatter();
    });

    testCases.forEach(testCase => {
      test(testCase.name, () => {
        const mockResult = createMockResult();
        testCase.test(formatter, mockResult);
      });
    });
  });
}

/**
 * HTML内容の複数アサーションを実行
 * @param html HTML文字列
 * @param expectedContents 期待される内容の配列
 */
export function expectHTMLToContain(
  html: string,
  expectedContents: string[]
): void {
  expectedContents.forEach(content => {
    expect(html).toContain(content);
  });
}

/**
 * HTML内容が含まれていないことをアサート
 * @param html HTML文字列
 * @param unexpectedContents 含まれていないはずの内容の配列
 */
export function expectHTMLNotToContain(
  html: string,
  unexpectedContents: string[]
): void {
  unexpectedContents.forEach(content => {
    expect(html).not.toContain(content);
  });
}

/**
 * HTML構造の基本アサーション
 * @param html HTML文字列
 */
export function expectBasicHTMLStructure(html: string): void {
  const basicElements = [
    '<!DOCTYPE html>',
    '<html',
    '<head>',
    '<body>',
    '</html>',
    '<meta charset="UTF-8">',
    '<meta name="viewport"'
  ];

  expectHTMLToContain(html, basicElements);
}

/**
 * CSSスタイルの存在をアサート
 * @param html HTML文字列
 * @param cssClasses CSSクラス名の配列
 */
export function expectCSSStyles(html: string, cssClasses: string[]): void {
  expect(html).toContain('<style>');
  expect(html).toContain('</style>');

  cssClasses.forEach(className => {
    expect(html).toContain(`.${className} {`);
  });
}

/**
 * リソースカードの存在をアサート
 * @param html HTML文字列
 * @param resourceName リソース名
 * @param resourceType リソースタイプ
 */
export function expectResourceCard(
  html: string,
  resourceName: string,
  resourceType: string
): void {
  expect(html).toContain(resourceName);
  expect(html).toContain(resourceType);
}

/**
 * パフォーマンステストを実行
 * @param formatter HTMLフォーマッター
 * @param result 分析結果
 * @param maxDurationMs 最大許容時間（ミリ秒）
 */
export function runHTMLPerformanceTest(
  formatter: HTMLOutputFormatter,
  result: ExtendedAnalysisResult,
  maxDurationMs: number = 3000
): void {
  const startTime = Date.now();
  formatter.formatHTML(result);
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(maxDurationMs);
}

/**
 * HTMLフォーマッターのテストスイートを作成（特殊なモック関数なし版）
 * @param testCategory テストカテゴリ名
 * @param testCases テストケース配列
 */
export function createHTMLFormatterTestSuiteWithoutMock(
  testCategory: string,
  testCases: Array<{ name: string; test: (formatter: HTMLOutputFormatter) => void }>
): void {
  describe(`HTMLOutputFormatter - ${testCategory}`, () => {
    let formatter: HTMLOutputFormatter;

    beforeEach(() => {
      formatter = new HTMLOutputFormatter();
    });

    testCases.forEach(testCase => {
      test(testCase.name, () => {
        testCase.test(formatter);
      });
    });
  });
}