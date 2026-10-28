(() => {
'use strict';
/* ===== 定数・ユーティリティ ===== */
const COL = { x: 0xd62839, y: 0x2a9d4a, z: 0x2563eb, xy: 0xf59e0b, yz: 0x06b6d4, zx: 0xa855f7 };
const HEX = c => '#' + c.toString(16).padStart(6, '0');
const PN = { xy: 'xy平面', yz: 'yz平面', zx: 'zx平面' };
const MODES = ['空間を動かす', '点を動かす', '点を投影する', '点を対称移動する', '原点からの距離'];
const AX2 = { xy: ['x', 'y'], yz: ['y', 'z'], zx: ['z', 'x'] };
const PROJ = { xy: p => ({ x: p.x, y: p.y, z: 0 }), yz: p => ({ x: 0, y: p.y, z: p.z }), zx: p => ({ x: p.x, y: 0, z: p.z }) };
const PNAME = { xy: 'Q', yz: 'R', zx: 'S' };
const DROP = { xy: 'z', yz: 'x', zx: 'y' };
const PLANE_TXT = {
  xy: 'xy平面は、z座標が0となる点全体でできた平面です。',
  yz: 'yz平面は、x座標が0となる点全体でできた平面です。',
  zx: 'zx平面は、y座標が0となる点全体でできた平面です。' };
const SYM = {
  xy: p => ({ x: p.x, y: p.y, z: -p.z }), yz: p => ({ x: -p.x, y: p.y, z: p.z }), zx: p => ({ x: p.x, y: -p.y, z: p.z }),
  x: p => ({ x: p.x, y: -p.y, z: -p.z }), y: p => ({ x: -p.x, y: p.y, z: -p.z }), z: p => ({ x: -p.x, y: -p.y, z: p.z }),
  o: p => ({ x: -p.x, y: -p.y, z: -p.z }) };
const SYMN = { xy: 'xy平面', yz: 'yz平面', zx: 'zx平面', x: 'x軸', y: 'y軸', z: 'z軸', o: '原点' };
const FLIP = { xy: ['z'], yz: ['x'], zx: ['y'], x: ['y', 'z'], y: ['x', 'z'], z: ['x', 'y'], o: ['x', 'y', 'z'] };
const FORM = {
  xy: '(a, b, c) → (a, b, −c)　z座標の符号だけが変わります。',
  yz: '(a, b, c) → (−a, b, c)　x座標の符号だけが変わります。',
  zx: '(a, b, c) → (a, −b, c)　y座標の符号だけが変わります。',
  x: '(a, b, c) → (a, −b, −c)　y座標とz座標の符号が変わります。',
  y: '(a, b, c) → (−a, b, −c)　x座標とz座標の符号が変わります。',
  z: '(a, b, c) → (−a, −b, c)　x座標とy座標の符号が変わります。',
  o: '(a, b, c) → (−a, −b, −c)　3つの座標すべての符号が変わります。' };
const PRED = [['x', 'x座標だけ'], ['y', 'y座標だけ'], ['z', 'z座標だけ'], ['two', '2つの座標'], ['three', '3つの座標すべて'], ['none', '座標は変化しない']];
const GUIDE = [
  'マウスをドラッグすると、立体を回転できます。平面のボタンで座標平面を表示し、「表示切替」で正面から見た2D表示に切り替えられます。',
  '数値・スライダー・点Pのドラッグで座標を変えられます。「〇座標だけを変える」で、その座標だけが動く様子を確認できます。',
  '座標平面を選ぶと、選択した平面に点Pから垂線が下ろされます。右側（または下側）の2D表示で交点の位置を確認しましょう。',
  '対称移動の対象を選び（先に予想を選ぶこともできます）、「移動を実行」を押すと点Pが移動します。',
  '「次へ」を押すごとに、図と式が1段階ずつ進みます。点Pの座標を変えると、計算も自動で更新されます。'];
const HELP = [
  ['左のボタンで xy・yz・zx 平面を表示／非表示にします。', '選んだ平面の説明が右に表示されます。', '「表示切替」で、選んだ平面を正面から見た2D表示に切り替えます。', '下の「透明度」で平面の見えやすさを調整できます。'],
  ['x・y・z の数値またはスライダーで点Pを動かします。', '3D空間の点Pを直接ドラッグしても動かせます。', '「〇座標だけを変える」を押すと、その座標だけが変化する様子を確認できます。', '補助線の表示・非表示を切り替えられます。'],
  ['左のボタンから座標平面を選びます。', '点Pから平面へ垂線が下ろされ、交点の座標が表示されます。', '2D表示で、平面上の交点の位置を確認します。', '「再実行」でアニメーションをもう一度見られます。'],
  ['対称移動の対象（平面・軸・原点）を選びます。', '必要に応じて、どの座標が変わるかを予想します。', '「移動を実行」を押すと、点Pが点P′へ移動します。', '移動前後の座標を比べ、変化した座標を確認します。'],
  ['「次へ」を押して STEP 1（垂線）から順に進みます。', 'STEP 2 では xy 平面を正面から見て OQ の長さを求めます。', 'STEP 3 では三平方の定理で OP を求めます。', '点Pの座標を変えて、計算がどう変わるか試しましょう。']];

const $ = s => document.querySelector(s);
const m = v => String(v).replace('-', '−');
const fp = (n, p) => `${n}(${m(p.x)}, ${m(p.y)}, ${m(p.z)})`;
const T = p => new THREE.Vector3(p.x, p.z, -p.y);   // 数学(x,y,z) → three(x,z,-y)
const lerp = (a, b, s) => ({ x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, z: a.z + (b.z - a.z) * s });
const ease = s => s * s * (3 - 2 * s);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const O0 = { x: 0, y: 0, z: 0 };
const coordHTML = (n, p, f = {}) => `${n}(` + ['x', 'y', 'z'].map(a => f[a] ? `<span class="chg">${m(p[a])}</span>` : m(p[a])).join(', ') + ')';
const sq = v => v < 0 ? `(${m(v)})²` : `${v}²`;
function rt(n) { // √n を k√r 形に
  if (n === 0) return '0';
  let k = 1, r = n;
  for (let d = 2; d * d <= r; d++) while (r % (d * d) === 0) { r /= d * d; k *= d; }
  return r === 1 ? `${k}` : (k === 1 ? '' : k) + `√${r}`;
}

/* ===== 状態 ===== */
const S = {};
let anim = null, last = null, paused = false, dirty = true;
function initMode(k) {
  Object.assign(S, {
    mode: k, P: { x: 1, y: 3, z: 2 }, planes: { xy: false, yz: false, zx: false }, sel: null,
    layout: k === 2 ? 'split' : '3d', coord: true, aux: true,
    m1: { disp: null, mv: null }, m2: { s: 0 }, m3: { type: null, s: 0, pred: null, done: false },
    m4: { step: 0, s: 0, OP: true, OQ: true, QP: true, tri: true } });
  anim = null; last = null; paused = false; dirty = true;
}
Object.assign(S, { axes: true, opacity: 0.25, slow: false });
initMode(0);

/* ===== Three.js ===== */
const wrap = $('#wrap3d');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xf7f8fa);
wrap.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const controls = new THREE.OrbitControls(cam, renderer.domElement);
controls.enableDamping = true; controls.minDistance = 5; controls.maxDistance = 30;
function resetView() { cam.position.set(6.5, 5, 8.5); controls.target.set(0, 0.8, 0); controls.update(); }
resetView();
function resize3d() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix();
}
new ResizeObserver(resize3d).observe(wrap);
new ResizeObserver(() => draw2D()).observe($('#wrap2d'));

