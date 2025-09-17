import { ErrorBuilder } from '../error.builder';
import { ErrorCatalog } from '../error.catalog';
import type { CloudSupporterError } from '../error.class';

export const RDSErrors = {
  metricsNotFound: (): CloudSupporterError =>
    ErrorBuilder.fromCatalog(ErrorCatalog.metricsNotFound('RDS'))
      .withDetails({ resourceType: 'AWS::RDS::DBInstance' })
      .build()
} as const;