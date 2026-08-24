#!/bin/bash

MONGODB_URL=mongodb+srv://siviraj725_db_user:QkartMongo2026@qkart-node.cgkjjuz.mongodb.net/qkart?retryWrites=true

USERNAME="siviraj725_db_user"
PASSWORD="QkartMongo2026"

mongoimport --uri "$MONGO_URI" \
  --ssl \
  --authenticationDatabase admin \
  --username "$USERNAME" \
  --password "$PASSWORD" \
  --drop \
  --collection users \
  --file data/export_qkart_users.json

mongoimport --uri "$MONGO_URI" \
  --ssl \
  --authenticationDatabase admin \
  --username "$USERNAME" \
  --password "$PASSWORD" \
  --drop \
  --collection products \
  --file data/export_qkart_products.json