function cyl(a, b, col, r, op = 1) {
  const d = b.clone().sub(a), L = d.length();
  if (L < 1e-6) return new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8),
    new THREE.MeshBasicMaterial({ color: col, transparent: op < 1, opacity: op }));
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}
function seg(g, a, b, col, o = {}) {
  const A = T(a), B = T(b), r = o.r || 0.03;
  if (!o.dash) { g.add(cyl(A, B, col, r, o.op || 1)); return; }
  const n = Math.max(1, Math.round(A.distanceTo(B) / 0.3));
  for (let i = 0; i < n; i++) g.add(cyl(A.clone().lerp(B, i / n), A.clone().lerp(B, (i + 0.55) / n), col, r, o.op || 1));
}
function ball(g, p, col, o = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(o.r || 0.13, 20, 16),
    new THREE.MeshBasicMaterial({ color: col, transparent: (o.op || 1) < 1, opacity: o.op || 1 }));
  mesh.position.copy(T(p)); g.add(mesh); return mesh;
}
const lc = new Map();
function sprMat(text, color) {
  const k = text + '|' + color;
  if (lc.has(k)) return lc.get(k);
  const c = document.createElement('canvas'), x = c.getContext('2d');
  const f = '600 44px "Hiragino Sans","Yu Gothic",Meiryo,sans-serif';
  x.font = f; const w = Math.ceil(x.measureText(text).width) + 16;
  c.width = w; c.height = 64; x.font = f; x.textBaseline = 'middle';
  x.lineJoin = 'round'; x.lineWidth = 8; x.strokeStyle = 'rgba(255,255,255,.9)'; x.strokeText(text, 8, 34);
  x.fillStyle = color; x.fillText(text, 8, 34);
  const mt = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true });
  mt.userData = { w }; lc.set(k, mt); return mt;
}
function lab(g, text, p, color, o = {}) {
  const mt = sprMat(text, color), h = o.h || 0.5, w = h * mt.userData.w / 64;
  const s = new THREE.Sprite(mt); s.scale.set(w, h, 1);
  const q = T(p), f = o.off || [w / 2 + 0.12, 0.28, 0];
  s.position.set(q.x + f[0], q.y + f[1], q.z + f[2]); s.renderOrder = 10; g.add(s);
}

