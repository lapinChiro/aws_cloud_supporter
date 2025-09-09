// Isolated mocked unit tests for MetricsAnalyzer
// p-limitモック設定
jest.mock('p-limit');

// Generatorモック設定
const createMockMetric = () => ({
  metric_name: 'TestMetric',
  namespace: 'AWS/Test', 
  unit: 'Count',
  description: 'Test metric',
  statistic: 'Sum' as const,
  recommended_threshold: { warning: 10, critical: 20 },
  evaluation_period: 300,
  category: 'Performance' as const,
  importance: 'Medium' as const,
  dimensions: []
});

jest.mock('../../../src/generators/rds.generator', () => ({
  RDSMetricsGenerator: jest.fn().mockImplementation(() => ({
    getSupportedTypes: () => ['AWS::RDS::DBInstance'],
    generate: jest.fn().mockResolvedValue([createMockMetric()])
  }))
}));

jest.mock('../../../src/generators/lambda.generator', () => ({
  LambdaMetricsGenerator: jest.fn().mockImplementation(() => ({
    getSupportedTypes: () => ['AWS::Lambda::Function'],
    generate: jest.fn().mockResolvedValue([createMockMetric()])
  }))
}));

jest.mock('../../../src/generators/ecs.generator', () => ({
  ECSMetricsGenerator: jest.fn().mockImplementation(() => ({
    getSupportedTypes: () => ['AWS::ECS::Service'],
    generate: jest.fn().mockResolvedValue([createMockMetric()])
  }))
}));

jest.mock('../../../src/generators/alb.generator', () => ({
  ALBMetricsGenerator: jest.fn().mockImplementation(() => ({
    getSupportedTypes: () => ['AWS::ElasticLoadBalancingV2::LoadBalancer'],
    generate: jest.fn().mockResolvedValue([createMockMetric()])
  }))
}));

jest.mock('../../../src/generators/dynamodb.generator', () => ({
  DynamoDBMetricsGenerator: jest.fn().mockImplementation(() => ({
    getSupportedTypes: () => ['AWS::DynamoDB::Table'],
    generate: jest.fn().mockResolvedValue([createMockMetric()])
  }))
}));

jest.mock('../../../src/generators/apigateway.generator', () => ({
  APIGatewayMetricsGenerator: jest.fn().mockImplementation(() => ({
    getSupportedTypes: () => ['AWS::ApiGateway::RestApi', 'AWS::Serverless::Api'],
    generate: jest.fn().mockResolvedValue([createMockMetric()])
  }))
}));

import { MetricsAnalyzer } from '../../../src/core/analyzer';
import { ITemplateParser } from '../../../src/interfaces/parser';
import { ILogger } from '../../../src/interfaces/logger';
import { CloudFormationTemplate } from '../../../src/types/cloudformation';
import { createMockLogger } from '../../helpers';

describe('MetricsAnalyzer (Mocked Unit Tests)', () => {
  let analyzer: MetricsAnalyzer;
  let mockParser: jest.Mocked<ITemplateParser>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    // モック作成（CLAUDE.md: No any types）
    mockParser = {
      parse: jest.fn()
    };

    mockLogger = createMockLogger();

    analyzer = new MetricsAnalyzer(mockParser, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    const mockTemplate: CloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        TestDB: {
          Type: 'AWS::RDS::DBInstance',
          Properties: {
            DBInstanceClass: 'db.t3.micro',
            Engine: 'mysql'
          }
        },
        TestFunction: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Runtime: 'nodejs18.x',
            MemorySize: 256
          }
        },
        UnsupportedResource: {
          Type: 'AWS::CustomResource::Unknown',
          Properties: {}
        }
      }
    };

    it('should analyze template and return results', async () => {
      mockParser.parse.mockResolvedValue(mockTemplate);

      const result = await analyzer.analyze('/test/template.yaml', {
        outputFormat: 'json'
      });

      expect(mockParser.parse).toHaveBeenCalledWith('/test/template.yaml');
      expect(result.metadata.template_path).toBe('/test/template.yaml');
      expect(result.metadata.total_resources).toBe(3);
      expect(result.metadata.supported_resources).toBe(2);
      expect(result.resources).toHaveLength(2);
      expect(result.unsupported_resources).toContain('UnsupportedResource');
    });
  });
});