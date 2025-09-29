# API

This directory contains the GraphQL API for book recommendations.

## Usage
### 1. Environment Variables
For local development, copy `.sample-env` to `.env` and update the values as needed.
If you deployed the stack from [`infrastructure/`](../infrastructure/aws/README.md) you'll be able to find the opensearch details in AWS Secrets Manager under `booksOpensearch-dev`.

### 2. Run Local
Install dependencies and start the development server:
```sh
npm install
npm run dev
```

### 3. Run Tests (Vitest)
Execute unit and integration tests:
```sh
npm run test
```



### 4. Query with Bruno (similar to Postman)
Use the Bruno collections in `bruno-collection/` to test and explore the API endpoints:

- [Get Bruno](https://www.usebruno.com/downloads) if you don't have it 
- Open Bruno and use "Open Collection" to bring in the `bruno-collection` folder
- Set Bruno environment values for local and/or dev
- Run queries and mutations to validate API functionality


### 5. Get an idToken for Bruno (AWS Cognito)

To authenticate requests to the deployed service using Bruno, you'll need an AWS Cognito idToken. Run the following command to obtain it:

```sh
aws cognito-idp initiate-auth \
	--auth-flow USER_PASSWORD_AUTH \
	--client-id <yourclientid> \
	--auth-parameters USERNAME=<yourusername>,PASSWORD=<yourpassword>
```
Replace `<yourclientid>`, `<yourusername>`, and `<yourpassword>` with your actual Cognito app client ID and credentials.
Your Cognito client id will output from the CDK deploy and you can use the AWS console to create a username and password for yourself. 

The response will include an `IdToken` in the `AuthenticationResult`. Use the `IdToken` as the `idToken` in your Bruno dev environment.

## Notes
See the main [README](../README.md) for project context and links to infrastructure and ETL modules.
