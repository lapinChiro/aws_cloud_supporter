import { ErrorBuilder } from '../../../src/errors/error.builder';
import { ErrorCatalog } from '../../../src/errors/error.catalog';
import { CloudSupporterError } from '../../../src/errors/error.class';
import { ERROR_CODES, ErrorType } from '../../../src/errors/error.types';

describe('ErrorBuilder', () => {
  describe('Basic builder pattern', () => {
    it('should build error with all properties', () => {
      const error = new ErrorBuilder()
        .withCode(ERROR_CODES.METRICS_NOT_FOUND)
        .withType(ErrorType.RESOURCE_ERROR)
        .withMessage('Metrics not found')
        .withDetails({ resourceType: 'AWS::Lambda::Function' })
        .withFilePath('/path/to/file.yaml')
        .withLineNumber(42)
        .build();

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe('METRICS_NOT_FOUND');
      expect(error.type).toBe('RESOURCE_ERROR');
      expect(error.message).toBe('Metrics not found');
      expect(error.details).toEqual({ resourceType: 'AWS::Lambda::Function' });
      expect(error.filePath).toBe('/path/to/file.yaml');
      expect(error.lineNumber).toBe(42);
    });

    it('should build error with minimum required properties', () => {
      const error = new ErrorBuilder()
        .withCode(ERROR_CODES.VALIDATION_FAILED)
        .withType(ErrorType.VALIDATION_ERROR)
        .withMessage('Validation failed')
        .build();

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual({});
      expect(error.filePath).toBeUndefined();
      expect(error.lineNumber).toBeUndefined();
    });

    it('should support method chaining', () => {
      const builder = new ErrorBuilder();
      const result = builder
        .withCode(ERROR_CODES.FILE_NOT_FOUND)
        .withType(ErrorType.FILE_ERROR)
        .withMessage('File not found');

      expect(result).toBe(builder);
    });
  });

  describe('fromCatalog static method', () => {
    it('should create builder from catalog entry', () => {
      const catalogEntry = ErrorCatalog.metricsNotFound('Lambda');
      const error = ErrorBuilder.fromCatalog(catalogEntry)
        .withDetails({ resourceType: 'AWS::Lambda::Function' })
        .build();

      expect(error.code).toBe('METRICS_NOT_FOUND');
      expect(error.type).toBe('RESOURCE_ERROR');
      expect(error.message).toBe('Lambda metrics configuration not found');
      expect(error.details).toEqual({ resourceType: 'AWS::Lambda::Function' });
    });

    it('should allow overriding catalog values', () => {
      const catalogEntry = ErrorCatalog.fileNotFound('/original/path');
      const error = ErrorBuilder.fromCatalog(catalogEntry)
        .withMessage('Custom file not found message')
        .withFilePath('/actual/path.yaml')
        .build();

      expect(error.code).toBe('FILE_NOT_FOUND');
      expect(error.type).toBe('FILE_ERROR');
      expect(error.message).toBe('Custom file not found message');
      expect(error.filePath).toBe('/actual/path.yaml');
    });

    it('should work with generic catalog entries', () => {
      const catalogEntry = ErrorCatalog.generic(
        ERROR_CODES.OUTPUT_ERROR,
        ErrorType.OUTPUT_ERROR,
        'Output failed'
      );
      const error = ErrorBuilder.fromCatalog(catalogEntry).build();

      expect(error.code).toBe('OUTPUT_ERROR');
      expect(error.type).toBe('OUTPUT_ERROR');
      expect(error.message).toBe('Output failed');
    });
  });

  describe('withResourceType helper', () => {
    it('should add resourceType to details', () => {
      const error = new ErrorBuilder()
        .withCode(ERROR_CODES.RESOURCE_INVALID)
        .withType(ErrorType.RESOURCE_ERROR)
        .withMessage('Invalid resource')
        .withResourceType('AWS::DynamoDB::Table')
        .build();

      expect(error.details?.resourceType).toBe('AWS::DynamoDB::Table');
    });

    it('should merge with existing details', () => {
      const error = new ErrorBuilder()
        .withCode(ERROR_CODES.RESOURCE_INVALID)
        .withType(ErrorType.RESOURCE_ERROR)
        .withMessage('Invalid resource')
        .withDetails({ existingKey: 'existingValue' })
        .withResourceType('AWS::Lambda::Function')
        .build();

      expect(error.details).toEqual({
        existingKey: 'existingValue',
        resourceType: 'AWS::Lambda::Function'
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error when building without required properties', () => {
      expect(() => {
        new ErrorBuilder().build();
      }).toThrow('ErrorBuilder: code, type, and message are required');
    });

    it('should throw error when missing code', () => {
      expect(() => {
        new ErrorBuilder()
          .withType(ErrorType.FILE_ERROR)
          .withMessage('Test message')
          .build();
      }).toThrow('ErrorBuilder: code, type, and message are required');
    });

    it('should throw error when missing type', () => {
      expect(() => {
        new ErrorBuilder()
          .withCode(ERROR_CODES.FILE_NOT_FOUND)
          .withMessage('Test message')
          .build();
      }).toThrow('ErrorBuilder: code, type, and message are required');
    });

    it('should throw error when missing message', () => {
      expect(() => {
        new ErrorBuilder()
          .withCode(ERROR_CODES.FILE_NOT_FOUND)
          .withType(ErrorType.FILE_ERROR)
          .build();
      }).toThrow('ErrorBuilder: code, type, and message are required');
    });
  });

  describe('Details merging', () => {
    it('should accumulate details through multiple calls', () => {
      const error = new ErrorBuilder()
        .withCode(ERROR_CODES.VALIDATION_FAILED)
        .withType(ErrorType.VALIDATION_ERROR)
        .withMessage('Validation failed')
        .withDetails({ field1: 'value1' })
        .withDetails({ field2: 'value2' })
        .withDetails({ field3: 'value3' })
        .build();

      expect(error.details).toEqual({
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      });
    });

    it('should override duplicate keys in details', () => {
      const error = new ErrorBuilder()
        .withCode(ERROR_CODES.VALIDATION_FAILED)
        .withType(ErrorType.VALIDATION_ERROR)
        .withMessage('Validation failed')
        .withDetails({ key: 'original' })
        .withDetails({ key: 'updated' })
        .build();

      expect(error.details).toEqual({ key: 'updated' });
    });
  });

  describe('Real-world usage patterns', () => {
    it('should build Lambda metrics not found error', () => {
      const error = ErrorBuilder
        .fromCatalog(ErrorCatalog.metricsNotFound('Lambda'))
        .withResourceType('AWS::Lambda::Function')
        .withFilePath('/templates/serverless.yaml')
        .build();

      expect(error.code).toBe('METRICS_NOT_FOUND');
      expect(error.message).toBe('Lambda metrics configuration not found');
      expect(error.details?.resourceType).toBe('AWS::Lambda::Function');
    });

    it('should build validation error with context', () => {
      const error = ErrorBuilder
        .fromCatalog(ErrorCatalog.validationFailed('Invalid timeout value'))
        .withDetails({
          providedValue: 1000,
          maxValue: 900,
          field: 'Timeout'
        })
        .withFilePath('/templates/function.yaml')
        .withLineNumber(25)
        .build();

      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.message).toBe('Invalid timeout value');
      expect(error.details?.providedValue).toBe(1000);
      expect(error.lineNumber).toBe(25);
    });
  });
});