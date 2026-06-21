const presets = [
  { label: "16:9", w: 1920, h: 1080 },
  { label: "9:16", w: 1080, h: 1920 },
  { label: "1:1", w: 1080, h: 1080 },
  { label: "4:5", w: 1080, h: 1350 },
  { label: "5:4", w: 1350, h: 1080 },
  { label: "4:3", w: 1440, h: 1080 },
  { label: "3:2", w: 3000, h: 2000 },
  { label: "2:3", w: 2000, h: 3000 },
  { label: "21:9", w: 2560, h: 1080 },
  { label: "2.39:1", w: 2389, h: 1000 },
];

const MIN_SIZE = 1;
const MAX_SIZE = 999999;
const COPY_ICON = "⧉";
const ALLBOT_ANALYTICS_URL = "https://all-bot.ru/api/apps/sizer";
const ALLBOT_SESSION_KEY = "allbot-session-id";

const elements = {
  area: document.querySelector("#scale-area"),
  frame: document.querySelector("#frame-wrap"),
  empty: document.querySelector("#empty-state"),
  widthInput: document.querySelector("#width-input"),
  heightInput: document.querySelector("#height-input"),
  widthLabel: document.querySelector("#width-label"),
  heightLabel: document.querySelector("#height-label"),
  centerLabel: document.querySelector("#center-label"),
  ratioValue: document.querySelector("#ratio-value"),
  chipRatio: document.querySelector("#chip-ratio"),
  pixelsValue: document.querySelector("#pixels-value"),
  orientationValue: document.querySelector("#orientation-value"),
  orientationGlyph: document.querySelector("#orientation-glyph"),
  swapButton: document.querySelector("#swap-button"),
  copyButtons: document.querySelectorAll("[data-copy-size]"),
  resizeHandles: document.querySelectorAll("[data-resize]"),
  presets: document.querySelector("#presets"),
};

let activeResize = null;

function getAllBotSessionId() {
  try {
    const existing = localStorage.getItem(ALLBOT_SESSION_KEY);
    if (existing) return existing;

    const next = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(ALLBOT_SESSION_KEY, next);
    return next;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function trackAllBotView() {
  if (window.location.protocol === "file:") return;

  fetch(ALLBOT_ANALYTICS_URL, {
    method: "POST",
    mode: "cors",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "view",
      sessionId: getAllBotSessionId(),
      metadata: {
        path: window.location.pathname,
        referrer: document.referrer || null,
        title: document.title,
      },
    }),
  }).catch(() => {});
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function ratioString(w, h) {
  const divisor = gcd(w, h);
  const rw = w / divisor;
  const rh = h / divisor;

  if (rw <= 50 && rh <= 50) {
    return `${rw} : ${rh}`;
  }

  const decimal = w / h;
  return decimal >= 1 ? `${decimal.toFixed(2)} : 1` : `1 : ${(1 / decimal).toFixed(2)}`;
}

function megapixelsString(w, h) {
  const value = (w * h) / 1e6;
  return value >= 100 ? `${Math.round(value)} МП` : `${value.toFixed(2)} МП`;
}

function clean(value) {
  return value.replace(/[^\d]/g, "").slice(0, 6);
}

function clampSize(value) {
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)));
}

function getSize() {
  const w = Number.parseInt(elements.widthInput.value, 10) || 0;
  const h = Number.parseInt(elements.heightInput.value, 10) || 0;
  return { w, h, valid: w >= 1 && h >= 1 };
}

function orientation(w, h) {
  if (w > h) return "Горизонтальная";
  if (w < h) return "Вертикальная";
  return "Квадрат";
}

function fitFrame(w, h) {
  const rect = elements.area.getBoundingClientRect();
  if (!rect.width || !rect.height) return { fw: 0, fh: 0 };

  const scale = Math.min(rect.width / w, rect.height / h);
  return {
    fw: Math.max(0, w * scale),
    fh: Math.max(0, h * scale),
  };
}

function setSize(w, h) {
  elements.widthInput.value = String(clampSize(w));
  elements.heightInput.value = String(clampSize(h));
  render();
}

function eventPoint(event) {
  return event.touches?.[0] || event.changedTouches?.[0] || event;
}

function updateGlyph(w, h) {
  const scale = Math.min(20 / w, 20 / h);
  const gw = Math.max(4, Math.round(w * scale));
  const gh = Math.max(4, Math.round(h * scale));
  elements.orientationGlyph.style.setProperty("--glyph-w", `${gw}px`);
  elements.orientationGlyph.style.setProperty("--glyph-h", `${gh}px`);
}

