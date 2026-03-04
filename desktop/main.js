// @ts-check
"use strict";

const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");

// ─── Configuration ──────────────────────────────────────────────────────────
const PG_PORT = 5434;
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3000;
const DB_NAME = "smart_pos_db";
const DB_USER = "postgres";
const DB_PASSWORD = "postgres";
const DATA_DIR = path.join(app.getPath("userData"), "pg-data");

const isPackaged = app.isPackaged;
const resourcesPath = isPackaged
  ? path.join(process.resourcesPath)
  : path.join(__dirname);

const frontendDir = isPackaged
  ? path.join(resourcesPath, "frontend")
  : path.join(__dirname, "..", ".next", "standalone");

const backendDir = isPackaged
  ? path.join(resourcesPath, "backend")
  : path.join(__dirname, "..", "..", "smart_pos_server");

const backendEntry = isPackaged
  ? path.join(backendDir, "dist", "server.js")
  : path.join(backendDir, "dist", "server.js");

const prismaDir = isPackaged
  ? path.join(backendDir, "prisma")
  : path.join(backendDir, "prisma");

// ─── State ──────────────────────────────────────────────────────────────────
/** @type {import('embedded-postgres') | null} */
let pg = null;
/** @type {import('child_process').ChildProcess | null} */
let backendProcess = null;
/** @type {import('child_process').ChildProcess | null} */
let frontendProcess = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;
let isQuitting = false;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDatabaseUrl() {
  return `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${PG_PORT}/${DB_NAME}?sslmode=disable`;
}

/** Wait until a TCP port is accepting connections */
function waitForPort(port, host = "127.0.0.1", timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const tryConnect = () => {
      if (Date.now() > deadline) {
        return reject(new Error(`Timeout waiting for port ${port}`));
      }
      const socket = new net.Socket();
      socket.once("connect", () => {
        socket.destroy();
        resolve(undefined);
      });
      socket.once("error", () => {
        socket.destroy();
        setTimeout(tryConnect, 500);
      });
      socket.connect(port, host);
    };
    tryConnect();
  });
}

/** Wait for the backend /health endpoint to respond */
async function waitForBackendHealth(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const http = require("http");
      await new Promise((resolve, reject) => {
        const req = http.get(
          `http://127.0.0.1:${BACKEND_PORT}/health`,
          (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
              if (res.statusCode === 200) resolve(undefined);
              else reject(new Error(`Health check returned ${res.statusCode}`));
            });
          }
        );
        req.on("error", reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error("timeout"));
        });
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Backend health check timed out");
}

const fs = require("fs");
const logFile = path.join(app.getPath("userData"), "smartpos.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(logFile, line + "\n"); } catch {}
}

// ─── Startup Sequence ───────────────────────────────────────────────────────

async function startPostgres() {
  log("Starting embedded PostgreSQL...");

  const { default: EmbeddedPostgres } = await import("embedded-postgres");

  pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: DB_USER,
    password: DB_PASSWORD,
    port: PG_PORT,
    persistent: true,
  });

  // Only initialise if data dir doesn't exist yet (first launch)
  const pgDataExists = require("fs").existsSync(
    path.join(DATA_DIR, "PG_VERSION")
  );
  if (!pgDataExists) {
    log("First launch — initializing PostgreSQL data directory...");
    await pg.initialise();
  } else {
    log("Data directory already exists, skipping init");
  }

  await pg.start();
  log(`PostgreSQL started on port ${PG_PORT}`);

  // Create the database if it doesn't exist
  try {
    await pg.createDatabase(DB_NAME);
    log(`Database "${DB_NAME}" created`);
  } catch (err) {
    // Database may already exist — that's fine
    if (!String(err).includes("already exists")) {
      log(`Database note: ${err.message || err}`);
    }
  }
}

async function runMigrations() {
  log("Running Prisma migrations...");

  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

  return new Promise((resolve, reject) => {
    const migrate = spawn(npxCmd, ["prisma", "migrate", "deploy"], {
      cwd: backendDir,
      env: {
        ...process.env,
        DATABASE_URL: getDatabaseUrl(),
      },
      shell: true,
      stdio: "pipe",
    });

    migrate.stdout?.on("data", (data) => log(`[migrate] ${data.toString().trim()}`));
    migrate.stderr?.on("data", (data) => log(`[migrate:err] ${data.toString().trim()}`));

    migrate.on("close", (code) => {
      if (code === 0) {
        log("Migrations applied successfully");
        resolve(undefined);
      } else {
        reject(new Error(`Prisma migrate exited with code ${code}`));
      }
    });

    migrate.on("error", reject);
  });
}

