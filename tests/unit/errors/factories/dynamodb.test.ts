import { CloudSupporterError } from '../../../../src/errors/error.class';
import { ERROR_CODES, ErrorType } from '../../../../src/errors/error.types';
import { DynamoDBErrors } from '../../../../src/errors/factories/dynamodb';

describe('DynamoDBErrors Factory', () => {
  describe('metricsNotFound', () => {
    it('should create DynamoDB metrics not found error', () => {
      const error = DynamoDBErrors.metricsNotFound();

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
      expect(error.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(error.message).toBe('DynamoDB metrics configuration not found');
      expect(error.details?.resourceType).toBe('AWS::DynamoDB::Table');
    });

    it('should match existing error message format', () => {
      // 既存のgenerators/dynamodb.generator.tsと同じメッセージ形式
      const error = DynamoDBErrors.metricsNotFound();
      expect(error.message).toBe('DynamoDB metrics configuration not found');
    });
  });

  describe('invalidBillingMode', () => {
    it('should create invalid billing mode error', () => {
      const error = DynamoDBErrors.invalidBillingMode('INVALID_MODE');

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid DynamoDB billing mode: INVALID_MODE');
      expect(error.details?.billingMode).toBe('INVALID_MODE');
      expect(error.details?.resourceType).toBe('AWS::DynamoDB::Table');
    });

    it('should include billing mode in error details', () => {
      const billingMode = 'UNKNOWN';
      const error = DynamoDBErrors.invalidBillingMode(billingMode);

      expect(error.details).toEqual({
        billingMode: 'UNKNOWN',
        resourceType: 'AWS::DynamoDB::Table'
      });
    });
  });

  describe('throughputExceeded', () => {
    it('should create throughput exceeded error', () => {
      const error = DynamoDBErrors.throughputExceeded(50000, 40000);

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('DynamoDB throughput 50000 exceeds maximum of 40000');
      expect(error.details?.throughput).toBe(50000);
      expect(error.details?.maximum).toBe(40000);
      expect(error.details?.resourceType).toBe('AWS::DynamoDB::Table');
    });

    it('should include throughput values in details', () => {
      const error = DynamoDBErrors.throughputExceeded(100000, 40000);

      expect(error.details).toEqual({
        throughput: 100000,
        maximum: 40000,
        resourceType: 'AWS::DynamoDB::Table'
      });
    });
  });

  describe('Error properties', () => {
    it('should all errors have CloudSupporterError properties', () => {
      const errors = [
        DynamoDBErrors.metricsNotFound(),
        DynamoDBErrors.invalidBillingMode('test'),
        DynamoDBErrors.throughputExceeded(50000, 40000)
      ];

      errors.forEach(error => {
        expect(error.name).toBe('CloudSupporterError');
        expect(error.timestamp).toBeDefined();
        expect(error.stack).toBeDefined();
      });
    });

    it('should all errors include DynamoDB resource type', () => {
      const errors = [
        DynamoDBErrors.metricsNotFound(),
        DynamoDBErrors.invalidBillingMode('test'),
        DynamoDBErrors.throughputExceeded(50000, 40000)
      ];

      errors.forEach(error => {
        expect(error.details?.resourceType).toBe('AWS::DynamoDB::Table');
      });
    });
  });

  describe('Integration with existing system', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw DynamoDBErrors.metricsNotFound();
      }).toThrow(CloudSupporterError);

      expect(() => {
        throw DynamoDBErrors.metricsNotFound();
      }).toThrow('DynamoDB metrics configuration not found');
    });

    it('should serialize to JSON correctly', () => {
      const error = DynamoDBErrors.invalidBillingMode('PAY_PER_USE');
      const json = error.toJSON();

      expect(json).toHaveProperty('code', ERROR_CODES.VALIDATION_FAILED);
      expect(json).toHaveProperty('type', ErrorType.VALIDATION_ERROR);
      expect(json).toHaveProperty('message', 'Invalid DynamoDB billing mode: PAY_PER_USE');
      expect(json).toHaveProperty('details');
      expect(json).toHaveProperty('timestamp');
    });
  });
});