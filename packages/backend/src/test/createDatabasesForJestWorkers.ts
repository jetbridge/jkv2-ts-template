import { createConnection } from "typeorm";

(async () => {
  const connection = await createConnection({
    type: 'postgres',
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_MASTER,
    host: process.env.DB_HOST,
    port: 5432,
  });
  const databaseName = `jkv2_test_template`;
  const workers = parseInt(process.env.JEST_WORKERS || '1');

  await connection.query(`DROP DATABASE IF EXISTS ${databaseName}`);
  await connection.query(`CREATE DATABASE ${databaseName}`);

  const templateDBConnection = await createConnection({
    name: 'templateConnection',
    type: 'postgres',
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'jkv2_test_template',
    host: process.env.DB_HOST,
    migrations: ['src/migrations/*.ts'],
    port: 5432,
  });

  await templateDBConnection.runMigrations();
  await templateDBConnection.close();

  for (let i = 1; i <= workers; i++) {
    const workerDatabaseName = `jkv2_test_${i}`;

    await connection.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`);
    await connection.query(`CREATE DATABASE ${workerDatabaseName} TEMPLATE ${databaseName};`);
  }

  await connection.close();
})();