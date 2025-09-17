import { ErrorBuilder } from '../error.builder';
import { ErrorCatalog } from '../error.catalog';
import type { CloudSupporterError } from '../error.class';
import { ERROR_CODES, ErrorType } from '../error.types';

export const ECSErrors = {
  metricsNotFound: (): CloudSupporterError =>
    ErrorBuilder.fromCatalog(ErrorCatalog.metricsNotFound('ECS'))
      .withDetails({ resourceType: 'AWS::ECS::Service' })
      .build(),

  onlyFargateSupported: (launchType: string): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE,
        ErrorType.RESOURCE_ERROR,
        'Only Fargate services are supported'
      )
    )
    .withDetails({
      launchType,
      supportedType: 'FARGATE',
      resourceType: 'AWS::ECS::Service'
    })
    .build()
} as const;