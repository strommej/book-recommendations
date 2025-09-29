# Book Recommendation Platform

Welcome to the Book Recommendations Platform!
This project fetches books from [Project Gutenberg](https://www.gutenberg.org/), vectorizes their content, indexes them into OpenSearch, and provides recommendations by querying for semantically similar books using cosine similarity search. Recommendations are made available via a serverless GraphQL API deployed using AWS CDK. 

## Overview
- **API**: GraphQL API for book recommendations, secured with Cognito and backed by DynamoDB and OpenSearch.
- **Infrastructure**: AWS CDK infrastructure as code for deploying all cloud resources (Cognito, DynamoDB, OpenSearch, Lambda, API Gateway).
- **GutenbergToOpensearch**: Local ETL pipeline for extracting, transforming, and vectorizing Gutenberg book data and indexing it to OpenSearch. Future enhancement: migrate this workflow to AWS Lambda and Step Functions for scalable, serverless processing.

## Repository Structure
- [`api/`](./api/README.md): GraphQL API source code
- [`infrastructure/`](./infrastructure/aws/README.md): AWS CDK infrastructure as code
- [`gutenbergToOpensearch/`](./gutenbergToOpensearch/README.md): Data ingestion and vectorization pipeline

## Getting Started
See the individual module READMEs for setup and usage instructions:
- [API](./api/README.md)
- [Infrastructure](./infrastructure/README.md)
- [Gutenberg To Opensearch](./gutenbergToOpensearch/README.md)