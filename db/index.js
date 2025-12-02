const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const initDb = async () => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('⚠ Erro ao inicializar banco:', err.message);
        // Não derrubamos o servidor
    }
};

module.exports = { pool, initDb };
