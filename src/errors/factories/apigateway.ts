import { ErrorBuilder } from '../error.builder';
import { ErrorCatalog } from '../error.catalog';
import type { CloudSupporterError } from '../error.class';

export const APIGatewayErrors = {
  metricsNotFound: (): CloudSupporterError =>
    ErrorBuilder.fromCatalog(ErrorCatalog.metricsNotFound('API Gateway'))
      .withDetails({
        resourceType: 'AWS::ApiGateway::RestApi',
        alternativeType: 'AWS::Serverless::Api'
      })
      .build()
} as const;