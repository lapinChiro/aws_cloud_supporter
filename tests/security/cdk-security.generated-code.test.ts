// CLAUDE.md準拠: Test-Driven Development (TDD) + セキュリティ重視
// CDKセキュリティ生成コード検証テスト
import { CloudSupporterError } from '../../src/errors';
import { CDKInputValidator } from '../../src/security/input-validator';

describe('CDK Security - Generated Code Validation', () => {
  it('should accept safe CDK code', () => {
    const safeCdkCode = `
      import * as cdk from 'aws-cdk-lib';
      export class MyStack extends cdk.Stack {
        constructor(scope: Construct, id: string) {
          super(scope, id);
          const alarm = new cloudwatch.Alarm(this, 'TestAlarm', {});
        }
      }
    `;
    
    expect(() => { CDKInputValidator.validateGeneratedCode(safeCdkCode); }).not.toThrow();
  });

  it('should reject code with security risks', () => {
    const dangerousCodeExamples = [
      'eval("malicious code")',
      'new Function("return malicious()")',
      'element.innerHTML = userInput',
      'document.write("<script>alert(1)</script>")'
    ];
    
    for (const dangerousCode of dangerousCodeExamples) {
      expect(() => { CDKInputValidator.validateGeneratedCode(dangerousCode); })
        .toThrow(CloudSupporterError);
    }
  });

  it('should detect accidentally included sensitive patterns', () => {
    // テスト用: AWS Access Keyパターンを使用（GitHub Secret Scanningを回避）
    const codeWithSensitiveData = `
      export class MyStack extends cdk.Stack {
        // TEST ONLY - This is a fake AWS key for testing validation
        private awsKey = "AKIAIOSFODNN7EXAMPLE";
      }
    `;
    
    expect(() => { CDKInputValidator.validateGeneratedCode(codeWithSensitiveData); })
      .toThrow(CloudSupporterError);
  });
});

describe('CDK Security - Comprehensive Option Validation', () => {
  it('should validate all CDK options together', () => {
    const validOptions = {
      stackName: 'MyValidStack',
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic',
      templatePath: 'templates/my-template.yaml'
    };
    
    expect(() => {
      CDKInputValidator.validateStackName(validOptions.stackName);
      CDKInputValidator.validateSNSTopicArn(validOptions.snsTopicArn);
      CDKInputValidator.validateFilePath(validOptions.templatePath);
    }).not.toThrow();
  });

  it('should catch validation errors in options', () => {
    const invalidOptions = [
      { stackName: 'invalid_stack_name', reason: 'underscore' },
      { stackName: '123Stack', reason: 'starts with number' },
      { stackName: '', reason: 'empty' },
      { snsTopicArn: 'not-an-arn', reason: 'invalid ARN format' },
      { templatePath: '../../../etc/passwd', reason: 'path traversal' }
    ];
    
    invalidOptions.forEach(({ stackName, snsTopicArn, templatePath }) => {
      if (stackName) {
        expect(() => { CDKInputValidator.validateStackName(stackName); })
          .toThrow(CloudSupporterError);
      }
      if (snsTopicArn) {
        expect(() => { CDKInputValidator.validateSNSTopicArn(snsTopicArn); })
          .toThrow(CloudSupporterError);
      }
      if (templatePath) {
        expect(() => { CDKInputValidator.validateFilePath(templatePath); })
          .toThrow(CloudSupporterError);
      }
    });
  });
});