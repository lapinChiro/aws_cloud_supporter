// Parser result types with proper error handling

export interface ParseResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: ParseError[];
  metadata: ParseMetadata;
}

export interface ParseError {
  message: string;
  location?: SourceLocation;
  severity: 'error' | 'warning';
  code?: string;
  details?: Record<string, unknown>;
}

export interface SourceLocation {
  line: number;
  column: number;
  file?: string;
  offset?: number;
}

export interface ParseMetadata {
  parseTime: number;
  fileSize?: number;
  encoding?: string;
  parser: string;
  version?: string;
}

// Template parsing specific types
export interface TemplateParseResult extends ParseResult<CloudFormationTemplateData> {
  templateFormat: 'json' | 'yaml';
  originalContent?: string;
}

export interface CloudFormationTemplateData {
  template: Record<string, unknown>;
  resources: ParsedResource[];
  parameters?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
}

export interface ParsedResource {
  logicalId: string;
  type: string;
  properties: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  dependencies?: string[];
}

// Configuration parsing types
export interface ConfigParseResult extends ParseResult<ConfigurationData> {
  configType: string;
  validationErrors?: ValidationError[];
}

export interface ConfigurationData {
  version: string;
  settings: Record<string, unknown>;
  environments?: Record<string, EnvironmentConfig>;
}

export interface EnvironmentConfig {
  name: string;
  variables: Record<string, string | number | boolean>;
  secrets?: string[];
}

export interface ValidationError {
  path: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
}

// Test-specific mock types for testing
export interface MockParseResult {
  template: Record<string, unknown>;
  resources: Array<{
    resource_type: string;
    logical_id: string;
    properties?: Record<string, unknown>;
  }>;
  metadata?: {
    template_path?: string;
    [key: string]: unknown;
  };
}

// CDK-specific parsing types
export interface CDKParseResult extends ParseResult<CDKTemplateData> {
  stackName: string;
  synthesizedAt?: Date;
}

export interface CDKTemplateData extends CloudFormationTemplateData {
  cdkMetadata?: {
    version: string;
    stackName: string;
    env?: {
      account?: string;
      region?: string;
    };
  };
}

// Analysis result types
export interface AnalysisResultData {
  resources: Array<{
    resource_type: string;
    logical_id: string;
    resource_name?: string;
    properties?: Record<string, unknown>;
  }>;
  metadata: {
    template_path: string;
    analysis_version: string;
    timestamp: string;
  };
  summary?: {
    total_resources: number;
    resource_types: string[];
  };
}