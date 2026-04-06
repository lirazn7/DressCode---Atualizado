import * as SQLite from 'expo-sqlite';

// Abre o banco de dados de forma síncrona
const db = SQLite.openDatabaseSync('dresscode.db');

export const DatabaseInit = () => {
  // Cria a tabela de usuários (se não existir)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      nome     TEXT,
      email    TEXT UNIQUE,
      password TEXT,
      username TEXT
    );
  `);

  // --- TABELA DE POSTAGENS ---
  db.execSync(`
    CREATE TABLE IF NOT EXISTS posts (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      userId   INTEGER,
      imageUri TEXT,
      legenda  TEXT,
      marcas   TEXT,
      data     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );
  `);

  // --- TABELA DE CURTIDAS ---
  // Movi para dentro da função para garantir que execute junto com as outras
  db.execSync(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      postId INTEGER,
      UNIQUE(userId, postId),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(postId) REFERENCES posts(id)
    );
  `);

  // --- TABELA DE COMENTÁRIOS ---
  db.execSync(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      postId INTEGER,
      texto TEXT,
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(postId) REFERENCES posts(id)
    );
  `);
};

// Exportado o db para ser usado em outras telas
export default db;