/* ==========================================================================
   رحلتي — 214 | APPLICATION LOGIC ENGINE
   ========================================================================== */

const APP_STORAGE_KEY = 'REHLATY_214_DATA_STORE';
const DB_NAME = 'REHLATY_214_INDEXED_DB';
const DB_VERSION = 1;

let dbInstance = null;

const defaultState = {
  profile: {
    name: 'عباس',
    age: 2002,
    height: 164,
    weight: 70,
    coreGoal: 'بناء الانضباط والتحول الشامل في الجسم والعقل وإدارة الحياة.',
    startDate: null,
    started: false,
    xp: 0,
    level: 1,
    streak: 0,
    currentDay: 1,
    energyToday: 3,
    letter214: '',
    letterSealed: true
  },
  tasks: [
    { id: 1, title: 'المشي أو الحركة الخفيفة 20 دقيقة', domain: 'fitness', difficulty: 1, time: 20, completed: false, xp: 15, isMini: false },
    { id: 2, title: 'قراءة 10 صفحات بتركيز دون هاتف', domain: 'reading', difficulty: 2, time: 20, completed: false, xp: 20, isMini: false },
    { id: 3, title: 'تنظيم مهام الغد قبل النوم', domain: 'time', difficulty: 1, time: 10, completed: false, xp: 10, isMini: false },
    { id: 4, title: 'تدوين ملاحظة في دفتر الذات', domain: 'self', difficulty: 1, time: 10, completed: false, xp: 10, isMini: false }
  ],
  tree: {
    fitness: { name: 'الجسم واللياقة', level: 1, xp: 40, max: 100 },
    discipline: { name: 'الانضباط والاستمرارية', level: 1, xp: 50, max: 100 },
    reading: { name: 'المعرفة والقراءة', level: 1, xp: 30, max: 100 },
    skills: { name: 'المهارات والمشاريع', level: 1, xp: 20, max: 100 },
    time: { name: 'تنظيم الوقت والحياة', level: 1, xp: 45, max: 100 },
    self: { name: 'اكتشاف الذات والسلوك', level: 1, xp: 25, max: 100 },
    habits: { name: 'العادات الشخصية والروحية', level: 1, xp: 35, max: 100 }
  },
  journals: [],
  books: [],
  skills: [],
  timeLogs: [],
  rewards: [
    { id: 1, title: 'مشاهدة فيلم وثائقي ممتع', cost: 100, claimed: false },
    { id: 2, title: 'شراء كتاب تقني أو معرفي جديد', cost: 250, claimed: false }
  ],
  experiences: [
    { id: 1, title: 'تجربة الاستيقاظ 5:00 ص والمشي في الهواء النقي', status: 'pending' },
    { id: 2, title: 'جلسة تركيز لساعتين بدون إشعارات إطلاقاً', status: 'completed' }
  ],
  rescueLogs: [],
  phases: [
    { index: 1, days: '1 - 30', name: 'المرحلة الأولى: التأسيس', goal: 'التعرف على العادات الحالية، وبناء روتين واقعي دون إجهاد.' },
    { index: 2, days: '31 - 60', name: 'المرحلة الثانية: الانضباط', goal: 'تطوير الالتزام بالمهام، وتقليل التأجيل، وتحسين إدارة اليوم.' },
    { index: 3, days: '61 - 90', name: 'المرحلة الثالثة: الجسم والحركة', goal: 'تثبيت الحركة الآمنة، ومتابعة النشاط والتقدم البدني.' },
    { index: 4, days: '91 - 120', name: 'المرحلة الرابعة: المعرفة', goal: 'اختيار كتاب مناسب، وتسجيل الأفكار وتطبيقها سلوكياً.' },
    { index: 5, days: '121 - 150', name: 'المرحلة الخامسة: المهارات', goal: 'اختيار مهارة عملية، وإنجاز مشروع حقيقي يثبت الإتقان.' },
    { index: 6, days: '151 - 180', name: 'المرحلة السادسة: التوسع والتجربة', goal: 'تجربة أنشطة جديدة ومراجعة طرق إدارة الوقت.' },
    { index: 7, days: '181 - 210', name: 'المرحلة السابعة: التثبيت', goal: 'تثبيت العادات الناجحة ومعالجة نقاط التعثر المتكررة.' },
    { index: 8, days: '211 - 214', name: 'المرحلة الختامية: الإغلاق والتحول', goal: 'استخراج النتائج، وفتح رسالة البداية، وتفعيل ميثاق الاستمرار.' }
  ],
  postPlan: { habits: '', minimal: '' }
};

