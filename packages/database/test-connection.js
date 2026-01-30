const { Client } = require('pg');

const config = {
  host: process.env.PGHOST || 'host.docker.internal',
  port: parseInt(process.env.PGPORT || '5433'),
  user: process.env.PGUSER || 'postgres',
  // password removido para trust auth
  database: process.env.PGDATABASE || 'glamo_dev',
};

console.log('Connecting with:', config);

const client = new Client(config);

client.connect()
  .then(() => {
    console.log('✓ Connected successfully!');
    return client.query('SELECT current_user, current_database()');
  })
  .then((result) => {
    console.log('✓ Query result:', result.rows[0]);
    return client.end();
  })
  .catch((err) => {
    console.error('✗ Connection failed:', err.message);
    process.exit(1);
  });
