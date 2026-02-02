#!/bin/bash

# WhatsML VPS Setup Script for Ubuntu 22.04
# This script installs: PHP 8.2, Node.js 18, MySQL 8.0, Redis, Nginx, PM2, and Supervisor.

set -e

echo "Updating system..."
sudo apt update && sudo apt upgrade -y

echo "Installing basic tools..."
sudo apt install -y curl wget git unzip zip software-properties-common ca-certificates lsb-release apt-transport-https

echo "Adding PHP 8.2 repository..."
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

echo "Installing PHP 8.2 and extensions..."
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-xml php8.2-curl php8.2-mbstring php8.2-zip php8.2-intl php8.2-bcmath php8.2-redis php8.2-gd php8.2-sqlite3

echo "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y node.js

echo "Installing MySQL 8.0..."
sudo apt install -y mysql-server

echo "Installing Redis..."
sudo apt install -y redis-server

echo "Installing Nginx..."
sudo apt install -y nginx

echo "Installing PM2 and Supervisor..."
sudo npm install -g pm2
sudo apt install -y supervisor

echo "Installing Composer..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

echo "Installation complete!"
echo "Next steps: Create database, configure Nginx, and setup your .env files."
