const { Pool } = require('pg')

const pool = new Pool({
    user: 'rijbzaqo',
    host: 'isilo.db.elephantsql.com',
    database: 'rijbzaqo',
    password: 'vHp4AJv9ECNcFzS-MUsZXdYEqN8YIz18',
    port: 5432,
  }
)
//postgres://rijbzaqo:vHp4AJv9ECNcFzS-MUsZXdYEqN8YIz18@isilo.db.elephantsql.com/rijbzaqo
 
module.exports = {
  query: (text, params) => pool.query(text, params),
}





