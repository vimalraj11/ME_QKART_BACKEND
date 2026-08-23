#!/bin/bash

MONGO_URI="mongodb://ac-6mezhzw-shard-00-00.cgkjjuz.mongodb.net:27017,ac-6mezhzw-shard-00-01.cgkjjuz.mongodb.net:27017,ac-6mezhzw-shard-00-02.cgkjjuz.mongodb.net:27017/qkart?replicaSet=atlas-by58hg-shard-0&authSource=admin"

USERNAME="siviraj725_db_user"
PASSWORD="4YUezCVVAWEo5zpm"

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