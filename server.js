const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));

// --- CONSTANTES DEL MUNDO Y JUEGO ---
const WORLD_W = 3800, WORLD_H = 2200;
const WALL = 30;
const SIZE = 26;
const SPEED = 2.8;
const FRICTION = 0.85;
const MAX_HEALTH = 100;
const RESPAWN_DELAY = 1400;

const houses = [
  {x:1700, y:900, w:400, h:300, floorColor:"#8c7b6c"},
  {x:600, y:400, w:350, h:280, floorColor:"#998773"},
  {x:600, y:1400, w:350, h:280, floorColor:"#998773"},
  {x:2800, y:400, w:350, h:280, floorColor:"#998773"},
  {x:2800, y:1400, w:350, h:280, floorColor:"#998773"},
  {x:1750, y:250, w:300, h:200, floorColor:"#5e574f"},
  {x:1750, y:1750, w:300, h:200, floorColor:"#5e574f"}
];

const houseWalls = [
  {x:1700, y:900, w:400, h:20}, {x:1700, y:1180, w:150, h:20}, {x:1950, y:1180, w:150, h:20},
  {x:1700, y:900, w:20, h:300}, {x:2080, y:900, w:20, h:300},
  {x:600, y:400, w:350, h:20}, {x:600, y:660, w:350, h:20},
  {x:600, y:400, w:20, h:280}, {x:930, y:400, w:20, h:100}, {x:930, y:580, w:20, h:100},
  {x:600, y:1400, w:350, h:20}, {x:600, y:1660, w:350, h:20},
  {x:600, y:1400, w:20, h:280}, {x:930, y:1400, w:20, h:100}, {x:930, y:1580, w:20, h:100},
  {x:2800, y:400, w:350, h:20}, {x:2800, y:660, w:350, h:20},
  {x:3130, y:400, w:20, h:280}, {x:2800, y:400, w:20, h:100}, {x:2800, y:580, w:20, h:100},
  {x:2800, y:1400, w:350, h:20}, {x:2800, y:1660, w:350, h:20},
  {x:3130, y:1400, w:20, h:280}, {x:2800, y:1400, w:20, h:100}, {x:2800, y:1580, w:20, h:100},
  {x:1750, y:250, w:300, h:20}, {x:1750, y:250, w:20, h:200}, {x:2030, y:250, w:20, h:200},
  {x:1750, y:430, w:100, h:20}, {x:1950, y:430, w:100, h:20},
  {x:1750, y:1930, w:300, h:20}, {x:1750, y:1750, w:20, h:200}, {x:2030, y:1750, w:20, h:200},
  {x:1750, y:1750, w:100, h:20}, {x:1950, y:1750, w:100, h:20}
];

const obstacles = [
  ...houseWalls,
  {x:1300,y:1050,w:180,h:30}, {x:2280,y:1050,w:180,h:30},
  {x:1850,y:650,w:100,h:30}, {x:1850,y:1450,w:100,h:30},
  {x:1100,y:450,w:30,h:200}, {x:2650,y:450,w:30,h:200},
  {x:1100,y:1450,w:30,h:200}, {x:2650,y:1450,w:30,h:200}
];

const rocks = [
  {x:350, y:950, w:100, h:100}, {x:3350, y:950, w:100, h:100},
  {x:1250, y:250, w:90, h:90}, {x:2450, y:250, w:90, h:90},
  {x:1250, y:1850, w:90, h:90}, {x:2450, y:1850, w:90, h:90}
];

const bushes = [
  {x:450, y:300, w:100, h:100}, {x:3250, y:300, w:100, h:100},
  {x:450, y:1800, w:100, h:100}, {x:3250, y:1800, w:100, h:100},
  {x:1500, y:800, w:90, h:90}, {x:2200, y:1300, w:90, h:90}
];

