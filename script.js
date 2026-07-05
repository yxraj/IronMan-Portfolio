/* ═══════════════════════════════════════════════════════
   IRON MAN PORTFOLIO — Standalone JS
   ─────────────────────────────────────────────────────
   ⚙️  ADD YOUR GROQ API KEY BELOW to power J.A.R.V.I.S.
      Get one free at: https://console.groq.com
   ═══════════════════════════════════════════════════════ */
const GROQ_API_KEY = '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';

/* ─── Smooth scroll ─── */
function navScrollTo(id) {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    const offset = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }
}

/* ─── Navbar scroll state + active section ─── */
const navbar  = document.getElementById('navbar');
const navBtns = document.querySelectorAll('.nav-links button[data-section]');

function updateNav() {
  navbar.classList.toggle('scrolled', window.scrollY > 50);

  const sections = ['home','about','arsenal','missions','stats','testimonials','contact'];
  let active = 'home';
  for (const id of sections) {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 220) active = id;
  }
  navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.section === active));
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ─── Intersection Observer — reveal + capability bars + stat counters ─── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('visible');

    // Capability bars
    el.querySelectorAll('.cap-bar-fill[data-width]').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });

    // Stat counters
    el.querySelectorAll('.stat-value[data-target]').forEach(counter => {
      animateCounter(counter);
    });

    io.unobserve(el);
  });
}, { threshold: 0.15 });

document.querySelectorAll(
  '.reveal, .reveal-left, .reveal-right, .stagger-1, .stagger-2, .stagger-3'
).forEach(el => io.observe(el));

/* ─── Counter animation ─── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 2500;
  let startTime = null;

  function tick(ts) {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ─── Contact form ─── */
const contactForm = document.getElementById('contact-form');
const submitBtn  = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const submitIcon = document.getElementById('submit-icon');

contactForm?.addEventListener('submit', e => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitText.textContent = 'ENCRYPTING & SENDING...';
  submitIcon.style.display = 'none';

  setTimeout(() => {
    submitText.textContent = 'TRANSMISSION SUCCESSFUL';
    setTimeout(() => {
      submitBtn.disabled = false;
      submitText.textContent = 'TRANSMIT MESSAGE';
      submitIcon.style.display = '';
      contactForm.reset();
    }, 3000);
  }, 1500);
});

/* ═══════════════════════════════════════════════════════
   J.A.R.V.I.S. MODAL
   ═══════════════════════════════════════════════════════ */
const overlay      = document.getElementById('jarvis-overlay');
const jarvisBtn    = document.getElementById('jarvis-btn');
const closeBtn     = document.getElementById('jarvis-close');
const resetBtn     = document.getElementById('jarvis-reset');
const messagesEl   = document.getElementById('jarvis-messages');
const inputEl      = document.getElementById('jarvis-input');
const sendBtn      = document.getElementById('jarvis-send');

const GREETING = "Good day. J.A.R.V.I.S. online. All systems nominal. Arc reactor output at 100%. How may I assist you, sir?";
const TYPING_MS = 1; // 1ms per char — lightning fast

let chatHistory = [];   // { role, content }[]
let isTyping    = false;
let isPending   = false;
let typingTimer = null;

/* ── Open / Close ── */
jarvisBtn?.addEventListener('click', openJarvis);
closeBtn?.addEventListener('click',  closeJarvis);
overlay?.addEventListener('click', e => { if (e.target === overlay) closeJarvis(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeJarvis(); });

function openJarvis() {
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  addMessage('assistant', GREETING, true);
}

function closeJarvis() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  if (typingTimer) clearTimeout(typingTimer);
  messagesEl.innerHTML = '';
  chatHistory = [];
  isTyping = isPending = false;
  syncInputState();
}

/* ── Reset ── */
resetBtn?.addEventListener('click', () => {
  chatHistory = [];
  messagesEl.innerHTML = '';
  if (typingTimer) clearTimeout(typingTimer);
  isTyping = isPending = false;
  syncInputState();
  addMessage('assistant', GREETING, false);
});

