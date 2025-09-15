// CLAUDE.md準拠: Type-Driven Development + Zero Type Errors + セキュリティ重視
// requirement.md FR-4.1: 機密情報保護
// tasks.md T-009: セキュリティ機能実装

import { CloudSupporterError, ErrorType } from '../utils/error';

/**
 * CDK Security Sanitizer
 * 
 * Provides comprehensive sanitization of sensitive information from
 * CloudFormation templates to prevent data leakage in generated CDK code.
 * 
 * @requirement FR-4.1 機密情報保護
 */
export class CDKSecuritySanitizer {
  /**
   * Patterns for detecting sensitive information
   * Based on OWASP recommendations and AWS security best practices
   */
  private static readonly SENSITIVE_PATTERNS = [
    // CloudFormation property name patterns (case-insensitive)
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /credential/i,
    /passphrase/i,
    /auth/i,
    
    // AWS-specific patterns
    /arn:aws:iam::\d{12}:/,          // AWS Account ID in IAM ARN
    /AKIA[0-9A-Z]{16}/,              // AWS Access Key ID
    /[A-Za-z0-9/+=]{40}/,            // AWS Secret Access Key (potential)
    /aws_access_key_id/i,
    /aws_secret_access_key/i,
    
    // Common API Key patterns
    /sk_live_[a-zA-Z0-9]{24}/,       // Stripe secret key
    /pk_live_[a-zA-Z0-9]{24}/,       // Stripe public key
    /sk_test_[a-zA-Z0-9]{24}/,       // Stripe test secret key
    /rk_live_[a-zA-Z0-9]{24}/,       // Stripe restricted key
    /AIza[0-9A-Za-z\-_]{35}/,        // Google API key
    /ya29\.[0-9A-Za-z\-_]+/,         // Google OAuth access token
    /sk-[a-zA-Z0-9]{48}/,            // OpenAI API key
    /ghp_[A-Za-z0-9]{36}/,           // GitHub personal access token
    /gho_[A-Za-z0-9]{36}/,           // GitHub OAuth token
    /github_pat_[A-Za-z0-9_]{82}/,   // GitHub fine-grained token
    
    // Database connection strings
    /mongodb:\/\/[^\s]+/,            // MongoDB connection string
    /mysql:\/\/[^\s]+/,              // MySQL connection string
    /postgresql:\/\/[^\s]+/,         // PostgreSQL connection string
    /redis:\/\/[^\s]+/,              // Redis connection string
    
    // JWT tokens
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*/,  // JWT token pattern
  ];

  /**
   * Property name patterns that should be treated as sensitive
   */
  private static readonly SENSITIVE_PROPERTY_NAMES = [
    'password', 'passwd', 'pwd',
    'secret', 'key', 'token', 'credential', 'auth',
    'apikey', 'api_key', 'accesskey', 'access_key',
    'privatekey', 'private_key', 'publickey', 'public_key',
    'clientsecret', 'client_secret', 'clientkey', 'client_key',
    'sessionkey', 'session_key', 'sessiontoken', 'session_token',
    'refreshtoken', 'refresh_token', 'accesstoken', 'access_token',
    'connectionstring', 'connection_string', 'databaseurl', 'database_url',
    'masterpassword', 'master_password', 'rootpassword', 'root_password'
  ];

  /**
   * Sanitize CloudFormation resource properties for CDK generation
   * 
   * @param properties Resource properties from CloudFormation template
   * @returns Sanitized properties with sensitive data replaced
   */
  static sanitizeForCDK(properties: Record<string, unknown>): Record<string, unknown> {
    if (!properties || typeof properties !== 'object') {
      return properties;
    }

    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) {
        sanitized[key] = value;
        continue;
      }

