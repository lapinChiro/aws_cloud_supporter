import { CloudSupporterError } from '../../../../src/errors/error.class';
import { ERROR_CODES, ErrorType } from '../../../../src/errors/error.types';
import { CommonErrors } from '../../../../src/errors/factories/common';

describe('CommonErrors Factory', () => {
  describe('fileNotFound', () => {
    it('should create file not found error', () => {
      const path = '/path/to/template.yaml';
      const error = CommonErrors.fileNotFound(path);

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.FILE_NOT_FOUND);
      expect(error.type).toBe(ErrorType.FILE_ERROR);
      expect(error.message).toBe('File not found: /path/to/template.yaml');
      expect(error.filePath).toBe(path);
    });

    it('should handle Windows paths', () => {
      const path = 'C:\\Users\\test\\template.yaml';
      const error = CommonErrors.fileNotFound(path);

      expect(error.message).toBe('File not found: C:\\Users\\test\\template.yaml');
      expect(error.filePath).toBe(path);
    });
  });

  describe('validationFailed', () => {
    it('should create validation failed error', () => {
      const message = 'Template must contain at least one resource';
      const error = CommonErrors.validationFailed(message);

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe(message);
    });

    it('should allow custom details', () => {
      const message = 'Invalid configuration';
      const details = { field: 'timeout', value: 1000 };
      const error = CommonErrors.validationFailed(message, details);

      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
    });
  });

  describe('fileReadError', () => {
    it('should create file read error', () => {
      const path = '/path/to/file.yaml';
      const reason = 'Permission denied';
      const error = CommonErrors.fileReadError(path, reason);

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.FILE_READ_ERROR);
      expect(error.type).toBe(ErrorType.FILE_ERROR);
      expect(error.message).toBe('Failed to read file /path/to/file.yaml: Permission denied');
      expect(error.filePath).toBe(path);
      expect(error.details?.reason).toBe(reason);
    });
  });

  describe('outputError', () => {
    it('should create output error', () => {
      const message = 'Failed to write output file';
      const details = { path: '/tmp/output.json', error: 'EACCES' };
      const error = CommonErrors.outputError(message, details);

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.OUTPUT_ERROR);
      expect(error.type).toBe(ErrorType.OUTPUT_ERROR);
      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
    });

    it('should work without details', () => {
      const message = 'Output generation failed';
      const error = CommonErrors.outputError(message);

      expect(error.message).toBe(message);
      expect(error.details).toEqual({});
    });
  });

  describe('parseError', () => {
    it('should create parse error', () => {
      const message = 'Invalid YAML syntax';
      const filePath = '/templates/app.yaml';
      const lineNumber = 42;
      const error = CommonErrors.parseError(message, filePath, lineNumber);

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.PARSE_ERROR);
      expect(error.type).toBe(ErrorType.PARSE_ERROR);
      expect(error.message).toBe(message);
      expect(error.filePath).toBe(filePath);
      expect(error.lineNumber).toBe(lineNumber);
    });

    it('should work without line number', () => {
      const message = 'Invalid JSON';
      const filePath = '/config.json';
      const error = CommonErrors.parseError(message, filePath);

      expect(error.message).toBe(message);
      expect(error.filePath).toBe(filePath);
      expect(error.lineNumber).toBeUndefined();
    });
  });

  describe('Error properties', () => {
    it('should all errors have CloudSupporterError properties', () => {
      const errors = [
        CommonErrors.fileNotFound('/test'),
        CommonErrors.validationFailed('test'),
        CommonErrors.fileReadError('/test', 'error'),
        CommonErrors.outputError('test'),
        CommonErrors.parseError('test', '/file')
      ];

      errors.forEach(error => {
        expect(error.name).toBe('CloudSupporterError');
        expect(error.timestamp).toBeDefined();
        expect(error.stack).toBeDefined();
      });
    });
  });

  describe('Integration with existing system', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw CommonErrors.fileNotFound('/missing.yaml');
      }).toThrow(CloudSupporterError);

      expect(() => {
        throw CommonErrors.fileNotFound('/missing.yaml');
      }).toThrow('File not found: /missing.yaml');
    });

    it('should serialize to JSON correctly', () => {
      const error = CommonErrors.validationFailed('Test validation error');
      const json = error.toJSON();

      expect(json).toHaveProperty('code', ERROR_CODES.VALIDATION_FAILED);
      expect(json).toHaveProperty('type', ErrorType.VALIDATION_ERROR);
      expect(json).toHaveProperty('message', 'Test validation error');
      expect(json).toHaveProperty('timestamp');
    });
  });
});