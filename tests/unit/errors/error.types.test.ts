import type { ErrorCode, ErrorDetails, ErrorCatalogEntry } from '../../../src/errors/error.types';
import { ERROR_CODES, ErrorType } from '../../../src/errors/error.types';

describe('Error Types Definitions', () => {
  describe('ERROR_CODES', () => {
    it('should define all required error codes', () => {
      // Phase 1: Core error codes
      expect(ERROR_CODES.METRICS_NOT_FOUND).toBe('METRICS_NOT_FOUND');
      expect(ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE).toBe('RESOURCE_UNSUPPORTED_TYPE');
      expect(ERROR_CODES.RESOURCE_INVALID).toBe('RESOURCE_INVALID');
      expect(ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
      expect(ERROR_CODES.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
      expect(ERROR_CODES.FILE_READ_ERROR).toBe('FILE_READ_ERROR');
      expect(ERROR_CODES.OUTPUT_ERROR).toBe('OUTPUT_ERROR');
    });

    it('should be immutable', () => {
      expect(() => {
        // @ts-expect-error Testing immutability
        ERROR_CODES.NEW_CODE = 'NEW_CODE';
      }).toThrow();
    });
  });

  describe('ErrorType enum', () => {
    it('should define all error types', () => {
      expect(ErrorType.FILE_ERROR).toBe('FILE_ERROR');
      expect(ErrorType.PARSE_ERROR).toBe('PARSE_ERROR');
      expect(ErrorType.RESOURCE_ERROR).toBe('RESOURCE_ERROR');
      expect(ErrorType.OUTPUT_ERROR).toBe('OUTPUT_ERROR');
      expect(ErrorType.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });
  });

  describe('ErrorDetails interface', () => {
    it('should accept standard error details', () => {
      const details: ErrorDetails = {
        originalError: 'Original error message',
        filePath: '/path/to/file.yaml',
        lineNumber: 42,
        resourceType: 'AWS::Lambda::Function'
      };

      expect(details.originalError).toBe('Original error message');
      expect(details.filePath).toBe('/path/to/file.yaml');
      expect(details.lineNumber).toBe(42);
      expect(details.resourceType).toBe('AWS::Lambda::Function');
    });

    it('should accept custom properties', () => {
      const details: ErrorDetails = {
        customField: 'custom value',
        nestedObject: { key: 'value' }
      };

      expect(details.customField).toBe('custom value');
      expect(details.nestedObject).toEqual({ key: 'value' });
    });
  });

  describe('ErrorCatalogEntry interface', () => {
    it('should define catalog entry structure', () => {
      const entry: ErrorCatalogEntry = {
        code: ERROR_CODES.METRICS_NOT_FOUND,
        type: ErrorType.RESOURCE_ERROR,
        message: 'Metrics configuration not found'
      };

      expect(entry.code).toBe('METRICS_NOT_FOUND');
      expect(entry.type).toBe('RESOURCE_ERROR');
      expect(entry.message).toBe('Metrics configuration not found');
    });
  });

  describe('ErrorCode type', () => {
    it('should be derived from ERROR_CODES', () => {
      const code: ErrorCode = ERROR_CODES.METRICS_NOT_FOUND;
      expect(code).toBe('METRICS_NOT_FOUND');

      // Type safety test - should only accept valid codes
      const validCodes: ErrorCode[] = [
        ERROR_CODES.METRICS_NOT_FOUND,
        ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE,
        ERROR_CODES.VALIDATION_FAILED
      ];

      expect(validCodes).toHaveLength(3);
    });
  });

  describe('Compatibility with existing system', () => {
    it('should be compatible with existing ErrorType values', () => {
      // Ensure new ErrorType matches existing utils/error.ts values
      const existingErrorTypes = [
        'FILE_ERROR',
        'PARSE_ERROR',
        'RESOURCE_ERROR',
        'OUTPUT_ERROR',
        'VALIDATION_ERROR'
      ];

      existingErrorTypes.forEach(type => {
        expect(Object.values(ErrorType)).toContain(type);
      });
    });
  });
});