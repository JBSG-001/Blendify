/**
 * BLENDIFY AUTHENTICATION & ROLE ROUTING SYSTEM
 * Implements the Flowchart Lifecycle:
 * 1. First-time visit: Loads Login Screen.
 * 2. Login screen: Enters email & password (or Google SSO / demo accounts).
 * 3. Choose role: Selects Student or Teacher (one-time selection for new users).
 * 4. Branches to Student portal (loads student dashboard) or Teacher portal (loads teacher dashboard).
 * 5. Choice saved: Permanently saves role so return visits skip login entirely.
 */

import {
  getDatabase,
  getAccountRolesMap as getSqlAccountRolesMap,
  saveUserRole as saveSqlUserRole,
  registerSqlUser,
  authenticateSqlUser,
  getUserByEmail
} from './db.js';
import {
  firebaseSignUp,
  firebaseSignIn,
  isFirebaseConfigured,
  getFirebaseStatus
} from './firebase.js';
import {
  supabaseSignUp,
  supabaseSignIn,
  isSupabaseConfigured,
  getSupabaseStatus
} from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize SQLite WebAssembly Database in background
  try {
    await getDatabase();
    console.log('[Blendify SQLite] Database ready for authentication.');
  } catch (err) {
    console.warn('[Blendify SQLite] SQLite initialization fallback to local storage:', err);
  }



  // =========================================================================
  // STORAGE KEYS & PERSISTENT ROLE SYSTEM (SYNCHRONIZED WITH SQLITE)
  // =========================================================================
  const STORAGE_KEY_USER = 'blendify_auth_user';
  const STORAGE_KEY_ROLE = 'blendify_role';
  const STORAGE_KEY_ACCOUNTS_MAP = 'blendify_account_roles';

  // Preset demo accounts with pre-mapped roles
  function getAccountRolesMap() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS_MAP);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const defaultMap = {
      'alex.student@gmail.com': 'student',
      'harsh.teacher@blendify.edu': 'teacher',
      'elena.design@gmail.com': 'teacher'
    };
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS_MAP, JSON.stringify(defaultMap));
    } catch (e) {}
    return defaultMap;
  }

  function getSavedRoleForEmail(email) {
    if (!email) return null;
    const map = getAccountRolesMap();
    return map[email.trim().toLowerCase()] || null;
  }

  function saveRoleForEmail(email, role, name = null) {
    if (!email || !role) return;
    const map = getAccountRolesMap();
    map[email.trim().toLowerCase()] = role;
    localStorage.setItem(STORAGE_KEY_ACCOUNTS_MAP, JSON.stringify(map));
    // Persist to SQLite users table
    saveSqlUserRole(email, role, name).catch(e => console.warn('[SQLite] saveUserRole error:', e));
  }

  // Application State
  const state = {
    currentUser: null,
    activeAuthTab: 'signin'
  };

  // Toast Notification System
  const CHECK_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const ERROR_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  const toastContainer = document.getElementById('toastContainer');
  function showToast(message, icon = CHECK_SVG, isError = false) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.innerHTML = `<span class="toast-icon-box">${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // DOM Elements
  const sectionSignIn = document.getElementById('sectionSignIn');
  const sectionRoleSelection = document.getElementById('sectionRoleSelection');
  const googleAccountModal = document.getElementById('googleAccountModal');
  const authLoadingOverlay = document.getElementById('authLoadingOverlay');
  const loadingStatusText = document.getElementById('loadingStatusText');

  // Header Elements
  const signedInUserPill = document.getElementById('signedInUserPill');
  const headerUserAvatar = document.getElementById('headerUserAvatar');
  const headerUserName = document.getElementById('headerUserName');
  const headerUserEmail = document.getElementById('headerUserEmail');
  const btnSwitchAccount = document.getElementById('btnSwitchAccount');

  // Auth Tabs & Title
  const tabBtnSignIn = document.getElementById('tabBtnSignIn');
  const tabBtnSignUp = document.getElementById('tabBtnSignUp');
  const authCardTitle = document.getElementById('authCardTitle');
  const authCardSubtitle = document.getElementById('authCardSubtitle');

  // Sign In Form & Validation Elements
  const formEmailPassword = document.getElementById('formEmailPassword');
  const inputEmail = document.getElementById('inputEmail');
  const inputPassword = document.getElementById('inputPassword');
  const wrapperEmail = document.getElementById('wrapperEmail');
  const wrapperPassword = document.getElementById('wrapperPassword');
  const emailFieldError = document.getElementById('emailFieldError');
  const passwordFieldError = document.getElementById('passwordFieldError');
  const authErrorBanner = document.getElementById('authErrorBanner');
  const authErrorTitle = document.getElementById('authErrorTitle');
  const authErrorDesc = document.getElementById('authErrorDesc');
  const btnDismissAuthError = document.getElementById('btnDismissAuthError');
  const btnTogglePassword = document.getElementById('btnTogglePassword');
  const checkRememberMe = document.getElementById('checkRememberMe');
  const btnForgotPassword = document.getElementById('btnForgotPassword');

  // Sign Up Form Elements
  const formSignUp = document.getElementById('formSignUp');
  const inputSignUpName = document.getElementById('inputSignUpName');
  const inputSignUpEmail = document.getElementById('inputSignUpEmail');
  const inputSignUpPassword = document.getElementById('inputSignUpPassword');
  const inputSignUpConfirmPassword = document.getElementById('inputSignUpConfirmPassword');
  const wrapperSignUpName = document.getElementById('wrapperSignUpName');
  const wrapperSignUpEmail = document.getElementById('wrapperSignUpEmail');
  const wrapperSignUpPassword = document.getElementById('wrapperSignUpPassword');
  const wrapperSignUpConfirmPassword = document.getElementById('wrapperSignUpConfirmPassword');
  const signUpNameError = document.getElementById('signUpNameError');
  const signUpEmailError = document.getElementById('signUpEmailError');
  const signUpPasswordError = document.getElementById('signUpPasswordError');
  const signUpConfirmError = document.getElementById('signUpConfirmError');
  const btnToggleSignUpPassword = document.getElementById('btnToggleSignUpPassword');
  const labelRoleStudent = document.getElementById('labelRoleStudent');
  const labelRoleTeacher = document.getElementById('labelRoleTeacher');

  // Registered Credentials Store
  const DEFAULT_CREDENTIALS = {
    'alex.student@gmail.com': {
      password: 'student123',
      name: 'Alex Rivers',
      role: 'student',
      aliases: ['alex', 'alex.student', 'alexrivers', 'student']
    },
    'harsh.teacher@blendify.edu': {
      password: 'teacher123',
      name: 'Harsh Vardhan',
      role: 'teacher',
      aliases: ['harsh', 'harsh.teacher', 'harshvardhan', 'teacher']
    },
    'elena.design@gmail.com': {
      password: 'teacher123',
      name: 'Elena Rostova',
      role: 'teacher',
      aliases: ['elena', 'elena.design', 'elenarostova', 'instructor']
    }
  };

  const STORAGE_KEY_REGISTERED = 'blendify_registered_users';

  function getKnownAccounts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REGISTERED);
      if (stored) {

        return { ...DEFAULT_CREDENTIALS, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return { ...DEFAULT_CREDENTIALS };
  }

  function findAccountByIdentifier(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const accounts = getKnownAccounts();

    // 1. Direct email match
    if (accounts[clean]) {
      return { email: clean, ...accounts[clean] };
    }

    // 2. Check aliases or username matching
    for (const [accEmail, acc] of Object.entries(accounts)) {
      if (accEmail.toLowerCase() === clean) {
        return { email: accEmail, ...acc };
      }
      const username = accEmail.split('@')[0].toLowerCase();
      if (username === clean) {
        return { email: accEmail, ...acc };
      }
      if (acc.aliases && acc.aliases.some(a => a.toLowerCase() === clean)) {
        return { email: accEmail, ...acc };
      }
    }

    return null;
  }

  // =========================================================================
  // ERROR NOTIFICATION & FIELD FEEDBACK SYSTEM
  // =========================================================================
  function showAuthError(title, description, targetField = 'all') {
    if (authErrorBanner) {
      if (authErrorTitle) authErrorTitle.textContent = title;
      if (authErrorDesc) authErrorDesc.textContent = description;
      authErrorBanner.style.display = 'flex';
      // Re-trigger shake animation for instant tactile feedback
      authErrorBanner.style.animation = 'none';
      void authErrorBanner.offsetHeight;
      authErrorBanner.style.animation = 'authBannerSlide 0.28s cubic-bezier(0.16, 1, 0.3, 1), authErrorShake 0.4s ease';
    }

    if (targetField === 'email' || targetField === 'all') {
      wrapperEmail?.classList.add('has-error');
      if (emailFieldError) {
        emailFieldError.textContent = description;
        emailFieldError.style.display = 'block';
      }
      inputEmail?.focus();
    }

    if (targetField === 'password' || targetField === 'all') {
      wrapperPassword?.classList.add('has-error');
      if (passwordFieldError) {
        passwordFieldError.textContent = description;
        passwordFieldError.style.display = 'block';
      }
      if (targetField === 'password') {
        inputPassword?.focus();
      }
    }

    // Sign up field feedback
    if (targetField === 'signup-name' || targetField === 'all') {
      wrapperSignUpName?.classList.add('has-error');
      if (signUpNameError) {
        signUpNameError.textContent = description;
        signUpNameError.style.display = 'block';
      }
      if (targetField === 'signup-name') inputSignUpName?.focus();
    }

    if (targetField === 'signup-email' || targetField === 'all') {
      wrapperSignUpEmail?.classList.add('has-error');
      if (signUpEmailError) {
        signUpEmailError.textContent = description;
        signUpEmailError.style.display = 'block';
      }
      if (targetField === 'signup-email') inputSignUpEmail?.focus();
    }

    if (targetField === 'signup-password' || targetField === 'all') {
      wrapperSignUpPassword?.classList.add('has-error');
      if (signUpPasswordError) {
        signUpPasswordError.textContent = description;
        signUpPasswordError.style.display = 'block';
      }
      if (targetField === 'signup-password') inputSignUpPassword?.focus();
    }

    if (targetField === 'signup-confirm' || targetField === 'all') {
      wrapperSignUpConfirmPassword?.classList.add('has-error');
      if (signUpConfirmError) {
        signUpConfirmError.textContent = description;
        signUpConfirmError.style.display = 'block';
      }
      if (targetField === 'signup-confirm') inputSignUpConfirmPassword?.focus();
    }

    showToast(description, ERROR_SVG, true);
  }

  function clearAuthErrors(field = null) {
    if (!field || field === 'all') {
      if (authErrorBanner) authErrorBanner.style.display = 'none';
      wrapperEmail?.classList.remove('has-error');
      wrapperPassword?.classList.remove('has-error');
      wrapperSignUpName?.classList.remove('has-error');
      wrapperSignUpEmail?.classList.remove('has-error');
      wrapperSignUpPassword?.classList.remove('has-error');
      wrapperSignUpConfirmPassword?.classList.remove('has-error');
      if (emailFieldError) { emailFieldError.textContent = ''; emailFieldError.style.display = 'none'; }
      if (passwordFieldError) { passwordFieldError.textContent = ''; passwordFieldError.style.display = 'none'; }
      if (signUpNameError) { signUpNameError.textContent = ''; signUpNameError.style.display = 'none'; }
      if (signUpEmailError) { signUpEmailError.textContent = ''; signUpEmailError.style.display = 'none'; }
      if (signUpPasswordError) { signUpPasswordError.textContent = ''; signUpPasswordError.style.display = 'none'; }
      if (signUpConfirmError) { signUpConfirmError.textContent = ''; signUpConfirmError.style.display = 'none'; }
      return;
    }

    if (field === 'email') {
      wrapperEmail?.classList.remove('has-error');
      if (emailFieldError) { emailFieldError.textContent = ''; emailFieldError.style.display = 'none'; }
    }
    if (field === 'password') {
      wrapperPassword?.classList.remove('has-error');
      if (passwordFieldError) { passwordFieldError.textContent = ''; passwordFieldError.style.display = 'none'; }
    }
    if (field === 'signup-name') {
      wrapperSignUpName?.classList.remove('has-error');
      if (signUpNameError) { signUpNameError.textContent = ''; signUpNameError.style.display = 'none'; }
    }
    if (field === 'signup-email') {
      wrapperSignUpEmail?.classList.remove('has-error');
      if (signUpEmailError) { signUpEmailError.textContent = ''; signUpEmailError.style.display = 'none'; }
    }
    if (field === 'signup-password') {
      wrapperSignUpPassword?.classList.remove('has-error');
      if (signUpPasswordError) { signUpPasswordError.textContent = ''; signUpPasswordError.style.display = 'none'; }
    }
    if (field === 'signup-confirm') {
      wrapperSignUpConfirmPassword?.classList.remove('has-error');
      if (signUpConfirmError) { signUpConfirmError.textContent = ''; signUpConfirmError.style.display = 'none'; }
    }
  }

  btnDismissAuthError?.addEventListener('click', () => clearAuthErrors('all'));
  inputEmail?.addEventListener('input', () => clearAuthErrors('email'));
  inputPassword?.addEventListener('input', () => clearAuthErrors('password'));
  inputSignUpName?.addEventListener('input', () => clearAuthErrors('signup-name'));
  inputSignUpEmail?.addEventListener('input', () => clearAuthErrors('signup-email'));
  inputSignUpPassword?.addEventListener('input', () => clearAuthErrors('signup-password'));
  inputSignUpConfirmPassword?.addEventListener('input', () => clearAuthErrors('signup-confirm'));

  // =========================================================================
  // AUTH SEGMENTED TABS: SIGN IN vs SIGN UP
  // =========================================================================
  function switchAuthTab(tab) {
    clearAuthErrors('all');
    state.activeAuthTab = tab;

    if (tab === 'signup') {
      tabBtnSignIn?.classList.remove('active');
      tabBtnSignUp?.classList.add('active');
      tabBtnSignIn?.setAttribute('aria-selected', 'false');
      tabBtnSignUp?.setAttribute('aria-selected', 'true');
      if (authCardTitle) authCardTitle.textContent = 'Create Your Account';
      if (authCardSubtitle) authCardSubtitle.textContent = 'Sign up for Blendify LMS — instant setup synced with SQLite & Firebase.';
      if (formEmailPassword) formEmailPassword.style.display = 'none';
      if (formSignUp) formSignUp.style.display = 'block';
      inputSignUpName?.focus();
    } else {
      tabBtnSignUp?.classList.remove('active');
      tabBtnSignIn?.classList.add('active');
      tabBtnSignUp?.setAttribute('aria-selected', 'false');
      tabBtnSignIn?.setAttribute('aria-selected', 'true');
      if (authCardTitle) authCardTitle.textContent = 'Login Screen';
      if (authCardSubtitle) authCardSubtitle.textContent = 'Enter email & password to access your Blendify dashboard.';
      if (formSignUp) formSignUp.style.display = 'none';
      if (formEmailPassword) formEmailPassword.style.display = 'block';
      inputEmail?.focus();
    }
  }

  tabBtnSignIn?.addEventListener('click', () => switchAuthTab('signin'));
  tabBtnSignUp?.addEventListener('click', () => switchAuthTab('signup'));

  // Role Card Selection in Sign Up
  labelRoleStudent?.addEventListener('click', () => {
    labelRoleStudent.classList.add('selected');
    labelRoleTeacher?.classList.remove('selected');
  });

  labelRoleTeacher?.addEventListener('click', () => {
    labelRoleTeacher.classList.add('selected');
    labelRoleStudent?.classList.remove('selected');
  });

  // Password visibility toggle for Sign Up
  btnToggleSignUpPassword?.addEventListener('click', () => {
    if (!inputSignUpPassword) return;
    const isPwd = inputSignUpPassword.type === 'password';
    inputSignUpPassword.type = isPwd ? 'text' : 'password';
    const show = btnToggleSignUpPassword.querySelector('.eye-show');
    const hide = btnToggleSignUpPassword.querySelector('.eye-hide');
    if (show && hide) {
      show.style.display = isPwd ? 'none' : 'block';
      hide.style.display = isPwd ? 'block' : 'none';
    }
  });

  // Google SSO Elements
  const btnGoogleSignIn = document.getElementById('btnGoogleSignIn');
  const btnCloseGoogleModal = document.getElementById('btnCloseGoogleModal');
  const btnToggleCustomEntry = document.getElementById('btnToggleCustomEntry');
  const customEntryForm = document.getElementById('customEntryForm');
  const btnSubmitCustomAccount = document.getElementById('btnSubmitCustomAccount');
  const customGoogleEmail = document.getElementById('customGoogleEmail');
  const customGoogleName = document.getElementById('customGoogleName');

  // Role Selection Cards & Buttons
  const cardChooseStudent = document.getElementById('cardChooseStudent');
  const cardChooseTeacher = document.getElementById('cardChooseTeacher');
  const btnEnterStudentPortal = document.getElementById('btnEnterStudentPortal');
  const btnEnterTeacherStudio = document.getElementById('btnEnterTeacherStudio');

  // Clean Account tags in Google Chooser modal
  function updateModalAccountTags() {
    document.querySelectorAll('.google-account-item').forEach(item => {
      const email = item.getAttribute('data-email');
      const role = getSavedRoleForEmail(email);
      const tagEl = item.querySelector('.acc-tag');
      if (tagEl) {
        if (role === 'student') {
          tagEl.className = 'acc-tag student';
          tagEl.textContent = 'Student';
        } else if (role === 'teacher') {
          tagEl.className = 'acc-tag teacher';
          tagEl.textContent = 'Teacher';
        } else {
          tagEl.className = 'acc-tag';
          tagEl.textContent = 'Google Account';
        }
      }
    });
  }

  // =========================================================================
  // VIEW SWITCHING
  // =========================================================================
  function renderSignInView() {
    sectionSignIn.style.display = 'block';
    sectionRoleSelection.style.display = 'none';
    signedInUserPill.style.display = 'none';
    updateModalAccountTags();
  }

  function renderRoleView() {
    sectionSignIn.style.display = 'none';
    sectionRoleSelection.style.display = 'block';

    if (state.currentUser) {
      signedInUserPill.style.display = 'flex';
      headerUserName.textContent = state.currentUser.name || 'User';
      headerUserEmail.textContent = state.currentUser.email || 'user@example.com';

      const firstLetter = (state.currentUser.name || state.currentUser.email || 'U').charAt(0).toUpperCase();
      if (headerUserAvatar) {
        headerUserAvatar.textContent = firstLetter;
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Check saved choice on initial page load: if already saved, skip login immediately
  try {
    const savedUserRaw = localStorage.getItem(STORAGE_KEY_USER);
    const savedRole = localStorage.getItem(STORAGE_KEY_ROLE);
    if (savedUserRaw && savedRole) {
      const savedUser = JSON.parse(savedUserRaw);
      state.currentUser = savedUser;

      if (savedRole === 'student') {
        window.location.replace('index.html');
        return;
      } else if (savedRole === 'teacher') {
        window.location.replace('create-course.html');
        return;
      }
    }
  } catch (e) {}

  // Otherwise, default to Login Screen for first-time or returning unauthenticated visit
  renderSignInView();

  // =========================================================================
  // PASSWORD VISIBILITY TOGGLE (SIGN IN)
  // =========================================================================
  btnTogglePassword?.addEventListener('click', () => {
    if (!inputPassword) return;
    const isPassword = inputPassword.type === 'password';
    inputPassword.type = isPassword ? 'text' : 'password';
    const eyeShow = btnTogglePassword.querySelector('.eye-show');
    const eyeHide = btnTogglePassword.querySelector('.eye-hide');
    if (eyeShow && eyeHide) {
      eyeShow.style.display = isPassword ? 'none' : 'block';
      eyeHide.style.display = isPassword ? 'block' : 'none';
    }
  });

  // Forgot password mock prompt
  btnForgotPassword?.addEventListener('click', () => {
    showToast('A password reset link has been dispatched to your email.');
  });

  // =========================================================================
  // AUTHENTICATION PROCESSOR (CORE FLOW)
  // =========================================================================
  function processAuthentication(user) {
    if (googleAccountModal) googleAccountModal.style.display = 'none';
    if (authLoadingOverlay) {
      authLoadingOverlay.style.display = 'flex';
      if (loadingStatusText) {
        loadingStatusText.textContent = `Signing in as ${user.name}...`;
      }
    }

    setTimeout(() => {
      if (authLoadingOverlay) authLoadingOverlay.style.display = 'none';
      state.currentUser = user;

      const email = user.email ? user.email.toLowerCase().trim() : '';
      const existingRole = getSavedRoleForEmail(email) || user.role;

      if (existingRole) {
        // CHOICE ALREADY SAVED FOR THIS ACCOUNT:
        // Skips login on return and loads portal directly!
        user.role = existingRole;
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEY_ROLE, existingRole);

        showToast(`Welcome back, ${user.name}!`);

        const targetUrl = (function() {
          try {
            const t = sessionStorage.getItem('blendify_redirect_target');
            if (t) {
              sessionStorage.removeItem('blendify_redirect_target');
              if (existingRole === 'teacher' && t.includes('create-course')) return 'create-course.html';
              if (existingRole === 'student' && t.includes('index')) return 'index.html';
            }
          } catch(e) {}
          return existingRole === 'student' ? 'index.html' : 'create-course.html';
        })();

        setTimeout(() => {
          window.location.href = targetUrl;
        }, 350);
      } else {
        // FIRST-TIME VISIT FOR THIS ACCOUNT:
        // Proceeds to Choose role screen (Student or teacher)
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        renderRoleView();
        showToast(`Signed in as ${user.name}. Please choose your role.`);
      }
    }, 450);
  }

  // =========================================================================
  // EMAIL / USERNAME & PASSWORD SIGN IN SUBMISSION (SQLITE & FIREBASE)
  // =========================================================================
  formEmailPassword?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthErrors('all');

    const identifier = inputEmail?.value.trim();
    const password = inputPassword?.value;

    // 1. Validate Username / Email format
    if (!identifier) {
      showAuthError('Invalid Username or Email', 'Please enter your email address or username.', 'email');
      return;
    }

    const isEmailFormat = identifier.includes('@');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isEmailFormat && !emailPattern.test(identifier)) {
      showAuthError('Invalid Email Format', 'Please enter a valid email address (e.g. name@example.com).', 'email');
      return;
    }

    if (!isEmailFormat && identifier.length < 3) {
      showAuthError('Invalid Username', 'Username must contain at least 3 characters.', 'email');
      return;
    }

    // 2. Validate Password format
    if (!password) {
      showAuthError('Invalid Password', 'Please enter your password.', 'password');
      return;
    }

    if (password.length < 6) {
      showAuthError('Invalid Password', 'Password must be at least 6 characters long.', 'password');
      return;
    }

    // 3. Authenticate with SQLite users table first
    try {
      const sqlAuth = await authenticateSqlUser(identifier, password);
      if (sqlAuth) {
        if (!sqlAuth.success && sqlAuth.reason === 'invalid_password') {
          showAuthError('Incorrect Password', 'The password you entered is incorrect. Please verify your credentials.', 'password');
          return;
        }
        if (sqlAuth.success && sqlAuth.user) {
          clearAuthErrors('all');
          processAuthentication({
            name: sqlAuth.user.name,
            email: sqlAuth.user.email,
            role: sqlAuth.user.role,
            remember: checkRememberMe ? checkRememberMe.checked : true
          });
          return;
        }
      }
    } catch (sqlErr) {
      console.warn('[SQLite Auth Error]', sqlErr);
    }

    // 4. Try Supabase Auth if configured
    if (isSupabaseConfigured() && isEmailFormat) {
      try {
        const sbAuth = await supabaseSignIn(identifier, password);
        if (sbAuth.success && sbAuth.user) {
          saveRoleForEmail(sbAuth.user.email, sbAuth.user.role, sbAuth.user.name);
          clearAuthErrors('all');
          processAuthentication({
            name: sbAuth.user.name,
            email: sbAuth.user.email,
            role: sbAuth.user.role,
            remember: checkRememberMe ? checkRememberMe.checked : true
          });
          return;
        } else if (sbAuth.message?.includes('Email not confirmed')) {
          showAuthError('Email Not Confirmed', 'Please check your inbox and click the verification link before logging in.', 'email');
          return;
        } else if (sbAuth.code === 400 || sbAuth.message?.includes('Invalid login credentials')) {
          showAuthError('Incorrect Password', 'The credentials you entered do not match our Supabase records.', 'password');
          return;
        }
      } catch (sbErr) {
        console.warn('[Supabase Auth Error]', sbErr);
      }
    }

    // 5. Try Firebase Auth if live credentials are configured
    if (isFirebaseConfigured() && isEmailFormat) {
      try {
        const fbAuth = await firebaseSignIn(identifier, password);
        if (fbAuth.success && fbAuth.user) {
          // Persist to SQLite users table for offline sync
          saveRoleForEmail(fbAuth.user.email, fbAuth.user.role, fbAuth.user.name);
          clearAuthErrors('all');
          processAuthentication({
            name: fbAuth.user.name,
            email: fbAuth.user.email,
            role: fbAuth.user.role,
            remember: checkRememberMe ? checkRememberMe.checked : true
          });
          return;
        } else if (fbAuth.code === 'auth/wrong-password' || fbAuth.code === 'auth/invalid-credential') {
          showAuthError('Incorrect Password', 'The password you entered does not match our records.', 'password');
          return;
        }
      } catch (fbErr) {
        console.warn('[Firebase Auth Error]', fbErr);
      }
    }

    // 5. Fallback check for demo/in-memory accounts
    const account = findAccountByIdentifier(identifier);
    if (account) {
      if (account.password && account.password !== password) {
        showAuthError('Incorrect Password', 'The password you entered is incorrect. Please try again.', 'password');
        return;
      }
      clearAuthErrors('all');
      processAuthentication({
        name: account.name || identifier.split('@')[0],
        email: account.email || identifier,
        role: account.role || getSavedRoleForEmail(account.email),
        remember: checkRememberMe ? checkRememberMe.checked : true
      });
      return;
    }

    // 6. If not found anywhere:
    showAuthError(
      'Account Not Found',
      `No Blendify account matches "${identifier}". Switch to "Create Account" tab above to sign up!`,
      'email'
    );
  });

  // =========================================================================
  // USER SIGN UP SUBMISSION (SAVES TO SQLITE & FIREBASE)
  // =========================================================================
  formSignUp?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthErrors('all');

    const name = inputSignUpName?.value.trim();
    const email = inputSignUpEmail?.value.trim();
    const password = inputSignUpPassword?.value;
    const confirmPassword = inputSignUpConfirmPassword?.value;
    const roleRadio = document.querySelector('input[name="signupRole"]:checked');
    const role = roleRadio?.value || 'student';

    // 1. Validate Name
    if (!name || name.length < 2) {
      showAuthError('Invalid Full Name', 'Please enter your full name (at least 2 characters).', 'signup-name');
      return;
    }

    // 2. Validate Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      showAuthError('Invalid Email Address', 'Please provide a valid email (e.g. yourname@domain.com).', 'signup-email');
      return;
    }

    // 3. Validate Password
    if (!password || password.length < 6) {
      showAuthError('Password Too Short', 'Password must be at least 6 characters long.', 'signup-password');
      return;
    }

    // 4. Validate Confirm Password
    if (password !== confirmPassword) {
      showAuthError('Passwords Do Not Match', 'The confirmation password does not match. Please retype.', 'signup-confirm');
      return;
    }

    // Show loading indicator
    if (authLoadingOverlay) {
      authLoadingOverlay.style.display = 'flex';
      if (loadingStatusText) {
        loadingStatusText.textContent = 'Creating account in SQLite & Firebase...';
      }
    }

    try {
      // 1. Save user to SQLite WebAssembly database
      await registerSqlUser({ email, name, role, password });
      saveRoleForEmail(email, role, name);

      // Keep in registered users cache
      const known = getKnownAccounts();
      known[email.toLowerCase()] = { password, name, role };
      try {
        localStorage.setItem(STORAGE_KEY_REGISTERED, JSON.stringify(known));
      } catch (e) {}

      // 2. Save user to Supabase Authentication & PostgreSQL users table if configured
      let cloudNotice = '';
      let requiresEmailVerification = false;
      if (isSupabaseConfigured()) {
        try {
          const sbResult = await supabaseSignUp(email, password, name, role);
          if (sbResult.success) {
            cloudNotice += ' & Supabase';
            if (sbResult.requiresConfirmation) {
              requiresEmailVerification = true;
            }
            console.log('[Supabase] User registered successfully:', sbResult.user);
          } else if (sbResult.message?.toLowerCase().includes('already registered')) {
            if (authLoadingOverlay) authLoadingOverlay.style.display = 'none';
            showAuthError('Email Already Registered', 'An account with this email already exists in Supabase. Please sign in instead.', 'signup-email');
            return;
          }
        } catch (sbErr) {
          console.warn('[Supabase] Registration notice:', sbErr);
        }
      }

      // 3. Save user to Firebase Authentication & Firestore if configured
      if (isFirebaseConfigured()) {
        try {
          const fbResult = await firebaseSignUp(email, password, name, role);
          if (fbResult.success) {
            cloudNotice += ' & Firebase';
            console.log('[Firebase] User registered successfully:', fbResult.user);
          }
        } catch (fbErr) {
          console.warn('[Firebase] Firebase registration notice:', fbErr);
        }
      }

      if (authLoadingOverlay) authLoadingOverlay.style.display = 'none';

      if (requiresEmailVerification) {
        showToast(`Account created in SQLite${cloudNotice}! Please verify your email from Supabase to complete cloud login.`);
      } else {
        showToast(`Account successfully created in SQLite${cloudNotice}! Welcome, ${name}!`);
      }

      // Set user session
      const newUser = { name, email, role };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_ROLE, role);

      setTimeout(() => {
        if (role === 'student') {
          window.location.href = 'index.html';
        } else {
          window.location.href = 'create-course.html';
        }
      }, 500);

    } catch (err) {
      if (authLoadingOverlay) authLoadingOverlay.style.display = 'none';
      showAuthError(
        'Registration Failed',
        err.message || 'An error occurred while saving user. Please try a different email.',
        'signup-email'
      );
    }
  });

  // =========================================================================
  // GOOGLE SIGN-IN MODAL (SSO ALTERNATIVE)
  // =========================================================================
  function openGoogleModal() {
    updateModalAccountTags();
    if (googleAccountModal) googleAccountModal.style.display = 'flex';
  }

  function closeGoogleModal() {
    if (googleAccountModal) googleAccountModal.style.display = 'none';
  }

  btnGoogleSignIn?.addEventListener('click', openGoogleModal);
  btnCloseGoogleModal?.addEventListener('click', closeGoogleModal);

  googleAccountModal?.addEventListener('click', (e) => {
    if (e.target === googleAccountModal) {
      closeGoogleModal();
    }
  });

  document.querySelectorAll('.google-account-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.getAttribute('data-name');
      const email = item.getAttribute('data-email');
      const defaultRole = item.getAttribute('data-role');
      if (defaultRole && !getSavedRoleForEmail(email)) {
        saveRoleForEmail(email, defaultRole);
      }
      processAuthentication({ name, email });
    });
  });

  btnToggleCustomEntry?.addEventListener('click', () => {
    if (!customEntryForm) return;
    const isHidden = customEntryForm.style.display === 'none';
    customEntryForm.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
      customGoogleEmail?.focus();
    }
  });

  btnSubmitCustomAccount?.addEventListener('click', () => {
    const email = customGoogleEmail?.value.trim();
    const name = customGoogleName?.value.trim() || (email ? email.split('@')[0] : '') || 'Google User';

    if (!email || !email.includes('@')) {
      showToast('Please enter a valid Google email address.');
      customGoogleEmail?.focus();
      return;
    }

    processAuthentication({ name, email });
  });

  // =========================================================================
  // SWITCH ACCOUNT / SIGN OUT
  // =========================================================================
  btnSwitchAccount?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_ROLE);
    state.currentUser = null;
    renderSignInView();
    showToast('Signed out. Ready for new sign-in.');
  });

  // =========================================================================
  // ROLE SELECTION HANDLERS: STUDENT vs TEACHER
  // =========================================================================
  function handleStudentSelection() {
    const email = state.currentUser?.email || 'student@blendify.io';
    saveRoleForEmail(email, 'student');

    if (!state.currentUser) {
      state.currentUser = { name: 'Student', email: email };
    }
    state.currentUser.role = 'student';

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(state.currentUser));
    localStorage.setItem(STORAGE_KEY_ROLE, 'student');

    showToast('Choice saved! Loading Student Dashboard...');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 400);
  }

  function handleTeacherSelection() {
    const email = state.currentUser?.email || 'teacher@blendify.edu';
    saveRoleForEmail(email, 'teacher');

    if (!state.currentUser) {
      state.currentUser = { name: 'Instructor', email: email };
    }
    state.currentUser.role = 'teacher';

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(state.currentUser));
    localStorage.setItem(STORAGE_KEY_ROLE, 'teacher');

    showToast('Choice saved! Loading Teacher Studio...');

    setTimeout(() => {
      window.location.href = 'create-course.html';
    }, 400);
  }

  btnEnterStudentPortal?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleStudentSelection();
  });

  cardChooseStudent?.addEventListener('click', () => {
    handleStudentSelection();
  });

  btnEnterTeacherStudio?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleTeacherSelection();
  });

  cardChooseTeacher?.addEventListener('click', () => {
    handleTeacherSelection();
  });

  console.log('Blendify Authentication & Role Flow initialized.');
});
