// JSONOutputFormatterバリデーションテスト
// CLAUDE.md準拠: No any types、TDD実践

import type { AnalysisResult } from '../../../src/types/metrics';
import {
  createJSONFormatterTestSuite,
  parseAndValidateJSON,
  assertSensitivePropertiesRedacted,
  type ParsedAnalysisResult
} from '../../helpers/json-formatter-test-template';

import { createMockAnalysisResult } from './json-formatter.test-helpers';

createJSONFormatterTestSuite('Validation', [
  {
    name: 'should validate output against schema',
    test: (formatter, mockResult, mockValidateMetricsOutput) => {
      formatter.formatJSON(mockResult);

      expect(mockValidateMetricsOutput).toHaveBeenCalledTimes(1);
      expect(mockValidateMetricsOutput).toHaveBeenCalledWith(expect.any(Object) as ParsedAnalysisResult);
    }
  },
  {
    name: 'should throw error if validation fails',
    test: (formatter, mockResult, mockValidateMetricsOutput) => {
      mockValidateMetricsOutput.mockReturnValue({
        valid: false,
        errors: ['Invalid metric structure', 'Missing required field']
      });

      expect(() => { formatter.formatJSON(mockResult); }).toThrow(
        'JSON output validation failed: Invalid metric structure; Missing required field'
      );
    }
  },
  {
    name: 'should redact sensitive properties in resources',
    test: (formatter, mockResult) => {
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
      const parsed = parseAndValidateJSON(json);

      const firstResource = parsed.resources[0];
      if (!firstResource) throw new Error('First resource not found');
      const props = firstResource.resource_properties;

      assertSensitivePropertiesRedacted(props, [
        'MasterUserPassword',
        'DBPassword',
        'SecretString'
      ]);
      expect(props.DBInstanceClass).toBe('db.t3.medium');
    }
  },
  {
    name: 'should preserve resource property types',
    test: (formatter, mockResult) => {
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
      const parsed = parseAndValidateJSON(json);

      const firstResource = parsed.resources[0];
      if (!firstResource) throw new Error('First resource not found');
      const props = firstResource.resource_properties;
      expect(typeof props.TableName).toBe('string');
      expect(typeof props.StreamEnabled).toBe('boolean');
      expect(props.StreamEnabled).toBe(true);
      expect(props.PointInTimeRecoveryEnabled).toBe(false);
      expect(Array.isArray(props.Tags)).toBe(true);
      expect(typeof props.ProvisionedThroughput).toBe('object');
    }
  }
], createMockAnalysisResult);