function updatePresetState(w, h) {
  document.querySelectorAll(".preset").forEach((button) => {
    const isActive = Number(button.dataset.w) === w && Number(button.dataset.h) === h;
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function render() {
  const { w, h, valid } = getSize();

  if (!valid) {
    elements.frame.style.display = "none";
    elements.empty.style.display = "block";
    elements.ratioValue.textContent = "—";
    elements.chipRatio.textContent = "—";
    elements.pixelsValue.textContent = "—";
    elements.orientationValue.textContent = "—";
    updatePresetState(0, 0);
    return;
  }

  const { fw, fh } = fitFrame(w, h);
  const ratio = ratioString(w, h);

  elements.empty.style.display = "none";
  elements.frame.style.display = "block";
  elements.frame.style.width = `${fw}px`;
  elements.frame.style.height = `${fh}px`;
  elements.widthLabel.textContent = String(w);
  elements.heightLabel.textContent = String(h);
  elements.centerLabel.textContent = `${w}x${h}`;
  elements.centerLabel.style.display = fw > 108 && fh > 48 ? "inline-block" : "none";
  elements.ratioValue.textContent = ratio;
  elements.chipRatio.textContent = ratio;
  elements.pixelsValue.textContent = megapixelsString(w, h);
  elements.orientationValue.textContent = orientation(w, h);

  updateGlyph(w, h);
  updatePresetState(w, h);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the textarea fallback.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showCopied(button) {
  button.classList.add("copied");
  button.textContent = "✓";
  window.setTimeout(() => {
    button.classList.remove("copied");
    button.textContent = COPY_ICON;
  }, 900);
}

function startResize(event) {
  if (activeResize) return;
  if ((event.type === "mousedown" || event.pointerType === "mouse") && event.button !== 0) return;

  const { w, h, valid } = getSize();
  if (!valid) return;

  const point = eventPoint(event);
  const { fw, fh } = fitFrame(w, h);
  const scale = Math.max(fw / w || 0, fh / h || 0, 0.0001);
  const mode = event.type.startsWith("pointer") ? "pointer" : event.type.startsWith("touch") ? "touch" : "mouse";

  activeResize = {
    handle: event.currentTarget.dataset.resize,
    mode,
    pointerId: event.pointerId ?? null,
    startX: point.clientX,
    startY: point.clientY,
    startW: w,
    startH: h,
    scale,
  };

  if (mode === "pointer") {
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  bindResizeMove(activeResize.mode);
  document.body.classList.add("is-resizing");
  event.preventDefault();
}

function moveResize(event) {
  if (!activeResize) return;
  if (activeResize.mode === "pointer" && event.pointerId !== activeResize.pointerId) return;

  const point = eventPoint(event);
  const dx = (point.clientX - activeResize.startX) / activeResize.scale;
  const dy = (point.clientY - activeResize.startY) / activeResize.scale;
  let nextW = activeResize.startW;
  let nextH = activeResize.startH;

  if (activeResize.handle.includes("e")) nextW = activeResize.startW + dx;
  if (activeResize.handle.includes("w")) nextW = activeResize.startW - dx;
  if (activeResize.handle.includes("s")) nextH = activeResize.startH + dy;
  if (activeResize.handle.includes("n")) nextH = activeResize.startH - dy;

  setSize(nextW, nextH);
  event.preventDefault();
}

function endResize(event) {
  if (!activeResize) return;
  if (activeResize.mode === "pointer" && event.pointerId !== activeResize.pointerId) return;
  unbindResizeMove(activeResize.mode);
  activeResize = null;
  document.body.classList.remove("is-resizing");
}

function bindResizeMove(mode) {
  if (mode === "pointer") {
    document.addEventListener("pointermove", moveResize);
    document.addEventListener("pointerup", endResize);
    document.addEventListener("pointercancel", endResize);
    return;
  }

  if (mode === "touch") {
    document.addEventListener("touchmove", moveResize, { passive: false });
    document.addEventListener("touchend", endResize);
    document.addEventListener("touchcancel", endResize);
    return;
  }

  document.addEventListener("mousemove", moveResize);
  document.addEventListener("mouseup", endResize);
}

function unbindResizeMove(mode) {
  if (mode === "pointer") {
    document.removeEventListener("pointermove", moveResize);
    document.removeEventListener("pointerup", endResize);
    document.removeEventListener("pointercancel", endResize);
    return;
  }

  if (mode === "touch") {
    document.removeEventListener("touchmove", moveResize);
    document.removeEventListener("touchend", endResize);
    document.removeEventListener("touchcancel", endResize);
    return;
  }

  document.removeEventListener("mousemove", moveResize);
  document.removeEventListener("mouseup", endResize);
}

function renderPresets() {
  const fragment = document.createDocumentFragment();

  presets.forEach((preset) => {
    const button = document.createElement("button");
    button.className = "preset";
    button.type = "button";
    button.dataset.w = preset.w;
    button.dataset.h = preset.h;
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<strong>${preset.label}</strong><span>${preset.w}x${preset.h}</span>`;
    button.addEventListener("click", () => {
      elements.widthInput.value = String(preset.w);
      elements.heightInput.value = String(preset.h);
      render();
    });
    fragment.append(button);
  });

  elements.presets.append(fragment);
}

function bindInputs() {
  [elements.widthInput, elements.heightInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.value = clean(input.value);
      render();
    });
  });

  elements.swapButton.addEventListener("click", () => {
    const width = elements.widthInput.value;
    elements.widthInput.value = elements.heightInput.value;
    elements.heightInput.value = width;
    render();
  });

  elements.copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const input = button.dataset.copySize === "width" ? elements.widthInput : elements.heightInput;
      await copyText(input.value);
      showCopied(button);
    });
  });

  elements.resizeHandles.forEach((handle) => {
    handle.addEventListener("pointerdown", startResize);
    handle.addEventListener("mousedown", startResize);
    handle.addEventListener("touchstart", startResize, { passive: false });
  });
}

renderPresets();
bindInputs();
render();
trackAllBotView();

const resizeObserver = new ResizeObserver(render);
resizeObserver.observe(elements.area);
window.addEventListener("orientationchange", render);

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
