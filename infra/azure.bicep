@description('Nom de base pour les ressources')
param baseName string = 'bmad-brainstorm'

@description('Localisation des ressources')
param location string = resourceGroup().location

@description('Microsoft App ID du bot (enregistrement Azure AD)')
param microsoftAppId string

@description('Microsoft App Password du bot')
@secure()
param microsoftAppPassword string

@description('Tenant ID Azure AD')
param microsoftAppTenantId string

@description('Azure AI Foundry Resource URL (Claude)')
param azureAiFoundryResource string = ''

@description('Azure AI Foundry API Key (Claude)')
@secure()
param azureAiFoundryApiKey string = ''

@description('Claude Model ID')
param claudeModel string = 'claude-sonnet-4-5'

// ---------- Variables ----------

var uniqueSuffix = uniqueString(resourceGroup().id, baseName)
var botServiceName = '${baseName}-bot-${uniqueSuffix}'
var appServicePlanName = '${baseName}-plan-${uniqueSuffix}'
var webAppName = '${baseName}-app-${uniqueSuffix}'
var cosmosAccountName = '${baseName}-cosmos-${uniqueSuffix}'
var storageAccountName = replace('${baseName}st${uniqueSuffix}', '-', '')
var keyVaultName = '${baseName}-kv-${uniqueSuffix}'

// ---------- Azure Bot Service (F0) ----------

resource botService 'Microsoft.BotService/botServices@2022-09-15' = {
  name: botServiceName
  location: 'global'
  kind: 'azurebot'
  sku: {
    name: 'F0'
  }
  properties: {
    displayName: 'BMAD Brainstorm'
    endpoint: 'https://${webApp.properties.defaultHostName}/api/messages'
    msaAppId: microsoftAppId
    msaAppTenantId: microsoftAppTenantId
    msaAppType: 'SingleTenant'
  }
}

resource botTeamsChannel 'Microsoft.BotService/botServices/channels@2022-09-15' = {
  parent: botService
  name: 'MsTeamsChannel'
  location: 'global'
  properties: {
    channelName: 'MsTeamsChannel'
    properties: {
      isEnabled: true
    }
  }
}

// ---------- Key Vault ----------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: length(keyVaultName) > 24 ? substring(keyVaultName, 0, 24) : keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

resource secretBotPassword 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'MicrosoftAppPassword'
  properties: { value: microsoftAppPassword }
}

resource secretCosmosKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'CosmosKey'
  properties: { value: cosmosAccount.listKeys().primaryMasterKey }
}

resource secretBlobConnection 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'BlobConnectionString'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
  }
}

resource secretAiFoundryKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AzureAiFoundryApiKey'
  properties: { value: azureAiFoundryApiKey }
}

// ---------- App Service Plan (B1) ----------

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// ---------- Web App (Node.js 20) ----------

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appSettings: [
        { name: 'MICROSOFT_APP_ID', value: microsoftAppId }
        { name: 'MICROSOFT_APP_PASSWORD', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=MicrosoftAppPassword)' }
        { name: 'MICROSOFT_APP_TENANT_ID', value: microsoftAppTenantId }
        { name: 'COSMOS_ENDPOINT', value: cosmosAccount.properties.documentEndpoint }
        { name: 'COSMOS_KEY', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=CosmosKey)' }
        { name: 'COSMOS_DATABASE', value: 'brainstorm-bot' }
        { name: 'COSMOS_CONTAINER', value: 'sessions' }
        { name: 'BLOB_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=BlobConnectionString)' }
        { name: 'BLOB_CONTAINER', value: 'pptx-exports' }
        { name: 'AZURE_AI_FOUNDRY_RESOURCE', value: azureAiFoundryResource }
        { name: 'AZURE_AI_FOUNDRY_API_KEY', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=AzureAiFoundryApiKey)' }
        { name: 'CLAUDE_MODEL', value: claudeModel }
        { name: 'PORT', value: '8080' }
        { name: 'NODE_ENV', value: 'production' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
      ]
      alwaysOn: true
    }
    httpsOnly: true
  }
}

// Grant Web App access to Key Vault secrets
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    principalId: webApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalType: 'ServicePrincipal'
  }
}

// ---------- Cosmos DB (Serverless) ----------

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: [
      { name: 'EnableServerless' }
    ]
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15-preview' = {
  parent: cosmosAccount
  name: 'brainstorm-bot'
  properties: {
    resource: {
      id: 'brainstorm-bot'
    }
  }
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDatabase
  name: 'sessions'
  properties: {
    resource: {
      id: 'sessions'
      partitionKey: {
        paths: ['/tenantId']
        kind: 'Hash'
      }
    }
  }
}

// ---------- Storage Account ----------

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: length(storageAccountName) > 24 ? substring(storageAccountName, 0, 24) : storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'pptx-exports'
  properties: {
    publicAccess: 'None'
  }
}

// ---------- Outputs ----------

output botServiceName string = botService.name
output webAppName string = webApp.name
output webAppHostName string = webApp.properties.defaultHostName
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output storageAccountName string = storageAccount.name
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
