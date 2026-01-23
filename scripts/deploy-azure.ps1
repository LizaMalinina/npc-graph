# ===========================================
# Deploy NPC Graph to Azure Container Apps (PowerShell)
# ===========================================
# Prerequisites:
# - Azure CLI installed (az)
# - Docker installed
# - Logged in to Azure (az login)

$ErrorActionPreference = "Stop"

# Configuration - UPDATE THESE VALUES
$RESOURCE_GROUP = "npc-graph-rg"
$LOCATION = "eastus"
$ACR_NAME = "npcgraphacr"  # Must be globally unique, lowercase, alphanumeric only
$CONTAINER_APP_NAME = "npc-graph"
$CONTAINER_ENV_NAME = "npc-graph-env"
$IMAGE_NAME = "npc-graph"

Write-Host "🚀 Starting Azure Container Apps deployment..." -ForegroundColor Green

# Step 1: Create Resource Group
Write-Host "📦 Creating resource group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 2: Create Azure Container Registry
Write-Host "🗃️ Creating container registry..." -ForegroundColor Yellow
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Step 3: Get ACR credentials
Write-Host "🔑 Getting registry credentials..." -ForegroundColor Yellow
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer -o tsv
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

# Step 4: Build and push Docker image
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
docker build -f Dockerfile.prod -t "$ACR_LOGIN_SERVER/${IMAGE_NAME}:latest" .

Write-Host "📤 Pushing image to ACR..." -ForegroundColor Yellow
docker login $ACR_LOGIN_SERVER -u $ACR_USERNAME -p $ACR_PASSWORD
docker push "$ACR_LOGIN_SERVER/${IMAGE_NAME}:latest"

# Step 5: Create Container Apps Environment
Write-Host "🌍 Creating Container Apps environment..." -ForegroundColor Yellow
az containerapp env create `
  --name $CONTAINER_ENV_NAME `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION

# Step 6: Create Container App
Write-Host "🚢 Deploying container app..." -ForegroundColor Yellow
az containerapp create `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --environment $CONTAINER_ENV_NAME `
  --image "$ACR_LOGIN_SERVER/${IMAGE_NAME}:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --target-port 3000 `
  --ingress external `
  --min-replicas 0 `
  --max-replicas 3 `
  --cpu 0.5 `
  --memory 1.0Gi

# Step 7: Get the app URL
$APP_URL = az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your app is available at: https://$APP_URL" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Configure environment variables:" -ForegroundColor Yellow
Write-Host @"
az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --set-env-vars `
  DATABASE_URL='your-neon-connection-string' `
  DIRECT_URL='your-neon-direct-string' `
  AZURE_STORAGE_CONNECTION_STRING='your-azure-storage-connection-string' `
  AZURE_STORAGE_CONTAINER_NAME='npc-images'
"@
