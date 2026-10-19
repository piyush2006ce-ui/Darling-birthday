const $ = (s) => document.querySelector(s);
const heartField = $("#heart-field");
const toast = $("#toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function spawnHeart() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const heart = document.createElement("span");
  heart.className = "floating-heart";
  heart.textContent = ["♡", "♥", "✧"][Math.floor(Math.random() * 3)];
  heart.style.left = Math.random() * 100 + "vw";
  heart.style.fontSize = (10 + Math.random() * 18) + "px";
  heart.style.animationDuration = (8 + Math.random() * 8) + "s";
  heartField.appendChild(heart);
  setTimeout(() => heart.remove(), 17000);
}
setInterval(spawnHeart, 950);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

$("#open-story").addEventListener("click", () => {
  $("#letter-start").scrollIntoView({ behavior: "smooth" });
  for (let i = 0; i < 8; i++) setTimeout(spawnHeart, i * 120);
});
$("#secret-button").addEventListener("click", () => {
  $("#finale").scrollIntoView({ behavior: "smooth" });
  burstConfetti();
});
$("#replay").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("A little world, just for you, Baby ♡");
});

function burstConfetti() {
  const layer = document.createElement("div");
  layer.className = "celebration";
  document.body.appendChild(layer);
  for (let i = 0; i < 85; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = ["#ed9bb8", "#d8b78b", "#fff0f4", "#b68ac6"][i % 4];
    piece.style.animationDelay = Math.random() * 0.7 + "s";
    piece.style.animationDuration = (2.1 + Math.random() * 1.7) + "s";
    layer.appendChild(piece);
  }
  setTimeout(() => layer.remove(), 5000);
}

const audio = $("#our-song");
const musicToggle = $("#music-toggle");
const musicLabel = $("#music-label");
const entryGate = $("#entry-gate");
const enterSite = $("#enter-site");

function setMusicPlaying(playing) {
  musicToggle.classList.toggle("playing", playing);
  musicLabel.textContent = playing ? "NOW PLAYING" : "OUR SONG";
}

async function startSong() {
  try {
    audio.volume = 0.8;
    await audio.play();
    setMusicPlaying(true);
    return true;
  } catch (err) {
    setMusicPlaying(false);
    return false;
  }
}

// Try autoplay on page load. If the browser blocks it, keep the entry gate visible.
window.addEventListener("load", async () => {
  const started = await startSong();
  if (started) {
    entryGate.classList.add("gate-hidden");
    document.body.classList.remove("gate-active");
  } else {
    document.body.classList.add("gate-active");
  }
});

enterSite.addEventListener("click", async () => {
  const started = await startSong();
  if (started) {
    entryGate.classList.add("gate-hidden");
    document.body.classList.remove("gate-active");
    showToast("Our song is playing, Baby ♡");
    burstConfetti();
  } else {
    showToast("Tap the music button once more to start the song ♡");
  }
});

musicToggle.addEventListener("click", async () => {
  if (audio.paused) {
    const started = await startSong();
    if (!started) showToast("Please tap once more to allow the song ♡");
  } else {
    audio.pause();
    setMusicPlaying(false);
  }
});

audio.addEventListener("ended", () => {
  // loop normally restarts the audio; this is a fallback for browser edge cases.
  if (audio.loop) audio.play().catch(() => {});
});
audio.addEventListener("error", () => {
  showToast("Song file not found — check assets/tu-hi-tu.mp3");
});

// Small birthday confetti greeting when the date is October 21, local time.
const now = new Date();
if (now.getMonth() === 9 && now.getDate() === 21) {
  setTimeout(() => { burstConfetti(); showToast("Happy Birthday, Baby! ♡"); }, 900);
}


