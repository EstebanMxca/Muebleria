#!/bin/bash

# Generar versión única basada en fecha y hora
VERSION=$(date +%Y%m%d%H%M%S)
echo "Generando nueva versión: $VERSION"

# Actualizar versiones en archivos HTML para CSS
echo "Actualizando referencias CSS..."
find . -name "*.html" -type f -exec sed -i "s/\.css?v=[0-9a-zA-Z.]*/.css?v=$VERSION/g" {} \;

# Actualizar versiones en archivos HTML para JavaScript
echo "Actualizando referencias JavaScript..."
find . -name "*.html" -type f -exec sed -i "s/\.js?v=[0-9a-zA-Z.]*/.js?v=$VERSION/g" {} \;

echo "✓ Versiones actualizadas correctamente a: $VERSION"