// HTMLOutputFormatter テスト - エッジケース
// CLAUDE.md準拠: No any types、TDD実践

import { HTMLOutputFormatter } from '../../../src/core/formatters/html';

import { 
  createEmptyAnalysisResult, 
  createResultWithUnsupportedResources 
} from './html-formatter.test-helpers';

describe('HTMLOutputFormatter - Edge Cases', () => {
  let formatter: HTMLOutputFormatter;

  beforeEach(() => {
    formatter = new HTMLOutputFormatter();
  });

  test('should handle unsupported resources', () => {
    const mockResult = createResultWithUnsupportedResources();
    const html = formatter.formatHTML(mockResult);

    expect(html).toContain('Unsupported Resources');
    expect(html).toContain('UnsupportedVPC');
    expect(html).toContain('UnsupportedBucket');
  });

  test('should handle empty results', () => {
    const emptyResult = createEmptyAnalysisResult();
    const html = formatter.formatHTML(emptyResult);

    expect(html).toContain('Resources: 0/0');
    expect(html).toContain('No supported resources found');
    expect(html).toContain('<!DOCTYPE html>'); // Still valid HTML
  });
});