import { ErrorBuilder } from '../error.builder';
import { ErrorCatalog } from '../error.catalog';
import type { CloudSupporterError } from '../error.class';
import { ERROR_CODES, ErrorType } from '../error.types';

export const LambdaErrors = {
  metricsNotFound: (): CloudSupporterError =>
    ErrorBuilder.fromCatalog(ErrorCatalog.metricsNotFound('Lambda'))
      .withDetails({ resourceType: 'AWS::Lambda::Function' })
      .build(),

  invalidRuntime: (runtime: string): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        `Invalid Lambda runtime: ${runtime}`
      )
    )
    .withDetails({ runtime, resourceType: 'AWS::Lambda::Function' })
    .build(),

  timeoutTooHigh: (timeout: number): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        `Lambda timeout ${timeout}s exceeds maximum of 900s`
      )
    )
    .withDetails({ timeout, maximum: 900, resourceType: 'AWS::Lambda::Function' })
    .build()
} as const;