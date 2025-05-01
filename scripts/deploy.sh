#!/bin/bash

echo "🏠 Iniciando despliegue de Mueblería Cabañas..."

echo "📁 Cambiando al directorio del proyecto..."
cd /var/www/muebleria-cabanas || exit

echo "🔄 Haciendo pull de la última versión..."
git reset --hard
git clean -fd
git pull origin main

echo "⏱️ Actualizando versiones de recursos..."
./actualizar-versiones.sh

echo "📦 Instalando dependencias si es necesario..."
cd backend-frontend
if [ -f package.json ]; then
  npm install --omit=dev
fi
cd ..

echo "🚀 Reiniciando la aplicación con PM2..."
pm2 restart muebleria-cabanas

echo "✅ Despliegue completado y versiones actualizadas."