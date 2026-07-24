const mysql = require('mysql2/promise');

async function run() {
    const conn = await mysql.createConnection({
        host: '127.0.0.1', 
        user: 'santi', 
        password: 'Independiente5$', 
        database: 'lnb_fantasy'
    }); 
    const [res] = await conn.execute("DELETE FROM enfrentamiento_h2h WHERE jornada_id IN (SELECT id FROM jornada WHERE estado IN ('EN_JUEGO', 'FINALIZADA'))"); 
    console.log('Deleted', res.affectedRows); 
    await conn.end(); 
} 
run().catch(console.error);
