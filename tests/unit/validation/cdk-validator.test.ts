// CLAUDE.md準拠: Test-Driven Development (TDD) + 型安全性
// tasks.md T-010: TypeScript検証・品質向上テスト

import type { CDKValidator} from '../../../src/validation/cdk-validator';
import { createCDKValidator } from '../../../src/validation/cdk-validator';

describe('CDK Validator', () => {
  let validator: CDKValidator;

  beforeEach(() => {
    validator = createCDKValidator();
  });

  describe('Basic Validation', () => {
    it('should validate correct CDK code structure', async () => {
      const validCode = `
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const testAlarm = new cloudwatch.Alarm(this, 'TestAlarm', {
      alarmName: 'test-alarm',
      threshold: 80
    });
  }
}
      `;

      const result = await validator.validateGeneratedCode(validCode);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.alarmCount).toBe(1);
      expect(result.metrics.importCount).toBe(3);
    });

    it('should detect missing required CDK structure', async () => {
      const invalidCode = `
const someFunction = () => {
  console.log('Not a CDK stack');
};
      `;

      const result = await validator.validateGeneratedCode(invalidCode);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('exported class'))).toBe(true);
      expect(result.errors.some(error => error.includes('must extend cdk.Stack'))).toBe(true);
    });
  });

  describe('AWS Limits Validation', () => {
    it('should warn about high alarm count', async () => {
      // Create code with many alarms (simulate high count)
      let codeWithManyAlarms = `
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
      `;

      // Add 1500 alarms to trigger warning
      for (let i = 0; i < 1500; i++) {
        codeWithManyAlarms += `
    const alarm${i} = new cloudwatch.Alarm(this, 'Alarm${i}', { threshold: 80 });`;
      }

      codeWithManyAlarms += `
  }
}
      `;

      const result = await validator.validateGeneratedCode(codeWithManyAlarms);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(warning => warning.includes('approaching AWS CloudWatch limit'))).toBe(true);
      expect(result.metrics.alarmCount).toBe(1500);
    });

    it('should error for alarm count exceeding AWS limits', async () => {
      // Create mock code representing >5000 alarms
      const codeWithTooManyAlarms = 'new cloudwatch.Alarm'.repeat(5001);

      const result = await validator.validateGeneratedCode(codeWithTooManyAlarms, { compileCheck: false });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('exceeds AWS CloudWatch limit of 5000'))).toBe(true);
    });
  });

  describe('CDK Best Practices Validation', () => {
    it('should detect duplicate construct IDs', async () => {
      const codeWithDuplicates = `
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const alarm1 = new cloudwatch.Alarm(this, 'DuplicateAlarm', { threshold: 70 });
    const alarm2 = new cloudwatch.Alarm(this, 'DuplicateAlarm', { threshold: 90 });
  }
}
      `;

      const result = await validator.validateGeneratedCode(codeWithDuplicates, { compileCheck: false });
      
      expect(result.errors.some(error => error.includes('Duplicate construct IDs'))).toBe(true);
      expect(result.errors.some(error => error.includes('DuplicateAlarm'))).toBe(true);
    });

    it('should warn about unused imports', async () => {
      const codeWithUnusedImports = `
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const alarm = new cloudwatch.Alarm(this, 'TestAlarm', { threshold: 80 });
  }
}
      `;

      const result = await validator.validateGeneratedCode(codeWithUnusedImports, { compileCheck: false });
      
      expect(result.warnings.some(warning => warning.includes('aws-sns module but no SNS usage'))).toBe(true);
      expect(result.warnings.some(warning => warning.includes('cloudwatch-actions module but no actions usage'))).toBe(true);
    });

    it('should suggest improvements for hardcoded values', async () => {
      const codeWithHardcoded = `
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const ecsMetric = {
      dimensionsMap: {
        ServiceName: 'MyService',
        ClusterName: 'default'
      }
    };
  }
}
      `;

      const result = await validator.validateGeneratedCode(codeWithHardcoded, { compileCheck: false });
      
      expect(result.suggestions.some(suggestion => suggestion.includes('parameterizing ECS cluster name'))).toBe(true);
    });
  });

  describe('Validation Options', () => {
    it('should respect validation options', async () => {
      const testCode = `
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class TestStack extends cdk.Stack {}
      `;

      // Test with minimal validation
      const minimalResult = await validator.validateGeneratedCode(testCode, {
        compileCheck: false,
        bestPracticesCheck: false,
        awsLimitsCheck: false
      });

      // Should still check basic structure
      expect(typeof minimalResult.isValid).toBe('boolean');
      expect(Array.isArray(minimalResult.errors)).toBe(true);
      expect(Array.isArray(minimalResult.warnings)).toBe(true);
      expect(typeof minimalResult.metrics.codeLength).toBe('number');
    });
  });

  describe('Code Metrics', () => {
    it('should accurately count alarms and imports', async () => {
      const codeWithMetrics = `
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const alarm1 = new cloudwatch.Alarm(this, 'Alarm1', {});
    const alarm2 = new cloudwatch.Alarm(this, 'Alarm2', {});
    const alarm3 = new cloudwatch.Alarm(this, 'Alarm3', {});
  }
}
      `;

      const result = await validator.validateGeneratedCode(codeWithMetrics, { compileCheck: false });
      
      expect(result.metrics.alarmCount).toBe(3);
      expect(result.metrics.importCount).toBe(3);
      expect(result.metrics.codeLength).toBeGreaterThan(0);
    });
  });
});