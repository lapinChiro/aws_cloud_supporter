// CLAUDE.md準拠: Test-Driven Development (TDD) + セキュリティ重視
// CDKセキュリティエッジケーステスト
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { CDKInputValidator } from '../../src/security/input-validator';
import { CDKSecuritySanitizer } from '../../src/security/sanitizer';

describe('CDK Security - Sanitization Reporting', () => {
  it('should provide accurate sanitization reports', () => {
    const original = {
      SafeValue: 'safe',
      UnsafePassword: 'secret123',
      UnsafeApiKey: 'sk_test_DUMMY_KEY'
    };
    
    const sanitized = CDKSecuritySanitizer.sanitizeForCDK(original);
    const report = CDKSecuritySanitizer.getSanitizationReport(original, sanitized);
    
    expect(report.hasSensitiveData).toBe(true);
    expect(report.sensitivePropertiesFound).toBe(2);
    expect(report.redactedKeys).toEqual(['UnsafePassword', 'UnsafeApiKey']);
  });

  it('should report no sensitive data for clean input', () => {
    const original = {
      Name: 'MyResource',
      Port: 80,
      PublicEndpoint: 'https://api.example.com'
    };
    
    const sanitized = CDKSecuritySanitizer.sanitizeForCDK(original);
    const report = CDKSecuritySanitizer.getSanitizationReport(original, sanitized);
    
    expect(report.hasSensitiveData).toBe(false);
    expect(report.sensitivePropertiesFound).toBe(0);
    expect(report.redactedKeys).toEqual([]);
  });
});

describe('CDK Security - Edge Cases', () => {
  it('should handle null and undefined values safely', () => {
    const input = {
      NullValue: null,
      UndefinedValue: undefined,
      EmptyString: '',
      ZeroNumber: 0,
      FalseBoolean: false
    };
    
    const result = CDKSecuritySanitizer.sanitizeForCDK(input);
    
    expect(result.NullValue).toBeNull();
    expect(result.UndefinedValue).toBeUndefined();
    expect(result.EmptyString).toBe('');
    expect(result.ZeroNumber).toBe(0);
    expect(result.FalseBoolean).toBe(false);
  });

  it('should handle deeply nested structures', () => {
    const input = {
      Level1: {
        Level2: {
          Level3: {
            Password: 'deep_secret'
          }
        }
      }
    };
    
    const result = CDKSecuritySanitizer.sanitizeForCDK(input);
    
    // Type assertion for deeply nested structure
    interface NestedStructure {
      Level1: {
        Level2: {
          Level3: {
            Password: string;
          };
        };
      };
    }
    
    const nested = result as unknown as NestedStructure;
    expect(nested.Level1.Level2.Level3.Password).toBe('/* [REDACTED: Password] */');
  });

  it('should validate sanitization effectiveness', () => {
    const potentiallyDangerous = {
      AccessKey: 'AKIAIOSFODNN7EXAMPLE',
      SecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    };
    
    const sanitized = CDKSecuritySanitizer.sanitizeForCDK(potentiallyDangerous);
    
    // Should not throw - sanitization should be effective
    expect(() => { CDKSecuritySanitizer.validateSanitization(sanitized); }).not.toThrow();
  });
});

describe('CDK Security - File Operations', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'security-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should create files with secure permissions on Unix systems', async () => {
    const testFilePath = path.join(testDir, 'test-stack.ts');
    const testContent = 'export class TestStack extends cdk.Stack {}';
    
    // Write file
    await fs.writeFile(testFilePath, testContent, 'utf-8');
    
    // Set secure permissions (similar to what CLI does)
    try {
      await fs.chmod(testFilePath, 0o600);
      
      // Verify permissions (on Unix systems)
      if (process.platform !== 'win32') {
        const stats = await fs.stat(testFilePath);
        const permissions = (stats.mode & 0o777).toString(8);
        expect(permissions).toBe('600');
      }
    } catch (error) {
      // On Windows, chmod might not work, but that's expected
      if (process.platform !== 'win32') {
        throw error;
      }
    }
  });

  it('should validate output directory accessibility', () => {
    // Test relative paths that should be allowed
    const relativePaths = [
      './test.ts',
      'output/test.ts',
      'nested/dir/test.ts'
    ];
    
    for (const relativePath of relativePaths) {
      expect(() => { CDKInputValidator.validateFilePath(relativePath); }).not.toThrow();
    }
  });
});