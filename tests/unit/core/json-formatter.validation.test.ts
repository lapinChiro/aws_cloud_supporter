// JSONOutputFormatterバリデーションテスト
// CLAUDE.md準拠: No any types、TDD実践

import { JSONOutputFormatter } from '../../../src/core/json-formatter';
import type { AnalysisResult } from '../../../src/types/metrics';
import { validateMetricsOutput } from '../../../src/utils/schema-validator';

import type { ParsedAnalysisResult } from './json-formatter.test-helpers';
import { createMockAnalysisResult } from './json-formatter.test-helpers';

// Mock schema validator
jest.mock('../../../src/utils/schema-validator');
const mockValidateMetricsOutput = validateMetricsOutput as jest.MockedFunction<typeof validateMetricsOutput>;

describe('JSONOutputFormatter - Validation', () => {
  let formatter: JSONOutputFormatter;
  let mockResult: AnalysisResult;

  beforeEach(() => {
    formatter = new JSONOutputFormatter();
    jest.clearAllMocks();
    
    // Default: validation passes
    mockValidateMetricsOutput.mockReturnValue({ valid: true, errors: [] });
    
    // Mock analysis result
    mockResult = createMockAnalysisResult();
  });

  test('should validate output against schema', () => {
    formatter.formatJSON(mockResult);
    
    expect(mockValidateMetricsOutput).toHaveBeenCalledTimes(1);
    expect(mockValidateMetricsOutput).toHaveBeenCalledWith(expect.any(Object) as ParsedAnalysisResult);
  });

  test('should throw error if validation fails', () => {
    mockValidateMetricsOutput.mockReturnValue({
      valid: false,
      errors: ['Invalid metric structure', 'Missing required field']
    });
    
    expect(() => { formatter.formatJSON(mockResult); }).toThrow(
      'JSON output validation failed: Invalid metric structure; Missing required field'
    );
  });

  test('should redact sensitive properties in resources', () => {
    const resultWithSecrets: AnalysisResult = {
      ...mockResult,
      resources: [{
        logical_id: 'Secret',
        resource_type: 'AWS::RDS::DBInstance',
        resource_properties: {
          DBInstanceClass: 'db.t3.medium',
          MasterUserPassword: 'secret-password',
          DBPassword: 'another-secret',
          SecretString: 'secret-value'
        },
        metrics: []
      }]
    };
    
    const json = formatter.formatJSON(resultWithSecrets);
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    
    const firstResource = parsed.resources[0];
    if (!firstResource) throw new Error('First resource not found');
    const props = firstResource.resource_properties;
    expect(props.MasterUserPassword).toBe('[REDACTED]');
    expect(props.DBPassword).toBe('[REDACTED]');
    expect(props.SecretString).toBe('[REDACTED]');
    expect(props.DBInstanceClass).toBe('db.t3.medium');
  });

  test('should preserve resource property types', () => {
    const resultWithTypes: AnalysisResult = {
      ...mockResult,
      resources: [{
        logical_id: 'Mixed',
        resource_type: 'AWS::DynamoDB::Table',
        resource_properties: {
          TableName: 'MyTable',
          BillingMode: 'PAY_PER_REQUEST',
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          },
          Tags: [
            { Key: 'Environment', Value: 'Production' }
          ],
          StreamEnabled: true,
          PointInTimeRecoveryEnabled: false
        },
        metrics: []
      }]
    };
    
    const json = formatter.formatJSON(resultWithTypes);
    const parsed = JSON.parse(json) as ParsedAnalysisResult;
    
    const firstResource = parsed.resources[0];
    if (!firstResource) throw new Error('First resource not found');
    const props = firstResource.resource_properties;
    expect(typeof props.TableName).toBe('string');
    expect(typeof props.StreamEnabled).toBe('boolean');
    expect(props.StreamEnabled).toBe(true);
    expect(props.PointInTimeRecoveryEnabled).toBe(false);
    expect(Array.isArray(props.Tags)).toBe(true);
    expect(typeof props.ProvisionedThroughput).toBe('object');
  });
});