// 座標軸（静的）
const axesG = new THREE.Group(); scene.add(axesG);
['x', 'y', 'z'].forEach(a => {
  const mk = v => ({ x: a === 'x' ? v : 0, y: a === 'y' ? v : 0, z: a === 'z' ? v : 0 });
  seg(axesG, mk(-5.6), mk(5.6), COL[a], { r: 0.025 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 12), new THREE.MeshBasicMaterial({ color: COL[a] }));
  cone.position.copy(T(mk(5.7)));
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), T(mk(1)).normalize());
  axesG.add(cone);
  lab(axesG, a, mk(6.2), HEX(COL[a]), { h: 0.6 });
  for (let i = 1; i <= 5; i++) lab(axesG, String(i), mk(i), '#475569', { h: 0.3, off: a === 'z' ? [0.22, 0, 0] : [0, -0.26, 0] });
});
lab(axesG, 'O', O0, '#111827', { h: 0.5, off: [-0.3, -0.3, 0] });

// 座標平面（静的）
const planeG = {};
['xy', 'yz', 'zx'].forEach(k => {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: COL[k], transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  const grid = new THREE.GridHelper(10, 10, COL[k], COL[k]);
  grid.material.transparent = true; grid.material.opacity = 0.35;
  if (k === 'xy') mesh.rotation.x = -Math.PI / 2;
  if (k === 'yz') { mesh.rotation.y = Math.PI / 2; grid.rotation.z = Math.PI / 2; }
  if (k === 'zx') grid.rotation.x = Math.PI / 2;
  g.add(mesh, grid); g.userData.mesh = mesh; scene.add(g); planeG[k] = g;
});
const dyn = new THREE.Group(); scene.add(dyn);
let pMesh = null;

function planeVis() {
  const v = {};
  ['xy', 'yz', 'zx'].forEach(k => {
    if (S.mode === 0 || S.mode === 1) v[k] = { on: S.planes[k], hl: S.mode === 0 && S.sel === k };
    else if (S.mode === 2) v[k] = { on: S.sel === k, hl: S.sel === k };
    else if (S.mode === 3) v[k] = { on: S.m3.type === k, hl: true };
    else v[k] = { on: k === 'xy' && S.m4.step >= 1, hl: true };
  });
  return v;
}
function build() {
  while (dyn.children.length) {
    const c = dyn.children.pop();
    c.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.isSprite) o.material.dispose(); });
  }
  axesG.visible = S.axes;
  const pv = planeVis(), corner = { xy: { x: 4, y: 4, z: 0 }, yz: { x: 0, y: 4, z: 4 }, zx: { x: 4, y: 0, z: 4 } };
  for (const k in pv) {
    planeG[k].visible = pv[k].on;
    planeG[k].userData.mesh.material.opacity = clamp(S.opacity + (pv[k].hl ? 0.2 : 0), 0, 0.9);
    if (pv[k].on) lab(dyn, PN[k], corner[k], HEX(COL[k]), { h: 0.45 });
  }
  pMesh = null;
  const BL = 0x1d4ed8, RD = 0xe11d48, GR = 0x667085;
  const P = S.P;
  if (S.mode === 1) {
    const p = S.m1.disp || P;
    pMesh = ball(dyn, p, BL, { r: 0.2 });
    if (S.aux) {
      const A = { x: p.x, y: 0, z: 0 }, B = { x: 0, y: p.y, z: 0 }, C = { x: 0, y: 0, z: p.z };
      const AB = { x: p.x, y: p.y, z: 0 }, AC = { x: p.x, y: 0, z: p.z }, BC = { x: 0, y: p.y, z: p.z };
      [[A, AB], [A, AC], [B, AB], [B, BC], [C, AC], [C, BC], [p, AB], [p, AC], [p, BC]].forEach(([a, b]) => seg(dyn, a, b, GR, { dash: true, r: 0.02 }));
      seg(dyn, O0, A, COL.x, { r: 0.05 }); seg(dyn, O0, B, COL.y, { r: 0.05 }); seg(dyn, O0, C, COL.z, { r: 0.05 });
    }
    if (S.coord) lab(dyn, fp('P', p), HEX(BL), { h: 0.55 });
  } else if (S.mode === 2) {
    ball(dyn, P, BL, { r: 0.16 }); lab(dyn, fp('P', P), HEX(BL), { h: 0.55 });
    const k = S.sel;
    if (k) {
      const q = PROJ[k](P), f = lerp(P, q, ease(S.m2.s));
      seg(dyn, P, f, RD, { dash: true, r: 0.04 }); ball(dyn, f, RD, { r: 0.14 });
      if (S.m2.s >= 1) lab(dyn, fp(PNAME[k], q), HEX(RD), { h: 0.55 });
    }
  } else if (S.mode === 3) {
    const t = S.m3.type;
    if (!t) { ball(dyn, P, BL, { r: 0.16 }); lab(dyn, fp('P', P), HEX(BL), { h: 0.55 }); }
    else {
      const Pp = SYM[t](P), f = lerp(P, Pp, ease(S.m3.s));
      ball(dyn, P, BL, { r: 0.16, op: 0.35 }); lab(dyn, fp('P', P), '#7b8bb0', { h: 0.5 });
      seg(dyn, P, Pp, GR, { dash: true, r: 0.015 });
      if (['x', 'y', 'z'].includes(t)) {
        const e = { x: 0, y: 0, z: 0 }, e2 = { x: 0, y: 0, z: 0 }; e[t] = -5.6; e2[t] = 5.6;
        seg(dyn, e, e2, COL[t], { r: 0.07 });
      }
      if (t === 'o') ball(dyn, O0, 0x111827, { r: 0.2 });
      ball(dyn, f, 0xea580c, { r: 0.2 });
      lab(dyn, S.m3.done ? fp("P′", Pp) : 'P′', '#c2410c', { h: 0.6 });
    }
  } else if (S.mode === 4) {
    const st = S.m4.step, Q = { x: P.x, y: P.y, z: 0 };
    ball(dyn, P, BL, { r: 0.16 }); ball(dyn, O0, 0x111827, { r: 0.1 });
    lab(dyn, fp('P', P), HEX(BL), { h: 0.55 });
    if (S.m4.OP) seg(dyn, O0, P, 0x111827, { r: 0.045 });
    if (st >= 1) {
      const f = lerp(P, Q, ease(S.m4.s)), done = S.m4.s >= 1;
      if (S.m4.QP) seg(dyn, P, f, RD, { dash: true, r: 0.04 });
      if (!done) ball(dyn, f, RD, { r: 0.12 });
      else {
        ball(dyn, Q, RD, { r: 0.13 }); lab(dyn, fp('Q', Q), HEX(RD), { h: 0.5 });
        if (S.m4.OQ) seg(dyn, O0, Q, st === 2 ? 0x16a34a : 0x2563eb, { r: st === 2 ? 0.075 : 0.045 });
        if (st >= 3 && S.m4.tri && P.x * P.x + P.y * P.y > 0 && P.z !== 0) {
          const g = new THREE.BufferGeometry().setFromPoints([T(O0), T(Q), T(P)]);
          dyn.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })));
        }
      }
    }
  }
  dirty = false;
}

