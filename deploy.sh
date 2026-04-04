#!/bin/bash
set -e

SERVER="root@187.77.47.112"
APP_DIR="/opt/agentfi"
REPO="https://github.com/sebasIeth/agentFi.git"

echo "🚀 Deploying agentfi to VPS..."

ssh $SERVER << 'REMOTE'
set -e

# Install Node 20 if not present
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2..."
  npm install -g pm2
fi

# Clone or pull
if [ -d "/opt/agentfi" ]; then
  echo "📥 Pulling latest..."
  cd /opt/agentfi
  git pull origin main
else
  echo "📥 Cloning repo..."
  git clone https://github.com/sebasIeth/agentFi.git /opt/agentfi
  cd /opt/agentfi
fi

# Write env file
cat > .env << 'ENV'
DATABASE_URL="postgresql://neondb_owner:npg_x3Ww1JbKOMEH@ep-aged-mouse-ab20km9p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
BACKEND_PRIVATE_KEY=0x2b581c835fb3cc5ecbc260bf0829072f4d2394c22c34bdcbc2e7409351c2b735
AGENT_REGISTRY_ADDRESS=0xa705286a7ed025d46F2f7cF215654e0c1115fbCf
POST_FACTORY_ADDRESS=0x019bf853B160779c1c523aCf147fe8aBc6e84CBF
USDC_ADDRESS=0x79A02482A880bCE3F13e09Da970dC34db4CD24d1
WORLD_CHAIN_RPC=https://worldchain-mainnet.g.alchemy.com/public
PROTOCOL_TREASURY=0xCb821D3d1084Ac0efe96087CF3ADC116cdc693F6
APP_ID=app_c8ae3df9a08e3f6713dd1cbbac52d89d
DEV_PORTAL_API_KEY=0x48755ac410ad3d9df05a5efad4d3cfb2cae9ddd806d87764716ba42fa7030b1d
ENV

cat > .env.local << 'ENVLOCAL'
APP_ID=app_c8ae3df9a08e3f6713dd1cbbac52d89d
DEV_PORTAL_API_KEY=0x48755ac410ad3d9df05a5efad4d3cfb2cae9ddd806d87764716ba42fa7030b1d
ENVLOCAL

# Install deps
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build
echo "🔨 Building..."
npm run build

# Start/restart with PM2
echo "🚀 Starting app..."
pm2 delete agentfi 2>/dev/null || true
pm2 start npm --name "agentfi" -- start -- -p 3004
pm2 save

echo "✅ Deployed! Running on port 3004"
REMOTE

echo "✅ Done! App running at http://187.77.47.112:3004"
