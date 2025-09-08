import { MetricsAnalyzer } from '../../../src/core/analyzer';
import { TemplateParser } from '../../../src/core/parser';
import { Logger } from '../../../src/utils/logger';

describe('MetricsAnalyzer (Integration with Real Components)', () => {
  let analyzer: MetricsAnalyzer;
  let parser: TemplateParser;
  let logger: Logger;

  beforeEach(() => {
    parser = new TemplateParser();
    logger = new Logger('error', false); // Minimal logging
    analyzer = new MetricsAnalyzer(parser, logger);
  });

  describe('getRegisteredGenerators', () => {
    it('should return list of registered generator names', () => {
      const generators = analyzer.getRegisteredGenerators();
      
      expect(Array.isArray(generators)).toBe(true);
      expect(generators.length).toBe(6);
      expect(generators).toEqual(expect.arrayContaining([
        'RDSMetricsGenerator',
        'LambdaMetricsGenerator',
        'ECSMetricsGenerator',
        'ALBMetricsGenerator',
        'DynamoDBMetricsGenerator',
        'APIGatewayMetricsGenerator'
      ]));
    });
  });

  describe('getAnalysisStatistics', () => {
    it('should return null if no analysis has been performed', () => {
      const stats = analyzer.getAnalysisStatistics();
      expect(stats).toBeNull();
    });
  });
});