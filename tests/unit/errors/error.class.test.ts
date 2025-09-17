import { CloudSupporterError } from '../../../src/errors/error.class';
import type { ErrorDetails } from '../../../src/errors/error.types';
import { ErrorType, ERROR_CODES } from '../../../src/errors/error.types';

describe('CloudSupporterError Class', () => {
  describe('Constructor', () => {
    it('should create an instance with required properties', () => {
      const error = new CloudSupporterError(
        ERROR_CODES.METRICS_NOT_FOUND,
        ErrorType.RESOURCE_ERROR,
        'Test error message'
      );

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('METRICS_NOT_FOUND');
      expect(error.type).toBe('RESOURCE_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('CloudSupporterError');
    });

    it('should create an instance with optional properties', () => {
      const details: ErrorDetails = { resourceType: 'AWS::Lambda::Function' };
      const error = new CloudSupporterError(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        'Validation failed',
        details,
        '/path/to/file.yaml',
        42
      );

      expect(error.details).toEqual(details);
      expect(error.filePath).toBe('/path/to/file.yaml');
      expect(error.lineNumber).toBe(42);
    });

    it('should have a timestamp property', () => {
      const before = new Date().toISOString();
      const error = new CloudSupporterError(
        ERROR_CODES.FILE_NOT_FOUND,
        ErrorType.FILE_ERROR,
        'File not found'
      );
      const after = new Date().toISOString();

      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
      expect(new Date(error.timestamp).getTime()).toBeLessThanOrEqual(new Date(after).getTime());
    });

    it('should capture stack trace', () => {
      const error = new CloudSupporterError(
        ERROR_CODES.OUTPUT_ERROR,
        ErrorType.OUTPUT_ERROR,
        'Output error'
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('CloudSupporterError');
    });
  });

  describe('toJSON method', () => {
    it('should return JSON representation of the error', () => {
      const details: ErrorDetails = {
        resourceType: 'AWS::Lambda::Function',
        timeout: 300
      };

      const error = new CloudSupporterError(
        ERROR_CODES.METRICS_NOT_FOUND,
        ErrorType.RESOURCE_ERROR,
        'Metrics not found',
        details,
        '/path/to/template.yaml',
        100
      );

      const json = error.toJSON();

      expect(json).toEqual({
        code: 'METRICS_NOT_FOUND',
        type: 'RESOURCE_ERROR',
        message: 'Metrics not found',
        details: details,
        timestamp: error.timestamp
      });
    });

    it('should handle errors without details', () => {
      const error = new CloudSupporterError(
        ERROR_CODES.FILE_NOT_FOUND,
        ErrorType.FILE_ERROR,
        'File not found'
      );

      const json = error.toJSON();

      expect(json).toEqual({
        code: 'FILE_NOT_FOUND',
        type: 'FILE_ERROR',
        message: 'File not found',
        details: undefined,
        timestamp: error.timestamp
      });
    });
  });

  describe('Compatibility with existing CloudSupporterError', () => {
    it('should be compatible with existing error handling', () => {
      const error = new CloudSupporterError(
        ERROR_CODES.RESOURCE_INVALID,
        ErrorType.RESOURCE_ERROR,
        'Invalid resource'
      );

      // Should work with standard Error handling
      expect(() => { throw error; }).toThrow(CloudSupporterError);
      expect(() => { throw error; }).toThrow('Invalid resource');
    });

    it('should maintain Error prototype chain', () => {
      const error = new CloudSupporterError(
        ERROR_CODES.PARSE_ERROR,
        ErrorType.PARSE_ERROR,
        'Parse error'
      );

      expect(error instanceof CloudSupporterError).toBe(true);
      expect(error instanceof Error).toBe(true);
      expect(Object.getPrototypeOf(error)).toBe(CloudSupporterError.prototype);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined details gracefully', () => {
      const error = new CloudSupporterError(
        ERROR_CODES.OUTPUT_ERROR,
        ErrorType.OUTPUT_ERROR,
        'Output error',
        undefined,
        undefined,
        undefined
      );

      expect(error.details).toBeUndefined();
      expect(error.filePath).toBeUndefined();
      expect(error.lineNumber).toBeUndefined();
    });

    it('should handle empty message', () => {
      const error = new CloudSupporterError(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        ''
      );

      expect(error.message).toBe('');
    });
  });
});