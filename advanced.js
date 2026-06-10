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

  // ===== INIT =====
  function init() {
    initParticles();
    initBreathing();
  }

  return { init, updateBodyMap, updateForecast };
})();

document.addEventListener('DOMContentLoaded', () => RecoverAdvanced.init());
