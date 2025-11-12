/* public/js/script.js
   Single front-end script for register, login, dashboard, profile, my courses.
   API prefix: /api
*/

const API_PREFIX = '/api';
const $ = (id) => document.getElementById(id);
const setFormMessage = (msg, type='') => {
  const el = $('formMessage');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'form-message' + (type ? ' ' + type : '');
};

function getToken() { return localStorage.getItem('token'); }
function saveToken(t) { localStorage.setItem('token', t); }
function clearAuth() { localStorage.removeItem('token'); }

// ---------------------- REGISTER ----------------------
(function attachRegister() {
  const form = $('registerForm');
  if (!form) return;

  const fullNameEl = $('fullName');
  const emailEl = $('email');
  const contactEl = $('contact');
  const pwdEl = $('password');
  const confirmEl = $('confirmPassword');
  const toggleBtn = $('pwdToggle');
  const registerBtn = $('registerBtn');

  const nameHint = $('nameHint');
  const emailHint = $('emailHint');
  const pwdHint = $('pwdHint');
  const confirmHint = $('confirmHint');

  function isNameValid(n){ return /^[A-Za-z\s]{2,60}$/.test(n.trim()); }
  function isEmailValid(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function isPasswordStrong(p){ return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(p); }

  toggleBtn.addEventListener('click', () => {
    if (pwdEl.type === 'password') { pwdEl.type = 'text'; toggleBtn.textContent = 'Hide pwd'; }
    else { pwdEl.type = 'password'; toggleBtn.textContent = 'Show pwd'; }
  });

  fullNameEl.addEventListener('input', e => nameHint.textContent = isNameValid(e.target.value) ? '' : 'Only letters & spaces (2-60).');
  emailEl.addEventListener('input', e => emailHint.textContent = isEmailValid(e.target.value) ? '' : 'Enter a valid email.');
  pwdEl.addEventListener('input', e => pwdHint.textContent = isPasswordStrong(e.target.value) ? '' : 'Min 8 chars, upper+lower+num+special');
  confirmEl.addEventListener('input', e => confirmHint.textContent = (e.target.value === pwdEl.value) ? '' : 'Passwords do not match.');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    setFormMessage('', '');

    const fullName = fullNameEl.value.trim();
    const email = emailEl.value.trim();
    const contact = contactEl.value.trim();
    const password = pwdEl.value;
    const confirmPassword = confirmEl.value;

    if (!fullName || !email || !password || !confirmPassword) {
      setFormMessage('Please fill all required fields.', 'error'); return;
    }
    if (!isNameValid(fullName)) { setFormMessage('Name must be letters and spaces only (2-60).','error'); return; }
    if (!isEmailValid(email)) { setFormMessage('Please enter a valid email address.','error'); return; }
    if (password !== confirmPassword) { setFormMessage('Passwords do not match.','error'); return; }
    if (!isPasswordStrong(password)) { setFormMessage('Weak password - use 8+ chars with upper, lower, number & special.','error'); return; }

    registerBtn.disabled = true;
    try {
      const res = await fetch(`${API_PREFIX}/auth/register`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ fullName, email, password, confirmPassword, contact })
      });
      const data = await res.json();
      if (!res.ok) {
        setFormMessage(data.error || 'Registration failed', 'error'); registerBtn.disabled = false; return;
      }
      setFormMessage(data.message || 'Registered. Redirecting...', 'success');
      setTimeout(()=> window.location.href = '/login.html', 900);
    } catch (err) {
      console.error('Register error', err); setFormMessage('Network/server error', 'error'); registerBtn.disabled = false;
    }
  });
})();

// ---------------------- LOGIN ----------------------
(function attachLogin() {
  const form = $('loginForm');
  if (!form) return;

  const emailEl = $('loginEmail');
  const pwdEl = $('loginPassword');
  const toggle = $('loginPwdToggle');
  const loginBtn = $('loginBtn');

  function isEmailValid(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  toggle.addEventListener('click', () => {
    if (pwdEl.type === 'password') { pwdEl.type = 'text'; toggle.textContent = 'Hide pwd'; }
    else { pwdEl.type = 'password'; toggle.textContent = 'Show pwd'; }
  });

  emailEl.addEventListener('input', e => { const h = $('loginEmailHint'); if (h) h.textContent = isEmailValid(e.target.value) ? '' : 'Invalid email'; });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    setFormMessage('', '');

    const email = emailEl.value.trim();
    const password = pwdEl.value;
    if (!email || !password) { setFormMessage('Please enter email & password', 'error'); return; }
    if (!isEmailValid(email)) { setFormMessage('Invalid email format', 'error'); return; }

    loginBtn.disabled = true;
    try {
      const res = await fetch(`${API_PREFIX}/auth/login`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setFormMessage(data.error || 'Login failed', 'error'); loginBtn.disabled = false; return; }
      saveToken(data.token);
      setFormMessage('Login successful. Redirecting...', 'success');
      setTimeout(()=> window.location.href = '/dashboard.html', 600);
    } catch (err) {
      console.error('Login error', err); setFormMessage('Network error', 'error'); loginBtn.disabled = false;
    }
  });
})();

