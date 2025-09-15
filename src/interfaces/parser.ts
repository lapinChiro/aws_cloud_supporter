// CLAUDE.md準拠: Interface Segregation Principle
// CloudFormation template parser interface

import type { CloudFormationTemplate } from '../types/cloudformation';

/**
 * CloudFormation template parser interface
 * SOLID原則: Interface Segregation
 */
export interface ITemplateParser {
  /**
   * Parse CloudFormation template file
   * @param templatePath Path to template file
   * @returns Parsed CloudFormation template
   * @throws CloudSupporterError on parse failure
   */
  parse(templatePath: string): Promise<CloudFormationTemplate>;
}