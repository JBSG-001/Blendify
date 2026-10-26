/**
 * BLENDIFY TEACHER & ADMINISTRATOR STUDIO - Client Logic
 * Powers the 5 core teacher/administrator management capabilities:
 * 1. Classroom Workplaces & Portals (create, tags, shareable links)
 * 2. Uploading Materials to LMS via Portal
 * 3. In-Time Activity Tracker (audit log: who, when, exact time)
 * 4. Customizable Quiz & Activity Builder
 * 5. Student Progression Assessment & Printable Record Sheet
 *
 * PERSISTENT AUTOSAVE ENGINE:
 * Automatically saves all created portals, uploaded materials, audit logs,
 * quiz configurations, questions, view selection, and draft form inputs
 * to localStorage. Everything is restored seamlessly whenever the website is opened.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // STORAGE KEYS & CONSTANTS
  // =========================================================================
  const STORAGE_KEYS = {
    USER: 'blendify_auth_user',
    ROLE: 'blendify_role',
    PORTALS: 'blendify_studio_portals',
    ACTIVE_PORTAL: 'blendify_studio_active_portal',
    MATERIALS: 'blendify_studio_materials',
    ACTIVITIES: 'blendify_studio_activities',
    METRICS: 'blendify_studio_metrics',
    QUIZ_DRAFT: 'blendify_studio_quiz_draft',
    QUIZZES_PUBLISHED: 'blendify_studio_quizzes',
    ACTIVE_VIEW: 'blendify_studio_active_view',
    FORM_DRAFTS: 'blendify_studio_draft_inputs',
    COMMUNITY_MATERIALS: 'blendify_community_materials',
    JOINED_PORTALS: 'blendify_joined_portals',
    ALL_PORTALS: 'blendify_all_portals'
  };

  const DEFAULT_PORTALS = [
    {
      tag: '#PORTAL-FIGMA-101',
      name: 'UI/UX Cohort 4 — Webflow Breakpoints Lab',
      cohort: 'FIGMA-101',
      desc: 'Focused on converting 1440px desktop wireframes to fluid flexbox and auto-layout containers.',
      learners: 18,
      materials: 6,
      quizzes: 2,
      url: 'https://blendify.edu/portal/join?tag=PORTAL-FIGMA-101'
    },
    {
      tag: '#PORTAL-WEBFLOW-88',
      name: 'Webflow CMS & Animations Workshop',
      cohort: 'WEBFLOW-88',
      desc: 'Structuring dynamic CMS collections, client-first classes, and scroll-driven micro-interactions.',
      learners: 24,
      materials: 8,
      quizzes: 1,
      url: 'https://blendify.edu/portal/join?tag=PORTAL-WEBFLOW-88'
    },
    {
      tag: '#PORTAL-TOKENS-22',
      name: 'Enterprise Design Tokens & Multi-Brand UI',
      cohort: 'TOKENS-22',
      desc: 'Figma variables, 8pt spacing rhythm, and fluid rem conversion formulas for production teams.',
      learners: 14,
      materials: 4,
      quizzes: 1,
      url: 'https://blendify.edu/portal/join?tag=PORTAL-TOKENS-22'
    }
  ];

  const DEFAULT_MATERIALS = [
    {
      id: 'mat-figma-01',
      portalTag: '#PORTAL-FIGMA-101',
      title: 'Figma Responsive Wireframe Starter Kit v2.4',
      category: 'Figma Kit',
      size: '34.2 MB',
      date: 'Sept 7, 2026',
      status: 'Open Access',
      allowDownload: true
    },
    {
      id: 'mat-break-02',
      portalTag: '#PORTAL-FIGMA-101',
      title: 'Fluid Breakpoints & Rem Units Cheat Sheet',
      category: 'Study Guide',
      size: '4.8 MB',
      date: 'Sept 8, 2026',
      status: 'Open Access',
      allowDownload: true
    },
    {
      id: 'mat-webflow-03',
      portalTag: '#PORTAL-FIGMA-101',
      title: 'Webflow Client-First Component Library',
      category: 'Webflow Project',
      size: 'Live URL',
      date: 'Sept 8, 2026',
      status: 'Open Access',
      allowDownload: true
    }
  ];

  const DEFAULT_ACTIVITIES = [
    {
      id: 'act-1',
      studentName: 'Aria Montgomery',
      studentId: '#STU-9021',
      initials: 'AM',
      colorClass: '',
      materialName: 'Module 2.2: Auto-Layout Fluid Constraints',
      portalTag: '#PORTAL-FIGMA-101',
      action: 'Viewed Material',
      actionClass: 'open',
      timeStr: '10:44:18 PM',
      dateStr: 'Sept 8, 2026',
      statusPill: 'Active Now'
    },
    {
      id: 'act-2',
      studentName: 'Rahim Chowdhury',
      studentId: '#STU-4812',
      initials: 'RC',
      colorClass: 'rc-avatar',
      materialName: 'Figma Responsive Wireframe Starter Kit v2.4',
      portalTag: '#PORTAL-FIGMA-101',
      action: 'Downloaded (.fig)',
      actionClass: 'download',
      timeStr: '10:38:05 PM',
      dateStr: 'Sept 8, 2026',
      statusPill: '6m ago'
    },
    {
      id: 'act-3',
      studentName: 'Harsh Vardhan',
      studentId: '#STU-1004',
      initials: 'HV',
      colorClass: '',
      materialName: 'Fluid Breakpoints & Rem Units Cheat Sheet',
      portalTag: '#PORTAL-FIGMA-101',
      action: 'Opened PDF',
      actionClass: 'open',
      timeStr: '10:15:22 PM',
      dateStr: 'Sept 8, 2026',
      statusPill: '29m ago'
    },
    {
      id: 'act-4',
      studentName: 'Sarah Kim',
      studentId: '#STU-6523',
      initials: 'SK',
      colorClass: 'sk-avatar',
      materialName: 'Webflow Client-First Component Library',
      portalTag: '#PORTAL-FIGMA-101',
      action: 'Viewed Cloneable',
      actionClass: 'open',
      timeStr: '09:42:50 PM',
      dateStr: 'Sept 8, 2026',
      statusPill: '1h ago'
    }
  ];

  const DEFAULT_METRICS = {
    activeToday: 18,
    openings: 42,
    downloads: 14
  };

  const DEFAULT_QUIZ = {
    title: 'Module 2: Auto Layout Constraints & Breakpoints Assessment',
    type: 'quiz',
    passScore: 80,
    timeLimit: 15,
    attempts: 3,
    questions: [
      {
        prompt: 'In Figma Auto-Layout, what constraint behavior causes a frame to expand to 100% of its parent container width?',
        points: 10,
        options: [
          'Hug contents',
          'Fill container (width: 100%)',
          'Fixed width: 375px'
        ],
        correctIndex: 1,
        hint: 'Fill container is the equivalent of width: 100% in CSS flexbox.'
      },
      {
        prompt: 'Why should Webflow web designers use rem units over hardcoded pixels for typography?',
        points: 10,
        options: [
          'Rem units scale proportionately with the user\'s browser accessibility settings',
          'Pixels load faster in CSS rendering engines',
          'Rem units prevent font loading on mobile'
        ],
        correctIndex: 0,
        hint: 'Rem units honor user-defined browser font sizes, ensuring accessible digital experiences.'
      }
    ]
  };

  // Helper: safe JSON parsing with fallback
  function safeJSONParse(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null && stored !== undefined) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`[Blendify] Error reading ${key} from localStorage:`, e);
    }
    return fallback;
  }

  // Helper: escape HTML strings
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // APPLICATION STATE INITIALIZATION (RESTORED FROM STORAGE)
  // =========================================================================
  const state = {
    activeView: safeJSONParse(STORAGE_KEYS.ACTIVE_VIEW, 'workspaces'),
    activePortal: safeJSONParse(STORAGE_KEYS.ACTIVE_PORTAL, {
      tag: '#PORTAL-FIGMA-101',
      name: 'UI/UX Cohort 4 — Webflow Breakpoints Lab',
      cohort: 'FIGMA-101',
      shareUrl: 'https://blendify.edu/portal/join?tag=PORTAL-FIGMA-101'
    }),
    portals: safeJSONParse(STORAGE_KEYS.PORTALS, DEFAULT_PORTALS),
    materials: safeJSONParse(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS),
    activities: safeJSONParse(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES),
    metrics: safeJSONParse(STORAGE_KEYS.METRICS, DEFAULT_METRICS),
    quizzes: safeJSONParse(STORAGE_KEYS.QUIZZES_PUBLISHED, []),
    selectedUploadFile: null,
    students: [
      { name: 'Aria Montgomery', id: '#STU-9021', initials: 'AM', colorClass: '' },
      { name: 'Rahim Chowdhury', id: '#STU-4812', initials: 'RC', colorClass: 'rc-avatar' },
      { name: 'Harsh Vardhan', id: '#STU-1004', initials: 'HV', colorClass: '' },
      { name: 'Sarah Kim', id: '#STU-6523', initials: 'SK', colorClass: 'sk-avatar' },
      { name: 'Elena Rostova', id: '#STU-3190', initials: 'ER', colorClass: '' },
      { name: 'Marcus Chen', id: '#STU-7741', initials: 'MC', colorClass: '' }
    ],
    questionCount: 2
  };

  // Synchronize state back into storage so first visits permanently record defaults
  function persistAllState() {
    try {
      localStorage.setItem(STORAGE_KEYS.PORTALS, JSON.stringify(state.portals));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PORTAL, JSON.stringify(state.activePortal));
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(state.materials));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(state.activities));
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(state.metrics));
      localStorage.setItem(STORAGE_KEYS.QUIZZES_PUBLISHED, JSON.stringify(state.quizzes));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, JSON.stringify(state.activeView));
    } catch (e) {
      console.warn('[Blendify] Storage write warning:', e);
    }
  }
  persistAllState();

  // =========================================================================
  // TOAST NOTIFICATIONS & AUTOSAVE INDICATOR
  // =========================================================================
  const CHECK_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const toastContainer = document.getElementById('toastContainer');
  function showToast(message, icon = CHECK_SVG) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon-box">${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3400);
  }

  const autoSaveIndicator = document.getElementById('autoSaveIndicator');
  let autoSaveDebounceTimer = null;

  function updateAutoSaveIndicator(status = 'saved', customText = '') {
    if (!autoSaveIndicator) return;
    const textEl = autoSaveIndicator.querySelector('.save-status-text');

    if (status === 'saving') {
      autoSaveIndicator.classList.add('saving');
      if (textEl) textEl.textContent = 'Saving progress...';
    } else {
      autoSaveIndicator.classList.remove('saving');
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (textEl) {
        textEl.textContent = customText || `All progress saved (${timeStr})`;
      }
    }
  }

  function triggerLiveAutoSave() {
    updateAutoSaveIndicator('saving');
    clearTimeout(autoSaveDebounceTimer);
    autoSaveDebounceTimer = setTimeout(() => {
      persistAllState();
      saveFormDrafts();
      saveQuizDraft();
      updateAutoSaveIndicator('saved');
    }, 350);
  }

  // Ensure all changes are flushed if user closes or reloads page
  window.addEventListener('beforeunload', () => {
    persistAllState();
    saveFormDrafts();
    saveQuizDraft();
  });

  // =========================================================================
  // VIEW NAVIGATION (5 MODULES)
  // =========================================================================
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  const panels = {
    'workspaces': document.getElementById('viewWorkspaces'),
    'upload-materials': document.getElementById('viewUploadMaterials'),
    'activity-tracker': document.getElementById('viewActivityTracker'),
    'quiz-builder': document.getElementById('viewQuizBuilder'),
    'progression-sheet': document.getElementById('viewProgressionSheet')
  };

  function switchView(viewName) {
    if (!panels[viewName]) return;
    state.activeView = viewName;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, JSON.stringify(viewName));
    } catch (e) {}

    // Update sidebar nav buttons
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    // Update panel active states
    Object.keys(panels).forEach(key => {
      if (panels[key]) {
        panels[key].classList.toggle('active', key === viewName);
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const targetView = link.getAttribute('data-view');
      switchView(targetView);
    });
  });

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });

  // =========================================================================
  // ACTIVE PORTAL SYNCHRONIZATION
  // =========================================================================
  const headerPortalSelect = document.getElementById('headerPortalSelect');
  const currentUploadPortalName = document.getElementById('currentUploadPortalName');
  const currentQuizPortalName = document.getElementById('currentQuizPortalName');
  const printPortalTag = document.getElementById('printPortalTag');

  function setActivePortal(tag, name, cohort) {
    const found = state.portals.find(p => p.tag === tag);
    state.activePortal.tag = tag;
    state.activePortal.name = name || (found ? found.name : tag);
    state.activePortal.cohort = cohort || (found ? found.cohort : 'COHORT-2026');
    state.activePortal.shareUrl = `https://blendify.edu/portal/join?tag=${tag.replace('#', '')}`;

    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PORTAL, JSON.stringify(state.activePortal));
    } catch (e) {}

    if (currentUploadPortalName) currentUploadPortalName.textContent = tag;
    if (currentQuizPortalName) currentQuizPortalName.textContent = tag;
    if (printPortalTag) printPortalTag.textContent = tag;

    if (headerPortalSelect) {
      headerPortalSelect.value = tag;
    }

    // Update active highlight on cards in the portals directory
    document.querySelectorAll('.portal-card').forEach(card => {
      const cardTag = card.querySelector('.portal-tag-pill')?.textContent?.trim();
      const isActive = cardTag === tag;
      card.classList.toggle('active', isActive);
      const btn = card.querySelector('.btn-select-portal');
      if (btn) {
        if (isActive) {
          btn.className = 'btn-primary-sm btn-select-portal';
          btn.textContent = 'Active Portal';
        } else {
          btn.className = 'btn-secondary-sm btn-select-portal';
          btn.textContent = 'Manage Portal';
        }
      }
    });

    // Re-render materials table filtered to this active portal
    renderMaterialsTable();
  }

  // Header dropdown switcher
  headerPortalSelect?.addEventListener('change', (e) => {
    const selectedTag = e.target.value;
    const found = state.portals.find(p => p.tag === selectedTag);
    setActivePortal(selectedTag, found ? found.name : selectedTag);
    showToast(`Active Classroom Portal switched to ${selectedTag}`);
    triggerLiveAutoSave();
  });

  // =========================================================================
  // MODULE 1: CLASSROOM WORKPLACES & PORTALS
  // =========================================================================
  const newPortalTitleInput = document.getElementById('newPortalTitleInput');
  const newPortalCohortInput = document.getElementById('newPortalCohortInput');
  const liveGeneratedTag = document.getElementById('liveGeneratedTag');
  const liveGeneratedUrl = document.getElementById('liveGeneratedUrl');
  const btnRefreshGeneratedTag = document.getElementById('btnRefreshGeneratedTag');
  const btnSubmitCreatePortal = document.getElementById('btnSubmitCreatePortal');
  const portalsListGrid = document.getElementById('portalsListGrid');
  const portalsCount = document.getElementById('portalsCount');

  function generateRandomTagCode() {
    const prefixes = ['FIGMA', 'UIUX', 'WEBFLOW', 'TOKENS', 'DEV', 'REACT', 'DESIGN'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `#PORTAL-${randomPrefix}-${randomNum}`;
  }

  function updateLiveTagDisplay() {
    let rawCohort = newPortalCohortInput?.value.trim().toUpperCase();
    if (rawCohort) {
      rawCohort = rawCohort.replace(/[^A-Z0-9-]/g, '');
      if (liveGeneratedTag) liveGeneratedTag.textContent = `#PORTAL-${rawCohort}`;
      if (liveGeneratedUrl) liveGeneratedUrl.textContent = `https://blendify.edu/portal/join?tag=PORTAL-${rawCohort}`;
    }
  }

  newPortalCohortInput?.addEventListener('input', () => {
    updateLiveTagDisplay();
    triggerLiveAutoSave();
  });

  newPortalTitleInput?.addEventListener('input', () => {
    triggerLiveAutoSave();
  });

  btnRefreshGeneratedTag?.addEventListener('click', (e) => {
    e.preventDefault();
    const newTag = generateRandomTagCode();
    if (liveGeneratedTag) liveGeneratedTag.textContent = newTag;
    if (liveGeneratedUrl) liveGeneratedUrl.textContent = `https://blendify.edu/portal/join?tag=${newTag.replace('#', '')}`;
    if (newPortalCohortInput) {
      newPortalCohortInput.value = newTag.replace('#PORTAL-', '');
    }
    showToast(`New portal tag generated: ${newTag}`);
    triggerLiveAutoSave();
  });

  // Clipboard copy helper
  function attachCopyLinkEvents(container) {
    if (!container) return;
    container.querySelectorAll('.btn-copy-portal-link').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        if (!url) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
          }
          showToast('Portal invite link copied to clipboard!');
        } catch {
          showToast(`Invite Link: ${url}`);
        }
      });
    });
  }

  function attachSelectPortalEvents(container) {
    if (!container) return;
    container.querySelectorAll('.btn-select-portal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = btn.getAttribute('data-tag');
        const name = btn.getAttribute('data-name');
        setActivePortal(tag, name);
        showToast(`Selected portal: ${tag}`);
        triggerLiveAutoSave();
      });
    });
  }

  // Render portals directory cards from state
  function renderPortalsGrid() {
    if (!portalsListGrid) return;
    portalsListGrid.innerHTML = '';

    state.portals.forEach(portal => {
      const isActive = portal.tag === state.activePortal.tag;
      const portalCard = document.createElement('div');
      portalCard.className = `portal-card ${isActive ? 'active' : ''}`;
      portalCard.innerHTML = `
        <div class="portal-card-top">
          <span class="portal-tag-pill">${escapeHtml(portal.tag)}</span>
          <span class="status-live-tag"><span class="green-dot"></span> Active</span>
        </div>
        <h4>${escapeHtml(portal.name)}</h4>
        <p>${escapeHtml(portal.desc)}</p>
        <div class="portal-card-stats">
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> ${portal.learners || 1} Learners</span>
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> ${portal.materials || 0} Materials</span>
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="9" y1="15" x2="15" y2="15"></line><line x1="9" y1="11" x2="15" y2="11"></line></svg> ${portal.quizzes || 0} Quizzes</span>
        </div>
        <div class="portal-card-actions">
          <button class="${isActive ? 'btn-primary-sm' : 'btn-secondary-sm'} btn-select-portal" data-tag="${escapeHtml(portal.tag)}" data-name="${escapeHtml(portal.name)}">${isActive ? 'Active Portal' : 'Manage Portal'}</button>
          <button class="btn-ghost-sm btn-copy-portal-link" data-url="${escapeHtml(portal.url)}">Copy Link</button>
        </div>
      `;
      portalsListGrid.appendChild(portalCard);
    });

    attachCopyLinkEvents(portalsListGrid);
    attachSelectPortalEvents(portalsListGrid);

    // Update header dropdown
    if (headerPortalSelect) {
      headerPortalSelect.innerHTML = '';
      state.portals.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.tag;
        opt.textContent = `${p.tag} (${p.name})`;
        if (p.tag === state.activePortal.tag) opt.selected = true;
        headerPortalSelect.appendChild(opt);
      });
    }

    if (portalsCount) {
      portalsCount.textContent = `${state.portals.length} Active Portals`;
    }
  }

  // Cross-register portal in student storage so learners can join by tag
  function syncPortalToStudentStorage(portal) {
    try {
      const rawJoined = localStorage.getItem(STORAGE_KEYS.JOINED_PORTALS);
      const list = rawJoined ? JSON.parse(rawJoined) : [];
      const exists = list.some(p => p.tag === portal.tag);
      if (!exists) {
        list.unshift({
          tag: portal.tag,
          name: portal.name,
          instructor: 'Harsh Vardhan',
          topic: portal.cohort || 'Design & Code',
          activeMembers: 1,
          unreadNotice: true,
          initials: 'PR',
          colorClass: 'purple-box',
          shareUrl: portal.url
        });
        localStorage.setItem(STORAGE_KEYS.JOINED_PORTALS, JSON.stringify(list));
      }

      // Also register into global portal directory
      const rawAll = localStorage.getItem(STORAGE_KEYS.ALL_PORTALS);
      const allPortals = rawAll ? JSON.parse(rawAll) : [];
      if (!allPortals.some(p => p.tag === portal.tag)) {
        allPortals.unshift(portal);
        localStorage.setItem(STORAGE_KEYS.ALL_PORTALS, JSON.stringify(allPortals));
      }
    } catch (e) {
      console.warn('[Blendify] Sync portal error:', e);
    }
  }

  // Handle portal creation form submission
  btnSubmitCreatePortal?.addEventListener('click', () => {
    const title = newPortalTitleInput?.value.trim();
    if (!title) {
      showToast('Please enter a Classroom Workspace Name.');
      newPortalTitleInput?.focus();
      return;
    }

    const tag = liveGeneratedTag?.textContent.trim() || generateRandomTagCode();
    const shareUrl = liveGeneratedUrl?.textContent.trim() || `https://blendify.edu/portal/join?tag=${tag.replace('#', '')}`;
    const cohortCode = newPortalCohortInput?.value.trim().toUpperCase() || 'COHORT-2026';

    const newPortal = {
      tag,
      name: title,
      cohort: cohortCode,
      desc: `Dedicated portal for ${title}. Learners access materials, activities, and real-time tracking here.`,
      learners: 1,
      materials: 0,
      quizzes: 0,
      url: shareUrl
    };

    // Add to state and save
    state.portals.unshift(newPortal);
    syncPortalToStudentStorage(newPortal);
    persistAllState();
    renderPortalsGrid();

    // Set as active portal
    setActivePortal(tag, title, cohortCode);

    // Reset inputs & draft
    if (newPortalTitleInput) newPortalTitleInput.value = '';
    if (newPortalCohortInput) newPortalCohortInput.value = '';
    const freshTag = generateRandomTagCode();
    if (liveGeneratedTag) liveGeneratedTag.textContent = freshTag;
    if (liveGeneratedUrl) liveGeneratedUrl.textContent = `https://blendify.edu/portal/join?tag=${freshTag.replace('#', '')}`;
    saveFormDrafts();

    showToast(`Classroom Portal ${tag} launched & saved!`);

    // Add activity tracker log entry
    recordActivityEvent({
      studentName: 'Harsh Vardhan (Instructor)',
      studentId: '#FACULTY-01',
      materialName: `Created Classroom Portal: ${title} (${tag})`,
      action: 'Portal Created',
      actionClass: 'open',
      statusPill: 'Active Now'
    });

    triggerLiveAutoSave();
  });

  // =========================================================================
  // MODULE 2: UPLOAD MATERIALS THROUGH CLASSROOM PORTAL
  // =========================================================================
  const materialTitleInput = document.getElementById('materialTitleInput');
  const materialCategorySelect = document.getElementById('materialCategorySelect');
  const fileDropCard = document.getElementById('fileDropCard');
  const portalMaterialFileInput = document.getElementById('portalMaterialFileInput');
  const fileDropLabel = document.getElementById('fileDropLabel');
  const materialDescInput = document.getElementById('materialDescInput');
  const checkAllowDownload = document.getElementById('checkAllowDownload');
  const btnPublishMaterialToPortal = document.getElementById('btnPublishMaterialToPortal');
  const portalMaterialsTableBody = document.getElementById('portalMaterialsTableBody');

  function getCategorySvg(category = '') {
    if (category.includes('Figma')) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2a4 4 0 0 0-4 4v4h4a4 4 0 0 0 0-8z"></path><path d="M12 10H8a4 4 0 0 0 0 8h4v-8z"></path><path d="M12 10h4a4 4 0 0 0 0-8h-4v8z"></path><path d="M12 18H8a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4h-4v4z"></path></svg>`;
    }
    if (category.includes('Webflow')) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
    }
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
  }

  function renderMaterialsTable() {
    if (!portalMaterialsTableBody) return;
    portalMaterialsTableBody.innerHTML = '';

    const currentTag = state.activePortal.tag;
    // Show materials for active portal (or any unassigned default materials if viewing default)
    const portalMaterials = state.materials.filter(m => !m.portalTag || m.portalTag === currentTag);

    if (portalMaterials.length === 0) {
      portalMaterialsTableBody.innerHTML = `
        <tr class="empty-state-row">
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 36px 16px;">
            No materials uploaded to ${escapeHtml(currentTag)} yet. Upload your first material using the form above!
          </td>
        </tr>
      `;
      return;
    }

    portalMaterials.forEach(mat => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', mat.id);
      row.innerHTML = `
        <td>
          <div class="table-mat-name">
            <span class="file-badge vector-badge">${getCategorySvg(mat.category)}</span>
            <strong>${escapeHtml(mat.title)}</strong>
          </div>
        </td>
        <td>${escapeHtml(mat.category)}</td>
        <td>${escapeHtml(mat.size)}</td>
        <td>${escapeHtml(mat.date)}</td>
        <td><span class="status-pill open">${escapeHtml(mat.status || 'Open Access')}</span></td>
        <td><button class="btn-ghost-xs text-danger btn-delete-mat" data-id="${escapeHtml(mat.id)}">Delete</button></td>
      `;
      portalMaterialsTableBody.appendChild(row);
    });

    // Bind delete handlers
    portalMaterialsTableBody.querySelectorAll('.btn-delete-mat').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const mat = state.materials.find(m => m.id === id);
        state.materials = state.materials.filter(m => m.id !== id);
        persistAllState();
        renderMaterialsTable();
        showToast(`Removed "${mat ? mat.title : 'Material'}" from portal.`);
        triggerLiveAutoSave();
      });
    });
  }

  // Drag & drop handling
  if (fileDropCard && portalMaterialFileInput) {
    fileDropCard.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropCard.style.borderColor = 'var(--primary)';
      fileDropCard.style.backgroundColor = 'var(--primary-subtle)';
    });

    ['dragleave', 'dragend'].forEach(type => {
      fileDropCard.addEventListener(type, () => {
        fileDropCard.style.borderColor = '';
        fileDropCard.style.backgroundColor = '';
      });
    });

    fileDropCard.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropCard.style.borderColor = '';
      fileDropCard.style.backgroundColor = '';
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleSelectedMaterialFile(files[0]);
      }
    });

    portalMaterialFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleSelectedMaterialFile(e.target.files[0]);
      }
    });
  }

  function handleSelectedMaterialFile(file) {
    state.selectedUploadFile = file;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    if (fileDropLabel) {
      fileDropLabel.innerHTML = `<strong>Selected:</strong> ${file.name} (${sizeMb} MB)`;
    }
    if (materialTitleInput && !materialTitleInput.value.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      materialTitleInput.value = nameWithoutExt.replace(/[-_]/g, ' ');
    }
    showToast(`Attached ${file.name} for upload.`);
    triggerLiveAutoSave();
  }

  // Cross-sync material to student community materials
  function syncMaterialToCommunity(mat) {
    try {
      const rawComm = localStorage.getItem(STORAGE_KEYS.COMMUNITY_MATERIALS);
      const list = rawComm ? JSON.parse(rawComm) : [];
      list.unshift({
        id: mat.id,
        title: mat.title,
        desc: mat.desc || `Official material for ${mat.portalTag}. Download and study to complete module milestones.`,
        category: mat.category.includes('Figma') ? 'templates' : mat.category.includes('Webflow') ? 'code' : 'guides',
        categoryLabel: mat.category,
        ext: mat.category.includes('Figma') ? 'FIG' : 'PDF',
        size: mat.size,
        downloads: 0,
        author: 'Harsh Vardhan',
        authorRole: 'Classroom Instructor',
        time: 'Just now',
        filename: `${mat.title.replace(/\s+/g, '-')}.${mat.category.includes('Figma') ? 'fig' : 'pdf'}`,
        content: `Blendify Material Content for ${mat.title}. Associated with ${mat.portalTag}.`
      });
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_MATERIALS, JSON.stringify(list));
    } catch (e) {
      console.warn('[Blendify] Community material sync error:', e);
    }
  }

  btnPublishMaterialToPortal?.addEventListener('click', () => {
    const title = materialTitleInput?.value.trim();
    if (!title) {
      showToast('Please enter a Material Title.');
      materialTitleInput?.focus();
      return;
    }

    const category = materialCategorySelect?.value || 'Study Guide';
    let sizeText = '4.5 MB';
    if (state.selectedUploadFile) {
      sizeText = `${(state.selectedUploadFile.size / (1024 * 1024)).toFixed(1)} MB`;
    } else if (category.includes('Figma')) {
      sizeText = '28.4 MB';
    } else if (category.includes('Webflow')) {
      sizeText = 'Live Template';
    }

    const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newMat = {
      id: `mat-${Date.now()}`,
      portalTag: state.activePortal.tag,
      title,
      category,
      size: sizeText,
      date: todayDate,
      desc: materialDescInput?.value.trim() || '',
      allowDownload: checkAllowDownload ? checkAllowDownload.checked : true,
      status: 'Open Access'
    };

    // Update portal material count in state
    const foundPortal = state.portals.find(p => p.tag === state.activePortal.tag);
    if (foundPortal) {
      foundPortal.materials = (foundPortal.materials || 0) + 1;
    }

    state.materials.unshift(newMat);
    syncMaterialToCommunity(newMat);
    persistAllState();
    renderMaterialsTable();
    renderPortalsGrid();

    // Reset upload form
    if (materialTitleInput) materialTitleInput.value = '';
    if (materialDescInput) materialDescInput.value = '';
    if (portalMaterialFileInput) portalMaterialFileInput.value = '';
    if (fileDropLabel) fileDropLabel.innerHTML = 'Choose a file or drag &amp; drop here';
    state.selectedUploadFile = null;
    saveFormDrafts();

    showToast(`Uploaded "${title}" to portal ${state.activePortal.tag}!`);

    // Audit log entry
    recordActivityEvent({
      studentName: 'Harsh Vardhan (Instructor)',
      studentId: '#FACULTY-01',
      materialName: `${title} (${category})`,
      action: 'Uploaded Material',
      actionClass: 'download',
      statusPill: 'Active Now'
    });

    triggerLiveAutoSave();
  });

  // =========================================================================
  // MODULE 3: IN-TIME ACTIVITY TRACKER (WHO, WHEN, EXACT TIME)
  // =========================================================================
  const activityLogTableBody = document.getElementById('activityLogTableBody');
  const activitySearchInput = document.getElementById('activitySearchInput');
  const btnSimulateStudentAccess = document.getElementById('btnSimulateStudentAccess');
  const metricActiveToday = document.getElementById('metricActiveToday');
  const metricMaterialOpenings = document.getElementById('metricMaterialOpenings');
  const metricDownloads = document.getElementById('metricDownloads');

  function renderActivityTable() {
    if (!activityLogTableBody) return;
    activityLogTableBody.innerHTML = '';

    if (state.activities.length === 0) {
      activityLogTableBody.innerHTML = `
        <tr class="empty-state-row">
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 36px 16px;">
            No live access events recorded yet. Click "Simulate Student Access" or upload materials to see audit entries.
          </td>
        </tr>
      `;
      return;
    }

    state.activities.forEach(item => {
      const row = document.createElement('tr');
      row.className = 'activity-row';
      row.innerHTML = `
        <td>
          <div class="student-user-cell">
            <div class="stu-avatar ${escapeHtml(item.colorClass || '')}">${escapeHtml(item.initials || 'ST')}</div>
            <div>
              <strong>${escapeHtml(item.studentName)}</strong>
              <span class="stu-id">ID: ${escapeHtml(item.studentId)}</span>
            </div>
          </div>
        </td>
        <td>
          <strong>${escapeHtml(item.materialName)}</strong>
          <span class="mat-subtext">Classroom Portal: ${escapeHtml(item.portalTag || state.activePortal.tag)}</span>
        </td>
        <td><span class="action-tag ${escapeHtml(item.actionClass || 'open')}">${escapeHtml(item.action)}</span></td>
        <td>
          <div class="timestamp-cell">
            <strong class="time-text">${escapeHtml(item.timeStr)}</strong>
            <span class="date-text">${escapeHtml(item.dateStr)}</span>
          </div>
        </td>
        <td><span class="live-status-pill online"><span class="green-dot"></span> ${escapeHtml(item.statusPill || 'Active Now')}</span></td>
      `;
      activityLogTableBody.appendChild(row);
    });

    // Update metrics UI
    if (metricActiveToday) metricActiveToday.textContent = state.metrics.activeToday || 18;
    if (metricMaterialOpenings) metricMaterialOpenings.textContent = state.metrics.openings || 42;
    if (metricDownloads) metricDownloads.textContent = state.metrics.downloads || 14;
  }

  function recordActivityEvent({ studentName, studentId, materialName, action, actionClass, statusPill }) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const initials = studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const newEvent = {
      id: `act-${Date.now()}`,
      studentName,
      studentId,
      initials,
      colorClass: '',
      materialName,
      portalTag: state.activePortal.tag,
      action,
      actionClass: actionClass || 'open',
      timeStr,
      dateStr,
      statusPill: statusPill || 'Active Now'
    };

    state.activities.unshift(newEvent);
    if (state.activities.length > 50) {
      state.activities.pop();
    }

    persistAllState();
    renderActivityTable();
    triggerLiveAutoSave();
  }

  // Simulation button for testing real-time logging
  btnSimulateStudentAccess?.addEventListener('click', () => {
    const randomStudent = state.students[Math.floor(Math.random() * state.students.length)];
    const sampleMaterials = [
      'Module 2.3: Fluid Grid Breakpoints Cheatsheet',
      'Figma Responsive Wireframe Starter Kit v2.4',
      'Webflow Client-First Component Library',
      'Typography & 8pt Spacing Rhythm Guide',
      'Module 1 Checkpoint Quiz: Responsive Grids'
    ];
    const randomMaterial = sampleMaterials[Math.floor(Math.random() * sampleMaterials.length)];

    const actions = [
      { action: 'Viewed Material', class: 'open' },
      { action: 'Downloaded (.fig)', class: 'download' },
      { action: 'Opened PDF Guide', class: 'open' }
    ];
    const chosenAction = actions[Math.floor(Math.random() * actions.length)];

    state.metrics.openings++;
    if (chosenAction.action.includes('Download')) {
      state.metrics.downloads++;
    }

    recordActivityEvent({
      studentName: randomStudent.name,
      studentId: randomStudent.id,
      materialName: randomMaterial,
      action: chosenAction.action,
      actionClass: chosenAction.class,
      statusPill: 'Just Now'
    });

    showToast(`In-time log saved: ${randomStudent.name} ${chosenAction.action}`);
  });

  activitySearchInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const rows = activityLogTableBody?.querySelectorAll('tr');
    rows?.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(term) ? '' : 'none';
    });
  });

  // =========================================================================
  // MODULE 4: CUSTOMIZABLE QUIZ & ACTIVITY BUILDER
  // =========================================================================
  const btnAddQuestionItem = document.getElementById('btnAddQuestionItem');
  const questionsListContainer = document.getElementById('questionsListContainer');
  const btnPublishQuizToPortal = document.getElementById('btnPublishQuizToPortal');
  const customQuizTitleInput = document.getElementById('customQuizTitleInput');
  const quizTypeSelect = document.getElementById('quizTypeSelect');
  const quizPassScoreInput = document.getElementById('quizPassScoreInput');
  const quizTimeLimitInput = document.getElementById('quizTimeLimitInput');
  const quizAttemptsInput = document.getElementById('quizAttemptsInput');

  function bindQuestionCardEvents(card) {
    const deleteBtn = card.querySelector('.btn-delete-question');
    deleteBtn?.addEventListener('click', () => {
      const cards = questionsListContainer.querySelectorAll('.question-builder-card');
      if (cards.length <= 1) {
        showToast('At least one question is required for the activity.');
        return;
      }
      card.remove();
      renumberQuestions();
      saveQuizDraft();
      showToast('Question removed.');
      triggerLiveAutoSave();
    });

    // Radio button correct answer badge updates
    const radios = card.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        card.querySelectorAll('.correct-badge').forEach(b => b.remove());
        const row = radio.closest('.option-edit-row');
        if (row) {
          const badge = document.createElement('span');
          badge.className = 'correct-badge';
          badge.textContent = 'Correct Answer';
          row.appendChild(badge);
        }
        saveQuizDraft();
        triggerLiveAutoSave();
      });
    });

    // Input listeners to trigger autosave on typing
    card.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        triggerLiveAutoSave();
      });
    });
  }

  function renumberQuestions() {
    const cards = questionsListContainer?.querySelectorAll('.question-builder-card');
    cards?.forEach((card, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const headerStrong = card.querySelector('.q-header-bar strong');
      if (headerStrong) headerStrong.textContent = `Question ${num}`;
      card.querySelectorAll('input[type="radio"]').forEach(r => {
        r.name = `q${idx + 1}_correct`;
      });
    });
  }

  function serializeQuestions() {
    if (!questionsListContainer) return DEFAULT_QUIZ.questions;
    const cards = questionsListContainer.querySelectorAll('.question-builder-card');
    const questions = [];
    cards.forEach((card, idx) => {
      const points = parseInt(card.querySelector('.points-input')?.value || '10', 10);
      const prompt = card.querySelector('.q-prompt-input')?.value || '';
      const optionRows = card.querySelectorAll('.option-edit-row');
      const options = [];
      let correctIndex = 0;
      optionRows.forEach((row, optIdx) => {
        const radio = row.querySelector('input[type="radio"]');
        if (radio && radio.checked) correctIndex = optIdx;
        const textInp = row.querySelector('input[type="text"]');
        options.push(textInp ? textInp.value : `Option ${String.fromCharCode(65 + optIdx)}`);
      });
      const hintInp = card.querySelector('.field-group:last-child input');
      const hint = hintInp ? hintInp.value : '';
      questions.push({
        prompt,
        points,
        options,
        correctIndex,
        hint
      });
    });
    return questions.length > 0 ? questions : DEFAULT_QUIZ.questions;
  }

  function createQuestionCardElement(q, index) {
    const num = String(index + 1).padStart(2, '0');
    const card = document.createElement('div');
    card.className = 'question-builder-card';
    card.setAttribute('data-q', index + 1);

    const optionsHtml = (q.options || ['Option A', 'Option B', 'Option C']).map((opt, optIdx) => {
      const isCorrect = q.correctIndex === optIdx;
      return `
        <div class="option-edit-row">
          <input type="radio" name="q${index + 1}_correct" value="${optIdx}" ${isCorrect ? 'checked' : ''} />
          <input type="text" class="form-control" placeholder="Option ${String.fromCharCode(65 + optIdx)}" value="${escapeHtml(opt)}" />
          ${isCorrect ? '<span class="correct-badge">Correct Answer</span>' : ''}
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="q-header-bar">
        <strong>Question ${num}</strong>
        <div class="q-points-wrap">
          <span>Points:</span>
          <input type="number" value="${q.points || 10}" class="points-input" min="1" max="100" />
          <button class="btn-ghost-xs text-danger btn-delete-question">Remove</button>
        </div>
      </div>
      <div class="field-group">
        <input type="text" class="form-control q-prompt-input" placeholder="Enter customized question prompt..." value="${escapeHtml(q.prompt || '')}" />
      </div>
      <div class="options-radio-list">
        ${optionsHtml}
      </div>
      <div class="field-group">
        <label class="field-label-sm">Custom Hint / Teacher Explanation for Learners</label>
        <input type="text" class="form-control input-sm" placeholder="Provide an explanation for students..." value="${escapeHtml(q.hint || '')}" />
      </div>
    `;

    bindQuestionCardEvents(card);
    return card;
  }

  function saveQuizDraft() {
    const draft = {
      title: customQuizTitleInput?.value || '',
      type: quizTypeSelect?.value || 'quiz',
      passScore: parseInt(quizPassScoreInput?.value || '80', 10),
      timeLimit: parseInt(quizTimeLimitInput?.value || '15', 10),
      attempts: parseInt(quizAttemptsInput?.value || '3', 10),
      questions: serializeQuestions()
    };
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZ_DRAFT, JSON.stringify(draft));
    } catch (e) {}
  }

  function restoreQuizDraft() {
    const draft = safeJSONParse(STORAGE_KEYS.QUIZ_DRAFT, DEFAULT_QUIZ);
    if (customQuizTitleInput && draft.title) customQuizTitleInput.value = draft.title;
    if (quizTypeSelect && draft.type) quizTypeSelect.value = draft.type;
    if (quizPassScoreInput && draft.passScore) quizPassScoreInput.value = draft.passScore;
    if (quizTimeLimitInput && draft.timeLimit) quizTimeLimitInput.value = draft.timeLimit;
    if (quizAttemptsInput && draft.attempts) quizAttemptsInput.value = draft.attempts;

    if (questionsListContainer && draft.questions && draft.questions.length > 0) {
      questionsListContainer.innerHTML = '';
      draft.questions.forEach((q, idx) => {
        const el = createQuestionCardElement(q, idx);
        questionsListContainer.appendChild(el);
      });
      state.questionCount = draft.questions.length;
    }
  }

  [customQuizTitleInput, quizTypeSelect, quizPassScoreInput, quizTimeLimitInput, quizAttemptsInput].forEach(el => {
    el?.addEventListener('input', () => {
      triggerLiveAutoSave();
    });
    el?.addEventListener('change', () => {
      triggerLiveAutoSave();
    });
  });

  // Add question handler
  btnAddQuestionItem?.addEventListener('click', () => {
    state.questionCount++;
    const newQ = {
      prompt: '',
      points: 10,
      options: ['Option A (Correct answer)', 'Option B', 'Option C'],
      correctIndex: 0,
      hint: ''
    };

    const card = createQuestionCardElement(newQ, state.questionCount - 1);
    questionsListContainer?.appendChild(card);
    renumberQuestions();
    card.querySelector('.q-prompt-input')?.focus();
    saveQuizDraft();
    showToast(`Added Question ${String(state.questionCount).padStart(2, '0')}!`);
    triggerLiveAutoSave();
  });

  // Publish activity handler
  btnPublishQuizToPortal?.addEventListener('click', () => {
    const title = customQuizTitleInput?.value.trim();
    if (!title) {
      showToast('Please specify an Activity or Quiz Title.');
      customQuizTitleInput?.focus();
      return;
    }

    const type = quizTypeSelect?.options[quizTypeSelect.selectedIndex]?.text || 'Quiz';
    const questions = serializeQuestions();
    const publishedRecord = {
      id: `quiz-${Date.now()}`,
      title,
      type,
      portalTag: state.activePortal.tag,
      questionsCount: questions.length,
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    // Update portal quizzes count in state
    const foundPortal = state.portals.find(p => p.tag === state.activePortal.tag);
    if (foundPortal) {
      foundPortal.quizzes = (foundPortal.quizzes || 0) + 1;
    }

    state.quizzes.unshift(publishedRecord);
    persistAllState();
    saveQuizDraft();
    renderPortalsGrid();

    showToast(`Activity "${title}" (${questions.length} Questions) published & saved!`);

    // Record audit event
    recordActivityEvent({
      studentName: 'Harsh Vardhan (Instructor)',
      studentId: '#FACULTY-01',
      materialName: `Published Quiz: ${title}`,
      action: 'Quiz Published',
      actionClass: 'open',
      statusPill: 'Active Now'
    });

    triggerLiveAutoSave();
  });

  // =========================================================================
  // FORM DRAFTS LIVE AUTOSAVE & RESTORATION
  // =========================================================================
  function saveFormDrafts() {
    const drafts = {
      portalTitle: newPortalTitleInput?.value || '',
      portalCohort: newPortalCohortInput?.value || '',
      materialTitle: materialTitleInput?.value || '',
      materialCategory: materialCategorySelect?.value || 'Study Guide',
      materialDesc: materialDescInput?.value || '',
      allowDownload: checkAllowDownload ? checkAllowDownload.checked : true
    };
    try {
      localStorage.setItem(STORAGE_KEYS.FORM_DRAFTS, JSON.stringify(drafts));
    } catch (e) {}
  }

  function restoreFormDrafts() {
    const drafts = safeJSONParse(STORAGE_KEYS.FORM_DRAFTS, null);
    if (!drafts) return;
    if (drafts.portalTitle && newPortalTitleInput) newPortalTitleInput.value = drafts.portalTitle;
    if (drafts.portalCohort && newPortalCohortInput) {
      newPortalCohortInput.value = drafts.portalCohort;
      updateLiveTagDisplay();
    }
    if (drafts.materialTitle && materialTitleInput) materialTitleInput.value = drafts.materialTitle;
    if (drafts.materialCategory && materialCategorySelect) materialCategorySelect.value = drafts.materialCategory;
    if (drafts.materialDesc && materialDescInput) materialDescInput.value = drafts.materialDesc;
    if (drafts.allowDownload !== undefined && checkAllowDownload) checkAllowDownload.checked = drafts.allowDownload;
  }

  [materialTitleInput, materialCategorySelect, materialDescInput, checkAllowDownload].forEach(el => {
    el?.addEventListener('input', triggerLiveAutoSave);
    el?.addEventListener('change', triggerLiveAutoSave);
  });

  // =========================================================================
  // MODULE 5: PROGRESSION ASSESSMENT & PRINTABLE RECORD SHEET
  // =========================================================================
  const btnPrintRecordSheet = document.getElementById('btnPrintRecordSheet');
  const printReportDate = document.getElementById('printReportDate');

  if (printReportDate) {
    const today = new Date();
    printReportDate.textContent = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  btnPrintRecordSheet?.addEventListener('click', () => {
    showToast('Preparing official academic progression data sheet for printing...');
    setTimeout(() => {
      window.print();
    }, 300);
  });

  // =========================================================================
  // USER PROFILE & ACCOUNT MANAGEMENT
  // =========================================================================
  const userProfileBtn = document.getElementById('userProfileBtn');
  const userPanel = document.getElementById('userPanel');
  userProfileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userPanel?.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    userPanel?.classList.remove('show');
  });

  // Reset Studio Data (Restores initial state cleanly)
  document.getElementById('btnResetStudioData')?.addEventListener('click', () => {
    if (confirm('Reset Studio data to defaults? Any custom portals, materials, or questions will be re-initialized.')) {
      localStorage.removeItem(STORAGE_KEYS.PORTALS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PORTAL);
      localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
      localStorage.removeItem(STORAGE_KEYS.METRICS);
      localStorage.removeItem(STORAGE_KEYS.QUIZ_DRAFT);
      localStorage.removeItem(STORAGE_KEYS.QUIZZES_PUBLISHED);
      localStorage.removeItem(STORAGE_KEYS.FORM_DRAFTS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_VIEW);
      window.location.reload();
    }
  });

  // Synchronize User & Role
  try {
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
    const savedRole = localStorage.getItem(STORAGE_KEYS.ROLE);

    if (!rawUser || !savedRole) {
      try { sessionStorage.setItem('blendify_redirect_target', 'create-course.html'); } catch (e) {}
      window.location.replace('login.html');
      return;
    }

    if (savedRole === 'student') {
      window.location.replace('index.html');
      return;
    }

    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.name) {
        const userNameEl = document.querySelector('#userProfileBtn .user-name');
        const userAvatarEl = document.querySelector('#userProfileBtn .user-avatar span');
        const panelNameEl = document.querySelector('.user-panel-name');
        const panelRoleEl = document.querySelector('.user-panel-role');

        if (userNameEl) userNameEl.textContent = user.name.split(' ')[0];
        if (userAvatarEl) userAvatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
        if (panelNameEl) panelNameEl.textContent = user.name;
        if (panelRoleEl) panelRoleEl.textContent = 'Instructor · Teacher & Admin Studio';
      }
    }
  } catch (e) {}

  function handleSignOutOrSwitch() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    window.location.href = 'login.html';
  }

  document.getElementById('btnSignOutAccount')?.addEventListener('click', handleSignOutOrSwitch);
  document.getElementById('btnSwitchAccountDropdown')?.addEventListener('click', handleSignOutOrSwitch);

  // =========================================================================
  // BOOTSTRAP: RESTORE ALL PROCESS DATA ON PAGE LOAD
  // =========================================================================
  renderPortalsGrid();
  setActivePortal(state.activePortal.tag, state.activePortal.name, state.activePortal.cohort);
  renderMaterialsTable();
  renderActivityTable();
  restoreQuizDraft();
  restoreFormDrafts();

  // Restore the exact panel view the instructor was working on
  if (state.activeView && panels[state.activeView]) {
    switchView(state.activeView);
  }

  updateAutoSaveIndicator('saved', 'All progress saved');

  console.log('[Blendify] Teacher & Administrator Studio initialized with full persistence.');
});
