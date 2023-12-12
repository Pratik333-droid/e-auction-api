import pg from 'pg'
const Pool = pg.Pool
const pool = new Pool({
  // connectionString: 'postgres://prat:IlQFXEDdOi71G8rOjONrnoc0BBFJYUdd@dpg-clngcnhll56s73fhe6v0-a.singapore-postgres.render.com/eauction' + '?sslmode=require',
  connectionString: 'postgres://prat:IlQFXEDdOi71G8rOjONrnoc0BBFJYUdd@dpg-clngcnhll56s73fhe6v0-a.singapore-postgres.render.com/eauction',
  ssl: {
    rejectUnauthorized: false,
  },
})

export default pool