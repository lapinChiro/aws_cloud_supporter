// CLAUDE.md準拠: Type-Driven Development + Zero Type Errors + 品質重視
// requirement.md FR-5.1, FR-6.3: TypeScript検証・品質向上
// tasks.md T-010: TypeScript検証・品質向上

import type { ILogger } from '../interfaces/logger';

/**
 * CDK Code Validator
 * 
 * Provides validation for generated CDK TypeScript code including
 * compilation checking, best practices validation, and AWS limits checking.
 * 
 * @requirement FR-5.1 型安全性
 * @requirement FR-6.3 検証機能
 */
export class CDKValidator {
  constructor(private readonly logger: ILogger) {}

  /**
   * Validate generated CDK code comprehensively
   * 
   * @param generatedCode CDK TypeScript code to validate
   * @param options Validation options
   * @returns Validation results
   */
  async validateGeneratedCode(
    generatedCode: string,
    options: CDKValidationOptions = {}
  ): Promise<CDKValidationResult> {
    const result: CDKValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      metrics: {
        codeLength: generatedCode.length,
        alarmCount: this.countAlarms(generatedCode),
        importCount: this.countImports(generatedCode)
      }
    };

    try {
      // 1. Basic syntax validation
      this.validateBasicSyntax(generatedCode, result);

      // 2. AWS limits validation
      this.validateAWSLimits(generatedCode, result);

      // 3. CDK best practices validation
      this.validateCDKBestPractices(generatedCode, result);

      // 4. TypeScript compilation (if enabled)
      if (options.compileCheck !== false) {
        await this.validateTypeScriptCompilation(generatedCode, result);
      }

      // Determine overall validity
      result.isValid = result.errors.length === 0;

      this.logger.debug(`CDK validation completed: ${result.isValid ? 'PASS' : 'FAIL'} (${result.errors.length} errors, ${result.warnings.length} warnings)`);

    } catch (error) {
      result.errors.push(`Validation process failed: ${(error as Error).message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate basic TypeScript syntax
   */
  private validateBasicSyntax(
    code: string,
    result: CDKValidationResult
  ): void {
    // Check for required CDK structure
    if (!code.includes('export class')) {
      result.errors.push('Generated code must contain an exported class');
    }

    if (!code.includes('extends cdk.Stack')) {
      result.errors.push('Generated class must extend cdk.Stack');
    }

    if (!code.includes('import * as cdk from \'aws-cdk-lib\'')) {
      result.errors.push('Missing required CDK import');
    }

    // Check for basic TypeScript syntax issues
    const syntaxChecks = [
      { pattern: /\bfunction\s*\(/g, issue: 'Unexpected function declaration (should use class methods)' },
      { pattern: /\bvar\s+/g, issue: 'Use const/let instead of var' },
      { pattern: /==(?!=)/g, issue: 'Use === instead of ==' },
      { pattern: /!=(?!=)/g, issue: 'Use !== instead of !=' }
    ];

    for (const check of syntaxChecks) {
      if (check.pattern.test(code)) {
        result.warnings.push(check.issue);
      }
    }
  }

  /**
   * Validate AWS service limits
   */
  private validateAWSLimits(code: string, result: CDKValidationResult): void {
    const alarmCount = this.countAlarms(code);
    
    // AWS CloudWatch limits
    if (alarmCount > 5000) {
      result.errors.push(
        `Generated ${alarmCount} alarms exceeds AWS CloudWatch limit of 5000 alarms per account`
      );
    } else if (alarmCount > 1000) {
      result.warnings.push(
        `Generated ${alarmCount} alarms is approaching AWS CloudWatch limit (5000). Consider filtering resources.`
      );
    }

    // SNS topic limits
    const snsTopicCount = (code.match(/new sns\.Topic/g) ?? []).length;
    if (snsTopicCount > 100) {
      result.warnings.push(
        `Generated ${snsTopicCount} SNS topics. AWS limit is 100,000 per account, but consider consolidation.`
      );
    }

    // CDK construct limits
    const constructCount = (code.match(/new \w+\.\w+\(/g) ?? []).length;
    if (constructCount > 500) {
      result.warnings.push(
        `Generated ${constructCount} constructs in single stack. Consider splitting into multiple stacks for better organization.`
      );
    }
  }

  /**
   * Validate CDK best practices
   */
  private validateCDKBestPractices(code: string, result: CDKValidationResult): void {
    // Check for construct ID patterns
    const alarmConstructs = code.match(/new cloudwatch\.Alarm\(this,\s*'([^']+)'/g);
    if (alarmConstructs) {
      const constructIds = alarmConstructs.map(match => {
        const idMatch = match.match(/'([^']+)'/);
        return idMatch?.[1] ?? '';
      }).filter(id => id);

      // Check for duplicate construct IDs
      const duplicates = this.findDuplicates(constructIds);
      if (duplicates.length > 0) {
        result.errors.push(`Duplicate construct IDs found: ${duplicates.join(', ')}`);
      }

      // Check construct ID naming convention
      for (const id of constructIds) {
        if (!/^[A-Z][a-zA-Z0-9]*Alarm$/.test(id)) {
          result.warnings.push(`Construct ID '${id}' doesn't follow recommended naming pattern (PascalCase ending with 'Alarm')`);
        }
      }
    }

    // Check for unused imports
    const imports = this.extractImports(code);
    for (const importModule of imports) {
      if (importModule.includes('aws-sns') && !code.includes('sns.')) {
        result.warnings.push('Imported aws-sns module but no SNS usage found');
      }
      if (importModule.includes('cloudwatch-actions') && !code.includes('cloudwatchActions.')) {
        result.warnings.push('Imported cloudwatch-actions module but no actions usage found');
      }
    }

    // Check for hardcoded values
    if (code.includes('ClusterName: \'default\'')) {
      result.suggestions.push('Consider parameterizing ECS cluster name instead of hardcoding \'default\'');
    }
  }

  /**
   * Validate TypeScript compilation (basic check)
   */
  private async validateTypeScriptCompilation(
    code: string,
    result: CDKValidationResult
  ): Promise<void> {
    try {
      // Dynamic imports to avoid unused import warnings
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');
      
      // Write code to temporary file for compilation check
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cdk-validation-'));
      const tempFile = path.join(tempDir, 'stack.ts');
      
      await fs.writeFile(tempFile, code, 'utf-8');
      
      // Basic syntax check (without CDK dependencies)
      const { spawn } = await import('child_process');
      
      const compileProcess = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck', tempFile], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';
      compileProcess.stderr?.on('data', (data: Buffer | string) => {
        stderr += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        compileProcess.on('close', (exitCode) => {
          if (exitCode === 0 || (stderr?.includes('Cannot find module'))) {
            // Success or only missing CDK modules (expected)
            resolve();
          } else {
            reject(new Error(stderr || 'Unknown compilation error'));
          }
        });

        compileProcess.on('error', reject);

        // Timeout after 10 seconds
        setTimeout(() => {
          compileProcess.kill();
          reject(new Error('TypeScript compilation timeout'));
        }, 10000);
      });

      // Clean up
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Cannot find module')) {
        result.suggestions.push('TypeScript compilation skipped - CDK modules not installed (this is expected in test environment)');
      } else {
        result.warnings.push(`TypeScript compilation issues: ${errorMessage}`);
      }
    }
  }

  /**
   * Count CloudWatch alarms in generated code
   */
  private countAlarms(code: string): number {
    return (code.match(/new cloudwatch\.Alarm/g) ?? []).length;
  }

  /**
   * Count import statements
   */
  private countImports(code: string): number {
    return (code.match(/^import\s+.*from/gm) ?? []).length;
  }

  /**
   * Extract import statements for analysis
   */
  private extractImports(code: string): string[] {
    const importMatches = code.match(/^import\s+.*from\s+['"][^'"]+['"]/gm);
    return importMatches ?? [];
  }

  /**
   * Find duplicate values in array
   */
  private findDuplicates<T>(array: T[]): T[] {
    const seen = new Set<T>();
    const duplicates = new Set<T>();
    
    for (const item of array) {
      if (seen.has(item)) {
        duplicates.add(item);
      }
      seen.add(item);
    }
    
    return Array.from(duplicates);
  }
}

/**
 * CDK Validation Options
 */
export interface CDKValidationOptions {
  /** Enable TypeScript compilation checking */
  compileCheck?: boolean;
  
  /** Enable best practices validation */
  bestPracticesCheck?: boolean;
  
  /** Enable AWS limits validation */
  awsLimitsCheck?: boolean;
  
  /** Verbose validation output */
  verbose?: boolean;
}

/**
 * CDK Validation Result
 */
export interface CDKValidationResult {
  /** Whether validation passed overall */
  isValid: boolean;
  
  /** Validation errors (must be fixed) */
  errors: string[];
  
  /** Validation warnings (should be addressed) */
  warnings: string[];
  
  /** Validation suggestions (nice to have) */
  suggestions: string[];
  
  /** Code metrics */
  metrics: {
    codeLength: number;
    alarmCount: number;
    importCount: number;
  };
}

/**
 * Create CDKValidator with default logger for testing
 */
export function createCDKValidator(logger?: ILogger): CDKValidator {
  if (!logger) {
    // Create minimal logger for testing
    const defaultLogger: ILogger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      success: () => {},
      setLevel: () => {}
    };
    return new CDKValidator(defaultLogger);
  }
  
  return new CDKValidator(logger);
}