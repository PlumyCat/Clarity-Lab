export const config = {
  // Bot Framework
  microsoftAppId: process.env.MICROSOFT_APP_ID || '',
  microsoftAppPassword: process.env.MICROSOFT_APP_PASSWORD || '',
  microsoftAppTenantId: process.env.MICROSOFT_APP_TENANT_ID || '',

  // Azure AI Foundry (Claude)
  azureAiFoundryResource: process.env.AZURE_AI_FOUNDRY_RESOURCE || '',
  azureAiFoundryApiKey: process.env.AZURE_AI_FOUNDRY_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',

  // Cosmos DB
  cosmosEndpoint: process.env.COSMOS_ENDPOINT || '',
  cosmosKey: process.env.COSMOS_KEY || '',
  cosmosDatabase: process.env.COSMOS_DATABASE || 'brainstorm-bot',
  cosmosContainer: process.env.COSMOS_CONTAINER || 'sessions',

  // Blob Storage
  blobConnectionString: process.env.BLOB_CONNECTION_STRING || '',
  blobContainer: process.env.BLOB_CONTAINER || 'pptx-exports',

  // Server
  port: parseInt(process.env.PORT || '3978', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};