let appState = JSON.parse(JSON.stringify(defaultState));

/* IndexedDB للصور والمرفقات الثقيلة */
function initIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      loadSavedPhotos();
      resolve(dbInstance);
    };
    request.onerror = () => {
      console.warn('تعذر فتح IndexedDB، سيتم الاعتماد على LocalStorage.');
      resolve(null);
    };
  });
}

function persistState() {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appState));
  updateUI();
}

function loadState() {
  const stored = localStorage.getItem(APP_STORAGE_KEY);
  if (stored) {
    try {
      appState = Object.assign(JSON.parse(JSON.stringify(defaultState)), JSON.parse(stored));
    } catch(e) {
      console.error('خطأ في استرجاع البيانات المحفوظة', e);
    }
  }
  recalculateDayProgress();
}

function recalculateDayProgress() {
  if (appState.profile.started && appState.profile.startDate) {
    const start = new Date(appState.profile.startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    appState.profile.currentDay = Math.min(Math.max(diffDays, 1), 214);
  }
}

/* التنقل والتنبيهات */
function switchView(viewId, triggerBtn = null) {
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  if (triggerBtn) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    triggerBtn.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleDrawer() {
  document.getElementById('drawerOverlay').classList.toggle('active');
  document.getElementById('drawerMenu').classList.toggle('active');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

/* التهيئة الأولى */
function checkOnboarding() {
  if (!appState.profile.started) {
    document.getElementById('onboardingModal').classList.add('active');
  }
}

function completeOnboarding() {
  const name = document.getElementById('obName').value.trim() || 'عباس';
  const age = parseInt(document.getElementById('obAge').value) || 2002;
  const height = parseInt(document.getElementById('obHeight').value) || 164;
  const weight = parseInt(document.getElementById('obWeight').value) || 70;
  const coreGoal = document.getElementById('obCoreGoal').value.trim() || 'الانضباط والتحول الشامل';
  const letter = document.getElementById('obLetter').value.trim();

  appState.profile.name = name;
  appState.profile.age = age;
  appState.profile.height = height;
  appState.profile.weight = weight;
  appState.profile.coreGoal = coreGoal;
  appState.profile.letter214 = letter;
  appState.profile.startDate = new Date().toISOString();
  appState.profile.started = true;
  appState.profile.currentDay = 1;

  document.getElementById('onboardingModal').classList.remove('active');
  persistState();
  showToast('بدأت الرحلة المباركة! اليوم 1 من 214');
}

/* تحديث الواجهة */
function updateUI() {
  document.getElementById('headerDayLabel').innerText = `اليوم ${appState.profile.currentDay} من 214`;
  document.getElementById('headerUserName').innerText = appState.profile.name;
  document.getElementById('headerUserXP').innerText = `${appState.profile.xp} XP`;

  document.getElementById('greetingTitle').innerText = `مرحباً، ${appState.profile.name}`;
  const day = appState.profile.currentDay;
  const remaining = 214 - day;
  const percent = ((day / 214) * 100).toFixed(1);

  document.getElementById('daysPassedLabel').innerText = `اليوم: ${day}`;
  document.getElementById('daysRemainingLabel').innerText = `المتبقي: ${remaining} يوماً`;
  document.getElementById('daysPercentLabel').innerText = `${percent}%`;
  document.getElementById('journeyProgressBar').style.width = `${percent}%`;

  document.getElementById('levelNameBadge').innerText = getLevelTitle(appState.profile.xp);
  document.getElementById('streakValue').innerText = `${appState.profile.streak} أيام`;
  
  const doneCount = appState.tasks.filter(t => t.completed).length;
  document.getElementById('tasksDoneRatio').innerText = `${doneCount} / ${appState.tasks.length}`;

  const currentPhase = getPhaseForDay(day);
  document.getElementById('currentPhaseBadge').innerText = currentPhase.name;
  document.getElementById('phaseGoalSummary').innerText = currentPhase.goal;

  renderTasks();
  renderTree();
  renderPhases();
  renderJournals();
  renderBooks();
  renderSkills();
  renderTimeLogs();
  renderRewards();
  renderExperiences();
  renderDiagnostics();

  document.getElementById('settingsUserNameInput').value = appState.profile.name;
}

function getLevelTitle(xp) {
  if (xp >= 1000) return 'المستوى 5: سيّد الاستمرارية';
  if (xp >= 600) return 'المستوى 4: الممارس المتقدم';
  if (xp >= 300) return 'المستوى 3: المنضبط الثابت';
  if (xp >= 100) return 'المستوى 2: المجتهد الملتزم';
  return 'المستوى 1: الانطلاقة والتأسيس';
}

function getPhaseForDay(day) {
  if (day <= 30) return appState.phases[0];
  if (day <= 60) return appState.phases[1];
  if (day <= 90) return appState.phases[2];
  if (day <= 120) return appState.phases[3];
  if (day <= 150) return appState.phases[4];
  if (day <= 180) return appState.phases[5];
  if (day <= 210) return appState.phases[6];
  return appState.phases[7];
}

/* إدارة المهام والـ XP */
function renderTasks() {
  const container = document.getElementById('tasksListContainer');
  if (appState.tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>لا توجد مهام حالية. اضغط على "+ إضافة مهمة" للبدء.</p></div>';
    return;
  }
  container.innerHTML = appState.tasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}">
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskCompletion(${task.id})">
        ${task.completed ? '✓' : ''}
      </div>
      <div class="task-content">
        <div class="task-text" style="font-weight: 600; font-size: 0.88rem;">${task.title}</div>
        <div class="task-meta">
          <span>${getDomainName(task.domain)}</span>
          <span>• ${task.time} دقيقة</span>
          <span>• +${task.xp} XP</span>
          ${task.isMini ? '<span class="badge badge-maroon">مهمة مصغرة</span>' : ''}
        </div>
      </div>
      <button class="btn btn-sm btn-secondary" onclick="deleteTask(${task.id})">حذف</button>
    </div>
  `).join('');
}

function toggleTaskCompletion(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  if (task.completed) {
    appState.profile.xp += task.xp;
    if (appState.tree[task.domain]) {
      appState.tree[task.domain].xp += task.xp;
      if (appState.tree[task.domain].xp >= appState.tree[task.domain].max) {
        appState.tree[task.domain].level += 1;
        appState.tree[task.domain].xp = 0;
        showToast(`ارتقى مسار ${appState.tree[task.domain].name} إلى المستوى ${appState.tree[task.domain].level}!`);
      }
    }
    showToast(`أحسنت! +${task.xp} XP`);
  } else {
    appState.profile.xp = Math.max(0, appState.profile.xp - task.xp);
  }
  persistState();
}

function openAddTaskModal() {
  document.getElementById('addTaskModal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function submitNewTask() {
  const title = document.getElementById('taskTitleInput').value.trim();
  const domain = document.getElementById('taskDomainSelect').value;
  const diff = parseInt(document.getElementById('taskDifficultySelect').value);
  const time = parseInt(document.getElementById('taskTimeInput').value) || 15;

  if (!title) return;

  const xp = diff === 1 ? 10 : diff === 2 ? 20 : 35;
  appState.tasks.push({
    id: Date.now(),
    title,
    domain,
    difficulty: diff,
    time,
    completed: false,
    xp,
    isMini: false
  });

  document.getElementById('taskTitleInput').value = '';
  closeModal('addTaskModal');
  persistState();
  showToast('تمت إضافة المهمة بنجاح');
}

function deleteTask(id) {
  appState.tasks = appState.tasks.filter(t => t.id !== id);
  persistState();
}

function getDomainName(domain) {
  const map = {
    fitness: 'الجسم واللياقة',
    discipline: 'الانضباط',
    reading: 'المعرفة والقراءة',
    skills: 'المهارات والمشاريع',
    time: 'تنظيم الوقت',
    self: 'اكتشاف الذات',
    habits: 'العادات الشخصية'
  };
  return map[domain] || 'عام';
}

/* وضع الطاقة واليوم الصعب */
function setDailyEnergy(level) {
  appState.profile.energyToday = level;
  document.querySelectorAll('.energy-btn').forEach((b, idx) => {
    b.classList.toggle('active', idx + 1 === level);
  });
  persistState();
  showToast('تم تسجيل مستوى الطاقة');
}

function toggleToughDayModal() {
  document.getElementById('toughDayModal').classList.add('active');
}

function activateToughDayMode() {
  appState.tasks = [
    { id: Date.now() + 1, title: 'قراءة صفحة واحدة بتأنٍ وهدوء', domain: 'reading', difficulty: 1, time: 5, completed: false, xp: 10, isMini: true },
    { id: Date.now() + 2, title: 'تمطيط خفيف ومشي دافئ 5 دقائق', domain: 'fitness', difficulty: 1, time: 5, completed: false, xp: 10, isMini: true },
    { id: Date.now() + 3, title: 'ترتيب مكان الجلوس وتنفس عميق', domain: 'discipline', difficulty: 1, time: 5, completed: false, xp: 10, isMini: true }
  ];
  closeModal('toughDayModal');
  persistState();
  showToast('تم تفعيل وضع اليوم الصعب؛ ركز على الإنجاز الأدنى');
  switchView('view-tasks');
}

/* شجرة الشخصية */
function renderTree() {
  const container = document.getElementById('treeNodesContainer');
  container.innerHTML = Object.keys(appState.tree).map(key => {
    const item = appState.tree[key];
    const progress = ((item.xp / item.max) * 100).toFixed(0);
    return `
      <div class="tree-node">
        <div class="tree-node-title">
          <span>${item.name}</span>
          <span class="badge badge-maroon">مستوى ${item.level}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${progress}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
          <span>التقدم: ${progress}%</span>
          <span>${item.xp} / ${item.max} XP للترقية</span>
        </div>
      </div>
    `;
  }).join('');
}

/* خريطة المراحل */
function renderPhases() {
  const container = document.getElementById('phasesContainer');
  const currentDay = appState.profile.currentDay;
  container.innerHTML = appState.phases.map(phase => {
    const isCurrent = getPhaseForDay(currentDay).index === phase.index;
    return `
      <div class="card" style="border-color: ${isCurrent ? 'var(--maroon-light)' : 'var(--border-color)'}; margin-bottom: 10px;">
        <div class="card-header" style="border: none; padding-bottom: 0;">
          <div>
            <strong>${phase.name}</strong>
            <span class="text-muted" style="margin-right: 8px;">(الأيام: ${phase.days})</span>
          </div>
          ${isCurrent ? '<span class="badge badge-maroon">المرحلة الحالية</span>' : ''}
        </div>
        <p class="text-muted" style="margin-top: 6px;">${phase.goal}</p>
      </div>
    `;
  }).join('');
}

/* نظام الإنقاذ والتعثر */
function applyRescuePlan() {
  const reason = document.getElementById('rescueReasonSelect').value;
  const step = document.getElementById('rescueStepInput').value.trim();

  appState.rescueLogs.unshift({
    date: new Date().toLocaleDateString('ar-EG'),
    day: appState.profile.currentDay,
    reason,
    step
  });

  if (step) {
    appState.tasks.unshift({
      id: Date.now(),
      title: `[خطوة العودة]: ${step}`,
      domain: 'discipline',
      difficulty: 1,
      time: 10,
      completed: false,
      xp: 20,
      isMini: true
    });
  }

  persistState();
  showToast('تم اعتماد خطة العودة برفق! استأنف حركتك الآن');
  renderRescueHistory();
  switchView('view-tasks');
}

function renderRescueHistory() {
  const container = document.getElementById('rescueHistoryList');
  if (appState.rescueLogs.length === 0) {
    container.innerHTML = '<p class="text-muted">لا توجد سجلات انقطاع سابقة؛ سيرك متزن.</p>';
    return;
  }
  container.innerHTML = appState.rescueLogs.map(log => `
    <div style="background: var(--bg-card); padding: 8px; border-radius: 6px; margin-bottom: 6px; font-size: 0.8rem;">
      <span style="color: var(--maroon-light); font-weight: 600;">${log.date} (اليوم ${log.day}):</span>
      <span>الخطوة المستهدفة: ${log.step}</span>
    </div>
  `).join('');
}

/* دفتر التأمل */
function saveJournalEntry() {
  const content = document.getElementById('journalContentInput').value.trim();
  const prompt = document.getElementById('dailyJournalPrompt').innerText;
  if (!content) return;

  appState.journals.unshift({
    id: Date.now(),
    date: new Date().toLocaleDateString('ar-EG'),
    day: appState.profile.currentDay,
    prompt,
    content
  });

  appState.profile.xp += 15;
  document.getElementById('journalContentInput').value = '';
  persistState();
  showToast('تم حفظ التدوينة وإضافة +15 XP');
}

function renderJournals() {
  const container = document.getElementById('journalEntriesContainer');
  if (appState.journals.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align: center; margin-top: 10px;">لا توجد تدوينات بعد.</p>';
    return;
  }
  container.innerHTML = appState.journals.map(j => `
    <div style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--maroon-light);">
        <span>اليوم ${j.day} • ${j.date}</span>
      </div>
      <div style="font-size: 0.85rem; margin-top: 5px; white-space: pre-wrap;">${j.content}</div>
    </div>
  `).join('');
}

/* الكتب والمشاريع والوقت والمكافآت */
function renderBooks() {
  const container = document.getElementById('booksListContainer');
  if (appState.books.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>لم تقم بإضافة كتب بعد. أضف كتاباً وحدد تطبيقه العملي.</p></div>';
    return;
  }
  container.innerHTML = appState.books.map(b => `
    <div class="card" style="background: var(--bg-card); margin-bottom: 8px;">
      <div class="card-header" style="border: none; padding-bottom: 0;">
        <strong>${b.title}</strong>
        <span class="badge badge-secondary">${b.status}</span>
      </div>
      <div class="text-muted" style="font-size: 0.8rem; margin-top: 4px;">المؤلف: ${b.author}</div>
      <div style="font-size: 0.82rem; margin-top: 6px; color: var(--text-primary);">
        <strong>التطبيق العملي المستفاد:</strong> ${b.actionable}
      </div>
    </div>
  `).join('');
}

function openAddBookModal() {
  const title = prompt('عنوان الكتاب:');
  if (!title) return;
  const author = prompt('اسم المؤلف:') || 'غير محدد';
  const actionable = prompt('ما السلوك أو التطبيق العملي المستفاد؟') || 'تطبيق الفكرة الرئيسية';

  appState.books.push({ id: Date.now(), title, author, actionable, status: 'قيد القراءة' });
  persistState();
  showToast('تمت إضافة الكتاب');
}

function renderSkills() {
  const container = document.getElementById('skillsListContainer');
  if (appState.skills.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>لا توجد مشاريع مهارية مضافة.</p></div>';
    return;
  }
  container.innerHTML = appState.skills.map(s => `
    <div class="card" style="background: var(--bg-card); margin-bottom: 8px;">
      <div class="card-header" style="border: none;">
        <strong>${s.title}</strong>
        <span class="badge badge-maroon">${s.status}</span>
      </div>
      <p class="text-muted">${s.desc}</p>
    </div>
  `).join('');
}

function openAddSkillModal() {
  const title = prompt('اسم المهارة أو المشروع:');
  if (!title) return;
  const desc = prompt('وصف النتيجة الملموسة:') || '';

  appState.skills.push({ id: Date.now(), title, desc, status: 'قيد التنفيذ' });
  persistState();
  showToast('تمت إضافة مشروع المهارة');
}

function renderTimeLogs() {
  const container = document.getElementById('timeEntriesContainer');
  if (appState.timeLogs.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>لم يتم تسجيل أنشطة زمنية اليوم.</p></div>';
    return;
  }
  container.innerHTML = appState.timeLogs.map(l => `
    <div style="background: var(--bg-card); padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; font-size: 0.85rem;">
      <span>${l.activity}</span>
      <span style="color: var(--maroon-light);">${l.duration} دقيقة</span>
    </div>
  `).join('');
}

function openAddTimeModal() {
  const activity = prompt('النشاط (مثال: دراسة، برمجة، قراءة):');
  if (!activity) return;
  const duration = parseInt(prompt('المدة بالدقائق:')) || 30;

  appState.timeLogs.unshift({ id: Date.now(), activity, duration });
  persistState();
  showToast('تم تسجيل الوقت');
}

function renderRewards() {
  const container = document.getElementById('rewardsListContainer');
  container.innerHTML = appState.rewards.map(r => `
    <div style="background: var(--bg-card); padding: 10px; border-radius: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 600; font-size: 0.85rem;">${r.title}</div>
        <div class="text-muted">${r.cost} XP</div>
      </div>
      <button class="btn btn-sm ${r.claimed ? 'btn-secondary' : 'btn-primary'}" onclick="claimReward(${r.id})">
        ${r.claimed ? 'تمت المكافأة' : 'صرف المكافأة'}
      </button>
    </div>
  `).join('');
}

function claimReward(id) {
  const reward = appState.rewards.find(r => r.id === id);
  if (!reward || reward.claimed) return;
  if (appState.profile.xp < reward.cost) {
    alert('نقاط الخبرة XP غير كافية لفتح هذه المكافأة بعد.');
    return;
  }
  appState.profile.xp -= reward.cost;
  reward.claimed = true;
  persistState();
  showToast('مبروك! استمتع بمكافأتك المستحقة');
}

function openAddRewardModal() {
  const title = prompt('عنوان المكافأة:');
  if (!title) return;
  const cost = parseInt(prompt('تكلفة النقاط (XP):')) || 100;
  appState.rewards.push({ id: Date.now(), title, cost, claimed: false });
  persistState();
}

function renderExperiences() {
  const container = document.getElementById('experiencesListContainer');
  container.innerHTML = appState.experiences.map(e => `
    <div style="background: var(--bg-card); padding: 10px; border-radius: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
      <span>${e.title}</span>
      <span class="badge ${e.status === 'completed' ? 'badge-maroon' : 'badge-secondary'}">${e.status === 'completed' ? 'تمت' : 'قيد الانتظار'}</span>
    </div>
  `).join('');
}

function openAddExperienceModal() {
  const title = prompt('التجربة الجديدة:');
  if (!title) return;
  appState.experiences.push({ id: Date.now(), title, status: 'pending' });
  persistState();
}

/* حفظ الصور في IndexedDB */
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Data = e.target.result;
    savePhotoToDB({
      date: new Date().toLocaleDateString('ar-EG'),
      day: appState.profile.currentDay,
      image: base64Data
    });
  };
  reader.readAsDataURL(file);
}

function savePhotoToDB(record) {
  if (!dbInstance) {
    showToast('التخزين المحلي غير مهيأ');
    return;
  }
  const tx = dbInstance.transaction('photos', 'readwrite');
  const store = tx.objectStore('photos');
  store.add(record);
  tx.oncomplete = () => {
    showToast('تم حفظ الصورة محلياً بنجاح');
    loadSavedPhotos();
  };
}

function loadSavedPhotos() {
  if (!dbInstance) return;
  const tx = dbInstance.transaction('photos', 'readonly');
  const store = tx.objectStore('photos');
  const req = store.getAll();
  req.onsuccess = () => {
    const photos = req.result || [];
    const container = document.getElementById('photoGalleryContainer');
    if (photos.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p>لا توجد صور توثيقية محفوظة بعد.</p></div>';
      return;
    }
    container.innerHTML = photos.map(p => `
      <div class="photo-card">
        <img src="${p.image}" alt="صورة مرحلية">
        <div class="photo-card-info">
          <span>اليوم ${p.day}</span>
          <button class="btn btn-sm btn-secondary" onclick="deletePhoto(${p.id})">حذف</button>
        </div>
      </div>
    `).join('');
  };
}

function deletePhoto(id) {
  if (!dbInstance) return;
  const tx = dbInstance.transaction('photos', 'readwrite');
  tx.objectStore('photos').delete(id);
  tx.oncomplete = () => {
    showToast('تم حذف الصورة');
    loadSavedPhotos();
  };
}

/* التشخيصات ورسالة 214 */
function renderDiagnostics() {
  const out = document.getElementById('diagnosticsOutput');
  const logs = appState.rescueLogs.length;
  const doneTasks = appState.tasks.filter(t => t.completed).length;

  out.innerHTML = `
    <div style="background: var(--bg-card); padding: 12px; border-radius: 8px; border-right: 3px solid var(--maroon-primary);">
      <strong>ملخص القراءة السلوكية:</strong>
      <p style="margin-top: 4px;">• عدد مرات طلب العودة للمسار: <strong>${logs}</strong> مرات.</p>
      <p>• إجمالي المهام المنجزة اليوم: <strong>${doneTasks}</strong> مهام.</p>
      <p style="margin-top: 6px; color: var(--text-secondary);">
        «الالتزام بخطوات مصغرة ثابتة يرفع احتمالية استكمال الأيام بنسبة تفوق محاولة التعويض العشوائي.»
      </p>
    </div>
  `;
}

function revealOrEditLetter() {
  if (appState.profile.currentDay < 214) {
    const choice = confirm(`الرسالة مقفلة ومخصصة لليوم 214 (أنت الآن في اليوم ${appState.profile.currentDay}).\nهل ترغب بمراجعة ما كتبته أو تعديله الآن؟`);
    if (choice) {
      const newText = prompt('رسالتك لنفسك في اليوم 214:', appState.profile.letter214);
      if (newText !== null) {
        appState.profile.letter214 = newText;
        persistState();
        showToast('تم تحديث الرسالة وأعيد إقفالها');
      }
    }
  } else {
    alert(`رسالتك من اليوم الأول:\n\n${appState.profile.letter214 || 'لم يتم تسجيل رسالة أولية.'}`);
  }
}

function savePostPlan() {
  appState.postPlan.habits = document.getElementById('postHabitsText').value;
  appState.postPlan.minimal = document.getElementById('postMinimalText').value;
  persistState();
  showToast('تم حفظ ميثاق الاستمرار بنجاح');
}

/* النسخ الاحتياطي وإدارة النظام */
function exportBackupData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `REHLATY_214_BACKUP_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
  showToast('تم تصدير ملف النسخة الاحتياطية بنجاح');
}

function importBackupData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && parsed.profile) {
        if (confirm('هل أنت متأكد من استبدال البيانات الحالية بالنسخة المحددة؟')) {
          appState = parsed;
          persistState();
          showToast('تمت استعادة البيانات بنجاح');
        }
      } else {
        alert('الملف غير متطابق مع بنية بيانات رحلتي 214.');
      }
    } catch(err) {
      alert('تعذر قراءة ملف النسخة الاحتياطية.');
    }
  };
  reader.readAsText(file);
}

function updateUserSettings() {
  const name = document.getElementById('settingsUserNameInput').value.trim();
  if (name) {
    appState.profile.name = name;
    persistState();
    showToast('تم حفظ التعديلات');
  }
}

function simulateDay(targetDay) {
  appState.profile.currentDay = targetDay;
  persistState();
  showToast(`تمت محاكاة الانتقال إلى اليوم ${targetDay}`);
}

function wipeAppData() {
  if (confirm('تحذير: هل أنت متأكد من مسح جميع البيانات وإعادة تعيين التطبيق من البداية؟')) {
    localStorage.removeItem(APP_STORAGE_KEY);
    location.reload();
  }
}

function dismissReminder() {
  document.getElementById('reminderBanner').classList.add('hidden');
}

/* تسجيل Service Worker للـ PWA */
function registerPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker مسجل بنجاح:', reg.scope))
        .catch(err => console.log('فشل تسجيل Service Worker:', err));
    });
  }
}

/* تشغيل التطبيق */
window.addEventListener('DOMContentLoaded', async () => {
  loadState();
  await initIndexedDB();
  registerPWA();
  checkOnboarding();
  updateUI();
});
