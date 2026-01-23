#!/bin/bash
# ===========================================
# Deploy NPC Graph to Azure Container Apps
# ===========================================
# Prerequisites:
# - Azure CLI installed (az)
# - Docker installed
# - Logged in to Azure (az login)

set -e

# Configuration - UPDATE THESE VALUES
RESOURCE_GROUP="npc-graph-rg"
LOCATION="eastus"
ACR_NAME="npcgraphacr"  # Must be globally unique, lowercase, alphanumeric only
CONTAINER_APP_NAME="npc-graph"
CONTAINER_ENV_NAME="npc-graph-env"
IMAGE_NAME="npc-graph"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Azure Container Apps deployment...${NC}"

# Step 1: Create Resource Group
echo -e "${YELLOW}📦 Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 2: Create Azure Container Registry
echo -e "${YELLOW}🗃️ Creating container registry...${NC}"
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Step 3: Get ACR credentials
echo -e "${YELLOW}🔑 Getting registry credentials...${NC}"
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Step 4: Build and push Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -f Dockerfile.prod -t $ACR_LOGIN_SERVER/$IMAGE_NAME:latest .

echo -e "${YELLOW}📤 Pushing image to ACR...${NC}"
docker login $ACR_LOGIN_SERVER -u $ACR_USERNAME -p $ACR_PASSWORD
docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:latest

# Step 5: Create Container Apps Environment
echo -e "${YELLOW}🌍 Creating Container Apps environment...${NC}"
az containerapp env create \
  --name $CONTAINER_ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Step 6: Create Container App
echo -e "${YELLOW}🚢 Deploying container app...${NC}"
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV_NAME \
  --image $ACR_LOGIN_SERVER/$IMAGE_NAME:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi

# Step 7: Get the app URL
APP_URL=$(az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv)

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your app is available at: https://$APP_URL${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Configure environment variables:${NC}"
echo "az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --set-env-vars \\"
echo "  DATABASE_URL='your-neon-connection-string' \\"
echo "  DIRECT_URL='your-neon-direct-string' \\"
echo "  AZURE_STORAGE_CONNECTION_STRING='your-azure-storage-connection-string' \\"
echo "  AZURE_STORAGE_CONTAINER_NAME='npc-images'"
