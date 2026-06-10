// ===== Recover AI - Advanced Features =====
// Body Heatmap, Condition Forecast, Breathing Exercise, Particle Background

const RecoverAdvanced = (() => {
  // ===== PARTICLE BACKGROUND =====
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const colors = ['rgba(108,140,255,0.3)', 'rgba(167,139,250,0.25)', 'rgba(56,189,248,0.2)', 'rgba(244,114,182,0.15)'];

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      // Draw faint lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(108,140,255,${0.06 * (1 - dist/120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ===== BODY HEATMAP =====
  let currentFatigue = null;

  function updateBodyMap(fatigue) {
    currentFatigue = fatigue;
    const partMap = { eyes: [], neck_shoulder: [], lower_back: [], legs: [] };
    document.querySelectorAll('.bm-part').forEach(el => {
      const part = el.dataset.part;
      if (part && partMap[part]) partMap[part].push(el);
    });

    for (const [key, elements] of Object.entries(partMap)) {
      const score = fatigue[key]?.score || 0;
      let cls = 'fatigue-low';
      if (score >= 5) cls = 'fatigue-high';
      else if (score >= 2) cls = 'fatigue-med';
      elements.forEach(el => {
        el.classList.remove('fatigue-low', 'fatigue-med', 'fatigue-high');
        el.classList.add(cls);
      });
    }

    // Tooltip on hover
    const tooltip = document.getElementById('bodymap-tooltip');
    const container = document.querySelector('.bodymap-container');
    if (!tooltip || !container) return;

    const labels = { eyes: '目', neck_shoulder: '首・肩', lower_back: '腰', legs: '足' };
    document.querySelectorAll('.bm-part').forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        const part = el.dataset.part;
        const score = fatigue[part]?.score || 0;
        const level = score >= 5 ? '高' : score >= 2 ? '中' : '低';
        tooltip.textContent = `${labels[part] || part}: 疲労度 ${level} (${score.toFixed(1)})`;
        tooltip.classList.add('visible');
        const rect = container.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
      });
      el.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
    });
  }

  // ===== CONDITION FORECAST =====
  function updateForecast(fatigue, sleep) {
    const scores = Object.values(fatigue).filter(v => typeof v === 'object').map(v => v.score);
    const totalFatigue = scores.reduce((a, b) => a + b, 0);

    // Base score: higher fatigue = lower forecast, but good sleep recovers
    const cyclesNum = parseInt(sleep.cycles) || 4;
    const recoveryBonus = cyclesNum >= 5 ? 20 : cyclesNum >= 4 ? 10 : 0;
    let forecastScore = Math.max(10, Math.min(98, 90 - totalFatigue * 2 + recoveryBonus));
    forecastScore = Math.round(forecastScore);

    let icon, status, advice;
    if (forecastScore >= 80) {
      icon = '☀️'; status = '絶好調';
      advice = '十分なリカバリが見込めます。明日は高いパフォーマンスで活動できるでしょう！積極的に挑戦してみてください。';
    } else if (forecastScore >= 60) {
      icon = '⛅'; status = 'まずまず';
      advice = 'ある程度の回復が期待できます。午前中に重要なタスクを集中して行い、午後は無理をしないようにしましょう。';
    } else if (forecastScore >= 40) {
      icon = '🌥️'; status = 'やや疲労残り';
      advice = '疲労が少し残る可能性があります。こまめな休憩と水分補給を心がけ、ハードな運動は控えましょう。';
    } else {
      icon = '🌧️'; status = '要注意';
      advice = '疲労の蓄積が見られます。明日は無理をせず、短い昼寝（20分以内）や軽い散歩で回復を優先してください。';
    }

    const el = (id) => document.getElementById(id);
    if (el('forecast-icon')) el('forecast-icon').textContent = icon;
    if (el('forecast-status')) el('forecast-status').textContent = status;
    if (el('forecast-score')) el('forecast-score').textContent = forecastScore;
    if (el('forecast-advice')) el('forecast-advice').textContent = advice;

    // Animate bar
    setTimeout(() => {
      const bar = el('forecast-bar');
      if (bar) bar.style.width = forecastScore + '%';
    }, 300);

    // Call food advice
    updateFoodAdvice(fatigue);
  }

  // ===== FOOD ADVICE =====
  function updateFoodAdvice(fatigue) {
    const el = document.getElementById('food-advice');
    if (!el) return;

    let advice = "バランスの良い食事を心がけましょう。水分補給も忘れずに！";
    let icon = "🍱";
    
    if (fatigue._physicalScore > fatigue._mentalScore) {
      icon = "🥩";
      advice = "肉体的な疲労が溜まっています。筋肉の修復を助ける「タンパク質（鶏肉・大豆）」と、疲労回復の「ビタミンB1（豚肉・玄米）」を積極的に摂りましょう。";
    } else if (fatigue._mentalScore > fatigue._physicalScore) {
      icon = "🐟";
      advice = "脳や神経の疲労が見られます。リラックス効果のある「GABA（発芽玄米・トマト）」や、脳の栄養になる「DHA（青魚）」がおすすめです。";
    } else if (fatigue.eyes && fatigue.eyes.score >= 5) {
      icon = "🫐";
      advice = "目の疲れが強いですね。抗酸化作用の高い「アントシアニン（ブルーベリー）」や「ビタミンA（ニンジン・かぼちゃ）」を意識して摂りましょう。";
    }

    el.innerHTML = `<strong>${icon} おすすめ:</strong> ${advice}`;
  }

  // ===== BREATHING EXERCISE =====
  function initBreathing() {
    const btn = document.getElementById('btn-breathing');
    if (!btn) return;

    let breathingActive = false;
    let breathingTimer = null;

    btn.addEventListener('click', () => {
      if (breathingActive) {
        stopBreathing();
      } else {
        startBreathing();
      }
    });

    function startBreathing() {
      breathingActive = true;
      btn.textContent = '⏹ 呼吸エクササイズ停止';
      runCycle(0, 3); // 3 rounds
    }

    function stopBreathing() {
      breathingActive = false;
      clearTimeout(breathingTimer);
      btn.textContent = '🫁 呼吸エクササイズ開始';
      const circle = document.getElementById('breathing-circle');
      const phase = document.getElementById('breathing-phase');
      const count = document.getElementById('breathing-count');
      const label = document.getElementById('breathing-label');
      if (circle) { circle.classList.remove('inhale', 'exhale'); circle.style.transform = ''; }
      if (phase) phase.textContent = '準備';
      if (count) count.textContent = '—';
      if (label) label.textContent = 'ボタンを押してスタート';
      updateBreathRing(0);
    }

    function runCycle(round, totalRounds) {
      if (!breathingActive || round >= totalRounds) {
        if (breathingActive) {
          const phase = document.getElementById('breathing-phase');
          const count = document.getElementById('breathing-count');
          const label = document.getElementById('breathing-label');
          if (phase) phase.textContent = '完了！';
          if (count) count.textContent = '🎉';
          if (label) label.textContent = 'お疲れさまでした。リラックスして眠りにつきましょう。';
          breathingActive = false;
          btn.textContent = '🫁 もう一度';
        }
        return;
      }

      const label = document.getElementById('breathing-label');
      if (label) label.textContent = `ラウンド ${round + 1} / ${totalRounds}`;

      // Inhale 4s → Hold 7s → Exhale 8s = 19s per cycle
      doPhase('吸う', 4, 'inhale', () => {
        doPhase('止める', 7, null, () => {
          doPhase('吐く', 8, 'exhale', () => {
            runCycle(round + 1, totalRounds);
          });
        });
      });
    }

    function doPhase(phaseName, duration, animClass, callback) {
      if (!breathingActive) return;
      const circle = document.getElementById('breathing-circle');
      const phase = document.getElementById('breathing-phase');
      const count = document.getElementById('breathing-count');

      if (phase) phase.textContent = phaseName;
      if (circle) {
        circle.classList.remove('inhale', 'exhale');
        if (animClass) {
          void circle.offsetWidth; // force reflow
          circle.classList.add(animClass);
        }
      }

      let sec = duration;
      if (count) count.textContent = sec;
      updateBreathRing(0);

      const tick = () => {
        if (!breathingActive) return;
        sec--;
        if (count) count.textContent = sec > 0 ? sec : '';
        updateBreathRing((duration - sec) / duration);
        if (sec > 0) {
          breathingTimer = setTimeout(tick, 1000);
        } else {
          callback();
        }
      };
      breathingTimer = setTimeout(tick, 1000);
    }

    function updateBreathRing(pct) {
      const prog = document.getElementById('breathing-progress');
      if (!prog) return;
      const circ = 2 * Math.PI * 90;
      prog.style.strokeDashoffset = circ * (1 - pct);
    }
  }

  // ===== HERO GREETING =====
  function initHero() {
    const h = new Date().getHours();
    let greeting;
    if (h >= 5 && h < 12) greeting = 'おはようございます ☀️';
    else if (h >= 12 && h < 17) greeting = 'こんにちは 🌤️';
    else if (h >= 17 && h < 21) greeting = 'こんばんは 🌆';
    else greeting = 'おやすみ前に 🌙';

    const el = document.getElementById('hero-greeting');
    if (el) el.textContent = greeting;

    // Show last score from localStorage
    try {
      const data = JSON.parse(localStorage.getItem('recoverAI')) || {};
      const logs = data.logs || [];
      if (logs.length > 0) {
        const last = logs[0];
        const score = Math.max(10, Math.min(98, Math.round(90 - (last.totalScore || 0) * 2 + 15)));
        const scoreNum = document.getElementById('hero-score-num');
        const scoreDetail = document.getElementById('hero-score-detail');
        const ring = document.getElementById('hero-score-ring');
        if (scoreNum) scoreNum.textContent = score;
        if (scoreDetail) scoreDetail.textContent = `${last.date} — 疲労部位: ${({eyes:'目',neck_shoulder:'首・肩',lower_back:'腰',legs:'足',full_body:'全身'})[last.topArea]||'—'}`;
        if (ring) {
          const circ = 2 * Math.PI * 34;
          setTimeout(() => { ring.style.strokeDashoffset = circ * (1 - score / 100); }, 300);
        }
      }
    } catch(e) {}
  }

  // ===== BGM CONTROL =====
  let audioCtx = null;
  let noiseNode = null;
  let gainNode = null;
  let isBgmPlaying = false;
  let lastOut = 0;

  function initBgm() {
    const btn = document.getElementById('btn-bgm');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const icon = document.getElementById('bgm-icon');
      const text = document.getElementById('bgm-text');

      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (isBgmPlaying) {
        if (gainNode) {
          gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
          setTimeout(() => { if (noiseNode) { noiseNode.stop(); noiseNode = null; } }, 1000);
        }
        isBgmPlaying = false;
        icon.textContent = '🔈';
        text.textContent = 'BGM オフ';
      } else {
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
        
        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        noiseNode.start();
        gainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, 1.0);

        isBgmPlaying = true;
        icon.textContent = '🔊';
        text.textContent = 'BGM オン';
      }
    });
  }

  // ===== AI CHAT =====
  function initChat() {
    const fab = document.getElementById('chat-fab');
    const win = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messages = document.getElementById('chat-messages');

    if (!fab || !win) return;

    fab.addEventListener('click', () => win.classList.add('open'));
    closeBtn.addEventListener('click', () => win.classList.remove('open'));

    function addMsg(text, type) {
      const msg = document.createElement('div');
      msg.className = `chat-msg ${type}`;
      msg.textContent = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function handleSend() {
      const text = input.value.trim();
      if (!text) return;
      addMsg(text, 'user');
      input.value = '';

      setTimeout(() => {
        let reply = "なるほど。お疲れ様です。無理をせず、今日は早めに休みましょう！";
        if (text.includes('目') || text.includes('PC') || text.includes('スマホ')) {
          reply = "目の疲れですね。ホットアイマスクや、遠くを見るストレッチが効果的です！";
        } else if (text.includes('肩') || text.includes('首')) {
          reply = "肩や首周りがガチガチかもしれません。深呼吸しながら、ゆっくり首を回してみてください。";
        } else if (text.includes('腰')) {
          reply = "腰の痛みには、仰向けで膝を抱えるストレッチがおすすめです。";
        } else if (text.includes('足') || text.includes('脚')) {
          reply = "足の疲れですね。壁に足を立てかけて、血流を戻すポーズ（壁ドンストレッチ）が良いですよ！";
        } else if (text.includes('眠') || text.includes('不眠')) {
          reply = "眠れない時は、画面の「呼吸リラクゼーション(4-7-8呼吸法)」を試してみてください。自律神経が整います。";
        }
        addMsg(reply, 'ai');
      }, 800);
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
  }

  // ===== INIT =====
  function init() {
    initParticles();
    initBreathing();
    initHero();
    initBgm();
    initChat();
  }

  return { init, updateBodyMap, updateForecast };
})();

document.addEventListener('DOMContentLoaded', () => RecoverAdvanced.init());
