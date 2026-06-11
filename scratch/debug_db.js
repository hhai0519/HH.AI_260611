const { pool } = require('../Modules/db_state_manager.js');
pool.query('SELECT NOW()').then(res => {
  console.log('Success:', res.rows[0]);
  pool.end();
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
