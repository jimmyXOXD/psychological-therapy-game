import React, { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { Worldview } from '../types';
import { logTelemetry } from '../firebase';

interface Props {
  worldview: Worldview;
  sessionId: string;
  isUnlocked: boolean;
  isPaused: boolean;
  onInteractPrimal: () => void;
  onGameOver: () => void;
  debateAttempt: number;
  onCollectSpecialItem: (itemIndex: number) => void;
  collectedItems: boolean[];
}

// Value Noise functions for organic background
function hash2d(x: number, y: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const tx = fx * fx * (3.0 - 2.0 * fx);
  const ty = fy * fy * (3.0 - 2.0 * fy);

  const v1 = hash2d(ix, iy);
  const v2 = hash2d(ix + 1, iy);
  const v3 = hash2d(ix, iy + 1);
  const v4 = hash2d(ix + 1, iy + 1);

  const i1 = lerp(v1, v2, tx);
  const i2 = lerp(v3, v4, tx);
  return lerp(i1, i2, ty);
}

function fbm(x: number, y: number) {
  let v = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < 4; i++) {
    v += amp * noise(x * freq, y * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return v;
}

export function GameCanvas({ 
  worldview, 
  sessionId, 
  isUnlocked, 
  isPaused, 
  onInteractPrimal, 
  onGameOver,
  debateAttempt,
  onCollectSpecialItem,
  collectedItems
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tasksDone, setTasksDone] = useState(false);
  const [hudMsg, setHudMsg] = useState("");
  const [hearts, setHearts] = useState(3);

  const enemyImgRef = useRef<HTMLImageElement | null>(null);
  const strangerImgRef = useRef<HTMLImageElement | null>(null);
  const queenImgRef = useRef<HTMLImageElement | null>(null);
  const heroImgRef = useRef<HTMLImageElement | null>(null);
  const primalImgRef = useRef<HTMLImageElement | null>(null);
  const rabbitHoleImgRef = useRef<HTMLImageElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cheshireCatImgRef = useRef<HTMLImageElement | null>(null);
  const heroWithCatImgRef = useRef<HTMLImageElement | null>(null);
  const caterpillarImgRef = useRef<HTMLImageElement | null>(null);
  const heroWithCaterpillarImgRef = useRef<HTMLImageElement | null>(null);
  const grassBladesRef = useRef<any[]>([]);

  useEffect(() => {
    const i1 = new Image();
    i1.src = '/enemy.png';
    i1.onload = () => enemyImgRef.current = i1;

    const i2 = new Image();
    i2.src = '/stranger.png';
    i2.onload = () => strangerImgRef.current = i2;

    const i3 = new Image();
    i3.src = '/queen.png';
    i3.onload = () => queenImgRef.current = i3;

    const i4 = new Image();
    i4.src = '/hero.png';
    i4.onload = () => heroImgRef.current = i4;

    const i5 = new Image();
    i5.src = '/primal.png';
    i5.onload = () => primalImgRef.current = i5;

    const i6 = new Image();
    i6.src = '/rabbit_hole.png';
    i6.onload = () => rabbitHoleImgRef.current = i6;

    const i7 = new Image();
    i7.src = '/cheshire_cat.png';
    i7.onload = () => { cheshireCatImgRef.current = i7; };

    const i8 = new Image();
    i8.src = '/hero_with_cat.png';
    i8.onload = () => { heroWithCatImgRef.current = i8; };

    const i9 = new Image();
    i9.src = '/caterpillar.png';
    i9.onload = () => { caterpillarImgRef.current = i9; };

    const i10 = new Image();
    i10.src = '/hero_with_caterpillar.png';
    i10.onload = () => { heroWithCaterpillarImgRef.current = i10; };

    // Generate static perlin noise background
    const cvs = document.createElement('canvas');
    const size = 300; 
    cvs.width = size;
    cvs.height = size;
    const ctx = cvs.getContext('2d');
    if (ctx) {
      const imgData = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const v = fbm(x * 0.04, y * 0.04);
          let t = Math.max(0, Math.min(1, (v - 0.22) / 0.48));
          t = t * t * (3.0 - 2.0 * t);
          const r = lerp(48, 12, t);
          const g = lerp(48, 76, t);
          const b = lerp(44, 24, t);
          const idx = (y * size + x) * 4;
          imgData.data[idx] = r;
          imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = b;
          imgData.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      bgCanvasRef.current = cvs;
    }

    // Generate dense, beautifully styled grass blades/quads
    const blades: any[] = [];
    const totalBlades = 15000;
    const CENTER = 3000;
    for (let i = 0; i < totalBlades; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Distribute organically across the play arena (with a radius of up to 2800)
      const distVal = Math.pow(Math.random(), 1.25) * 2800;
      const gx = CENTER + Math.cos(angle) * distVal;
      const gy = CENTER + Math.sin(angle) * distVal;

      const nVal = fbm(gx * 0.005, gy * 0.005);
      
      // Select organic green color palettes matching noise thresholds
      let color = '#15803d';
      if (nVal < 0.35) {
        color = '#14532d'; // cool/dark shadow forest green
      } else if (nVal < 0.5) {
        color = '#166534'; // deep emerald
      } else if (nVal < 0.65) {
        color = '#15803d'; // lush green
      } else if (nVal < 0.8) {
        color = '#1b9a55'; // warm vibrant grass green
      } else {
        color = '#84cc16'; // bright yellow-green accent
      }

      const hash = hash2d(gx, gy);
      let accentType = 'none';
      if (hash < 0.04) {
        accentType = 'buttercup'; // distinct yellow accent flowers
      } else if (hash < 0.09) {
        accentType = 'clover'; // clover patches surrounding the base
      } else if (hash < 0.16) {
        accentType = 'long'; // dual long blades of grass
      }

      const height = 11 + Math.floor(hash2d(gy, gx) * 8);

      blades.push({
        x: gx,
        y: gy,
        height,
        color,
        accentType,
        noiseVal: nVal
      });
    }
    // Sort blades by Y coordinate for perfect 2.5D depth sorted rendering
    blades.sort((a, b) => a.y - b.y);
    grassBladesRef.current = blades;
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    const MAP_SIZE = 6000;
    const CENTER = MAP_SIZE / 2;
    const INNER_RADIUS = 2000;
    const OUTSKIRTS_RADIUS = 2800;
    const CAMERA_ZOOM = 2; // Controls how "personal" or close the camera is to the player

    const state = {
      hearts: 3,
      lastPushedHearts: 3,
      player: { x: CENTER - 500, y: CENTER - 500, targetX: CENTER - 500, targetY: CENTER - 500, speed: 150 },
      entities: [] as any[],
      particles: [] as any[],
      spookyEyes: [] as {x: number, y: number, life: number, maxLife: number}[],
      tasksCompleted: false,
      taskProgress: 0,
      taskMax: 1,
      taskTimer: 0,
      taskState: {} as any,
      clickSpam: 0,
      lastClickNode: null as string | null,
      idleTimer: 0,
      outskirtsLogged: false,
      dead: false,
      primalInteracted: false,
      hasCat: false,
      hasCaterpillar: false,
      invincibilityTimer: 0,
      subjugationSplashes: [] as { x: number, y: number, radius: number }[]
    };

    const spawnEntities = () => {
      const getClearedInnerRadius = () => 150 + Math.random() * (INNER_RADIUS - 150);

      // 1. Hazards based on reason (pressure)
      if (worldview.reason === 'High Environmental') {
        state.entities.push({ type: 'hazard_chaser', x: CENTER + 500, y: CENTER + 500, speed: 100, radius: 15 });
      } else if (worldview.reason === 'Low Environmental') {
        for(let i=0; i<40; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = getClearedInnerRadius();
          state.entities.push({ type: 'hazard_spike', x: CENTER + Math.cos(a)*r, y: CENTER + Math.sin(a)*r, radius: 20 });
        }
      } else if (worldview.reason === 'High Social') {
        for(let i=0; i<25; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = getClearedInnerRadius();
          const ta = Math.random() * Math.PI * 2;
          const tr = getClearedInnerRadius();
          state.entities.push({ type: 'hazard_npc_rand', x: CENTER + Math.cos(a)*r, y: CENTER + Math.sin(a)*r, targetX: CENTER + Math.cos(ta)*tr, targetY: CENTER + Math.sin(ta)*tr, speed: 60, radius: 15 });
        }
      } else if (worldview.reason === 'Low Social') {
        for(let i=0; i<30; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = getClearedInnerRadius();
          state.entities.push({ type: 'hazard_npc_fast', x: CENTER + Math.cos(a)*r, y: CENTER + Math.sin(a)*r, vx: (Math.random()-0.5)*200, vy: (Math.random()-0.5)*200, radius: 15 });
        }
      }

      // 2. Tasks based on fundamental need/pain
      const getRandomPos = () => {
        const a = Math.random() * Math.PI * 2;
        const r = getClearedInnerRadius(); // keep inside outskirts and cleared from center
        return { x: CENTER + Math.cos(a) * r, y: CENTER + Math.sin(a) * r };
      };
      const need = worldview.fundamentalNeed;
      const type = worldview.needType;

      if (need === 'peace') {
        if (type === 'need') {
          state.taskMax = 5;
          for(let i=0; i<5; i++) {
            const p = getRandomPos();
            state.entities.push({ id: `coin_${i}`, type: 'task_coin', x: p.x, y: p.y, radius: 10 });
          }
          setHudMsg("Task: Collect 5 peace coins");
        } else {
          state.taskMax = 1; // just reach center
          for(let i=0; i<50; i++) {
            const p = getRandomPos();
            state.entities.push({ type: 'task_mine', x: p.x, y: p.y, radius: 15 });
          }
          setHudMsg("Task: Reach center while avoiding mines");
        }
      } else if (need === 'wonder') {
        if (type === 'need') {
          state.taskMax = 1;
          const keyIndex = Math.floor(Math.random() * 5);
          for(let i=0; i<5; i++) {
            const p = getRandomPos();
            state.entities.push({ id: `wonder_hole_${i}`, type: 'task_wonder_hole', x: p.x, y: p.y, radius: 25, hasKey: i === keyIndex });
          }
          setHudMsg("Task: Search the 5 glowing rabbit holes to find the key");
        } else {
          state.taskMax = 1;
          state.taskTimer = 60;
          setHudMsg("Task: Escape maze before time runs out");
          // Add maze walls around player
          for(let i=0; i<30; i++) state.entities.push({ type: 'maze_wall', x: (CENTER - 500) + Math.random()*400, y: (CENTER - 500) + Math.random()*400, w: 50, h: 50 });
        }
      } else if (need === 'support') {
        if (type === 'need') {
          state.taskMax = 1;
          state.entities.push({ id: 'friend', type: 'task_running_friend', x: CENTER - 600, y: CENTER - 600, speed: 120, radius: 15 });
          setHudMsg("Task: Catch your running friend");
        } else {
          state.taskTimer = 60;
          state.taskMax = 1;
          const p = getRandomPos();
          state.entities.push({ id: 'hidden_friend', type: 'task_hidden_friend', x: p.x, y: p.y, radius: 15 });
          setHudMsg("Task: Find your hidden friend in 60s");
        }
      } else if (need === 'certainty') {
        if (type === 'need') {
          state.taskMax = 3;
          state.taskState.order = ['blue', 'purple', 'yellow'].sort(() => Math.random() - 0.5);
          state.taskState.progress = 0;
          const trueMarkingIndex = Math.floor(Math.random() * 5);
          for (let i = 0; i < 5; i++) {
             const p = getRandomPos();
             const isTrue = i === trueMarkingIndex;
             const order = isTrue ? state.taskState.order : ['blue', 'purple', 'yellow'].sort(() => Math.random() - 0.5);
             state.entities.push({ id: `marking_${i}`, type: 'task_marking', x: p.x, y: p.y, radius: 30, order, isTrue });
          }
          for (let i = 0; i < 20; i++) {
             const p = getRandomPos();
             const colors = ['blue', 'purple', 'yellow'];
             state.entities.push({ id: `mushroom_${i}`, type: 'task_mushroom', x: p.x, y: p.y, radius: 15, color: colors[i % 3] });
          }
          setHudMsg("Task: Find the true glowing marking and collect mushrooms in its color order");
        } else {
          state.taskMax = 1;
          const p = getRandomPos();
          state.entities.push({ id: 'push_cat', type: 'task_push_cat', x: p.x, y: p.y, radius: 25 });
          setHudMsg("Task: Push the idle cat to the center of the map");
        }
      } else if (need === 'hope') {
        if (type === 'need') {
          state.taskMax = 3;
          for(let i=0; i<3; i++) {
            const p = getRandomPos();
            state.entities.push({ id: `fight_${i}`, type: 'task_fight', x: p.x, y: p.y, radius: 20, hp: 3 });
          }
          setHudMsg("Task: Win 3 fights (Right-click spam)");
        } else {
          state.taskMax = 3;
          for(let i=0; i<3; i++) {
            const p = getRandomPos();
            state.entities.push({ id: `dodge_${i}`, type: 'task_dodge', x: p.x, y: p.y, radius: 20, timer: 10 });
          }
          setHudMsg("Task: Survive 3 dodge arenas");
        }
      } else if (need === 'attention') {
        if (type === 'need') {
          state.taskMax = 3;
          state.taskState.order = ['blue', 'purple', 'yellow'].sort(() => Math.random() - 0.5);
          state.taskState.progress = 0;
          state.entities.push({ id: 'center_marking', type: 'task_marking', x: CENTER, y: CENTER + 100, radius: 30, order: state.taskState.order, isTrue: true });
          
          for (let i = 0; i < 20; i++) {
             const p = getRandomPos();
             const colors = ['blue', 'purple', 'yellow'];
             state.entities.push({ id: `mushroom_${i}`, type: 'task_mushroom', x: p.x, y: p.y, radius: 15, color: colors[i % 3] });
          }
          setHudMsg("Task: Check the center marking and collect mushrooms in that color order");
        } else {
          state.taskMax = 10;
          state.taskState.lastDir = '';
          // trap player
          state.player.x = CENTER; state.player.y = CENTER; state.player.targetX = CENTER; state.player.targetY = CENTER;
          state.entities.push({ id: 'prison_door', type: 'task_prison', x: CENTER, y: CENTER + 150, radius: 40 });
          setHudMsg("Task: Escape prison using alternating L/R clicks on door");
        }
      } else if (need === 'privacy') {
        if (type === 'need') {
          state.taskTimer = 30;
          state.taskMax = 1;
          state.entities.push({ type: 'task_thief', x: CENTER - 200, y: CENTER - 200, speed: 130, radius: 15 });
          setHudMsg("Task: Avoid the thief for 30 seconds");
        } else {
          state.taskMax = 5;
          state.taskState.stash = 0;
          state.entities.push({ id: 'stash', type: 'task_stash', x: CENTER, y: CENTER + 150, radius: 30 });
          for(let i=0; i<15; i++) {
            const p = getRandomPos();
            state.entities.push({ id: `stashcoin_${i}`, type: 'task_coin', x: p.x, y: p.y, radius: 10 });
          }
          state.entities.push({ type: 'task_thief_stealer', x: CENTER - 200, y: CENTER - 200, speed: 100, radius: 15 });
          setHudMsg("Task: Hoard 5 coins in stash before thief steals them");
        }
      }
      
      // Primal Actor Destination
      state.entities.push({ id: 'primal_actor', type: 'primal_actor', x: CENTER, y: CENTER, radius: 50 });
      state.entities.push({ id: 'rabbit_hole', type: 'rabbit_hole', x: CENTER - 40, y: CENTER -80, radius: 40 });

      // Spawn repeating attempt special items near player paths
      if (debateAttempt === 2 && !collectedItems[0]) {
        state.entities.push({
          id: 'special_item_1',
          type: 'special_item_1',
          displayName: 'Shattered Mirror of the Past',
          x: CENTER - 400,
          y: CENTER - 580,
          radius: 18
        });
        setHudMsg("Seek and collect the Shattered Mirror of the Past to help you debate!");
      } else if (debateAttempt === 3 && !collectedItems[1]) {
        state.entities.push({
          id: 'special_item_2',
          type: 'special_item_2',
          displayName: 'Emblem of the Defiant',
          x: CENTER - 280,
          y: CENTER - 420,
          radius: 18
        });
        setHudMsg("Seek and collect the Emblem of the Defiant to help you debate!");
      } else if (debateAttempt === 4 && !collectedItems[2]) {
        state.entities.push({
          id: 'special_item_3',
          type: 'special_item_3',
          displayName: 'Extinction Ledger',
          x: CENTER - 180,
          y: CENTER - 220,
          radius: 18
        });
        setHudMsg("Seek and collect the Extinction Ledger to help you debate!");
      }

      // Spawning decorative trees (scary trees and lush oaks) to fill the forest
      for (let i = 0; i < 200; i++) {
        const tx = Math.random() * MAP_SIZE;
        const ty = Math.random() * MAP_SIZE;
        const distFromCenter = Math.hypot(tx - CENTER, ty - CENTER);
        
        // Avoid starting area and primal actor center area, and keep inside circular map
        const distToStart = Math.hypot(tx - (CENTER - 500), ty - (CENTER - 500));
        if (distToStart > 180 && distFromCenter > 180 && distFromCenter < OUTSKIRTS_RADIUS) {
          state.entities.push({
            id: `tree_${i}`,
            type: Math.random() > 0.45 ? 'tree_scary' : 'tree_oak',
            x: tx,
            y: ty,
            radius: 20,
            scale: 0.75 + Math.random() * 0.45
          });
        }
      }

      // Spawn flowers in the outskirts to intrigue the player
      for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = INNER_RADIUS + Math.random() * (OUTSKIRTS_RADIUS - INNER_RADIUS); // Outskirts area
        state.entities.push({
          id: `outskirt_flower_${i}`,
          type: 'decoration_flower',
          x: CENTER + Math.cos(angle) * r,
          y: CENTER + Math.sin(angle) * r,
          radius: 10,
          isDecoration: true // marked so they don't count towards tasks
        });
      }

      // Spawn decorative glowing mushrooms across the map
      for (let i = 0; i < 150; i++) {
        const mx = Math.random() * MAP_SIZE;
        const my = Math.random() * MAP_SIZE;
        const distFromCenter = Math.hypot(mx - CENTER, my - CENTER);
        const distToStart = Math.hypot(mx - (CENTER - 500), my - (CENTER - 500));
        
        if (distToStart > 120 && distFromCenter < OUTSKIRTS_RADIUS) {
          const colors = ['blue', 'purple', 'yellow'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          state.entities.push({
            id: `decor_mushroom_${i}`,
            type: 'decor_mushroom',
            x: mx,
            y: my,
            radius: 8 + Math.random() * 8,
            scale: 0.6 + Math.random() * 0.8,
            color: color,
            isDecoration: true
          });
        }
      }

      // Spawn caterpillars within the inner border (INNER_RADIUS = 2000)
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 150 + Math.random() * (INNER_RADIUS - 150); // within the inner border and cleared from start center
        state.entities.push({
          id: `caterpillar_${i}`,
          type: 'caterpillar',
          // Location
          x: CENTER + Math.cos(angle) * r,
          y: CENTER + Math.sin(angle) * r,
          radius: 24, // hit radius
          isDecoration: false
        });
      }
    };

    spawnEntities();

    const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);

    const update = (dt: number) => {
      if (state.dead || isPaused) return;

      if (state.invincibilityTimer > 0) {
        state.invincibilityTimer -= dt;
      }

      const tryTakeDamage = (isInstantDeath: boolean = false) => {
        if (state.invincibilityTimer > 0) {
          return;
        }
        if (state.hasCaterpillar) {
          state.hasCaterpillar = false;
          state.invincibilityTimer = 2.0;
          state.subjugationSplashes.push({
            x: state.player.x,
            y: state.player.y,
            radius: 36 + Math.random() * 16
          });
          logTelemetry(sessionId, 'subjugation', { reason: 'caterpillar_killed', x: state.player.x, y: state.player.y });
          setHudMsg("Immunity consumed! The caterpillar protected you from the hazard.");
          return;
        }
        if (isInstantDeath) {
          state.hearts = 0;
        } else {
          state.hearts = Math.max(0, state.hearts - 1);
          state.invincibilityTimer = 1.5;
          setHudMsg("Ouch! Lost 1 Heart.");
        }
      };

      state.idleTimer += dt;
      if (state.idleTimer > 30 && !state.tasksCompleted) {
        logTelemetry(sessionId, 'surrender', { reason: 'idle_30s' });
        state.idleTimer = 0; // log once per 30s
      }

      // Check outskirts (avoidance)
      const distFromCenterPlayer = Math.hypot(state.player.x - CENTER, state.player.y - CENTER);
      if (!state.outskirtsLogged && distFromCenterPlayer > INNER_RADIUS) {
        logTelemetry(sessionId, 'avoidance', { reason: 'reached_outskirts', x: state.player.x, y: state.player.y });
        state.outskirtsLogged = true;
      }

      // Player Movement
      const dx = state.player.targetX - state.player.x;
      const dy = state.player.targetY - state.player.y;
      const d = Math.hypot(dx, dy);
      if (d > 0) {
        const moveDist = state.player.speed * dt;
        if (d <= moveDist) {
          state.player.x = state.player.targetX;
          state.player.y = state.player.targetY;
        } else {
          state.player.x += (dx / d) * moveDist;
          state.player.y += (dy / d) * moveDist;
        }
      }

      // Enforce circular map bounds for player
      const distNew = Math.hypot(state.player.x - CENTER, state.player.y - CENTER);
      if (distNew > OUTSKIRTS_RADIUS) {
        const angle = Math.atan2(state.player.y - CENTER, state.player.x - CENTER);
        state.player.x = CENTER + Math.cos(angle) * OUTSKIRTS_RADIUS;
        state.player.y = CENTER + Math.sin(angle) * OUTSKIRTS_RADIUS;
      }

      // Spooky Eyes Update
      if (Math.random() < 0.005) {
         const isLeft = Math.random() > 0.5;
         // Assume typical screen width ~1200, so edge is roughly +/- 600 from player
         const offsetX = (isLeft ? -(550 + Math.random()*200) : (550 + Math.random()*200)) / CAMERA_ZOOM;
         const offsetY = ((Math.random() - 0.5) * 800) / CAMERA_ZOOM;
         state.spookyEyes.push({
             x: state.player.x + offsetX,
             y: state.player.y + offsetY,
             life: 2 + Math.random() * 2,
             maxLife: 2
         });
      }
      for (let i = state.spookyEyes.length - 1; i >= 0; i--) {
         state.spookyEyes[i].life -= dt;
         if (state.spookyEyes[i].life <= 0) {
            state.spookyEyes.splice(i, 1);
         }
      }
      
      // We read from and mutate state.hp rather than the stale closure 'hp'
      
      // Entities update
      for (let i = state.entities.length - 1; i >= 0; i--) {
        const ent = state.entities[i];
        
        // Hazard Logic
        if (ent.type === 'hazard_chaser') {
          const edx = state.player.x - ent.x;
          const edy = state.player.y - ent.y;
          const ed = Math.hypot(edx, edy);

          if (ent.mode === undefined) ent.mode = 'scan'; // start in scan mode

          if (ent.mode === 'scan') {
            if (ed < 700) { // Large aggro radius
              ent.mode = 'chase';
            } else {
              if (ent.timeToChange === undefined || ent.timeToChange <= 0) {
                ent.timeToChange = -Math.log(Math.random()) * 2; // mean 2s exponential distribution
                const angle = Math.random() * Math.PI * 2;
                ent.vx = Math.cos(angle) * ent.speed;
                ent.vy = Math.sin(angle) * ent.speed;
              }
              ent.timeToChange -= dt;
              ent.x += ent.vx * dt;
              ent.y += ent.vy * dt;
            }
          } else if (ent.mode === 'chase') {
            if (ed > 1000) { // Lose aggro radius
              ent.mode = 'scan';
              ent.timeToChange = 0; // force new direction
            } else if (ed > 0) {
              ent.x += (edx/ed) * ent.speed * dt;
              ent.y += (edy/ed) * ent.speed * dt;
            }
          }

          const chaserDist = Math.hypot(ent.x - CENTER, ent.y - CENTER);
          if (chaserDist > INNER_RADIUS) {
            const angle = Math.atan2(ent.y - CENTER, ent.x - CENTER);
            ent.x = CENTER + Math.cos(angle) * INNER_RADIUS;
            ent.y = CENTER + Math.sin(angle) * INNER_RADIUS;
            if (ent.mode === 'scan') ent.timeToChange = 0;
          }
          if (dist(state.player, ent) < state.player.speed * dt) { // touch
             tryTakeDamage(true);
          }
        }
        if (ent.type === 'hazard_spike') {
          if (dist(state.player, ent) < ent.radius + 10) {
             tryTakeDamage();
          }
        }
        if (ent.type === 'hazard_npc_rand') {
          if (ent.timeToChange === undefined || ent.timeToChange <= 0) {
            ent.timeToChange = -Math.log(Math.random()) * 2;
            const angle = Math.random() * Math.PI * 2;
            ent.vx = Math.cos(angle) * ent.speed;
            ent.vy = Math.sin(angle) * ent.speed;
          }
          ent.timeToChange -= dt;
          ent.x += ent.vx * dt;
          ent.y += ent.vy * dt;

          const hDist = Math.hypot(ent.x - CENTER, ent.y - CENTER);
          if (hDist > OUTSKIRTS_RADIUS) {
            const angle = Math.atan2(ent.y - CENTER, ent.x - CENTER);
            ent.x = CENTER + Math.cos(angle) * (OUTSKIRTS_RADIUS - 1);
            ent.y = CENTER + Math.sin(angle) * (OUTSKIRTS_RADIUS - 1);
            ent.timeToChange = 0;
          }
          if (dist(state.player, ent) < ent.radius + 10) tryTakeDamage(true);
        }
        if (ent.type === 'hazard_npc_fast') {
          if (ent.timeToChange === undefined || ent.timeToChange <= 0) {
            ent.timeToChange = -Math.log(Math.random()) * 2;
            const speed = Math.hypot(ent.vx || 0, ent.vy || 0);
            const targetSpeed = speed || 200;
            const angle = Math.random() * Math.PI * 2;
            ent.vx = Math.cos(angle) * targetSpeed;
            ent.vy = Math.sin(angle) * targetSpeed;
          }
          ent.timeToChange -= dt;
          ent.x += ent.vx * dt;
          ent.y += ent.vy * dt;

          const hDist = Math.hypot(ent.x - CENTER, ent.y - CENTER);
          if (hDist > OUTSKIRTS_RADIUS) {
            const angle = Math.atan2(ent.y - CENTER, ent.x - CENTER);
            ent.x = CENTER + Math.cos(angle) * (OUTSKIRTS_RADIUS - 1);
            ent.y = CENTER + Math.sin(angle) * (OUTSKIRTS_RADIUS - 1);
            ent.timeToChange = 0;
          }
          if (dist(state.player, ent) < ent.radius + 10) {
             tryTakeDamage();
          }
        }

        // Collection/Subjugation of caterpillars
        if (ent.type === 'caterpillar') {
          if (dist(state.player, ent) < ent.radius + 15) {
            if (!state.hasCat) {
              state.hasCaterpillar = true;
              state.entities.splice(i, 1);
              setHudMsg("Caterpillar subjugated! You have immunity to one hazard attack.");
              continue;
            }
          }
        }

        // Task Timers
        if (worldview.fundamentalNeed === 'privacy' && worldview.needType === 'need') {
          if (ent.type === 'task_thief') {
            const edx = state.player.x - ent.x;
            const edy = state.player.y - ent.y;
            const ed = Math.hypot(edx, edy);
            if (ed > 0) {
              ent.x += (edx/ed) * ent.speed * dt;
              ent.y += (edy/ed) * ent.speed * dt;
            }
            const thiefDist = Math.hypot(ent.x - CENTER, ent.y - CENTER);
            if (thiefDist > INNER_RADIUS) {
              const angle = Math.atan2(ent.y - CENTER, ent.x - CENTER);
              ent.x = CENTER + Math.cos(angle) * INNER_RADIUS;
              ent.y = CENTER + Math.sin(angle) * INNER_RADIUS;
            }
            if (dist(state.player, ent) < 20) tryTakeDamage();
          }
        }
        
          if (ent.type === 'task_running_friend') {
            const edx = ent.x - state.player.x;
            const edy = ent.y - state.player.y;
            const ed = Math.hypot(edx, edy);
            if (ed < 400 && ed > 0) {
              ent.x += (edx/ed) * ent.speed * dt;
              ent.y += (edy/ed) * ent.speed * dt;
            } else {
              ent.x += (Math.random() - 0.5) * ent.speed * dt;
              ent.y += (Math.random() - 0.5) * ent.speed * dt;
            }
          }

          // Enforce circular boundary for entities (restrict support friends to INNER_RADIUS)
          const entDistCenter = Math.hypot(ent.x - CENTER, ent.y - CENTER);
          const maxRadius = (ent.type === 'task_running_friend' || ent.type === 'task_hidden_friend') ? INNER_RADIUS : OUTSKIRTS_RADIUS;
          if (entDistCenter > maxRadius) {
            const angle = Math.atan2(ent.y - CENTER, ent.x - CENTER);
            ent.x = CENTER + Math.cos(angle) * maxRadius;
            ent.y = CENTER + Math.sin(angle) * maxRadius;
          }

        // Collection of repeating attempt special items
        if (ent.type === 'special_item_1' || ent.type === 'special_item_2' || ent.type === 'special_item_3') {
          if (dist(state.player, ent) < ent.radius + 15) {
            const idx = ent.type === 'special_item_1' ? 0 : ent.type === 'special_item_2' ? 1 : 2;
            state.entities.splice(i, 1);
            onCollectSpecialItem(idx);
            setHudMsg(`Collected: ${ent.displayName}! Proceed to debate the Primal Actor.`);
            continue;
          }
        }

        // Automatic collection
        if (!state.tasksCompleted) {
          if ((ent.type === 'task_coin' || ent.type === 'task_key' || ent.type === 'task_resource' || ent.type === 'task_hidden_friend' || ent.type === 'task_running_friend') && !ent.isDecoration) {
            if (dist(state.player, ent) < ent.radius + 15) {
              state.taskProgress++;
              if (ent.type === 'task_hidden_friend' || ent.type === 'task_running_friend') {
                state.hasCat = true;
                state.hasCaterpillar = false; // catching the cat friend removes caterpillar and its immunity
              }
              state.entities.splice(i, 1);
            }
          }
          if (ent.type === 'task_wonder_hole') {
            if (dist(state.player, ent) < ent.radius + 15) {
              if (ent.hasKey) {
                 state.taskProgress++;
                 setHudMsg("You found the key!");
              } else {
                 setHudMsg("This hole is empty...");
              }
              state.entities.splice(i, 1);
            }
          }
          if (ent.type === 'task_mushroom') {
            if (dist(state.player, ent) < ent.radius + 15) {
              const expectedColor = state.taskState.order[state.taskState.progress];
              if (ent.color === expectedColor) {
                 state.taskState.progress++;
                 setHudMsg(`Correct! Found ${ent.color}. Next: ${state.taskState.order[state.taskState.progress] || 'Done!'}`);
                 if (state.taskState.progress >= 3) {
                    state.taskProgress = 3; // Finished
                 }
              } else {
                 state.taskState.progress = 0;
                 setHudMsg(`Wrong color! Needed ${expectedColor}. Sequence reset.`);
              }
              state.entities.splice(i, 1);
            }
          }
          if (ent.type === 'task_push_cat') {
            const d = dist(state.player, ent);
            if (d < ent.radius + 40) {
               const dx = ent.x - state.player.x;
               const dy = ent.y - state.player.y;
               const len = Math.hypot(dx, dy) || 1;
               ent.x += (dx/len) * 200 * dt;
               ent.y += (dy/len) * 200 * dt;
            }
            if (Math.hypot(ent.x - CENTER, ent.y - CENTER) < 100) {
               state.taskProgress = 1; // Done
            }
          }
          if (ent.type === 'task_mine') {
            if (dist(state.player, ent) < ent.radius + 15) {
               tryTakeDamage();
               state.entities.splice(i, 1);
            }
          }
        }

        // Evaluate task completion
        if (state.taskProgress >= state.taskMax && !state.tasksCompleted) {
          state.tasksCompleted = true;
          setTasksDone(true);
          setHudMsg("Tasks complete. Approach and Right-Click the Primal Actor.");
        }

        // Auto-trigger primal actor if close enough and tasks done
        if (ent.type === 'primal_actor' && state.tasksCompleted && !isUnlocked && dist(state.player, ent) < ent.radius + 20 && !state.primalInteracted) {
          if (debateAttempt > 1 && !collectedItems[debateAttempt - 2]) {
            const itemNames = ["Shattered Mirror of the Past", "Emblem of the Defiant", "Extinction Ledger"];
            setHudMsg(`Primal Actor's resolve is too strong. Seek the ${itemNames[debateAttempt - 2]} in the forest first!`);
            // Prevent getting stuck in a loop by shifting player target slightly away
            const shiftX = state.player.x > ent.x ? 25 : -25;
            const shiftY = state.player.y > ent.y ? 25 : -25;
            state.player.x += shiftX;
            state.player.y += shiftY;
            state.player.targetX = state.player.x;
            state.player.targetY = state.player.y;
          } else {
            state.primalInteracted = true;
            onInteractPrimal();
          }
        }
      }

      if (state.hearts <= 0 && !state.dead) {
         state.dead = true;
         setHudMsg("You succumbed to despair. Refresh to try again.");
         onGameOver();
      }
      
      if (state.hearts !== state.lastPushedHearts) {
         setHearts(Math.max(0, state.hearts));
         state.lastPushedHearts = state.hearts;
      }
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, targetX: number, targetY: number) => {
      ctx.save();
      ctx.translate(x, y);

      // Flash player transparency during invincibility grace periods
      if (state.invincibilityTimer > 0) {
        ctx.globalAlpha = 0.4 + Math.sin(performance.now() * 0.03) * 0.3;
      }

      const isWalking = Math.hypot(targetX - x, targetY - y) > 5;
      const bob = isWalking ? Math.sin(performance.now() * 0.015) * 3 : 0;
      const angle = isWalking ? Math.sin(performance.now() * 0.01) * 0.05 : 0;
      ctx.rotate(angle);

      // Draw shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 15, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Determine correct image
      let img = heroImgRef.current;
      const wantWithCat = state.hasCat;
      const wantWithCaterpillar = state.hasCaterpillar;

      if (wantWithCat && heroWithCatImgRef.current && heroWithCatImgRef.current.complete && heroWithCatImgRef.current.naturalWidth > 0) {
        img = heroWithCatImgRef.current;
      } else if (wantWithCaterpillar && heroWithCaterpillarImgRef.current && heroWithCaterpillarImgRef.current.complete && heroWithCaterpillarImgRef.current.naturalWidth > 0) {
        img = heroWithCaterpillarImgRef.current;
      }

      if (img && img.complete && img.naturalWidth > 0) {
        const h = 70; 
        const w = h * (img.width / img.height);
        ctx.translate(0, bob);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        // Fallback drawing
        ctx.fillStyle = '#1e110a';
        ctx.fillRect(-5, 10 + bob/2, 3, 5);
        ctx.fillRect(2, 10 + bob/2, 3, 5);
        ctx.fillStyle = '#2b78c5';
        ctx.beginPath();
        ctx.moveTo(-11, 11 + bob);
        ctx.lineTo(11, 11 + bob);
        ctx.lineTo(6, -8 + bob);
        ctx.lineTo(-6, -8 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -8 + bob, 8, 11);
        ctx.beginPath();
        ctx.arc(0, -8 + bob, 4, 0, Math.PI, true);
        ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, -17 + bob, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffdbb5';
        ctx.beginPath();
        ctx.arc(0, -15 + bob, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-9, -19 + bob, 4, 10);
        ctx.fillRect(5, -19 + bob, 4, 10);
        ctx.fillRect(-8, -22 + bob, 16, 5);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(-7, -23 + bob);
        ctx.lineTo(-1, -20 + bob);
        ctx.lineTo(-7, -17 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(7, -23 + bob);
        ctx.lineTo(1, -20 + bob);
        ctx.lineTo(7, -17 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -20 + bob, 2.5, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffdbb5';
        ctx.beginPath();
        ctx.arc(-8, -1 + bob, 2.5, 0, Math.PI*2);
        ctx.arc(8, -1 + bob, 2.5, 0, Math.PI*2);
        ctx.fill();

        // Draw procedural cat on shoulder if player has cat and image failed to load!
        if (state.hasCat) {
          ctx.save();
          ctx.translate(12, -8 + bob);
          ctx.fillStyle = '#8a2be2'; // Purple Cheshire cat
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          // Ears
          ctx.beginPath();
          ctx.moveTo(-4, -3); ctx.lineTo(-6, -9); ctx.lineTo(-1, -4); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(4, -3); ctx.lineTo(6, -9); ctx.lineTo(1, -4); ctx.closePath(); ctx.fill();
          // Cyan eyes
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(-3, -2, 2, 2);
          ctx.fillRect(1, -2, 2, 2);
          // Tail
          ctx.strokeStyle = '#8a2be2';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 4);
          ctx.quadraticCurveTo(8, 6, 6, -2);
          ctx.stroke();
          ctx.restore();
        }

        // Draw procedural caterpillar on shoulder if player has caterpillar and image failed to load!
        if (state.hasCaterpillar) {
          ctx.save();
          ctx.translate(-12, -8 + bob);
          // Overlapping green segments
          ctx.fillStyle = '#4ade80';
          for (let s = 2; s >= 0; s--) {
            ctx.beginPath();
            ctx.arc(-s * 2.5, Math.sin(performance.now() * 0.015 + s * 1.5) * 1, 3.5 - s * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Head
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(3, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          // Antennae
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(2, -3);
          ctx.lineTo(4, -7);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
    };

    const drawEntity = (ctx: CanvasRenderingContext2D, ent: any) => {
      ctx.save();
      ctx.translate(ent.x, ent.y);

      const time = performance.now();

      if (ent.type === 'primal_actor') {
        const bob = Math.sin(time * 0.003) * 2;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 25, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (primalImgRef.current) {
          const img = primalImgRef.current;
          const h = 70; 
          const w = h * (img.width / img.height);
          ctx.save();
          ctx.translate(0, bob);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        } else {
          // Draw White Rabbit with Waistcoat and Pocket Watch (lover.png)
          // Ears (white outer, pink inner)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(-8, -35 + bob, 5, 18, -0.1, 0, Math.PI*2);
          ctx.ellipse(8, -35 + bob, 5, 18, 0.1, 0, Math.PI*2);
          ctx.fill();

          ctx.fillStyle = '#ffb3c1';
          ctx.beginPath();
          ctx.ellipse(-8, -33 + bob, 2.5, 13, -0.1, 0, Math.PI*2);
          ctx.ellipse(8, -33 + bob, 2.5, 13, 0.1, 0, Math.PI*2);
          ctx.fill();

          // Feet (white)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(-10, 22 + bob/2, 8, 5, 0, 0, Math.PI*2);
          ctx.ellipse(10, 22 + bob/2, 8, 5, 0, 0, Math.PI*2);
          ctx.fill();

          // Waistcoat / Torso (crimson/red with gold pocket chain)
          ctx.fillStyle = '#aa1c2e'; // Rich waistcoat crimson
          ctx.beginPath();
          ctx.moveTo(-15, 20 + bob);
          ctx.lineTo(15, 20 + bob);
          ctx.lineTo(12, -10 + bob);
          ctx.lineTo(-12, -10 + bob);
          ctx.closePath();
          ctx.fill();

          // White collar/ruffle
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-8, -10 + bob);
          ctx.lineTo(8, -10 + bob);
          ctx.lineTo(0, -2 + bob);
          ctx.closePath();
          ctx.fill();

          // Pocket watch chain detail (gold arc)
          ctx.strokeStyle = '#d4af37'; // gold
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(6, 8 + bob, 4, 0, Math.PI);
          ctx.stroke();

          // Head (white)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -16 + bob, 14, 0, Math.PI*2);
          ctx.fill();

          // Rabbit face (eyes, pink nose)
          ctx.fillStyle = '#ff4d6d'; // Pink rabbit eyes
          ctx.beginPath();
          ctx.arc(-5, -18 + bob, 2, 0, Math.PI*2);
          ctx.arc(5, -18 + bob, 2, 0, Math.PI*2);
          ctx.fill();

          ctx.fillStyle = '#ffb3c1'; // pink nose
          ctx.beginPath();
          ctx.moveTo(-2, -14 + bob);
          ctx.lineTo(2, -14 + bob);
          ctx.lineTo(0, -11 + bob);
          ctx.closePath();
          ctx.fill();

          // Draw the gold pocket watch in hand
          ctx.fillStyle = '#ffffff'; // white paw holding watch
          ctx.beginPath();
          ctx.arc(14, 4 + bob, 4, 0, Math.PI*2);
          ctx.fill();

          ctx.fillStyle = '#d4af37'; // Gold pocket watch
          ctx.beginPath();
          ctx.arc(18, 12 + bob, 5, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = '#ffffff'; // watch face
          ctx.beginPath();
          ctx.arc(18, 12 + bob, 3.5, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = '#111111'; // hands
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(18, 12 + bob); ctx.lineTo(18, 10 + bob);
          ctx.moveTo(18, 12 + bob); ctx.lineTo(20, 12 + bob);
          ctx.stroke();
        }

        // Unlock ring indicator
        if (!isUnlocked) {
          ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 15, 60, 0, Math.PI*2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 15, 60, 0, Math.PI*2);
          ctx.stroke();
        }

      } else if (ent.type === 'rabbit_hole') {
        if (rabbitHoleImgRef.current) {
          const img = rabbitHoleImgRef.current;
          const h = 200; // Primal character is h=70, so twice as large is h=140
          const w = h * (img.width / img.height);
          ctx.save();
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      } else if (ent.type === 'tree_scary') {
        // Scary twisted dead tree (scary tree.jfif)
        const sc = ent.scale || 1;
        ctx.scale(sc, sc);

        // Shadow
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 35, 10, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // Spiraling trunk (twisted cool grays)
        ctx.fillStyle = '#3a4146'; // trunk gray
        ctx.strokeStyle = '#1e2224'; // bark lines
        ctx.lineWidth = 3;

        // Draw twisted roots and trunk
        ctx.beginPath();
        ctx.moveTo(-15, 5);
        ctx.quadraticCurveTo(-20, -40, -10, -70);
        ctx.lineTo(10, -70);
        ctx.quadraticCurveTo(20, -40, 15, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw spiral ridges on trunk
        ctx.beginPath();
        ctx.moveTo(-10, -10); ctx.quadraticCurveTo(5, -25, -5, -45);
        ctx.moveTo(-5, -30); ctx.quadraticCurveTo(10, -45, 0, -65);
        ctx.stroke();

        // Branches
        ctx.strokeStyle = '#3a4146';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Left Branch
        ctx.moveTo(-5, -60); ctx.quadraticCurveTo(-25, -80, -35, -110);
        // Right Branch
        ctx.moveTo(5, -60); ctx.quadraticCurveTo(25, -80, 35, -110);
        ctx.stroke();

        // Dark sparse foliage clumps
        ctx.fillStyle = '#1c2124'; // eerie dark color
        ctx.beginPath(); ctx.arc(-35, -115, 25, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(35, -115, 25, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -130, 30, 0, Math.PI*2); ctx.fill();

      } else if (ent.type === 'tree_oak') {
        // Lush golden twisted oak (1696x2528_oak.jfif)
        const sc = ent.scale || 1;
        ctx.scale(sc, sc);

        // Shadow
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 45, 12, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // Warm brown twisted trunk
        ctx.fillStyle = '#5c4033'; // deep warm brown
        ctx.strokeStyle = '#2b1e17'; // darker lines
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-20, 5);
        ctx.quadraticCurveTo(-25, -30, -12, -60);
        ctx.lineTo(12, -60);
        ctx.quadraticCurveTo(25, -30, 20, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Branches
        ctx.strokeStyle = '#5c4033';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-8, -50); ctx.quadraticCurveTo(-30, -75, -45, -95);
        ctx.moveTo(8, -50); ctx.quadraticCurveTo(30, -75, 45, -95);
        ctx.stroke();

        // Gorgeous golden yellow leaves clumps
        ctx.fillStyle = '#f4c430'; // primary golden yellow
        ctx.beginPath(); ctx.arc(-45, -100, 35, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(45, -100, 35, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -120, 45, 0, Math.PI*2); ctx.fill();

        // Highlights in brighter gold
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(-45, -105, 22, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(45, -105, 22, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -128, 30, 0, Math.PI*2); ctx.fill();

      } else if (ent.type === 'hazard_spike' || ent.type === 'task_mine') {
        // Spike Bush (spike bush.jfif)
        const sway = Math.sin(time * 0.002 + ent.x) * 1.5;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 22, 8, 0, 0, Math.PI*2);
        ctx.fill();

        // Olive green core base
        ctx.fillStyle = '#2d3d2a';
        ctx.beginPath();
        ctx.arc(sway, 0, 20, 0, Math.PI*2);
        ctx.fill();

        // Tangled dark vines
        ctx.strokeStyle = '#1e2a1b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sway, -2, 16, 0, Math.PI*2);
        ctx.stroke();

        // Spikes / Thorns (sharp white/silver arrows)
        ctx.fillStyle = '#e4e7e4';
        ctx.strokeStyle = '#1e2a1b';
        ctx.lineWidth = 1;

        const spikeDirs = [
          { dx: -22, dy: -8 }, { dx: -18, dy: -18 }, { dx: 0, dy: -24 },
          { dx: 18, dy: -18 }, { dx: 22, dy: -8 }, { dx: -10, dy: -12 },
          { dx: 10, dy: -12 }
        ];

        spikeDirs.forEach(sp => {
          ctx.save();
          ctx.translate(sp.dx + sway, sp.dy);
          const angle = Math.atan2(sp.dy, sp.dx);
          ctx.rotate(angle);
          
          // Draw thorn triangle
          ctx.beginPath();
          ctx.moveTo(0, -4);
          ctx.lineTo(8, 0);
          ctx.lineTo(0, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

      } else if (ent.type === 'hazard_chaser' || ent.type === 'hazard_npc_rand' || ent.type === 'hazard_npc_fast') {
        let imgRef;
        if (ent.type === 'hazard_chaser') {
          imgRef = enemyImgRef.current;
        } else if (ent.type === 'hazard_npc_rand') {
          imgRef = queenImgRef.current;
        } else if (ent.type === 'hazard_npc_fast') {
          imgRef = strangerImgRef.current;
        }

        if (imgRef) {
          let freq = 0.003;
          if (ent.type === 'hazard_chaser' || ent.type === 'hazard_npc_rand') {
            freq = 0.0015;
          }
          const sway = Math.sin(time * freq + ent.x) * 4;
          let h = ent.radius * 4;
          if (ent.type === 'hazard_chaser' || ent.type === 'hazard_npc_rand') {
            h *= 2;
          }
          const w = h * (imgRef.width / imgRef.height);
          ctx.save();
          ctx.translate(sway, 0);
          ctx.drawImage(imgRef, -w / 2, -h / 2, w, h);
          ctx.restore();
        } else {
          // Eerie Flower (eerie flower.png)
          const pulse = Math.sin(time * 0.005 + ent.x) * 0.1 + 1;
          const sway = Math.sin(time * 0.003 + ent.x) * 4;

          // Stem
          ctx.strokeStyle = '#4a154b'; // eerie purple stem
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, 15);
          ctx.quadraticCurveTo(sway/2, 0, sway, -15);
          ctx.stroke();

          // Spooky leaves at base
          ctx.fillStyle = '#1e0521';
          ctx.beginPath();
          ctx.ellipse(-10, 10, 8, 4, -0.3, 0, Math.PI*2);
          ctx.ellipse(10, 10, 8, 4, 0.3, 0, Math.PI*2);
          ctx.fill();

          // Spooky magenta outer glowing petals
          ctx.fillStyle = '#ff0055';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff0055';
          ctx.save();
          ctx.translate(sway, -15);
          ctx.scale(pulse, pulse);

          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.save();
            ctx.rotate(a);
            ctx.beginPath();
            ctx.ellipse(14, 0, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Dark glowing center
          ctx.fillStyle = '#110008';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = '#ff0055';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
          ctx.shadowBlur = 0;
        }
      } else if (ent.type === 'task_coin') {
        // Yellow Flower (28x43 Flower 9 - YELLOW.png)
        const sway = Math.sin(time * 0.004 + ent.x) * 2;

        // Stem
        ctx.strokeStyle = '#1e4d2b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.quadraticCurveTo(sway/2, 0, sway, -10);
        ctx.stroke();

        // Yellow Dandelion petals
        ctx.fillStyle = '#ffd11a'; // bright yellow
        ctx.save();
        ctx.translate(sway, -10);

        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.save();
          ctx.rotate(a);
          ctx.beginPath();
          ctx.ellipse(8, 0, 5, 2, 0, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        }

        // Orange center
        ctx.fillStyle = '#ff7a00';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();

      } else if (ent.type === 'decoration_flower') {
        const sway = Math.sin(time * 0.003 + ent.x) * 2;
        ctx.strokeStyle = '#2d5a27'; // Darker stem
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.quadraticCurveTo(sway/2, 0, sway, -10);
        ctx.stroke();

        ctx.fillStyle = '#ffffff'; // White petals
        ctx.save();
        ctx.translate(sway, -10);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
          ctx.save();
          ctx.rotate(a);
          ctx.beginPath();
          ctx.ellipse(7, 0, 4.5, 2.5, 0, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#ff66b3'; // Pink center
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

      } else if (ent.type === 'task_key') {
        // Blue Flower (43x15 Flower 4 - BLUE.png)
        const sway = Math.sin(time * 0.003 + ent.y) * 2;

        // Stem
        ctx.strokeStyle = '#1e4d2b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.quadraticCurveTo(sway/2, 0, sway, -10);
        ctx.stroke();

        // Blue petals
        ctx.fillStyle = '#3f67e2'; // violet blue
        ctx.save();
        ctx.translate(sway, -10);

        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.save();
          ctx.rotate(a);
          ctx.beginPath();
          ctx.ellipse(9, 0, 6, 3, 0, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        }

        // Glowing center
        ctx.fillStyle = '#ffb3ff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();

      } else if (ent.type === 'task_resource') {
        // Bush 1 - WARM GREEN 2 / TEAL with red berries
        const sway = Math.sin(time * 0.002 + ent.x) * 1.2;

        // Base shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 18, 6, 0, 0, Math.PI*2);
        ctx.fill();

        // Bush foliage (warm olive/green or teal based on ID)
        ctx.fillStyle = ent.id?.includes('1') ? '#2e6b65' : '#4f7c32'; // teal or warm green
        ctx.beginPath();
        ctx.arc(sway - 6, 0, 12, 0, Math.PI*2);
        ctx.arc(sway + 6, 0, 12, 0, Math.PI*2);
        ctx.arc(sway, -6, 14, 0, Math.PI*2);
        ctx.fill();

        // Red Berries
        ctx.fillStyle = '#d92b2b';
        const berries = [
          { x: -5, y: -2 }, { x: 5, y: -4 }, { x: 0, y: -8 },
          { x: -10, y: -6 }, { x: 8, y: 2 }
        ];
        berries.forEach(b => {
          ctx.beginPath();
          ctx.arc(b.x + sway, b.y, 2.5, 0, Math.PI*2);
          ctx.fill();
        });

      } else if (ent.type === 'task_hidden_friend' || ent.type === 'task_running_friend') {
        const bob = Math.sin(time * 0.003 + ent.x) * 4;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 15, 14, 5, 0, 0, Math.PI*2);
        ctx.fill();

        if (cheshireCatImgRef.current && cheshireCatImgRef.current.complete && cheshireCatImgRef.current.naturalWidth > 0) {
          const img = cheshireCatImgRef.current;
          const h = 60;
          const w = h * (img.width / img.height || 1);
          ctx.translate(0, bob);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
          // Keep a neat cute fallback cat shape
          ctx.translate(0, bob);
          ctx.fillStyle = '#8a2be2'; // Purple Cheshire cat
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          // Ears
          ctx.beginPath();
          ctx.moveTo(-10, -5);
          ctx.lineTo(-14, -18);
          ctx.lineTo(-4, -10);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(10, -5);
          ctx.lineTo(14, -18);
          ctx.lineTo(4, -10);
          ctx.closePath();
          ctx.fill();
          // Eyes (Glowing cyan eyes)
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.ellipse(-4, -2, 3, 2, Math.PI/12, 0, Math.PI*2);
          ctx.ellipse(4, -2, 3, 2, -Math.PI/12, 0, Math.PI*2);
          ctx.fill();
          // Cheshire smile (White)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 3, 6, 0.1, Math.PI - 0.1, false);
          ctx.stroke();
        }

      } else if (ent.type === 'task_wonder_hole') {
        if (rabbitHoleImgRef.current) {
          const img = rabbitHoleImgRef.current;
          const h = 200;
          const w = h * (img.width / img.height);
          ctx.save();
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#d946ef';
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      } else if (ent.type === 'task_push_cat') {
        if (cheshireCatImgRef.current) {
          const img = cheshireCatImgRef.current;
          const h = 100;
          const w = h * (img.width / img.height);
          ctx.save();
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00a8ff';
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      } else if (ent.type === 'task_marking') {
        ctx.save();
        if (ent.isTrue) {
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#fef08a';
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw the color sequence (blue, purple, yellow)
        if (ent.order) {
           ent.order.forEach((colorStr: string, idx: number) => {
             const cx = -12 + idx * 12;
             const cy = 0;
             let colorCode = '#ffffff';
             if (colorStr === 'blue') colorCode = '#3b82f6';
             if (colorStr === 'purple') colorCode = '#a855f7';
             if (colorStr === 'yellow') colorCode = '#eab308';
             ctx.fillStyle = colorCode;
             ctx.beginPath();
             ctx.arc(cx, cy, 6, 0, Math.PI * 2);
             ctx.fill();
           });
        }
        ctx.restore();
      } else if (ent.type === 'decor_mushroom' || ent.type === 'task_mushroom') {
        const sc = ent.scale || 1.0;
        ctx.scale(sc, sc);

        const pulse = Math.sin(time * 0.003 + ent.x) * 0.08 + 1;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 12, 4, 0, 0, Math.PI*2);
        ctx.fill();

        // Pale stalk
        ctx.fillStyle = '#f0f4f8';
        ctx.beginPath();
        ctx.moveTo(-3, 10);
        ctx.lineTo(-2, -2);
        ctx.lineTo(2, -2);
        ctx.lineTo(3, 10);
        ctx.closePath();
        ctx.fill();

        // Glowing Cap based on color
        let capColor = '#00a8ff'; // blue
        if (ent.color === 'purple') capColor = '#b800ff';
        else if (ent.color === 'yellow') capColor = '#ffdf00';

        ctx.fillStyle = capColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = capColor;
        
        ctx.save();
        ctx.translate(0, -2);
        ctx.scale(pulse, pulse);

        // Cap arc
        ctx.beginPath();
        ctx.arc(0, 0, 10, Math.PI, 0, false);
        ctx.lineTo(10, 2);
        ctx.lineTo(-10, 2);
        ctx.closePath();
        ctx.fill();

        // White spots on cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -4, 1.5, 0, Math.PI*2);
        ctx.arc(4, -5, 1.5, 0, Math.PI*2);
        ctx.arc(0, -8, 1, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;

      } else if (ent.type === 'caterpillar') {
        const bob = 0;
        
        // Shadow (doubled size)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 28, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (caterpillarImgRef.current && caterpillarImgRef.current.complete && caterpillarImgRef.current.naturalWidth > 0) {
          const img = caterpillarImgRef.current;
          const h = 70; // caterpillar image size
          const w = h * (img.width / img.height || 1);
          ctx.translate(0, bob);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
          // Keep a neat procedural cute caterpillar
          ctx.save();
          ctx.translate(0, bob);
          ctx.scale(2, 2); // Doubled scale!
          
          // Draw a segmented worm-like caterpillar body using overlapping green circles
          ctx.fillStyle = '#4ade80'; // bright green
          
          // Tail segments
          for (let s = 4; s >= 0; s--) {
            const segX = -s * 5;
            const segY = 0;
            ctx.beginPath();
            ctx.arc(segX, segY, 6 - s * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw a little yellow stripe on each segment
            ctx.fillStyle = '#eab308'; // yellow
            ctx.beginPath();
            ctx.arc(segX, segY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4ade80'; // revert to green
          }
          
          // Head
          ctx.fillStyle = '#22c55e'; // darker green head
          ctx.beginPath();
          ctx.arc(4, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          
          // Small black eyes on the head
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(6, -2, 1.2, 0, Math.PI * 2);
          ctx.fill();
          
          // Cute little antennae
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(3, -6);
          ctx.quadraticCurveTo(5, -12, 8, -11);
          ctx.stroke();
          ctx.restore();
        }

      } else if (ent.type === 'special_item_1') {
        // Shattered Mirror of the Past (Traumatic Relic)
        // Red glowing cracked heart shape/mirror
        const pulse = Math.sin(time * 0.005) * 0.15 + 1.1;
        ctx.fillStyle = '#ff1a40';
        ctx.strokeStyle = '#3a0007';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff1a40';

        ctx.save();
        ctx.scale(pulse, pulse);
        
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.bezierCurveTo(-8, -14, -16, -6, -16, 2);
        ctx.bezierCurveTo(-16, 12, -4, 20, 0, 26);
        ctx.bezierCurveTo(4, 20, 16, 12, 16, 2);
        ctx.bezierCurveTo(16, -6, 8, -14, 0, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw silver crack lines across the heart
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(0, 4); ctx.lineTo(10, -5);
        ctx.moveTo(0, 4); ctx.lineTo(-2, 14);
        ctx.stroke();

        ctx.restore();
        ctx.shadowBlur = 0;

      } else if (ent.type === 'special_item_2') {
        // Emblem of the Defiant (Heresy Token)
        // Glowing gold shield/star
        const pulse = Math.sin(time * 0.005) * 0.12 + 1.1;
        ctx.fillStyle = '#d4af37'; // gold
        ctx.strokeStyle = '#2b1e00';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';

        ctx.save();
        ctx.scale(pulse, pulse);

        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 16, -Math.sin((18 + i * 72) * Math.PI / 180) * 16);
          ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 7, -Math.sin((54 + i * 72) * Math.PI / 180) * 7);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;

      } else if (ent.type === 'special_item_3') {
        // Extinction Ledger (Apocalypse Fragment)
        // Dark purple crystalline void shard
        const pulse = Math.sin(time * 0.005) * 0.15 + 1.1;
        ctx.fillStyle = '#8a2be2'; // rich dark purple
        ctx.strokeStyle = '#1a0033';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#8a2be2';

        ctx.save();
        ctx.scale(pulse, pulse);

        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(12, -4);
        ctx.lineTo(6, 18);
        ctx.lineTo(-6, 18);
        ctx.lineTo(-12, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw glowing neon purple line down center
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 14);
        ctx.stroke();

        ctx.restore();
        ctx.shadowBlur = 0;

      } else if (ent.type === 'maze_wall') {
        // Draw wood log / stone barrier
        ctx.fillStyle = '#4c2e1b';
        ctx.fillRect(-ent.w/2, -ent.h/2, ent.w, ent.h);
        ctx.strokeStyle = '#231409';
        ctx.lineWidth = 2;
        ctx.strokeRect(-ent.w/2, -ent.h/2, ent.w, ent.h);
        ctx.fillStyle = '#654321';
        ctx.fillRect(-ent.w/2 + 4, -ent.h/2 + 4, ent.w - 8, ent.h - 8);
      } else {
        // Simple default block
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-ent.radius, -ent.radius, ent.radius*2, ent.radius*2);
      }

      ctx.restore();
    };

    const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#0a1a0a'; // dark green forest
      ctx.fillRect(0, 0, width, height);

      // Camera transform
      ctx.save();
      const camX = width / 2 - state.player.x * CAMERA_ZOOM;
      const camY = height / 2 - state.player.y * CAMERA_ZOOM;
      ctx.translate(Math.round(camX), Math.round(camY));
      ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

      // Static Organic Grass
      if (bgCanvasRef.current) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bgCanvasRef.current, 0, 0, MAP_SIZE, MAP_SIZE);
        ctx.restore();
      }

      // Draw yellow splashes (subjugation marks) on the ground
      state.subjugationSplashes.forEach(splash => {
        ctx.save();
        ctx.fillStyle = 'rgba(234, 179, 8, 0.45)'; // beautiful organic translucent yellow splash
        ctx.beginPath();
        ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // draw a few smaller splat drops around it to make it look like an authentic splash!
        ctx.fillStyle = 'rgba(202, 138, 4, 0.6)';
        const numDrops = 6;
        for (let i = 0; i < numDrops; i++) {
          const dropAngle = (i / numDrops) * Math.PI * 2 + (splash.x * 0.15);
          const dropDist = splash.radius * (1.1 + Math.sin(i * 12) * 0.25);
          const dropX = splash.x + Math.cos(dropAngle) * dropDist;
          const dropY = splash.y + Math.sin(dropAngle) * dropDist;
          ctx.beginPath();
          ctx.arc(dropX, dropY, splash.radius * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw Outskirts / Circular Boundary
      ctx.strokeStyle = '#112211';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, INNER_RADIUS, 0, Math.PI * 2); // Outskirts line
      ctx.stroke();

      ctx.strokeStyle = '#220a0a';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, OUTSKIRTS_RADIUS, 0, Math.PI * 2); // Hard boundary line
      ctx.stroke();

      // Dynamic grass rendering with world-space wind, trampling, and perspective compression
      const viewportLeft = state.player.x - (width / 2) / CAMERA_ZOOM;
      const viewportRight = state.player.x + (width / 2) / CAMERA_ZOOM;
      const viewportTop = state.player.y - (height / 2) / CAMERA_ZOOM;
      const viewportBottom = state.player.y + (height / 2) / CAMERA_ZOOM;
      const timeSec = performance.now() * 0.001;

      // Track player and NPC active coordinates for dynamic trampling displacement
      const pushers: any[] = [
        { x: state.player.x, y: state.player.y, radius: 42 }
      ];
      state.entities.forEach(ent => {
        if (ent.type && !ent.isDecoration && (
          ent.type.startsWith('hazard_') || 
          ent.type === 'task_running_friend' ||
          ent.type === 'task_thief'
        )) {
          pushers.push({ x: ent.x, y: ent.y, radius: 30 });
        }
      });

      // Filter visible grass blades inside viewport
      const visibleBlades = grassBladesRef.current.filter(b => 
        b.x >= viewportLeft - 30 &&
        b.x <= viewportRight + 30 &&
        b.y >= viewportTop - 30 &&
        b.y <= viewportBottom + 60
      );

      // Quantized Wind calculations per blade for retro 10 FPS look
      const grassFps = 10; 
      visibleBlades.forEach(blade => {
        // Spatial phase offset to prevent synchronized ticking
        const phaseOffset = (blade.x * 0.08 + blade.y * 0.12);
        const animTime = timeSec + phaseOffset;
        const quantizedTime = Math.floor(animTime * grassFps) / grassFps;

        // Overlapping dual non-repeating noise layers for wind
        const n1 = noise(blade.x * 0.0035 + quantizedTime * 0.85, blade.y * 0.0035 + quantizedTime * 0.45);
        const n2 = noise(blade.x * 0.011 - quantizedTime * 1.5, blade.y * 0.011 + quantizedTime * 1.15);
        const windPower = (n1 * 0.7 + n2 * 0.3) - 0.5; // range: -0.5 to 0.5

        let swayX = windPower * 14;
        let swayY = (Math.sin(quantizedTime * 2.5 + blade.x * 0.01) * 0.1 + windPower * 0.25);

        // Trampling interaction (push outward, snap back smoothly)
        pushers.forEach(p => {
          const dx = blade.x - p.x;
          const dy = blade.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < p.radius && d > 0.1) {
            const force = 1.0 - d / p.radius;
            swayX += (dx / d) * force * 24;
            swayY += (dy / d) * force * 15;
          }
        });

        // Soft caps on displacement to preserve visual pixel fidelity
        swayX = Math.max(-25, Math.min(25, swayX));
        swayY = Math.max(-10, Math.min(10, swayY));

        const bx = blade.x;
        const by = blade.y;
        const h = blade.height;

        // Fake perspective compression
        const compressionFactor = 1.0 - Math.abs(swayX) * 0.11 - Math.max(0, swayY) * 0.16;
        const actualH = h * Math.max(0.4, compressionFactor);
        const topX = bx + swayX;
        const topY = by - actualH;

        // Render blade quads
        ctx.fillStyle = blade.color;
        ctx.beginPath();
        ctx.moveTo(bx - 1.5, by);
        ctx.lineTo(topX - 0.5, topY);
        ctx.lineTo(topX + 0.5, topY);
        ctx.lineTo(bx + 1.5, by);
        ctx.closePath();
        ctx.fill();

        // Accent flora
        if (blade.accentType === 'buttercup') {
          // Yellow buttercup flowers
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(topX - 2.5, topY - 2.5, 4.5, 4.5);
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(topX - 0.5, topY - 0.5, 1.5, 1.5);
        } else if (blade.accentType === 'clover') {
          // Small clover patches at base
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(bx - 3.5, by - 2, 2, 2);
          ctx.fillRect(bx + 1.5, by - 2, 2, 2);
          ctx.fillRect(bx - 1, by - 4, 2, 2);
        } else if (blade.accentType === 'long') {
          // Secondary longer blade
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.moveTo(bx - 0.5, by);
          ctx.lineTo(bx + swayX * 1.35 - 0.5, by - actualH * 1.3);
          ctx.lineTo(bx + swayX * 1.35 + 0.5, by - actualH * 1.3);
          ctx.lineTo(bx + 1.5, by);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Scrolling Cloud Shadows Overlay (continuous 2D world-space noise illusion)
      ctx.save();
      ctx.fillStyle = 'rgba(4, 18, 8, 0.08)'; 
      const shadowTime = timeSec * 0.02; // slow moving cloud speed
      
      const shadowGridSize = 450;
      const sCellXStart = Math.floor(viewportLeft / shadowGridSize) - 1;
      const sCellXEnd = Math.ceil(viewportRight / shadowGridSize) + 1;
      const sCellYStart = Math.floor(viewportTop / shadowGridSize) - 1;
      const sCellYEnd = Math.ceil(viewportBottom / shadowGridSize) + 1;

      for (let cx = sCellXStart; cx <= sCellXEnd; cx++) {
        for (let cy = sCellYStart; cy <= sCellYEnd; cy++) {
          const baseWorldX = cx * shadowGridSize + Math.sin(cx * 1.8 + shadowTime) * 120 + shadowTime * 180;
          const baseWorldY = cy * shadowGridSize + Math.cos(cy * 2.2 + shadowTime * 0.9) * 120 + shadowTime * 90;
          
          ctx.beginPath();
          ctx.arc(baseWorldX, baseWorldY, 160, 0, Math.PI * 2);
          ctx.arc(baseWorldX - 90, baseWorldY + 30, 110, 0, Math.PI * 2);
          ctx.arc(baseWorldX + 80, baseWorldY - 40, 130, 0, Math.PI * 2);
          ctx.arc(baseWorldX + 40, baseWorldY + 70, 110, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Y-SORTED RENDERING LOOP (Entities + Player)
      const drawables = [
        ...state.entities.map(e => ({ ...e, isPlayer: false })),
        { ...state.player, type: 'player', radius: 12, isPlayer: true }
      ];
      drawables.sort((a, b) => a.y - b.y);

      drawables.forEach(item => {
        if (item.isPlayer) {
          drawPlayer(ctx, item.x, item.y, state.player.targetX, state.player.targetY);
        } else {
          drawEntity(ctx, item);
        }
      });

      // HALO LAYER (Draw glows above trees for important objects)
      ctx.globalCompositeOperation = 'screen';
      drawables.forEach(item => {
        const isTask = item.type && item.type.startsWith('task_') && !item.isDecoration;
        const isHazard = item.type && item.type.startsWith('hazard_');
        const isSpecial = item.type && item.type.startsWith('special_item_');
        const isPrimal = item.type === 'primal_actor';
        
        if (isTask || isHazard || isSpecial || isPrimal || item.isPlayer) {
           const haloRadius = (item.radius || 15) * 1 + 50;
           
           let colorOuter = 'rgba(255, 255, 255, 0.0)';
           let colorInner = 'rgba(255, 255, 255, 0.3)';
           if (isHazard) colorInner = 'rgba(255, 50, 50, 0.3)';
           else if (isSpecial) colorInner = 'rgba(200, 100, 255, 0.5)';
           else if (isTask) colorInner = 'rgba(255, 200, 50, 0.3)';
           else if (isPrimal) colorInner = 'rgba(100, 255, 100, 0.3)';
           else if (item.isPlayer) colorInner = 'rgba(255, 255, 255, 0.3)';
           
           const haloGrad = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, haloRadius);
           haloGrad.addColorStop(0, colorInner);
           haloGrad.addColorStop(1, colorOuter);
           
           ctx.beginPath();
           ctx.arc(item.x, item.y, haloRadius, 0, Math.PI * 2);
           ctx.fillStyle = haloGrad;
           ctx.fill();
        }
      });
      ctx.globalCompositeOperation = 'source-over';

      // Lighting (slow color drain / vignette centered on player)

      // const grad = ctx.createRadialGradient(state.player.x, state.player.y, 50 / CAMERA_ZOOM, state.player.x, state.player.y, 600 / CAMERA_ZOOM);
      // grad.addColorStop(0, 'rgba(255, 180, 60, 0.25)');
      // grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      // ctx.fillStyle = grad;
      // const fillW = width / CAMERA_ZOOM + 100;
      // const fillH = height / CAMERA_ZOOM + 100;
      // ctx.fillRect(state.player.x - fillW / 2, state.player.y - fillH / 2, fillW, fillH);

      // second version - lightning with transition from orange to black.
      // Lighting — warm torch glow fading into cool, spooky darkness

      const grad = ctx.createRadialGradient(
          state.player.x,
          state.player.y,
          20 / CAMERA_ZOOM,
          state.player.x,
          state.player.y,
          500 / CAMERA_ZOOM
      );

      grad.addColorStop(0.00, 'rgba(255, 145, 45, 0.30)');   // warm orange core
      grad.addColorStop(0.12, 'rgba(255, 170, 70, 0.27)');
      grad.addColorStop(0.25, 'rgba(255, 195, 105, 0.23)');
      grad.addColorStop(0.40, 'rgba(255, 210, 145, 0.18)');
      grad.addColorStop(0.55, 'rgba(200, 150, 100, 0.10)');  // darken RGB values
      grad.addColorStop(0.68, 'rgba(100, 60, 40, 0.05)');    // almost black, low alpha
      grad.addColorStop(0.80, 'rgba(0, 0, 0, 0.20)');        // pure black, alpha begins to rise
      grad.addColorStop(0.90, 'rgba(0, 0, 0, 0.60)');
      grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.90)');

      ctx.fillStyle = grad;

      const fillW = width / CAMERA_ZOOM + 100;
      const fillH = height / CAMERA_ZOOM + 100;

      ctx.fillRect(
          state.player.x - fillW / 2,
          state.player.y - fillH / 2,
          fillW,
          fillH
      );

      // Draw Spooky Eyes
      state.spookyEyes.forEach(eye => {
          let alpha = 1;
          if (eye.life > eye.maxLife - 0.5) alpha = (eye.maxLife - eye.life) / 0.5;
          else if (eye.life < 0.5) alpha = eye.life / 0.5;
          if (alpha < 0) alpha = 0;
          
          ctx.fillStyle = `rgba(255, 50, 50, ${alpha * 0.8})`;
          ctx.shadowColor = `rgba(255, 50, 50, ${alpha})`;
          ctx.shadowBlur = 15 / CAMERA_ZOOM;
          
          ctx.beginPath();
          ctx.ellipse(eye.x - 8 / CAMERA_ZOOM, eye.y, 2 / CAMERA_ZOOM, 5 / CAMERA_ZOOM, 0, 0, Math.PI*2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.ellipse(eye.x + 8 / CAMERA_ZOOM, eye.y, 2 / CAMERA_ZOOM, 5 / CAMERA_ZOOM, 0, 0, Math.PI*2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
      });

      ctx.restore();

      // Screen space target indicator arrow
      const target = state.entities.find(e => e.type === 'task_running_friend' || e.type === 'task_push_cat');
      if (target) {
         const dx = target.x - state.player.x;
         const dy = target.y - state.player.y;
         const worldDist = Math.hypot(dx, dy);
         
         // If target is off-screen (world distance > 220 units)
         if (worldDist > 220) {
            const angle = Math.atan2(dy, dx);
            const cx = width / 2;
            const cy = height / 2;
            
            // Place arrow at 40% of viewport min dimension
            const arrowRadius = Math.min(width, height) * 0.4;
            const arrowX = cx + Math.cos(angle) * arrowRadius;
            const arrowY = cy + Math.sin(angle) * arrowRadius;
            
            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#d946ef'; // Fuchsia Cheshire Cat glow
            ctx.fillStyle = '#f472b6'; 
            ctx.strokeStyle = '#db2777';
            ctx.lineWidth = 2.5;
            
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-12, -10);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-12, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw distance label rotated upright
            ctx.rotate(-angle);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fbcfe8';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            const labelName = target.type === 'task_push_cat' ? 'CAT' : 'FRIEND';
            ctx.fillText(`${labelName}: ${Math.round(worldDist)}m`, 0, 24);
            
            ctx.restore();
         }
      }
    };

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      
      update(dt);
      
      // Handle canvas resize
      const rect = cvs.parentElement?.getBoundingClientRect();
      if (rect && (cvs.width !== rect.width || cvs.height !== rect.height)) {
        cvs.width = rect.width;
        cvs.height = rect.height;
      }
      
      draw(ctx, cvs.width, cvs.height);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      state.idleTimer = 0;
      
      const rect = cvs.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Convert screen to world
      const worldX = state.player.x + (clickX - rect.width / 2) / CAMERA_ZOOM;
      const worldY = state.player.y + (clickY - rect.height / 2) / CAMERA_ZOOM;

      if (e.button === 0) { // Left Click - Move
        state.player.targetX = worldX;
        state.player.targetY = worldY;
      } else if (e.button === 2) { // Right Click - Act
        // Subjugation telemetry
        const nodeStr = `${Math.round(worldX/50)}_${Math.round(worldY/50)}`;
        if (state.lastClickNode === nodeStr) {
          state.clickSpam++;
          if (state.clickSpam > 5) {
            logTelemetry(sessionId, 'subjugation', { reason: 'spam_right_click', node: nodeStr });
            state.clickSpam = 0;
          }
        } else {
          state.lastClickNode = nodeStr;
          state.clickSpam = 1;
        }

        // Check interactions
        const primal = state.entities.find(e => e.id === 'primal_actor');
        if (primal && dist({x: worldX, y: worldY}, primal) < primal.radius + 50) {
          if (!state.tasksCompleted) {
             logTelemetry(sessionId, 'submission', { reason: 'impossible_challenge', target: 'primal_before_tasks' });
             setHudMsg("The Primal Actor ignores you. Complete your tasks first.");
          } else if (!isUnlocked) {
             onInteractPrimal();
          }
        }
        
        // Task Interactions
        state.entities.forEach((ent, i) => {
          if (dist({x: worldX, y: worldY}, ent) < ent.radius + 20 && dist(state.player, ent) < 100) {
            if (ent.type === 'task_keypad') {
               const guess = prompt("Enter 3 digit password:");
               if (guess === "123") {
                 state.taskProgress++;
                 state.entities.splice(i, 1);
               } else {
                 logTelemetry(sessionId, 'submission', { reason: 'failed_password' });
                 setHudMsg("Incorrect password. Despair grows.");
               }
            } else if (ent.type === 'task_fight') {
               ent.hp--;
               if (ent.hp <= 0) {
                 state.taskProgress++;
                 state.entities.splice(i, 1);
               }
            } else if (ent.type === 'task_blueprint' && state.taskProgress >= 3) {
               state.taskProgress = 4; // Done
            } else if (ent.type === 'task_prison') {
               // Must L/R click alternately. Since this is right click only, let's simplify to 10 right clicks
               state.taskProgress++;
               if (state.taskProgress >= state.taskMax) state.entities.splice(i, 1);
            }
          }
        });
      }
    };

    cvs.addEventListener('pointerdown', handlePointerDown);
    cvs.addEventListener('contextmenu', e => e.preventDefault());

    return () => {
      cancelAnimationFrame(animId);
      cvs.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [worldview, isUnlocked, sessionId, onInteractPrimal, debateAttempt, collectedItems]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair touch-none" />
      <div className="absolute top-4 left-4 text-orange-200 font-mono pointer-events-none drop-shadow-md z-10">
        <h2 className="text-xl tracking-widest">{hudMsg}</h2>
        <div className="flex gap-2 items-center mt-2">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 transition-all duration-300 ${
                i < hearts 
                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                  : 'text-neutral-600 fill-none'
              }`}
            />
          ))}
        </div>
        <div className="mt-4 flex gap-4 text-xs font-mono text-neutral-500 uppercase tracking-widest">
          <span>L-Click: Move</span>
          <span>R-Click: Act</span>
        </div>
      </div>
    </div>
  );
}
