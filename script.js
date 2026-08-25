// =====================================================================
// KONFIGURASI — WAJIB DIISI
// =====================================================================
// Site ini di-host statis (tanpa backend/API route), jadi request ke
// API AM dipanggil LANGSUNG dari browser. Konsekuensinya: API key di
// bawah ini KELIHATAN oleh siapa pun yang buka DevTools / "View Source"
// situs kamu. Kalau butuh key ini tetap rahasia, host ini bukan pilihan
// yang tepat — perlu backend/proxy (mis. Vercel Serverless Function).
const AM_API_KEY = 'PASTE_API_KEY_KAMU_DI_SINI';

const SEND_LINK_URL = 'https://api.alwayscodex.eu.cc/api/am/sendv2';
const VERIF_URL = 'https://api.alwayscodex.eu.cc/api/am/verifv2';
// =====================================================================

// Decorative ruler ticks
(function buildTicks() {
  const ticks = document.getElementById('ticks');
  if (!ticks) return;
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('span');
    ticks.appendChild(s);
  }
})();

// ---------------- Activation flow ----------------
const stepper = document.getElementById('stepper');
const stepperFill = document.getElementById('stepperFill');
const steps = Array.from(document.querySelectorAll('.step'));
const stages = {
  1: document.getElementById('stage1'),
  2: document.getElementById('stage2'),
  3: document.getElementById('stage3'),
};
const statusBox = document.getElementById('statusBox');

const emailInput = document.getElementById('emailInput');
const linkInput = document.getElementById('linkInput');
const sendBtn = document.getElementById('sendBtn');
const verifyBtn = document.getElementById('verifyBtn');
const backBtn = document.getElementById('backBtn');
const restartBtn = document.getElementById('restartBtn');

let currentEmail = '';

function setStatus(kind, message) {
  if (!message) {
    statusBox.className = 'status';
    statusBox.textContent = '';
    return;
  }
  statusBox.className = `status visible ${kind}`;
  statusBox.textContent = message;
}

function goToStage(n) {
  Object.values(stages).forEach((el) => el.classList.remove('visible'));
  stages[n].classList.add('visible');

  steps.forEach((el) => {
    const idx = Number(el.dataset.step);
    el.classList.remove('active', 'done');
    if (idx < n) el.classList.add('done');
    else if (idx === n) el.classList.add('active');
  });

  const fillPct = n === 1 ? 0 : n === 2 ? 50 : 100;
  stepperFill.style.width = fillPct + '%';
  setStatus(null);
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

sendBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!isValidEmail(email)) {
    setStatus('error', 'Email belum valid. Contoh: nama@gmail.com');
    return;
  }
  if (!AM_API_KEY || AM_API_KEY.startsWith('PASTE_')) {
    setStatus('error', 'AM_API_KEY belum diisi di script.js. Edit dulu sebelum publish.');
    return;
  }

  currentEmail = email;
  sendBtn.disabled = true;
  setStatus('pending', 'Lagi ngirim login link ke email kamu...');

  try {
    const res = await fetch(SEND_LINK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AM_API_KEY,
      },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.success !== false) {
      setStatus('ok', 'Login link terkirim. Cek inbox / folder spam.');
      setTimeout(() => goToStage(2), 500);
    } else {
      setStatus('error', data?.message || 'Gagal mengirim login link.');
    }
  } catch (err) {
    setStatus('error', 'Terjadi kesalahan jaringan / CORS. Coba lagi.');
  } finally {
    sendBtn.disabled = false;
  }
});

verifyBtn.addEventListener('click', async () => {
  const link = linkInput.value.trim();
  if (!/^https?:\/\//i.test(link)) {
    setStatus('error', 'Tempel link login yang valid (diawali http/https).');
    return;
  }

  verifyBtn.disabled = true;
  setStatus('pending', 'Lagi verifikasi link login...');

  try {
    const res = await fetch(VERIF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, link }),
    });
    const data = await res.json().catch(() => ({}));
    const message = String(data?.message || '').trim();

    if (res.ok && (message === 'Premium berhasil diterapkan' || data?.success === true)) {
      goToStage(3);
    } else {
      setStatus('error', message || 'Verifikasi gagal, link mungkin kadaluarsa.');
    }
  } catch (err) {
    setStatus('error', 'Terjadi kesalahan jaringan / CORS. Coba lagi.');
  } finally {
    verifyBtn.disabled = false;
  }
});

backBtn.addEventListener('click', () => goToStage(1));

restartBtn.addEventListener('click', () => {
  emailInput.value = '';
  linkInput.value = '';
  currentEmail = '';
  goToStage(1);
});

goToStage(1);