      if (CDKSecuritySanitizer.isSensitiveProperty(key, value)) {
        sanitized[key] = CDKSecuritySanitizer.createRedactedValue(key);
      } else if (typeof value === 'object') {
        // Recursively sanitize nested objects
        if (Array.isArray(value)) {
          sanitized[key] = value.map((item, index): unknown => 
            typeof item === 'object' && item !== null 
              ? CDKSecuritySanitizer.sanitizeForCDK(item as Record<string, unknown>)
              : CDKSecuritySanitizer.isSensitiveValue(String(item)) 
                ? CDKSecuritySanitizer.createRedactedValue(`${key}[${index}]`)
                : item
          );
        } else {
          sanitized[key] = CDKSecuritySanitizer.sanitizeForCDK(value as Record<string, unknown>);
        }
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Check if a property should be considered sensitive
   * 
   * @param key Property name
   * @param value Property value
   * @returns True if property is sensitive
   */
  private static isSensitiveProperty(key: string, value: unknown): boolean {
    // Check property name
    if (CDKSecuritySanitizer.isSensitivePropertyName(key)) {
      return true;
    }

    // Check value content if it's a string
    if (typeof value === 'string') {
      return CDKSecuritySanitizer.isSensitiveValue(value);
    }

    return false;
  }

  /**
   * Check if a property name indicates sensitive data
   * 
   * @param propertyName Property name to check
   * @returns True if property name is sensitive
   */
  private static isSensitivePropertyName(propertyName: string): boolean {
    const lowerKey = propertyName.toLowerCase();
    
    return CDKSecuritySanitizer.SENSITIVE_PROPERTY_NAMES.some(pattern => 
      lowerKey.includes(pattern)
    );
  }

  /**
   * Check if a value contains sensitive information
   * 
   * @param value String value to check
   * @returns True if value contains sensitive patterns
   */
  private static isSensitiveValue(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    return CDKSecuritySanitizer.SENSITIVE_PATTERNS.some(pattern => pattern.test(value));
  }

  /**
   * Create redacted placeholder for sensitive values
   * 
   * @param originalKey Original property key for context
   * @returns Redacted placeholder string
   */
  private static createRedactedValue(originalKey: string): string {
    return `/* [REDACTED: ${originalKey}] */`;
  }

  /**
   * Get sanitization report for logging/debugging
   * 
   * @param _original Original properties (for API compatibility)
   * @param sanitized Sanitized properties
   * @returns Sanitization report
   */
  static getSanitizationReport(
    _original: Record<string, unknown>,
    sanitized: Record<string, unknown>
  ): {
    sensitivePropertiesFound: number;
    redactedKeys: string[];
    hasSensitiveData: boolean;
  } {
    const redactedKeys: string[] = [];
    let sensitivePropertiesFound = 0;

    const findRedactedKeys = (
      obj: Record<string, unknown>,
      path: string = ''
    ): void => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && value.startsWith('/* [REDACTED:')) {
          redactedKeys.push(currentPath);
          sensitivePropertiesFound++;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          findRedactedKeys(value as Record<string, unknown>, currentPath);
        }
      }
    };

    findRedactedKeys(sanitized);

    return {
      sensitivePropertiesFound,
      redactedKeys,
      hasSensitiveData: sensitivePropertiesFound > 0
    };
  }

  /**
   * Validate sanitization was effective
   * 
   * @param sanitized Sanitized data to validate
   * @throws CloudSupporterError if sensitive data might still be present
   */
  static validateSanitization(sanitized: Record<string, unknown>): void {
    const jsonString = JSON.stringify(sanitized);
    
    // Check for common sensitive patterns that might have been missed
    const criticalPatterns = [
      /AKIA[0-9A-Z]{16}/,              // AWS Access Key
      /[0-9]{12}/,                     // Potential AWS Account ID
      /sk_live_[a-zA-Z0-9]{24}/,       // Stripe live key
      /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/, // JWT
    ];

    for (const pattern of criticalPatterns) {
      if (pattern.test(jsonString)) {
        throw new CloudSupporterError(
          ErrorType.RESOURCE_ERROR,
          'Sanitization validation failed: Potential sensitive data still present',
          { pattern: pattern.source, context: 'post-sanitization-check' }
        );
      }
    }
  }
}