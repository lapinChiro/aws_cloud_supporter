import { ErrorBuilder } from '../error.builder';
import { ErrorCatalog } from '../error.catalog';
import type { CloudSupporterError } from '../error.class';
import { ERROR_CODES, ErrorType } from '../error.types';

export const DynamoDBErrors = {
  metricsNotFound: (): CloudSupporterError =>
    ErrorBuilder.fromCatalog(ErrorCatalog.metricsNotFound('DynamoDB'))
      .withDetails({ resourceType: 'AWS::DynamoDB::Table' })
      .build(),

  invalidBillingMode: (billingMode: string): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        `Invalid DynamoDB billing mode: ${billingMode}`
      )
    )
    .withDetails({ billingMode, resourceType: 'AWS::DynamoDB::Table' })
    .build(),

  throughputExceeded: (throughput: number, maximum: number): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        `DynamoDB throughput ${throughput} exceeds maximum of ${maximum}`
      )
    )
    .withDetails({ throughput, maximum, resourceType: 'AWS::DynamoDB::Table' })
    .build()
} as const;