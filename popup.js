/**
 * Cleopatra Rezervasyon Takipçisi - Popup Logic
 * Clean Code & High Security Implementation
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 1. CONFIGURATION & CONSTANTS
  // ==========================================
  const CONFIG = Object.freeze({
    SUPABASE_URL: 'https://qtccvlqegrhkewxrnazp.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_PtpHnY0rQ3eVToJiNxzkdA_tnQ8hEZS',
    CLEOPATRA_BASE_URL: 'https://t.cleopatraink.com',
    SESSION_KEY: 'cleopatra_session',
    FETCH_TIMEOUT_MS: 15000
  });

  // ==========================================
  // 2. SECURITY & UTILITY MODULE
  // ==========================================
  const SecurityUtils = {
    /**
     * Escapes raw HTML characters to prevent XSS.
     * @param {string} str 
     * @returns {string}
     */
    escapeHTML(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Encodes PostgREST string filter parameter values safely.
     * @param {string} val 
     * @returns {string}
     */
    encodePostgrestVal(val) {
      if (!val) return '""';
      const escaped = String(val).replace(/"/g, '""');
      return `"${encodeURIComponent(escaped)}"`;
    },

    /**
     * Sanitizes and formats phone numbers for WhatsApp.
     * @param {string} phone 
     * @returns {string|null}
     */
    formatWhatsAppPhone(phone) {
      if (!phone) return null;
      let digits = String(phone).replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('0')) {
        digits = '90' + digits.substring(1);
      } else if (digits.length === 10 && digits.startsWith('5')) {
        digits = '90' + digits;
      }
      return digits.length >= 10 ? digits : null;
    },

    /**
     * Validates YYYY-MM-DD date format.
     * @param {string} dateStr 
     * @returns {boolean}
     */
    isValidDateStr(dateStr) {
      return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    }
  };

  // ==========================================
  // 3. SAFE DOM BUILDER MODULE (XSS Prevention)
  // ==========================================
  const DOMUtils = {
    /**
     * Clears all children of a container node safely.
     * @param {HTMLElement} element 
     */
    clear(element) {
      if (!element) return;
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    },

    /**
     * Creates a reservation card node for Cleopatra Sync view.
     * @param {Object} res 
     * @returns {HTMLElement}
     */
    createResCard(res) {
      const card = document.createElement('div');
      card.className = 'res-card';

      const topRow = document.createElement('div');
      topRow.className = 'res-card-top';

      const nameEl = document.createElement('strong');
      nameEl.textContent = res.CustomerNameSurname || 'Bilinmeyen Müşteri';

      const badgeEl = document.createElement('span');
      badgeEl.className = 'badge-active';
      badgeEl.textContent = 'Aktif';

      topRow.appendChild(nameEl);
      topRow.appendChild(badgeEl);

      const detailRow = document.createElement('div');
      detailRow.className = 'res-card-detail';

      const resNo = res.ReservationNumber || res.ReservationId || res.Id || '-';
      const dateStr = res.StartDate || res.Date || '-';
      const phone = res.Phone || '-';

      const resNoSpan = document.createElement('span');
      resNoSpan.textContent = `🔢 ${resNo}`;

      const dateSpan = document.createElement('span');
      dateSpan.textContent = `📅 ${dateStr}`;

      const phoneSpan = document.createElement('span');
      phoneSpan.textContent = `📞 ${phone}`;

      detailRow.appendChild(resNoSpan);
      detailRow.appendChild(dateSpan);
      detailRow.appendChild(phoneSpan);

      card.appendChild(topRow);
      card.appendChild(detailRow);

      return card;
    },

    /**
     * Creates a reservation card node for Supabase Management view.
     * @param {Object} rec 
     * @param {boolean} isSelected 
     * @param {Function} onCbChange 
     * @param {Function} onEdit 
     * @param {Function} onDelete 
     * @returns {HTMLElement}
     */
    createManageCard(rec, isSelected, onCbChange, onEdit, onDelete) {
      const card = document.createElement('div');
      card.className = `manage-card ${isSelected ? 'selected' : ''}`;
      card.dataset.id = rec.ReservationNumber;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'row-cb';
      checkbox.checked = isSelected;
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
        onCbChange(rec.ReservationNumber, e.target.checked);
      });

      const body = document.createElement('div');
      body.className = 'manage-card-body';

      const header = document.createElement('div');
      header.className = 'manage-card-header';

      const title = document.createElement('span');
      title.className = 'manage-card-title';
      title.textContent = rec.CustomerNameSurname || 'İsimsiz';

      const actions = document.createElement('div');
      actions.className = 'manage-card-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn edit-btn';
      editBtn.title = 'Düzenle';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onEdit(rec);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'icon-btn delete-btn';
      deleteBtn.title = 'Sil';
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(rec.ReservationNumber);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      header.appendChild(title);
      header.appendChild(actions);

      const detail = document.createElement('div');
      detail.className = 'res-card-detail';

      const resNoSpan = document.createElement('span');
      resNoSpan.textContent = `🔢 ${rec.ReservationNumber}`;

      const dateSpan = document.createElement('span');
      dateSpan.textContent = `📅 ${rec.StartDate || '-'}`;

      const phoneSpan = document.createElement('span');
      phoneSpan.textContent = `📞 ${rec.Phone || '-'}`;

      detail.appendChild(resNoSpan);
      detail.appendChild(dateSpan);
      detail.appendChild(phoneSpan);

      body.appendChild(header);
      body.appendChild(detail);

      card.appendChild(checkbox);
      card.appendChild(body);

      return card;
    }
  };

  // ==========================================
  // 4. DIALOG & TOAST UI NOTIFICATIONS MODULE
  // ==========================================
  const UINotifier = {
    toastContainer: document.getElementById('toast-container'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmTitle: document.getElementById('confirm-modal-title'),
    confirmBody: document.getElementById('confirm-modal-body'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
    confirmOkBtn: document.getElementById('confirm-ok-btn'),
    closeConfirmModalBtn: document.getElementById('close-confirm-modal'),

    showToast(message, type = 'info', duration = 3000) {
      if (!this.toastContainer) return;
      const toast = document.createElement('div');
      toast.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
      toast.style.display = 'block';
      toast.style.margin = '0';
      toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
      toast.style.pointerEvents = 'auto';
      toast.style.animation = 'fadeIn 0.2s ease-in-out';
      toast.textContent = message;

      this.toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    confirm({ title = 'Onay', message = 'Bu işlemi gerçekleştirmek istediğinize emin misiniz?', okText = 'Evet', cancelText = 'İptal', isDanger = true }) {
      return new Promise((resolve) => {
        this.confirmTitle.textContent = title;
        this.confirmBody.textContent = message;
        this.confirmOkBtn.textContent = okText;
        this.confirmCancelBtn.textContent = cancelText;

        if (isDanger) {
          this.confirmOkBtn.className = 'btn-primary btn-danger';
        } else {
          this.confirmOkBtn.className = 'btn-primary';
        }

        const cleanup = () => {
          this.confirmModal.classList.remove('active');
          this.confirmOkBtn.removeEventListener('click', onOk);
          this.confirmCancelBtn.removeEventListener('click', onCancel);
          this.closeConfirmModalBtn.removeEventListener('click', onCancel);
        };

        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        this.confirmOkBtn.addEventListener('click', onOk);
        this.confirmCancelBtn.addEventListener('click', onCancel);
        this.closeConfirmModalBtn.addEventListener('click', onCancel);

        this.confirmModal.classList.add('active');
      });
    }
  };

  // ==========================================
  // 5. SUPABASE SERVICE LAYER
  // ==========================================
  const SupabaseService = {
    async login(email, password) {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_description || data.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
      return data;
    },

    async refreshToken(refreshToken) {
      try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: {
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (err) {
        // Network error vs auth error handling
        throw new Error('Ağ hatası: Oturum yenilenemedi.');
      }
    },

    async checkSubscription(accessToken) {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/profiles?select=subscription_end_date,is_active`, {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error('Abonelik bilgisi doğrulanamadı: ' + errText);
      }

      const rows = await res.json();
      if (!rows || rows.length === 0) {
        throw new Error('Kullanıcı profili bulunamadı. Lütfen sistem yöneticinizle iletişime geçin.');
      }

      const profile = rows[0];
      if (!profile.is_active) {
        throw new Error('Hesabınız pasif duruma alınmıştır. Lütfen yönetici ile iletişime geçin.');
      }

      const endDate = new Date(profile.subscription_end_date);
      const now = new Date();
      if (endDate < now) {
        throw new Error('Abonelik süreniz dolmuştur. Kullanıma devam etmek için yenileyin.');
      }

      return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    },

    async saveSession(session) {
      return new Promise(resolve => chrome.storage.local.set({ [CONFIG.SESSION_KEY]: session }, resolve));
    },

    async clearSession() {
      return new Promise(resolve => chrome.storage.local.remove(CONFIG.SESSION_KEY, resolve));
    },

    async loadSession() {
      return new Promise(resolve => {
        chrome.storage.local.get(CONFIG.SESSION_KEY, result => {
          resolve(result[CONFIG.SESSION_KEY] || null);
        });
      });
    },

    async getValidAccessToken() {
      const session = await this.loadSession();
      if (!session) return null;

      let accessToken = session.access_token;
      const tokenExpiry = session.expires_at ? session.expires_at * 1000 : 0;

      if (Date.now() > tokenExpiry - 60000) {
        try {
          const refreshed = await this.refreshToken(session.refresh_token);
          if (!refreshed) {
            await this.clearSession();
            UIManager.showScreen('login');
            return null;
          }
          accessToken = refreshed.access_token;
          await this.saveSession({ ...refreshed, user: session.user });
        } catch (netErr) {
          // If network error occurred during refresh, return current token or throw network alert
          console.warn('Network error during refresh token attempt:', netErr);
        }
      }
      return accessToken;
    },

    async upsertReservations(dataArray, accessToken) {
      const session = await this.loadSession();
      const userId = session?.user?.id || null;

      const records = dataArray
        .map(res => ({
          ReservationNumber: String(res.ReservationNumber || res.ReservationId || res.Id || '').trim(),
          CustomerNameSurname: String(res.CustomerNameSurname || 'Bilinmeyen Müşteri').trim(),
          Phone: String(res.Phone || '-').trim(),
          StartDate: String(res.StartDate || res.Date || '-').trim(),
          ...(userId ? { user_id: userId } : {})
        }))
        .filter(r => r.ReservationNumber !== '');

      if (records.length === 0) {
        return { saved: 0, total: dataArray.length };
      }

      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/reservations?on_conflict=ReservationNumber`, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(records)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase Senkronizasyon Hatası (${res.status}): ${errText}`);
      }

      const savedData = await res.json();
      return { saved: Array.isArray(savedData) ? savedData.length : records.length, total: dataArray.length };
    },

    async fetchAllReservations(accessToken) {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/reservations?select=*`, {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase Veri Okuma Hatası (${res.status}): ${errText}`);
      }

      return await res.json();
    },

    async deleteSingleReservation(reservationNumber, accessToken) {
      const encodedResNo = encodeURIComponent(reservationNumber);
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/reservations?ReservationNumber=eq.${encodedResNo}`, {
        method: 'DELETE',
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        throw new Error(`Silme işlemi başarısız oldu (Status: ${res.status}).`);
      }
    },

    async deleteBulkReservations(reservationNumbers, accessToken) {
      if (!reservationNumbers || reservationNumbers.length === 0) return;
      const formattedFilter = reservationNumbers
        .map(id => `"${String(id).replace(/"/g, '""')}"`)
        .join(',');
      
      const encodedFilter = encodeURIComponent(formattedFilter);
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/reservations?ReservationNumber=in.(${encodedFilter})`, {
        method: 'DELETE',
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        throw new Error(`Toplu silme işlemi başarısız oldu (Status: ${res.status}).`);
      }
    },

    async updateReservation(reservationNumber, payload, accessToken) {
      const encodedResNo = encodeURIComponent(reservationNumber);
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/reservations?ReservationNumber=eq.${encodedResNo}`, {
        method: 'PATCH',
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Güncelleme başarısız oldu (Status: ${res.status}).`);
      }
    }
  };

  // ==========================================
  // 6. CLEOPATRA SERVICE LAYER
  // ==========================================
  const CleopatraService = {
    async fetchReservations(startDate, endDate) {
      if (!startDate || !endDate) {
        throw new Error('Lütfen başlangıç ve bitiş tarihlerini seçiniz.');
      }
      if (!SecurityUtils.isValidDateStr(startDate) || !SecurityUtils.isValidDateStr(endDate)) {
        throw new Error('Geçersiz tarih formatı.');
      }

      const encodedStart = encodeURIComponent(startDate);
      const encodedEnd = encodeURIComponent(endDate);
      const targetUrl = `${CONFIG.CLEOPATRA_BASE_URL}/Reservations/Reservations_Read?BranchId=0&StartDate=${encodedStart}&EndDate=${encodedEnd}&sort=&page=1&pageSize=1000&group=&filter=`;

      let response;
      let responseText = '';
      let isHtml = false;

      try {
        response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include'
        });

        responseText = await response.text();
        const contentType = response.headers.get('content-type') || '';
        isHtml = response.redirected || responseText.trim().startsWith('<') || responseText.includes('<!DOCTYPE') || contentType.includes('text/html');
      } catch (getErr) {
        console.warn('[CleopatraService] GET request failed:', getErr);
        isHtml = true;
      }

      // Fallback: If GET returned HTML or failed, try POST with form body
      if (isHtml || !response || !response.ok) {
        try {
          const postResponse = await fetch(`${CONFIG.CLEOPATRA_BASE_URL}/Reservations/Reservations_Read`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json, text/javascript, */*; q=0.01',
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: `BranchId=0&StartDate=${encodedStart}&EndDate=${encodedEnd}&sort=&page=1&pageSize=1000&group=&filter=`
          });

          if (postResponse.ok) {
            const postText = await postResponse.text();
            const postContentType = postResponse.headers.get('content-type') || '';
            if (!postText.trim().startsWith('<') && !postText.includes('<!DOCTYPE') && !postContentType.includes('text/html')) {
              responseText = postText;
              isHtml = false;
              response = postResponse;
            }
          }
        } catch (postErr) {
          console.warn('[CleopatraService] POST fallback failed:', postErr);
        }
      }

      if (isHtml || (response && response.redirected)) {
        throw new Error('Cleopatra portalı (t.cleopatraink.com) oturumunuz kapalı veya süresi dolmuş. Lütfen tarayıcınızda t.cleopatraink.com sayfasına gidip giriş yapın ve tekrar deneyin.');
      }

      if (!response || !response.ok) {
        if (response && (response.status === 401 || response.status === 403)) {
          throw new Error('Cleopatra oturumu sona erdi. Lütfen t.cleopatraink.com portalından tekrar giriş yapın.');
        }
        throw new Error(`Cleopatra API Yanıt Hatası (${response ? response.status : 'Bağlantı Yok'})`);
      }

      try {
        const rawData = JSON.parse(responseText);
        return rawData.Data || rawData.data || (Array.isArray(rawData) ? rawData : []);
      } catch (parseErr) {
        throw new Error('Cleopatra portalından geçersiz veri alındı. Lütfen t.cleopatraink.com portalında oturumunuzun açık olduğunu kontrol edin.');
      }
    }
  };

  // ==========================================
  // 7. CENTRAL APP STATE MANAGER
  // ==========================================
  const AppState = {
    fetchedSupabaseRecords: [],
    selectedRecordIds: new Set(),

    setRecords(records) {
      this.fetchedSupabaseRecords = records || [];
    },

    toggleSelectAll(isChecked, query = '') {
      const q = query.trim().toLowerCase();
      this.fetchedSupabaseRecords.forEach(r => {
        const nameMatch = (r.CustomerNameSurname || '').toLowerCase().includes(q);
        const phoneMatch = (r.Phone || '').toLowerCase().includes(q);
        const resNoMatch = (r.ReservationNumber || '').toLowerCase().includes(q);

        if (nameMatch || phoneMatch || resNoMatch) {
          if (isChecked) {
            this.selectedRecordIds.add(r.ReservationNumber);
          } else {
            this.selectedRecordIds.delete(r.ReservationNumber);
          }
        }
      });
    },

    updateSelection(resNo, isSelected) {
      if (isSelected) {
        this.selectedRecordIds.add(resNo);
      } else {
        this.selectedRecordIds.delete(resNo);
      }
    },

    clearSelection() {
      this.selectedRecordIds.clear();
    },

    removeRecord(resNo) {
      this.selectedRecordIds.delete(resNo);
      this.fetchedSupabaseRecords = this.fetchedSupabaseRecords.filter(r => r.ReservationNumber !== resNo);
    },

    removeBulkRecords(resNoArray) {
      const setToRemove = new Set(resNoArray);
      resNoArray.forEach(id => this.selectedRecordIds.delete(id));
      this.fetchedSupabaseRecords = this.fetchedSupabaseRecords.filter(r => !setToRemove.has(r.ReservationNumber));
    }
  };

  // ==========================================
  // 8. UI MANAGER & CONTROLLER
  // ==========================================
  const UIManager = {
    // DOM Elements
    loginScreen: document.getElementById('login-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    loginForm: document.getElementById('login-form'),
    loginBtn: document.getElementById('login-btn'),
    loginError: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
    openDashboardBtn: document.getElementById('open-dashboard-btn'),
    subInfoText: document.getElementById('sub-info-text'),

    tabCleopatraBtn: document.getElementById('tab-cleopatra-btn'),
    tabSupabaseBtn: document.getElementById('tab-supabase-btn'),
    viewCleopatra: document.getElementById('view-cleopatra'),
    viewSupabase: document.getElementById('view-supabase'),

    startDatePicker: document.getElementById('start-date'),
    endDatePicker: document.getElementById('end-date'),
    fetchBtn: document.getElementById('fetch-btn'),
    resultsDiv: document.getElementById('results'),
    resultsWrap: document.getElementById('results-wrap'),
    loadingDiv: document.getElementById('loading'),
    errorMsgDiv: document.getElementById('error-msg'),
    saveMsgDiv: document.getElementById('save-msg'),
    resultSummary: document.getElementById('result-summary'),

    supabaseSearch: document.getElementById('supabase-search'),
    selectAllCb: document.getElementById('select-all-cb'),
    btnBulkMsg: document.getElementById('btn-bulk-msg'),
    btnBulkDelete: document.getElementById('btn-bulk-delete'),
    selectedCountEl: document.getElementById('selected-count'),
    supabaseList: document.getElementById('supabase-list'),
    supabaseLoading: document.getElementById('supabase-loading'),
    supabaseAlert: document.getElementById('supabase-alert'),

    editModal: document.getElementById('edit-modal'),
    closeEditModal: document.getElementById('close-edit-modal'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    editForm: document.getElementById('edit-form'),
    editIdInput: document.getElementById('edit-id'),
    editResNoInput: document.getElementById('edit-res-no'),
    editNameInput: document.getElementById('edit-name'),
    editPhoneInput: document.getElementById('edit-phone'),
    editDateInput: document.getElementById('edit-date'),

    msgModal: document.getElementById('msg-modal'),
    closeMsgModal: document.getElementById('close-msg-modal'),
    msgTargetCountEl: document.getElementById('msg-target-count'),
    msgTemplateInput: document.getElementById('msg-template-input'),
    msgPreview: document.getElementById('msg-preview'),
    copyMsgBtn: document.getElementById('copy-msg-btn'),
    sendWhatsappBtn: document.getElementById('send-whatsapp-btn'),

    showScreen(name) {
      this.loginScreen.style.display = (name === 'login') ? 'flex' : 'none';
      this.dashboardScreen.style.display = (name === 'dashboard') ? 'block' : 'none';
    },

    showLoginError(msg) {
      this.loginError.textContent = msg;
      this.loginError.style.display = 'block';
    },

    clearLoginError() {
      this.loginError.textContent = '';
      this.loginError.style.display = 'none';
    },

    renderSubscriptionInfo(email, daysLeft) {
      this.subInfoText.textContent = `✦ ${email} · ${daysLeft} gün kaldı`;
      this.subInfoText.className = 'sub-badge';
      if (daysLeft <= 7) this.subInfoText.classList.add('warning');
      if (daysLeft <= 0) this.subInfoText.classList.add('expired');
    },

    updateBulkToolbarState() {
      const count = AppState.selectedRecordIds.size;
      this.selectedCountEl.textContent = count;
      this.btnBulkMsg.disabled = count === 0;
      this.btnBulkDelete.disabled = count === 0;
    },

    renderSupabaseList() {
      DOMUtils.clear(this.supabaseList);
      const query = this.supabaseSearch.value.trim().toLowerCase();

      const filtered = AppState.fetchedSupabaseRecords.filter(r => {
        const nameMatch = (r.CustomerNameSurname || '').toLowerCase().includes(query);
        const phoneMatch = (r.Phone || '').toLowerCase().includes(query);
        const resNoMatch = (r.ReservationNumber || '').toLowerCase().includes(query);
        return nameMatch || phoneMatch || resNoMatch;
      });

      if (filtered.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.color = '#475569';
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '20px';
        emptyDiv.style.fontSize = '0.8rem';
        emptyDiv.textContent = 'Kayıt bulunamadı.';
        this.supabaseList.appendChild(emptyDiv);
        return;
      }

      filtered.forEach(rec => {
        const isSelected = AppState.selectedRecordIds.has(rec.ReservationNumber);
        const cardNode = DOMUtils.createManageCard(
          rec,
          isSelected,
          (resNo, checked) => {
            AppState.updateSelection(resNo, checked);
            this.updateBulkToolbarState();
          },
          (recordToEdit) => this.openEditModal(recordToEdit),
          (resNoToDelete) => this.handleSingleDelete(resNoToDelete)
        );
        this.supabaseList.appendChild(cardNode);
      });

      this.selectAllCb.checked = filtered.length > 0 && filtered.every(r => AppState.selectedRecordIds.has(r.ReservationNumber));
    },

    async loadSupabaseReservations() {
      DOMUtils.clear(this.supabaseList);
      this.supabaseAlert.style.display = 'none';
      this.supabaseLoading.style.display = 'block';
      AppState.clearSelection();
      this.updateBulkToolbarState();

      try {
        const accessToken = await SupabaseService.getValidAccessToken();
        if (!accessToken) return;

        const records = await SupabaseService.fetchAllReservations(accessToken);
        AppState.setRecords(records);
        this.supabaseLoading.style.display = 'none';
        this.renderSupabaseList();
      } catch (err) {
        this.supabaseLoading.style.display = 'none';
        this.supabaseAlert.className = 'alert alert-error';
        this.supabaseAlert.textContent = err.message;
        this.supabaseAlert.style.display = 'block';
      }
    },

    openEditModal(rec) {
      this.editIdInput.value = rec.ReservationNumber;
      this.editResNoInput.value = rec.ReservationNumber;
      this.editNameInput.value = rec.CustomerNameSurname || '';
      this.editPhoneInput.value = rec.Phone || '';
      this.editDateInput.value = rec.StartDate || '';
      this.editModal.classList.add('active');
    },

    closeEditModalFunc() {
      this.editModal.classList.remove('active');
    },

    async handleSingleDelete(reservationNumber) {
      const confirmed = await UINotifier.confirm({
        title: 'Rezervasyon Sil',
        message: `${reservationNumber} numaralı rezervasyon kaydını silmek istediğinize emin misiniz?`,
        okText: 'Sil',
        cancelText: 'Vazgeç',
        isDanger: true
      });

      if (!confirmed) return;

      try {
        const accessToken = await SupabaseService.getValidAccessToken();
        if (!accessToken) return;

        await SupabaseService.deleteSingleReservation(reservationNumber, accessToken);
        AppState.removeRecord(reservationNumber);
        this.renderSupabaseList();
        this.updateBulkToolbarState();
        UINotifier.showToast('Kayıt başarıyla silindi.', 'success');
      } catch (err) {
        UINotifier.showToast(err.message, 'error');
      }
    },

    resolveTemplate(templateStr, rec) {
      if (!rec) return templateStr;
      return templateStr
        .replace(/{MusteriAdi}/g, rec.CustomerNameSurname || '')
        .replace(/{Telefon}/g, rec.Phone || '')
        .replace(/{Tarih}/g, rec.StartDate || '')
        .replace(/{RezervasyonNo}/g, rec.ReservationNumber || '');
    },

    updateMsgPreview() {
      const template = this.msgTemplateInput.value || 'Merhaba {MusteriAdi}...';
      const firstSelectedId = Array.from(AppState.selectedRecordIds)[0];
      const sampleRecord = AppState.fetchedSupabaseRecords.find(r => r.ReservationNumber === firstSelectedId) || {
        CustomerNameSurname: 'Ahmet Yılmaz',
        Phone: '5551234567',
        StartDate: '2026-07-25',
        ReservationNumber: 'REZ-99'
      };

      this.msgPreview.textContent = this.resolveTemplate(template, sampleRecord);
    },

    bindEvents() {
      // Tab Navigation
      this.tabCleopatraBtn.addEventListener('click', () => {
        this.tabCleopatraBtn.classList.add('active');
        this.tabSupabaseBtn.classList.remove('active');
        this.viewCleopatra.style.display = 'block';
        this.viewSupabase.style.display = 'none';
      });

      this.tabSupabaseBtn.addEventListener('click', () => {
        this.tabSupabaseBtn.classList.add('active');
        this.tabCleopatraBtn.classList.remove('active');
        this.viewCleopatra.style.display = 'none';
        this.viewSupabase.style.display = 'block';
        this.loadSupabaseReservations();
      });

      // Login Form
      this.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        this.clearLoginError();
        this.loginBtn.disabled = true;
        this.loginBtn.textContent = 'Giriş yapılıyor...';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
          const authData = await SupabaseService.login(email, password);
          await SupabaseService.saveSession(authData);

          const daysLeft = await SupabaseService.checkSubscription(authData.access_token);
          this.renderSubscriptionInfo(email, daysLeft);
          this.showScreen('dashboard');
          UINotifier.showToast('Giriş başarılı!', 'success');
        } catch (err) {
          this.showLoginError(err.message);
        } finally {
          this.loginBtn.disabled = false;
          this.loginBtn.textContent = 'Giriş Yap';
        }
      });

      // Logout Button
      this.logoutBtn.addEventListener('click', async () => {
        await SupabaseService.clearSession();
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        this.showScreen('login');
        UINotifier.showToast('Oturum kapatıldı.', 'info');
      });

      // Open Full Dashboard Button
      if (this.openDashboardBtn) {
        this.openDashboardBtn.addEventListener('click', () => {
          if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: 'dashboard.html' });
          } else {
            window.open('dashboard.html', '_blank');
          }
        });
      }

      // Cleopatra Sync Fetch Button
      this.fetchBtn.addEventListener('click', async () => {
        const startDate = this.startDatePicker.value;
        const endDate = this.endDatePicker.value;
        if (!startDate || !endDate) {
          UINotifier.showToast('Lütfen başlangıç ve bitiş tarihlerini seçiniz.', 'error');
          return;
        }

        DOMUtils.clear(this.resultsDiv);
        this.errorMsgDiv.style.display = 'none';
        this.saveMsgDiv.style.display = 'none';
        this.resultSummary.style.display = 'none';
        this.loadingDiv.style.display = 'block';
        this.fetchBtn.disabled = true;

        try {
          const accessToken = await SupabaseService.getValidAccessToken();
          const data = await CleopatraService.fetchReservations(startDate, endDate);

          this.loadingDiv.style.display = 'none';
          this.fetchBtn.disabled = false;

          if (data && Array.isArray(data) && data.length > 0) {
            const saveResult = await SupabaseService.upsertReservations(data, accessToken);
            this.saveMsgDiv.textContent = `✓ ${saveResult.saved} kayıt Supabase ile senkronize edildi (Toplam ${saveResult.total}).`;
            this.saveMsgDiv.style.display = 'block';

            this.resultSummary.textContent = `${data.length} rezervasyon listelendi`;
            this.resultsWrap.style.display = 'block';

            data.forEach(res => {
              const card = DOMUtils.createResCard(res);
              this.resultsDiv.appendChild(card);
            });
          } else {
            this.resultsWrap.style.display = 'block';
            const emptyNotice = document.createElement('div');
            emptyNotice.style.color = '#475569';
            emptyNotice.style.textAlign = 'center';
            emptyNotice.style.padding = '24px';
            emptyNotice.style.fontSize = '0.82rem';
            emptyNotice.textContent = 'Bu tarih aralığında rezervasyon bulunamadı.';
            this.resultsDiv.appendChild(emptyNotice);
          }
        } catch (error) {
          this.loadingDiv.style.display = 'none';
          this.fetchBtn.disabled = false;
          this.errorMsgDiv.textContent = error.message;
          this.errorMsgDiv.style.display = 'block';
        }
      });

      // Search & Select All
      this.supabaseSearch.addEventListener('input', () => this.renderSupabaseList());

      this.selectAllCb.addEventListener('change', (e) => {
        AppState.toggleSelectAll(e.target.checked, this.supabaseSearch.value);
        this.renderSupabaseList();
        this.updateBulkToolbarState();
      });

      // Bulk Delete
      this.btnBulkDelete.addEventListener('click', async () => {
        const selectedIds = Array.from(AppState.selectedRecordIds);
        if (selectedIds.length === 0) return;

        const confirmed = await UINotifier.confirm({
          title: 'Toplu Silme Onayı',
          message: `Seçili ${selectedIds.length} adet rezervasyon kaydını silmek istediğinize emin misiniz?`,
          okText: 'Sil',
          cancelText: 'İptal',
          isDanger: true
        });

        if (!confirmed) return;

        try {
          const accessToken = await SupabaseService.getValidAccessToken();
          if (!accessToken) return;

          await SupabaseService.deleteBulkReservations(selectedIds, accessToken);
          AppState.removeBulkRecords(selectedIds);
          this.renderSupabaseList();
          this.updateBulkToolbarState();
          UINotifier.showToast(`${selectedIds.length} adet kayıt silindi.`, 'success');
        } catch (err) {
          UINotifier.showToast('Toplu silme hatası: ' + err.message, 'error');
        }
      });

      // Edit Modal Handlers
      this.closeEditModal.addEventListener('click', () => this.closeEditModalFunc());
      this.cancelEditBtn.addEventListener('click', () => this.closeEditModalFunc());

      this.editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const resNo = this.editIdInput.value;
        const name = this.editNameInput.value.trim();
        const phone = this.editPhoneInput.value.trim();
        const date = this.editDateInput.value.trim();

        if (!name || !phone || !date) {
          UINotifier.showToast('Lütfen tüm zorunlu alanları doldurunuz.', 'error');
          return;
        }

        try {
          const accessToken = await SupabaseService.getValidAccessToken();
          if (!accessToken) return;

          await SupabaseService.updateReservation(resNo, {
            CustomerNameSurname: name,
            Phone: phone,
            StartDate: date
          }, accessToken);

          const target = AppState.fetchedSupabaseRecords.find(r => r.ReservationNumber === resNo);
          if (target) {
            target.CustomerNameSurname = name;
            target.Phone = phone;
            target.StartDate = date;
          }

          this.renderSupabaseList();
          this.closeEditModalFunc();
          UINotifier.showToast('Kayıt başarıyla güncellendi.', 'success');
        } catch (err) {
          UINotifier.showToast('Güncelleme Hatası: ' + err.message, 'error');
        }
      });

      // Bulk Message & Modal Handlers
      this.btnBulkMsg.addEventListener('click', () => {
        const count = AppState.selectedRecordIds.size;
        if (count === 0) return;
        this.msgTargetCountEl.textContent = count;
        this.updateMsgPreview();
        this.msgModal.classList.add('active');
      });

      this.closeMsgModal.addEventListener('click', () => {
        this.msgModal.classList.remove('active');
      });

      document.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const tag = chip.dataset.tag;
          if (tag) {
            this.msgTemplateInput.value += tag;
            this.updateMsgPreview();
          }
        });
      });

      this.msgTemplateInput.addEventListener('input', () => this.updateMsgPreview());

      this.copyMsgBtn.addEventListener('click', () => {
        const textToCopy = this.msgPreview.textContent;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
          UINotifier.showToast('Mesaj metni panoya kopyalandı!', 'success');
        }).catch(err => {
          UINotifier.showToast('Kopyalama başarısız: ' + err.message, 'error');
        });
      });

      this.sendWhatsappBtn.addEventListener('click', () => {
        const template = this.msgTemplateInput.value;
        const selectedIds = Array.from(AppState.selectedRecordIds);

        if (selectedIds.length === 0) return;

        let openedCount = 0;
        selectedIds.forEach((id, index) => {
          const rec = AppState.fetchedSupabaseRecords.find(r => r.ReservationNumber === id);
          if (!rec || !rec.Phone) return;

          const formattedPhone = SecurityUtils.formatWhatsAppPhone(rec.Phone);
          if (!formattedPhone) return;

          const messageText = this.resolveTemplate(template, rec);
          const encodedMsg = encodeURIComponent(messageText);
          const waUrl = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;

          setTimeout(() => {
            window.open(waUrl, '_blank');
          }, index * 400);

          openedCount++;
        });

        if (openedCount > 0) {
          UINotifier.showToast(`${openedCount} kişi için WhatsApp sohbeti başlatıldı.`, 'success');
        } else {
          UINotifier.showToast('Seçilen kayıtlarda geçerli telefon numarası bulunamadı.', 'error');
        }

        this.msgModal.classList.remove('active');
      });
    },

    async init() {
      // Default dates
      const todayStr = new Date().toISOString().split('T')[0];
      if (this.startDatePicker) this.startDatePicker.value = todayStr;
      if (this.endDatePicker) this.endDatePicker.value = todayStr;

      this.bindEvents();

      // Check Session on startup
      const session = await SupabaseService.loadSession();
      if (session) {
        try {
          const accessToken = await SupabaseService.getValidAccessToken();
          if (accessToken) {
            const daysLeft = await SupabaseService.checkSubscription(accessToken);
            this.renderSubscriptionInfo(session.user?.email || '', daysLeft);
            this.showScreen('dashboard');
          }
        } catch (e) {
          console.warn('Session initialization warning:', e.message);
          await SupabaseService.clearSession();
          this.showScreen('login');
        }
      } else {
        this.showScreen('login');
      }
    }
  };

  // Start Application
  UIManager.init();
});
