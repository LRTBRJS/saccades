// ========================================
// ESTADO GLOBAL (inercia + dominancia)
// ========================================

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

let currentDominant = null;

const stage = document.getElementById("stage");


// ========================================
// ASSETS
// ========================================

const assets = [
  { type: "img", src: "assets/imagenA.jpg" },
  { type: "img", src: "assets/imagenB.gif" },
  { type: "img", src: "assets/imagenC.jpg" },
  { type: "img", src: "assets/imagenD.jpg" },
  { type: "video", src: "assets/imagenB.mp4", audio: true }
];

let elements = [];


// ========================================
// CREACIÓN DE ELEMENTOS
// ========================================

function createAssets() {

  assets.forEach((obj) => {

    let el;

    // tipo de elemento
    if (obj.type === "video") {
      el = document.createElement("video");
      el.src = obj.src;
      el.autoplay = true;
      el.loop = true;
      el.muted = true;
      el.playsInline = true;
    } else {
      el = document.createElement("img");
      el.src = obj.src;
    }

    // marca de audio
    if (obj.audio) {
      el.dataset.hasAudio = "true";
    }

    el.classList.add("asset");

    // comportamiento individual (velocidad / respuesta)
    let r = Math.random();

    if (r < 0.2) {
      el.dataset.scaleFactor = 0.2 + Math.random() * 0.3;
    } else if (r < 0.8) {
      el.dataset.scaleFactor = 0.5 + Math.random() * 0.5;
    } else {
      el.dataset.scaleFactor = 1.0 + Math.random() * 0.6;
    }

    el.dataset.activity = 0;

    // posición inicial
    const x = Math.random() * window.innerWidth * 0.8;
    const y = Math.random() * window.innerHeight * 0.8;

    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.width = "200px";

    stage.appendChild(el);
    elements.push(el);

  });

}

createAssets();


// ========================================
// CONFIGURACIÓN GENERAL
// ========================================

let zoom = 1;

const config = {
  baseSpeed: 0.002,
  irregularity: 0.6,
  attractionRadius: 250
};


// ========================================
// ZOOM (entrada principal)
// ========================================

stage.addEventListener("wheel", (e) => {

  e.preventDefault();

  const noise = 1 + (Math.random() - 0.5) * config.irregularity;
  zoom += e.deltaY * -config.baseSpeed * noise;

  zoom = Math.max(0.5, Math.min(zoom, 6));

  applyZoom(e.clientX, e.clientY);

});


// ========================================
// LÓGICA PRINCIPAL DEL SISTEMA
// ========================================

function applyZoom(cx, cy) {

  let dominant = null;
  let maxScale = 0;

  elements.forEach(el => {

    let factor = parseFloat(el.dataset.scaleFactor);

    const rect = el.getBoundingClientRect();
    const ex = rect.left + rect.width / 2;
    const ey = rect.top + rect.height / 2;

    const dx = ex - cx;
    const dy = ey - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // proximidad al cursor
    let proximity = Math.max(0, 1 - dist / config.attractionRadius);

    // memoria (con fuga)
    let activity = parseFloat(el.dataset.activity);
    activity += proximity * 0.05;

    if (proximity < 0.2) {
      activity *= 0.7;
    } else {
      activity *= 0.9;
    }

    el.dataset.activity = activity;

    // influencia total
    let influence = factor * 0.9 + proximity * 1.4 + activity * 0.2;

    // escala
    let scale = 1 + (zoom - 1) * (influence * 0.7);

    // visual
    el.style.opacity = Math.min(1, 0.6 + influence * 0.25);
    el.style.zIndex = Math.floor(scale * 10);
    el.style.transform = `scale(${scale})`;

    // detectar dominante
    if (scale > maxScale) {
      maxScale = scale;
      dominant = el;
    }

  });

  // ========================================
  // ENTRADA A IMAGEN (estado habitable)
  // ========================================

  if (dominant) {

    const rect = dominant.getBoundingClientRect();
    const area = rect.width * rect.height;
    const screenArea = window.innerWidth * window.innerHeight;

    const coverage = area / screenArea;

    currentDominant = (coverage > 0.5) ? dominant : null;

  } else {
    currentDominant = null;
  }


  // ========================================
  // AUDIO (por dominancia)
  // ========================================

  elements.forEach(el => {

    if (el.dataset.hasAudio === "true") {

      if (currentDominant === el) {
        el.muted = false;
        el.volume = 1;
      } else {
        el.muted = true;
        el.volume = 0;
      }

    }

  });

}


// ========================================
// MOVIMIENTO DENTRO DE LA IMAGEN (A + C)
// ========================================

stage.addEventListener("mousemove", (e) => {

  if (!currentDominant) return;

  const rect = currentDominant.getBoundingClientRect();

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let dx = (e.clientX - cx);
  let dy = (e.clientY - cy);

  const dist = Math.sqrt(dx * dx + dy * dy);

  const maxDist = rect.width * 0.35;

  let t = dist / maxDist;

  let falloff = Math.max(0, 1 - t);
  falloff = falloff * falloff;

  targetX = dx * falloff;
  targetY = dy * falloff;

});


// ========================================
// INERCIA (suavizado)
// ========================================

function updateInertia() {

  currentX += (targetX - currentX) * 0.05;
  currentY += (targetY - currentY) * 0.05;

  if (currentDominant) {
    currentDominant.style.left =
      (currentDominant.offsetLeft + currentX * 0.02) + "px";

    currentDominant.style.top =
      (currentDominant.offsetTop + currentY * 0.02) + "px";
  }

  requestAnimationFrame(updateInertia);
}

updateInertia();
