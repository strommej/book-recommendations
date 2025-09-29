# Gutenberg To Opensearch

This directory contains the local ETL pipeline used to fetch, vectorize, and index book data. 

## Features
- Download and parse books from [Project Gutenberg](https://www.gutenberg.org/)
- Vectorize book content for semantic search
- Index data into OpenSearch

## Usage
1. For local development, copy `.sample-env` to `.env` and update the values as needed.
If you deployed the stack from [`infrastructure/`](../infrastructure/aws/README.md) you'll be able to find the opensearch details in AWS Secrets Manager under `booksOpensearch-dev`.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the pipeline:
   ```sh
   npm run start -- <number-of-books>
   # Example: process 500 books
   npm run start -- 500
   # If omitted, defaults to 100
   ```
4. Configure OpenSearch endpoint and credentials via environment variables or Secrets Manager

See the main [README](../README.md) for project context.
