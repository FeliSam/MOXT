#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { loadPhase2Env } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vars = loadPhase2Env()
const password = vars.SUPABASE_DB_PASSWORD || vars.MOXT_SUPABASE_DB_PASSWORD || ''

if (!password) {
  console.error('SUPABASE_DB_PASSWORD missing in scripts/phase2.env')
  process.exit(1)
}

const migrationFile = path.join(
  root,
  'supabase',
  'migrations',
  '20261017120000_admin_broadcast_notifications.sql',
)
const sql = readFileSync(migrationFile, 'utf8')

const connectionConfigs = [
  {
    name: 'Supabase Pooler (Transaction 6543)',
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.rbvqfkccbkwjxkvpnwqn',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  },
  {
    name: 'Supabase Pooler (Session 5432)',
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.rbvqfkccbkwjxkvpnwqn',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  },
  {
    name: 'Supabase Direct DB',
    host: 'db.rbvqfkccbkwjxkvpnwqn.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  },
]

async function runMigration() {
  let applied = false
  for (const config of connectionConfigs) {
    console.log(`\n▸ Essai de connexion : ${config.name}...`)
    const client = new pg.Client(config)
    try {
      await client.connect()
      console.log(`✓ Connecté avec succès via ${config.name}`)
      console.log('▸ Exécution de la migration 20261017120000_admin_broadcast_notifications.sql...')
      await client.query(sql)
      console.log('✓ Migration exécutée avec succès !')
      
      // Test the function presence
      const check = await client.query(`
        select routine_name
        from information_schema.routines
        where routine_schema = 'public'
          and routine_name in ('moxt_admin_broadcast_notification', 'moxt_admin_list_broadcasts');
      `)
      console.log('✓ Fonctions vérifiées :', check.rows.map(r => r.routine_name))

      await client.end()
      applied = true
      break
    } catch (err) {
      console.warn(`✗ Échec avec ${config.name} : ${err.message}`)
      try {
        await client.end()
      } catch {}
    }
  }

  if (!applied) {
    console.error('\n✗ Impossible d’appliquer la migration sur toutes les routes tentées.')
    process.exit(1)
  }
}

runMigration()
