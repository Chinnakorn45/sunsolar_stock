#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."

# Wait for database to accept connections
until node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT 1')
    .then(() => { console.log('✅ PostgreSQL is ready!'); pool.end(); process.exit(0); })
    .catch(() => { pool.end(); process.exit(1); });
" 2>/dev/null; do
  echo "   ...PostgreSQL is not ready yet, retrying in 2s"
  sleep 2
done

echo "🔄 Running migrations..."
node src/migrate.js

echo "🚀 Starting server..."
exec "$@"