const WEAPONS = {
  pistol:  {name:"Glock-17", dmg:15, rate:280, speed:19, recoil:0.2, spread:0.02, pellets:1, barrelLength:28, magSize:12, maxAmmo:Infinity, reloadTime:1100, bulletColor:"#fff"},
  m4a1:    {name:"M4A1",     dmg:17, rate:140, speed:23, recoil:0.3, spread:0.04, pellets:1, barrelLength:50, magSize:30, maxAmmo:120,      reloadTime:1900, bulletColor:"#ffe9a8"},
  ak47:    {name:"AK-47",    dmg:25, rate:200, speed:21, recoil:0.5, spread:0.07, pellets:1, barrelLength:52, magSize:30, maxAmmo:90,       reloadTime:2100, bulletColor:"#ffcf7a"},
  scar:    {name:"SCAR-H",   dmg:32, rate:250, speed:24, recoil:0.6, spread:0.03, pellets:1, barrelLength:54, magSize:20, maxAmmo:80,       reloadTime:2200, bulletColor:"#ffb055"},
  p90:     {name:"P90",      dmg:11, rate:70,  speed:21, recoil:0.15,spread:0.09, pellets:1, barrelLength:38, magSize:50, maxAmmo:150,      reloadTime:1800, bulletColor:"#ffffaa"},
  m249:    {name:"M249 SAW", dmg:12, rate:80,  speed:20, recoil:0.35,spread:0.11, pellets:1, barrelLength:58, magSize:100,maxAmmo:100,      reloadTime:3600, bulletColor:"#c9ffb0"},
  shotgun: {name:"M4 Super", dmg:13, rate:650, speed:18, recoil:0.6, spread:0.24, pellets:6, barrelLength:48, magSize:8,  maxAmmo:32,       reloadTime:2400, bulletColor:"#ff5555"},
  sniper:  {name:"AWP 7.62", dmg:95, rate:950, speed:30, recoil:0.7, spread:0,    pellets:1, barrelLength:66, magSize:5,  maxAmmo:Infinity, reloadTime:2300, bulletColor:"#aaffff"},
  barrett: {name:"Barrett .50",dmg:120,rate:1300,speed:34, recoil:1.2, spread:0,    pellets:1, barrelLength:74, magSize:5,  maxAmmo:15,       reloadTime:3000, bulletColor:"#66ffff"}
};

const weaponSpawnPoints = [
  {x:1900, y:1050}, {x:775,  y:540},  {x:775,  y:1540}, {x:2975, y:540},
  {x:2975, y:1540}, {x:1900, y:330},  {x:1900, y:1850}, {x:1390, y:1050},
  {x:2410, y:1050}, {x:1100, y:1050}, {x:2700, y:1050}, {x:1900, y:700},
  {x:1900, y:1400}, {x:450,  y:1050}, {x:3350, y:1050}, {x:1900, y:100}
];

const weaponTypes = ["m4a1", "shotgun", "scar", "sniper", "barrett", "m249", "p90", "ak47"];
let crates = [];

function spawnRandomCrates() {
  crates = [];
  let availableSpawns = [...weaponSpawnPoints].sort(() => Math.random() - 0.5);
  weaponTypes.forEach((w, index) => {
    const pt = availableSpawns[index];
    crates.push({ x: pt.x, y: pt.y, weapon: w, active: true, respawnAt: 0 });
  });
}
spawnRandomCrates();

const ammoSupplyBoxes = [
  {x:1500, y:1050, type:"ammo", active:true, respawnAt:0},
  {x:2300, y:1050, type:"ammo", active:true, respawnAt:0},
  {x:1900, y:500,  type:"grenade", active:true, respawnAt:0},
  {x:1900, y:1600, type:"grenade", active:true, respawnAt:0}
];

const medkits = [
  {x:1900, y:950,  active:true, respawnAt:0},
  {x:775,  y:450,  active:true, respawnAt:0},
  {x:2975, y:1450, active:true, respawnAt:0},
  {x:200,  y:1100, active:true, respawnAt:0},
  {x:3600, y:1100, active:true, respawnAt:0}
];

// --- ESTADO GLOBAL ---
let players = {};
let bullets = [];
let grenades = [];
let explosions = [];