// ---------------------- COMMON HELPERS ----------------------
function ensureAuthRedirect() {
  const token = getToken();
  if (!token) {
    if (!location.pathname.endsWith('/login.html') && !location.pathname.endsWith('/index.html') && location.pathname !== '/') {
      window.location.href = '/login.html';
    }
    return false;
  }
  return true;
}
// escape html
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ---------------------- DASHBOARD / COURSES / PROFILE ----------------------
(async function attachCommon() {
  // logout handler (multiple pages)
  document.querySelectorAll('#logoutBtn').forEach(btn => btn.addEventListener('click', () => { clearAuth(); window.location.href = '/login.html'; }));

  // Dashboard page load
  if (location.pathname.endsWith('/dashboard.html')) {
    if (!ensureAuthRedirect()) return;
    try {
      const profileRes = await fetch(`${API_PREFIX}/auth/profile`, { headers: { Authorization: `Bearer ${getToken()}` }});
      const profile = profileRes.ok ? await profileRes.json() : null;
      $('userGreeting').textContent = profile ? `Hello, ${profile.fullName}` : '';

      const allRes = await fetch(`${API_PREFIX}/courses`);
      const allCourses = allRes.ok ? await allRes.json() : [];
      $('totalCourses').textContent = allCourses.length;

      const myRes = await fetch(`${API_PREFIX}/courses/mycourses`, { headers: { Authorization: `Bearer ${getToken()}` }});
      const myCourses = myRes.ok ? await myRes.json() : [];
      $('courseCount').textContent = myCourses.length;

      const recent = $('recentCourses');
      if (!recent) {}
      if (myCourses.length === 0) {
        if (recent) recent.innerHTML = '<p>No recent registrations.</p>';
      } else {
        if (recent) recent.innerHTML = myCourses.slice(-3).map(c => `<div class="course-card"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.description)}</p></div>`).join('');
      }

      // load all courses into the "courses" container
      const coursesContainer = $('courses');
      if (coursesContainer) {
        coursesContainer.innerHTML = allCourses.map(c => `
          <div class="course-card">
            <h3>${escapeHtml(c.title)}</h3>
            <p>${escapeHtml(c.description)}</p>
            <p><strong>Instructor:</strong> ${escapeHtml(c.instructor)}</p>
            <p><strong>Duration:</strong> ${escapeHtml(c.duration)} weeks</p>
            <button onclick="registerCourse('${c._id}')">Register Course</button>
          </div>
        `).join('');
      }

    } catch (err) {
      console.error('Dashboard load err', err);
    }
  }

  // My Courses page load
  if (location.pathname.endsWith('/mycourses.html')) {
    if (!ensureAuthRedirect()) return;
    const cont = $('myCoursesGrid');
    if (!cont) return;
    try {
      const res = await fetch(`${API_PREFIX}/courses/mycourses`, { headers: { Authorization: `Bearer ${getToken()}` }});
      const arr = res.ok ? await res.json() : [];
      if (!arr.length) { cont.innerHTML = '<p>You have not registered for any courses yet.</p>'; return; }
      cont.innerHTML = arr.map(c => `<div class="course-card"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.description)}</p><p><strong>Instructor:</strong> ${escapeHtml(c.instructor)}</p></div>`).join('');
    } catch (err) { console.error('mycourses err', err); cont.innerHTML = '<p>Error loading</p>'; }
  }

  // Profile page load
  if (location.pathname.endsWith('/profile.html')) {
    if (!ensureAuthRedirect()) return;
    try {
      const res = await fetch(`${API_PREFIX}/auth/profile`, { headers: { Authorization: `Bearer ${getToken()}` }});
      const profile = res.ok ? await res.json() : null;
      if (profile) {
        $('profileName').textContent = profile.fullName;
        $('profileEmail').textContent = profile.email;
        $('profileContact').textContent = profile.contact || '-';
      }
    } catch (err) {
      console.error('profile err', err);
    }
  }

})();

// globally available function to register course
async function registerCourse(courseId) {
  if (!getToken()) { alert('Please login'); window.location.href = '/login.html'; return; }
  try {
    const res = await fetch(`${API_PREFIX}/courses/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ courseId })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Registration failed'); return; }
    alert(data.message || 'Registered successfully');
    // reload counts and lists (simple approach)
    if (location.pathname.endsWith('/dashboard.html')) location.reload();
    if (location.pathname.endsWith('/mycourses.html')) location.reload();
  } catch (err) { console.error('registerCourse error', err); alert('Network error'); }
}
