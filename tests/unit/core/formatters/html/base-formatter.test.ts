// BaseHTMLFormatter test file for coverage improvement

import { BaseHTMLFormatter } from '../../../../../src/core/formatters/html/base-formatter';
import { CloudSupporterError, ErrorType, ERROR_CODES } from '../../../../../src/errors';
import type { AnalysisResult } from '../../../../../src/types/metrics';
import { AnalysisResultBuilder } from '../../../../helpers/analysis-result-builder';

describe('BaseHTMLFormatter', () => {
  let formatter: BaseHTMLFormatter;

  beforeEach(() => {
    formatter = new BaseHTMLFormatter();
  });

  describe('formatHTML', () => {
    // Valid analysis result for testing (using builder pattern)
    const validResult: AnalysisResult = new AnalysisResultBuilder()
      .addSimpleResource('TestDB', 'AWS::RDS::DBInstance', [{
        metric_name: 'CPUUtilization',
        namespace: 'AWS/RDS',
        dimensions: [{ name: 'DBInstanceIdentifier', value: 'TestDB' }]
      }])
      .withProcessingTime(100)
      .build();

    it('should format valid analysis result to HTML', () => {
      const html = formatter.formatHTML(validResult);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('CloudWatch Metrics Report');
      expect(html).toContain('TestDB');
      expect(html).toContain('CPUUtilization');
    });

    // Test for line 36: CloudSupporterError when result is not an object
    it('should throw CloudSupporterError when result is null', () => {
      expect(() => formatter.formatHTML(null as unknown as AnalysisResult))
        .toThrow(CloudSupporterError);

      try {
        formatter.formatHTML(null as unknown as AnalysisResult);
      } catch (error) {
        expect(error).toBeInstanceOf(CloudSupporterError);
        if (error instanceof CloudSupporterError) {
          expect(error.type).toBe(ErrorType.OUTPUT_ERROR);
          expect(error.message).toContain('Invalid analysis result provided');
        }
      }
    });

    it('should throw CloudSupporterError when result is undefined', () => {
      expect(() => formatter.formatHTML(undefined as unknown as AnalysisResult))
        .toThrow(CloudSupporterError);

      try {
        formatter.formatHTML(undefined as unknown as AnalysisResult);
      } catch (error) {
        expect(error).toBeInstanceOf(CloudSupporterError);
        if (error instanceof CloudSupporterError) {
          expect(error.type).toBe(ErrorType.OUTPUT_ERROR);
          expect(error.message).toContain('Invalid analysis result provided');
        }
      }
    });

    it('should throw CloudSupporterError when result is a string', () => {
      expect(() => formatter.formatHTML('invalid' as unknown as AnalysisResult))
        .toThrow(CloudSupporterError);

      try {
        formatter.formatHTML('invalid' as unknown as AnalysisResult);
      } catch (error) {
        expect(error).toBeInstanceOf(CloudSupporterError);
        if (error instanceof CloudSupporterError) {
          expect(error.type).toBe(ErrorType.OUTPUT_ERROR);
          expect(error.message).toContain('Invalid analysis result provided');
          expect(error.details?.received).toBe('string');
        }
      }
    });

    // Test for line 104: Warning when HTML formatting takes > 3000ms
    it('should warn when formatting takes more than 3000ms', () => {
      // Mock performance.now to simulate slow formatting
      let callCount = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        if (callCount === 1) return 0; // Start time
        return 3500; // End time (3500ms later)
      });

      // Mock console.warn to capture the warning
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      formatter.formatHTML(validResult);

      expect(warnSpy).toHaveBeenCalledWith('⚠️  HTML formatting slow: 3500ms');

      // Restore mocks
      (performance.now as jest.Mock).mockRestore();
      warnSpy.mockRestore();
    });

    it('should not warn when formatting is fast', () => {
      // Mock console.warn to ensure it's not called
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      formatter.formatHTML(validResult);

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    // Test for lines 109-112: Error handling when it's already a CloudSupporterError
    it('should rethrow CloudSupporterError without wrapping', () => {
      // Create a mock that throws CloudSupporterError
      const originalError = new CloudSupporterError(
        ERROR_CODES.RESOURCE_INVALID,
        ErrorType.RESOURCE_ERROR,
        'Original error message',
        { test: 'data' }
      );

      // Mock one of the internal methods to throw CloudSupporterError
      formatter['resourceHTMLGenerator'].generateResourceHTML = jest.fn()
        .mockImplementation(() => {
          throw originalError;
        });

      try {
        formatter.formatHTML(validResult);
        fail('Should have thrown an error');
      } catch (error) {
        // Should rethrow the same CloudSupporterError instance
        expect(error).toBe(originalError);
        expect(error).toBeInstanceOf(CloudSupporterError);
        if (error instanceof CloudSupporterError) {
          expect(error.type).toBe(ErrorType.RESOURCE_ERROR);
          expect(error.message).toBe('Original error message');
        }
      }
    });

    // Test for line 112-116: Wrapping non-CloudSupporterError
    it('should wrap non-CloudSupporterError in CloudSupporterError', () => {
      // Mock one of the internal methods to throw a regular Error
      const originalError = new Error('Regular error');
      formatter['resourceHTMLGenerator'].generateResourceHTML = jest.fn()
        .mockImplementation(() => {
          throw originalError;
        });

      try {
        formatter.formatHTML(validResult);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CloudSupporterError);
        if (error instanceof CloudSupporterError) {
          expect(error.type).toBe(ErrorType.OUTPUT_ERROR);
          expect(error.message).toContain('Failed to format HTML output: Regular error');
          expect(error.details?.originalError).toBe('Regular error');
        }
      }
    });

    it('should wrap unknown error types in CloudSupporterError', () => {
      // Mock one of the internal methods to throw a non-standard error
      const nonStandardError: { code?: string } = Object.create(null) as { code?: string };
      nonStandardError.code = 'CUSTOM_ERROR';

      formatter['resourceHTMLGenerator'].generateResourceHTML = jest.fn()
        .mockImplementation(() => {
          // Create and throw an error-like object without proper Error prototype
          const err = { toString: () => 'Custom error object' };
          Object.setPrototypeOf(err, null);
          throw err;
        });

      try {
        formatter.formatHTML(validResult);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(CloudSupporterError);
        if (error instanceof CloudSupporterError) {
          expect(error.type).toBe(ErrorType.OUTPUT_ERROR);
          expect(error.message).toContain('Failed to format HTML output');
        }
      }
    });

    it('should handle empty resources array', () => {
      const emptyResult: AnalysisResult = AnalysisResultBuilder.empty();

      const html = formatter.formatHTML(emptyResult);

      expect(html).toContain('No supported resources found');
    });

    it('should handle unsupported resources', () => {
      const resultWithUnsupported: AnalysisResult = new AnalysisResultBuilder()
        .addUnsupportedResource('UnsupportedResource')
        .build();

      const html = formatter.formatHTML(resultWithUnsupported);

      expect(html).toBeTruthy();
      // The actual content would be generated by UnsupportedHTMLGenerator
    });

    it('should include memory peak when available', () => {
      const resultWithMemory: AnalysisResult = new AnalysisResultBuilder()
        .addSimpleResource('TestResource', 'AWS::S3::Bucket')
        .withMemoryPeak(256)
        .build();

      const html = formatter.formatHTML(resultWithMemory);

      expect(html).toContain('Memory: 256MB');
    });

    it('should not include memory peak when not available', () => {
      const html = formatter.formatHTML(validResult);

      expect(html).not.toContain('Memory:');
    });
  });
});