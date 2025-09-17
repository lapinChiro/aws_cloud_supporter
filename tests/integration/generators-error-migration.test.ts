import { CloudSupporterError, ERROR_CODES, ErrorType } from '../../src/errors';
import { ALBMetricsGenerator } from '../../src/generators/alb.generator';
import { APIGatewayMetricsGenerator } from '../../src/generators/apigateway.generator';
import { DynamoDBMetricsGenerator } from '../../src/generators/dynamodb.generator';
import { ECSMetricsGenerator } from '../../src/generators/ecs.generator';
import { RDSMetricsGenerator } from '../../src/generators/rds.generator';
import { logger } from '../../src/utils/logger';
import {
  createDynamoDBTable,
  createALB,
  createECSService,
  createAPIGateway,
  createRDSInstance
} from '../helpers';

describe('Generators Error Migration', () => {
  describe('DynamoDB Generator', () => {
    let generator: DynamoDBMetricsGenerator;

    beforeEach(() => {
      generator = new DynamoDBMetricsGenerator(logger);
    });

    it('should use new CloudSupporterError from errors package', () => {
      expect(CloudSupporterError).toBeDefined();
      const testError = new CloudSupporterError(
        ERROR_CODES.RESOURCE_INVALID,
        ErrorType.RESOURCE_ERROR,
        'Test DynamoDB error'
      );
      expect(testError).toBeInstanceOf(CloudSupporterError);
    });

    it('should work with valid DynamoDB resources', async () => {
      const validResource = createDynamoDBTable('TestTable', {
        BillingMode: 'PAY_PER_REQUEST'
      });

      const result = await generator.generate(validResource);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('ALB Generator', () => {
    let generator: ALBMetricsGenerator;

    beforeEach(() => {
      generator = new ALBMetricsGenerator(logger);
    });

    it('should use new CloudSupporterError from errors package', () => {
      const testError = new CloudSupporterError(
        ERROR_CODES.RESOURCE_INVALID,
        ErrorType.RESOURCE_ERROR,
        'Test ALB error'
      );
      expect(testError).toBeInstanceOf(CloudSupporterError);
    });

    it('should work with valid ALB resources', async () => {
      const validResource = createALB('TestALB', {
        Type: 'application'
      });

      const result = await generator.generate(validResource);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('ECS Generator', () => {
    let generator: ECSMetricsGenerator;

    beforeEach(() => {
      generator = new ECSMetricsGenerator(logger);
    });

    it('should use new CloudSupporterError from errors package', () => {
      const testError = new CloudSupporterError(
        ERROR_CODES.RESOURCE_INVALID,
        ErrorType.RESOURCE_ERROR,
        'Test ECS error'
      );
      expect(testError).toBeInstanceOf(CloudSupporterError);
    });

    it('should work with valid ECS resources', async () => {
      const validResource = createECSService('TestService', {
        DesiredCount: 2,
        LaunchType: 'FARGATE'
      });

      const result = await generator.generate(validResource);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway Generator', () => {
    let generator: APIGatewayMetricsGenerator;

    beforeEach(() => {
      generator = new APIGatewayMetricsGenerator(logger);
    });

    it('should use new CloudSupporterError from errors package', () => {
      const testError = new CloudSupporterError(
        ERROR_CODES.RESOURCE_INVALID,
        ErrorType.RESOURCE_ERROR,
        'Test API Gateway error'
      );
      expect(testError).toBeInstanceOf(CloudSupporterError);
    });

    it('should work with valid API Gateway resources', async () => {
      const validResource = createAPIGateway('TestAPI', {
        Name: 'TestAPIGateway'
      });

      const result = await generator.generate(validResource);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('RDS Generator', () => {
    let generator: RDSMetricsGenerator;

    beforeEach(() => {
      generator = new RDSMetricsGenerator(logger);
    });

    it('should use new CloudSupporterError from errors package', () => {
      const testError = new CloudSupporterError(
        ERROR_CODES.RESOURCE_INVALID,
        ErrorType.RESOURCE_ERROR,
        'Test RDS error'
      );
      expect(testError).toBeInstanceOf(CloudSupporterError);
    });

    it('should work with valid RDS resources', async () => {
      const validResource = createRDSInstance('TestDB', {
        DBInstanceClass: 'db.t3.micro'
      });

      const result = await generator.generate(validResource);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});