/* ===== 点のドラッグ（モード②） ===== */
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), el = renderer.domElement;
let drag = null;
const setMouse = e => { const r = el.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mouse, cam); };
el.addEventListener('pointerdown', e => {
  if (S.mode !== 1 || anim || !pMesh) return;
  setMouse(e);
  if (ray.intersectObject(pMesh).length) {
    drag = new THREE.Plane().setFromNormalAndCoplanarPoint(cam.getWorldDirection(new THREE.Vector3()), pMesh.position);
    controls.enabled = false; el.setPointerCapture(e.pointerId); e.stopImmediatePropagation();
  }
}, true);
el.addEventListener('pointermove', e => {
  if (!drag) return;
  setMouse(e); const pt = new THREE.Vector3();
  if (ray.ray.intersectPlane(drag, pt)) {
    S.P = { x: clamp(Math.round(pt.x), -5, 5), y: clamp(Math.round(-pt.z), -5, 5), z: clamp(Math.round(pt.y), -5, 5) };
    syncInputs(); renderRight(); dirty = true;
  }
});
const endDrag = () => { drag = null; controls.enabled = true; };
el.addEventListener('pointerup', endDrag); el.addEventListener('pointercancel', endDrag);

/* ===== アニメーション ===== */
function play(fn, dur, done) {
  const run = () => { anim = { t: 0, dur, fn, done }; paused = false; fn(0); dirty = true; updatePlay(); renderRight(); };
  last = run; run();
}
function tick(dt) {
  if (!anim || paused) return;
  anim.t += dt;
  const s = Math.min(anim.t / (anim.dur * (S.slow ? 2.5 : 1)), 1);
  anim.fn(s); dirty = true; renderRight();
  if (s >= 1) { const d = anim.done; anim = null; if (d) d(); renderRight(); }
}
let prevT = performance.now();
function loop(t) {
  const dt = Math.min((t - prevT) / 1000, 0.1); prevT = t;
  tick(dt);
  if (dirty) build();
  if (dirty2d || !dirty) { /* 2D は毎フレーム軽く再描画 */ }
  controls.update(); renderer.render(scene, cam);
  if (S.layout !== '3d') draw2D();
  requestAnimationFrame(loop);
}
let dirty2d = true;

