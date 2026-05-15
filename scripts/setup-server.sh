#!/usr/bin/env bash
# One-time setup script — run on a fresh Ubuntu 22.04 EC2 instance
# Usage: bash setup-server.sh

set -euo pipefail

echo "==> Updating packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker "$USER"
  rm get-docker.sh
else
  echo "Docker already installed."
fi

echo "==> Installing utilities..."
sudo apt-get install -y curl ufw

echo "==> Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "==> Creating app directory..."
mkdir -p ~/app/nginx

echo ""
echo "==> Done!"
echo "Next steps:"
echo "  1. Log out and back in (so docker group applies), or run: newgrp docker"
echo "  2. Copy docker-compose.yml and nginx/nginx.conf into ~/app/"
echo "  3. Create ~/app/.env with DB_PASSWORD=<strong-password>"
echo "  4. Push to main — GitHub Actions will deploy."
