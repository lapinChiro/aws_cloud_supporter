// CLAUDE.md準拠: Test-Driven Development (TDD) + セキュリティ重視
// CDKセキュリティ検証テスト
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { CDKInputValidator } from '../../src/security/input-validator';
import { CloudSupporterError } from '../../src/utils/error';

describe('CDK Security - Input Validation', () => {
  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal attacks', () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\Windows\\System32\\config\\sam',
        'templates/../../../sensitive.yaml',
        '.%2e/.%2e/.%2e/etc/passwd',
        '.../.../...//etc/passwd'
      ];
      
      maliciousInputs.forEach(input => {
        expect(() => { CDKInputValidator.validateFilePath(input); })
          .toThrow(CloudSupporterError);
      });
    });

    it('should allow valid template paths', () => {
      const validPaths = [
        'template.yaml',
        'templates/my-template.json',
        './infrastructure/cloudformation.yml',
        'examples/web-application-stack.yaml'
      ];
      
      validPaths.forEach(input => {
        expect(() => { CDKInputValidator.validateFilePath(input); })
          .not.toThrow();
      });
    });

    it('should reject null byte injection', () => {
      const nullByteInputs = [
        'template.yaml\x00.txt',
        'safe.yaml\0evil.sh'
      ];
      
      nullByteInputs.forEach(input => {
        expect(() => { CDKInputValidator.validateFilePath(input); })
          .toThrow(CloudSupporterError);
      });
    });
  });

  describe('SNS ARN Validation', () => {
    it('should validate correct SNS topic ARNs', () => {
      const validArns = [
        'arn:aws:sns:us-east-1:123456789012:my-topic',
        'arn:aws:sns:eu-west-1:987654321098:alarm-notifications',
        'arn:aws-cn:sns:cn-north-1:123456789012:topic-name',
        'arn:aws-us-gov:sns:us-gov-west-1:123456789012:gov-topic'
      ];
      
      validArns.forEach(arn => {
        expect(() => { CDKInputValidator.validateSNSTopicArn(arn); })
          .not.toThrow();
      });
    });

    it('should reject invalid SNS ARNs', () => {
      const invalidArns = [
        'arn:aws:sqs:us-east-1:123456789012:my-queue', // Wrong service
        'not-an-arn',
        'arn:aws:sns:invalid-region:123456789012:topic',
        'arn:aws:sns:us-east-1:invalid-account:topic',
        'arn:aws:sns:us-east-1:123456789012:', // Missing topic name
      ];
      
      invalidArns.forEach(arn => {
        expect(() => { CDKInputValidator.validateSNSTopicArn(arn); })
          .toThrow(CloudSupporterError);
      });
      
      // Test empty string separately with specific error check
      expect(() => { CDKInputValidator.validateSNSTopicArn(''); })
        .toThrow('SNS Topic ARN must be a non-empty string');
    });
  });

  describe('Stack Name Validation', () => {
    it('should validate correct stack names', () => {
      const validNames = [
        'MyStack',
        'web-application-stack',
        'Stack123',
        'test-stack-v2',
        'A', // Single character
        'a'.repeat(128) // Max length
      ];
      
      validNames.forEach(name => {
        expect(() => { CDKInputValidator.validateStackName(name); })
          .not.toThrow();
      });
    });

    it('should reject invalid stack names', () => {
      const invalidNames = [
        'my_stack', // Underscore not allowed
        'stack!', // Special character
        '123stack', // Starting with number
        '-stack', // Starting with hyphen
        'stack-', // Ending with hyphen
        '', // Empty
        'a'.repeat(129), // Too long
        'stack name' // Space not allowed
      ];
      
      invalidNames.forEach(name => {
        expect(() => { CDKInputValidator.validateStackName(name); })
          .toThrow(CloudSupporterError);
      });
    });
  });

  describe('Template Size Validation', () => {
    it('should accept templates under size limit', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cdk-test-'));
      const smallTemplate = path.join(tempDir, 'small.yaml');
      
      // Create a small template (< 1MB)
      await fs.writeFile(smallTemplate, 'AWSTemplateFormatVersion: 2010-09-09\nResources: {}');
      
      // Execute validation and expect no errors
      try {
        await CDKInputValidator.validateTemplateFileSize(smallTemplate);
        // If we reach here, validation passed
      } catch (error) {
        // If validation throws, the test should fail
        throw error;
      } finally {
        await fs.rm(tempDir, { recursive: true });
      }
    });

    it('should reject templates over size limit', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cdk-test-'));
      const largeTemplate = path.join(tempDir, 'large.yaml');
      
      try {
        // Create a large template (> 1MB)
        const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
        await fs.writeFile(largeTemplate, largeContent);
        
        // Expect validation to throw an error
        let errorThrown = false;
        try {
          await CDKInputValidator.validateTemplateFileSize(largeTemplate);
        } catch (error) {
          errorThrown = true;
          expect(error).toBeInstanceOf(CloudSupporterError);
          expect((error as CloudSupporterError).message).toContain('Template file size exceeds 1.0MB limit');
        }
        
        expect(errorThrown).toBe(true);
      } finally {
        await fs.rm(tempDir, { recursive: true });
      }
    });
  });
});