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
  let rugbyMenus = [];
  let timerInterval = null;
  let timerSeconds = 60;
  let currentStep = 0;
  let isTimerRunning = false;
  let stretchPlan = [];

  // ----- UI Texts Dictionary -----
  const uiTexts = {
    general: {
      title: 'Recover AI',
      subtitle: '今日の疲れを、たった3分でリセット',
      logo: '🌙',
      heroMsg: '今日の活動を記録して、最適なリカバリプランを作りましょう',
      exIcon: '💼', exTitle: '業務・作業', exLabel: '稼働時間（移動等含む）', exUnit: '時間', exMax: 12, exStep: 1, exLabels: ['0', '6h', '12h'], exIntensityLabel: '業務ハードさ',
      deskIcon: '💻', deskTitle: 'デスクワーク',
      deskLabel: 'PC作業時間', deskUnit: '時間', deskMax: 14, deskStep: 1, deskLabels: ['0', '7h', '14h'],
      exIntensityTexts: ['軽い', '普通', 'ハード'],
      exIntensityIcons: ['🚶', '💼', '🏃'],
      deskIntensityLabel: '集中度・ストレス',
      deskIntensityTexts: ['軽い', '普通', 'ヘビー'],
      deskIntensityIcons: ['📖', '📝', '🧠'],
      analyzeBtn: '🔍 AIで今日のリカバリを分析'
    },
    rugby: {
      title: 'Recover AI 🏉 Rugby Edition',
      subtitle: '練習後の疲れを、3分でリセット 🏉',
      logo: '🏉',
      heroMsg: '今日の練習を記録して、最適なリカバリプランを作りましょう',
      exIcon: '🏉', exTitle: '練習・試合', exLabel: '時間', exUnit: '分', exMax: 240, exStep: 10, exLabels: ['0', '2h', '4h'], exIntensityLabel: '練習強度',
      deskIcon: '💥', deskTitle: 'コンタクト強度',
      deskLabel: 'タックル・ヒット回数（目安）', deskUnit: '回', deskMax: 30, deskStep: 1, deskLabels: ['0', '15', '30'],
      exIntensityTexts: ['軽め', '通常', 'ハード'],
      exIntensityIcons: ['🏃', '🏉', '💥'],
      deskIntensityLabel: 'コンタクトの質',
      deskIntensityTexts: ['ノーコン', 'ライト', 'フル'],
      deskIntensityIcons: ['🤲', '🏉', '💥'],
      analyzeBtn: '🏉 AIで今日のリカバリを分析'
    }
  };

  function applyAppMode() {
    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    const t = uiTexts[mode];
    
    // Update Mode Selector UI
    const sel = document.getElementById('app-mode-selector');
    if (sel && sel.value !== mode) sel.value = mode;

    document.querySelector('.app-title').textContent = t.title;
    document.querySelector('.app-subtitle').textContent = t.subtitle;
    document.getElementById('app-logo').textContent = t.logo;
    
    const heroMsg = document.querySelector('.hero-message');
    if (heroMsg) heroMsg.textContent = t.heroMsg;

    const cards = document.querySelectorAll('.compact-card');
    if (cards.length >= 2) {
      cards[0].querySelector('.compact-icon').textContent = t.exIcon;
      cards[0].querySelector('.compact-title').textContent = t.exTitle;
      
      const exLabelsText = cards[0].querySelectorAll('.input-label-text');
      if (exLabelsText.length >= 2) {
        exLabelsText[0].textContent = t.exLabel;
        exLabelsText[1].textContent = t.exIntensityLabel;
      }
      
      const exBtns = cards[0].querySelectorAll('.preset-text');
      const exIcons = cards[0].querySelectorAll('.preset-icon');
      if (exBtns.length === 3) {
        for (let i=0; i<3; i++) { exBtns[i].textContent = t.exIntensityTexts[i]; exIcons[i].textContent = t.exIntensityIcons[i]; }
      }
      
      const exSlider = document.getElementById('exercise-time');
      if (exSlider) {
        exSlider.max = t.exMax;
        exSlider.step = t.exStep;
        if (parseInt(exSlider.value) > t.exMax) exSlider.value = t.exMax;
        document.getElementById('exercise-time-val').textContent = `${exSlider.value}${t.exUnit}`;
        const exLabelsSpan = cards[0].querySelectorAll('.slider-labels span');
        if (exLabelsSpan.length >= 3) {
          for (let i=0; i<3; i++) exLabelsSpan[i].textContent = t.exLabels[i];
        }
      }

      cards[1].querySelector('.compact-icon').textContent = t.deskIcon;
      cards[1].querySelector('.compact-title').textContent = t.deskTitle;
      cards[1].querySelectorAll('.input-label-text')[0].textContent = t.deskLabel;
      
      const deskSlider = document.getElementById('desk-time');
      if (deskSlider) {
        deskSlider.max = t.deskMax;
        deskSlider.step = t.deskStep;
        if (parseInt(deskSlider.value) > t.deskMax) deskSlider.value = t.deskMax;
        document.getElementById('desk-time-val').textContent = `${deskSlider.value}${t.deskUnit}`;
        const labels = cards[1].querySelectorAll('.slider-labels span');
        if (labels.length >= 3) {
          for (let i=0; i<3; i++) labels[i].textContent = t.deskLabels[i];
        }
      }

      cards[1].querySelectorAll('.input-label-text')[1].textContent = t.deskIntensityLabel;
      const deskBtns = cards[1].querySelectorAll('#mental-intensity .preset-text');
      const deskIcons = cards[1].querySelectorAll('#mental-intensity .preset-icon');
      if (deskBtns.length === 3) {
        for (let i=0; i<3; i++) { deskBtns[i].textContent = t.deskIntensityTexts[i]; deskIcons[i].textContent = t.deskIntensityIcons[i]; }
      }
    }

    // Highlight current mode
    if (els.modeSelector) {
      els.modeSelector.value = mode;
    }
    
    const builder = document.getElementById('rugby-menu-builder');
    if (builder) builder.style.display = mode === 'rugby' ? 'block' : 'none';

    const analyzeBtn = document.getElementById('btn-analyze');
    if (analyzeBtn) analyzeBtn.textContent = t.analyzeBtn;
    
    // bodymap data-parts update
    const head = document.getElementById('bm-head');
    const neck = document.getElementById('bm-neck');
    const lshoulder = document.getElementById('bm-lshoulder');
    const rshoulder = document.getElementById('bm-rshoulder');
    const larm = document.getElementById('bm-larm');
    const rarm = document.getElementById('bm-rarm');
    
    if (head) {
      if (mode === 'rugby') {
        head.setAttribute('data-part', 'head_neck');
        neck.setAttribute('data-part', 'head_neck');
        lshoulder.setAttribute('data-part', 'shoulder_arm');
        rshoulder.setAttribute('data-part', 'shoulder_arm');
        larm.setAttribute('data-part', 'shoulder_arm');
        rarm.setAttribute('data-part', 'shoulder_arm');
      } else {
        head.setAttribute('data-part', 'eyes');
        neck.setAttribute('data-part', 'neck_shoulder');
        lshoulder.setAttribute('data-part', 'neck_shoulder');
        rshoulder.setAttribute('data-part', 'neck_shoulder');
        larm.setAttribute('data-part', 'neck_shoulder');
        rarm.setAttribute('data-part', 'neck_shoulder');
      }
    }
  }

  // ----- Stretch Database -----
  const stretchDB_general = {
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

  const stretchDB_rugby = {
    head_neck: [
      { emoji: '🧑', name: '首のアイソメトリクス', instruction: '手で額を押さえ、首を前に押し返すように5秒キープ。後頭部・左右も同様に行います。スクラムでの衝撃から首を守る筋力を維持します。' },
      { emoji: '🙆', name: '僧帽筋リリース', instruction: '両肩を耳に近づけるように上げて3秒キープし、ストンと脱力。5回繰り返した後、右手で左耳の上を押さえ、ゆっくり右に首を傾けて15秒キープ。反対側も同様に。' },
      { emoji: '🙏', name: '胸鎖乳突筋ストレッチ', instruction: '右手を左肩の上に置き、顔をゴールポストのように左を向きながら後ろに傾けます。15秒キープ。タックル時の首の衝撃を和らげます。' },
    ],
    shoulder_arm: [
      { emoji: '💪', name: '肩甲骨ストレッチ', instruction: '両腕を前に伸ばし手を組み、背中を丸めて肩甲骨を広げます。15秒キープ後、今度は後ろで手を組み胸を開い15秒。タックルやラックで固まった肩周りをほぐします。' },
      { emoji: '🔄', name: '肩回し＆上腕三頭筋伸ばし', instruction: '肩を大きく前後に10回ずつ回します。次に右腕を頭の後ろに曲げ、左手で胘を軽く押して15秒キープ。反対側も同様に。' },
      { emoji: '🤸', name: '胸筋・三角筋ストレッチ', instruction: '壁に手をつき、体を前に傾けて胸筋を伸ばします。15秒キープ。タックルの衝撃で縮こまった上半身を解放します。' },
    ],
    lower_back: [
      { emoji: '🐱', name: 'キャットカウストレッチ', instruction: '四つん這いになり、息を吐きながら背中を丸め（猫）、息を吸いながら背中を反らせます（牛）。スクラムやリフティングで固まった腰をリセット。' },
      { emoji: '🧯', name: '腰部回旋ストレッチ', instruction: '仰向けに寝て両膝を立て、両膝を揃えてゴールポストように右に倒します。15秒キープ。反対側も同様に。ラックでの捷りで負担がかかった腰周りをほぐします。' },
      { emoji: '💪', name: 'プランク＆体幹安定化', instruction: '肌を伸ばしてプランクの姿勢を取ります。30秒キープ×2セット。体幹の安定性を高め、スクラム時の腰の負担を軽減します。' },
    ],
    legs: [
      { emoji: '🦵', name: '大腿四頭筋ストレッチ', instruction: '片足で立ち、反対の足首を手で掴んでお尻に引き寄せます。15秒キープ。スプリントやステップで酸った前ももをリカバリ。' },
      { emoji: '🧘', name: 'ハムストリングストレッチ', instruction: '床に座り片足を伸ばし、つま先に向かって体を倒し20秒キープ。ランニングやキックで張った裏ももをしっかり伸ばします。' },
      { emoji: '🦶', name: 'ふくらはぎ＆股関節ストレッチ', instruction: '壁に手をつき、片足を後ろに引いてかかとを床につけたままふくらはぎを伸ばします。15秒後、股関節を前後左右に大きく回して可動域を広げます。' },
    ],
    full_body: [
      { emoji: '🌟', name: '全身伸びストレッチ', instruction: '立った状態で両手を天井に向かって大きく伸ばし、つま先立ちになります。10秒キープ後、ゆっくり前屈して足先に手を伸ばします。3回繰り返します。' },
      { emoji: '🔄', name: '体幹ツイスト', instruction: '足を肩幅に開き、両腕を水平に広げます。上半身をゆっくり右にひねり10秒キープ。反対側も同様に。骨盤は正面を向いたまま行います。' },
      { emoji: '🌬️', name: '深呼吸リラクゼーション', instruction: '目を閉じ、4秒かけて鼻から吸い、7秒止め、8秒かけて口から吐きます（4-7-8呼吸法）。3回繰り返して自律神経を整えます。' },
    ],
  };

  function getStretchDB() {
    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    return mode === 'rugby' ? stretchDB_rugby : stretchDB_general;
  }

  // ----- Slider Updates -----
  els.exerciseTime.addEventListener('input', () => {
    if (rugbyMenus.length > 0) return; // 詳細メニュー入力時は手動操作による表示更新を無視
    const v = parseInt(els.exerciseTime.value);
    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    const unit = mode === 'rugby' ? '分' : '時間';
    els.exerciseTimeVal.textContent = `${v}${unit}`;
  });

  els.deskTime.addEventListener('input', () => {
    const v = parseInt(els.deskTime.value);
    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    els.deskTimeVal.textContent = mode === 'rugby' ? `${v}回` : `${v}時間`;
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
    let exTime = parseInt(els.exerciseTime.value);
    const dTime = parseInt(els.deskTime.value);
    const exIntMul = { light: 0.5, moderate: 1.0, intense: 1.8 }[exerciseIntensity];
    const mnIntMul = { light: 0.5, moderate: 1.0, intense: 1.8 }[mentalIntensity];
    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';

    let physicalScore = 0;
    if (mode === 'rugby' && rugbyMenus.length > 0) {
      let totalScore = 0;
      let totalTime = 0;
      rugbyMenus.forEach(m => {
        const mul = { light: 0.5, moderate: 1.0, intense: 1.8 }[m.intensity];
        totalScore += (m.time / 60) * mul;
        totalTime += m.time;
      });
      physicalScore = totalScore;
      exTime = totalTime;
    } else {
      physicalScore = (exTime / 60) * exIntMul; // 0~5.4
    }

    const mentalScore = dTime * mnIntMul;           // 0~25.2

    const fatigue = {};

    if (mode === 'rugby') {
      fatigue.head_neck = { score: mentalScore * 0.8 + physicalScore * 0.2, label: '頭・首' };
      fatigue.shoulder_arm = { score: mentalScore * 0.6 + physicalScore * 0.4, label: '肩・腕' };
      fatigue.lower_back = { score: mentalScore * 0.5 + physicalScore * 0.5, label: '腰' };
      fatigue.legs = { score: physicalScore * 0.8 + mentalScore * 0.15, label: '脚' };
    } else {
      fatigue.eyes = { score: mentalScore * 0.7 + physicalScore * 0.1, label: '目' };
      fatigue.neck_shoulder = { score: mentalScore * 0.5 + physicalScore * 0.4, label: '首・肩' };
      fatigue.lower_back = { score: mentalScore * 0.4 + physicalScore * 0.5, label: '腰' };
      fatigue.legs = { score: physicalScore * 0.8 + mentalScore * 0.1, label: '足' };
    }

    fatigue._physicalScore = physicalScore;
    fatigue._mentalScore = mentalScore;
    return fatigue;
  }

  function getTopFatigueArea(fatigue) {
    let maxKey = 'eyes';
    let maxScore = 0;
    for (const [key, val] of Object.entries(fatigue)) {
      if (typeof val === 'object' && val.score > maxScore) { maxScore = val.score; maxKey = key; }
    }
    // 全体的にスコアが高い場合は全身
    const scores = Object.values(fatigue).filter(v => typeof v === 'object').map(v => v.score);
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

    const scores = Object.values(fatigue).filter(v => typeof v === 'object').map(v => v.score);
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

    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    const morningStretch = topArea === 'legs' || topArea === 'lower_back'
      ? (mode === 'rugby' ? '軽いジョギングまたはストレッチ' : '軽いウォーキングまたはストレッチ')
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
    for (const [key, val] of Object.entries(fatigue)) {
      if (typeof val !== 'object') continue;
      const level = getFatigueLevel(val.score);
      const badge = document.createElement('span');
      badge.className = `fatigue-badge ${level}`;
      badge.textContent = `${val.label}: ${getFatigueLevelLabel(level)}`;
      els.fatigueBadges.appendChild(badge);
    }

    // Comment
    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    const areaNames = typeof RecoverFeatures !== 'undefined' && RecoverFeatures.areaNames
        ? (mode === 'rugby' ? RecoverFeatures.areaNames : RecoverFeatures.areaNamesGeneral)
        : { head_neck: '頭・首', shoulder_arm: '肩・腕', lower_back: '腰', legs: '脚', full_body: '全身', eyes: '目', neck_shoulder: '首・肩' };
    
    els.fatigueComment.textContent = topArea === 'full_body'
      ? '全体的に疲労が蓄積しています。全身をバランスよくケアするメニューを用意しました。'
      : `今日は特に「${areaNames[topArea] || topArea}」への負荷が大きかったようです。専用のリカバリメニューを用意しました。`;

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
        </div>
      `;
      els.scheduleTL.appendChild(div);
    });

    // Calendar Link Generation
    const btnCal = document.getElementById('btn-calendar');
    if (btnCal) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}${mm}${dd}`;

      const startH = String(sleep.wakeHour).padStart(2, '0');
      const startM = String(sleep.wakeMinute).padStart(2, '0');
      const endH = String((sleep.wakeHour + 1) % 24).padStart(2, '0');
      
      const timeStrStart = `T${startH}${startM}00`;
      const timeStrEnd = `T${endH}${startM}00`;

      const title = encodeURIComponent('Recover AI - モーニングルーティン');
      const details = encodeURIComponent('AIが生成した朝の最適スケジュール:\n\n' + schedule.map(s => `${s.time} ${s.title}\n${s.desc}`).join('\n\n'));

      btnCal.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}${timeStrStart}/${dateStr}${timeStrEnd}&details=${details}`;
    }

    // Stretch plan
    const stretchDB = getStretchDB();
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

  function initModeSelectionModal() {
    const overlay = document.getElementById('mode-selection-overlay');
    const btnGen = document.getElementById('btn-mode-general');
    const btnRug = document.getElementById('btn-mode-rugby');
    
    // Check if user has selected a mode in localStorage
    const hasSelected = localStorage.getItem('recoverAI_mode_selected');
    
    if (!hasSelected && overlay) {
      overlay.style.display = 'flex';
      // Disable background scrolling
      document.body.style.overflow = 'hidden';
      
      const selectMode = (mode) => {
        if (typeof RecoverFeatures !== 'undefined') {
          RecoverFeatures.setAppMode(mode);
        }
        localStorage.setItem('recoverAI_mode_selected', 'true');
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      };
      
      if (btnGen) btnGen.addEventListener('click', () => selectMode('general'));
      if (btnRug) btnRug.addEventListener('click', () => selectMode('rugby'));
    }
  }

  function renderRugbyMenus() {
    const list = document.getElementById('rugby-menu-list');
    const summary = document.getElementById('rugby-menu-summary');
    const totalSpan = document.getElementById('rugby-menu-total-time');
    if(!list || !summary || !totalSpan) return;
    
    list.innerHTML = '';
    let totalTime = 0;
    
    rugbyMenus.forEach((menu, index) => {
      totalTime += menu.time;
      const item = document.createElement('div');
      item.className = 'rugby-menu-item';
      item.innerHTML = `
        <input type="text" placeholder="メニュー名(例: ユニット)" value="${menu.name}" data-index="${index}" class="menu-name">
        <input type="number" min="0" step="5" placeholder="分" value="${menu.time}" data-index="${index}" class="menu-time">
        <select data-index="${index}" class="menu-intensity">
          <option value="light" ${menu.intensity === 'light' ? 'selected' : ''}>軽め</option>
          <option value="moderate" ${menu.intensity === 'moderate' ? 'selected' : ''}>普通</option>
          <option value="intense" ${menu.intensity === 'intense' ? 'selected' : ''}>ハード</option>
        </select>
        <button class="btn-delete-menu" data-index="${index}">🗑️</button>
      `;
      list.appendChild(item);
    });

    if (rugbyMenus.length > 0) {
      summary.style.display = 'block';
      totalSpan.textContent = totalTime;
      els.exerciseTime.disabled = true;
      els.exerciseTime.parentElement.style.opacity = '0.5';
      els.exerciseTime.value = totalTime;
      document.getElementById('exercise-time-val').textContent = `${totalTime}分 (詳細メニューから計算)`;
    } else {
      summary.style.display = 'none';
      els.exerciseTime.disabled = false;
      els.exerciseTime.parentElement.style.opacity = '1';
      const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
      const unit = mode === 'rugby' ? '分' : '時間';
      document.getElementById('exercise-time-val').textContent = `${els.exerciseTime.value}${unit}`;
    }

    list.querySelectorAll('.menu-name').forEach(el => {
      el.addEventListener('input', (e) => { rugbyMenus[e.target.dataset.index].name = e.target.value; });
    });
    list.querySelectorAll('.menu-time').forEach(el => {
      el.addEventListener('input', (e) => {
        rugbyMenus[e.target.dataset.index].time = parseInt(e.target.value) || 0;
        renderRugbyMenus();
      });
    });
    list.querySelectorAll('.menu-intensity').forEach(el => {
      el.addEventListener('change', (e) => {
        rugbyMenus[e.target.dataset.index].intensity = e.target.value;
        renderRugbyMenus(); // 再計算用に再描画
      });
    });
    list.querySelectorAll('.btn-delete-menu').forEach(el => {
      el.addEventListener('click', (e) => {
        rugbyMenus.splice(e.target.dataset.index, 1);
        renderRugbyMenus();
      });
    });
  }

  function init() {
    applyAppMode();
    document.addEventListener('appModeChanged', applyAppMode);

    const modeSelector = document.getElementById('app-mode-selector');
    if (modeSelector) {
      modeSelector.addEventListener('change', (e) => {
        const mode = e.target.value;
        // Highlight current mode
        if (els.modeSelector) {
          els.modeSelector.value = mode;
        }

        if (typeof RecoverFeatures !== 'undefined') {
          RecoverFeatures.setAppMode(mode);
          localStorage.setItem('recoverAI_mode_selected', 'true'); // Mode selected manually
          if (document.getElementById('screen-result').classList.contains('active')) {
            analyze();
          }
        }
      });
    }

    if (els.btnAnalyze) els.btnAnalyze.addEventListener('click', analyze);

    const btnAddMenu = document.getElementById('btn-add-rugby-menu');
    if (btnAddMenu) {
      btnAddMenu.addEventListener('click', () => {
        rugbyMenus.push({ name: '', time: 10, intensity: 'moderate' });
        renderRugbyMenus();
      });
    }
    
    // Show modal if needed
    initModeSelectionModal();
  }

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
  async function analyze() {
    const fatigue = analyzeFatigue();
    const topArea = getTopFatigueArea(fatigue);
    const sleep = calculateSleep(fatigue);

    await runLoading();

    renderResults(fatigue, sleep, topArea);
    showScreen('result');

    // Save to history
    const mode = typeof RecoverFeatures !== 'undefined' ? RecoverFeatures.getAppMode() : 'general';
    const scores = Object.values(fatigue).filter(v => typeof v === 'object').map(v => v.score);
    if (typeof RecoverFeatures !== 'undefined') {
      RecoverFeatures.saveLog({
        topArea,
        exerciseTime: parseInt(els.exerciseTime.value),
        deskTime: parseInt(els.deskTime.value),
        exerciseIntensity,
        mentalIntensity,
        physicalScore: fatigue._physicalScore,
        mentalScore: fatigue._mentalScore,
        totalScore: scores.reduce((a,b) => a+b, 0),
        sleepDuration: sleep.duration,
        detailedMenus: (mode === 'rugby' && rugbyMenus.length > 0) ? [...rugbyMenus] : null
      });
    }

    // Update advanced features
    if (typeof RecoverAdvanced !== 'undefined') {
      RecoverAdvanced.updateBodyMap(fatigue);
      RecoverAdvanced.updateForecast(fatigue, sleep);
    }
  }

  els.btnReset.addEventListener('click', () => {
    stopTimer();
    isTimerRunning = false;
    currentStep = 0;
    els.btnTimer.disabled = false;
    els.btnSkip.style.display = '';
    showScreen('input');
  });

  init();
});
