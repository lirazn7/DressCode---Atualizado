import * as SQLite from 'expo-sqlite';

// Abre o banco de dados de forma síncrona (Padrão novo do Expo)
const db = SQLite.openDatabaseSync('dresscode.db');

export const DatabaseInit = () => {
  // Criamos a tabela inicial
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      nome TEXT, 
      email TEXT, 
      password TEXT
    );
  `);
  console.log("Banco de dados pronto!");
};

export default db;