import { ErrorCatalog } from '../../../src/errors/error.catalog';
import { ERROR_CODES, ErrorType } from '../../../src/errors/error.types';

describe('ErrorCatalog', () => {
  describe('metricsNotFound', () => {
    it('should generate metrics not found error for Lambda', () => {
      const entry = ErrorCatalog.metricsNotFound('Lambda');

      expect(entry.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
      expect(entry.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(entry.message).toBe('Lambda metrics configuration not found');
    });

    it('should generate metrics not found error for DynamoDB', () => {
      const entry = ErrorCatalog.metricsNotFound('DynamoDB');

      expect(entry.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
      expect(entry.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(entry.message).toBe('DynamoDB metrics configuration not found');
    });

    it('should generate metrics not found error for ALB', () => {
      const entry = ErrorCatalog.metricsNotFound('ALB');

      expect(entry.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
      expect(entry.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(entry.message).toBe('ALB metrics configuration not found');
    });

    it('should work for all 6 existing services', () => {
      const services = ['Lambda', 'DynamoDB', 'ALB', 'ECS', 'API Gateway', 'RDS'];

      services.forEach(service => {
        const entry = ErrorCatalog.metricsNotFound(service);
        expect(entry.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
        expect(entry.type).toBe(ErrorType.RESOURCE_ERROR);
        expect(entry.message).toBe(`${service} metrics configuration not found`);
      });
    });
  });

  describe('unsupportedResourceType', () => {
    it('should generate unsupported resource type error', () => {
      const entry = ErrorCatalog.unsupportedResourceType('AWS::Lambda::Function', 'AWS::EC2::Instance');

      expect(entry.code).toBe(ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE);
      expect(entry.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(entry.message).toBe('Only AWS::Lambda::Function are supported, but got AWS::EC2::Instance');
    });

    it('should work with multiple expected types', () => {
      const entry = ErrorCatalog.unsupportedResourceType('AWS::Lambda::Function or AWS::DynamoDB::Table', 'AWS::EC2::Instance');

      expect(entry.code).toBe(ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE);
      expect(entry.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(entry.message).toBe('Only AWS::Lambda::Function or AWS::DynamoDB::Table are supported, but got AWS::EC2::Instance');
    });
  });

  describe('validationFailed', () => {
    it('should generate validation failed error with custom message', () => {
      const entry = ErrorCatalog.validationFailed('Template must contain at least one resource');

      expect(entry.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(entry.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(entry.message).toBe('Template must contain at least one resource');
    });

    it('should handle complex validation messages', () => {
      const message = 'Resource "MyFunction" has invalid property "Runtime": python3.12 is not supported';
      const entry = ErrorCatalog.validationFailed(message);

      expect(entry.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(entry.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(entry.message).toBe(message);
    });
  });

  describe('fileNotFound', () => {
    it('should generate file not found error', () => {
      const entry = ErrorCatalog.fileNotFound('/path/to/template.yaml');

      expect(entry.code).toBe(ERROR_CODES.FILE_NOT_FOUND);
      expect(entry.type).toBe(ErrorType.FILE_ERROR);
      expect(entry.message).toBe('File not found: /path/to/template.yaml');
    });

    it('should handle Windows paths', () => {
      const entry = ErrorCatalog.fileNotFound('C:\\Users\\test\\template.yaml');

      expect(entry.code).toBe(ERROR_CODES.FILE_NOT_FOUND);
      expect(entry.type).toBe(ErrorType.FILE_ERROR);
      expect(entry.message).toBe('File not found: C:\\Users\\test\\template.yaml');
    });
  });

  describe('generic', () => {
    it('should create a generic error with custom parameters', () => {
      const entry = ErrorCatalog.generic(
        ERROR_CODES.OUTPUT_ERROR,
        ErrorType.OUTPUT_ERROR,
        'Failed to write output file'
      );

      expect(entry.code).toBe(ERROR_CODES.OUTPUT_ERROR);
      expect(entry.type).toBe(ErrorType.OUTPUT_ERROR);
      expect(entry.message).toBe('Failed to write output file');
    });

    it('should work with any error code and type combination', () => {
      const entry = ErrorCatalog.generic(
        ERROR_CODES.FILE_READ_ERROR,
        ErrorType.FILE_ERROR,
        'Permission denied while reading file'
      );

      expect(entry.code).toBe(ERROR_CODES.FILE_READ_ERROR);
      expect(entry.type).toBe(ErrorType.FILE_ERROR);
      expect(entry.message).toBe('Permission denied while reading file');
    });
  });

  describe('Compatibility with existing error messages', () => {
    it('should match existing Lambda error message format', () => {
      // 既存のエラーメッセージ: 'Lambda metrics configuration not found'
      const entry = ErrorCatalog.metricsNotFound('Lambda');
      expect(entry.message).toBe('Lambda metrics configuration not found');
    });

    it('should match existing DynamoDB error message format', () => {
      // 既存のエラーメッセージ: 'DynamoDB metrics configuration not found'
      const entry = ErrorCatalog.metricsNotFound('DynamoDB');
      expect(entry.message).toBe('DynamoDB metrics configuration not found');
    });

    it('should match existing ECS error message format', () => {
      // 既存のエラーメッセージ: 'ECS metrics configuration not found'
      const entry = ErrorCatalog.metricsNotFound('ECS');
      expect(entry.message).toBe('ECS metrics configuration not found');
    });

    it('should match existing API Gateway error message format', () => {
      // 既存のエラーメッセージ: 'API Gateway metrics configuration not found'
      const entry = ErrorCatalog.metricsNotFound('API Gateway');
      expect(entry.message).toBe('API Gateway metrics configuration not found');
    });

    it('should match existing RDS error message format', () => {
      // 既存のエラーメッセージ: 'RDS metrics configuration not found'
      const entry = ErrorCatalog.metricsNotFound('RDS');
      expect(entry.message).toBe('RDS metrics configuration not found');
    });

    it('should match existing ALB error message format', () => {
      // 既存のエラーメッセージ: 'ALB metrics configuration not found'
      const entry = ErrorCatalog.metricsNotFound('ALB');
      expect(entry.message).toBe('ALB metrics configuration not found');
    });
  });
});