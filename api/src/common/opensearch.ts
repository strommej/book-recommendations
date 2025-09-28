import { Client } from '@opensearch-project/opensearch';
export const client = new Client({ node: 'http://localhost:9200' });