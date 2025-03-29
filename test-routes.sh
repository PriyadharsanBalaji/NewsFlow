#!/bin/bash

echo "Testing API routes..."
echo "====================="

echo "GET /api/user/status"
curl -s http://localhost:5000/api/user/status

echo -e "\nPOST /api/auth/register"
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'

echo -e "\nPOST /api/auth/login"
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

echo -e "\n====================="
echo "Tests completed"