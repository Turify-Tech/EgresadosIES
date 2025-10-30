#!/bin/bash

echo "🔍 Verificando configuración de ImageKit..."
echo "==========================================="

# Verificar variables de entorno del frontend
echo "📁 Frontend (.env):"
if [ -f "frontend/.env" ]; then
    echo "✅ Archivo .env encontrado"
    echo "PUBLIC_IMAGEKIT_PUBLIC_KEY: $(grep PUBLIC_IMAGEKIT_PUBLIC_KEY frontend/.env | cut -d'=' -f2 | head -c 20)..."
    echo "PUBLIC_IMAGEKIT_URL_ENDPOINT: $(grep PUBLIC_IMAGEKIT_URL_ENDPOINT frontend/.env | cut -d'=' -f2)"
    echo "PUBLIC_API_URL: $(grep PUBLIC_API_URL frontend/.env | cut -d'=' -f2)"
else
    echo "❌ Archivo frontend/.env no encontrado"
fi

echo ""

# Verificar variables de entorno del backend
echo "🔧 Backend (.env):"
if [ -f "backend/.env" ]; then
    echo "✅ Archivo .env encontrado"
    echo "IMAGEKIT_PRIVATE_KEY: $(grep IMAGEKIT_PRIVATE_KEY backend/.env | cut -d'=' -f2 | head -c 20)..."
    echo "IMAGEKIT_PUBLIC_KEY: $(grep IMAGEKIT_PUBLIC_KEY backend/.env | cut -d'=' -f2 | head -c 20)..."
else
    echo "❌ Archivo backend/.env no encontrado"
fi

echo ""

# Verificar si el backend está corriendo
echo "🌐 Verificando backend..."
if curl -s http://localhost:3000/api/imagekit/auth > /dev/null; then
    echo "✅ Backend corriendo en puerto 3000"
    echo "📋 Respuesta del endpoint de autenticación:"
    curl -s http://localhost:3000/api/imagekit/auth | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/imagekit/auth
else
    echo "❌ Backend no responde en puerto 3000"
    echo "💡 Asegúrate de que el backend esté corriendo:"
    echo "   cd backend && npm run dev"
fi

echo ""
echo "🎯 Próximos pasos:"
echo "1. Si faltan variables de entorno, configurarlas"
echo "2. Si el backend no corre, iniciarlo con 'npm run dev'"
echo "3. Probar la funcionalidad en /perfil/editar"