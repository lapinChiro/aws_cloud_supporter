// CloudFormation template strict types

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, CloudFormationParameter>;
  Resources: Record<string, CloudFormationResource>;
  Outputs?: Record<string, CloudFormationOutput>;
  Conditions?: Record<string, CloudFormationCondition>;
  Mappings?: Record<string, CloudFormationMapping>;
  Metadata?: Record<string, unknown>;
}

export interface CloudFormationParameter {
  Type: string;
  Default?: string | number | boolean;
  AllowedValues?: Array<string | number>;
  AllowedPattern?: string;
  ConstraintDescription?: string;
  Description?: string;
  MinLength?: number;
  MaxLength?: number;
  MinValue?: number;
  MaxValue?: number;
  NoEcho?: boolean;
}

export interface CloudFormationResource {
  Type: string;
  Properties?: Record<string, unknown>;
  Condition?: string;
  DependsOn?: string | string[];
  Metadata?: Record<string, unknown>;
  CreationPolicy?: CloudFormationCreationPolicy;
  UpdatePolicy?: CloudFormationUpdatePolicy;
  DeletionPolicy?: 'Delete' | 'Retain' | 'Snapshot';
  UpdateReplacePolicy?: 'Delete' | 'Retain' | 'Snapshot';
}

export interface CloudFormationOutput {
  Description?: string;
  Value: unknown;
  Export?: {
    Name: string;
  };
  Condition?: string;
}

export interface CloudFormationCondition {
  // Conditions are complex expressions
  [key: string]: unknown;
}

export interface CloudFormationMapping {
  [key: string]: {
    [key: string]: unknown;
  };
}

export interface CloudFormationCreationPolicy {
  AutoScalingCreationPolicy?: {
    MinSuccessfulInstancesPercent?: number;
  };
  ResourceSignal?: {
    Count?: number;
    Timeout?: string;
  };
}

export interface CloudFormationUpdatePolicy {
  AutoScalingReplacingUpdate?: {
    WillReplace?: boolean;
  };
  AutoScalingRollingUpdate?: {
    MaxBatchSize?: number;
    MinInstancesInService?: number;
    MinSuccessfulInstancesPercent?: number;
    PauseTime?: string;
    SuspendProcesses?: string[];
    WaitOnResourceSignals?: boolean;
  };
  AutoScalingScheduledAction?: {
    IgnoreUnmodifiedGroupSizeProperties?: boolean;
  };
  CodeDeployLambdaAliasUpdate?: {
    ApplicationName: string;
    DeploymentGroupName: string;
    AfterAllowTrafficHook?: string;
    BeforeAllowTrafficHook?: string;
  };
  EnableVersionUpgrade?: boolean;
  UseOnlineResharding?: boolean;
}