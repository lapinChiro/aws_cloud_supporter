// src/types/cdk-business.ts (新規作成)
import type * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type * as sns from 'aws-cdk-lib/aws-sns';

/**
 * CDK Alarm ビジネスロジック専用プロパティ
 * AWS公式型と組み合わせて使用
 */
export interface CDKAlarmBusiness {
  /** CDK construct識別用ID */
  readonly constructId: string;
  
  /** アラーム重要度分類 */
  readonly severity: 'Warning' | 'Critical';
  
  /** CloudFormation論理ID */
  readonly resourceLogicalId: string;
  
  /** AWSリソースタイプ識別 */
  readonly resourceType: string;
}

/**
 * AWS公式型 + ビジネスロジックの完全型
 * 要件: cloudwatch.AlarmProps使用
 */
export type CDKAlarmComplete = cloudwatch.AlarmProps & CDKAlarmBusiness;

/**
 * SNS設定（公式型ベース）
 * 要件: sns.TopicProps使用
 */
export interface CDKSNSConfiguration {
  /** テンプレート変数名 */
  readonly variableName: string;
  
  /** 新規作成 vs 既存使用フラグ */
  readonly isExisting: boolean;
  
  /** 既存Topic ARN（既存使用時） */
  readonly topicArn?: string;
  
  /** 新規Topic作成プロパティ（新規作成時） */
  readonly topicProps?: sns.TopicProps;
}

/**
 * CDK Stack生成データ（公式型ベース）
 */
export interface CDKStackDataOfficial {
  /** CDK Stack class name */
  readonly stackClassName: string;
  
  /** 完全なアラーム定義配列 */
  readonly alarms: CDKAlarmComplete[];
  
  /** Stack metadata */
  readonly metadata: {
    readonly generatedAt: string;
    readonly templatePath: string;
    readonly totalResources: number;
    readonly totalAlarms: number;
    readonly toolVersion: string;
  };
  
  /** SNS Topic設定（任意） */
  readonly snsConfiguration?: CDKSNSConfiguration;
}

// 型変換ユーティリティ
export function extractOfficialAlarmProps(complete: CDKAlarmComplete): cloudwatch.AlarmProps {
  const { constructId: _constructId, severity: _severity, resourceLogicalId: _resourceLogicalId, resourceType: _resourceType, ...officialProps } = complete;
  return officialProps;
}

export function extractBusinessProps(complete: CDKAlarmComplete): CDKAlarmBusiness {
  return {
    constructId: complete.constructId,
    severity: complete.severity,
    resourceLogicalId: complete.resourceLogicalId,
    resourceType: complete.resourceType
  };
}

/**
 * CDK generation options
 * Moved from cdk-mvp.ts for official types migration
 */
export interface CDKOptions {
  /** CDK mode enabled */
  enabled: boolean;
  
  /** Output directory path (optional, stdout if not specified) */
  outputDir?: string;
  
  /** Custom stack class name (default: "CloudWatchAlarmsStack") */
  stackName?: string;
  
  /** Include low-importance metrics in generation */
  includeLowImportance?: boolean;
  
  /** Resource type filters (e.g., ["AWS::RDS::DBInstance"]) */
  resourceTypeFilters?: string[];
  
  /** Enable verbose logging */
  verbose?: boolean;
  
  /** Validate generated CDK code compilation */
  validateCode?: boolean;
  
  /** Enable SNS topic creation for alarm notifications */
  enableSNS?: boolean;
  
  /** Existing SNS topic ARN to use for alarm notifications */
  snsTopicArn?: string;
}

/**
 * CDK generation result
 * Moved from cdk-mvp.ts for official types migration
 */
export interface CDKGenerationResult {
  /** Generated TypeScript CDK code */
  generatedCode: string;
  
  /** Output file path (if written to file) */
  outputFilePath?: string;
  
  /** Generation metadata */
  metadata: {
    readonly generatedAt: string;
    readonly templatePath: string;
    readonly totalResources: number;
    readonly totalAlarms: number;
    readonly toolVersion: string;
  };
  
  /** Generation success status */
  success: boolean;
  
  /** Error message (if generation failed) */
  errorMessage?: string;
}

/**
 * Legacy CDK stack data structure (for test compatibility)
 * Adapted from cdk-mvp.ts for official types migration
 */
export interface CDKStackData {
  /** CDK Stack class name */
  stackClassName: string;
  
  /** Generated alarm definitions */
  alarms: CDKAlarmComplete[];
  
  /** Stack metadata */
  metadata: CDKStackMetadata;
  
  /** SNS Topic configuration for alarm notifications */
  snsTopicDefinition?: CDKSNSConfiguration;
}

/**
 * CDK stack metadata
 * Moved from cdk-mvp.ts for official types migration
 */
export interface CDKStackMetadata {
  /** ISO timestamp when CDK code was generated */
  generatedAt: string;
  
  /** Source CloudFormation template path */
  templatePath: string;
  
  /** Total number of resources processed */
  totalResources: number;
  
  /** Total number of alarms generated */
  totalAlarms: number;
  
  /** Tool version used for generation */
  toolVersion: string;
}