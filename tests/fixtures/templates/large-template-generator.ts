import * as fs from 'fs';
import * as path from 'path';

import * as yaml from 'yaml';

import type { CloudFormationTemplate, CloudFormationResource } from '../../../src/types/cloudformation';

interface ResourceDistribution {
  rds: number;
  lambda: number;
  dynamodb: number;
  ecs: number;
  alb: number;
  apigateway: number;
  s3: number;
  ec2: number;
  other: number;
}

/**
 * Generate RDS instances for the template
 */
function generateRDSInstances(
  template: CloudFormationTemplate, 
  count: number, 
  startIndex: number
): number {
  let resourceIndex = startIndex;
  
  for (let i = 1; i <= count && resourceIndex < 500; i++, resourceIndex++) {
    template.Resources[`RDSInstance${i}`] = {
      Type: "AWS::RDS::DBInstance",
      Properties: {
        DBInstanceIdentifier: { "Fn::Sub": `\${AWS::StackName}-db-${i}` },
        DBInstanceClass: "db.t3.micro",
        Engine: i % 2 === 0 ? "mysql" : "postgresql",
        AllocatedStorage: 20,
        MasterUsername: "admin",
        MasterUserPassword: { "Fn::Sub": `password-\${AWS::StackId}-${i}` }
      }
    };
  }
  
  return resourceIndex;
}

/**
 * Generate Lambda functions for the template
 */
function generateLambdaFunctions(
  template: CloudFormationTemplate, 
  count: number, 
  startIndex: number
): number {
  let resourceIndex = startIndex;
  
  for (let i = 1; i <= count && resourceIndex < 500; i++, resourceIndex++) {
    template.Resources[`LambdaFunction${i}`] = {
      Type: "AWS::Lambda::Function",
      Properties: {
        FunctionName: { "Fn::Sub": `\${AWS::StackName}-lambda-${i}` },
        Runtime: i % 3 === 0 ? "python3.11" : "nodejs20.x",
        Handler: "index.handler",
        Code: {
          ZipFile: `exports.handler = async (event) => { return { statusCode: 200, body: 'Function ${i}' }; };`
        },
        MemorySize: 256 * (1 + (i % 4)),
        Timeout: 60
      }
    };
  }
  
  return resourceIndex;
}

/**
 * Generate DynamoDB tables for the template
 */
function generateDynamoDBTables(
  template: CloudFormationTemplate, 
  count: number, 
  startIndex: number
): number {
  let resourceIndex = startIndex;
  
  for (let i = 1; i <= count && resourceIndex < 500; i++, resourceIndex++) {
    template.Resources[`DynamoDBTable${i}`] = {
      Type: "AWS::DynamoDB::Table",
      Properties: {
        TableName: { "Fn::Sub": `\${AWS::StackName}-table-${i}` },
        BillingMode: i % 2 === 0 ? "PAY_PER_REQUEST" : "PROVISIONED",
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" }
        ],
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" }
        ]
      }
    };
    
    // Add ProvisionedThroughput for PROVISIONED mode
    if (i % 2 !== 0) {
      const tableResource = template.Resources[`DynamoDBTable${i}`];
      if (tableResource?.Properties) {
        (tableResource.Properties as Record<string, unknown>).ProvisionedThroughput = {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        };
      }
    }
  }
  
  return resourceIndex;
}

/**
 * Generate ECS services for the template
 */
function generateECSServices(
  template: CloudFormationTemplate, 
  count: number, 
  startIndex: number
): number {
  let resourceIndex = startIndex;
  
  for (let i = 1; i <= count && resourceIndex < 500; i++, resourceIndex++) {
    // Task Definition
    template.Resources[`ECSTaskDefinition${i}`] = {
      Type: "AWS::ECS::TaskDefinition",
      Properties: {
        Family: { "Fn::Sub": `\${AWS::StackName}-task-${i}` },
        NetworkMode: "awsvpc",
        RequiresCompatibilities: ["FARGATE"],
        Cpu: "256",
        Memory: "512",
        ContainerDefinitions: [{
          Name: "container",
          Image: "nginx:alpine",
          PortMappings: [{ ContainerPort: 80 }]
        }]
      }
    };

    // Service
    template.Resources[`ECSService${i}`] = {
      Type: "AWS::ECS::Service",
      Properties: {
        ServiceName: { "Fn::Sub": `\${AWS::StackName}-service-${i}` },
        LaunchType: "FARGATE",
        DesiredCount: 1 + (i % 3),
        TaskDefinition: { "Ref": `ECSTaskDefinition${i}` }
      }
    };
  }
  
  return resourceIndex;
}

/**
 * Generate ALBs for the template
 */
