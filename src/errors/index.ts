// Core exports
export { CloudSupporterError } from './error.class';
export { ErrorType, ERROR_CODES } from './error.types';
export type { ErrorCode } from './error.types';
export { ErrorBuilder } from './error.builder';
export { ErrorCatalog } from './error.catalog';

// Factory exports
import { CloudSupporterError as CSError } from './error.class';
import { ErrorType as ET } from './error.types';
import { ALBErrors } from './factories/alb';
import { APIGatewayErrors } from './factories/apigateway';
import { CommonErrors } from './factories/common';
import { DynamoDBErrors } from './factories/dynamodb';
import { ECSErrors } from './factories/ecs';
import { LambdaErrors } from './factories/lambda';
import { RDSErrors } from './factories/rds';

export const Errors = {
  Lambda: LambdaErrors,
  DynamoDB: DynamoDBErrors,
  ALB: ALBErrors,
  ECS: ECSErrors,
  APIGateway: APIGatewayErrors,
  RDS: RDSErrors,
  Common: CommonErrors
} as const;

// Type exports
export type { ErrorDetails, ErrorCatalogEntry, StructuredError } from './error.types';

// Helper functions for error type checking

export function isFileError(error: unknown): error is CSError {
  return error instanceof CSError &&
         (error).type === ET.FILE_ERROR;
}

export function isParseError(error: unknown): error is CSError {
  return error instanceof CSError &&
         (error).type === ET.PARSE_ERROR;
}