const PLAYER_COLORS = ["#e2543b", "#3b8fe2", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22", "#1abc9c", "#e84393"];

function getRandomSpawn() {
  return {
    x: 200 + Math.random() * (WORLD_W - 400),
    y: 200 + Math.random() * (WORLD_H - 400)
  };
}

function rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh){
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

function resolveObstacles(pl){
  const allObstacles = [...obstacles, ...rocks];
  for(const o of allObstacles){
    if(rectsOverlap(pl.x-SIZE/2, pl.y-SIZE/2, SIZE, SIZE, o.x, o.y, o.w, o.h)){
      const overlapX = Math.min(pl.x+SIZE/2 - o.x, o.x+o.w - (pl.x-SIZE/2));
      const overlapY = Math.min(pl.y+SIZE/2 - o.y, o.y+o.h - (pl.y-SIZE/2));
      if(overlapX < overlapY){
        pl.x += (pl.x < o.x + o.w/2) ? -overlapX : overlapX;
        pl.vx = 0;
      } else {
        pl.y += (pl.y < o.y + o.h/2) ? -overlapY : overlapY;
        pl.vy = 0;
      }
    }
  }
}

// --- CONEXIONES SOCKET ---
io.on("connection", (socket) => {
  const spawn = getRandomSpawn();
  const color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
  const defaultW = WEAPONS.pistol;

  players[socket.id] = {
    id: socket.id,
    color: color,
    x: spawn.x,
    y: spawn.y,
    vx: 0, vy: 0,
    angle: 0,
    health: MAX_HEALTH,
    weapon: "pistol",
    ammoInMag: defaultW.magSize,
    reserveAmmo: defaultW.maxAmmo,
    grenades: 3,
    lastGrenadeTime: 0,
    isReloading: false,
    reloadStart: 0,
    reloadUntil: 0,
    lastShot: 0,
    alive: true,
    respawnAt: 0,
    inputs: { up: false, down: false, left: false, right: false, shooting: false }
  };

  socket.on("playerInput", (data) => {
    if (players[socket.id]) {
      players[socket.id].inputs = data;
      players[socket.id].angle = data.angle || 0;
    }
  });

  socket.on("reload", () => {
    const pl = players[socket.id];
    if (pl && pl.alive && !pl.isReloading) {
      const w = WEAPONS[pl.weapon];
      if (pl.ammoInMag < w.magSize && (pl.reserveAmmo > 0 || w.maxAmmo === Infinity)) {
        const now = Date.now();
        pl.isReloading = true;
        pl.reloadStart = now;
        pl.reloadUntil = now + w.reloadTime;
      }
    }
  });

  socket.on("throwGrenade", () => {
    const pl = players[socket.id];
    const now = Date.now();
    if (pl && pl.alive && pl.grenades > 0 && now - pl.lastGrenadeTime >= 1000) {
      pl.grenades--;
      pl.lastGrenadeTime = now;
      const speed = 10;
      grenades.push({
        x: pl.x + Math.cos(pl.angle) * 20,
        y: pl.y + Math.sin(pl.angle) * 20,
        vx: Math.cos(pl.angle) * speed,
        vy: Math.sin(pl.angle) * speed,
        timer: now + 2000,
        owner: pl.id
      });
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

// --- BUCLE DEL SERVIDOR (60 FPS) ---
setInterval(() => {
  const now = Date.now();

  // Actualizar Jugadores
  for (const id in players) {
    const pl = players[id];

    // Control de Reaparición (Vidas Infinitas)
    if (!pl.alive) {
      if (now >= pl.respawnAt) {
        const spawn = getRandomSpawn();
        pl.alive = true;
        pl.health = MAX_HEALTH;
        pl.x = spawn.x;
        pl.y = spawn.y;
        pl.vx = 0; pl.vy = 0;
        pl.weapon = "pistol";
        pl.grenades = 3;
        pl.ammoInMag = WEAPONS.pistol.magSize;
        pl.reserveAmmo = WEAPONS.pistol.maxAmmo;
        pl.isReloading = false;
      }
      continue;
    }

    // Movimiento
    let dx = 0, dy = 0;
    if (pl.inputs.up) dy -= 1;
    if (pl.inputs.down) dy += 1;
    if (pl.inputs.left) dx -= 1;
    if (pl.inputs.right) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      pl.vx += dx * SPEED * 0.4;
      pl.vy += dy * SPEED * 0.4;
    }

    pl.vx = Math.max(-SPEED * 2, Math.min(SPEED * 2, pl.vx));
    pl.vy = Math.max(-SPEED * 2, Math.min(SPEED * 2, pl.vy));

    pl.x += pl.vx;
    pl.y += pl.vy;
    pl.vx *= FRICTION;
    pl.vy *= FRICTION;

    pl.x = Math.max(WALL + SIZE/2, Math.min(WORLD_W - WALL - SIZE/2, pl.x));
    pl.y = Math.max(WALL + SIZE/2, Math.min(WORLD_H - WALL - SIZE/2, pl.y));

    resolveObstacles(pl);

    // Recarga
    if (pl.isReloading && now >= pl.reloadUntil) {
      const w = WEAPONS[pl.weapon];
      const needed = w.magSize - pl.ammoInMag;
      if (w.maxAmmo === Infinity) {
        pl.ammoInMag = w.magSize;
      } else {
        const amount = Math.min(needed, pl.reserveAmmo);
        pl.ammoInMag += amount;
        pl.reserveAmmo -= amount;
      }
      pl.isReloading = false;
    }

    // Disparo
    if (pl.inputs.shooting && !pl.isReloading) {
      const w = WEAPONS[pl.weapon];
      if (pl.ammoInMag <= 0) {
        if (!pl.isReloading && (pl.reserveAmmo > 0 || w.maxAmmo === Infinity)) {
          pl.isReloading = true;
          pl.reloadStart = now;
          pl.reloadUntil = now + w.reloadTime;
        }
      } else if (now - pl.lastShot >= w.rate) {
        pl.lastShot = now;
        pl.ammoInMag -= 1;

        for (let i = 0; i < w.pellets; i++) {
          const spreadAngle = pl.angle + (Math.random() - 0.5) * w.spread;
          const dirX = Math.cos(spreadAngle);
          const dirY = Math.sin(spreadAngle);

          bullets.push({
            x: pl.x + dirX * w.barrelLength,
            y: pl.y + dirY * w.barrelLength,
            dx: dirX, dy: dirY,
            speed: w.speed, dmg: w.dmg,
            owner: pl.id, color: w.bulletColor
          });
        }
        pl.vx -= Math.cos(pl.angle) * w.recoil;
        pl.vy -= Math.sin(pl.angle) * w.recoil;
      }
    }

    // Recoger ítems
    crates.forEach(c => {
      if (!c.active) {
        if (now >= c.respawnAt) {
          let randomPt = weaponSpawnPoints[Math.floor(Math.random() * weaponSpawnPoints.length)];
          c.x = randomPt.x; c.y = randomPt.y;
          c.active = true;
        }
      } else if (rectsOverlap(pl.x-SIZE/2, pl.y-SIZE/2, SIZE, SIZE, c.x-15, c.y-15, 30, 30)) {
        pl.weapon = c.weapon;
        const w = WEAPONS[c.weapon];
        pl.ammoInMag = w.magSize;
        pl.reserveAmmo = w.maxAmmo;
        pl.isReloading = false;
        c.active = false;
        c.respawnAt = now + 12000;
      }
    });

    ammoSupplyBoxes.forEach(s => {
      if (!s.active) {
        if (now >= s.respawnAt) s.active = true;
      } else if (rectsOverlap(pl.x-SIZE/2, pl.y-SIZE/2, SIZE, SIZE, s.x-13, s.y-13, 26, 26)) {
        const w = WEAPONS[pl.weapon];
        if (s.type === "ammo" && w.maxAmmo !== Infinity && pl.reserveAmmo < w.maxAmmo) {
          pl.reserveAmmo = w.maxAmmo;
          s.active = false; s.respawnAt = now + 10000;
        } else if (s.type === "grenade" && pl.grenades < 5) {
          pl.grenades = Math.min(5, pl.grenades + 2);
          s.active = false; s.respawnAt = now + 12000;
        }
      }
    });

    medkits.forEach(m => {
      if (!m.active) {
        if (now >= m.respawnAt) m.active = true;
      } else if (rectsOverlap(pl.x-SIZE/2, pl.y-SIZE/2, SIZE, SIZE, m.x-13, m.y-13, 26, 26)) {
        if (pl.health < MAX_HEALTH) {
          pl.health = Math.min(MAX_HEALTH, pl.health + 40);
          m.active = false; m.respawnAt = now + 15000;
        }
      }
    });
  }

  // Actualizar Balas
  bullets = bullets.filter(b => {
    b.x += b.dx * b.speed;
    b.y += b.dy * b.speed;

    if (b.x < 0 || b.x > WORLD_W || b.y < 0 || b.y > WORLD_H) return false;

    const allObstacles = [...obstacles, ...rocks];
    for (const o of allObstacles) {
      if (b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h) return false;
    }

    for (const id in players) {
      const target = players[id];
      if (target.id !== b.owner && target.alive && Math.hypot(b.x - target.x, b.y - target.y) < SIZE/2 + 4) {
        target.health -= b.dmg;
        if (target.health <= 0) {
          target.alive = false;
          target.health = 0;
          target.respawnAt = now + RESPAWN_DELAY;
        }
        return false;
      }
    }
    return true;
  });

  // Actualizar Granadas y Explosiones
  grenades = grenades.filter(g => {
    g.x += g.vx; g.y += g.vy;
    g.vx *= 0.92; g.vy *= 0.92;

    if (now >= g.timer) {
      explosions.push({ x: g.x, y: g.y, radius: 85, until: now + 300 });
      for (const id in players) {
        const pl = players[id];
        if (!pl.alive) continue;
        const dist = Math.hypot(g.x - pl.x, g.y - pl.y);
        if (dist < 95) {
          const dmg = Math.round((1 - dist / 95) * 80);
          pl.health -= dmg;
          if (pl.health <= 0) {
            pl.alive = false;
            pl.health = 0;
            pl.respawnAt = now + RESPAWN_DELAY;
          }
        }
      }
      return false;
    }
    return true;
  });

  explosions = explosions.filter(e => now < e.until);

  // Emitir estado a todos los clientes
  io.emit("gameState", {
    players,
    bullets,
    grenades,
    explosions,
    crates,
    ammoSupplyBoxes,
    medkits,
    houses,
    obstacles,
    rocks,
    bushes,
    world: { w: WORLD_W, h: WORLD_H }
  });
}, 1000 / 30);

server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
