import * as SQLite from 'expo-sqlite';

// Abre o banco de dados de forma síncrona (Padrão novo do Expo)
const db = SQLite.openDatabaseSync('dresscode.db');

export const DatabaseInit = () => {
  // Cria a tabela inicial (se não existir)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      nome     TEXT,
      email    TEXT UNIQUE,
      password TEXT,
      username TEXT
    );
  `);

  // ── Migração: adiciona coluna username para bancos existentes ──────────────
  // (ALTER TABLE não suporta UNIQUE diretamente de forma confiável no SQLite
  //  do Expo — por isso adicionamos sem UNIQUE e criamos o índice separado)
  try {
    db.execSync(`ALTER TABLE users ADD COLUMN username TEXT;`);
  } catch (_) {
    // Coluna já existe — ignorar
  }

  // ── Índice UNIQUE separado para username ───────────────────────────────────
  // NULL é tratado como distinto no SQLite, então múltiplos NULLs são permitidos
  try {
    db.execSync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
      ON users(username);
    `);
  } catch (_) {
    // Índice já existe — ignorar
  }

  console.log("Banco de dados pronto!");
};

export default db;