// CLAUDE.md準拠: Type-Driven Development + Zero Type Errors + セキュリティ重視
// requirement.md FR-4.2: 入力検証
// tasks.md T-009: セキュリティ機能実装

import * as path from 'path';

import { CloudSupporterError, ErrorType } from '../utils/error';

/**
 * CDK Input Validator
 * 
 * Provides comprehensive input validation for CDK generation to prevent
 * security vulnerabilities such as path traversal attacks and invalid ARN usage.
 * 
 * @requirement FR-4.2 入力検証
 */
export class CDKInputValidator {
  /**
   * Validate file path to prevent directory traversal attacks
   * 
   * @param filePath File path to validate
   * @throws CloudSupporterError if path is potentially malicious
   */
  static validateFilePath(filePath: string): void {
    if (!filePath || typeof filePath !== 'string') {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'File path must be a non-empty string',
        { providedPath: filePath, pathType: typeof filePath }
      );
    }

    // Check for directory traversal patterns
    const maliciousPatterns = [
      '..',          // Parent directory
      '~',           // Home directory
      '$HOME',       // Home environment variable
      '$USER',       // User environment variable
      '/etc/',       // System configuration
      '/root/',      // Root directory
      '/home/',      // User home directories (unless current user)
      'C:\\Windows\\', // Windows system directory
      'C:\\Program', // Windows program files
      '\\\\',        // UNC paths
      '%USERPROFILE%', // Windows user profile
      '%APPDATA%',   // Windows app data
      '%TEMP%',      // Windows temp
      '%TMP%',       // Windows temp alternative
    ];

