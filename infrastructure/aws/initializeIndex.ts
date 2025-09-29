import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Client } from '@opensearch-project/opensearch';
const client = new SecretsManagerClient({});

const secretName = process.argv[2] || 'booksOpensearch-dev';

async function getOpenSearchCredentials(secretName: string) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  if (!response.SecretString) throw new Error('No secret string found');
  return JSON.parse(response.SecretString);
}

async function ensureBooksIndex() {
  console.log('Creating opensearch index and alias if they do not exist...');
  const { endpoint, username, password } = await getOpenSearchCredentials(secretName);
  const osClient = new Client({
    node: endpoint,
    auth: { username, password },
    ssl: { rejectUnauthorized: false },
  });
  const indexName = 'books-v1.0';
  const aliasName = 'books';
  const exists = await osClient.indices.exists({ index: aliasName });
  if (!exists.body) {
    await osClient.indices.create({
      index: indexName,
      body: {
        settings: { index: { knn: true } },
        mappings: {
          properties: {
            summaryEmbedding: {
              type: 'knn_vector',
              dimension: 384,
              method: { name: 'hnsw', space_type: 'cosinesimil' },
            },
          },
        },
      },
    });
    await osClient.indices.putAlias({ index: indexName, name: aliasName });
    console.log('Index and alias created');
  } else {
    console.log('Index already exists');
  }
}

ensureBooksIndex().catch(err => {
  console.error('Error initializing OpenSearch index:', err);
  process.exit(1);
});