async function startBackend() {
  log("Starting Express backend...");

  const env = {
    ...process.env,
    PORT: String(BACKEND_PORT),
    DATABASE_URL: getDatabaseUrl(),
    NODE_ENV: "production",
    SECRET_KEY: process.env.SECRET_KEY || "smart-pos-desktop-secret",
  };

  backendProcess = spawn(process.execPath, [backendEntry], {
    cwd: backendDir,
    env,
    stdio: "pipe",
  });

  backendProcess.stdout?.on("data", (data) =>
    log(`[backend] ${data.toString().trim()}`)
  );
  backendProcess.stderr?.on("data", (data) =>
    log(`[backend:err] ${data.toString().trim()}`)
  );
  backendProcess.on("exit", (code) => {
    log(`Backend process exited with code ${code}`);
    if (!isQuitting) {
      dialog.showErrorBox(
        "Smart POS",
        "The backend server stopped unexpectedly. The application will close."
      );
      app.quit();
    }
  });

  await waitForBackendHealth();
  log(`Backend ready on port ${BACKEND_PORT}`);
}

/** Ensure .next/static and public are available inside the standalone dir (dev only) */
function ensureStandaloneAssets() {
  if (isPackaged) return;

  const pairs = [
    {
      src: path.join(__dirname, "..", ".next", "static"),
      dest: path.join(frontendDir, ".next", "static"),
    },
    {
      src: path.join(__dirname, "..", "public"),
      dest: path.join(frontendDir, "public"),
    },
  ];

  for (const { src, dest } of pairs) {
    if (!fs.existsSync(src)) continue;
    // Remove stale symlink / junction that points nowhere
    try {
      const stat = fs.lstatSync(dest);
      if (stat.isSymbolicLink() || stat.isDirectory()) continue; // already present
    } catch {
      // dest doesn't exist — create junction
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.symlinkSync(src, dest, "junction");
    log(`Linked ${src} → ${dest}`);
  }
}

async function startFrontend() {
  log("Starting Next.js frontend...");
  ensureStandaloneAssets();

  const env = {
    ...process.env,
    PORT: String(FRONTEND_PORT),
    HOSTNAME: "0.0.0.0",
    NEXT_PUBLIC_BACKEND: `http://localhost:${BACKEND_PORT}`,
    NODE_ENV: "production",
  };

  const serverJs = path.join(frontendDir, "server.js");

  frontendProcess = spawn(process.execPath, [serverJs], {
    cwd: frontendDir,
    env,
    stdio: "pipe",
  });

  frontendProcess.stdout?.on("data", (data) =>
    log(`[frontend] ${data.toString().trim()}`)
  );
  frontendProcess.stderr?.on("data", (data) =>
    log(`[frontend:err] ${data.toString().trim()}`)
  );
  frontendProcess.on("exit", (code) => {
    log(`Frontend process exited with code ${code}`);
  });

  await waitForPort(FRONTEND_PORT);
  log(`Frontend ready on port ${FRONTEND_PORT}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: "Smart POS",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (!isPackaged) mainWindow?.webContents.openDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── Shutdown ───────────────────────────────────────────────────────────────

async function gracefulShutdown() {
  if (isQuitting) return;
  isQuitting = true;
  log("Shutting down...");

  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill();
    log("Frontend stopped");
  }

  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    log("Backend stopped");
  }

  if (pg) {
    try {
      await pg.stop();
      log("PostgreSQL stopped");
    } catch (err) {
      log(`PG stop error: ${err.message || err}`);
    }
  }
}

// ─── App Lifecycle ──────────────────────────────────────────────────────────

app.on("ready", async () => {
  try {
    await startPostgres();
    await runMigrations();
    await startBackend();
    await startFrontend();
    createWindow();
  } catch (err) {
    log(`Startup failed: ${err.message || err}`);
    dialog.showErrorBox(
      "Smart POS — Startup Error",
      `Failed to start the application:\n\n${err.message || err}\n\nPlease check the logs or contact support.`
    );
    await gracefulShutdown();
    app.quit();
  }
});

app.on("window-all-closed", async () => {
  await gracefulShutdown();
  app.quit();
});

app.on("before-quit", async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    await gracefulShutdown();
    app.quit();
  }
});