function generateALBs(
  template: CloudFormationTemplate, 
  count: number, 
  startIndex: number
): number {
  let resourceIndex = startIndex;
  
  for (let i = 1; i <= count && resourceIndex < 500; i++, resourceIndex++) {
    template.Resources[`ApplicationLoadBalancer${i}`] = {
      Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
      Properties: {
        Name: { "Fn::Sub": `\${AWS::StackName}-alb-${i}` },
        Type: "application",
        Scheme: i % 2 === 0 ? "internet-facing" : "internal",
        Subnets: [{ "Ref": "Subnet1" }, { "Ref": "Subnet2" }]
      }
    };
  }
  
  return resourceIndex;
}

/**
 * Generate API Gateways and unsupported resources
 */
function generateOtherResources(
  template: CloudFormationTemplate,
  distribution: ResourceDistribution,
  startIndex: number
): number {
  let resourceIndex = startIndex;
  
  // Generate API Gateways
  for (let i = 1; i <= distribution.apigateway && resourceIndex < 500; i++, resourceIndex++) {
    template.Resources[`APIGateway${i}`] = {
      Type: "AWS::ApiGateway::RestApi",
      Properties: {
        Name: { "Fn::Sub": `\${AWS::StackName}-api-${i}` },
        EndpointConfiguration: {
          Types: ["REGIONAL"]
        }
      }
    };
  }

  // Generate S3 buckets (unsupported)
  for (let i = 1; i <= distribution.s3 && resourceIndex < 500; i++, resourceIndex++) {
    template.Resources[`S3Bucket${i}`] = {
      Type: "AWS::S3::Bucket",
      Properties: {
        BucketName: { "Fn::Sub": `\${AWS::StackName}-bucket-${i}-\${AWS::AccountId}` }
      }
    };
  }

  // Generate EC2 instances (unsupported)
  for (let i = 1; i <= distribution.ec2 && resourceIndex < 500; i++, resourceIndex++) {
    template.Resources[`EC2Instance${i}`] = {
      Type: "AWS::EC2::Instance",
      Properties: {
        InstanceType: "t3.micro",
        ImageId: "ami-0123456789abcdef0"
      }
    };
  }
  
  return resourceIndex;
}

/**
 * Add network resources to the template
 */
function addNetworkResources(template: CloudFormationTemplate): void {
  template.Resources.VPC = {
    Type: "AWS::EC2::VPC",
    Properties: {
      CidrBlock: "10.0.0.0/16"
    }
  };

  template.Resources.Subnet1 = {
    Type: "AWS::EC2::Subnet",
    Properties: {
      VpcId: { "Ref": "VPC" },
      CidrBlock: "10.0.1.0/24",
      AvailabilityZone: { "Fn::Select": [0, { "Fn::GetAZs": "" }] }
    }
  };

  template.Resources.Subnet2 = {
    Type: "AWS::EC2::Subnet",
    Properties: {
      VpcId: { "Ref": "VPC" },
      CidrBlock: "10.0.2.0/24",
      AvailabilityZone: { "Fn::Select": [1, { "Fn::GetAZs": "" }] }
    }
  };
}

/**
 * Generate a large CloudFormation template for performance testing
 */
function generateLargeTemplate(resourceCount: number = 500): void {
  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: `Large template with ${resourceCount}+ resources for performance testing`,
    Resources: {}
  };

  // Distribution of resources
  const distribution: ResourceDistribution = {
    rds: 50,
    lambda: 100,
    dynamodb: 75,
    ecs: 50,
    alb: 25,
    apigateway: 25,
    s3: 50,        // unsupported
    ec2: 50,       // unsupported
    other: 75      // other unsupported
  };

  let resourceIndex = 0;

  // Generate all resource types
  resourceIndex = generateRDSInstances(template, distribution.rds, resourceIndex);
  resourceIndex = generateLambdaFunctions(template, distribution.lambda, resourceIndex);
  resourceIndex = generateDynamoDBTables(template, distribution.dynamodb, resourceIndex);
  resourceIndex = generateECSServices(template, distribution.ecs, resourceIndex);
  resourceIndex = generateALBs(template, distribution.alb, resourceIndex);
  resourceIndex = generateOtherResources(template, distribution, resourceIndex);
  
  // Add network resources
  addNetworkResources(template);

  // Save the template
  const outputPath = path.join(__dirname, 'large-template-500-resources.yaml');
  fs.writeFileSync(outputPath, yaml.stringify(template));
  
  console.log(`Generated large template with ${Object.keys(template.Resources).length} resources`);
}

// Generate if run directly
if (require.main === module) {
  generateLargeTemplate(500);
}