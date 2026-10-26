/**
 * BLENDIFY LMS - Main Application Logic
 * Streamlined around 3 Core Student Pillars:
 * 1. Access Educational Learning Materials
 * 2. Participate in Classroom Workplaces via Links & Generated Tags
 * 3. Blipp — Unified AI Learning Companion (Powered by Google Gemini)
 */

import {
  getGeminiApiKey,
  saveGeminiApiKey,
  hasGeminiApiKey,
  getGeminiModel,
  saveGeminiModel,
  callGeminiAPI,
  testGeminiConnection,
  formatMarkdown,
  DEFAULT_MODEL
} from './gemini.js';

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // STATE MANAGEMENT (PERSISTENT ACROSS SESSIONS)
  // =========================================================================
  const DEFAULT_CHAT_HISTORY = {
    blipp: [
      {
        sender: 'agent',
        text: "Hello Harsh! I'm **Blipp**, your all-in-one AI learning companion on **Blendify**. I combine UI/UX design architecture, responsive Webflow/CSS code, and conceptual coaching into one seamless mentor powered by Google Gemini.\n\nWhether you want to break down Figma auto-layout constraints, write clean responsive CSS, or test your retention with custom quizzes, what would you like to explore today?"
      }
    ]
  };

  function getStoredProgress() {
    try {
      const raw = localStorage.getItem('blendify_student_progress');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { completedMaterials: 9, isMaterialCompleted: false };
  }

  function saveProgress(prog) {
    try {
      localStorage.setItem('blendify_student_progress', JSON.stringify(prog));
    } catch(e) {}
  }

  function getStoredChatHistory() {
    try {
      const raw = localStorage.getItem('blendify_ai_chat_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.blipp && Array.isArray(parsed.blipp)) {
          return parsed;
        }
        // If user had legacy personas (alex, kavita, socrates), migrate cleanly
        if (parsed && (parsed.alex || parsed.kavita || parsed.socrates)) {
          return DEFAULT_CHAT_HISTORY;
        }
      }
    } catch(e) {}
    return DEFAULT_CHAT_HISTORY;
  }

  function saveChatHistory(history) {
    try {
      localStorage.setItem('blendify_ai_chat_history', JSON.stringify(history));
    } catch(e) {}
  }

  const initialProg = getStoredProgress();
  const initialChat = getStoredChatHistory();
  const initialStudentView = (function() {
    try {
      return localStorage.getItem('blendify_student_active_view') || 'home';
    } catch(e) { return 'home'; }
  })();

  const state = {
    activeView: initialStudentView,
    activeTag: '#PORTAL-FIGMA-101',
    activePortalName: 'UI/UX Cohort 4 — Webflow Breakpoints Lab',
    completedMaterials: initialProg.completedMaterials || 9,
    totalMaterials: 20,
    isMaterialCompleted: !!initialProg.isMaterialCompleted,
    activeFocus: 'all',
    activePersona: 'blipp',
    chatHistory: initialChat
  };

  // Toast System
  const CHECK_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const toastContainer = document.getElementById('toastContainer');
  function showToast(message, icon = CHECK_SVG) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon-box">${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // =========================================================================
  // NAVIGATION & VIEW ROUTING (HOME, WORKPLACES, MATERIALS, AI AGENT)
  // =========================================================================
  const viewHome = document.getElementById('viewHome');
  const viewWorkplaces = document.getElementById('viewWorkplaces');
  const viewMaterials = document.getElementById('viewMaterials');
  const viewAIAgent = document.getElementById('viewAIAgent');

  const views = {
    home: { section: viewHome },
    workplaces: { section: viewWorkplaces },
    materials: { section: viewMaterials },
    'ai-agent': { section: viewAIAgent }
  };

  function switchView(viewName) {
    state.activeView = viewName;
    try {
      localStorage.setItem('blendify_student_active_view', viewName);
    } catch (e) {}

    // Toggle active state across all nav links (in top header & mobile drawer)
    document.querySelectorAll('.nav-link').forEach(link => {
      const isTarget = link.getAttribute('data-view') === viewName;
      link.classList.toggle('active', isTarget);
    });

    // Toggle section visibility
    Object.keys(views).forEach(key => {
      views[key].section?.classList.toggle('view-hidden', key !== viewName);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
  }

  // Attach listener to all navigation links (header and mobile drawer)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      if (view) switchView(view);
    });
  });

  document.getElementById('brandLogo')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('home');
  });

  document.getElementById('drawerBrandLogo')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('home');
  });

  document.getElementById('btnHomeToPortals')?.addEventListener('click', () => switchView('workplaces'));
  document.getElementById('btnOpenClassroomAction')?.addEventListener('click', () => switchView('workplaces'));
  document.getElementById('btnBackToPortals')?.addEventListener('click', () => switchView('workplaces'));
  document.getElementById('btnNewClassWorkspace')?.addEventListener('click', () => {
    switchView('workplaces');
    const input = document.getElementById('portalTagInput');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });


  // =========================================================================
  // PILLAR 1: LEARNING MATERIALS INTERACTIONS
  // =========================================================================
  // Tabs within materials
  const matTabButtons = document.querySelectorAll('#viewMaterials .tab-btn');
  const matTabPanels = document.querySelectorAll('#viewMaterials .tab-panel');

  matTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      matTabButtons.forEach(b => b.classList.toggle('active', b === btn));
      matTabPanels.forEach(p => p.classList.toggle('active', p.id === `panel-${targetTab}`));
    });
  });

  // Accordion Expand/Collapse
  const accordionItems = document.querySelectorAll('#syllabusAccordion .accordion-item');
  accordionItems.forEach(item => {
    item.querySelector('.accordion-trigger')?.addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });

  const btnExpandAll = document.getElementById('btnExpandAllModules');
  if (btnExpandAll) {
    let allOpen = false;
    btnExpandAll.addEventListener('click', () => {
      allOpen = !allOpen;
      accordionItems.forEach(item => item.classList.toggle('open', allOpen));
      btnExpandAll.textContent = allOpen ? 'Collapse All' : 'Expand All';
    });
  }

  // Progress Tracker Toggle
  const btnMarkComplete = document.getElementById('btnMarkComplete');
  const markCompleteText = document.getElementById('markCompleteText');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentage = document.getElementById('progressPercentage');

  function updateMaterialsProgressUI() {
    const percent = Math.round((state.completedMaterials / state.totalMaterials) * 100);
    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
    if (progressPercentage) {
      progressPercentage.textContent = `${percent}% Completed (${state.completedMaterials} of ${state.totalMaterials} Studied)`;
    }
  }

  if (btnMarkComplete) {
    if (state.isMaterialCompleted) {
      btnMarkComplete.classList.add('completed-state');
      if (markCompleteText) markCompleteText.textContent = 'Material Studied';
    }
    updateMaterialsProgressUI();

    btnMarkComplete.addEventListener('click', () => {
      state.isMaterialCompleted = !state.isMaterialCompleted;
      if (state.isMaterialCompleted) {
        state.completedMaterials = Math.min(state.totalMaterials, state.completedMaterials + 1);
        btnMarkComplete.classList.add('completed-state');
        markCompleteText.textContent = 'Material Studied';
        showToast('Module 2.2 marked as completed! (+5% progress)');
      } else {
        state.completedMaterials = Math.max(0, state.completedMaterials - 1);
        btnMarkComplete.classList.remove('completed-state');
        markCompleteText.textContent = 'Mark Completed';
        showToast('Material status reverted.');
      }
      saveProgress({ completedMaterials: state.completedMaterials, isMaterialCompleted: state.isMaterialCompleted });
      updateMaterialsProgressUI();
    });
  }

  // Device Simulator in Materials
  const viewportButtons = document.querySelectorAll('.viewport-btn');
  const deviceFrame = document.getElementById('deviceFrame');
  const viewportSizeLabel = document.getElementById('viewportSizeLabel');

  const viewportSizes = {
    desktop: '1440 × 900 (Desktop Canvas)',
    tablet: '768 × 1024 (iPad Portrait)',
    mobile: '375 × 812 (iPhone 13)'
  };

  viewportButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      viewportButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const device = btn.dataset.device;
      deviceFrame.className = `simulated-device-frame ${device}`;
      viewportSizeLabel.textContent = viewportSizes[device] || '';
    });
  });

  // Download Action Triggers
  document.querySelectorAll('.download-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const name = trigger.dataset.name || 'Learning Asset';
      showToast(`Downloading educational resource: ${name}...`);
    });
  });

  document.getElementById('btnDownloadAssets')?.addEventListener('click', () => {
    showToast('Downloading Figma Starter Pack & Webflow Tokens (34.2 MB)...');
  });

  document.getElementById('btnReadMaterial')?.addEventListener('click', () => {
    showToast('Opening interactive study guide in reading mode...');
    document.querySelector('#viewMaterials .tabs-container')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btnResumeLearningAction')?.addEventListener('click', () => {
    showToast('Resuming active curriculum from Module 2...');
    document.getElementById('learningWorkspace')?.scrollIntoView({ behavior: 'smooth' });
  });

  // =========================================================================
  // FILE DOWNLOADS SECTION (LIVE DOWNLOADING TO COMPUTER)
  // =========================================================================
  const downloadFilesList = document.getElementById('downloadFilesList');
  const downloadCountBadge = document.getElementById('downloadCountBadge');
  const btnDownloadAllFiles = document.getElementById('btnDownloadAllFiles');

  const DOWNLOADABLE_FILES = [
    {
      id: 'file-guide-pdf',
      name: 'Fluid Breakpoints & Grid Guide',
      ext: 'PDF',
      pillClass: 'pill-pdf',
      iconClass: 'file-pdf',
      size: '4.8 MB',
      speed: '2.8 MB/s',
      status: 'ready', // 'ready', 'downloading', 'completed'
      progress: 0,
      filename: 'Blendify-Fluid-Breakpoints-Guide.pdf',
      mime: 'application/pdf',
      iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
      content: '%PDF-1.4\n1 0 obj\n<< /Title (Blendify LMS: Fluid Breakpoints & Layout Constraints Guide) /Author (Blendify Academy) >>\nendobj\nBlendify Educational Curriculum: Fluid Breakpoints, Responsive Design Hierarchy, CSS Locks, and Constraint Solving Guide.'
    },
    {
      id: 'file-starter-fig',
      name: 'Responsive Design Starter Pack',
      ext: '.FIG',
      pillClass: 'pill-figma',
      iconClass: 'file-figma',
      size: '34.2 MB',
      speed: '4.5 MB/s',
      status: 'ready',
      progress: 0,
      filename: 'Blendify-Responsive-Design-Starter-Pack.fig',
      mime: 'application/octet-stream',
      iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2a4 4 0 0 0-4 4v4h4a4 4 0 0 0 0-8z"></path><path d="M12 10H8a4 4 0 0 0 0 8h4v-8z"></path><path d="M12 10h4a4 4 0 0 0 0-8h-4v8z"></path><path d="M12 18H8a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4h-4v4z"></path></svg>`,
      content: 'Figma-Document-Bundle: Blendify Responsive UI Components, 1440px Desktop, 768px Tablet, 390px Mobile auto-layout frames and spatial rem design tokens.'
    },
    {
      id: 'file-stylesheet-css',
      name: 'Fluid Breakpoints Stylesheet',
      ext: '.CSS',
      pillClass: 'pill-code',
      iconClass: 'file-code',
      size: '184 KB',
      speed: '1.4 MB/s',
      status: 'ready',
      progress: 0,
      filename: 'fluid-breakpoints.css',
      mime: 'text/css',
      iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
      content: `/* ==========================================================================\n   BLENDIFY LMS: Fluid Breakpoints & CSS Architecture Tokens\n   ========================================================================== */\n:root {\n  --bp-mobile: 390px;\n  --bp-tablet: 768px;\n  --bp-desktop: 1440px;\n  --fluid-font-hero: clamp(2rem, 5vw + 1rem, 3.5rem);\n  --fluid-font-body: clamp(0.95rem, 1.2vw + 0.5rem, 1.15rem);\n  --container-max: 1280px;\n}\n\n@media (min-width: 768px) {\n  .grid-responsive {\n    display: grid;\n    grid-template-columns: repeat(2, 1fr);\n    gap: 24px;\n  }\n}\n\n@media (min-width: 1440px) {\n  .grid-responsive {\n    grid-template-columns: repeat(3, 1fr);\n    gap: 32px;\n  }\n}\n`
    },
    {
      id: 'file-hierarchy-notes',
      name: 'Visual Hierarchy & Scales',
      ext: 'NOTES',
      pillClass: 'pill-notes',
      iconClass: 'file-notes',
      size: '1.2 MB',
      speed: '2.1 MB/s',
      status: 'ready',
      progress: 0,
      filename: 'Visual-Hierarchy-and-Scales-Guide.txt',
      mime: 'text/plain',
      iconSvg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
      content: `BLENDIFY EDUCATIONAL LMS: VISUAL HIERARCHY & SCALES STUDY NOTES\n\n1. Type Scales (Major Third - 1.250):\n   - Display: 48px\n   - H1: 38px\n   - H2: 30px\n   - H3: 24px\n   - Body: 16px\n   - Small: 13px\n\n2. Spatial 8-point Rhythm:\n   - 4px, 8px, 16px, 24px, 32px, 48px, 64px.\n\n3. Contrast Requirements:\n   - Body Text: 4.5:1 WCAG AA minimum\n   - Large Display: 3:1 WCAG AA minimum\n`
    }
  ];

  // Render downloading files list
  function renderDownloadFiles() {
    if (!downloadFilesList) return;

    const completedCount = DOWNLOADABLE_FILES.filter(f => f.status === 'completed').length;
    if (downloadCountBadge) {
      downloadCountBadge.textContent = completedCount > 0 ? `${completedCount}/4 Saved` : '4 Files';
    }

    downloadFilesList.innerHTML = DOWNLOADABLE_FILES.map(file => {
      const isDownloading = file.status === 'downloading';
      const isDone = file.status === 'completed';

      let statusLabel = 'Click to download';
      if (isDownloading) statusLabel = `${file.progress}% · Downloading...`;
      if (isDone) statusLabel = 'Saved to computer';

      return `
        <div class="download-file-item ${isDownloading ? 'is-downloading' : ''} ${isDone ? 'is-completed' : ''}" data-id="${file.id}">
          <div class="download-item-main">
            <div class="file-icon-box ${file.iconClass}">
              ${file.iconSvg}
            </div>
            <div class="download-item-info">
              <div class="download-item-name-row">
                <span class="download-file-name" title="${file.name}">${file.name}</span>
              </div>
              <div class="download-meta-row">
                <span class="file-type-pill ${file.pillClass}">${file.ext}</span>
                <span class="file-dot">•</span>
                <span class="download-size-text">${file.size}</span>
                <span class="file-dot">•</span>
                <span class="download-status-text ${isDone ? 'status-saved' : ''} ${isDownloading ? 'status-active' : ''}" id="status-text-${file.id}">
                  ${statusLabel}
                </span>
              </div>
            </div>

            <button type="button" class="btn-download-action ${isDone ? 'btn-download-done' : ''}" data-action="download-file" data-id="${file.id}" title="${isDone ? 'Download Again to Computer' : 'Download to Computer'}">
              ${isDownloading ? `
                <span class="download-spinner"></span>
              ` : (isDone ? `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ` : `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              `)}
            </button>
          </div>

          <!-- Real-time Progress Bar -->
          <div class="download-progress-container ${isDownloading ? 'show-progress' : ''}" id="progress-container-${file.id}">
            <div class="download-progress-bar">
              <div class="download-progress-fill" id="progress-fill-${file.id}" style="width: ${file.progress}%"></div>
            </div>
            <div class="download-live-stats">
              <span id="progress-stat-${file.id}">${file.progress}% · Saving to disk</span>
              <span>${file.speed}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Actual Browser File Saver: Creates Blob and triggers computer download
  function triggerRealComputerDownload(file) {
    try {
      const blob = new Blob([file.content], { type: file.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 800);
    } catch (e) {
      console.error('Download error:', e);
    }
  }

  // Start animated download with live percentage and computer file save
  function startFileDownload(fileId, callback = null) {
    const file = DOWNLOADABLE_FILES.find(f => f.id === fileId);
    if (!file) return;
    if (file.status === 'downloading') return;

    file.status = 'downloading';
    file.progress = 5;
    renderDownloadFiles();
    showToast(`Downloading "${file.name}" into your computer...`);

    const fillEl = document.getElementById(`progress-fill-${file.id}`);
    const statEl = document.getElementById(`progress-stat-${file.id}`);
    const statusTextEl = document.getElementById(`status-text-${file.id}`);

    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 18) + 12;
      if (currentProgress > 95) currentProgress = 95;

      file.progress = currentProgress;
      if (fillEl) fillEl.style.width = `${currentProgress}%`;
      if (statEl) statEl.textContent = `${currentProgress}% · Saving to disk`;
      if (statusTextEl) statusTextEl.textContent = `${currentProgress}% · Downloading...`;

      if (currentProgress >= 95) {
        clearInterval(interval);
        setTimeout(() => {
          file.progress = 100;
          file.status = 'completed';
          renderDownloadFiles();

          // Actually download the file to the user's computer
          triggerRealComputerDownload(file);
          showToast(`✓ Downloaded "${file.filename}" to your computer!`);

          if (callback) callback();
        }, 400);
      }
    }, 160);
  }

  // Initial render of download files list
  renderDownloadFiles();

  // Click on a file or download button to start downloading
  downloadFilesList?.addEventListener('click', (e) => {
    const item = e.target.closest('.download-file-item');
    if (!item) return;
    const fileId = item.dataset.id;
    startFileDownload(fileId);
  });

  // Download All Files Button
  btnDownloadAllFiles?.addEventListener('click', () => {
    showToast('Downloading all 4 curriculum assets into your computer...');
    let index = 0;
    function downloadNext() {
      if (index < DOWNLOADABLE_FILES.length) {
        const file = DOWNLOADABLE_FILES[index];
        index++;
        startFileDownload(file.id, downloadNext);
      } else {
        showToast('✓ All curriculum assets downloaded to your computer!');
      }
    }
    downloadNext();
  });

  // Hook curriculum download triggers to start download in the widget
  document.querySelectorAll('.download-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const name = trigger.dataset.name || '';
      if (name.includes('Figma') || name.includes('Starter Pack')) {
        startFileDownload('file-starter-fig');
      } else if (name.includes('CSS') || name.includes('Stylesheet')) {
        startFileDownload('file-stylesheet-css');
      } else {
        startFileDownload('file-guide-pdf');
      }
    });
  });

  document.getElementById('btnDownloadAssets')?.addEventListener('click', () => {
    startFileDownload('file-starter-fig');
    setTimeout(() => startFileDownload('file-stylesheet-css'), 500);
  });

  // =========================================================================
  // NEW CLASS? WORKSPACE ACTION BUTTON (JOIN ONLY)
  // Directs student to the Student Classroom Workplace to join with a tag
  // =========================================================================
  const btnNewClassWorkspace = document.getElementById('btnNewClassWorkspace');
  if (btnNewClassWorkspace) {
    btnNewClassWorkspace.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Opening Classroom Workplace to enter portal tag...');
      switchView('workplaces');

      setTimeout(() => {
        const portalInput = document.getElementById('portalTagInput');
        if (portalInput) {
          portalInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          portalInput.focus();
          portalInput.classList.add('highlight-focus');
          setTimeout(() => portalInput.classList.remove('highlight-focus'), 1600);
        }
      }, 300);
    });
  }

  document.getElementById('btnAskAIAboutLesson')?.addEventListener('click', () => {
    switchView('ai-agent');
    sendAIMessage("Can you explain how Auto-Layout in Module 2 converts to Webflow flexbox?");
  });

  document.getElementById('btnShareToClassroom')?.addEventListener('click', () => {
    switchView('workplaces');
    showToast('Shared Module 2 learning material to your active classroom feed!');
  });

  // =========================================================================
  // COMMUNITY LEARNING MATERIALS (USER UPLOADS & SEARCH)
  // =========================================================================
  const searchCommunityMaterialsInput = document.getElementById('searchCommunityMaterialsInput');
  const btnClearMaterialSearch = document.getElementById('btnClearMaterialSearch');
  const btnConfirmMaterialSearch = document.getElementById('btnConfirmMaterialSearch');
  const materialsCategoryPills = document.getElementById('materialsCategoryPills');
  const communityUploadsGrid = document.getElementById('communityUploadsGrid');
  const searchResultsCounter = document.getElementById('searchResultsCounter');
  const totalUploadsCount = document.getElementById('totalUploadsCount');
  const emptyMaterialsState = document.getElementById('emptyMaterialsState');
  const btnResetMaterialSearch = document.getElementById('btnResetMaterialSearch');

  // Search error popup modal elements
  const searchErrorModal = document.getElementById('searchErrorModal');
  const modalCloseSearchError = document.getElementById('modalCloseSearchError');
  const btnDismissSearchError = document.getElementById('btnDismissSearchError');

  // Upload modal elements
  const uploadMaterialModal = document.getElementById('uploadMaterialModal');
  const btnOpenUploadModal = document.getElementById('btnOpenUploadModal');
  const modalCloseUploadMaterial = document.getElementById('modalCloseUploadMaterial');
  const btnCancelUploadMaterial = document.getElementById('btnCancelUploadMaterial');
  const formUploadMaterial = document.getElementById('formUploadMaterial');
  const uploadTitleInput = document.getElementById('uploadTitleInput');
  const uploadCategorySelect = document.getElementById('uploadCategorySelect');
  const uploadAuthorInput = document.getElementById('uploadAuthorInput');
  const uploadDescInput = document.getElementById('uploadDescInput');
  const materialFileInput = document.getElementById('materialFileInput');
  const materialDropzone = document.getElementById('materialDropzone');
  const dropzoneText = document.getElementById('dropzoneText');

  let selectedUserFile = null;
  let activeMaterialCategory = 'all';
  let activeMaterialSearchQuery = '';

  const DEFAULT_COMMUNITY_MATERIALS = [
    {
      id: 'comm-mat-1',
      title: 'Figma Responsive Wireframe Starter Kit v2.4',
      desc: 'Complete auto-layout wireframing component system, responsive 1440px/768px/375px frames, and 8pt spatial tokens.',
      category: 'ui-ux',
      categoryLabel: 'UI/UX & Figma',
      ext: 'FIG',
      size: '34.2 MB',
      downloads: 1420,
      author: 'Elena Rostova',
      authorRole: 'UI Lead',
      time: '2 days ago',
      filename: 'Figma-Wireframe-Starter-v2.4.fig',
      content: 'Figma Document Bundle: Blendify UI Wireframe Kit v2.4 with auto-layout constraints and tokens.'
    },
    {
      id: 'comm-mat-2',
      title: 'Webflow Fluid Breakpoints & CSS Flexbox Guide',
      desc: 'Detailed conversion formulas translating strict desktop mockups into fluid CSS Grid and Webflow container rules.',
      category: 'webflow',
      categoryLabel: 'Webflow & CSS',
      ext: 'PDF',
      size: '4.8 MB',
      downloads: 2890,
      author: 'Kavita Patel',
      authorRole: 'Frontend Systems',
      time: '3 days ago',
      filename: 'Webflow-Fluid-Breakpoints-Guide.pdf',
      content: '%PDF-1.4\nBlendify Webflow Fluid Breakpoints and CSS flexbox formula reference sheet.'
    },
    {
      id: 'comm-mat-3',
      title: 'Design Token Architecture & Spacing Formulas',
      desc: 'Formulas for rem spacing scales, modular typography clamping, and CSS variable architecture for teams.',
      category: 'guides',
      categoryLabel: 'Study Guides',
      ext: 'PDF',
      size: '1.2 MB',
      downloads: 940,
      author: 'Harsh Vardhan',
      authorRole: 'Student Pro',
      time: '5 days ago',
      filename: 'Design-Token-Architecture-Notes.pdf',
      content: '%PDF-1.4\nBlendify Design Token Architecture: Spacing tokens, color aliases, and rem clamp formulas.'
    },
    {
      id: 'comm-mat-4',
      title: 'Modern CSS Grid & Flexbox Quick Cheat Sheet',
      desc: 'Visual reference sheet showing layout behavior for grid-template-areas, minmax(), justify-content, and align-items.',
      category: 'cheatsheets',
      categoryLabel: 'Cheat Sheets',
      ext: 'PDF',
      size: '850 KB',
      downloads: 3150,
      author: 'Alex Rivera',
      authorRole: 'Design Mentor',
      time: '1 week ago',
      filename: 'CSS-Grid-Flexbox-Cheatsheet.pdf',
      content: '%PDF-1.4\nBlendify CSS Grid and Flexbox Visual Cheatsheet with syntax examples.'
    },
    {
      id: 'comm-mat-5',
      title: 'Accessible Web Typography Scales & Rem Units',
      desc: 'Pre-calculated fluid clamp() type scales, WCAG 2.1 AA contrast pairings, and responsive reading rhythm tokens.',
      category: 'guides',
      categoryLabel: 'Study Guides',
      ext: 'ZIP',
      size: '2.1 MB',
      downloads: 810,
      author: 'Marcus Chen',
      authorRole: 'A11y Advocate',
      time: '1 week ago',
      filename: 'Accessible-Typography-Scales.zip',
      content: 'Blendify Archive: Accessible typography scales, font pairings, and CSS clamp() calculation tables.'
    },
    {
      id: 'comm-mat-6',
      title: 'React Component State & Hook Patterns Pack',
      desc: 'Clean reusable hooks for local storage sync, media queries, keyboard navigation, and debounced search filters.',
      category: 'code',
      categoryLabel: 'Code & Repos',
      ext: 'CODE',
      size: '3.5 MB',
      downloads: 1220,
      author: 'Kavita Patel',
      authorRole: 'Frontend Systems',
      time: '2 weeks ago',
      filename: 'React-Custom-Hooks-Pack.zip',
      content: 'Blendify Code Package: Production ready React hooks for state sync, search debouncing, and keyboard listeners.'
    }
  ];

  function getStoredCommunityMaterials() {
    try {
      const stored = localStorage.getItem('blendify_community_materials');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    try {
      localStorage.setItem('blendify_community_materials', JSON.stringify(DEFAULT_COMMUNITY_MATERIALS));
    } catch (e) {}
    return DEFAULT_COMMUNITY_MATERIALS;
  }

  function saveCommunityMaterials(list) {
    try {
      localStorage.setItem('blendify_community_materials', JSON.stringify(list));
    } catch (e) {}
  }

  let communityMaterials = getStoredCommunityMaterials();

  function renderCommunityMaterials(query = '', category = 'all') {
    if (!communityUploadsGrid) return;

    const q = query.trim().toLowerCase();
    const filtered = communityMaterials.filter(mat => {
      const matchCat = category === 'all' || mat.category === category;
      const matchQuery = !q ||
        mat.title.toLowerCase().includes(q) ||
        mat.desc.toLowerCase().includes(q) ||
        mat.author.toLowerCase().includes(q) ||
        mat.categoryLabel.toLowerCase().includes(q) ||
        mat.ext.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });

    if (totalUploadsCount) {
      totalUploadsCount.textContent = communityMaterials.length;
    }

    if (searchResultsCounter) {
      if (q || category !== 'all') {
        searchResultsCounter.textContent = `${filtered.length} Material${filtered.length === 1 ? '' : 's'} Found`;
      } else {
        searchResultsCounter.textContent = `${communityMaterials.length} Materials Available`;
      }
    }

    if (emptyMaterialsState) {
      emptyMaterialsState.style.display = filtered.length === 0 ? 'flex' : 'none';
    }

    communityUploadsGrid.innerHTML = filtered.map(mat => {
      const extClass = mat.ext.toLowerCase().replace('.', '');
      const initial = mat.author ? mat.author.charAt(0).toUpperCase() : 'U';

      return `
        <div class="community-upload-card" data-id="${mat.id}">
          <div class="upload-card-top">
            <span class="file-ext-badge ${extClass}">.${mat.ext}</span>
            <div class="card-downloads-count">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>${(mat.downloads || 0).toLocaleString()} downloads</span>
            </div>
          </div>

          <div class="upload-card-content">
            <h4 class="upload-card-title">${mat.title}</h4>
            <p class="upload-card-desc">${mat.desc}</p>
          </div>

          <div class="upload-card-author-row">
            <div class="author-mini-avatar">${initial}</div>
            <div class="author-meta-info">
              <span class="author-name-text">${mat.author}</span>
              <span class="author-sub-text">${mat.authorRole || 'Community Contributor'} · ${mat.time || 'Recently'}</span>
            </div>
          </div>

          <div class="upload-card-actions-bar">
            <span class="card-file-size">${mat.size || '1.5 MB'}</span>
            <button type="button" class="btn-card-download" data-action="download-community-file" data-id="${mat.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function downloadCommunityMaterial(mat) {
    showToast(`Downloading "${mat.title}" (${mat.size})...`);
    try {
      const mimeTypes = {
        pdf: 'application/pdf',
        fig: 'application/octet-stream',
        zip: 'application/zip',
        css: 'text/css',
        js: 'text/javascript'
      };
      const ext = mat.ext.toLowerCase().replace('.', '');
      const mime = mimeTypes[ext] || 'application/octet-stream';
      const content = mat.content || `${mat.title}\nUploaded by: ${mat.author}\nCategory: ${mat.categoryLabel || mat.category}\n\nBlendify Educational Community Material\nDescription: ${mat.desc}`;
      const filename = mat.filename || `${mat.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.${ext}`;

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 800);

      mat.downloads = (mat.downloads || 0) + 1;
      saveCommunityMaterials(communityMaterials);
      renderCommunityMaterials(activeMaterialSearchQuery, activeMaterialCategory);
      showToast(`Saved "${filename}" directly to your computer!`);
    } catch (e) {
      console.error('Community download error:', e);
    }
  }

  // Handle download click in grid
  communityUploadsGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="download-community-file"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const mat = communityMaterials.find(m => m.id === id);
    if (mat) {
      downloadCommunityMaterial(mat);
    }
  });

  // =========================================================================
  // SEARCH CONFIRMATION & ERROR POPUP SCREEN LOGIC
  // =========================================================================
  function showSearchErrorModal() {
    searchErrorModal?.classList.add('open');
  }

  function closeSearchErrorModal() {
    searchErrorModal?.classList.remove('open');
  }

  function performCommunitySearch() {
    const rawQuery = searchCommunityMaterialsInput?.value || '';
    const query = rawQuery.trim();
    activeMaterialSearchQuery = query;

    if (btnClearMaterialSearch) {
      btnClearMaterialSearch.style.display = query ? 'flex' : 'none';
    }

    const q = query.toLowerCase();
    const matchingResults = communityMaterials.filter(mat => {
      const matchCat = activeMaterialCategory === 'all' || mat.category === activeMaterialCategory;
      const matchQuery = !q ||
        mat.title.toLowerCase().includes(q) ||
        mat.desc.toLowerCase().includes(q) ||
        mat.author.toLowerCase().includes(q) ||
        mat.categoryLabel.toLowerCase().includes(q) ||
        mat.ext.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });

    // Explicit User Flow:
    // if the search is match then show the matching results
    // else show a little pop up screen error
    if (matchingResults.length > 0) {
      renderCommunityMaterials(query, activeMaterialCategory);
      document.getElementById('userMaterialsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (query) {
        showToast(`Found ${matchingResults.length} matching learning material${matchingResults.length === 1 ? '' : 's'}`);
      }
    } else {
      showSearchErrorModal(query || 'No keywords entered');
    }
  }

  // Confirm search on button click
  btnConfirmMaterialSearch?.addEventListener('click', (e) => {
    e.preventDefault();
    performCommunitySearch();
  });

  // Confirm search on Enter in input field
  searchCommunityMaterialsInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performCommunitySearch();
    }
  });

  // Manage clear button state; reset to full list if input emptied
  searchCommunityMaterialsInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (btnClearMaterialSearch) {
      btnClearMaterialSearch.style.display = val ? 'flex' : 'none';
    }
    if (!val.trim() && activeMaterialSearchQuery) {
      activeMaterialSearchQuery = '';
      renderCommunityMaterials('', activeMaterialCategory);
    }
  });

  btnClearMaterialSearch?.addEventListener('click', () => {
    if (searchCommunityMaterialsInput) searchCommunityMaterialsInput.value = '';
    activeMaterialSearchQuery = '';
    if (btnClearMaterialSearch) btnClearMaterialSearch.style.display = 'none';
    renderCommunityMaterials('', activeMaterialCategory);
    searchCommunityMaterialsInput?.focus();
  });

  btnResetMaterialSearch?.addEventListener('click', () => {
    if (searchCommunityMaterialsInput) searchCommunityMaterialsInput.value = '';
    activeMaterialSearchQuery = '';
    if (btnClearMaterialSearch) btnClearMaterialSearch.style.display = 'none';
    activeMaterialCategory = 'all';
    materialsCategoryPills?.querySelectorAll('.cat-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === 'all');
    });
    renderCommunityMaterials('', 'all');
  });

  // Search error modal close & action listeners
  modalCloseSearchError?.addEventListener('click', closeSearchErrorModal);

  btnDismissSearchError?.addEventListener('click', () => {
    closeSearchErrorModal();
    searchCommunityMaterialsInput?.focus();
    searchCommunityMaterialsInput?.select();
  });

  searchErrorModal?.addEventListener('click', (e) => {
    if (e.target === searchErrorModal) {
      closeSearchErrorModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchErrorModal?.classList.contains('open')) {
      closeSearchErrorModal();
    }
  });

  // Category filter pills
  materialsCategoryPills?.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    materialsCategoryPills.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeMaterialCategory = pill.dataset.category || 'all';
    renderCommunityMaterials(activeMaterialSearchQuery, activeMaterialCategory);
  });

  // Modal: Upload Learning Material
  btnOpenUploadModal?.addEventListener('click', () => {
    uploadMaterialModal?.classList.add('open');
    uploadTitleInput?.focus();
  });

  function closeUploadModal() {
    uploadMaterialModal?.classList.remove('open');
    if (formUploadMaterial) formUploadMaterial.reset();
    selectedUserFile = null;
    if (dropzoneText) {
      dropzoneText.innerHTML = 'Drag &amp; drop file here, or <span class="dropzone-browse">browse computer</span>';
    }
  }

  modalCloseUploadMaterial?.addEventListener('click', closeUploadModal);
  btnCancelUploadMaterial?.addEventListener('click', closeUploadModal);

  // File Dropzone handling
  materialFileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      selectedUserFile = e.target.files[0];
      if (dropzoneText) {
        dropzoneText.innerHTML = `Attached: <strong>${selectedUserFile.name}</strong> (${(selectedUserFile.size / (1024 * 1024)).toFixed(1)} MB)`;
      }
      if (uploadTitleInput && !uploadTitleInput.value) {
        uploadTitleInput.value = selectedUserFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
    }
  });

  materialDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    materialDropzone.classList.add('dragover');
  });

  materialDropzone?.addEventListener('dragleave', () => {
    materialDropzone.classList.remove('dragover');
  });

  materialDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    materialDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectedUserFile = e.dataTransfer.files[0];
      if (dropzoneText) {
        dropzoneText.innerHTML = `Attached: <strong>${selectedUserFile.name}</strong> (${(selectedUserFile.size / (1024 * 1024)).toFixed(1)} MB)`;
      }
      if (uploadTitleInput && !uploadTitleInput.value) {
        uploadTitleInput.value = selectedUserFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
    }
  });

  // Form submit: Publish Material
  formUploadMaterial?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = uploadTitleInput?.value.trim();
    if (!title) {
      showToast('Please enter a Material Title.');
      uploadTitleInput?.focus();
      return;
    }

    const category = uploadCategorySelect?.value || 'ui-ux';
    const author = uploadAuthorInput?.value.trim() || 'Harsh Vardhan';
    const desc = uploadDescInput?.value.trim() || 'Helpful community study notes and learning guide uploaded by student.';
    
    let ext = 'PDF';
    let size = '2.4 MB';
    let filename = `${title.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    let content = `Blendify Community Upload: ${title}\nAuthor: ${author}\nCategory: ${category}\n\n${desc}`;

    if (selectedUserFile) {
      const parts = selectedUserFile.name.split('.');
      if (parts.length > 1) {
        ext = parts.pop().toUpperCase();
      }
      size = `${(selectedUserFile.size / (1024 * 1024)).toFixed(1)} MB`;
      filename = selectedUserFile.name;
    } else {
      if (category === 'ui-ux') ext = 'FIG';
      else if (category === 'code') ext = 'ZIP';
      else if (category === 'webflow') ext = 'PDF';
    }

    const categoryLabels = {
      'ui-ux': 'UI/UX & Figma',
      'webflow': 'Webflow & CSS',
      'guides': 'Study Guides',
      'cheatsheets': 'Cheat Sheets',
      'code': 'Code & Repos'
    };

    const newMaterial = {
      id: `user-mat-${Date.now()}`,
      title,
      desc,
      category,
      categoryLabel: categoryLabels[category] || 'Community Resource',
      ext,
      size,
      downloads: 1,
      author,
      authorRole: 'Community Contributor',
      time: 'Just now',
      filename,
      content
    };

    communityMaterials.unshift(newMaterial);
    saveCommunityMaterials(communityMaterials);
    renderCommunityMaterials(activeMaterialSearchQuery, activeMaterialCategory);
    closeUploadModal();
    showToast(`Published "${title}" to Community Learning Materials!`);
  });

  // Initial render of community materials
  renderCommunityMaterials();

  // =========================================================================
  // PILLAR 2: CLASSROOM WORKPLACES & JOINED CLASS PORTALS
  // =========================================================================
  const activeTagBadge = document.getElementById('activeTagBadge');
  const currentShareLink = document.getElementById('currentShareLink');
  const portalTagInput = document.getElementById('portalTagInput');
  const btnJoinPortalByTag = document.getElementById('btnJoinPortalByTag');
  const btnCopyPortalLink = document.getElementById('btnCopyPortalLink');
  const joinedPortalsList = document.getElementById('joinedPortalsList');
  const joinedPortalsCountBadge = document.getElementById('joinedPortalsCountBadge');
  const filterJoinedPortalsInput = document.getElementById('filterJoinedPortalsInput');

  // Initial catalog of default joined class portals
  const DEFAULT_JOINED_PORTALS = [
    {
      tag: '#PORTAL-FIGMA-101',
      name: 'UI/UX Cohort 4 — Webflow Breakpoints Lab',
      instructor: 'Vativa Hub',
      topic: 'UI/UX Design',
      schedule: 'Mon & Wed · 10:00 AM',
      learners: '18 Online · 24 Total',
      materialsCount: '12 Modules',
      progress: 75,
      accentColor: '#E11D48'
    },
    {
      tag: '#WEBFLOW-LAB-44',
      name: 'Interactive Webflow CMS & Animations Workshop',
      instructor: 'Elena Rostova',
      topic: 'Webflow & CMS',
      schedule: 'Tue & Thu · 2:00 PM',
      learners: '22 Enrolled · 3 Active',
      materialsCount: '8 Modules',
      progress: 50,
      accentColor: '#2563EB'
    },
    {
      tag: '#STUDY-ROOM-B',
      name: 'Peer Design Review & Token Architecture Room',
      instructor: 'Harsh Vardhan (Host)',
      topic: 'Design Systems',
      schedule: 'Fri · 4:00 PM',
      learners: '8 Enrolled · Open Discussion',
      materialsCount: '6 Modules',
      progress: 90,
      accentColor: '#D97706'
    },
    {
      tag: '#REACT-SYSTEMS-08',
      name: 'Frontend Systems & Next.js Architecture',
      instructor: 'Kavita Patel',
      topic: 'Web Systems',
      schedule: 'Sat · 1:00 PM',
      learners: '32 Enrolled · 6 Active',
      materialsCount: '15 Modules',
      progress: 35,
      accentColor: '#059669'
    }
  ];

  // Retrieve or initialize joined portals in localStorage
  function getStoredJoinedPortals() {
    try {
      const stored = localStorage.getItem('blendify_joined_portals');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    try {
      localStorage.setItem('blendify_joined_portals', JSON.stringify(DEFAULT_JOINED_PORTALS));
    } catch (e) {}
    return DEFAULT_JOINED_PORTALS;
  }

  function saveJoinedPortals(portals) {
    try {
      localStorage.setItem('blendify_joined_portals', JSON.stringify(portals));
    } catch (e) {}
  }

  let joinedPortals = getStoredJoinedPortals();

  // Render the column of different class portals joined
  function renderJoinedPortals(filterQuery = '') {
    if (!joinedPortalsList) return;

    const query = filterQuery.trim().toLowerCase();
    const filtered = query
      ? joinedPortals.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.tag.toLowerCase().includes(query) ||
          p.instructor.toLowerCase().includes(query) ||
          p.topic.toLowerCase().includes(query)
        )
      : joinedPortals;

    if (joinedPortalsCountBadge) {
      joinedPortalsCountBadge.textContent = `${joinedPortals.length} Classroom${joinedPortals.length === 1 ? '' : 's'} Enrolled`;
    }

    if (filtered.length === 0) {
      joinedPortalsList.innerHTML = `
        <div class="empty-portals-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted);margin-bottom:12px;display:inline-block;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h4>No class portals found</h4>
          <p>${query ? `No joined class portals matched "${query}". Try a different search.` : 'You have not joined any classroom portals yet. Enter a portal tag above to enroll.'}</p>
        </div>
      `;
      return;
    }

    joinedPortalsList.innerHTML = filtered.map(portal => {
      const isCurrent = portal.tag.toUpperCase() === state.activeTag.toUpperCase();
      const initial = portal.instructor ? portal.instructor.charAt(0).toUpperCase() : 'C';

      return `
        <div class="joined-portal-card ${isCurrent ? 'active-class-card' : ''}" data-tag="${portal.tag}">
          <div class="portal-card-top-stripe" style="background: ${portal.accentColor || 'var(--primary)'}"></div>
          <div class="portal-card-inner">
            <div class="portal-card-header">
              <div class="portal-card-badge-row">
                <span class="portal-topic-tag">${portal.topic || 'Classroom'}</span>
                ${isCurrent ? `
                  <span class="active-live-indicator">
                    <span class="pulse-dot"></span> Active Class
                  </span>
                ` : `
                  <span class="enrolled-status-pill">Enrolled</span>
                `}
              </div>
              <h4 class="portal-card-title">${portal.name}</h4>
              <div class="portal-card-instructor">
                <div class="instructor-avatar-mini">${initial}</div>
                <span>${portal.instructor || 'Blendify Faculty'}</span>
              </div>
            </div>

            <div class="portal-card-meta-box">
              <div class="portal-meta-item">
                <span class="meta-label">Portal Tag</span>
                <span class="meta-tag-code">${portal.tag}</span>
              </div>
              <div class="portal-meta-item">
                <span class="meta-label">Class Schedule</span>
                <span class="meta-value">${portal.schedule || 'Flexible'}</span>
              </div>
              <div class="portal-meta-item">
                <span class="meta-label">Learners</span>
                <span class="meta-value">${portal.learners || 'Active Cohort'}</span>
              </div>
              <div class="portal-meta-item">
                <span class="meta-label">Curriculum</span>
                <span class="meta-value">${portal.materialsCount || '10 Modules'}</span>
              </div>
            </div>

            <div class="portal-card-progress">
              <div class="portal-progress-labels">
                <span>Course Progression</span>
                <strong>${portal.progress || 60}%</strong>
              </div>
              <div class="portal-progress-track">
                <div class="portal-progress-fill" style="width: ${portal.progress || 60}%"></div>
              </div>
            </div>

            <div class="portal-card-actions">
              <button type="button" class="btn-enter-portal ${isCurrent ? 'btn-is-current' : 'btn-primary-sm'}" data-action="enter" data-tag="${portal.tag}">
                ${isCurrent ? 'Current Classroom' : 'Enter Classroom'}
              </button>
              <div class="portal-card-secondary-btns">
                <button type="button" class="btn-icon-action" data-action="copy-tag" data-tag="${portal.tag}" title="Copy Tag (${portal.tag})">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button type="button" class="btn-icon-action" data-action="copy-link" data-tag="${portal.tag}" title="Copy Shareable Link">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </button>
                <button type="button" class="btn-icon-action btn-danger-action" data-action="leave" data-tag="${portal.tag}" title="Leave this Classroom">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Handle interactions on joined portal cards (Event delegation)
  joinedPortalsList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
      const card = e.target.closest('.joined-portal-card');
      if (card && !e.target.closest('.portal-card-secondary-btns')) {
        const cardTag = card.dataset.tag;
        const portal = joinedPortals.find(p => p.tag.toUpperCase() === cardTag.toUpperCase());
        if (portal) {
          setClassroomPortal(portal.tag, portal.name);
          switchView('materials');
          showToast(`Entered ${portal.name}! Loading curriculum...`);
        }
      }
      return;
    }

    const action = btn.dataset.action;
    const tag = btn.dataset.tag;
    const portal = joinedPortals.find(p => p.tag.toUpperCase() === tag.toUpperCase());

    if (action === 'enter') {
      if (portal) {
        setClassroomPortal(portal.tag, portal.name);
        switchView('materials');
        showToast(`Entered ${portal.name}! Loading curriculum...`);
      }
    } else if (action === 'copy-tag') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(tag);
      }
      showToast(`Classroom tag ${tag} copied to clipboard!`);
    } else if (action === 'copy-link') {
      const link = `https://blendify.edu/portal/join?tag=${tag.replace('#', '')}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link);
      }
      showToast(`Invite link for ${tag} copied!`);
    } else if (action === 'leave') {
      if (confirm(`Are you sure you want to leave ${portal ? portal.name : tag}?`)) {
        joinedPortals = joinedPortals.filter(p => p.tag.toUpperCase() !== tag.toUpperCase());
        saveJoinedPortals(joinedPortals);

        if (state.activeTag.toUpperCase() === tag.toUpperCase()) {
          if (joinedPortals.length > 0) {
            setClassroomPortal(joinedPortals[0].tag, joinedPortals[0].name);
          } else {
            state.activeTag = '#PORTAL-NONE';
            state.activePortalName = 'No Active Classroom';
            if (activeTagBadge) activeTagBadge.textContent = state.activeTag;
          }
        }
        renderJoinedPortals(filterJoinedPortalsInput ? filterJoinedPortalsInput.value : '');
        showToast(`Left classroom portal: ${tag}`);
      }
    }
  });

  // Filter input
  filterJoinedPortalsInput?.addEventListener('input', (e) => {
    renderJoinedPortals(e.target.value);
  });

  // Catalog of known demo topics for newly joined portals
  const demoPortalMeta = {
    '#PORTAL-FIGMA-101': { name: 'UI/UX Cohort 4 — Webflow Breakpoints Lab', instructor: 'Vativa Hub', topic: 'UI/UX Design', schedule: 'Mon & Wed · 10:00 AM', learners: '18 Online · 24 Total', materialsCount: '12 Modules', progress: 75, accentColor: '#E11D48' },
    '#WEBFLOW-LAB-44': { name: 'Interactive Webflow CMS & Animations Workshop', instructor: 'Elena Rostova', topic: 'Webflow & CMS', schedule: 'Tue & Thu · 2:00 PM', learners: '22 Enrolled · 3 Active', materialsCount: '8 Modules', progress: 50, accentColor: '#2563EB' },
    '#STUDY-ROOM-B': { name: 'Peer Design Review & Token Architecture Room', instructor: 'Harsh Vardhan (Host)', topic: 'Design Systems', schedule: 'Fri · 4:00 PM', learners: '8 Enrolled · Open Discussion', materialsCount: '6 Modules', progress: 90, accentColor: '#D97706' }
  };

  function setClassroomPortal(tag, name = null) {
    const formattedTag = tag.startsWith('#') ? tag.toUpperCase() : `#${tag.toUpperCase()}`;
    state.activeTag = formattedTag;

    // Check if portal exists in joined list
    let existing = joinedPortals.find(p => p.tag.toUpperCase() === formattedTag);
    if (!existing) {
      const meta = demoPortalMeta[formattedTag] || {
        name: name || `Classroom Workplace (${formattedTag})`,
        instructor: 'Invited Instructor',
        topic: 'Collaborative Cohort',
        schedule: 'Self-Paced / Cohort Live',
        learners: '12 Students Enrolled',
        materialsCount: '8 Modules',
        progress: 10,
        accentColor: '#8B5CF6'
      };
      existing = {
        tag: formattedTag,
        name: name || meta.name,
        instructor: meta.instructor,
        topic: meta.topic,
        schedule: meta.schedule,
        learners: meta.learners,
        materialsCount: meta.materialsCount,
        progress: meta.progress,
        accentColor: meta.accentColor
      };
      joinedPortals.unshift(existing);
      saveJoinedPortals(joinedPortals);
    } else if (name) {
      existing.name = name;
      saveJoinedPortals(joinedPortals);
    }

    state.activePortalName = existing.name;

    // Update UI elements
    if (activeTagBadge) activeTagBadge.textContent = formattedTag;
    if (currentShareLink) {
      currentShareLink.value = `https://blendify.edu/portal/join?tag=${formattedTag.replace('#', '')}`;
    }

    // Update Classroom Portal Hero at top of viewWorkplaces
    const portalHeroTitle = document.getElementById('portalHeroTitle');
    const portalHeroTag = document.getElementById('portalHeroTag');
    const portalHeroDesc = document.getElementById('portalHeroDesc');
    const portalInstructorCredit = document.getElementById('portalInstructorCredit');

    if (portalHeroTitle) portalHeroTitle.textContent = existing.name;
    if (portalHeroTag) portalHeroTag.textContent = existing.tag;
    if (portalHeroDesc) {
      portalHeroDesc.innerHTML = `Active Portal: <strong>${existing.tag}</strong> · Study hands-on curriculum materials, explore responsive device models, and download starter assets directly to your computer.`;
    }
    if (portalInstructorCredit) {
      portalInstructorCredit.textContent = `${existing.instructor || 'Blendify Faculty'} · ${existing.topic || 'Classroom'}`;
    }

    renderJoinedPortals(filterJoinedPortalsInput ? filterJoinedPortalsInput.value : '');
    showToast(`Switched active classroom: ${existing.name}!`);
  }

  // Initial render of joined portals
  renderJoinedPortals();

  // Join by Tag button
  btnJoinPortalByTag?.addEventListener('click', () => {
    const entered = portalTagInput.value.trim();
    if (!entered) {
      showToast('Please enter a valid portal tag (e.g. #PORTAL-FIGMA-101)');
      return;
    }
    setClassroomPortal(entered);
    portalTagInput.value = '';
    switchView('materials');
    showToast(`Joined and entered ${entered}!`);
  });

  // Preset tag buttons
  document.querySelectorAll('.tag-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setClassroomPortal(btn.dataset.tag);
      switchView('materials');
    });
  });

  // Copy shareable link
  btnCopyPortalLink?.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentShareLink.value);
    }
    showToast('Classroom portal invite link copied to clipboard!');
  });

  // Modal: Generate New Workplace Tag
  const createPortalModal = document.getElementById('createPortalModal');
  const btnOpenCreatePortalModal = document.getElementById('btnOpenCreatePortalModal');
  const modalCloseCreatePortal = document.getElementById('modalCloseCreatePortal');
  const btnCancelCreatePortal = document.getElementById('btnCancelCreatePortal');
  const btnConfirmCreatePortal = document.getElementById('btnConfirmCreatePortal');
  const btnRegenerateTag = document.getElementById('btnRegenerateTag');
  const newGeneratedTag = document.getElementById('newGeneratedTag');
  const newWorkplaceNameInput = document.getElementById('newWorkplaceNameInput');

  function generateRandomTag() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `#PORTAL-BLEND-${randomNum}`;
  }

  btnOpenCreatePortalModal?.addEventListener('click', () => {
    newGeneratedTag.textContent = generateRandomTag();
    createPortalModal?.classList.add('open');
  });

  function closeCreatePortalModal() {
    createPortalModal?.classList.remove('open');
    if (newWorkplaceNameInput) newWorkplaceNameInput.value = '';
  }

  modalCloseCreatePortal?.addEventListener('click', closeCreatePortalModal);
  btnCancelCreatePortal?.addEventListener('click', closeCreatePortalModal);
  btnRegenerateTag?.addEventListener('click', () => {
    newGeneratedTag.textContent = generateRandomTag();
  });

  btnConfirmCreatePortal?.addEventListener('click', () => {
    const tag = newGeneratedTag.textContent;
    const name = newWorkplaceNameInput.value.trim() || `Classroom Study Group (${tag})`;
    setClassroomPortal(tag, name);
    closeCreatePortalModal();
    switchView('materials');
  });

  // =========================================================================
  // PILLAR 3: BLIPP — UNIFIED AI LEARNING COMPANION (GEMINI POWERED)
  // =========================================================================
  const aiStatusText = document.getElementById('aiStatusText');
  const aiChatHistory = document.getElementById('aiChatHistory');
  const aiMessageInput = document.getElementById('aiMessageInput');
  const btnSendAIMessage = document.getElementById('btnSendAIMessage');
  const btnClearAIChat = document.getElementById('btnClearAIChat');

  // Gemini Settings Controls
  const btnOpenGeminiModal = document.getElementById('btnOpenGeminiModal');
  const geminiBadgeText = document.getElementById('geminiBadgeText');
  const geminiKeyIndicator = document.getElementById('geminiKeyIndicator');
  const geminiModelLabel = document.getElementById('geminiModelLabel');
  const geminiModelTag = document.getElementById('geminiModelTag');
  const geminiSettingsModal = document.getElementById('geminiSettingsModal');
  const modalCloseGemini = document.getElementById('modalCloseGemini');
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const geminiModelSelect = document.getElementById('geminiModelSelect');
  const btnToggleKeyVisibility = document.getElementById('btnToggleKeyVisibility');
  const btnTestGeminiKey = document.getElementById('btnTestGeminiKey');
  const btnClearGeminiKey = document.getElementById('btnClearGeminiKey');
  const btnSaveGeminiKey = document.getElementById('btnSaveGeminiKey');
  const geminiTestStatus = document.getElementById('geminiTestStatus');

  const BLIPP_AVATAR_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>`;

  function updateGeminiStatusUI() {
    const hasKey = hasGeminiApiKey();
    const model = getGeminiModel();

    if (geminiBadgeText) {
      geminiBadgeText.textContent = hasKey ? 'Gemini Active' : 'Gemini API';
    }
    if (geminiKeyIndicator) {
      geminiKeyIndicator.className = hasKey ? 'key-dot active' : 'key-dot demo';
    }
    if (geminiModelLabel) {
      geminiModelLabel.textContent = hasKey ? model : 'Gemini (Add Key)';
    }
    if (geminiModelTag) {
      geminiModelTag.classList.toggle('connected', hasKey);
    }
  }

  function renderChatHistory() {
    if (!aiChatHistory) return;
    aiChatHistory.innerHTML = '';
    const messages = state.chatHistory.blipp || [];

    messages.forEach(msg => {
      const row = document.createElement('div');
      row.className = `ai-msg-row ${msg.sender === 'user' ? 'user' : 'ai-agent'}`;

      if (msg.sender === 'agent') {
        const renderedHtml = formatMarkdown(msg.text);
        row.innerHTML = `
          <div class="agent-avatar-sm blipp-avatar-sm">${BLIPP_AVATAR_SVG}</div>
          <div class="ai-bubble">${renderedHtml}</div>
        `;
      } else {
        // Safe escaping for user messages
        const div = document.createElement('div');
        div.textContent = msg.text;
        row.innerHTML = `<div class="ai-bubble"><p>${div.innerHTML}</p></div>`;
      }
      aiChatHistory.appendChild(row);
    });

    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
  }

  async function sendAIMessage(overrideText = null) {
    const text = overrideText || (aiMessageInput ? aiMessageInput.value.trim() : '');
    if (!text) return;

    if (!state.chatHistory.blipp) {
      state.chatHistory.blipp = [];
    }

    // Append user message
    state.chatHistory.blipp.push({ sender: 'user', text });
    if (!overrideText && aiMessageInput) aiMessageInput.value = '';
    renderChatHistory();
    saveChatHistory(state.chatHistory);

    // Disable input while processing
    if (aiMessageInput) aiMessageInput.disabled = true;
    if (btnSendAIMessage) btnSendAIMessage.disabled = true;

    // Show animated typing indicator in chat history
    const typingRow = document.createElement('div');
    typingRow.className = 'ai-msg-row ai-agent blipp-typing-row';
    typingRow.id = 'blippTypingIndicator';
    typingRow.innerHTML = `
      <div class="agent-avatar-sm blipp-avatar-sm">${BLIPP_AVATAR_SVG}</div>
      <div class="ai-bubble typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-label">Blipp is thinking with Gemini...</span>
      </div>
    `;
    aiChatHistory.appendChild(typingRow);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;

    if (aiStatusText) aiStatusText.textContent = 'Blipp is generating response...';

    try {
      const response = await callGeminiAPI({
        prompt: text,
        history: state.chatHistory.blipp,
        focusArea: state.activeFocus
      });

      // Remove typing indicator
      const existingTyping = document.getElementById('blippTypingIndicator');
      if (existingTyping) existingTyping.remove();

      state.chatHistory.blipp.push({ sender: 'agent', text: response.text });
      renderChatHistory();
      saveChatHistory(state.chatHistory);

      if (aiStatusText) aiStatusText.textContent = 'Blipp is ready to guide your learning';
    } catch (err) {
      const existingTyping = document.getElementById('blippTypingIndicator');
      if (existingTyping) existingTyping.remove();

      state.chatHistory.blipp.push({
        sender: 'agent',
        text: `I encountered an unexpected issue while processing your message. Please try again! (${err.message || 'Unknown error'})`
      });
      renderChatHistory();
      saveChatHistory(state.chatHistory);
      if (aiStatusText) aiStatusText.textContent = 'Blipp is ready to guide your learning';
    } finally {
      if (aiMessageInput) {
        aiMessageInput.disabled = false;
        aiMessageInput.focus();
      }
      if (btnSendAIMessage) btnSendAIMessage.disabled = false;
    }
  }

  btnSendAIMessage?.addEventListener('click', () => sendAIMessage());
  aiMessageInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAIMessage();
    }
  });

  btnClearAIChat?.addEventListener('click', () => {
    state.chatHistory.blipp = [
      { sender: 'agent', text: "Chat history cleared. What topic or challenge shall we explore next, Harsh?" }
    ];
    renderChatHistory();
    saveChatHistory(state.chatHistory);
    showToast('Blipp conversation cleared.');
  });

  // Prompt chips click
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      sendAIMessage(prompt);
    });
  });

  // =========================================================================
  // GEMINI SETTINGS MODAL HANDLERS
  // =========================================================================
  function openGeminiModal() {
    if (!geminiSettingsModal) return;
    const currentKey = getGeminiApiKey();
    if (geminiApiKeyInput) geminiApiKeyInput.value = currentKey;
    if (geminiModelSelect) geminiModelSelect.value = getGeminiModel();
    if (geminiTestStatus) {
      geminiTestStatus.style.display = 'none';
      geminiTestStatus.innerHTML = '';
    }
    geminiSettingsModal.classList.add('open');
  }

  function closeGeminiModal() {
    geminiSettingsModal?.classList.remove('open');
  }

  btnOpenGeminiModal?.addEventListener('click', openGeminiModal);
  modalCloseGemini?.addEventListener('click', closeGeminiModal);
  geminiSettingsModal?.addEventListener('click', (e) => {
    if (e.target === geminiSettingsModal) closeGeminiModal();
  });

  btnToggleKeyVisibility?.addEventListener('click', () => {
    if (!geminiApiKeyInput) return;
    const isPassword = geminiApiKeyInput.type === 'password';
    geminiApiKeyInput.type = isPassword ? 'text' : 'password';
    btnToggleKeyVisibility.textContent = isPassword ? '🔒' : '👁️';
  });

  btnTestGeminiKey?.addEventListener('click', async () => {
    const key = geminiApiKeyInput?.value.trim() || '';
    const model = geminiModelSelect?.value || DEFAULT_MODEL;

    if (!key) {
      if (geminiTestStatus) {
        geminiTestStatus.style.display = 'block';
        geminiTestStatus.className = 'gemini-test-status error';
        geminiTestStatus.textContent = 'Please enter an API key to test.';
      }
      return;
    }

    if (geminiTestStatus) {
      geminiTestStatus.style.display = 'block';
      geminiTestStatus.className = 'gemini-test-status testing';
      geminiTestStatus.textContent = 'Testing connection with Google Gemini...';
    }

    const result = await testGeminiConnection(key, model);
    if (geminiTestStatus) {
      geminiTestStatus.className = `gemini-test-status ${result.success ? 'success' : 'error'}`;
      geminiTestStatus.textContent = result.message;
    }
  });

  btnSaveGeminiKey?.addEventListener('click', () => {
    const key = geminiApiKeyInput?.value.trim() || '';
    const model = geminiModelSelect?.value || DEFAULT_MODEL;

    saveGeminiApiKey(key);
    saveGeminiModel(model);
    updateGeminiStatusUI();
    closeGeminiModal();

    if (key) {
      showToast(`Gemini API key saved! Using model: ${model}`);
    } else {
      showToast('Gemini API key removed. Using Blipp offline engine.');
    }
  });

  btnClearGeminiKey?.addEventListener('click', () => {
    saveGeminiApiKey('');
    if (geminiApiKeyInput) geminiApiKeyInput.value = '';
    if (geminiTestStatus) {
      geminiTestStatus.style.display = 'block';
      geminiTestStatus.className = 'gemini-test-status success';
      geminiTestStatus.textContent = 'API key removed. Blipp will use the offline knowledge base.';
    }
    updateGeminiStatusUI();
    showToast('Gemini key cleared.');
  });

  // Initial render of chat & status
  renderChatHistory();
  updateGeminiStatusUI();

  // =========================================================================
  // GLOBAL SEARCH & SHORTCUTS (CMD + F)
  // =========================================================================
  const searchModal = document.getElementById('searchModal');
  const globalSearchTrigger = document.getElementById('globalSearchTrigger');
  const modalSearchClose = document.getElementById('modalSearchClose');
  const modalSearchInput = document.getElementById('modalSearchInput');
  const searchResults = document.getElementById('searchResults');

  function openSearch() {
    searchModal?.classList.add('open');
    setTimeout(() => modalSearchInput?.focus(), 60);
  }

  function closeSearch() {
    searchModal?.classList.remove('open');
    if (modalSearchInput) modalSearchInput.value = '';
  }

  globalSearchTrigger?.addEventListener('click', openSearch);
  modalSearchClose?.addEventListener('click', closeSearch);

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeCreatePortalModal();
    }
  });

  searchResults?.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      closeSearch();
      if (action === 'view-home') switchView('home');
      if (action === 'view-materials') switchView('materials');
      if (action === 'view-workplaces') switchView('workplaces');
      if (action === 'view-ai-agent') switchView('ai-agent');
    });
  });

  // User Profile Dropdown
  const userProfileBtn = document.getElementById('userProfileBtn');
  const userPanel = document.getElementById('userPanel');
  userProfileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userPanel?.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    userPanel?.classList.remove('show');
  });

  // Synchronize User & Role
  try {
    const rawUser = localStorage.getItem('blendify_auth_user');
    const savedRole = localStorage.getItem('blendify_role');

    if (!rawUser || !savedRole) {
      window.location.replace('login.html');
      return;
    }

    // If account role is teacher, redirect to teacher studio
    if (savedRole === 'teacher') {
      window.location.replace('create-course.html');
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
        if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
        if (panelNameEl) panelNameEl.textContent = user.name;
        if (panelRoleEl) panelRoleEl.textContent = 'Student · Blendify Pro';
      }
    }
  } catch (e) {}

  function handleSignOutOrSwitch() {
    localStorage.removeItem('blendify_auth_user');
    localStorage.removeItem('blendify_role');
    window.location.href = 'login.html';
  }

  document.getElementById('btnSignOutAccount')?.addEventListener('click', handleSignOutOrSwitch);
  document.getElementById('btnSwitchAccountDropdown')?.addEventListener('click', handleSignOutOrSwitch);

  // Mobile drawer controls
  const sidebar = document.getElementById('sidebar');
  const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');

  function openMobileDrawer() {
    sidebar?.classList.add('open');
    mobileDrawerOverlay?.classList.add('open');
  }

  function closeMobileDrawer() {
    sidebar?.classList.remove('open');
    mobileDrawerOverlay?.classList.remove('open');
  }

  document.getElementById('sidebarToggle')?.addEventListener('click', openMobileDrawer);
  document.getElementById('mobileDrawerClose')?.addEventListener('click', closeMobileDrawer);
  mobileDrawerOverlay?.addEventListener('click', closeMobileDrawer);

  // Restore student saved view & AI chat on startup
  if (state.activeView && views[state.activeView]) {
    switchView(state.activeView);
  }
  renderChatHistory();

  console.log('Blendify LMS active: Learning Materials, Classroom Workplaces & AI Agent ready.');
});
