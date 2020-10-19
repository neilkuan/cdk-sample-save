import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { CdkStack } from '../lib/rds-sec-stack';

test('Empty Stack', () => {
    const env = {
      region: 'us-east-1',
      account: '123456789012',
    };
    const app = new cdk.App({
      context: {
        IP: '1.2.3.4/32'
      }
    });
    // WHEN
    const stack = new cdk.Stack(app, 'RdsSecStack', { env: env });
    new CdkStack(stack, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {
        "MyTestStackdbpg4A7610A8": {
          "Type": "AWS::RDS::DBClusterParameterGroup",
          "Properties": {
            "Description": "Cluster parameter group for aurora-mysql5.7",
            "Family": "aurora-mysql5.7",
            "Parameters": {
              "time_zone": "UTC"
            }
          }
        },
        "MyTestStackRDSClusterSubnetsAAA0D619": {
          "Type": "AWS::RDS::DBSubnetGroup",
          "Properties": {
            "DBSubnetGroupDescription": "Subnets for RDSCluster database",
            "SubnetIds": [
              "s-12345",
              "s-67890"
            ]
          }
        },
        "MyTestStackRDSClusterSecurityGroup8D63FC45": {
          "Type": "AWS::EC2::SecurityGroup",
          "Properties": {
            "GroupDescription": "RDS security group",
            "SecurityGroupEgress": [
              {
                "CidrIp": "0.0.0.0/0",
                "Description": "Allow all outbound traffic by default",
                "IpProtocol": "-1"
              }
            ],
            "VpcId": "vpc-12345"
          }
        },
        "MyTestStackRDSClusterSecurityGroupfrom123432IndirectPortAA0CC336": {
          "Type": "AWS::EC2::SecurityGroupIngress",
          "Properties": {
            "IpProtocol": "tcp",
            "CidrIp": "1.2.3.4/32",
            "Description": "from 1.2.3.4/32:{IndirectPort}",
            "FromPort": {
              "Fn::GetAtt": [
                "MyTestStackRDSCluster68676C97",
                "Endpoint.Port"
              ]
            },
            "GroupId": {
              "Fn::GetAtt": [
                "MyTestStackRDSClusterSecurityGroup8D63FC45",
                "GroupId"
              ]
            },
            "ToPort": {
              "Fn::GetAtt": [
                "MyTestStackRDSCluster68676C97",
                "Endpoint.Port"
              ]
            }
          }
        },
        "MyTestStackRDSClusterSecretD26AD1C8": {
          "Type": "AWS::SecretsManager::Secret",
          "Properties": {
            "Description": {
              "Fn::Join": [
                "",
                [
                  "Generated by the CDK for stack: ",
                  {
                    "Ref": "AWS::StackName"
                  }
                ]
              ]
            },
            "GenerateSecretString": {
              "ExcludeCharacters": " %+~`#$&*()|[]{}:;<>?!'/@\"\\",
              "GenerateStringKey": "password",
              "PasswordLength": 30,
              "SecretStringTemplate": "{\"username\":\"admin\"}"
            }
          }
        },
        "MyTestStackRDSClusterSecretAttachment97B267C8": {
          "Type": "AWS::SecretsManager::SecretTargetAttachment",
          "Properties": {
            "SecretId": {
              "Ref": "MyTestStackRDSClusterSecretD26AD1C8"
            },
            "TargetId": {
              "Ref": "MyTestStackRDSCluster68676C97"
            },
            "TargetType": "AWS::RDS::DBCluster"
          }
        },
        "MyTestStackRDSCluster68676C97": {
          "Type": "AWS::RDS::DBCluster",
          "Properties": {
            "Engine": "aurora-mysql",
            "DatabaseName": "timezonetest",
            "DBClusterParameterGroupName": {
              "Ref": "MyTestStackdbpg4A7610A8"
            },
            "DBSubnetGroupName": {
              "Ref": "MyTestStackRDSClusterSubnetsAAA0D619"
            },
            "EngineVersion": "5.7.mysql_aurora.2.07.1",
            "MasterUsername": {
              "Fn::Join": [
                "",
                [
                  "{{resolve:secretsmanager:",
                  {
                    "Ref": "MyTestStackRDSClusterSecretD26AD1C8"
                  },
                  ":SecretString:username::}}"
                ]
              ]
            },
            "MasterUserPassword": {
              "Fn::Join": [
                "",
                [
                  "{{resolve:secretsmanager:",
                  {
                    "Ref": "MyTestStackRDSClusterSecretD26AD1C8"
                  },
                  ":SecretString:password::}}"
                ]
              ]
            },
            "VpcSecurityGroupIds": [
              {
                "Fn::GetAtt": [
                  "MyTestStackRDSClusterSecurityGroup8D63FC45",
                  "GroupId"
                ]
              }
            ]
          },
          "UpdateReplacePolicy": "Delete",
          "DeletionPolicy": "Delete"
        },
        "MyTestStackRDSClusterInstance15A58D22C": {
          "Type": "AWS::RDS::DBInstance",
          "Properties": {
            "DBInstanceClass": "db.t3.small",
            "DBClusterIdentifier": {
              "Ref": "MyTestStackRDSCluster68676C97"
            },
            "DBSubnetGroupName": {
              "Ref": "MyTestStackRDSClusterSubnetsAAA0D619"
            },
            "Engine": "aurora-mysql",
            "EngineVersion": "5.7.mysql_aurora.2.07.1",
            "PubliclyAccessible": true
          },
          "UpdateReplacePolicy": "Delete",
          "DeletionPolicy": "Delete"
        },
        "MyTestStacklambdaexerdsServiceRoleBD0F530B": {
          "Type": "AWS::IAM::Role",
          "Properties": {
            "AssumeRolePolicyDocument": {
              "Statement": [
                {
                  "Action": "sts:AssumeRole",
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "lambda.amazonaws.com"
                  }
                }
              ],
              "Version": "2012-10-17"
            },
            "ManagedPolicyArns": [
              {
                "Fn::Join": [
                  "",
                  [
                    "arn:",
                    {
                      "Ref": "AWS::Partition"
                    },
                    ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                  ]
                ]
              }
            ]
          }
        },
        "MyTestStacklambdaexerdsServiceRoleDefaultPolicy35F3BE2C": {
          "Type": "AWS::IAM::Policy",
          "Properties": {
            "PolicyDocument": {
              "Statement": [
                {
                  "Action": "secretsmanager:*",
                  "Effect": "Allow",
                  "Resource": "*"
                }
              ],
              "Version": "2012-10-17"
            },
            "PolicyName": "MyTestStacklambdaexerdsServiceRoleDefaultPolicy35F3BE2C",
            "Roles": [
              {
                "Ref": "MyTestStacklambdaexerdsServiceRoleBD0F530B"
              }
            ]
          }
        },
        "MyTestStacklambdaexerdsEBF57E9E": {
          "Type": "AWS::Lambda::Function",
          "Properties": {
            "Code": {
              "S3Bucket": {
                "Ref": "AssetParameters6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297S3BucketEB6DBE44"
              },
              "S3Key": {
                "Fn::Join": [
                  "",
                  [
                    {
                      "Fn::Select": [
                        0,
                        {
                          "Fn::Split": [
                            "||",
                            {
                              "Ref": "AssetParameters6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297S3VersionKeyA2CEEA18"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "Fn::Select": [
                        1,
                        {
                          "Fn::Split": [
                            "||",
                            {
                              "Ref": "AssetParameters6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297S3VersionKeyA2CEEA18"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                ]
              }
            },
            "Handler": "index.lambda_handler",
            "Role": {
              "Fn::GetAtt": [
                "MyTestStacklambdaexerdsServiceRoleBD0F530B",
                "Arn"
              ]
            },
            "Runtime": "python3.8",
            "Environment": {
              "Variables": {
                "passwdarn": {
                  "Fn::Join": [
                    "",
                    [
                      "{{resolve:secretsmanager:",
                      {
                        "Ref": "MyTestStackRDSClusterSecretAttachment97B267C8"
                      },
                      ":SecretString:::}}"
                    ]
                  ]
                }
              }
            }
          },
          "DependsOn": [
            "MyTestStacklambdaexerdsServiceRoleDefaultPolicy35F3BE2C",
            "MyTestStacklambdaexerdsServiceRoleBD0F530B"
          ]
        }
      },
      "Outputs": {
        "MyTestStacksssE524E585": {
          "Value": {
            "Fn::Join": [
              "",
              [
                "{{resolve:secretsmanager:",
                {
                  "Ref": "MyTestStackRDSClusterSecretAttachment97B267C8"
                },
                ":SecretString:::}}"
              ]
            ]
          }
        }
      },
      "Parameters": {
        "AssetParameters6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297S3BucketEB6DBE44": {
          "Type": "String",
          "Description": "S3 bucket for asset \"6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297\""
        },
        "AssetParameters6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297S3VersionKeyA2CEEA18": {
          "Type": "String",
          "Description": "S3 key for asset version \"6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297\""
        },
        "AssetParameters6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297ArtifactHash8D443040": {
          "Type": "String",
          "Description": "Artifact hash for asset \"6118918685ea462df1eea8c4c5f83d730329264ac3f1211783890e223efb7297\""
        }
      }
    }, MatchStyle.EXACT))
});
