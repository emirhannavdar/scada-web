// Never run automated tests against the real application's DATABASE_URL.
process.env.NODE_ENV='test';
process.env.DATABASE_URL='pglite:test';
