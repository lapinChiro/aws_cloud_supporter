import { CloudSupporterError } from '../../../../src/errors/error.class';
import { ERROR_CODES, ErrorType } from '../../../../src/errors/error.types';
import { LambdaErrors } from '../../../../src/errors/factories/lambda';

describe('LambdaErrors Factory', () => {
  describe('metricsNotFound', () => {
    it('should create Lambda metrics not found error', () => {
      const error = LambdaErrors.metricsNotFound();

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
      expect(error.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(error.message).toBe('Lambda metrics configuration not found');
      expect(error.details?.resourceType).toBe('AWS::Lambda::Function');
    });

    it('should match existing error message format', () => {
      // 既存のgenerators/lambda.generator.tsと同じメッセージ形式
      const error = LambdaErrors.metricsNotFound();
      expect(error.message).toBe('Lambda metrics configuration not found');
    });
  });

  describe('invalidRuntime', () => {
    it('should create invalid runtime error', () => {
      const error = LambdaErrors.invalidRuntime('python3.12');

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid Lambda runtime: python3.12');
      expect(error.details?.runtime).toBe('python3.12');
      expect(error.details?.resourceType).toBe('AWS::Lambda::Function');
    });

    it('should include runtime in error details', () => {
      const runtime = 'nodejs20.x';
      const error = LambdaErrors.invalidRuntime(runtime);

      expect(error.details).toEqual({
        runtime: 'nodejs20.x',
        resourceType: 'AWS::Lambda::Function'
      });
    });
  });

  describe('timeoutTooHigh', () => {
    it('should create timeout too high error', () => {
      const error = LambdaErrors.timeoutTooHigh(1000);

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Lambda timeout 1000s exceeds maximum of 900s');
      expect(error.details?.timeout).toBe(1000);
      expect(error.details?.maximum).toBe(900);
      expect(error.details?.resourceType).toBe('AWS::Lambda::Function');
    });

    it('should include timeout and maximum in details', () => {
      const timeout = 1500;
      const error = LambdaErrors.timeoutTooHigh(timeout);

      expect(error.details).toEqual({
        timeout: 1500,
        maximum: 900,
        resourceType: 'AWS::Lambda::Function'
      });
    });

    it('should format message correctly for edge cases', () => {
      const error = LambdaErrors.timeoutTooHigh(901);
      expect(error.message).toBe('Lambda timeout 901s exceeds maximum of 900s');
    });
  });

  describe('Error properties', () => {
    it('should all errors have CloudSupporterError properties', () => {
      const errors = [
        LambdaErrors.metricsNotFound(),
        LambdaErrors.invalidRuntime('test'),
        LambdaErrors.timeoutTooHigh(1000)
      ];

      errors.forEach(error => {
        expect(error.name).toBe('CloudSupporterError');
        expect(error.timestamp).toBeDefined();
        expect(error.stack).toBeDefined();
      });
    });

    it('should all errors include Lambda resource type', () => {
      const errors = [
        LambdaErrors.metricsNotFound(),
        LambdaErrors.invalidRuntime('test'),
        LambdaErrors.timeoutTooHigh(1000)
      ];

      errors.forEach(error => {
        expect(error.details?.resourceType).toBe('AWS::Lambda::Function');
      });
    });
  });

  describe('Integration with existing system', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw LambdaErrors.metricsNotFound();
      }).toThrow(CloudSupporterError);

      expect(() => {
        throw LambdaErrors.metricsNotFound();
      }).toThrow('Lambda metrics configuration not found');
    });

    it('should serialize to JSON correctly', () => {
      const error = LambdaErrors.invalidRuntime('python3.12');
      const json = error.toJSON();

      expect(json).toHaveProperty('code', ERROR_CODES.VALIDATION_FAILED);
      expect(json).toHaveProperty('type', ErrorType.VALIDATION_ERROR);
      expect(json).toHaveProperty('message', 'Invalid Lambda runtime: python3.12');
      expect(json).toHaveProperty('details');
      expect(json).toHaveProperty('timestamp');
    });
  });
});