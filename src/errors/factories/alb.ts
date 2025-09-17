import { ErrorBuilder } from '../error.builder';
import { ErrorCatalog } from '../error.catalog';
import type { CloudSupporterError } from '../error.class';
import { ERROR_CODES, ErrorType } from '../error.types';

export const ALBErrors = {
  metricsNotFound: (): CloudSupporterError =>
    ErrorBuilder.fromCatalog(ErrorCatalog.metricsNotFound('ALB'))
      .withDetails({ resourceType: 'AWS::ElasticLoadBalancingV2::LoadBalancer' })
      .build(),

  invalidTargetType: (targetType: string): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.VALIDATION_FAILED,
        ErrorType.VALIDATION_ERROR,
        `Invalid ALB target type: ${targetType}`
      )
    )
    .withDetails({ targetType, resourceType: 'AWS::ElasticLoadBalancingV2::LoadBalancer' })
    .build(),

  onlyApplicationLoadBalancerSupported: (loadBalancerType: string): CloudSupporterError =>
    ErrorBuilder.fromCatalog(
      ErrorCatalog.generic(
        ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE,
        ErrorType.RESOURCE_ERROR,
        'Only Application Load Balancers are supported'
      )
    )
    .withDetails({
      loadBalancerType,
      supportedType: 'application',
      resourceType: 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    })
    .build()
} as const;