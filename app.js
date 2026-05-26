// ===== Recover AI - App Logic =====

document.addEventListener('DOMContentLoaded', () => {
  // ----- DOM Elements -----
  const screens = {
    input: document.getElementById('screen-input'),
    loading: document.getElementById('screen-loading'),
    result: document.getElementById('screen-result'),
  };

  const els = {
    exerciseTime: document.getElementById('exercise-time'),
    exerciseTimeVal: document.getElementById('exercise-time-val'),
    deskTime: document.getElementById('desk-time'),
    deskTimeVal: document.getElementById('desk-time-val'),
    bedHour: document.getElementById('bed-hour'),
    bedMinute: document.getElementById('bed-minute'),
    btnAnalyze: document.getElementById('btn-analyze'),
    btnReset: document.getElementById('btn-reset'),
    loadingBar: document.getElementById('loading-bar'),
    loadingStatus: document.getElementById('loading-status'),
    fatigueBadges: document.getElementById('fatigue-badges'),
    fatigueComment: document.getElementById('fatigue-comment'),
    sleepBedtime: document.getElementById('sleep-bedtime'),
    sleepWakeup: document.getElementById('sleep-wakeup'),
    sleepDuration: document.getElementById('sleep-duration'),
    sleepCycles: document.getElementById('sleep-cycles'),
    scheduleTL: document.getElementById('schedule-timeline'),
    timerDisplay: document.getElementById('timer-display'),
    timerProgress: document.getElementById('timer-progress'),
    stretchEmoji: document.getElementById('stretch-emoji'),
    stretchName: document.getElementById('stretch-name'),
    stretchInstruction: document.getElementById('stretch-instruction'),
    stepIndicators: document.getElementById('step-indicators'),
    btnTimer: document.getElementById('btn-timer'),
    btnSkip: document.getElementById('btn-skip'),
  };

  // ----- State -----
  let exerciseIntensity = 'moderate';
  let mentalIntensity = 'moderate';
  let timerInterval = null;
  let timerSeconds = 60;
  let currentStep = 0;
  let isTimerRunning = false;
  let stretchPlan = [];

  // ----- Stretch Database -----
  const stretchDB = {
    eyes: [
      { emoji: '👁️', name: '目のリラックス回転', instruction: '目を閉じて眼球をゆっくり時計回りに5回、反時計回りに5回まわします。完了したら、両手で目を温めるように軽く覆い10秒キープ。' },
      { emoji: '🖐️', name: 'パーミング＆遠近トレーニング', instruction: '両手のひらで目を覆い完全な暗闘を20秒作ります。その後、近く（指先）と遠く（壁）を交互に5回見つめてピント調節筋をほぐします。' },
      { emoji: '😌', name: 'こめかみ＆眉マッサージ', instruction: 'こめかみを指先で円を描くように15秒マッサージ。次に眉毛の上を親指で内側から外側へ5回スライドさせ、目周りの緊張を解放します。' },
    ],
    neck_shoulder: [
      { emoji: '🙆', name: '首のストレッチ', instruction: '右手で左耳の上を軽く押さえ、ゆっくり右に首を傾けて15秒キープ。反対側も同様に行います。呼吸を止めないように。' },
      { emoji: '💪', name: '肩甲骨ストレッチ', instruction: '両腕を前に伸ばし手を組み、背中を丸めて肩甲骨を広げます。15秒キープ後、今度は後ろで手を組み胸を開いて15秒。' },
      { emoji: '🔄', name: '肩回し＆僧帽筋リリース', instruction: '両肩を耳に近づけるように上げて3秒キープし、ストンと脱力。5回繰り返した後、肩を大きく前後に5回ずつ回します。' },
    ],
    lower_back: [
      { emoji: '🐱', name: 'キャットカウストレッチ', instruction: '四つん這いになり、息を吐きながら背中を丸め（猫のポーズ）、息を吸いながら背中を反らせます（牛のポーズ）。ゆっくり5回繰り返します。' },
      { emoji: '🧎', name: '腰ひねりストレッチ', instruction: '仰向けに寝て両膝を立て、両膝を揃えてゆっくり右に倒し15秒キープ。反対側も同様に行い、腰周りの筋肉をほぐします。' },
      { emoji: '🙏', name: 'チャイルドポーズ', instruction: '正座の状態から両手を前に伸ばし、額を床につけます。お尻をかかとに近づけ、背中と腰を伸ばしながら20秒間深い呼吸を繰り返します。' },
    ],
    legs: [
      { emoji: '🦵', name: '前ももストレッチ', instruction: '片足で立ち、反対の足首を手で掴んでお尻に引き寄せます。膝が床を向くように15秒キープ。反対側も同様に行います。壁に手をついてOK。' },
      { emoji: '🦶', name: 'ふくらはぎ＆足首ほぐし', instruction: '壁に手をつき、片足を後ろに引いてかかとを床につけたままふくらはぎを伸ばします。15秒キープ後、足首を左右5回ずつ回します。' },
      { emoji: '🧘', name: 'ハムストリングストレッチ', instruction: '床に座り片足を伸ばし、もう片方は曲げて内ももに足裏をつけます。伸ばした足のつま先に向かって体を倒し20秒キープ。反対も同様に。' },
    ],
    full_body: [
      { emoji: '🌟', name: '全身伸びストレッチ', instruction: '立った状態で両手を天井に向かって大きく伸ばし、つま先立ちになります。10秒キープ後、ゆっくり前屈して足先に手を伸ばします。3回繰り返します。' },
      { emoji: '🔄', name: '体幹ツイスト', instruction: '足を肩幅に開き、両腕を水平に広げます。上半身をゆっくり右にひねり10秒キープ。反対側も同様に。骨盤は正面を向いたまま行います。' },
      { emoji: '🌬️', name: '深呼吸リラクゼーション', instruction: '目を閉じ、4秒かけて鼻から吸い、7秒止め、8秒かけて口から吐きます（4-7-8呼吸法）。3回繰り返して自律神経を整えます。' },
    ],
  };

  // ----- Slider Updates -----
  els.exerciseTime.addEventListener('input', () => {
    const v = parseInt(els.exerciseTime.value);
    els.exerciseTimeVal.textContent = v >= 60 ? `${Math.floor(v/60)}時間${v%60 ? v%60+'分':''}` : `${v}分`;
  });

  els.deskTime.addEventListener('input', () => {
    const v = parseInt(els.deskTime.value);
    els.deskTimeVal.textContent = `${v}時間`;
  });

  // ----- Preset Button Logic -----
  document.querySelectorAll('#exercise-intensity .preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#exercise-intensity .preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      exerciseIntensity = btn.dataset.value;
    });
  });

  document.querySelectorAll('#mental-intensity .preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mental-intensity .preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mentalIntensity = btn.dataset.value;
    });
  });

  // ----- Screen Switch -----
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ----- Fatigue Analysis -----
  function analyzeFatigue() {
    const exTime = parseInt(els.exerciseTime.value);
    const dTime = parseInt(els.deskTime.value);
    const exIntMul = { light: 0.5, moderate: 1.0, intense: 1.8 }[exerciseIntensity];
    const mnIntMul = { light: 0.5, moderate: 1.0, intense: 1.8 }[mentalIntensity];

    const physicalScore = (exTime / 60) * exIntMul; // 0~5.4
    const mentalScore = dTime * mnIntMul;           // 0~25.2

    const fatigue = {
      eyes: { score: 0, label: '目' },
      neck_shoulder: { score: 0, label: '首・肩' },
      lower_back: { score: 0, label: '腰' },
      legs: { score: 0, label: '足' },
    };

    // 目の疲労: デスクワーク時間に強く依存
    fatigue.eyes.score = mentalScore * 0.7 + physicalScore * 0.1;
    // 首・肩: デスクワーク＋運動の複合
    fatigue.neck_shoulder.score = mentalScore * 0.5 + physicalScore * 0.4;
    // 腰: 長時間座位＋運動負荷
    fatigue.lower_back.score = mentalScore * 0.4 + physicalScore * 0.5;
    // 足: 運動量に強く依存
    fatigue.legs.score = physicalScore * 0.8 + mentalScore * 0.1;

    return fatigue;
  }

  function getTopFatigueArea(fatigue) {
    let maxKey = 'eyes';
    let maxScore = 0;
    for (const [key, val] of Object.entries(fatigue)) {
      if (val.score > maxScore) { maxScore = val.score; maxKey = key; }
    }
    // 全体的にスコアが高い場合は全身
    const scores = Object.values(fatigue).map(v => v.score);
    const avg = scores.reduce((a,b) => a+b, 0) / scores.length;
    if (avg > 4 && Math.max(...scores) - Math.min(...scores) < 2) {
      return 'full_body';
    }
    return maxKey;
  }

  function getFatigueLevel(score) {
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  function getFatigueLevelLabel(level) {
    return { high: '高', medium: '中', low: '低' }[level];
  }

  // ----- Sleep Calculation -----
  function calculateSleep(fatigue) {
    const bedH = parseInt(els.bedHour.value);
    const bedM = parseInt(els.bedMinute.value);
    const bedMinutes = bedH * 60 + bedM;

    const scores = Object.values(fatigue).map(v => v.score);
    const totalFatigue = scores.reduce((a,b) => a+b, 0);

    // 疲労度に応じた推奨睡眠サイクル数（4〜6サイクル）
    let cycles;
    if (totalFatigue > 15) cycles = 6;
    else if (totalFatigue > 10) cycles = 5;
    else if (totalFatigue > 5) cycles = 5;
    else cycles = 4;

    const sleepMinutes = cycles * 90 + 15; // 入眠に15分
    const wakeMinutes = bedMinutes + sleepMinutes;

    const wakeH = Math.floor(wakeMinutes / 60) % 24;
    const wakeM = wakeMinutes % 60;
    const durationH = Math.floor((sleepMinutes - 15) / 60);
    const durationM = (sleepMinutes - 15) % 60;

    return {
      bedtime: `${String(bedH).padStart(2,'0')}:${String(bedM).padStart(2,'0')}`,
      wakeup: `${String(wakeH).padStart(2,'0')}:${String(wakeM).padStart(2,'0')}`,
      duration: durationM > 0 ? `${durationH}h${durationM}m` : `${durationH}h`,
      cycles: `${cycles}回`,
      wakeHour: wakeH,
      wakeMinute: wakeM,
    };
  }

  // ----- Morning Schedule -----
  function generateSchedule(sleep, topArea) {
    const wH = sleep.wakeHour;
    const wM = sleep.wakeMinute;

    function addMin(h, m, add) {
      const total = h * 60 + m + add;
      return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
    }

    const morningStretch = topArea === 'legs' || topArea === 'lower_back'
      ? '軽いウォーキングまたはストレッチ'
      : '朝の目覚めストレッチ（5分）';

    return [
      { time: addMin(wH,wM,0), title: '⏰ 起床', desc: 'カーテンを開けて朝日を浴びましょう' },
      { time: addMin(wH,wM,5), title: '💧 コップ1杯の水', desc: '常温の水で体を目覚めさせます' },
      { time: addMin(wH,wM,10), title: '🧘 ' + morningStretch, desc: '昨夜のケアの仕上げに軽く体を動かします' },
      { time: addMin(wH,wM,20), title: '🚿 シャワー・身支度', desc: '温冷交代浴で血行促進' },
      { time: addMin(wH,wM,40), title: '🍳 朝食', desc: 'タンパク質と炭水化物をバランスよく' },
      { time: addMin(wH,wM,60), title: '📚 学習・作業開始', desc: '最も集中力が高い時間帯を活用' },
    ];
  }

  // ----- Render Results -----
  function renderResults(fatigue, sleep, topArea) {
    // Fatigue badges
    els.fatigueBadges.innerHTML = '';
    for (const [, val] of Object.entries(fatigue)) {
      const level = getFatigueLevel(val.score);
      const badge = document.createElement('span');
      badge.className = `fatigue-badge ${level}`;
      badge.textContent = `${val.label}: ${getFatigueLevelLabel(level)}`;
      els.fatigueBadges.appendChild(badge);
    }

    // Comment
    const areaNames = { eyes: '目', neck_shoulder: '首・肩', lower_back: '腰', legs: '足', full_body: '全身' };
    els.fatigueComment.textContent = topArea === 'full_body'
      ? '全体的に疲労が蓄積しています。全身をバランスよくケアするメニューを用意しました。'
      : `今日は特に「${areaNames[topArea]}」への負荷が大きかったようです。専用のリカバリメニューを用意しました。`;

    // Sleep
    els.sleepBedtime.textContent = sleep.bedtime;
    els.sleepWakeup.textContent = sleep.wakeup;
    els.sleepDuration.textContent = sleep.duration;
    els.sleepCycles.textContent = sleep.cycles;

    // Schedule
    const schedule = generateSchedule(sleep, topArea);
    els.scheduleTL.innerHTML = '';
    schedule.forEach(item => {
      const div = document.createElement('div');
      div.className = 'timeline-item';
      div.innerHTML = `
        <div class="timeline-time">${item.time}</div>
        <div class="timeline-content">
          <div class="timeline-title">${item.title}</div>
          <div class="timeline-desc">${item.desc}</div>
        </div>`;
      els.scheduleTL.appendChild(div);
    });

    // Stretch plan
    stretchPlan = stretchDB[topArea] || stretchDB.full_body;
    currentStep = 0;
    renderStretchStep();
  }

  // ----- Stretch Timer -----
  function renderStretchStep() {
    if (currentStep >= stretchPlan.length) return;
    const step = stretchPlan[currentStep];
    els.stretchEmoji.textContent = step.emoji;
    els.stretchName.textContent = `ステップ${currentStep + 1}: ${step.name}`;
    els.stretchInstruction.textContent = step.instruction;

    // Update dots
    const dots = els.stepIndicators.querySelectorAll('.step-dot');
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'completed');
      if (i < currentStep) dot.classList.add('completed');
      else if (i === currentStep) dot.classList.add('active');
    });

    // Reset timer
    stopTimer();
    timerSeconds = 60;
    updateTimerDisplay();
    els.btnTimer.textContent = '▶ スタート';
    isTimerRunning = false;
  }

  function updateTimerDisplay() {
    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    els.timerDisplay.textContent = `${m}:${String(s).padStart(2, '0')}`;

    // Update ring
    const circumference = 2 * Math.PI * 65; // r=65
    const progress = (1 - timerSeconds / 60) * circumference;
    els.timerProgress.style.strokeDashoffset = progress;
  }

  function startTimer() {
    isTimerRunning = true;
    els.btnTimer.textContent = '⏸ 一時停止';
    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay();
      if (timerSeconds <= 0) {
        stopTimer();
        nextStep();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function nextStep() {
    stopTimer();
    isTimerRunning = false;
    currentStep++;
    if (currentStep < stretchPlan.length) {
      renderStretchStep();
    } else {
      // 全ステップ完了
      els.stretchEmoji.textContent = '🎉';
      els.stretchName.textContent = 'ストレッチ完了！';
      els.stretchInstruction.textContent = 'お疲れさまでした！ゆっくり深呼吸をして、心地よい眠りにつきましょう。';
      els.btnTimer.textContent = '✅ 完了';
      els.btnTimer.disabled = true;
      els.btnSkip.style.display = 'none';
      const dots = els.stepIndicators.querySelectorAll('.step-dot');
      dots.forEach(dot => { dot.classList.remove('active'); dot.classList.add('completed'); });
      timerSeconds = 0;
      updateTimerDisplay();
    }
  }

  els.btnTimer.addEventListener('click', () => {
    if (currentStep >= stretchPlan.length) return;
    if (isTimerRunning) {
      stopTimer();
      isTimerRunning = false;
      els.btnTimer.textContent = '▶ 再開';
    } else {
      startTimer();
    }
  });

  els.btnSkip.addEventListener('click', () => nextStep());

  // ----- Loading Animation -----
  function runLoading() {
    return new Promise(resolve => {
      showScreen('loading');
      const messages = [
        '運動データを解析しています',
        'デスクワーク負荷を計算中',
        '疲労パターンを特定しています',
        '最適なストレッチを選定中',
        '睡眠プランを生成しています',
      ];
      let progress = 0;
      let msgIdx = 0;
      const interval = setInterval(() => {
        progress += 2;
        els.loadingBar.style.width = `${progress}%`;
        if (progress % 20 === 0 && msgIdx < messages.length) {
          els.loadingStatus.textContent = messages[msgIdx++];
        }
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(resolve, 400);
        }
      }, 50);
    });
  }

  // ----- Main Flow -----
  els.btnAnalyze.addEventListener('click', async () => {
    const fatigue = analyzeFatigue();
    const topArea = getTopFatigueArea(fatigue);
    const sleep = calculateSleep(fatigue);

    await runLoading();

    renderResults(fatigue, sleep, topArea);
    showScreen('result');
  });

  els.btnReset.addEventListener('click', () => {
    stopTimer();
    isTimerRunning = false;
    currentStep = 0;
    els.btnTimer.disabled = false;
    els.btnSkip.style.display = '';
    showScreen('input');
  });
});
