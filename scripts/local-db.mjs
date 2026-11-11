import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("../", import.meta.url));
const local = path.join(root, ".local");
const data = path.join(local, "postgres-data");
const bin = path.join(local, "postgres-runtime/node_modules/@embedded-postgres/windows-x64/native/bin");
const action = process.argv[2] ?? "start";
const url = new URL(process.env.DATABASE_URL ?? "");
if (process.platform !== "win32" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
  throw new Error("Este script solo administra PostgreSQL local en Windows.");
}
if (!["start", "stop"].includes(action)) throw new Error("Usa: npm run db:local [-- stop]");
if (!existsSync(path.join(bin, "pg_ctl.exe"))) {
  throw new Error("Instala el motor local: npm install --prefix .local/postgres-runtime --no-save --package-lock=false @embedded-postgres/windows-x64@16.15.0-beta.19");
}
const run = (name, args, options = {}) => execFileSync(path.join(bin, `${name}.exe`), args, {
  windowsHide: true, stdio: "inherit", ...options,
});
if (action === "stop") {
  run("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
} else {
  mkdirSync(local, { recursive: true });
  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  if (!username || !password) throw new Error("DATABASE_URL necesita usuario y contraseña.");
  if (!existsSync(path.join(data, "PG_VERSION"))) {
    const passwordFile = path.join(local, "postgres-init-password");
    writeFileSync(passwordFile, password + "\n", { mode: 0o600 });
    try {
      run("initdb", ["-D", data, "-U", username, "--pwfile", passwordFile,
        "--auth=scram-sha-256", "--encoding=UTF8", "--locale=C"]);
    } finally {
      rmSync(passwordFile, { force: true });
    }
  }
  let running = false;
  try { run("pg_ctl", ["-D", data, "status"], { stdio: "ignore" }); running = true; } catch {}
  if (!running) {
    run("pg_ctl", ["-D", data, "-l", path.join(local, "postgres.log"),
      "-o", `-h 127.0.0.1 -p ${Number(url.port || 5432)}`, "-w", "start"]);
  }
  const database = decodeURIComponent(url.pathname.slice(1));
  const adminUrl = new URL(url);
  adminUrl.hostname = "127.0.0.1";
  adminUrl.pathname = "/postgres";
  const client = new pg.Client({ connectionString: adminUrl.toString(), connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (!result.rowCount) await client.query(`CREATE DATABASE "${database.replaceAll('"', '""')}"`);
    console.log("PostgreSQL local listo. Datos persistentes en .local/postgres-data.");
  } finally {
    await client.end();
  }
}
