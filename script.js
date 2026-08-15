"use strict";

const VIDEOS_JSON_URL = "cortes/videos.json";

const categoryLabels = {
  corte: "Corte",
  barba: "Barba",
  combo: "Pelo + Barba"
};

let currentFilter = "todos";
let videoItems = [];

const gallery = document.querySelector("#gallery");
const filterButtons = document.querySelectorAll(".filter-btn");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const year = document.querySelector("#year");

function sanitizeText(value, maxLength = 80) {
  return String(value ?? "")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, maxLength);
}

function isValidVideoFile(fileName) {
  return /^[a-zA-Z0-9._-]+\.(mp4|webm)$/i.test(fileName);
}

function normalizeVideoItem(item, index) {
  const title = sanitizeText(item?.title, 70);
  const category = sanitizeText(item?.category, 20);
  const file = sanitizeText(item?.file, 120);

  if (!title || !categoryLabels[category] || !isValidVideoFile(file)) {
    return null;
  }

  return {
    id: `${file}-${index}`,
    title,
    category,
    src: `cortes/${encodeURIComponent(file)}`
  };
}

async function loadVideos() {
  try {
    const response = await fetch(VIDEOS_JSON_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`No se pudo cargar ${VIDEOS_JSON_URL}. Código: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("El archivo videos.json debe contener una lista de vídeos.");
    }

    videoItems = data
      .map((item, index) => normalizeVideoItem(item, index))
      .filter(Boolean);
  } catch (error) {
    console.error("Error cargando vídeos:", error);
    videoItems = [];
  }
}

function createVideo(item) {
  const video = document.createElement("video");
  video.className = "work-card__media";
  video.src = item.src;
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.setAttribute("aria-label", item.title);
  return video;
}

function renderGallery() {
  const filteredItems = currentFilter === "todos"
    ? videoItems
    : videoItems.filter((item) => item.category === currentFilter);

  gallery.innerHTML = "";

  if (filteredItems.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Todavía no hay vídeos en esta categoría. Sube vídeos a la carpeta cortes/ y añádelos en cortes/videos.json.";
    gallery.appendChild(emptyState);
    return;
  }

  filteredItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "work-card";

    const body = document.createElement("div");
    body.className = "work-card__body";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "work-card__meta";

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = categoryLabels[item.category];

    meta.appendChild(tag);
    body.append(title, meta);
    card.append(createVideo(item), body);
    gallery.appendChild(card);
  });
}

function setupFilters() {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter ?? "todos";
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      renderGallery();
    });
  });
}

function setupNavigation() {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

async function init() {
  if (!gallery || !navToggle || !navLinks || !year) {
    throw new Error("Faltan elementos necesarios en la página.");
  }

  year.textContent = String(new Date().getFullYear());
  setupNavigation();
  setupFilters();
  await loadVideos();
  renderGallery();
}

init().catch((error) => {
  console.error("No se pudo iniciar la web:", error);
});
