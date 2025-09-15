// MetricsAnalyzer追加カバレッジテスト - リソースフィルタリング
// CLAUDE.md準拠: No any types、TDD実践

import type { CloudFormationTemplate } from '../../../src/types/cloudformation';

import { setupMocks } from './analyzer-coverage.test-helpers';

describe('Resource Filtering Coverage', () => {
  test('should filter by resource types when specified', async () => {
    const { analyzer, mockParser } = setupMocks();
    const template: CloudFormationTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        DB: { Type: 'AWS::RDS::DBInstance', Properties: {} },
        Lambda: { Type: 'AWS::Lambda::Function', Properties: {} },
        Table: { Type: 'AWS::DynamoDB::Table', Properties: {} }
      }
    };

    mockParser.parse.mockResolvedValue(template);
    
    const result = await analyzer.analyze('template.yaml', {
      resourceTypes: ['AWS::RDS::DBInstance', 'AWS::DynamoDB::Table'],
      outputFormat: 'json'
    });
    
    // Should only analyze specified types
    expect(result.resources.filter(r => 
      r.resource_type === 'AWS::Lambda::Function'
    )).toHaveLength(0);
  });
});