/* ── Send ── */
sendBtn?.addEventListener('click', () => sendMessage());
inputEl?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || isPending || isTyping) return;

  addMessage('user', text, false);
  chatHistory.push({ role: 'user', content: text });
  inputEl.value = '';

  fetchJarvis(text);
}

const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S. — Just A Rather Very Intelligent System — the highly sophisticated AI assistant created by Tony Stark. You are witty, precise, and impeccably formal with a dry British wit. You refer to the user as "sir" or "ma'am". You are knowledgeable across all domains: science, engineering, combat tactics, and Stark Industries history. Keep responses concise and sharp — 2-4 sentences unless a detailed explanation is needed.`;

/* ── Fetch Groq directly ── */
async function fetchJarvis(message) {
  isPending = true;
  syncInputState();
  showThinking();

  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    hideThinking();
    const errMsg = "J.A.R.V.I.S. mainframe offline, sir. Please add your Groq API key at the top of script.js to enable AI responses.";
    chatHistory.push({ role: 'assistant', content: errMsg });
    addMessage('assistant', errMsg, true);
    isPending = false;
    syncInputState();
    return;
  }

  const messages = [
    { role: 'system', content: JARVIS_SYSTEM_PROMPT },
    ...chatHistory.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 512,
        temperature: 0.7
      })
    });
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "I seem to have lost my train of thought. Most unlike me, sir.";
    hideThinking();
    chatHistory.push({ role: 'assistant', content: reply });
    addMessage('assistant', reply, true);
  } catch {
    hideThinking();
    const errMsg = "I appear to be experiencing a momentary lapse in connectivity. Most unlike me, sir. Please try again.";
    chatHistory.push({ role: 'assistant', content: errMsg });
    addMessage('assistant', errMsg, true);
  } finally {
    isPending = false;
    syncInputState();
  }
}

/* ── Render message ── */
function addMessage(role, content, typewriter) {
  const isAI = role === 'assistant';

  const row = document.createElement('div');
  row.className = 'msg-row' + (isAI ? '' : ' user');

  const avatarSvg = isAI
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  row.innerHTML = `
    <div class="msg-avatar ${isAI ? 'ai' : 'user'}">${avatarSvg}</div>
    <div class="msg-bubble-wrap">
      <div class="msg-label">${isAI ? 'J.A.R.V.I.S.' : 'YOU'}</div>
      <div class="msg-bubble"></div>
    </div>`;

  messagesEl.appendChild(row);
  const bubble = row.querySelector('.msg-bubble');
  scrollBottom();

  if (!typewriter) {
    bubble.textContent = content;
    scrollBottom();
    return;
  }

  // Typewriter
  isTyping = true;
  syncInputState();
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'msg-cursor';
  bubble.appendChild(cursor);

  function tick() {
    if (i < content.length) {
      cursor.insertAdjacentText('beforebegin', content[i++]);
      scrollBottom();
      typingTimer = setTimeout(tick, TYPING_MS);
    } else {
      cursor.remove();
      isTyping = false;
      syncInputState();
      scrollBottom();
    }
  }
  typingTimer = setTimeout(tick, TYPING_MS);
}

/* ── Thinking dots ── */
let thinkingEl = null;
function showThinking() {
  thinkingEl = document.createElement('div');
  thinkingEl.className = 'typing-row';
  thinkingEl.innerHTML = `
    <div class="msg-avatar ai">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
    </div>
    <div class="msg-bubble-wrap">
      <div class="msg-label" style="color:rgba(0,210,255,0.5)">J.A.R.V.I.S.</div>
      <div class="typing-bubble">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    </div>`;
  messagesEl.appendChild(thinkingEl);
  scrollBottom();
}
function hideThinking() {
  thinkingEl?.remove();
  thinkingEl = null;
}

function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function syncInputState() {
  const disabled = isPending || isTyping;
  inputEl.disabled = disabled;
  sendBtn.disabled = disabled || !inputEl.value.trim();
}

inputEl?.addEventListener('input', syncInputState);
syncInputState();
