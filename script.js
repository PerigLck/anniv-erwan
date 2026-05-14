// Les sociétés sont chargées depuis msci_world_constituents.js (1308 actions)
const companies = msciWorldConstituents;

// Nombre de segments affichés sur la roue
const SEGMENTS = 8;
const COLORS = [
    "#e63946", "#457b9d", "#2a9d8f", "#e9c46a",
    "#f4a261", "#264653", "#6a4c93", "#1982c4"
];

let canvas, ctx;
let currentAngle = 0;
let spinning = false;
let wheelCompanies = [];

// === CONFETTI ===
function createConfetti() {
    const container = document.getElementById("confetti-container");
    const colors = ["#ffd200", "#ff6b6b", "#4ecdc4", "#667eea", "#764ba2", "#f093fb", "#f7971e", "#fff"];

    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + "px";
        confetti.style.height = Math.random() * 10 + 5 + "px";
        confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
        confetti.style.animationDuration = Math.random() * 3 + 2 + "s";
        confetti.style.animationDelay = Math.random() * 5 + "s";
        container.appendChild(confetti);
    }
}

// === TICK SOUND ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1200;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.06);
}

// === NAVIGATION ===
function showRoulette() {
    const birthday = document.getElementById("birthday-screen");
    const roulette = document.getElementById("roulette-screen");
    birthday.style.opacity = "0";
    setTimeout(() => {
        birthday.classList.remove("active");
        roulette.classList.add("active");
        requestAnimationFrame(() => { roulette.style.opacity = "1"; });
        initWheel();
    }, 500);
}

// === ROUE ===
function pickRandomCompanies() {
    const shuffled = [...companies].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, SEGMENTS);
}

function sizeCanvas() {
    canvas = document.getElementById("wheel-canvas");
    const size = Math.min(420, window.innerWidth * 0.85);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    canvas._logicalSize = size;
}

function initWheel() {
    sizeCanvas();
    wheelCompanies = pickRandomCompanies();
    currentAngle = 0;
    drawWheel();
    window.addEventListener("resize", () => { sizeCanvas(); drawWheel(); });
}

function drawWheel() {
    const size = canvas._logicalSize;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const segmentAngle = (2 * Math.PI) / SEGMENTS;

    ctx.clearRect(0, 0, size, size);

    // Ombre extérieure
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 210, 0, 0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < SEGMENTS; i++) {
        const startAngle = currentAngle + i * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        // Segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Texte
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        const fontSize = Math.max(11, Math.round(size / 28));
        ctx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 3;

        const label = wheelCompanies[i].name;
        const maxLen = 14;
        const displayLabel = label.length > maxLen ? label.substring(0, maxLen) + "…" : label;
        ctx.fillText(displayLabel, radius - 15, 4);
        ctx.restore();
    }

    // Centre
    ctx.beginPath();
    ctx.arc(centerX, centerY, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a3e";
    ctx.fill();
    ctx.strokeStyle = "#ffd200";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#ffd200";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GO", centerX, centerY);
}

function spinWheel() {
    if (spinning) return;
    spinning = true;

    const btn = document.getElementById("spin-btn");
    btn.disabled = true;
    btn.textContent = "⏳ Ça tourne...";

    document.getElementById("result-container").classList.add("hidden");

    const segmentAngle = (2 * Math.PI) / SEGMENTS;
    // Choisir un segment gagnant aléatoire
    const winIndex = Math.floor(Math.random() * SEGMENTS);

    // Le pointeur est en haut (angle -PI/2). On veut que le centre du segment
    // winIndex soit aligné sous le pointeur.
    // Segment i est dessiné de currentAngle + i*segmentAngle à currentAngle + (i+1)*segmentAngle
    // Son centre est à currentAngle + i*segmentAngle + segmentAngle/2
    // On veut : finalAngle + winIndex*segmentAngle + segmentAngle/2 = -PI/2 (mod 2PI)
    // => finalAngle = -PI/2 - winIndex*segmentAngle - segmentAngle/2
    const desiredAngle = -Math.PI / 2 - winIndex * segmentAngle - segmentAngle / 2;

    // Normaliser l'angle courant et l'angle désiré dans [0, 2PI)
    const currentNorm = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const desiredNorm = ((desiredAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Rotation supplémentaire après les tours complets
    let extraRotation = desiredNorm - currentNorm;
    if (extraRotation < 0) extraRotation += 2 * Math.PI;

    // 5 à 8 tours complets (entiers) + rotation exacte pour atterrir sur le bon segment
    const numFullTurns = 5 + Math.floor(Math.random() * 4);
    const totalRotation = numFullTurns * 2 * Math.PI + extraRotation;

    const startAngle = currentAngle;
    const startTime = performance.now();
    const duration = 5000;

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    let lastSegIndex = -1;

    function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(t);

        currentAngle = startAngle + totalRotation * eased;
        drawWheel();

        // Tick sound when crossing a segment boundary
        const pointerAngle = (-Math.PI / 2 - currentAngle) % (2 * Math.PI);
        const segIndex = Math.floor(((pointerAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / segmentAngle);
        if (segIndex !== lastSegIndex) {
            lastSegIndex = segIndex;
            playTick();
        }

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            btn.disabled = false;
            btn.textContent = "🎲 Relancer la roue !";
            showResult(wheelCompanies[winIndex]);
        }
    }

    requestAnimationFrame(animate);
}

function showResult(company) {
    document.getElementById("result-company").textContent = company.name;
    document.getElementById("result-ticker").textContent = company.ticker;
    document.getElementById("result-container").classList.remove("hidden");
    launchResultConfetti();
}

function launchResultConfetti() {
    const container = document.getElementById("result-container");
    // Clean up previous confetti
    container.querySelectorAll(".confetti").forEach(el => el.remove());

    const colors = ["#ffd200", "#ff6b6b", "#4ecdc4", "#667eea", "#764ba2", "#f093fb"];

    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + "px";
        confetti.style.height = Math.random() * 10 + 5 + "px";
        confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
        confetti.style.animationDuration = Math.random() * 3 + 2 + "s";
        confetti.style.animationDelay = Math.random() * 2 + "s";
        container.appendChild(confetti);
    }
}

function retry() {
    document.getElementById("result-container").classList.add("hidden");
    // Recharger des sociétés aléatoires et réinitialiser la roue
    wheelCompanies = pickRandomCompanies();
    currentAngle = 0;
    drawWheel();
}

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
    createConfetti();
    document.getElementById("company-count").textContent =
        companies.length + " actions du MSCI World en jeu";
});
