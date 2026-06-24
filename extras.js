// ===== Recover AI - Extras (Mood Diary, Daily Challenge, Journal, Weekly Report) =====

const RecoverExtras = (() => {
  // ===== Helper: per-user data with new fields =====
  function loadUserData() {
    const users = RecoverFeatures.getAllUsers();
    const current = RecoverFeatures.getCurrentUser();
    const data = users[current] || {};
    if (!data.moods) data.moods = [];
    if (!data.journal) data.journal = [];
    if (!data.challenges) data.challenges = {};
    if (!data.logs) data.logs = [];
    return data;
  }

  function saveUserData(data) {
    const users = RecoverFeatures.getAllUsers();
    const current = RecoverFeatures.getCurrentUser();
    users[current] = data;
    localStorage.setItem('recoverAI_users', JSON.stringify(users));
  }

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  // ===== 1. MOOD DIARY =====
  let selectedMood = null;

  function saveMood() {
    if (!selectedMood) {
      alert('気分を選んでください！');
      return;
    }
    const stress = parseInt(document.getElementById('stress-level')?.value || 3);
    const note = document.getElementById('mood-note')?.value?.trim() || '';
    const data = loadUserData();
    
    // Check if already recorded today
    const todayEntry = data.moods.find(m => m.date === todayStr());
    if (todayEntry) {
      todayEntry.mood = selectedMood.emoji;
      todayEntry.moodValue = selectedMood.value;
      todayEntry.stress = stress;
      todayEntry.note = note;
    } else {
      data.moods.unshift({
        date: todayStr(),
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        mood: selectedMood.emoji,
        moodValue: selectedMood.value,
        stress,
        note,
      });
    }
    if (data.moods.length > 90) data.moods.length = 90;
    saveUserData(data);

    // Reset UI
    document.getElementById('mood-note').value = '';
    selectedMood = null;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    
    renderMoodTab();
    alert('気分を記録しました！');
  }

  function renderMoodTab() {
    renderMoodChart();
    renderMoodHistory();
  }

  function renderMoodChart() {
    const chart = document.getElementById('mood-chart');
    if (!chart) return;
    const data = loadUserData();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    
    chart.innerHTML = '';
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const entry = data.moods.find(m => m.date === key);
      
      const moodPct = entry ? (entry.moodValue / 5) * 100 : 0;
      const stressPct = entry ? (entry.stress / 5) * 100 : 0;
      
      chart.innerHTML += `<div class="mood-bar-group">
        <div class="mood-bar-pair">
          <div class="mood-bar mood" style="height:${Math.max(moodPct, 4)}%"></div>
          <div class="mood-bar stress" style="height:${Math.max(stressPct, 4)}%"></div>
        </div>
        <div class="mood-bar-label">${days[dt.getDay()]}</div>
      </div>`;
    }
  }

  function renderMoodHistory() {
    const list = document.getElementById('mood-history-list');
    if (!list) return;
    const data = loadUserData();

    if (data.moods.length === 0) {
      list.innerHTML = '<div class="history-empty"><span style="font-size:2rem;">🌡️</span><p>まだ気分の記録がありません</p><p class="text-muted">上のボタンから今日の気分を記録しましょう</p></div>';
      return;
    }

    list.innerHTML = '';
    data.moods.slice(0, 15).forEach(entry => {
      const stressClass = entry.stress >= 4 ? 'stress-high' : entry.stress >= 3 ? 'stress-med' : 'stress-low';
      const stressLabel = entry.stress >= 4 ? '高' : entry.stress >= 3 ? '中' : '低';
      list.innerHTML += `<div class="mood-history-item">
        <div class="mood-history-emoji">${entry.mood}</div>
        <div class="mood-history-info">
          <div class="mood-history-date">${entry.date} ${entry.time || ''}</div>
          ${entry.note ? `<div class="mood-history-note">${entry.note}</div>` : ''}
        </div>
        <span class="mood-history-stress ${stressClass}">ストレス: ${stressLabel}</span>
      </div>`;
    });
  }

  // ===== 2. DAILY CHALLENGE =====
  const challengePool = [
    { id: 'walk30', emoji: '🚶', text: '30分散歩する' },
    { id: 'water8', emoji: '💧', text: '水を8杯飲む' },
    { id: 'meditate5', emoji: '🧘', text: '5分間瞑想する' },
    { id: 'nophone1', emoji: '📵', text: '1時間スマホを見ない' },
    { id: 'veggie3', emoji: '🥗', text: '野菜を3種類食べる' },
    { id: 'sleep23', emoji: '😴', text: '23時前に就寝する' },
    { id: 'read15', emoji: '📖', text: '15分読書する' },
    { id: 'jog10', emoji: '🏃', text: '10分間ジョギングする' },
    { id: 'music', emoji: '🎵', text: '好きな音楽を聴いてリラックスする' },
    { id: 'shoulder10', emoji: '🙆', text: '肩を10回回す' },
    { id: 'breathe10', emoji: '🫁', text: '深呼吸を10回する' },
    { id: 'fruit1', emoji: '🍎', text: 'フルーツを1つ食べる' },
    { id: 'nosweet', emoji: '🚫', text: '甘い飲み物を避ける' },
    { id: 'nature10', emoji: '🌳', text: '自然の中で10分過ごす' },
    { id: 'thanks', emoji: '😊', text: '誰かに「ありがとう」を伝える' },
    { id: 'clean', emoji: '🧹', text: 'デスク周りを整理する' },
    { id: 'stretch5', emoji: '🤸', text: '5分間ストレッチする' },
    { id: 'stairs', emoji: '🪜', text: '階段を使って移動する' },
  ];

  function getTodayChallenges() {
    const data = loadUserData();
    const today = todayStr();
    
    if (!data.challenges[today]) {
      // Seed random based on date for consistency
      const seed = today.replace(/-/g, '');
      const shuffled = [...challengePool].sort((a, b) => {
        const ha = hashCode(a.id + seed);
        const hb = hashCode(b.id + seed);
        return ha - hb;
      });
      data.challenges[today] = shuffled.slice(0, 3).map(c => ({
        ...c,
        completed: false,
      }));
      // Cleanup old challenge data (keep last 30 days)
      const keys = Object.keys(data.challenges).sort();
      while (keys.length > 30) {
        delete data.challenges[keys.shift()];
      }
      saveUserData(data);
    }
    return data.challenges[today];
  }

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  function toggleChallenge(index) {
    const data = loadUserData();
    const today = todayStr();
    if (data.challenges[today] && data.challenges[today][index]) {
      data.challenges[today][index].completed = !data.challenges[today][index].completed;
      saveUserData(data);
      renderChallengeTab();
    }
  }

  function calcChallengeStreak() {
    const data = loadUserData();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const dayData = data.challenges[key];
      if (dayData && dayData.length === 3 && dayData.every(c => c.completed)) {
        streak++;
      } else if (i > 0) {
        break; // Don't break on today if not yet completed
      }
    }
    return streak;
  }

  function renderChallengeTab() {
    const challenges = getTodayChallenges();
    const list = document.getElementById('challenge-list');
    const progressNum = document.getElementById('challenge-progress-num');
    const progressRing = document.getElementById('challenge-progress-ring');
    const streakEl = document.getElementById('challenge-streak-count');

    if (!list) return;

    // Render challenge items
    list.innerHTML = '';
    challenges.forEach((ch, idx) => {
      const item = document.createElement('div');
      item.className = `challenge-item${ch.completed ? ' completed' : ''}`;
      item.innerHTML = `
        <div class="challenge-checkbox">${ch.completed ? '✓' : ''}</div>
        <div class="challenge-emoji">${ch.emoji}</div>
        <div class="challenge-text">${ch.text}</div>
      `;
      item.addEventListener('click', () => toggleChallenge(idx));
      list.appendChild(item);
    });

    // Update progress ring
    const completed = challenges.filter(c => c.completed).length;
    if (progressNum) progressNum.textContent = `${completed}/3`;
    if (progressRing) {
      const circ = 2 * Math.PI * 52;
      const offset = circ * (1 - completed / 3);
      progressRing.style.strokeDashoffset = offset;
    }

    // Update streak
    if (streakEl) streakEl.textContent = calcChallengeStreak();
  }

  // ===== 3. JOURNAL =====
  function saveJournal() {
    const textarea = document.getElementById('journal-textarea');
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) {
      alert('メモを入力してください！');
      return;
    }

    const data = loadUserData();
    data.journal.unshift({
      date: todayStr(),
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      text,
    });
    if (data.journal.length > 100) data.journal.length = 100;
    saveUserData(data);

    textarea.value = '';
    renderJournalSection();
    alert('メモを保存しました！');
  }

  function deleteJournal(index) {
    if (!confirm('このメモを削除しますか？')) return;
    const data = loadUserData();
    data.journal.splice(index, 1);
    saveUserData(data);
    renderJournalSection();
  }

  function renderJournalSection() {
    const list = document.getElementById('journal-list');
    if (!list) return;
    const data = loadUserData();

    if (data.journal.length === 0) {
      list.innerHTML = '<div class="history-empty" style="padding:16px 0;"><span style="font-size:1.5rem;">📝</span><p class="text-muted" style="font-size:0.82rem;">まだメモがありません</p></div>';
      return;
    }

    list.innerHTML = '';
    data.journal.slice(0, 20).forEach((entry, idx) => {
      list.innerHTML += `<div class="journal-entry">
        <div class="journal-entry-header">
          <span class="journal-entry-date">📅 ${entry.date} ${entry.time}</span>
          <button class="journal-entry-delete" data-idx="${idx}">✕</button>
        </div>
        <div class="journal-entry-text">${escapeHtml(entry.text)}</div>
      </div>`;
    });

    // Attach delete handlers
    list.querySelectorAll('.journal-entry-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteJournal(parseInt(btn.dataset.idx));
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== 4. WEEKLY REPORT =====
  function renderWeeklyReport() {
    const container = document.getElementById('weekly-report-content');
    if (!container) return;
    const data = loadUserData();

    // Collect 7-day data
    const today = new Date();
    let totalExercise = 0, totalDesk = 0, logCount = 0;
    let totalMood = 0, moodCount = 0;
    let challengeComplete = 0, challengeTotal = 0;
    let hydrationDays = 0;

    for (let i = 0; i < 7; i++) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);

      // Logs
      const log = (data.logs || []).find(l => l.date === key);
      if (log) {
        totalExercise += log.exerciseTime || 0;
        totalDesk += log.deskTime || 0;
        logCount++;
      }

      // Mood
      const mood = (data.moods || []).find(m => m.date === key);
      if (mood) {
        totalMood += mood.moodValue || 3;
        moodCount++;
      }

      // Challenges
      const ch = (data.challenges || {})[key];
      if (ch && ch.length === 3) {
        challengeTotal += 3;
        challengeComplete += ch.filter(c => c.completed).length;
      }
    }

    // Not enough data
    if (logCount === 0 && moodCount === 0 && challengeTotal === 0) {
      container.innerHTML = '<div class="history-empty"><span style="font-size:2rem;">📊</span><p>データが集まるとレポートが生成されます</p><p class="text-muted">ホームから分析を行い、気分や挑戦を記録しましょう</p></div>';
      return;
    }

    const avgMood = moodCount > 0 ? (totalMood / moodCount).toFixed(1) : '—';
    const avgDesk = logCount > 0 ? (totalDesk / logCount).toFixed(1) : '—';
    const challengeRate = challengeTotal > 0 ? Math.round((challengeComplete / challengeTotal) * 100) : 0;

    // Calculate grade
    let score = 0;
    if (moodCount > 0) score += (totalMood / moodCount) * 10; // max 50
    if (logCount >= 5) score += 15;
    else if (logCount >= 3) score += 10;
    else if (logCount >= 1) score += 5;
    score += challengeRate * 0.2; // max 20
    if (moodCount >= 5) score += 10;
    else if (moodCount >= 3) score += 5;
    score = Math.min(100, Math.round(score));

    let grade, gradeClass;
    if (score >= 80) { grade = 'S'; gradeClass = 'grade-s'; }
    else if (score >= 65) { grade = 'A'; gradeClass = 'grade-a'; }
    else if (score >= 50) { grade = 'B'; gradeClass = 'grade-b'; }
    else if (score >= 30) { grade = 'C'; gradeClass = 'grade-c'; }
    else { grade = 'D'; gradeClass = 'grade-d'; }

    // AI Comment
    let comment;
    if (score >= 80) comment = '素晴らしい1週間でした！この調子を維持していきましょう。体も心もよくケアできています。';
    else if (score >= 65) comment = '良い週でした！もう少し継続的に記録をつけると、さらに効果的なセルフケアが可能になります。';
    else if (score >= 50) comment = 'まずまずの1週間です。ストレッチやチャレンジへの取り組みを少し増やしてみましょう。';
    else if (score >= 30) comment = '忙しい1週間だったかもしれません。小さなことからでも良いので、毎日の記録を心がけてみてください。';
    else comment = 'まだデータが少ないので、毎日少しずつ記録を始めてみましょう。継続が力になります！';

    container.innerHTML = `
      <div class="report-grade-container">
        <div class="report-grade ${gradeClass}">${grade}</div>
      </div>
      <div class="report-stats-grid">
        <div class="report-stat-item">
          <div class="report-stat-icon">🏃</div>
          <div class="report-stat-value">${totalExercise}分</div>
          <div class="report-stat-label">総運動時間</div>
        </div>
        <div class="report-stat-item">
          <div class="report-stat-icon">😊</div>
          <div class="report-stat-value">${avgMood}</div>
          <div class="report-stat-label">平均気分 (5段階)</div>
        </div>
        <div class="report-stat-item">
          <div class="report-stat-icon">💻</div>
          <div class="report-stat-value">${avgDesk}h</div>
          <div class="report-stat-label">平均PC時間</div>
        </div>
        <div class="report-stat-item">
          <div class="report-stat-icon">🎯</div>
          <div class="report-stat-value">${challengeRate}%</div>
          <div class="report-stat-label">チャレンジ達成率</div>
        </div>
      </div>
      <div class="report-comment">${comment}</div>
    `;
  }

  // ===== INIT =====
  function init() {
    // Mood button selection
    document.querySelectorAll('#mood-selector .mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mood-selector .mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = {
          emoji: btn.dataset.mood,
          value: parseInt(btn.dataset.value),
        };
      });
    });

    // Stress slider
    const stressSlider = document.getElementById('stress-level');
    const stressVal = document.getElementById('stress-level-val');
    if (stressSlider && stressVal) {
      stressSlider.addEventListener('input', () => {
        stressVal.textContent = stressSlider.value;
      });
    }

    // Save mood button
    document.getElementById('btn-save-mood')?.addEventListener('click', saveMood);

    // Save journal button
    document.getElementById('btn-save-journal')?.addEventListener('click', saveJournal);

    // Initialize challenges for today
    getTodayChallenges();
  }

  return {
    init,
    renderMoodTab,
    renderChallengeTab,
    renderJournalSection,
    renderWeeklyReport,
    saveMood,
  };
})();

document.addEventListener('DOMContentLoaded', () => RecoverExtras.init());
