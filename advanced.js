// ===== Recover AI - Advanced Features =====
// Body Heatmap, Condition Forecast, Breathing Exercise, Particle Background

const RecoverAdvanced = (() => {
  // ===== PARTICLE BACKGROUND =====
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    // Light theme colors (subtle whites and very light blues/grays)
    const colors = ['rgba(255,255,255,0.8)', 'rgba(163,177,198,0.4)', 'rgba(255,255,255,0.6)'];

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
            ctx.strokeStyle = `rgba(255,255,255,${0.15 * (1 - dist/120)})`;
            ctx.lineWidth = 1.0;
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

    const labels = { head_neck: '頭・首', shoulder_arm: '肩・腕', lower_back: '腰', legs: '脚' };
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
      advice = '十分なリカバリが見込めます。明日の練習では高いパフォーマンスが期待できます！積極的にプレーしましょう。';
    } else if (forecastScore >= 60) {
      icon = '⛅'; status = 'まずまず';
      advice = 'ある程度の回復が期待できます。ウォーミングアップを丁寧に行い、練習中はこまめに水分を補給しましょう。';
    } else if (forecastScore >= 40) {
      icon = '🌥️'; status = 'やや疲労残り';
      advice = '疲労が残る可能性があります。フルコンタクトは控えめにし、スキル練習やフィットネス中心のメニューがおすすめです。';
    } else {
      icon = '🌧️'; status = '要注意';
      advice = '疲労の蓄積が見られます。明日は軽めのリカバリ練習にとどめ、アイシングやストレッチで体のケアを優先してください。';
    }

    const el = (id) => document.getElementById(id);
    if (el('forecast-icon')) el('forecast-icon').textContent = icon;
    if (el('forecast-status')) el('forecast-status').textContent = status;
    if (el('forecast-score')) el('forecast-score').textContent = forecastScore;
    const p = el('forecast-advice');
    
    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    let text = "";
    if (mode === 'rugby') {
      if (sleep.totalMinutes < 360) text = "睡眠不足気味です。怪我のリスクが高まるため、明日の練習はコンタクトプレーを控えめにし、早めに就寝してください。";
      else if (fatigue._physicalScore > fatigue._mentalScore) text = "フィジカル疲労が蓄積しています。明日の練習はウォーミングアップを長めに取り、筋肉の張りに注意してください。";
      else if (fatigue._mentalScore > 10) text = "コンタクト疲労が強いです。明日の練習は激しいヒットを避け、ハンドリングやリカバリ中心のメニューを推奨します。";
      else text = "コンディションは良好です！明日の練習もフルコンタクトで高いパフォーマンスが期待できます。";
    } else {
      if (sleep.totalMinutes < 360) text = "睡眠不足気味です。明日は集中力の低下が予想されるため、こまめな休憩と仮眠を推奨します。";
      else if (fatigue._mentalScore > fatigue._physicalScore) text = "脳・神経系の疲労が蓄積しています。明日はデジタルデトックスの時間を設け、目を休めることを意識してください。";
      else if (fatigue._physicalScore > 3) text = "身体的な疲労が強めです。明日はストレッチを多めに行い、入浴でしっかり温まってください。";
      else text = "コンディションは良好です！明日もこのペースを維持して、生産的な1日を送りましょう。";
    }

    if (p) p.textContent = text;

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

    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    let advice = "";
    let icon = "";

    if (mode === 'rugby') {
      advice = "バランスの良い食事で体を回復させましょう。練習後30分以内のプロテイン摂取が効果的です！";
      icon = "🍱";
      
      if (fatigue._physicalScore > fatigue._mentalScore) {
        icon = "🥩";
        advice = "高強度のコンタクト練習でした。筋繊維の修復に「タンパク質（鶏むね肉・卵・プロテイン）」、グリコーゲン回復に「炭水化物（おにぎり・バナナ）」を練習後30分以内に摂取しましょう。鉄分補給に赤身肉もおすすめです。";
      } else if (fatigue._mentalScore > fatigue._physicalScore) {
        icon = "🍚";
        advice = "ランニング主体の練習でした。枯渇したエネルギー（グリコーゲン）を補充するため、練習後すぐに「糖質（おにぎり・うどん・オレンジジュース）」を多めに摂取しましょう。発汗による電解質補給も忘れずに。";
      }
      
      if (fatigue.head_neck && fatigue.head_neck.score > Math.max(fatigue.shoulder_arm.score, fatigue.lower_back.score, fatigue.legs.score)) {
        icon = "🐟";
        advice += " 頭・首へのコンタクト負荷が高めです。抗炎症作用のあるオメガ3脂肪酸（青魚・くるみ）やビタミンC（柑橘類・ブロッコリー）を積極的に摂りましょう。";
      }
    } else {
      advice = "バランスの良い食事で体を回復させましょう。";
      icon = "🍱";
      
      if (fatigue._mentalScore > fatigue._physicalScore) {
        icon = "🫐";
        advice = "デスクワークでの眼精疲労・脳疲労が蓄積しています。「アントシアニン（ブルーベリー）」や「DHA/EPA（青魚）」を意識して摂取しましょう。ビタミンB群（豚肉・玄米）も神経の回復に効果的です。";
      } else if (fatigue._physicalScore > fatigue._mentalScore) {
        icon = "🥩";
        advice = "身体的な疲労が強めです。筋肉の修復を助ける「タンパク質（鶏むね肉・卵・大豆製品）」と「ビタミンB6（バナナ・さつまいも）」をセットで摂ると効果的です。";
      }
      
      if (fatigue.eyes && fatigue.eyes.score > Math.max(fatigue.neck_shoulder.score, fatigue.lower_back.score, fatigue.legs.score)) {
        icon = "🐟";
        advice += " 目への負担が大きいようです。抗酸化作用の高いルテイン（ほうれん草・ブロッコリー）やアスタキサンチン（鮭・エビ）を積極的に摂りましょう。";
      }
    }

    el.innerHTML = `<span style="font-size: 1.5rem; margin-right: 8px;">${icon}</span> <span>${advice}</span>`;
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
    else greeting = '練習後のケアを 🌙';

    const el = document.getElementById('hero-greeting');
    if (el) el.textContent = greeting;

    // Show last score from localStorage
    try {
      const data = RecoverFeatures && typeof RecoverFeatures.getCurrentUser === 'function' 
        ? window.RecoverFeatures.getAllUsers()[window.RecoverFeatures.getCurrentUser()]
        : JSON.parse(localStorage.getItem('recoverAI')) || {};
      const logs = data.logs || [];
      if (logs.length > 0) {
        const last = logs[0];
        const score = Math.max(10, Math.min(98, Math.round(90 - (last.totalScore || 0) * 2 + 15)));
        const scoreNum = document.getElementById('hero-score-num');
        const scoreDetail = document.getElementById('hero-score-detail');
        const ring = document.getElementById('hero-score-ring');
        if (scoreNum) scoreNum.textContent = score;
        if (scoreDetail) scoreDetail.textContent = `${last.date} — 疲労部位: ${({head_neck:'頭・首',shoulder_arm:'肩・腕',lower_back:'腰',legs:'脚',full_body:'全身'})[last.topArea]||'—'}`;
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
  let filterNode = null;
  let isBgmPlaying = false;
  let currentOscillators = [];

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
          setTimeout(() => {
            if (noiseNode) { noiseNode.stop(); noiseNode = null; }
            currentOscillators.forEach(osc => { try { osc.stop(); } catch(e){} });
            currentOscillators = [];
          }, 1000);
        }
        isBgmPlaying = false;
        icon.textContent = '🔈';
        text.textContent = 'BGM オフ';
      } else {
        // Create pure white noise buffer
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;

        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 350;

        // LFO for wave sound
        const lfo = audioCtx.createOscillator();
        lfo.frequency.value = 0.15;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 250;
        lfo.connect(lfoGain);
        lfoGain.connect(filterNode.frequency);
        lfo.start();
        currentOscillators.push(lfo);

        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;

        noiseNode.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        noiseNode.start();
        gainNode.gain.setTargetAtTime(0.2, audioCtx.currentTime, 1.0);

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

    fab.addEventListener('click', () => {
      win.classList.add('open');
      // Show initial greeting if no messages yet
      if (messages && messages.children.length === 0) {
        const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
        const initialMsg = mode === 'rugby' 
          ? '練習お疲れ様！体で気になるところはありますか？（例：肩が痛い、膝が重い、ハムが張ってる）'
          : '今日もお疲れ様です。体で気になるところはありますか？（例：目が疲れた、肩が凝る、腰が痛い）';
        addMsg(initialMsg, 'ai');
      }
    });
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
        const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
        let reply = '';
        
        if (mode === 'rugby') {
          reply = 'お疲れ様です！練習後はしっかりクールダウンとストレッチを行い、早めに休みましょう。明日のパフォーマンスにつながります！';
          if (/肩|タックル/.test(text)) {
            reply = '肩への衝撃が大きかったですね。アイシング15分→温め→肩甲骨ストレッチの順でケアしましょう。明日の練習前にも入念にウォーミングアップしてください。';
          } else if (/膝|ひざ/.test(text)) {
            reply = '膝の違和感は要注意です。アイシングで炎症を抑え、大腿四頭筋とハムストリングのストレッチをバランスよく行いましょう。痛みが続く場合はトレーナーに相談してください。';
          } else if (/首|スクラム/.test(text)) {
            reply = 'スクラムで首に負担がかかりましたね。首の前後左右のアイソメトリクス運動（手で抵抗をかけて首を動かすトレーニング）で筋力を維持しつつ、ゆっくりストレッチしましょう。';
          } else if (/腰|ロック|リフト/.test(text)) {
            reply = '腰への負担が大きかったようです。腰部の回旋ストレッチと、体幹トレーニング（プランク30秒×3セット）で安定性を高めましょう。';
          } else if (/ハム|もも|足|脚/.test(text)) {
            reply = 'ランニングやステップで脚に疲労が溜まっていますね。ハムストリングと大腿四頭筋のストレッチを丁寧に行い、フォームローラーで筋膜リリースもおすすめです。';
          } else if (/筋肉痛/.test(text)) {
            reply = '練習後の筋肉痛は成長のサインです！軽いジョギングやウォーキングで血流を促進し、プロテインと十分な睡眠で回復を加速させましょう。';
          } else if (/眠|疲/.test(text)) {
            reply = '疲れが溜まっていますね。画面の「呼吸リラクゼーション(4-7-8呼吸法)」を試してみてください。質の高い睡眠で体をしっかりリカバリさせましょう。';
          }
        } else {
          reply = 'お疲れ様です。少しずつストレッチを取り入れて、明日に疲れを残さないようにしましょう。';
          if (/目|見|かすみ/.test(text)) {
            reply = '目の疲れですね。まずはホットアイマスクや蒸しタオルで5分ほど目を温めるのが効果的です。画面から離れて遠くを見る時間も作りましょう。';
          } else if (/肩|首|こり|コリ/.test(text)) {
            reply = '首肩のコリには、肩甲骨を大きく回すストレッチがおすすめです。お風呂でしっかり温まって血流を良くしましょう。';
          } else if (/腰|背中/.test(text)) {
            reply = '座りっぱなしだと腰に負担がかかりますね。立ち上がって軽く腰をひねったり、仰向けで両膝を抱えるストレッチを試してみてください。';
          } else if (/足|脚|むくみ/.test(text)) {
            reply = '脚のむくみには、ふくらはぎの軽いマッサージや、寝る前に壁に脚を立て掛けて血流を戻すポーズ（5分程度）がおすすめです。';
          } else if (/頭|痛/.test(text)) {
            reply = '頭が重い時は、こめかみの軽いマッサージや、深呼吸でリラックスしてください。水分不足の可能性もあるので、コップ1杯の水を飲みましょう。';
          } else if (/眠|疲/.test(text)) {
            reply = '疲れがピークに達しているようです。画面の「呼吸リラクゼーション(4-7-8呼吸法)」を試してみてください。今日は無理せず早めに就寝しましょう。';
          }
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

  return { init, updateBodyMap, updateForecast, initHero };
})();

document.addEventListener('DOMContentLoaded', () => RecoverAdvanced.init());