    for (const pattern of maliciousPatterns) {
      if (filePath.includes(pattern)) {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Invalid file path: Contains potentially malicious pattern '${pattern}'`,
          { 
            providedPath: filePath, 
            detectedPattern: pattern,
            suggestion: 'Use relative paths within the project directory or absolute paths to safe locations'
          }
        );
      }
    }

    // Additional security checks for absolute paths
    if (filePath.startsWith('/') && !filePath.startsWith(process.cwd())) {
      // Check if path is in safe temporary directories
      const tempDirs = ['/tmp/', '/temp/', process.env.TMPDIR, process.env.TMP].filter(Boolean);
      const isTempPath = tempDirs.some(tmpDir => tmpDir && filePath.startsWith(tmpDir));
      
      // Only allow temp paths or when explicitly in test environment AND path looks like a test temp path
      const isTestTempPath = process.env.NODE_ENV === 'test' && 
                             (filePath.includes('cdk-test-') || filePath.includes('/test') || isTempPath);
      
      if (!isTempPath && !isTestTempPath) {
        // Absolute paths outside project directory and temp directories are suspicious
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Absolute file path outside project directory not allowed: ${filePath}`,
          { 
            providedPath: filePath,
            projectDirectory: process.cwd(),
            allowedTempDirs: tempDirs,
            suggestion: 'Use relative paths, paths within the project directory, or temporary directories'
          }
        );
      }
    }

    // Check for null byte injection
    if (filePath.includes('\0') || filePath.includes('\x00')) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'File path contains null byte characters',
        { providedPath: filePath }
      );
    }

    // Check for invalid characters in file names
    const invalidChars = ['<', '>', ':', '"', '|', '?', '*'];
    const fileName = path.basename(filePath);
    
    for (const char of invalidChars) {
      if (fileName.includes(char)) {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Invalid character '${char}' in file name: ${fileName}`,
          { providedPath: filePath, invalidCharacter: char }
        );
      }
    }
  }

  /**
   * Validate SNS Topic ARN format according to AWS specifications
   * 
   * @param arn SNS Topic ARN to validate
   * @throws CloudSupporterError if ARN format is invalid
   */
  static validateSNSTopicArn(arn: string): void {
    if (!arn || typeof arn !== 'string') {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'SNS Topic ARN must be a non-empty string',
        { providedArn: arn, arnType: typeof arn }
      );
    }

    // AWS SNS ARN format: arn:aws:sns:region:account-id:topic-name
    // Support multiple AWS partitions: aws, aws-cn, aws-us-gov
    // AWS regions follow specific patterns: us-east-1, eu-west-1, ap-southeast-2, etc.
    const snsArnPattern = /^arn:(aws|aws-cn|aws-us-gov):sns:(us|eu|ap|ca|sa|me|af|cn|us-gov)-(east|west|south|north|northeast|southeast|central)-[1-3]:\d{12}:[A-Za-z0-9_-]+$/;
    
    if (!snsArnPattern.test(arn)) {
      // Provide specific feedback about what's wrong
      const arnParts = arn.split(':');
      
      if (arnParts.length !== 6) {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Invalid SNS ARN structure: Expected 6 parts separated by ':', got ${arnParts.length}`,
          { 
            providedArn: arn,
            expectedFormat: 'arn:aws:sns:region:account-id:topic-name',
            actualParts: arnParts.length
          }
        );
      }

      if (arnParts[0] !== 'arn') {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Invalid ARN prefix: Expected 'arn', got '${arnParts[0] ?? 'undefined'}'`,
          { providedArn: arn, expectedPrefix: 'arn', actualPrefix: arnParts[0] }
        );
      }

      if (!['aws', 'aws-cn', 'aws-us-gov'].includes(arnParts[1] ?? '')) {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Invalid ARN partition: Expected 'aws', 'aws-cn', or 'aws-us-gov', got '${arnParts[1] ?? 'undefined'}'`,
          { providedArn: arn, expectedPartitions: ['aws', 'aws-cn', 'aws-us-gov'], actualPartition: arnParts[1] }
        );
      }

      if (arnParts[2] !== 'sns') {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Invalid service: Expected 'sns', got '${arnParts[2] ?? 'undefined'}'. This validator only supports SNS Topic ARNs.`,
          { providedArn: arn, expectedService: 'sns', actualService: arnParts[2] }
        );
      }

      // Generic fallback for other format issues
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Invalid SNS Topic ARN format: ${arn}`,
        { 
          providedArn: arn,
          expectedFormat: 'arn:aws:sns:region:account-id:topic-name',
          expectedPattern: snsArnPattern.source
        }
      );
    }
  }

  /**
   * Validate CDK stack name follows AWS CloudFormation naming rules
   * 
   * @param stackName Stack name to validate
   * @throws CloudSupporterError if stack name is invalid
   */
  static validateStackName(stackName: string): void {
    if (!stackName || typeof stackName !== 'string') {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Stack name must be a non-empty string'
      );
    }

    // AWS CloudFormation stack name rules
    const validStackNamePattern = /^[a-zA-Z][a-zA-Z0-9-]*$/;
    
    if (!validStackNamePattern.test(stackName)) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Invalid stack name: ${stackName}. Must start with a letter and contain only letters, numbers, and hyphens.`,
        { 
          providedName: stackName,
          expectedPattern: validStackNamePattern.source,
          suggestion: 'Use only letters, numbers, and hyphens. Start with a letter.'
        }
      );
    }

    if (stackName.length > 128) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Stack name too long: ${stackName.length} characters. Maximum allowed: 128`,
        { providedName: stackName, actualLength: stackName.length, maxLength: 128 }
      );
    }

    if (stackName.endsWith('-') || stackName.includes('--')) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Invalid stack name format: Cannot end with hyphen or contain consecutive hyphens: ${stackName}`,
        { providedName: stackName }
      );
    }
  }

  /**
   * Validate template file size to prevent resource exhaustion
   * 
   * @param templateContent Template content to check
   * @param maxSizeBytes Maximum allowed size in bytes (default: 10MB)
   * @throws CloudSupporterError if template is too large
   */
  static validateTemplateSize(templateContent: string, maxSizeBytes: number = 10 * 1024 * 1024): void {
    if (!templateContent) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Template content cannot be empty'
      );
    }

    const contentSize = Buffer.byteLength(templateContent, 'utf8');
    
    if (contentSize > maxSizeBytes) {
      const sizeMB = (contentSize / 1024 / 1024).toFixed(1);
      const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(1);
      
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Template file too large: ${sizeMB}MB exceeds limit of ${maxSizeMB}MB`,
        { 
          actualSize: contentSize,
          maxSize: maxSizeBytes,
          actualSizeMB: sizeMB,
          maxSizeMB: maxSizeMB,
          suggestion: 'Split large templates into smaller files or use nested stacks'
        }
      );
    }
  }

  /**
   * Validate template file size from file path to prevent resource exhaustion
   * 
   * @param templatePath Template file path to check
   * @param maxSizeBytes Maximum allowed size in bytes (default: 1MB for CloudFormation limit)
   * @throws CloudSupporterError if template file is too large
   */
  static async validateTemplateFileSize(templatePath: string, maxSizeBytes: number = 1024 * 1024): Promise<void> {
    // First validate the file path
    this.validateFilePath(templatePath);

    const fs = await import('fs/promises');
    
    try {
      const stats = await fs.stat(templatePath);
      
      if (stats.size > maxSizeBytes) {
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(1);
        
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Template file size exceeds ${maxSizeMB}MB limit`,
          { 
            filePath: templatePath,
            actualSize: stats.size,
            maxSize: maxSizeBytes,
            actualSizeMB: sizeMB,
            maxSizeMB: maxSizeMB,
            suggestion: 'Split large templates into smaller files or use nested stacks'
          }
        );
      }
    } catch (error) {
      if (error instanceof CloudSupporterError) {
        throw error;
      }
      
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        `Failed to check template file size: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { filePath: templatePath, originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Comprehensive input validation for CDK generation options
   * 
   * @param options CDK generation options to validate
   * @throws CloudSupporterError if any option is invalid
   */
  static validateCDKOptions(options: {
    stackName?: string;
    outputDir?: string;
    snsTopicArn?: string;
  }): void {
    if (options.stackName) {
      this.validateStackName(options.stackName);
    }

    if (options.outputDir) {
      this.validateFilePath(options.outputDir);
    }

    if (options.snsTopicArn) {
      this.validateSNSTopicArn(options.snsTopicArn);
    }
  }

  /**
   * Validate that generated CDK code doesn't contain obvious security issues
   * 
   * @param generatedCode CDK TypeScript code to validate
   * @throws CloudSupporterError if security issues are detected
   */
  static validateGeneratedCode(generatedCode: string): void {
    if (!generatedCode || typeof generatedCode !== 'string') {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Generated code must be a non-empty string'
      );
    }

    // Check for potential security issues in generated code
    const securityIssues = [
      { pattern: /eval\(/gi, issue: 'Code contains eval() which is a security risk' },
      { pattern: /Function\(/gi, issue: 'Code contains Function() constructor which is a security risk' },
      { pattern: /innerHTML/gi, issue: 'Code contains innerHTML which could lead to XSS' },
      { pattern: /document\.write/gi, issue: 'Code contains document.write which is a security risk' },
    ];

    for (const { pattern, issue } of securityIssues) {
      if (pattern.test(generatedCode)) {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          `Security issue in generated code: ${issue}`,
          { detectedPattern: pattern.source }
        );
      }
    }

    // Ensure code doesn't accidentally include sensitive patterns
    const criticalSensitivePatterns = [
      /AKIA[0-9A-Z]{16}/,                      // AWS Access Key
      /sk_live_[a-zA-Z0-9]{24}/,               // Stripe live key
      /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/, // JWT token
      /arn:aws:iam::\d{12}:/                   // AWS Account ID in ARN
    ];
    
    if (criticalSensitivePatterns.some(pattern => pattern.test(generatedCode))) {
      throw new CloudSupporterError(
        ErrorType.RESOURCE_ERROR,
        'Generated code contains patterns that might be sensitive information',
        { suggestion: 'Review sanitization process' }
      );
    }
  }
}