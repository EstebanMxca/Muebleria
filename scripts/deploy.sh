#!/bin/bash

echo "📁 Cambiando al directorio del proyecto..."
cd /var/www/muebleria-cabanas || exit

echo "🔄 Haciendo pull de la última versión..."
git reset --hard
git clean -fd
git pull origin main

echo "📦 Instalando dependencias si es necesario..."
cd backend-frontend
if [ -f package.json ]; then
  npm install --omit=dev
fi
cd ..

echo "🚀 Reiniciando la aplicación con PM2..."
pm2 restart muebleria-cabanas

echo "✅ Despliegue completado."