/* ===== 2D表示 ===== */
function draw2D() {
  const c = $('#c2d');
  if (!c.clientWidth || !c.clientHeight || S.layout === '3d') return;
  const dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight;
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const pl = S.mode === 4 ? 'xy' : (S.sel || 'xy'), [hn, vn] = AX2[pl];
  const u = Math.min(W, H) / 13, cx = W / 2, cy = H / 2 + 10, X = h => cx + h * u, Y = v => cy - v * u;
  const font = (s, w = 'bold') => g.font = `${w} ${s}px "Hiragino Sans","Yu Gothic",Meiryo,sans-serif`;
  g.fillStyle = HEX(COL[pl]) + '18'; g.fillRect(X(-6), Y(6), 12 * u, 12 * u);
  g.strokeStyle = '#d5dbe3'; g.lineWidth = 1;
  for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(X(i), Y(-6)); g.lineTo(X(i), Y(6)); g.moveTo(X(-6), Y(i)); g.lineTo(X(6), Y(i)); g.stroke(); }
  const arrow = (x1, y1, x2, y2, col) => {
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2);
    g.lineTo(x2 - 11 * Math.cos(a - 0.4), y2 - 11 * Math.sin(a - 0.4)); g.lineTo(x2 - 11 * Math.cos(a + 0.4), y2 - 11 * Math.sin(a + 0.4)); g.fill();
  };
  arrow(X(-6), Y(0), X(6.4), Y(0), HEX(COL[hn])); arrow(X(0), Y(-6), X(0), Y(6.4), HEX(COL[vn]));
  font(17); g.fillStyle = HEX(COL[hn]); g.fillText(hn, X(6.4) - 4, Y(0) + 20);
  g.fillStyle = HEX(COL[vn]); g.fillText(vn, X(0) + 8, Y(6.4) + 4);
  font(12, 'normal'); g.fillStyle = '#475569';
  for (let i = -5; i <= 5; i++) if (i) { g.fillText(m(i), X(i) - 4, Y(0) + 15); g.fillText(m(i), X(0) - 18, Y(i) + 4); }
  g.fillStyle = '#111'; font(14); g.fillText('O', X(0) - 15, Y(0) + 16);
  font(14); g.fillStyle = '#334155'; g.fillText(`${PN[pl]}を正面（${DROP[pl]}軸の正の側）から見た図`, 10, 22);
  const dot = (h, v, col, text, o = {}) => {
    g.beginPath(); g.arc(X(h), Y(v), o.r || 6, 0, 7);
    if (o.hollow) { g.strokeStyle = col; g.lineWidth = 2; g.stroke(); } else { g.fillStyle = col; g.fill(); }
    if (text) { font(15); g.fillStyle = col; g.fillText(text, X(h) + 10, Y(v) + (o.dy === undefined ? -10 : o.dy)); }
  };
  const guide = (h, v) => {
    g.setLineDash([5, 4]); g.strokeStyle = '#64748b'; g.lineWidth = 1.3; g.beginPath();
    g.moveTo(X(h), Y(v)); g.lineTo(X(h), Y(0)); g.moveTo(X(h), Y(v)); g.lineTo(X(0), Y(v)); g.stroke(); g.setLineDash([]);
    font(13); g.fillStyle = '#0f172a'; g.fillText(m(h), X(h) - 4, Y(0) + (v >= 0 ? 30 : -18)); g.fillText(m(v), X(0) + 8, Y(v) - 4);
  };
  if (S.mode === 2 && S.sel) {
    const q = PROJ[pl](S.P), h = q[hn], v = q[vn];
    guide(h, v); dot(h, v, '#e11d48', S.m2.s >= 1 ? fp(PNAME[pl], q) : PNAME[pl]);
    dot(h, v, '#1d4ed8', 'P（真上の点）', { hollow: true, r: 11, dy: 24 });
  } else if (S.mode === 4 && S.m4.step >= 1) {
    const h = S.P.x, v = S.P.y; guide(h, v);
    g.strokeStyle = '#16a34a'; g.lineWidth = 4; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(h), Y(v)); g.stroke();
    dot(0, 0, '#111827'); dot(h, v, '#e11d48', fp('Q', { x: h, y: v, z: 0 }));
    if (S.m4.step >= 2) { font(17); g.fillStyle = '#15803d'; g.fillText('OQ＝' + rt(h * h + v * v), (X(0) + X(h)) / 2 - 40, (Y(0) + Y(v)) / 2 - 12); }
  }
}

