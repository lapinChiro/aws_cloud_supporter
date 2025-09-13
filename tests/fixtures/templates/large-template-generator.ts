import * as fs from 'fs';
import * as path from 'path';

import * as yaml from 'yaml';

import type { CloudFormationTemplate } from '../../../src/types/cloudformation';

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
  const distribution = {
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

  // Generate RDS instances
  for (let i = 1; i <= distribution.rds && resourceIndex < resourceCount; i++, resourceIndex++) {
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

  // Generate Lambda functions
  for (let i = 1; i <= distribution.lambda && resourceIndex < resourceCount; i++, resourceIndex++) {
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

  // Generate DynamoDB tables
  for (let i = 1; i <= distribution.dynamodb && resourceIndex < resourceCount; i++, resourceIndex++) {
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

  // Generate ECS services
  for (let i = 1; i <= distribution.ecs && resourceIndex < resourceCount; i++, resourceIndex++) {
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

  // Generate ALBs
  for (let i = 1; i <= distribution.alb && resourceIndex < resourceCount; i++, resourceIndex++) {
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

  // Generate API Gateways
  for (let i = 1; i <= distribution.apigateway && resourceIndex < resourceCount; i++, resourceIndex++) {
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
  for (let i = 1; i <= distribution.s3 && resourceIndex < resourceCount; i++, resourceIndex++) {
    template.Resources[`S3Bucket${i}`] = {
      Type: "AWS::S3::Bucket",
      Properties: {
        BucketName: { "Fn::Sub": `\${AWS::StackName}-bucket-${i}-\${AWS::AccountId}` }
      }
    };
  }

  // Generate EC2 instances (unsupported)
  for (let i = 1; i <= distribution.ec2 && resourceIndex < resourceCount; i++, resourceIndex++) {
    template.Resources[`EC2Instance${i}`] = {
      Type: "AWS::EC2::Instance",
      Properties: {
        InstanceType: "t3.micro",
        ImageId: "ami-0123456789abcdef0"
      }
    };
  }

  // Add basic network resources
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

  // Save the template
  const outputPath = path.join(__dirname, 'large-template-500-resources.yaml');
  fs.writeFileSync(outputPath, yaml.stringify(template));
  
  console.log(`Generated large template with ${Object.keys(template.Resources).length} resources`);
}

// Generate if run directly
if (require.main === module) {
  generateLargeTemplate(500);
}