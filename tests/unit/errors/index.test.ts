import {
  CloudSupporterError,
  ErrorType,
  ERROR_CODES,
  ErrorBuilder,
  ErrorCatalog,
  Errors
} from '../../../src/errors';
import type { ErrorDetails, ErrorCatalogEntry ,
  ErrorCode} from '../../../src/errors';

describe('Error System Public API', () => {
  describe('Core exports', () => {
    it('should export CloudSupporterError class', () => {
      const error = new CloudSupporterError(
        ERROR_CODES.METRICS_NOT_FOUND,
        ErrorType.RESOURCE_ERROR,
        'Test error'
      );
      expect(error).toBeInstanceOf(CloudSupporterError);
    });

    it('should export ErrorType enum', () => {
      expect(ErrorType.FILE_ERROR).toBe('FILE_ERROR');
      expect(ErrorType.PARSE_ERROR).toBe('PARSE_ERROR');
      expect(ErrorType.RESOURCE_ERROR).toBe('RESOURCE_ERROR');
      expect(ErrorType.OUTPUT_ERROR).toBe('OUTPUT_ERROR');
      expect(ErrorType.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });

    it('should export ERROR_CODES constant', () => {
      expect(ERROR_CODES.METRICS_NOT_FOUND).toBe('METRICS_NOT_FOUND');
      expect(ERROR_CODES.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
      expect(ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
    });

    it('should export ErrorBuilder class', () => {
      const builder = new ErrorBuilder();
      expect(builder).toBeInstanceOf(ErrorBuilder);
    });

    it('should export ErrorCatalog object', () => {
      expect(ErrorCatalog.metricsNotFound).toBeDefined();
      expect(ErrorCatalog.fileNotFound).toBeDefined();
      expect(ErrorCatalog.validationFailed).toBeDefined();
    });
  });

  describe('Errors factory object', () => {
    it('should export Errors with all factories', () => {
      expect(Errors).toBeDefined();
      expect(Errors.Lambda).toBeDefined();
      expect(Errors.DynamoDB).toBeDefined();
      expect(Errors.ALB).toBeDefined();
      expect(Errors.Common).toBeDefined();
    });

    it('should have Lambda factory methods', () => {
      expect(Errors.Lambda.metricsNotFound).toBeDefined();
      expect(Errors.Lambda.invalidRuntime).toBeDefined();
      expect(Errors.Lambda.timeoutTooHigh).toBeDefined();
    });

    it('should have DynamoDB factory methods', () => {
      expect(Errors.DynamoDB.metricsNotFound).toBeDefined();
      expect(Errors.DynamoDB.invalidBillingMode).toBeDefined();
      expect(Errors.DynamoDB.throughputExceeded).toBeDefined();
    });

    it('should have ALB factory methods', () => {
      expect(Errors.ALB.metricsNotFound).toBeDefined();
      expect(Errors.ALB.invalidTargetType).toBeDefined();
    });

    it('should have Common factory methods', () => {
      expect(Errors.Common.fileNotFound).toBeDefined();
      expect(Errors.Common.validationFailed).toBeDefined();
      expect(Errors.Common.fileReadError).toBeDefined();
      expect(Errors.Common.outputError).toBeDefined();
      expect(Errors.Common.parseError).toBeDefined();
    });
  });

  describe('Factory method functionality', () => {
    it('should create Lambda errors', () => {
      const error = Errors.Lambda.metricsNotFound();
      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.message).toBe('Lambda metrics configuration not found');
    });

    it('should create DynamoDB errors', () => {
      const error = Errors.DynamoDB.metricsNotFound();
      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.message).toBe('DynamoDB metrics configuration not found');
    });

    it('should create ALB errors', () => {
      const error = Errors.ALB.metricsNotFound();
      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.message).toBe('ALB metrics configuration not found');
    });

    it('should create Common errors', () => {
      const error = Errors.Common.fileNotFound('/test.yaml');
      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.message).toBe('File not found: /test.yaml');
    });
  });

  describe('Type exports', () => {
    it('should allow type usage for ErrorCode', () => {
      const code: ErrorCode = ERROR_CODES.METRICS_NOT_FOUND;
      expect(code).toBe('METRICS_NOT_FOUND');
    });

    it('should allow type usage for ErrorDetails', () => {
      const details: ErrorDetails = {
        originalError: 'test',
        filePath: '/test',
        lineNumber: 1,
        resourceType: 'test'
      };
      expect(details).toBeDefined();
    });

    it('should allow type usage for ErrorCatalogEntry', () => {
      const entry: ErrorCatalogEntry = {
        code: ERROR_CODES.METRICS_NOT_FOUND,
        type: ErrorType.RESOURCE_ERROR,
        message: 'Test message'
      };
      expect(entry).toBeDefined();
    });
  });

  describe('Backwards compatibility', () => {
    it('should maintain consistent error structure', () => {
      const error = Errors.Lambda.metricsNotFound();

      expect(error.name).toBe('CloudSupporterError');
      expect(error.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
      expect(error.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(error.message).toBe('Lambda metrics configuration not found');
      expect(error.details?.resourceType).toBe('AWS::Lambda::Function');
      expect(error.timestamp).toBeDefined();
    });

    it('should be compatible with existing error handling patterns', () => {
      const handleError = (error: CloudSupporterError): string => {
        if (error.type === ErrorType.RESOURCE_ERROR) {
          return 'Resource error';
        }
        return 'Other error';
      };

      const error = Errors.Lambda.metricsNotFound();
      expect(handleError(error)).toBe('Resource error');
    });
  });
});