/* ===== UI ===== */
function coordEd() {
  return ['x', 'y', 'z'].map(a => `<label class="row"><span class="ax ${a}">${a}＝</span>
  <input type="number" min="-5" max="5" step="1" data-n="${a}" value="${S.P[a]}">
  <input type="range" min="-5" max="5" step="1" data-r="${a}" value="${S.P[a]}"></label>`).join('');
}
const chk = (id, label, on) => `<label class="opt"><input type="checkbox" data-chk="${id}" ${on ? 'checked' : ''}> ${label}</label>`;
function renderLeft() {
  let h = '';
  const on = c => c ? ' on' : '';
  if (S.mode === 0) {
    h = '<h3>座標平面</h3><div class="col">' + ['xy', 'yz', 'zx'].map(k => `<button class="btn${on(S.planes[k])}" data-act="plane" data-v="${k}">${PN[k]}を表示</button>`).join('') +
      '<button class="btn" data-act="allon">すべて表示</button><button class="btn" data-act="alloff">すべて非表示</button></div>';
  } else if (S.mode === 1) {
    h = '<h3>点Pの座標</h3>' + coordEd() + '<h3>座標の変化</h3><div class="col">' +
      ['x', 'y', 'z'].map(a => `<button class="btn" data-act="only" data-v="${a}">${a}座標だけを変える</button>`).join('') + '</div><h3>表示設定</h3>' +
      chk('coord', '点Pの座標表示', S.coord) + chk('aux', '座標軸への補助線', S.aux) +
      ['xy', 'yz', 'zx'].map(k => chk('pl-' + k, PN[k], S.planes[k])).join('');
  } else if (S.mode === 2) {
    h = '<h3>垂線を下ろす平面</h3><div class="col">' + ['xy', 'yz', 'zx'].map(k => `<button class="btn${on(S.sel === k)}" data-act="proj" data-v="${k}">${PN[k]}へ垂線を下ろす</button>`).join('') + '</div><h3>点Pの座標</h3>' + coordEd();
  } else if (S.mode === 3) {
    const grp = (t, ks) => `<h3>${t}</h3><div class="col">` + ks.map(k => `<button class="btn${on(S.m3.type === k)}" data-act="sym" data-v="${k}">${SYMN[k]}に関して</button>`).join('') + '</div>';
    h = grp('座標平面', ['xy', 'yz', 'zx']) + grp('座標軸', ['x', 'y', 'z']) + grp('原点', ['o']) +
      '<h3>予想（変化する座標は？）</h3>' + PRED.map(([v, t]) => `<label class="opt"><input type="radio" name="pred" value="${v}" ${S.m3.pred === v ? 'checked' : ''}> ${t}</label>`).join('') +
      '<div class="col" style="margin-top:8px"><button class="btn on" data-act="run3">移動を実行</button></div><h3>点Pの座標</h3>' + coordEd();
  } else {
    const st = S.m4.step;
    h = '<h3>点Pの座標</h3>' + coordEd() + `<h3>STEP ${st === 0 ? '0' : st <= 1 ? 1 : st === 2 ? 2 : 3}</h3><div class="col">
      <button class="btn on" data-act="next" ${st >= 6 ? 'disabled' : ''}>次へ ▶</button><button class="btn" data-act="prev" ${st <= 0 ? 'disabled' : ''}>◀ 戻る</button></div><h3>表示設定</h3>` +
      chk('OP', '線分OP', S.m4.OP) + chk('OQ', '線分OQ', S.m4.OQ) + chk('QP', '線分QP（垂線）', S.m4.QP) + chk('tri', '三角形OQPの強調', S.m4.tri);
  }
  $('#left').innerHTML = h;
}
function renderRight() {
  let h = '';
  const P = S.P;
  if (S.mode === 0) {
    const k = S.sel;
    h = '<h3>座標軸と座標平面</h3><p>x軸・y軸・z軸は原点Oで互いに垂直に交わります。2本の軸で1つの座標平面が決まります。</p>' +
      (k ? `<div class="box" style="border-color:${HEX(COL[k])}"><b>${PN[k]}</b><br>${PLANE_TXT[k]}</div>` : '<p class="mute">左のボタンで座標平面を表示してみましょう。</p>');
  } else if (S.mode === 1) {
    const p = S.m1.disp || P, mv = S.m1.mv;
    h = `<h3>点の座標</h3><div class="big">${coordHTML('P', p, { x: mv === 'x', y: mv === 'y', z: mv === 'z' })}</div>
    <p>原点Oから、x軸方向に${m(p.x)}、y軸方向に${m(p.y)}、z軸方向に${m(p.z)}だけ進んだ点です。</p>` +
      (mv ? `<p>いま変化しているのは <b>${mv}座標</b> だけです。他の2つは固定されています。</p>` : '');
  } else if (S.mode === 2) {
    const k = S.sel;
    h = '<h3>垂線の交点</h3>';
    if (!k) h += `<div class="big">${fp('P', P)}</div><p class="mute">左のボタンで平面を選ぶと、点Pから垂線が下ろされます。</p>`;
    else {
      const q = PROJ[k](P), done = S.m2.s >= 1;
      h += `<div class="big">${coordHTML('P', P)}<div class="arrow">↓</div>${done ? coordHTML(PNAME[k], q, { [DROP[k]]: true }) : PNAME[k] + '( ?, ?, ? )'}</div>
      <p>${PN[k]}上の点は${DROP[k]}座標が0です。垂線を下ろすと${DROP[k]}座標だけが0になり、他の座標は変わりません。</p>
      <p class="mute">一般に P(a, b, c) のとき　xy平面：Q(a, b, 0)　yz平面：R(0, b, c)　zx平面：S(a, 0, c)</p>`;
    }
  } else if (S.mode === 3) {
    const t = S.m3.type;
    if (!t) h = `<h3>対称移動</h3><div class="big">${fp('P', P)}</div><p class="mute">左で対称移動の対象を選んでください。</p>`;
    else {
      const Pp = SYM[t](P), fl = {}; FLIP[t].forEach(a => fl[a] = true);
      h = `<h3>${SYMN[t]}に関する対称移動</h3><div class="big">${coordHTML('P', P)}<div class="arrow">↓</div>${S.m3.done ? coordHTML('P′', Pp, fl) : 'P′( ?, ?, ? )'}</div>`;
      if (S.m3.done) {
        h += `<div class="fm">${FORM[t]}</div>`;
        if (FLIP[t].some(a => P[a] === 0)) h += '<p class="mute">※座標が0のときは、符号が変わっても値は変わりません。</p>';
        const pr = S.m3.pred, key = FLIP[t].length === 1 ? FLIP[t][0] : FLIP[t].length === 2 ? 'two' : 'three';
        const L = Object.fromEntries(PRED);
        h += pr ? `<p class="fb ${pr === key ? 'ok' : 'ng'}">予想：${L[pr]} → ${pr === key ? '正解です。' : `実際は「${L[key]}」が変化します。`}</p>` : '<p class="mute">予想を選んでから実行すると、正誤を確認できます。</p>';
      }
    }
  } else {
    const st = S.m4.step, a = P.x, b = P.y, c = P.z, oq2 = a * a + b * b, op2 = oq2 + c * c;
    const lines = [`OQ＝√(${sq(a)}＋${sq(b)})＝${rt(oq2)}`, 'OP²＝OQ²＋QP²', `OP²＝${oq2}＋${sq(Math.abs(c))}`, `OP²＝${op2}`, `OP＝${rt(op2)}`];
    const desc = ['原点Oと点Pの距離OPを求めます。まず点Pからxy平面に垂線を下ろしましょう。',
      `STEP 1：垂線の足は ${fp('Q', { x: a, y: b, z: 0 })}。OQ（実線）、QP（破線）、OP（太い黒線）。QP＝|z座標|＝${Math.abs(c)}`,
      'STEP 2：xy平面を正面から見ると、OQは平面上の距離です。', 'STEP 3：△OQPは∠Q＝90°の直角三角形なので、三平方の定理が使えます。',
      '', '', ''];
    h = `<h3>原点Oと点Pの距離</h3><div class="big">${fp('P', P)}</div><p>${desc[Math.min(st, 3)]}</p>`;
    for (let i = 0; i < Math.max(0, st - 1); i++) h += `<div class="fm">${lines[i]}</div>`;
    if (st === 6) h += `<p>よって、原点Oと点P${fp('', P)}の距離は <b>${rt(op2)}</b> です。</p>`;
    if (st === 0) h += '<p class="mute">左の「次へ」を押してください。</p>';
  }
  $('#explain').innerHTML = h;
}
function syncInputs() {
  const p = S.m1.disp || S.P;
  document.querySelectorAll('[data-n]').forEach(i => { if (document.activeElement !== i) i.value = p[i.dataset.n]; });
  document.querySelectorAll('[data-r]').forEach(i => i.value = p[i.dataset.r]);
}
function updatePlay() { $('#bPlay').textContent = paused ? '▶ 再生' : '⏸ 一時停止'; }
function updateLayoutBtn() {
  $('#stage').dataset.layout = S.layout;
  $('#bLayout').style.display = [0, 2, 4].includes(S.mode) ? '' : 'none';
  $('#bLayout').textContent = { '3d': '表示：3D', '2d': '表示：2D', split: '表示：3D＋2D' }[S.layout] + '（切替）';
  resize3d(); dirty = true;
}
function syncFooter() {
  $('#chAxes').checked = S.axes; $('#rOp').value = S.opacity; $('#sSpeed').value = S.slow ? 1 : 0; updatePlay(); updateLayoutBtn();
  $('#guide').textContent = GUIDE[S.mode];
  document.querySelectorAll('.tab').forEach((b, i) => b.classList.toggle('on', i === S.mode));
}
function renderAll() { renderLeft(); renderRight(); syncFooter(); dirty = true; }

