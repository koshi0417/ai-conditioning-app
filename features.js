// ===== Recover AI - New Features (History, Badges, Hydration) =====

const RecoverFeatures = (() => {
  const USERS_KEY = 'recoverAI_users';
  const CURRENT_USER_KEY = 'recoverAI_currentUser';
  const areaNames = { head_neck:'頭・首', shoulder_arm:'肩・腕', lower_back:'腰', legs:'脚', full_body:'全身' };
  const areaNamesGeneral = { eyes:'目', neck_shoulder:'首・肩', lower_back:'腰', legs:'足', full_body:'全身' };

  function getDefault() { return { logs:[], hydrationToday:0, hydrationDate:null, reminderOn:false, appMode: 'general' }; }

  // Migration: old recoverAI to multi-user
  function migrateOldData() {
    const old = localStorage.getItem('recoverAI');
    if (old) {
      try {
        const users = { "メインユーザー": JSON.parse(old) };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.setItem(CURRENT_USER_KEY, "メインユーザー");
        localStorage.removeItem('recoverAI');
      } catch(e) {}
    }
  }
  migrateOldData();

  // ★ NEW: Sync Data from URL (Import)
  function importDataFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const syncData = params.get('sync');
    if (syncData) {
      try {
        const decoded = decodeURIComponent(escape(window.atob(syncData)));
        const importedUsers = JSON.parse(decoded);
        if (typeof importedUsers === 'object') {
          localStorage.setItem(USERS_KEY, JSON.stringify(importedUsers));
          const firstUser = Object.keys(importedUsers)[0] || "メインユーザー";
          localStorage.setItem(CURRENT_USER_KEY, firstUser);
          alert('端末のデータを正常に同期（上書き）しました！');
        }
      } catch (e) {
        console.error('Data import failed', e);
        alert('データの同期に失敗しました。');
      }
      // Remove query param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  importDataFromUrl();

  function getCurrentUser() {
    return localStorage.getItem(CURRENT_USER_KEY) || "メインユーザー";
  }

  function getAllUsers() {
    try {
       const u = JSON.parse(localStorage.getItem(USERS_KEY));
       if (!u || Object.keys(u).length === 0) return { "メインユーザー": getDefault() };
       return u;
    } catch { return { "メインユーザー": getDefault() }; }
  }

  function saveAllUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function loadData() {
    const users = getAllUsers();
    const user = getCurrentUser();
    if (!users[user]) users[user] = getDefault();
    return users[user];
  }

  function saveData(d) {
    const users = getAllUsers();
    const user = getCurrentUser();
    users[user] = d;
    saveAllUsers(users);
  }

  function switchUser(name) {
    localStorage.setItem(CURRENT_USER_KEY, name);
    // Refresh all data
    renderHistory();
    renderBadges();
    renderHydration();
    // Update hero if app is active
    if (typeof window.RecoverAdvanced !== 'undefined' && window.RecoverAdvanced.initHero) {
      window.RecoverAdvanced.initHero();
    }
  }

  function createNewUser(name) {
    if (!name.trim()) return false;
    const users = getAllUsers();
    if (users[name]) return false; // Already exists
    users[name] = getDefault();
    saveAllUsers(users);
    switchUser(name);
    return true;
  }

  // ★ NEW: Generate QR Code for Mobile Sync
  function showSyncQR() {
    const users = getAllUsers();
    const compressed = {};
    for (const [name, data] of Object.entries(users)) {
      compressed[name] = {
        ...data,
        logs: (data.logs || []).slice(0, 15) // Keep only latest 15 logs to prevent QR overflow
      };
    }
    
    try {
      const jsonStr = JSON.stringify(compressed);
      const base64 = window.btoa(unescape(encodeURIComponent(jsonStr)));
      
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // If localhost, QR sync might not work on actual mobile without local network IP, 
      // but we will generate it anyway.
      const syncUrl = window.location.origin + window.location.pathname + '?sync=' + base64;
      
      const canvas = document.getElementById('qr-canvas');
      if (typeof QRious !== 'undefined' && canvas) {
        new QRious({
          element: canvas,
          value: syncUrl,
          size: 250,
          background: 'white',
          foreground: 'black'
        });
        document.getElementById('sync-modal').style.display = 'flex';
      } else {
        alert('QRコードライブラリの読み込みに失敗しました。');
      }
    } catch(e) {
      console.error(e);
      alert('データが大きすぎてQRコードを生成できませんでした。');
    }
  }

  function todayStr() { return new Date().toISOString().slice(0,10); }

  // ===== HISTORY =====
  function saveLog(entry) {
    const d = loadData();
    d.logs.unshift({ date: todayStr(), ...entry });
    if (d.logs.length > 90) d.logs.length = 90;
    saveData(d);
  }

  function renderHistory() {
    const d = loadData();
    const list = document.getElementById('history-list');
    const chart = document.getElementById('history-chart');
    if (!list || !chart) return;

    // Chart - last 7 days
    chart.innerHTML = '';
    const days = ['日','月','火','水','木','金','土'];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0,10);
      const log = d.logs.find(l => l.date === key);
      const ph = log ? Math.min(log.physicalScore * 10, 100) : 0;
      const mn = log ? Math.min(log.mentalScore * 5, 100) : 0;
      chart.innerHTML += `<div class="bar-group"><div class="bar-pair">
        <div class="bar physical" style="height:${Math.max(ph,4)}%"></div>
        <div class="bar mental" style="height:${Math.max(mn,4)}%"></div>
      </div><div class="bar-label">${days[dt.getDay()]}</div></div>`;
    }

    // List
    if (d.logs.length === 0) {
      list.innerHTML = '<div class="history-empty"><span style="font-size:2rem">📭</span><p>まだ記録がありません</p><p class="text-muted">ホームから分析を行うと記録が保存されます</p></div>';
      return;
    }
    list.innerHTML = '';
    d.logs.slice(0,20).forEach(log => {
      const dt = new Date(log.date);
      const level = log.totalScore > 15 ? 'high' : log.totalScore > 8 ? 'medium' : 'low';
      list.innerHTML += `<div class="history-item">
        <div class="history-date"><div class="date-day">${dt.getDate()}</div><div class="date-month">${dt.getMonth()+1}月</div></div>
        <div class="history-info"><div class="history-area">🎯 ${areaNames[log.topArea]||'全身'}の疲労</div>
        <div class="history-detail">運動${log.exerciseTime}分 / PC${log.deskTime}h / 睡眠${log.sleepDuration}</div></div>
        <span class="fatigue-badge ${level}" style="flex-shrink:0">${level==='high'?'高':level==='medium'?'中':'低'}</span></div>`;
    });
  }

  // ===== BADGES & STREAK =====
  const badgeDefs = [
    { id:'first', emoji:'🌟', name:'はじめの一歩', desc:'初回記録', check: l => l.length >= 1 },
    { id:'three', emoji:'🔥', name:'3日連続', desc:'3日連続記録', check: (l,s) => s >= 3 },
    { id:'seven', emoji:'💎', name:'1週間達成', desc:'7日連続記録', check: (l,s) => s >= 7 },
    { id:'fourteen', emoji:'👑', name:'2週間達成', desc:'14日連続記録', check: (l,s) => s >= 14 },
    { id:'thirty', emoji:'🏆', name:'30日達成', desc:'30日連続記録', check: (l,s) => s >= 30 },
    { id:'ten_logs', emoji:'📊', name:'記録マスター', desc:'10回記録', check: l => l.length >= 10 },
    { id:'hard_ex', emoji:'💪', name:'ハードワーカー', desc:'ハード運動を記録', check: l => l.some(x => x.exerciseIntensity === 'intense') },
    { id:'hydration', emoji:'💧', name:'水分マスター', desc:'8杯達成', check: () => { const d=loadData(); return d.hydrationToday >= 8 && d.hydrationDate === todayStr(); } },
    { id:'night_owl', emoji:'🦉', name:'夜型ケア', desc:'24時以降に記録', check: l => l.length > 0 },
  ];

  function calcStreak() {
    const d = loadData();
    const dates = new Set(d.logs.map(l => l.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const dt = new Date(today); dt.setDate(dt.getDate() - i);
      if (dates.has(dt.toISOString().slice(0,10))) streak++;
      else break;
    }
    return streak;
  }

  function renderBadges() {
    const d = loadData();
    const streak = calcStreak();
    const el = document.getElementById('streak-count');
    if (el) el.textContent = streak;

    // Calendar (last 21 days)
    const cal = document.getElementById('streak-calendar');
    if (cal) {
      cal.innerHTML = '';
      const dates = new Set(d.logs.map(l => l.date));
      for (let i = 20; i >= 0; i--) {
        const dt = new Date(); dt.setDate(dt.getDate() - i);
        const key = dt.toISOString().slice(0,10);
        const isToday = key === todayStr();
        const done = dates.has(key);
        cal.innerHTML += `<div class="streak-day${done?' completed':''}${isToday?' today':''}">${dt.getDate()}</div>`;
      }
    }

    // Badge grid
    const grid = document.getElementById('badge-grid');
    if (grid) {
      grid.innerHTML = '';
      badgeDefs.forEach(b => {
        const unlocked = b.check(d.logs, streak);
        grid.innerHTML += `<div class="badge-card ${unlocked?'unlocked':'locked'}">
          ${unlocked?'<div class="badge-check">✅</div>':''}
          <div class="badge-emoji">${b.emoji}</div>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div></div>`;
      });
    }
  }

  // ===== HYDRATION =====
  function getHydration() {
    const d = loadData();
    if (d.hydrationDate !== todayStr()) { d.hydrationToday = 0; d.hydrationDate = todayStr(); saveData(d); }
    return d.hydrationToday;
  }

  function setHydration(val) {
    const d = loadData();
    d.hydrationToday = Math.max(0, val);
    d.hydrationDate = todayStr();
    saveData(d);
    renderHydration();
  }

  function renderHydration() {
    const count = getHydration();
    const goal = 8;
    const valEl = document.getElementById('hydration-value');
    const progEl = document.getElementById('hydration-progress');
    if (valEl) valEl.textContent = count;
    if (progEl) {
      const circ = 2 * Math.PI * 70;
      const offset = circ * (1 - Math.min(count / goal, 1));
      progEl.style.strokeDashoffset = offset;
    }
  }

  // ===== REMINDER =====
  let reminderTimer = null;
  let reminderCountdown = null;
  const breakTips = [
    '💡 20-20-20ルール: 20分ごとに20フィート(6m)先を20秒見つめて目を休めましょう',
    '🧘 椅子に座ったまま両腕を上に伸ばし、10秒間全身ストレッチ',
    '💧 コップ一杯の水を飲みましょう。水分補給は集中力維持の鍵です',
    '🚶 立ち上がって30秒間その場で足踏みしましょう',
    '😌 目を閉じて5回深呼吸。鼻から4秒吸い、口から6秒吐きます',
    '🙆 首をゆっくり左右に5回ずつ回して、肩の力を抜きましょう',
    '🖐️ 手首をグルグル回して、指を1本ずつ伸ばしてリラックス',
  ];

  function toggleReminder() {
    const d = loadData();
    d.reminderOn = !d.reminderOn;
    saveData(d);
    if (d.reminderOn) startReminder();
    else stopReminder();
  }

  function startReminder() {
    const interval = parseInt(document.getElementById('reminder-interval')?.value || 30);
    let remaining = interval * 60;
    updateReminderUI(true, remaining);

    reminderCountdown = setInterval(() => {
      remaining--;
      updateReminderUI(true, remaining);
      if (remaining <= 0) {
        showBreakTip();
        remaining = interval * 60;
      }
    }, 1000);
  }

  function stopReminder() {
    clearInterval(reminderCountdown);
    reminderCountdown = null;
    updateReminderUI(false, 0);
    const tips = document.getElementById('reminder-tips');
    if (tips) tips.style.display = 'none';
  }

  function updateReminderUI(active, seconds) {
    const icon = document.querySelector('.reminder-icon');
    const state = document.getElementById('reminder-state-text');
    const detail = document.getElementById('reminder-detail');
    const btn = document.getElementById('btn-toggle-reminder');
    if (icon) icon.textContent = active ? '▶️' : '⏸️';
    if (state) state.textContent = active ? '稼働中' : '停止中';
    if (detail) {
      if (active) {
        const m = Math.floor(seconds/60), s = seconds%60;
        detail.textContent = `次の休憩まで ${m}:${String(s).padStart(2,'0')}`;
      } else detail.textContent = 'ボタンを押して開始';
    }
    if (btn) btn.textContent = active ? '⏸ リマインダー停止' : '▶ リマインダー開始';
  }

  function showBreakTip() {
    const tips = document.getElementById('reminder-tips');
    const tipCard = document.getElementById('current-tip');
    if (tips && tipCard) {
      tips.style.display = 'block';
      tipCard.textContent = breakTips[Math.floor(Math.random() * breakTips.length)];
    }
    if (Notification.permission === 'granted') {
      new Notification('Recover AI - 休憩時間です！', { body: '少し休んでリフレッシュしましょう 🧘' });
    }
  }

  // ===== INIT =====
  function init() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const tab = document.getElementById('tab-' + btn.dataset.tab);
        if (tab) tab.classList.add('active');
        if (btn.dataset.tab === 'history') { renderHistory(); if (typeof RecoverExtras !== 'undefined') RecoverExtras.renderJournalSection(); }
        if (btn.dataset.tab === 'badges') { renderBadges(); if (typeof RecoverExtras !== 'undefined') RecoverExtras.renderWeeklyReport(); }
        if (btn.dataset.tab === 'hydration') renderHydration();
        if (btn.dataset.tab === 'diary' && typeof RecoverExtras !== 'undefined') RecoverExtras.renderMoodTab();
        if (btn.dataset.tab === 'challenge' && typeof RecoverExtras !== 'undefined') RecoverExtras.renderChallengeTab();
      });
    });

    // Hydration buttons
    document.getElementById('btn-add-water')?.addEventListener('click', () => setHydration(getHydration() + 1));
    document.getElementById('btn-remove-water')?.addEventListener('click', () => setHydration(getHydration() - 1));

    // Reminder
    document.getElementById('btn-toggle-reminder')?.addEventListener('click', toggleReminder);
    document.getElementById('reminder-interval')?.addEventListener('input', function() {
      document.getElementById('reminder-interval-val').textContent = this.value + '分';
    });

    // Clear history
    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      if (confirm('履歴をすべて削除しますか？')) {
        const d = loadData();
        d.logs = [];
        saveData(d);
        renderHistory();
      }
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    initUserUI();
    renderHydration();
  }

  function initUserUI() {
    const modal = document.getElementById('user-modal');
    const userList = document.getElementById('user-list');
    const newUserNameInput = document.getElementById('new-user-name');
    const btnAddUser = document.getElementById('btn-add-user');
    const headerUserName = document.getElementById('current-user-name');
    const profileBtn = document.getElementById('user-profile-btn');
    const syncBtn = document.getElementById('btn-sync-mobile');

    if (syncBtn) {
      syncBtn.onclick = () => {
        showSyncQR();
      };
    }

    function renderUserList() {
      const users = getAllUsers();
      const current = getCurrentUser();
      
      if (headerUserName) headerUserName.textContent = current;
      
      if (userList) {
        userList.innerHTML = '';
        Object.keys(users).forEach(name => {
          const btn = document.createElement('button');
          btn.className = 'btn-secondary';
          btn.style.cssText = `width: 100%; padding: 16px; font-size: 1.1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-out-sm) !important; background: var(--bg-primary) !important; color: var(--text-primary) !important; border: none !important; margin-bottom: 8px;`;
          
          if (name === current) {
            btn.innerHTML = `<span>👤 ${name}</span> <span style="font-size: 0.8rem; color: var(--accent-blue);">選択中</span>`;
            btn.style.boxShadow = 'var(--shadow-in-sm) !important';
          } else {
            btn.innerHTML = `<span>👤 ${name}</span>`;
          }

          btn.onclick = () => {
            switchUser(name);
            modal.style.display = 'none';
            if (headerUserName) headerUserName.textContent = name;
          };
          userList.appendChild(btn);
        });
      }
    }

    if (profileBtn) {
      profileBtn.onclick = () => {
        renderUserList();
        modal.style.display = 'flex';
      };
    }

    if (btnAddUser) {
      btnAddUser.onclick = () => {
        const name = newUserNameInput.value;
        if (createNewUser(name)) {
          newUserNameInput.value = '';
          modal.style.display = 'none';
          if (headerUserName) headerUserName.textContent = name;
        } else {
          alert('名前を入力してください。または既に存在する名前です。');
        }
      };
    }

    // 初回レンダリング
    renderUserList();

    // アプリ起動時に選択画面を出す（必要であれば。今回は簡易にするため出さないか、切り替えボタンだけ）
    // セッションストレージで「初回表示」を判定することも可能ですが、
    // ここでは切り替えボタンからの操作のみとします。
  }

  function getAppMode() {
    const cu = getCurrentUser();
    const data = getAllUsers()[cu] || getDefault();
    return data.appMode || 'general';
  }

  function setAppMode(mode) {
    const users = getAllUsers();
    const cu = getCurrentUser();
    if (!users[cu]) users[cu] = getDefault();
    users[cu].appMode = mode;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    document.dispatchEvent(new CustomEvent('appModeChanged'));
  }

  return { 
    init, 
    saveLog, 
    renderHistory, 
    renderBadges, 
    renderHydration,
    getCurrentUser,
    getAllUsers,
    switchUser,
    createNewUser,
    getAppMode,
    setAppMode
  };
})();

document.addEventListener('DOMContentLoaded', () => RecoverFeatures.init());
