# Infrastructure
This directory contains AWS CDK scripts for deploying the Product Recommendations Platform resources.

## Resources Deployed
- Lambda Function (API)
- API Gateway (with Cognito authorizer)
- OpenSearch Domain
- Cognito User Pool & App Client
- DynamoDB Table

## Usage
1. Install dependencies:
   ```sh
   npm install
   ```
2. Deploy dev:
   ```sh
   npm run buildApi
   npm run bootstrap:dev
   npm run deploy:dev
   ```
3. View outputs in the AWS Console or via CloudFormation stack outputs.

## Notes
- See the main [README](../README.md) for project context.
