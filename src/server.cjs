const fs = require('fs');
const path = require('path');
const serve = require('koa-static');
const ratelimit = require('koa-ratelimit');
const { v4: uuidv4 } = require('uuid');

const Server = require('boardgame.io/server').Server;
const { ActivePlayers } = require('boardgame.io/core');

// Inlined from src/lib/store.js (converted to CJS)
function resetBuzzers(G) {
  G.queue = {};
}

function resetBuzzer(G, ctx, id) {
  const newQueue = { ...G.queue };
  delete newQueue[id];
  G.queue = newQueue;
}

function toggleLock(G) {
  G.locked = !G.locked;
}

function activateBuzzer(G) {
  G.locked = false;
}

function deactivateBuzzer(G) {
  G.locked = true;
}

function resetAndActivate(G) {
  G.queue = {};
  G.locked = false;
}

function resetAndDeactivate(G) {
  G.queue = {};
  G.locked = true;
}

function buzz(G, ctx, id) {
  if (G.locked) {
    return;
  }
  const newQueue = { ...G.queue };
  if (!newQueue[id]) {
    newQueue[id] = { id, timestamp: new Date().getTime() };
  }
  G.queue = newQueue;
}

const Buzzer = {
  name: 'buzzer',
  minPlayers: 2,
  maxPlayers: 150,
  setup: () => ({ queue: {}, locked: true }), // Starts locked by default so host must activate!
  phases: {
    play: {
      start: true,
      moves: {
        buzz,
        resetBuzzer,
        resetBuzzers,
        toggleLock,
        activateBuzzer,
        deactivateBuzzer,
        resetAndActivate,
        resetAndDeactivate,
      },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
    },
  },
};

const server = Server({ games: [Buzzer], generateCredentials: () => uuidv4() });

const PORT = process.env.PORT || 4001;
const { app } = server;

// Trust proxy headers (X-Forwarded-For) when running on Render/Railway/reverse proxies
app.proxy = true;

// Enable CORS for cross-origin frontend deployments (e.g. Vercel)
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }
  await next();
});

// Health check endpoint for Uptime monitors / Render health checks
app.use(async (ctx, next) => {
  if (ctx.path === '/health' || ctx.path === '/ping') {
    ctx.status = 200;
    ctx.body = { status: 'ok', uptime: process.uptime() };
    return;
  }
  await next();
});

const FRONTEND_PATH = path.join(__dirname, '../build');
if (fs.existsSync(FRONTEND_PATH)) {
  app.use(
    serve(FRONTEND_PATH, {
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
      },
    })
  );
}

function randomString(length, chars) {
  let result = '';
  for (let i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// Rate limiter - configured for 140+ concurrent users sharing the same NAT / WiFi IP
const db = new Map();
app.use(
  ratelimit({
    driver: 'memory',
    db: db,
    duration: 60000,
    errorMessage: 'Too many requests. Please wait a moment and try again.',
    id: (ctx) => ctx.ip,
    max: 1000,
    whitelist: (ctx) => {
      // Exclude health checks from rate limiting
      return ctx.path === '/health' || ctx.path === '/ping';
    },
  })
);

server.run(
  {
    port: PORT,
    lobbyConfig: { uuid: () => randomString(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ') },
  },
  () => {
    console.log(`> MetaBuzz Game Server is running on port ${PORT}`);
    if (fs.existsSync(FRONTEND_PATH)) {
      server.app.use(async (ctx, next) => {
        await serve(FRONTEND_PATH)(
          Object.assign(ctx, { path: 'index.html' }),
          next
        );
      });
    }
  }
);
