#!/usr/bin/env bash
# exit on error
set -o errexit

npm install --include=dev
npm run build
npx prisma generate
npx prisma migrate deploy