import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { Domain, EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { RestApi, LambdaIntegration, CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export interface ProductRecommendationsStackProps extends cdk.StackProps {
  stage: "dev" | "prod";
  opensearchUsername: string;
  opensearchPassword: string;
}

export class ProductRecommendationsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ProductRecommendationsStackProps) {
    super(scope, id, props);
    const isProd = props.stage === "prod";

    const userPool = new UserPool(this, `UserPool-${props.stage}`, {
      selfSignUpEnabled: true,
      signInAliases: { email: true }
    });

    const userPoolClient = userPool.addClient(`UserPoolClient-${props.stage}`, {
      authFlows: {
        userPassword: true,
        adminUserPassword: true
      },
      generateSecret: false
    });

    const authorizer = new CognitoUserPoolsAuthorizer(this, `CognitoAuthorizer-${props.stage}`, {
      cognitoUserPools: [userPool]
    });

    const likesTable = new Table(this, `LikesTable-${props.stage}`, {
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "bookId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    });

    likesTable.addGlobalSecondaryIndex({
      indexName: "UserLikesByCreatedDate",
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "createdDate", type: AttributeType.STRING },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL
    });

    const opensearchPassword = new Secret(this, `OpenSearchMasterPassword-${props.stage}`, {
      secretName: `booksOpensearchMasterPassword-${props.stage}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "admin" }),
        generateStringKey: "password",
        excludePunctuation: false,
        requireEachIncludedType: true,
        passwordLength: 32
      }
    });

    const opensearchDomain = new Domain(this, `OpenSearchDomain-${props.stage}`, {
      version: EngineVersion.OPENSEARCH_2_19,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      capacity: {
        dataNodeInstanceType: isProd ? "m6g.large.search" : "t3.small.search",
        dataNodes: isProd ? 3 : 1
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: { enabled: true },
      enforceHttps: true,
      fineGrainedAccessControl: {
        masterUserName: opensearchPassword.secretValueFromJson("username").toString(),
        masterUserPassword: opensearchPassword.secretValueFromJson("password")
      }
    });

    const opensearchConnectionSecret = new Secret(
      this,
      `OpenSearchConnectionSecret-${props.stage}`,
      {
        secretName: `booksOpensearch-${props.stage}`,
        secretObjectValue: {
          endpoint: cdk.SecretValue.unsafePlainText(`https://${opensearchDomain.domainEndpoint}`),
          username: opensearchPassword.secretValueFromJson("username"),
          password: opensearchPassword.secretValueFromJson("password")
        }
      }
    );

    const apiLambda = new Function(this, `ApiLambda-${props.stage}`, {
      runtime: Runtime.NODEJS_20_X,
      handler: "server/lambda.graphqlHandler",
      code: Code.fromAsset("../../api/dist"), // Adjust path as needed
      environment: {
        USER_LIKES_TABLE: likesTable.tableName,
        OPENSEARCH_ENDPOINT: `https://${opensearchDomain.domainEndpoint}`,
        // TODO: Opensearch access should be handled with IAM roles
        // TODO: These should be fetched from Secrets Manager at runtime
        OPENSEARCH_USERNAME: "admin",
        OPENSEARCH_PASSWORD: opensearchDomain.masterUserPassword?.toString() || "",
        USER_POOL_ID: userPool.userPoolId,
        STAGE: props.stage
      }
    });
    likesTable.grantReadWriteData(apiLambda);
    opensearchDomain.grantReadWrite(apiLambda);

    const api = new RestApi(this, `ApiGateway-${props.stage}`, {
      restApiName: `ProductRecommendationsApi-${props.stage}`,
      description: `API for book recommendations (${props.stage})`
    });

    api.root.addMethod("POST", new LambdaIntegration(apiLambda), {
      authorizer,
      authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO
    });

    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.url,
      description: "API Gateway endpoint URL"
    });

    new cdk.CfnOutput(this, "CognitoAppClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito App Client ID"
    });

    new cdk.CfnOutput(this, "LikesTableName", {
      value: likesTable.tableName,
      description: "DynamoDB Likes Table Name"
    });
  }
}

const app = new cdk.App();
const stage = app.node.tryGetContext("stage") || "dev";
const opensearchUsername = app.node.tryGetContext("opensearchUsername");
const opensearchPassword = app.node.tryGetContext("opensearchPassword");
new ProductRecommendationsStack(app, `ProductRecommendationsStack-${stage}`, {
  stage,
  opensearchUsername,
  opensearchPassword
});