function setCoord(a, v) {
  v = Math.round(clamp(v, -5, 5));
  const n = { ...S.P, [a]: v };
  if (S.mode === 4 && !n.x && !n.y && !n.z) { syncInputs(); return; } // 原点は不可
  if (anim) { anim = null; }
  S.P = n; S.m1.disp = null; S.m1.mv = null;
  if (S.mode === 2) S.m2.s = S.sel ? 1 : 0;
  if (S.mode === 3) { S.m3.s = 0; S.m3.done = false; }
  if (S.mode === 4) S.m4.s = S.m4.step >= 1 ? 1 : 0;
  syncInputs(); renderRight(); dirty = true;
}
function m4go(d) {
  const n = clamp(S.m4.step + d, 0, 6); if (n === S.m4.step) return;
  S.m4.step = n; S.layout = n === 2 ? '2d' : '3d';
  if (n === 1 && d > 0) play(s => S.m4.s = s, 1.8);
  else { anim = null; last = null; S.m4.s = n >= 1 ? 1 : 0; }
  renderAll();
}
function act(a, v) {
  if (a === 'plane') { S.planes[v] = !S.planes[v]; if (S.planes[v]) S.sel = v; else if (S.sel === v) S.sel = null; }
  else if (a === 'allon') { ['xy', 'yz', 'zx'].forEach(k => S.planes[k] = true); S.sel = S.sel || 'xy'; }
  else if (a === 'alloff') { ['xy', 'yz', 'zx'].forEach(k => S.planes[k] = false); S.sel = null; if (S.layout === '2d') S.layout = '3d'; }
  else if (a === 'only') {
    const v0 = S.P[v];
    play(s => {
      const val = s < 0.25 ? v0 + (4 - v0) * s / 0.25 : s < 0.75 ? 4 - 8 * (s - 0.25) / 0.5 : -4 + (v0 + 4) * (s - 0.75) / 0.25;
      S.m1.disp = { ...S.P, [v]: Math.round(val * 10) / 10 }; S.m1.mv = v; syncInputs();
    }, 4, () => { S.m1.disp = null; S.m1.mv = null; syncInputs(); });
    return;
  }
  else if (a === 'proj') { S.sel = v; play(s => S.m2.s = s, 1.8); renderLeft(); return; }
  else if (a === 'sym') { S.m3.type = v; S.m3.s = 0; S.m3.done = false; anim = null; last = null; }
  else if (a === 'run3') {
    if (!S.m3.type) return;
    play(s => { S.m3.s = s; if (s === 0) S.m3.done = false; }, 2.2, () => { S.m3.done = true; });
    return;
  }
  else if (a === 'next') { m4go(1); return; }
  else if (a === 'prev') { m4go(-1); return; }
  renderAll();
}

