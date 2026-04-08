// -----------------------------
// ESTADO GLOBAL
// -----------------------------
let estado_actual = "undefined";


// -----------------------------
// FIELD (operador: campo)
// -----------------------------
const Field = (() => {

  let fieldWidth, fieldHeight;
  let offsetX, offsetY;

  function init() {
    const r = Math.random();

    if (r < 0.33) {
      fieldWidth = 80;
      fieldHeight = 45;
    } else if (r < 0.66) {
      fieldWidth = 70;
      fieldHeight = 52;
    } else {
      fieldWidth = 35;
      fieldHeight = 90;
    }

    offsetX = -5 + Math.random() * 8;
    offsetY = -10 + Math.random() * 10;
  }

  function getPosition(index) {
    let x, y;

    if (Math.random() < 0.85) {
      x = offsetX + Math.random() * fieldWidth;
      y = offsetY + Math.random() * fieldHeight;
    } else {
      x = Math.random() * 90;
      y = Math.random() * 120;
    }

    if (index === 0) {
      x = offsetX + fieldWidth * 0.3 + Math.random() * (fieldWidth * 0.4);
      y = offsetY + fieldHeight * 0.3 + Math.random() * (fieldHeight * 0.4);
    }

    return { x, y };
  }

  return { init, getPosition };

})();


// -----------------------------
// UTILIDAD
// -----------------------------
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}


// -----------------------------
// LABEL (render)
// -----------------------------
function showLabel(text, rect, duration) {
  const label = document.createElement("div");

  label.innerText = text;

  label.style.position = "fixed";
  label.style.left = rect.left + "px";
  label.style.top = rect.top + "px";
  label.style.width = rect.width + "px";
  label.style.height = rect.height + "px";

  label.style.display = "flex";
  label.style.alignItems = "center";
  label.style.justifyContent = "center";

  label.style.fontSize = "14px";
  label.style.letterSpacing = "1px";
  label.style.color = "black";
  label.style.opacity = "0";
  label.style.transition = `opacity ${duration}ms ease`;

  label.style.pointerEvents = "none";
  label.style.zIndex = "99999";

  document.body.appendChild(label);

  setTimeout(() => label.style.opacity = "0.35", 20);
  setTimeout(() => label.style.opacity = "0", duration * 0.5);
  setTimeout(() => label.remove(), duration);
}


// -----------------------------
// SISTEMA
// -----------------------------
const System = (() => {

  const stage = document.getElementById("stage");

  function loadImages() {

    stage.innerHTML = "";
    Field.init();

    fetch('state.json')
      .then(res => res.json())
      .then(data => {

        const shuffled = shuffle(data);

        let forced = null;

        if (estado_actual !== "undefined") {
          const same = shuffled.filter(i => i.category === estado_actual);
          if (same.length) {
            forced = same[Math.floor(Math.random() * same.length)];
          }
        }

        let selected = [];

        if (forced) {
          selected.push({ item: forced, size: "large" });
        }

        let pool = shuffled.filter(i => !forced || i.file !== forced.file);

        while (selected.length < 3 && pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];

          selected.push({
            item: pick,
            size: ["medium", "small"][Math.floor(Math.random() * 2)]
          });

          pool = pool.filter(i => i.file !== pick.file);
        }

        selected.forEach((obj, index) => {

          let media;

          const file = obj.item.file.split("?")[0].toLowerCase();

          if (file.endsWith(".mp4")) {
            media = document.createElement("video");
            media.src = obj.item.file;
            media.autoplay = true;
            media.loop = true;
            media.muted = true;
            media.playsInline = true;
          } else {
            media = document.createElement("img");
            media.src = obj.item.file;
          }

          if (obj.size === "large") media.style.width = "60vw";
          if (obj.size === "medium") media.style.width = "35vw";
          if (obj.size === "small") media.style.width = "15vw";

          const pos = Field.getPosition(index);

          media.style.position = "absolute";
          media.style.left = pos.x + "vw";
          media.style.top = pos.y + "vh";

          const cat = obj.item.category;
          const state = estado_actual;

          const opacityMap = {
            best: { best: 1, still: 0.5, off: 0.25, undefined: 0.15 },
            still: { still: 1, best: 0.6, off: 0.3, undefined: 0.2 },
            off: { off: 1, best: 0.5, still: 0.3, undefined: 0.2 },
            undefined: { best: 0.85, still: 0.85, off: 0.85, undefined: 0.85 }
          };

          let opacity = opacityMap[state]?.[cat] ?? 1;

          media.style.opacity = opacity;
          media.style.transition = "opacity 0.6s ease";

          media.addEventListener("click", (e) => {
            e.stopPropagation();
            enterImage(
              obj.item.file,
              media.getBoundingClientRect(),
              obj.item.category,
              obj.item.title,
              obj.item.delay
            );
          });

          stage.appendChild(media);
        });

      });
  }


  function enterImage(file, originRect, category, title, delay = 120) {

    stage.innerHTML = "";

    let media;

    const cleanFile = file.split("?")[0].toLowerCase();

    if (cleanFile.endsWith(".mp4")) {
      media = document.createElement("video");
      media.src = file;
      media.loop = true;
      media.muted = false;
      media.playsInline = true;
      media.play().catch(() => {});
    } else {
      media = document.createElement("img");
      media.src = file;
    }

    media.style.width = "2000px";

    setTimeout(() => {
      stage.appendChild(media);
    }, delay || 120);

    media.addEventListener("click", function handleExit() {
      media.removeEventListener("click", handleExit);
      exit(media, originRect, category, title);
    });
  }


  function exit(img, originRect, category, title) {

    let DURATION = 1200;

    const plate = document.createElement("div");

    plate.style.position = "fixed";
    plate.style.left = originRect.left + "px";
    plate.style.top = originRect.top + "px";
    plate.style.width = originRect.width + "px";
    plate.style.height = originRect.height + "px";

    plate.style.background = "white";
    plate.style.opacity = "0";
    plate.style.transition = "opacity 0.3s ease";

    plate.style.pointerEvents = "none";
    plate.style.zIndex = 9999;

    document.body.appendChild(plate);

    img.style.transition = "opacity 0.3s ease";
    img.style.opacity = "0";

    setTimeout(() => {
      plate.style.opacity = "1";
    }, 50);

    showLabel(title || category, originRect, DURATION);

    setTimeout(() => {
      if (plate.parentNode) plate.remove();
      System.loadImages();
    }, DURATION);
  }

  return { loadImages };

})();


// -----------------------------
// INIT
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {

  const menuButtons = document.querySelectorAll("#menu button");

  menuButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      estado_actual = btn.dataset.state;
      System.loadImages();
    });
  });

  System.loadImages();

});



