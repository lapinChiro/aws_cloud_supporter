// MetricsAnalyzerカバレッジテストヘルパー
// CLAUDE.md準拠: No any types、TDD実践

import { MetricsAnalyzer } from '../../../src/core/analyzer';
import { TemplateParser } from '../../../src/core/parser';
import type { CloudFormationTemplate } from '../../../src/types/cloudformation';
import { Logger } from '../../../src/utils/logger';

// Mock dependencies
jest.mock('../../../src/core/parser');
jest.mock('../../../src/utils/logger');

const MockTemplateParser = TemplateParser as jest.MockedClass<typeof TemplateParser>;
const MockLogger = Logger as jest.MockedClass<typeof Logger>;

export interface MockSetup {
  analyzer: MetricsAnalyzer;
  mockParser: jest.Mocked<TemplateParser>;
  mockLogger: jest.Mocked<Logger>;
}

export function setupMocks(): MockSetup {
  jest.clearAllMocks();
  
  const mockParser = new MockTemplateParser() as jest.Mocked<TemplateParser>;
  const mockLogger = new MockLogger() as jest.Mocked<Logger>;
  
  const analyzer = new MetricsAnalyzer(mockParser, mockLogger);
  
  return { analyzer, mockParser, mockLogger };
}

export function createSimpleTemplate(): CloudFormationTemplate {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      Database: {
        Type: 'AWS::RDS::DBInstance',
        Properties: {
          DBInstanceClass: 'db.t3.medium'
        }
      }
    }
  };
}

export function createLargeTemplate(): CloudFormationTemplate {
  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {}
  };
  
  for (let i = 0; i < 50; i++) {
    template.Resources[`Resource${i}`] = {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Runtime: 'nodejs18.x'
      }
    };
  }
  
  return template;
}