/* ===== イベント登録 ===== */
$('#tabs').innerHTML = MODES.map((t, i) => `<button class="tab" data-m="${i}">${i + 1}. ${t}</button>`).join('');
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-m]'); if (!b) return;
  initMode(+b.dataset.m); resetView(); renderAll();
});
$('#left').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act, b.dataset.v); });
$('#left').addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.n && t.value !== '' && t.value !== '-') setCoord(t.dataset.n, +t.value);
  if (t.dataset.r) setCoord(t.dataset.r, +t.value);
});
$('#left').addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.n) syncInputs();
  if (t.name === 'pred') { S.m3.pred = t.value; renderRight(); }
  if (t.dataset.chk) {
    const k = t.dataset.chk;
    if (k.startsWith('pl-')) S.planes[k.slice(3)] = t.checked;
    else if (S.mode === 4) S.m4[k] = t.checked; else S[k] = t.checked;
    dirty = true;
  }
});
$('#chAxes').onchange = e => { S.axes = e.target.checked; dirty = true; };
$('#rOp').oninput = e => { S.opacity = +e.target.value; dirty = true; };
$('#sSpeed').onchange = e => { S.slow = e.target.value === '1'; };
$('#bView').onclick = resetView;
$('#bPlay').onclick = () => { paused = !paused; updatePlay(); };
$('#bReplay').onclick = () => { if (last) last(); };
$('#bLayout').onclick = () => {
  const list = S.mode === 2 ? ['split', '3d', '2d'] : ['3d', '2d'];
  S.layout = list[(list.indexOf(S.layout) + 1) % list.length]; updateLayoutBtn();
};
$('#bReset').onclick = () => { initMode(S.mode); Object.assign(S, { axes: true, opacity: 0.25, slow: false }); resetView(); renderAll(); };
$('#bHelp').onclick = () => {
  $('#dlgT').textContent = `モード${S.mode + 1}「${MODES[S.mode]}」の使い方`;
  $('#dlgL').innerHTML = HELP[S.mode].map(t => `<li>${t}</li>`).join(''); $('#dlg').showModal();
};
$('#dlgC').onclick = () => $('#dlg').close();
$('#tL').onclick = () => { document.body.classList.toggle('hideL'); if (innerWidth < 900) document.body.classList.add('hideR'); setTimeout(resize3d, 0); };
$('#tR').onclick = () => { document.body.classList.toggle('hideR'); if (innerWidth < 900) document.body.classList.add('hideL'); setTimeout(resize3d, 0); };
if (innerWidth < 900) document.body.classList.add('hideL', 'hideR');
else document.body.classList.remove('hideR');

renderAll(); resize3d();
requestAnimationFrame(loop);
})();
