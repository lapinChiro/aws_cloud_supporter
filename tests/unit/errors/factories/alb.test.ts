import { CloudSupporterError } from '../../../../src/errors/error.class';
import { ERROR_CODES, ErrorType } from '../../../../src/errors/error.types';
import { ALBErrors } from '../../../../src/errors/factories/alb';

describe('ALBErrors Factory', () => {
  describe('metricsNotFound', () => {
    it('should create ALB metrics not found error', () => {
      const error = ALBErrors.metricsNotFound();

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.METRICS_NOT_FOUND);
      expect(error.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(error.message).toBe('ALB metrics configuration not found');
      expect(error.details?.resourceType).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    it('should match existing error message format', () => {
      // 既存のgenerators/alb.generator.tsと同じメッセージ形式
      const error = ALBErrors.metricsNotFound();
      expect(error.message).toBe('ALB metrics configuration not found');
    });
  });

  describe('invalidTargetType', () => {
    it('should create invalid target type error', () => {
      const error = ALBErrors.invalidTargetType('lambda');

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid ALB target type: lambda');
      expect(error.details?.targetType).toBe('lambda');
      expect(error.details?.resourceType).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });
  });

  describe('Error properties', () => {
    it('should all errors have CloudSupporterError properties', () => {
      const errors = [
        ALBErrors.metricsNotFound(),
        ALBErrors.invalidTargetType('invalid')
      ];

      errors.forEach(error => {
        expect(error.name).toBe('CloudSupporterError');
        expect(error.timestamp).toBeDefined();
        expect(error.stack).toBeDefined();
        expect(error.details?.resourceType).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      });
    });
  });

  describe('onlyApplicationLoadBalancerSupported', () => {
    it('should create unsupported load balancer type error', () => {
      const error = ALBErrors.onlyApplicationLoadBalancerSupported('network');

      expect(error).toBeInstanceOf(CloudSupporterError);
      expect(error.code).toBe(ERROR_CODES.RESOURCE_UNSUPPORTED_TYPE);
      expect(error.type).toBe(ErrorType.RESOURCE_ERROR);
      expect(error.message).toBe('Only Application Load Balancers are supported');
      expect(error.details?.loadBalancerType).toBe('network');
      expect(error.details?.supportedType).toBe('application');
      expect(error.details?.resourceType).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    it('should handle different load balancer types', () => {
      const testCases = ['network', 'gateway', 'classic'];

      testCases.forEach(type => {
        const error = ALBErrors.onlyApplicationLoadBalancerSupported(type);
        expect(error.details?.loadBalancerType).toBe(type);
        expect(error.details?.supportedType).toBe('application');
      });
    });
  });

  describe('Integration with existing system', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw ALBErrors.metricsNotFound();
      }).toThrow(CloudSupporterError);

      expect(() => {
        throw ALBErrors.metricsNotFound();
      }).toThrow('ALB metrics configuration not found');
    });

    it('should serialize to JSON correctly', () => {
      const error = ALBErrors.invalidTargetType('lambda');
      const json = error.toJSON();

      expect(json).toHaveProperty('code', ERROR_CODES.VALIDATION_FAILED);
      expect(json).toHaveProperty('type', ErrorType.VALIDATION_ERROR);
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('details');
      expect(json).toHaveProperty('timestamp');
    });
  });

  describe('Error properties for all ALB errors', () => {
    it('should all errors have CloudSupporterError properties including onlyApplicationLoadBalancerSupported', () => {
      const errors = [
        ALBErrors.metricsNotFound(),
        ALBErrors.invalidTargetType('invalid'),
        ALBErrors.onlyApplicationLoadBalancerSupported('network')
      ];

      errors.forEach(error => {
        expect(error.name).toBe('CloudSupporterError');
        expect(error.timestamp).toBeDefined();
        expect(error.stack).toBeDefined();
        expect(error.details?.resourceType).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      });
    });
  });
});