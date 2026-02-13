import express from 'express';
import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  ConfigurationBotFrameworkAuthenticationOptions,
} from 'botbuilder';
import { config } from './config';
import { BrainstormBot } from './bot/brainstormBot';
import { sessionStore } from './storage/sessionStore';
import { claudeClient } from './llm/claudeClient';

const authConfig: ConfigurationBotFrameworkAuthenticationOptions = {
  MicrosoftAppId: config.microsoftAppId,
  MicrosoftAppPassword: config.microsoftAppPassword,
  MicrosoftAppTenantId: config.microsoftAppTenantId,
  MicrosoftAppType: 'SingleTenant',
};

const botFrameworkAuth = new ConfigurationBotFrameworkAuthentication(authConfig);
const adapter = new CloudAdapter(botFrameworkAuth);

adapter.onTurnError = async (context, error) => {
  console.error('[onTurnError]', error);
  await context.sendActivity(
    "Désolé, une erreur s'est produite. Veuillez réessayer ou taper **help**.",
  );
};

const bot = new BrainstormBot(sessionStore, claudeClient);

const app = express();
app.use(express.json());

app.post('/api/messages', async (req, res) => {
  console.log(`[REQ] POST /api/messages type=${req.body?.type} text="${req.body?.text}" from=${req.body?.from?.name}`);
  try {
    await adapter.process(req, res, (context) => bot.run(context));
    console.log(`[REQ] Processed OK`);
  } catch (err) {
    console.error(`[REQ] Error processing:`, err);
    if (!res.headersSent) res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  await sessionStore.initialize();
  app.listen(config.port, () => {
    console.log(`BrainstormBot running on port ${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/api/health`);
    console.log(`Messages endpoint: http://localhost:${config.port}/api/messages`);
  });
}

start().catch((err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});
