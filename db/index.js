const { Pool } = require('pg')

const pool = new Pool({
    user: 'santhoshbetha',
    host: 'ep-muddy-forest-977794.ap-southeast-1.aws.neon.tech',
    database: 'neondb',
    password: 'apsqcb5Fe4IY',
    port: 5432,
    ssl: true
  }
)
 
module.exports = {
  query: (text, params) => pool.query(text, params),
}





