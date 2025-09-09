// CLAUDE.md準拠: Interface Segregation Principle
// Metrics generator interface

import { CloudFormationResource } from '../types/cloudformation';
import { MetricDefinition } from '../types/metrics';

/**
 * Metrics generator interface
 * SOLID原則: Interface Segregation
 */
export interface IMetricsGenerator {
  /**
   * Get supported resource types
   * @returns Array of supported AWS resource type strings
   */
  getSupportedTypes(): string[];
  
  /**
   * Generate metrics for a resource
   * @param resource CloudFormation resource
   * @returns Array of metric definitions
   * @throws CloudSupporterError on generation failure
   */
  generate(resource: CloudFormationResource): Promise<MetricDefinition[]>;
}