const canvas = document.getElementById('life-canvas');
const ctx = canvas.getContext('2d');

const BIRTHDATE = new Date(1991, 5, 28);
const TOTAL_MONTHS = 100 * 12;
const COLS = 12;
const ROWS = 100;
const R = 3.5;
const GAP = 16;
const PAD_X = 48;
const PAD_Y = 24;

// Wind physics
const WIND_RADIUS = 90;
const WIND_STRENGTH = 0.22;
const DAMPING = 0.82;
const SPRING = 0.08;

let dots = [];
let categories = {};
let activeCategory = null;
let mouse = { x: -9999, y: -9999, vx: 0, vy: 0, px: -9999, py: -9999 };

function monthsSinceBirth(date) {
    return (date.getFullYear() - BIRTHDATE.getFullYear()) * 12
        + (date.getMonth() - BIRTHDATE.getMonth());
}

function parseMonthStr(str) {
    const [y, m] = str.split('-').map(Number);
    return new Date(y, m - 1, 1);
}

function init() {
    const w = PAD_X * 2 + (COLS - 1) * GAP;
    const h = PAD_Y * 2 + (ROWS - 1) * GAP;
    canvas.width = w;
    canvas.height = h;

    const now = new Date();
    const currentIdx = monthsSinceBirth(now);

    dots = [];
    for (let i = 0; i < TOTAL_MONTHS; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = PAD_X + col * GAP;
        const y = PAD_Y + row * GAP;
        dots.push({ i, x, y, ox: x, oy: y, vx: 0, vy: 0, dx: 0, dy: 0,
            past: i < currentIdx, current: i === currentIdx });
    }
}

function getDotColor(dot) {
    if (activeCategory && categories[activeCategory]) {
        const cat = categories[activeCategory];
        for (const p of cat.periods) {
            const s = monthsSinceBirth(parseMonthStr(p.start));
            const e = monthsSinceBirth(parseMonthStr(p.end));
            if (dot.i >= s && dot.i <= e) return cat.color;
        }
    }
    if (dot.current) return '#ffffff';
    if (dot.past) return 'rgba(255,255,255,0.52)';
    return 'rgba(255,255,255,0.07)';
}

function update() {
    for (const d of dots) {
        const cx = d.ox + d.dx;
        const cy = d.oy + d.dy;
        const dist = Math.hypot(cx - mouse.x, cy - mouse.y);

        if (dist < WIND_RADIUS && dist > 0) {
            const strength = (1 - dist / WIND_RADIUS) * WIND_STRENGTH;
            d.vx += mouse.vx * strength;
            d.vy += mouse.vy * strength;
        }

        d.vx += -d.dx * SPRING;
        d.vy += -d.dy * SPRING;
        d.vx *= DAMPING;
        d.vy *= DAMPING;
        d.dx += d.vx;
        d.dy += d.vy;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.ox + d.dx, d.oy + d.dy, R, 0, Math.PI * 2);
        ctx.fillStyle = getDotColor(d);
        ctx.fill();
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;
    mouse.vx = nx - mouse.px;
    mouse.vy = ny - mouse.py;
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = nx;
    mouse.y = ny;
});

canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999; mouse.y = -9999;
    mouse.vx = 0; mouse.vy = 0;
});

async function start() {
    const res = await fetch('data/data.json');
    const data = await res.json();
    categories = data.categories;

    const nav = document.getElementById('category-nav');
    for (const [key, cat] of Object.entries(categories)) {
        const btn = document.createElement('button');
        btn.textContent = cat.label;
        btn.dataset.key = key;
        btn.style.setProperty('--cat-color', cat.color);
        btn.addEventListener('click', () => {
            if (activeCategory === key) {
                activeCategory = null;
                btn.classList.remove('active');
            } else {
                nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                activeCategory = key;
                btn.classList.add('active');
            }
        });
        nav.appendChild(btn);
    }

    init();
    loop();
}

start();
