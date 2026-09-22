import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const pg = new EmbeddedPostgres({
  databaseDir: path.join(process.cwd(), ".data", "pg"),
  user: "postgres",
  password: "postgres",
  port: 5433,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: (m) => console.log("[pg]", m),
  onError: (m) => console.error("[pg:error]", m),
});

await pg.initialise();
await pg.start();
try {
  await pg.createDatabase("medical_store");
} catch (e) {
  console.log("database may already exist", e?.message ?? e);
}
console.log("Embedded Postgres ready on 5433");
