# BMAD Brainstorm

Bot Teams qui facilite les sessions de brainstorming en suivant la méthodologie BMAD en 8 étapes. Propulsé par Claude (via Azure AI Foundry), il guide les participants, applique des techniques structurées (5 Pourquoi, SWOT, Six Chapeaux, etc.) et génère un PowerPoint de synthèse.

## Prérequis

- Node.js 20+
- Un abonnement Azure
- Un enregistrement de bot Azure AD ([doc](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration))
- Azure CLI (`az`) installé

## Variables d'environnement

Copiez `.env.sample` en `.env` et renseignez les valeurs :

```bash
cp .env.sample .env
```

Voir `.env.sample` pour la liste complète des variables requises.

## Démarrage local

```bash
npm install
npm run dev
```

Le bot écoute sur `http://localhost:3978/api/messages`.

Pour exposer le bot en local vers Teams, utilisez [Dev Tunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/) :

```bash
devtunnel host -p 3978 --allow-anonymous
```

Mettez à jour le endpoint du bot dans Azure Portal avec l'URL du tunnel (ex: `https://<tunnel-id>.devtunnels.ms/api/messages`).

## Déploiement Azure

Déployez l'infrastructure avec le template Bicep :

```bash
az deployment group create \
  --resource-group <RESOURCE_GROUP> \
  --template-file infra/azure.bicep \
  --parameters \
    microsoftAppId=<APP_ID> \
    microsoftAppPassword=<APP_PASSWORD> \
    microsoftAppTenantId=<TENANT_ID>
```

Puis déployez le code sur la Web App :

```bash
npm run build
az webapp deploy --resource-group <RESOURCE_GROUP> --name <WEB_APP_NAME> --src-path dist/
```

## Ajout du bot à une réunion Teams

1. Packagez l'app : `./scripts/package-app.sh`
2. Uploadez `build/appPackage.zip` dans **Teams Admin Center > Manage apps > Upload**
3. Dans une réunion Teams, cliquez **+** > recherchez **BMAD Brainstorm** > ajoutez le bot
4. Mentionnez `@BMAD Brainstorm start` pour démarrer une session

## Commandes

| Commande | Description |
|----------|-------------|
| `start`  | Démarre une nouvelle session de brainstorming |
| `resume` | Reprend une session existante |
| `status` | Affiche la progression (étape X/8) |
| `export` | Génère le PowerPoint de synthèse |
| `help`   | Aide et commandes disponibles |
