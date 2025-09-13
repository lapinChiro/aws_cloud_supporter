// Test-specific type definitions

import type { CloudFormationResource } from '../aws/cloudformation';

import type { AnalysisResultData } from './parser';

// Mock data types for tests
export interface MockAnalysisResult {
  resources: MockResource[];
  metadata: {
    template_path: string;
    [key: string]: unknown;
  };
}

export interface MockResource {
  resource_type: string;
  logical_id: string;
  resource_name?: string;
  properties?: Record<string, unknown>;
}

// Extended types for testing
export interface ExtendedAnalysisResult extends AnalysisResultData {
  testMetadata?: {
    testName?: string;
    testCase?: string;
    mockData?: boolean;
  };
}

// Security test types
export interface SecurityTestData {
  input: {
    template?: Record<string, unknown>;
    options?: Record<string, unknown>;
  };
  expected: {
    sanitized?: boolean;
    errors?: string[];
    warnings?: string[];
  };
}

export interface SanitizationReport {
  sensitiveDataFound: boolean;
  sanitizedFields: string[];
  details: Array<{
    path: string;
    type: string;
    action: string;
  }>;
}

// Performance test types
export interface PerformanceTestResult {
  concurrency: number;
  time: number;
  memory: {
    before: number;
    after: number;
    peak: number;
  };
  metrics?: {
    generated: number;
    errors: number;
  };
}

// E2E test types
export interface CLITestResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface ParsedCLIOutput {
  resources: Array<{
    resource_type: string;
    logical_id: string;
    metrics?: unknown[];
  }>;
  metadata?: Record<string, unknown>;
  errors?: string[];
}

// Generator test types
export interface GeneratorTestCase {
  name: string;
  input: {
    resources: CloudFormationResource[];
    options?: Record<string, unknown>;
  };
  expected: {
    code?: string;
    metrics?: unknown[];
    errors?: string[];
  };
}

// Helper function types
export type TestResourceFactory = (overrides?: Partial<CloudFormationResource>) => CloudFormationResource;
export type TestAnalysisFactory = (resources?: MockResource[]) => MockAnalysisResult;

// Integration test types
export interface IntegrationTestContext {
  templatePath: string;
  outputDir: string;
  cleanup: () => Promise<void>;
}

export interface IntegrationTestOptions {
  timeout?: number;
  retries?: number;
  verbose?: boolean;
}

// Validation test types
export interface ValidationTestCase {
  description: string;
  input: unknown;
  shouldPass: boolean;
  expectedError?: string;
}

// Type assertions for tests
export function isMockResource(resource: unknown): resource is MockResource {
  return typeof resource === 'object' && 
         resource !== null &&
         'resource_type' in resource &&
         'logical_id' in resource;
}

export function isExtendedAnalysisResult(result: unknown): result is ExtendedAnalysisResult {
  return typeof result === 'object' &&
         result !== null &&
         'resources' in result &&
         'metadata' in result;
}

// Default mock data factories
export const defaultMockResource: TestResourceFactory = (overrides = {}) => ({
  Type: 'AWS::Lambda::Function',
  Properties: {
    Runtime: 'nodejs18.x',
    Handler: 'index.handler',
    ...overrides.Properties
  },
  ...overrides
} as CloudFormationResource);

export const defaultMockAnalysis: TestAnalysisFactory = (resources = []) => ({
  resources: resources.length > 0 ? resources : [
    {
      resource_type: 'AWS::Lambda::Function',
      logical_id: 'TestFunction',
      resource_name: 'test-function'
    }
  ],
  metadata: {
    template_path: 'test-template.yaml'
  }
});