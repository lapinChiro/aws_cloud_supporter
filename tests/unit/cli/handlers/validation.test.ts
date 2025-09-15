/* eslint-disable max-lines-per-function */
// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// CDKOptionsValidatorユニットテスト

import { CDKOptionsValidator } from '../../../../src/cli/handlers/validation';
import type { CLIDependencies, CLIOptions } from '../../../../src/cli/interfaces/command.interface';
import type { ILogger } from '../../../../src/interfaces/logger';
import { CloudSupporterError } from '../../../../src/utils/error';

describe('CDKOptionsValidator', () => {
  let validator: CDKOptionsValidator;
  let mockLogger: jest.Mocked<ILogger>;
  let mockDependencies: CLIDependencies;

  beforeEach(() => {
    validator = new CDKOptionsValidator();
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn(),
      setLevel: jest.fn(),
      setColorEnabled: jest.fn(),
      getConfig: jest.fn(),
      plain: jest.fn(),
      stats: jest.fn(),
      list: jest.fn(),
      errorList: jest.fn(),
      warnList: jest.fn(),
      infoList: jest.fn(),
      fileSaved: jest.fn(),
      plainError: jest.fn(),
      plainWarn: jest.fn()
    };
    const mockAnalyzer: CLIDependencies['analyzer'] = {
      analyze: jest.fn(),
      getRegisteredGenerators: jest.fn(),
      getAnalysisStatistics: jest.fn()
    };
    const mockParser: CLIDependencies['parser'] = {
      parse: jest.fn()
    };
    const mockJsonFormatter: CLIDependencies['jsonFormatter'] = {
      format: jest.fn()
    };
    const mockHtmlFormatter: CLIDependencies['htmlFormatter'] = {
      format: jest.fn()
    };
    mockDependencies = {
      analyzer: mockAnalyzer,
      parser: mockParser,
      jsonFormatter: mockJsonFormatter,
      htmlFormatter: mockHtmlFormatter,
      logger: mockLogger
    };
  });

  describe('validateCDKOptions', () => {
    it('should validate successfully with minimal options', () => {
      const options: CLIOptions = {
        output: 'cdk',
        includeLow: false,
        verbose: false,
        noColor: false,
        includeUnsupported: false,
        performanceMode: false
      };

      expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    describe('Output Directory Validation', () => {
      it('should allow undefined output directory', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should allow relative output directory', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkOutputDir: './output'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should allow absolute path in current working directory', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkOutputDir: process.cwd() + '/output'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should allow absolute path in temp directory', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkOutputDir: '/tmp/output'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should reject unsafe absolute paths', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production'; // Temporarily set to non-test environment

        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkOutputDir: '/etc/passwd'
        };

        try {
          expect(() => { validator.validateCDKOptions(options, mockDependencies); })
            .toThrow(CloudSupporterError);
          expect(mockLogger.error).toHaveBeenCalled();
        } finally {
          process.env.NODE_ENV = originalEnv;
        }
      });

      it('should allow any path in test environment', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test';

        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkOutputDir: '/any/path'
        };

        try {
          expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
        } finally {
          process.env.NODE_ENV = originalEnv;
        }
      });
    });

    describe('SNS Options Validation', () => {
      it('should allow undefined SNS options', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should validate new SNS topic option', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkEnableSns: true
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should validate existing SNS topic ARN', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkSnsTopicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should reject both SNS options together', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkEnableSns: true,
          cdkSnsTopicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); })
          .toThrow(CloudSupporterError);
      });

      it('should validate SNS topic ARN format', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkSnsTopicArn: 'invalid-arn'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); })
          .toThrow(CloudSupporterError);
      });

      it('should accept ARN with underscore and hyphen in topic name', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkSnsTopicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic_name-test'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should reject ARN with dot in topic name', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkSnsTopicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic.fifo'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); })
          .toThrow(CloudSupporterError);
      });
    });

    describe('Stack Name Validation', () => {
      it('should allow undefined stack name', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should validate stack name format', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkStackName: 'MyValidStack123'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

      it('should reject stack name with special characters', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkStackName: 'My-Invalid-Stack!'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); })
          .toThrow(CloudSupporterError);
      });

      it('should reject stack name starting with number', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkStackName: '123Stack'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); })
          .toThrow(CloudSupporterError);
      });

      it('should accept very long stack names', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkStackName: 'A'.repeat(128) // 128 characters
        };

        // Note: The validator doesn't check for stack name length
        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });
    });

    describe('Combined Validations', () => {
      it('should validate all options together', () => {
        const options: CLIOptions = {
          output: 'cdk',
          includeLow: false,
          verbose: false,
          noColor: false,
          includeUnsupported: false,
          performanceMode: false,
          cdkOutputDir: './output',
          cdkEnableSns: true,
          cdkStackName: 'MyValidStack'
        };

        expect(() => { validator.validateCDKOptions(options, mockDependencies); }).not.toThrow();
      });

    });
  });
});