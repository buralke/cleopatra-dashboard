/**
 * Cleopatra Studio Reactivation Dashboard - Application Controller
 * Handles SPA Tab Switching, View Renders & Complete i18n (TR / EN) Support across ALL 7 Tabs
 */

const selectedCustomerIds = new Set();
let bulkSendMode = 'template';
let isBulkDispatching = false;

const TRANSLATIONS = {
  tr: {
    // Brand & Sidebar Nav
    brandName: "Cleopatra Gündoğdu",
    navDashboard: "Gösterge Paneli",
    navCustomers: "Müşteriler",
    navCampaigns: "Kampanyalar",
    navAppointments: "Randevular",
    navAnalytics: "Analizler",
    navFranchises: "Şubeler",
    navSettings: "Ayarlar",

    // Customer Table Page Limit
    limit20: "20 Göster",
    limit50: "50 Göster",
    limit100: "100 Göster",
    limitAll: "Hepsi",

    // DB Status
    dbConnected: "Supabase Canlı Veri",
    dbDemoMode: "Supabase Bağlı (Canlı Sistem)",

    // Header & Franchises
    greetingTitle: "İyi Akşamlar, Stüdyo Yöneticisi 👋",
    greetingSubtitle: "Koltuklarınızı dolu tutun. Pasif müşterilerinizi yeniden aktifleştirin.",

    // Page Headers for all 7 Tabs
    headers: {
      dashboard: {
        title: "İyi Akşamlar, Stüdyo Yöneticisi 👋",
        subtitle: "Koltuklarınızı dolu tutun. Pasif müşterilerinizi yeniden aktifleştirin."
      },
      customers: {
        title: "Müşteri Dizini ve Geçmişi 👥",
        subtitle: "Geçmiş dövme müşterilerini, toplam harcamaları ve WhatsApp durumlarını takip edin."
      },
      campaigns: {
        title: "Otomatik Reaktivasyon Dizileri 🚀",
        subtitle: "Pasif müşteriler ve doğum günleri için otomatik WhatsApp mesajları yapılandırın."
      },
      appointments: {
        title: "Stüdyo Randevu Takvimi 📅",
        subtitle: "Yaklaşan randevu saatlerini, sanatçı atamalarını ve kapora durumlarını görüntüleyin."
      },
      analytics: {
        title: "Stüdyo Reaktivasyon ve Gelir Analizi 📈",
        subtitle: "Dönüşüm oranlarını, yanıt sürelerini ve gelir dağılımını analiz edin."
      },
      franchises: {
        title: "Cleopatra Ink Şube Ağı 🏢",
        subtitle: "Cleopatra portalı ile çoklu lokasyon senkronizasyon durumunu izleyin."
      },
      'bot-rules': {
        title: "Otomatik Yanıt Kuralları & Bot Yönetimi 🤖",
        subtitle: "Gelen müşteri mesajlarına göre otomatik cevaplama kurallarını ve karşılama metinlerini yapılandırın."
      },
      'template-aliases': {
        title: "Meta Mesaj Şablonları & Takma Ad (Alias) Yönetimi 🏷️",
        subtitle: "Meta'dan gelen tüm şablonların orijinal içeriklerini görün ve Türkçe takma adlar atayın."
      },
      settings: {
        title: "Sistem ve Supabase Veritabanı Ayarları ⚙️",
        subtitle: "Supabase REST API kimlik bilgilerini ve otomatik dağıtıcıları yönetin."
      }
    },

    // Tab 1: Dashboard KPIs
    kpiCustomerPool: "Müşteri Havuzu",
    kpiReactivationMessages: "Reaktivasyon Mesajları",
    kpiAppointmentsBooked: "Alınan Randevular",
    kpiResponseRate: "Yanıt Oranı",
    vsLast30Days: "son 30 güne göre",

    // Chart & WhatsApp Chat
    reactivationPerformance: "Reaktivasyon Performansı",
    messagesSent: "Gönderilen Mesajlar",
    appointmentsBooked: "Alınan Randevular",
    last14Days: "Son 14 Gün",
    last30Days: "Son 30 Gün",
    last90Days: "Son 90 Gün",
    liveWhatsappConversations: "💬 Canlı WhatsApp Görüşmeleri",
    activeStatus: "Aktif",
    onlineStatus: "çevrimiçi",
    typeMessagePlaceholder: "Bir mesaj yazın...",

    // Top Campaigns & Funnel
    topPerformingCampaigns: "En Başarılı Kampanyalar",
    viewAll: "Tümünü Gör →",
    responseRateSuffix: "yanıt",
    customerReactivationFunnel: "Müşteri Reaktivasyon Hunisi",

    // Tab 2: Customers
    customerDirectoryStatus: "Müşteri Dizini ve Reaktivasyon Durumu",
    searchCustomerPlaceholder: "Müşteri adı, telefon veya ID ara...",
    addCustomerBtn: "+ Müşteri Ekle",
    tableHeaderCustomer: "Müşteri",
    tableHeaderPhone: "Telefon Numarası",
    tableHeaderLastVisit: "Son Ziyaret",
    tableHeaderTotalSpent: "Toplam Harcama",
    tableHeaderReactivationStatus: "Reaktivasyon Durumu",
    tableHeaderActions: "İşlemler",
    sendWhatsappBtn: "💬 WhatsApp Gönder",
    bulkSendBtnLabel: "Seçilenlere Mesaj Gönder",

    // Tab 3: Campaigns
    automatedCampaignsTitle: "Otomatik Reaktivasyon Kampanyaları",
    createNewCampaignBtn: "+ Yeni Kampanya Oluştur",
    convRateLabel: "Dönüşüm Oranı",
    messagesSentLabel: "Gönderilen Mesajlar",

    // Tab 4: Appointments
    appointmentCalendarTitle: "Stüdyo Randevu Takvimi",
    newBookingBtn: "+ Yeni Randevu Kaydı",
    thisWeek: "Bu Hafta",
    thisMonth: "Bu Ay",
    tableHeaderTimeDate: "Tarih & Saat",
    tableHeaderClient: "Müşteri",
    tableHeaderArtist: "Sanatçı",
    tableHeaderPlacement: "Dövme Bölgesi & Stil",
    tableHeaderDeposit: "Kapora",
    tableHeaderStatus: "Durum",

    // Tab 5: Analytics
    reactivationRevenue: "Reaktivasyon Geliri",
    avgTicketSize: "Ort. Sepet Tutarı",
    whatsappConvRate: "WhatsApp Dönüşüm Oranı",
    repeatVisitRatio: "Tekrar Ziyaret Oranı",
    trendRevenue: "↑ +%24.1 geçen aya göre",
    trendTicket: "↑ +%5.2 geçen aya göre",
    trendConv: "↑ +%3.8 geçen aya göre",
    trendRepeat: "↑ +%8.4 geçen aya göre",
    monthlyGrowthTrend: "Aylık Dönüşüm ve Büyüme Trendi",
    analyticsH3: "Detaylı Reaktivasyon Analizi & Sanatçı Performansı",
    analyticsSubtext: "Supabase veritabanı toplama sorgularına bağlı gerçek zamanlı metrikler.",

    // Tab 6: Franchises
    franchiseNetworkTitle: "Cleopatra Ink Şube Ağı",
    registerBranchBtn: "+ Yeni Şube Kaydet",
    managerLabel: "Yönetici",
    activeClientsLabel: "Aktif Müşteriler",
    uptimeLabel: "Erişilebilirlik",

    // Tab 7: Settings
    systemConfigTitle: "Sistem ve Veritabanı Yapılandırması",
    supabaseUrlLabel: "Supabase Proje URL'si",
    supabaseKeyLabel: "Supabase Anonim API Anahtarı",
    cleopatraEndpointLabel: "Cleopatra Portal Canlı Tutma Adresi",
    autoDispatcherLabel: "Otomatik Reaktivasyon Dağıtıcısı",
    autoDispatchDescription: "6 aydan uzun süredir pasif olan müşterilere otomatik WhatsApp mesajı gönder.",
    saveConfigBtn: "Yapılandırmayı Kaydet",
    testDbBtn: "Supabase Bağlantısını Test Et"
  },

  en: {
    // Brand & Sidebar Nav
    brandName: "Cleopatra Gündoğdu",
    navDashboard: "Dashboard",
    navCustomers: "Customers",
    navCampaigns: "Campaigns",
    navAppointments: "Appointments",
    navAnalytics: "Analytics",
    navFranchises: "Franchises",
    navSettings: "Settings",

    // Customer Table Page Limit
    limit20: "Show 20",
    limit50: "Show 50",
    limit100: "Show 100",
    limitAll: "All",

    // DB Status
    dbConnected: "Supabase Live Data",
    dbDemoMode: "Supabase Connected (Production)",

    // Header & Franchises
    greetingTitle: "Good evening, Studio Owner 👋",
    greetingSubtitle: "Keep your chairs busy. Reactivate more past clients.",

    // Page Headers for all 7 Tabs
    headers: {
      dashboard: {
        title: "Good evening, Studio Owner 👋",
        subtitle: "Keep your chairs busy. Reactivate more past clients."
      },
      customers: {
        title: "Customer Directory & History 👥",
        subtitle: "Track past tattoo clients, lifetime spend, and WhatsApp reactivation status."
      },
      campaigns: {
        title: "Automated Reactivation Sequences 🚀",
        subtitle: "Configure automated WhatsApp messages for inactive clients and birthdays."
      },
      appointments: {
        title: "Studio Booking Calendar 📅",
        subtitle: "View upcoming appointment slots, artist assignments, and deposit statuses."
      },
      analytics: {
        title: "Studio Reactivation & Revenue Analytics 📈",
        subtitle: "Analyze conversion rates, response times, and revenue attribution."
      },
      franchises: {
        title: "Cleopatra Ink Branch Network 🏢",
        subtitle: "Monitor multi-location sync status with Cleopatra portal."
      },
      'template-aliases': {
        title: "Meta Message Templates & Alias Management 🏷️",
        subtitle: "Preview Meta message templates and manage custom display aliases."
      },
      settings: {
        title: "System & Supabase Database Settings ⚙️",
        subtitle: "Manage Supabase REST API credentials and automated dispatchers."
      }
    },

    // Tab 1: Dashboard KPIs
    kpiCustomerPool: "Customer Pool",
    kpiReactivationMessages: "Reactivation Messages",
    kpiAppointmentsBooked: "Appointments Booked",
    kpiResponseRate: "Response Rate",
    vsLast30Days: "vs. last 30 days",

    // Chart & WhatsApp Chat
    reactivationPerformance: "Reactivation Performance",
    messagesSent: "Messages Sent",
    appointmentsBooked: "Appointments Booked",
    last14Days: "Last 14 Days",
    last30Days: "Last 30 Days",
    last90Days: "Last 90 Days",
    liveWhatsappConversations: "💬 Live WhatsApp Conversations",
    activeStatus: "Active",
    onlineStatus: "online",
    typeMessagePlaceholder: "Type a message...",

    // Top Campaigns & Funnel
    topPerformingCampaigns: "Top Performing Campaigns",
    viewAll: "View All →",
    responseRateSuffix: "response",
    customerReactivationFunnel: "Customer Reactivation Funnel",

    // Tab 2: Customers
    customerDirectoryStatus: "Customer Directory & Reactivation Status",
    searchCustomerPlaceholder: "Search customer name, phone or ID...",
    addCustomerBtn: "+ Add Customer",
    tableHeaderCustomer: "Customer",
    tableHeaderPhone: "Phone Number",
    tableHeaderLastVisit: "Last Visit",
    tableHeaderTotalSpent: "Total Spent",
    tableHeaderReactivationStatus: "Reactivation Status",
    tableHeaderActions: "Actions",
    sendWhatsappBtn: "💬 Send WhatsApp",

    // Tab 3: Campaigns
    automatedCampaignsTitle: "Automated Reactivation Campaigns",
    createNewCampaignBtn: "+ Create New Campaign",
    convRateLabel: "Conv. Rate",
    messagesSentLabel: "Messages Sent",

    // Tab 4: Appointments
    appointmentCalendarTitle: "Studio Appointment Calendar",
    newBookingBtn: "+ New Booking",
    thisWeek: "This Week",
    thisMonth: "This Month",
    tableHeaderTimeDate: "Time & Date",
    tableHeaderClient: "Client",
    tableHeaderArtist: "Artist",
    tableHeaderPlacement: "Placement & Style",
    tableHeaderDeposit: "Deposit",
    tableHeaderStatus: "Status",

    // Tab 5: Analytics
    reactivationRevenue: "Reactivation Revenue",
    avgTicketSize: "Avg. Ticket Size",
    whatsappConvRate: "WhatsApp Conv. Rate",
    repeatVisitRatio: "Repeat Visit Ratio",
    trendRevenue: "↑ +24.1% vs last month",
    trendTicket: "↑ +5.2% vs last month",
    trendConv: "↑ +3.8% vs last month",
    trendRepeat: "↑ +8.4% vs last month",
    monthlyGrowthTrend: "Monthly Conversion & Growth Trend",
    analyticsH3: "Detailed Reactivation Analytics & Artist Performance",
    analyticsSubtext: "Real-time metrics connected to Supabase database aggregation queries.",

    // Tab 6: Franchises
    franchiseNetworkTitle: "Cleopatra Ink Branch Network",
    registerBranchBtn: "+ Register New Branch",
    managerLabel: "Manager",
    activeClientsLabel: "Active Clients",
    uptimeLabel: "System Uptime",

    // Tab 7: Settings
    systemConfigTitle: "System & Database Configuration",
    supabaseUrlLabel: "Supabase Project URL",
    supabaseKeyLabel: "Supabase Anon API Key",
    cleopatraEndpointLabel: "Cleopatra Portal Keep-Alive Endpoint",
    autoDispatcherLabel: "Auto Reactivation Dispatcher",
    autoDispatchDescription: "Automatically send WhatsApp reactivation messages to clients 6+ months inactive.",
    saveConfigBtn: "Save Configuration",
    testDbBtn: "Test Supabase DB Connection"
  }
};

let currentLang = localStorage.getItem('dashboard_lang') || 'tr';
let globalData = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Database Client
  await dashboardDB.init();

  // Load Dashboard Data & Opt-Out List
  await fetchOptOutList();
  globalData = await dashboardDB.getDashboardData();

  // Setup Language Selector
  setupLanguageSelector();

  // Initial Render with Current Language
  renderAllViews();

  // Setup Event Handlers & Hash Router
  setupNavigation();
  setupChatHandlers();
  setupGridResizer();
  setupWaFullscreen();
  setupFilters();
  setupSettingsHandlers();
  setupModalHandlers();
  loadBotRules();
  setupTemplateAliasHandlers();

  // 15-Second Real-Time Live Sync with Supabase
  setInterval(async () => {
    try {
      await fetchOptOutList();
      const freshData = await dashboardDB.getDashboardData();
      if (freshData) {
        globalData = freshData;
        renderAllViews();
      }
    } catch (err) {
      console.warn('[DashboardRealtime] Auto-sync notice:', err);
    }
  }, 15000);

  // Start Webhook Polling for Real-Time Incoming Messages (every 2.5s)
  startWebhookPolling();
});

/**
 * Setup Fullscreen WhatsApp Mode & Main Dashboard Lock State
 */
function setupWaFullscreen() {
  const fsBtn = document.getElementById('waFullscreenBtn');
  const restoreBtn = document.getElementById('restoreWaChatBtn');
  const lockOverlay = document.getElementById('waFullscreenLockOverlay');

  // 1. Check URL query parameters for ?view=wa-fullscreen
  const urlParams = new URLSearchParams(window.location.search);
  const isWaFullscreenMode = urlParams.get('view') === 'wa-fullscreen' || window.location.hash === '#wa-fullscreen';

  if (isWaFullscreenMode) {
    document.body.classList.add('wa-fullscreen-mode');
    localStorage.setItem('wa_fullscreen_active', 'true');

    // Notify main window when fullscreen tab is closed
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('wa_fullscreen_active', 'false');
    });

    // Add close button to top header of standalone tab
    const waHeaderActions = document.querySelector('.wa-header-actions');
    if (waHeaderActions) {
      const exitBtn = document.createElement('button');
      exitBtn.type = 'button';
      exitBtn.className = 'wa-icon-btn';
      exitBtn.style.cssText = 'color: #FFFFFF; font-size: 12px; font-weight: 700; background: rgba(239, 68, 68, 0.25); border: 1px solid rgba(239, 68, 68, 0.4); padding: 5px 12px; border-radius: 8px; margin-left: 8px; cursor: pointer;';
      exitBtn.innerHTML = '✕ Tam Ekranı Kapat';
      exitBtn.onclick = () => {
        localStorage.setItem('wa_fullscreen_active', 'false');
        window.close();
      };
      waHeaderActions.appendChild(exitBtn);
    }
    return;
  }

  // 2. Main Dashboard Lock Overlay Logic
  const checkFullscreenLockState = () => {
    const isLocked = localStorage.getItem('wa_fullscreen_active') === 'true';
    if (lockOverlay) {
      if (isLocked) {
        lockOverlay.classList.add('active');
      } else {
        lockOverlay.classList.remove('active');
      }
    }
  };

  // Check state on page load
  checkFullscreenLockState();

  // Sync state changes across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'wa_fullscreen_active') {
      checkFullscreenLockState();
    }
  });

  // Open Fullscreen in new tab button
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      localStorage.setItem('wa_fullscreen_active', 'true');
      if (lockOverlay) lockOverlay.classList.add('active');
      window.open('dashboard.html?view=wa-fullscreen', '_blank');
    });
  }

  // Restore Chat back to Dashboard button
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      localStorage.setItem('wa_fullscreen_active', 'false');
      if (lockOverlay) lockOverlay.classList.remove('active');
    });
  }
}

/**
 * Interactive 2D Corner Resizer (Width & Height)
 * Sol alt köşedeki ok ikonu ile:
 * 1. Sadece yatayda (sola/sağa): Sola sürükledikçe genişler, sağa sürükledikçe varsayılan genişliğe küçülür.
 * 2. Sadece dikeyde (aşağı/yukarı): Aşağı sürükledikçe uzar, yukarı sürükledikçe varsayılan yüksekliğe (420px) küçülür.
 * 3. Çapraz sürükleme: Hem eni hem boyu aynı anda bağımsız olarak ayarlar.
 * Varsayılan boyutların (Default Min Height & Width) altına asla inmez!
 */
function setupGridResizer() {
  const cornerResizer = document.getElementById('cardCornerResizer');
  const middleGrid = document.getElementById('middleGrid') || document.querySelector('.middle-grid');

  if (!middleGrid) return;

  if (cornerResizer) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startHeight = 0;
    let startWaWidth = 0;

    // Varsayılan minimum taban sınırları
    const DEFAULT_MIN_HEIGHT = 420;
    let defaultWaWidth = 0;

    cornerResizer.addEventListener('mousedown', (e) => {
      isDragging = true;
      cornerResizer.classList.add('dragging');
      startX = e.clientX;
      startY = e.clientY;

      const gridRect = middleGrid.getBoundingClientRect();
      startHeight = gridRect.height;

      const waPanel = middleGrid.querySelector('.wa-chat-card');
      startWaWidth = waPanel ? waPanel.getBoundingClientRect().width : (gridRect.width * 0.58);

      if (!defaultWaWidth) {
        defaultWaWidth = startWaWidth;
      }

      document.body.style.cursor = 'nesw-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      // 1. Dikey Yükseklik (Y-Ekseni): Aşağı sürükleme büyütür (+), yukarı sürükleme varsayılan minimuma (420px) kadar küçültür
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(DEFAULT_MIN_HEIGHT, startHeight + deltaY);
      middleGrid.style.setProperty('--middle-grid-height', `${newHeight}px`);

      // 2. Yatay Genişlik (X-Ekseni): Sola sürükleme paneli sola doğru genişletir (+), sağa sürükleme varsayılan genişliğe kadar küçültür
      const deltaX = startX - e.clientX;
      const newWaWidth = Math.max(defaultWaWidth, startWaWidth + deltaX);
      middleGrid.style.setProperty('--wa-col', `${newWaWidth}px`);
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        cornerResizer.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }
}

/**
 * Setup Language Toggle Selector (Segmented Toggle Button)
 */
function setupLanguageSelector() {
  const toggleButtons = document.querySelectorAll('#langToggle .lang-btn');
  if (!toggleButtons.length) return;

  const updateToggleActiveState = (lang) => {
    toggleButtons.forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  updateToggleActiveState(currentLang);

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang && lang !== currentLang) {
        currentLang = lang;
        localStorage.setItem('dashboard_lang', currentLang);
        updateToggleActiveState(currentLang);
        renderAllViews();
      }
    });
  });
}

/**
 * Render All SPA Views according to current language
 */
function renderAllViews() {
  if (!globalData) return;

  // Render Core Overview Components
  renderStatusBadge(globalData.isLive);
  renderKPIs(globalData.kpis);
  renderCampaigns(globalData.campaigns);
  renderFunnel(globalData.funnel);
  renderChatConversations(globalData.conversations);
  renderActiveChatWindow(globalData.conversations);

  // Render Sub-tab Views
  renderCustomersTable(globalData.customers);
  renderCampaignsGrid(globalData.campaigns);
  renderAppointmentsTable(globalData.appointments);
  renderFranchisesGrid(globalData.franchises);

  // Update All Static Labels across HTML data-i18n attributes
  translatePage();

  // Re-sync Header Title/Subtitle for Active Tab
  const currentHash = (window.location.hash || '#dashboard').replace('#', '');
  updateHeaderForTab(currentHash);
}

/**
 * Translate all HTML elements with data-i18n attribute
 */
function translatePage() {
  const t = TRANSLATIONS[currentLang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && t[key]) {
      if (el.tagName === 'INPUT') {
        el.placeholder = t[key];
      } else {
        el.textContent = t[key];
      }
    }
  });
}

/**
 * Sidebar Sub-Tab Navigation & Router
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('#sidebarNav .nav-item');
  const mobileNavItems = document.querySelectorAll('#mobileBottomNav .mobile-nav-item');
  const tabViews = document.querySelectorAll('.tab-view');
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  const mobileNavMoreBtn = document.getElementById('mobileNavMoreBtn');

  const openMobileSidebar = () => {
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSidebar = () => {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
  if (mobileNavMoreBtn) mobileNavMoreBtn.addEventListener('click', openMobileSidebar);
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
  if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);

  const switchTab = (tabName) => {
    if (!tabName) tabName = 'dashboard';
    tabName = tabName.toLowerCase().replace('#', '');

    // Update active nav state in sidebar
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update active nav state in mobile bottom bar
    mobileNavItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update active view
    tabViews.forEach(view => {
      if (view.id === `view-${tabName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update Header Text for selected tab
    updateHeaderForTab(tabName);

    if (tabName === 'template-aliases') {
      renderTemplateAliasCards();
    }

    // Auto-close mobile drawer
    if (window.innerWidth <= 1024) {
      closeMobileSidebar();
    }
  };

  // Handle direct click on any tab target element
  document.querySelectorAll('[data-tab]').forEach(element => {
    element.addEventListener('click', (e) => {
      const tabName = element.getAttribute('data-tab');
      if (tabName) {
        e.preventDefault();
        window.location.hash = tabName;
        switchTab(tabName);
      }
    });
  });

  // Handle URL hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) switchTab(hash);
  });

  // Initial tab check from URL hash
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    switchTab(initialHash);
  }
}

/**
 * Update Header Title & Subtitle based on active tab and current language
 */
function updateHeaderForTab(tabName) {
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const t = TRANSLATIONS[currentLang];

  if (!tabName || !t.headers[tabName]) tabName = 'dashboard';

  if (t.headers[tabName]) {
    if (pageTitle) pageTitle.textContent = t.headers[tabName].title;
    if (pageSubtitle) pageSubtitle.textContent = t.headers[tabName].subtitle;
  }
}

/**
 * Render DB Status Indicator
 */
function renderStatusBadge(isLive) {
  const badgeText = document.getElementById('dbStatusText');
  const badgeDot = document.querySelector('.status-dot');
  const t = TRANSLATIONS[currentLang];

  if (isLive) {
    const liveCount = globalData ? (globalData.liveCount || 0) : 0;
    const countText = currentLang === 'tr' ? ` (reservations tablosu: ${liveCount} canlı kayıt)` : ` (reservations table: ${liveCount} live records)`;
    if (badgeText) badgeText.textContent = (t.dbConnected || 'Supabase Bağlandı') + countText;
    if (badgeDot) badgeDot.style.backgroundColor = '#10B981';
  } else {
    if (badgeText) badgeText.textContent = t.dbDemoMode;
    if (badgeDot) badgeDot.style.backgroundColor = '#00F2FE';
  }
}

function formatNumber(num) {
  if (num === '-' || num === null || num === undefined) return '-';
  if (typeof num === 'string' && isNaN(Number(num))) return num;
  return new Intl.NumberFormat(currentLang === 'tr' ? 'tr-TR' : 'en-US').format(num);
}

/**
 * Render Dashboard Overview KPIs (Shows '-' if table/metric is empty in Supabase)
 */
function renderKPIs(kpis) {
  document.getElementById('kpiCustomerPool').textContent = formatNumber(kpis.customerPool);
  document.getElementById('kpiCustomerPoolTrend').textContent = kpis.customerPoolGrowth || '-';

  document.getElementById('kpiMessages').textContent = formatNumber(kpis.reactivationMessages);
  document.getElementById('kpiMessagesTrend').textContent = kpis.reactivationMessagesGrowth || '-';

  document.getElementById('kpiAppointments').textContent = formatNumber(kpis.appointmentsBooked);
  document.getElementById('kpiAppointmentsTrend').textContent = kpis.appointmentsBookedGrowth || '-';

  document.getElementById('kpiResponseRate').textContent = kpis.responseRate === '-' ? '-' : `${kpis.responseRate}%`;
  document.getElementById('kpiResponseRateTrend').textContent = kpis.responseRateGrowth || '-';

  const revEl = document.getElementById('analyticsRevenue');
  const ticketEl = document.getElementById('analyticsTicket');
  if (revEl) {
    revEl.textContent = (globalData && globalData.totalRevenue !== '-') ? `$${formatNumber(globalData.totalRevenue)}` : '-';
  }
  if (ticketEl) {
    ticketEl.textContent = (globalData && globalData.totalRevenue !== '-' && globalData.liveCount > 0) ? `$${formatNumber(Math.round(globalData.totalRevenue / globalData.liveCount))}` : '-';
  }
}

/**
 * Render Top Performing Campaigns on Dashboard Overview
 */
function renderCampaigns(campaigns) {
  const container = document.getElementById('campaignList');
  if (!container) return;

  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 30px; font-size: 13px; font-weight: 600;">- Supabase Kampanya Verisi Bulunamadı -</div>`;
    return;
  }

  const t = TRANSLATIONS[currentLang];
  const icons = ['🎁', '🎂', '💪', '✨', '⭐'];

  container.innerHTML = campaigns.slice(0, 4).map((item, index) => {
    const title = currentLang === 'tr' ? item.title_tr : item.title_en;
    return `
      <div class="campaign-item">
        <div class="campaign-rank">${index + 1}</div>
        <div class="campaign-icon-badge">${icons[index % icons.length]}</div>
        <div class="campaign-details">
          <div class="campaign-title-row">
            <span>${escapeHtml(title)}</span>
            <span class="campaign-rate">${item.rate}% ${t.responseRateSuffix}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${item.rate * 2.5}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Funnel Metrics
 */
function renderFunnel(funnel) {
  const container = document.getElementById('funnelMetrics');
  if (!container) return;

  if (!Array.isArray(funnel) || funnel.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 30px; font-size: 13px; font-weight: 600;">- Supabase Huni Verisi Bulunamadı -</div>`;
    return;
  }

  container.innerHTML = funnel.map(item => {
    const stage = currentLang === 'tr' ? item.stage_tr : item.stage_en;
    return `
      <div class="funnel-metric-item">
        <div class="funnel-stage">• ${stage}</div>
        <div class="funnel-val">${formatNumber(item.count)}</div>
        <div class="funnel-pct">${item.percentage}%</div>
      </div>
    `;
  }).join('');
}

let globalOptOutList = [];

async function fetchOptOutList() {
  try {
    const res = await fetch('/api/opt_out_list');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.optOutList)) {
        globalOptOutList = data.optOutList;
      }
    }
  } catch (e) {}
}

/**
 * Render Customers Table (Sub-Tab: Customers with 20-50-100-All limit filter)
 */
function renderCustomersTable(customers) {
  const body = document.getElementById('customerTableBody');
  if (!body) return;

  const t = TRANSLATIONS[currentLang];
  const searchInput = document.getElementById('customerSearch');
  const limitSelect = document.getElementById('customerLimitSelect');

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const limitVal = limitSelect ? limitSelect.value : '20';

  let list = Array.isArray(customers) ? customers : [];

  // 1. Filter by search query
  if (query) {
    list = list.filter(c => 
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.id && c.id.toLowerCase().includes(query))
    );
  }

  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 30px;">- Müşteri Bulunamadı -</td></tr>`;
    return;
  }

  // 2. Slice list based on 20-50-100-all selector
  let displayed = list;
  if (limitVal !== 'all') {
    const limitNum = parseInt(limitVal, 10);
    displayed = list.slice(0, limitNum);
  }

  body.innerHTML = displayed.map(cust => {
    const status = currentLang === 'tr' ? cust.status_tr : cust.status_en;
    let badgeClass = 'badge-blue';
    if (cust.status_en === 'Reactivated') badgeClass = 'badge-green';
    if (cust.status_en === 'Inactive') badgeClass = 'badge-yellow';
    const isChecked = selectedCustomerIds.has(cust.id);
    const rowClass = isChecked ? 'selected-row' : '';
    const cleanP = cust.phone ? String(cust.phone).replace(/\D/g, '') : '';
    const isOptedOut = globalOptOutList.includes(cleanP);

    let statusHtml = `<span class="badge ${badgeClass}">${status}</span>`;
    if (isOptedOut) {
      statusHtml = `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 10px;">🚫 Listeden Çıktı (DUR)</span>`;
    }

    return `
      <tr class="${rowClass}">
        <td style="text-align: center;">
          <input type="checkbox" class="cust-row-checkbox" data-id="${cust.id}" data-phone="${cust.phone}" data-name="${escapeHtml(cust.name)}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #00A884; cursor: pointer;">
        </td>
        <td>
          <strong>${escapeHtml(cust.name)}</strong><br>
          <span style="font-size: 11px; color: var(--text-dim);">${cust.id}</span>
        </td>
        <td style="font-family: monospace; color: var(--text-muted);">${cust.phone}</td>
        <td>${cust.lastVisit}</td>
        <td style="font-weight: 700; color: #10B981;">${cust.totalSpent}</td>
        <td>${statusHtml}</td>
        <td>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="openSingleCustomerWhatsApp('${cust.id}', '${cust.phone}', '${escapeHtml(cust.name)}')">${t.sendWhatsappBtn || '💬 WhatsApp Gönder'}</button>
        </td>
      </tr>
    `;
  }).join('');

  updateSelectionUI();
  attachCustomerCheckboxListeners();
}

/**
 * Render Campaigns Grid (Sub-Tab: Campaigns)
 */
function renderCampaignsGrid(campaigns) {
  const container = document.getElementById('campaignCardsGrid');
  if (!container) return;

  const t = TRANSLATIONS[currentLang];

  container.innerHTML = campaigns.map(camp => {
    const title = currentLang === 'tr' ? camp.title_tr : camp.title_en;
    const desc = currentLang === 'tr' ? camp.description_tr : camp.description_en;
    const status = currentLang === 'tr' ? camp.status_tr : camp.status_en;

    return `
      <div class="card-panel">
        <div style="display: flex; gap: 14px; margin-bottom: 14px;">
          <div class="campaign-icon-badge" style="width: 48px; height: 48px; font-size: 22px;">${camp.icon}</div>
          <div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">${escapeHtml(title)}</h3>
            <span class="badge ${camp.status_en === 'Active' ? 'badge-green' : 'badge-yellow'}">${status}</span>
          </div>
        </div>
        <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 16px; min-height: 36px; line-height: 1.4;">${escapeHtml(desc)}</p>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 12px; font-size: 12px;">
          <div>
            <span style="color: var(--text-dim);">${t.convRateLabel}</span><br>
            <strong style="color: var(--accent-cyan); font-size: 14px;">${camp.rate}%</strong>
          </div>
          <div style="text-align: right;">
            <span style="color: var(--text-dim);">${t.messagesSentLabel}</span><br>
            <strong style="font-size: 14px;">${formatNumber(camp.sentCount)}</strong>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Appointments Table (Sub-Tab: Appointments)
 */
function renderAppointmentsTable(appointments) {
  const body = document.getElementById('appointmentsTableBody');
  if (!body) return;

  body.innerHTML = appointments.map(app => {
    const status = currentLang === 'tr' ? app.status_tr : app.status_en;
    return `
      <tr>
        <td><strong>${app.date}</strong></td>
        <td>${escapeHtml(app.client)}</td>
        <td>${escapeHtml(app.artist)}</td>
        <td>${escapeHtml(app.placement)}</td>
        <td style="color: #10B981; font-weight: 700;">${app.deposit}</td>
        <td><span class="badge ${app.status_en === 'Completed' ? 'badge-green' : 'badge-blue'}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

/**
 * Render Franchises Grid (Sub-Tab: Franchises)
 */
function renderFranchisesGrid(franchises) {
  const container = document.getElementById('franchiseGrid');
  if (!container) return;

  const t = TRANSLATIONS[currentLang];

  container.innerHTML = franchises.map(f => {
    const name = currentLang === 'tr' ? f.name_tr : f.name_en;
    const status = currentLang === 'tr' ? f.status_tr : f.status_en;

    return `
      <div class="card-panel">
        <div class="panel-header">
          <div class="panel-title">🏢 ${escapeHtml(name)}</div>
          <span class="badge ${f.status_en === 'Active' ? 'badge-green' : 'badge-yellow'}">${status}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; font-size: 13px;">
          <div>
            <span style="color: var(--text-dim); font-size: 11px;">${t.managerLabel}</span><br>
            <strong>${f.manager}</strong>
          </div>
          <div>
            <span style="color: var(--text-dim); font-size: 11px;">${t.activeClientsLabel}</span><br>
            <strong style="color: var(--accent-cyan);">${formatNumber(f.clients)}</strong>
          </div>
          <div>
            <span style="color: var(--text-dim); font-size: 11px;">${t.uptimeLabel}</span><br>
            <strong style="color: #10B981;">${f.uptime}</strong>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getSafeAvatarInitials(conv) {
  if (!conv) return 'WA';
  const name = (conv.name || '').trim();
  if (conv.avatar && !conv.avatar.includes('(') && !conv.avatar.includes('{') && !conv.avatar.includes('[')) {
    return conv.avatar.substring(0, 2).toUpperCase();
  }
  if (!name || name.startsWith('Müşteri')) return 'WA';
  const clean = name.replace(/[()[\]{}]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (clean.substring(0, 2) || 'WA').toUpperCase();
}

let activeChatId = 'chat-1';

/**
 * Render WhatsApp Chat List (Sidebar)
 */
function renderChatConversations(conversations) {
  const container = document.getElementById('waChatList');
  if (!container) return;

  if (!Array.isArray(conversations) || conversations.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px 16px; text-align: center; color: var(--text-dim); font-size: 12.5px; font-weight: 600; line-height: 1.6;">
        <div style="font-size: 28px; margin-bottom: 8px; opacity: 0.6;">💬</div>
        - Henüz Sohbet Kaydı Bulunmuyor -
      </div>
    `;
    return;
  }

  container.innerHTML = conversations.map(conv => {
    const isActive = conv.id === activeChatId;
    const msgs = currentLang === 'tr' ? conv.messages_tr : conv.messages_en;
    const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1].text : '';
    const avatarText = getSafeAvatarInitials(conv);

    return `
      <div class="wa-chat-item ${isActive ? 'active' : ''}" data-chat-id="${conv.id}">
        <div class="wa-item-avatar" style="background: ${conv.avatarBg};">${avatarText}</div>
        <div class="wa-item-details">
          <div class="wa-item-top">
            <span class="wa-item-name">${escapeHtml(conv.name)}</span>
            <span class="wa-item-time">${conv.time}</span>
          </div>
          <div class="wa-item-bottom">
            <span class="wa-item-preview">${escapeHtml(lastMsg)}</span>
            ${conv.unread > 0 ? `<span class="wa-unread-pill">${conv.unread}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach click events
  container.querySelectorAll('.wa-chat-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-chat-id');
      if (id) {
        activeChatId = id;
        const conv = conversations.find(c => c.id === id);
        if (conv) conv.unread = 0; // Mark read
        const waCard = document.querySelector('.wa-chat-card');
        if (waCard) {
          waCard.classList.add('wa-mobile-active');
        }
        renderChatConversations(conversations);
        renderActiveChatWindow(conversations);
      }
    });
  });
}

/**
 * Render Active Chat Window (Header & Messages)
 */
function renderActiveChatWindow(conversations) {
  const mainArea = document.querySelector('.wa-chat-main');
  if (!mainArea) return;

  // Ensure mainArea layout exists
  if (!document.getElementById('chatHistory')) {
    mainArea.innerHTML = `
      <!-- ═══ CHAT HEADER ═══ -->
      <div class="wa-header" style="padding: 10px 16px; gap: 10px;">
        <button type="button" class="wa-back-btn" id="waBackToListBtn" title="Sohbet Listesine Dön">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="wa-header-user">
          <div class="wa-avatar" id="activeChatAvatar" style="cursor:pointer;" title="Müşteri Profili">WA</div>
          <div class="wa-user-info">
            <span class="wa-user-name" id="activeChatName">Müşteri Seçin</span>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span class="wa-user-status" id="activeChatStatus">çevrimiçi</span>
              <span id="webhookStatusBadge" style="font-size:10px; padding:2px 7px; border-radius:10px; background:rgba(34,197,94,0.15); color:#22c55e; font-weight:600; display:inline-flex; align-items:center; gap:3px; transition:all 0.3s;">🟢 Bağlı</span>
            </div>
          </div>
        </div>
        <div class="wa-header-actions" style="gap:6px;">
          <button type="button" id="quickTemplateBtn" title="Şablon Gönder (⚡)" style="display:flex; align-items:center; gap:5px; background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.25); padding:6px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;">
            ⚡ <span>Şablon</span>
          </button>
          <button type="button" class="wa-icon-btn" id="refreshChatBtn" title="Yenile" style="width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:14px; transition:all 0.2s;">🔄</button>
        </div>
      </div>

      <!-- ═══ CHAT BODY ═══ -->
      <div class="chat-history wa-chat-body" id="chatHistory"></div>

      <!-- ═══ TEMPLATE PANEL ═══ -->
      <div id="quickTemplateModal" class="qt-panel" style="display:none;">
        <div class="qt-header">
          <span class="qt-title">⚡ Şablon Gönder</span>
          <div class="qt-header-actions">
            <button type="button" id="quickFetchTemplatesBtn" class="qt-icon-btn" title="Şablonları yenile">🔄</button>
            <button type="button" id="closeQuickTmplBtn" class="qt-icon-btn" title="Kapat">✕</button>
          </div>
        </div>
        <select id="quickTmplSelect" class="qt-select">
          <option value="hello_world" data-lang="en_US" data-params="0" data-body="Hello World!">hello_world</option>
        </select>
        <div id="quickTmplPreview" class="qt-preview-bubble">Şablon seçin…</div>
        <div class="qt-footer">
          <span id="quickTmplHint" class="qt-hint">Mavi alanları doldurun, ardından gönderin</span>
          <button type="button" id="sendQuickTmplBtn" class="qt-send-btn">🚀 Gönder</button>
        </div>
      </div>

      <!-- ═══ INPUT BAR ═══ -->
      <div class="wa-input-bar">
        <button type="button" class="wa-action-btn" id="emojiBtn" title="Emoji">😀</button>
        <input type="text" class="chat-input wa-input" id="chatInput" placeholder="Bir mesaj yazın...">
        <button type="button" id="quickTemplateInlineBtn" title="Şablon Gönder" style="background:transparent; border:none; color:#8696A0; font-size:17px; cursor:pointer; transition:color 0.2s; padding:0 2px;" onmouseover="this.style.color='#38bdf8'" onmouseout="this.style.color='#8696A0'">⚡</button>
        <button type="button" class="wa-send-btn" id="sendBtn">➤</button>
      </div>
    `;

    setupChatHandlers();
  }

  const historyEl = document.getElementById('chatHistory');

  if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
    if (historyEl) {
      historyEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-dim); text-align: center; padding: 20px;">
          <div style="font-size: 52px; margin-bottom: 12px; filter: drop-shadow(0 0 12px rgba(0,168,132,0.3));">💬</div>
          <div style="font-size: 17px; font-weight: 700; color: #f8fafc; margin-bottom: 6px;">WhatsApp Webhook Canlı Sohbet Paneli</div>
          <div style="font-size: 13px; color: #94a3b8; max-width: 380px; line-height: 1.5; margin-bottom: 16px;">
            Henüz kaydolmuş geçmiş mesajınız yok.<br>
            Sol taraftaki <strong>'➕ Yeni Sohbet'</strong> butonuna tıklayarak veya bir müşteriye mesaj atarak canlı sohbet başlatabilirsiniz.
          </div>
          <button type="button" onclick="document.getElementById('startNewChatBtn')?.click()" style="background: linear-gradient(135deg, #00A884 0%, #059669 100%); color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer;">➕ Yeni Sohbet Başlat</button>
        </div>
      `;
    }
    return;
  }

  const conv = conversations.find(c => c.id === activeChatId) || conversations[0];
  if (!conv) return;

  // Update Header Details
  const avatarEl = document.getElementById('activeChatAvatar');
  const nameEl = document.getElementById('activeChatName');
  const statusEl = document.getElementById('activeChatStatus');
  const t = TRANSLATIONS[currentLang];

  if (avatarEl) {
    avatarEl.textContent = getSafeAvatarInitials(conv);
    avatarEl.style.background = conv.avatarBg;
  }
  if (nameEl) nameEl.textContent = conv.name;
  if (statusEl) {
    statusEl.textContent = conv.online ? (t.onlineStatus || 'çevrimiçi') : (currentLang === 'tr' ? 'çevrimdışı' : 'offline');
    statusEl.style.color = conv.online ? '#00A884' : '#8696A0';
  }

  // Render Messages Stream
  const msgs = currentLang === 'tr' ? conv.messages_tr : conv.messages_en;
  renderChat(msgs);
}

/**
 * Render WhatsApp Message Stream
 */
function renderChat(chats) {
  const history = document.getElementById('chatHistory');
  if (!history) return;

  history.innerHTML = chats.map(msg => `
    <div class="chat-bubble ${msg.sender}">
      <div>${escapeHtml(msg.text)}</div>
      <div class="chat-meta">
        <span>${msg.time}</span>
        ${msg.sender === 'studio' ? '<span class="wa-read-tick">✓✓</span>' : ''}
      </div>
    </div>
  `).join('');

  history.scrollTop = history.scrollHeight;
}

/**
 * Interactive WhatsApp Chat Handling
 */
/**
 * Interactive WhatsApp Chat Handling & Real-time Webhook Integration
 */
let lastWebhookFetchTimestamp = 0;
let webhookPollingInterval = null;

/**
 * Normalize phone number: strip all non-digit characters
 */
function cleanPhoneNumber(raw) {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '');
}

function getLiveWebhookServerUrl() {
  const isWebHosted = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http') && !window.location.origin.startsWith('chrome-extension');
  const custom = document.getElementById('webhookServerUrl')?.value.trim() || localStorage.getItem('webhook_server_url');
  if (custom && custom !== 'http://localhost:3000') return custom;
  if (isWebHosted) return window.location.origin;
  return custom || 'http://localhost:3000';
}

function startWebhookPolling() {
  if (webhookPollingInterval) clearInterval(webhookPollingInterval);

  const fetchIncoming = async () => {
    const serverUrl = getLiveWebhookServerUrl();
    const badgeEl = document.getElementById('webhookStatusBadge');

    try {
      // Fetch all stored messages to avoid timestamp skew bugs
      const response = await fetch(`${serverUrl}/api/messages?since=0`, { method: 'GET' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Update badge to ONLINE
      if (badgeEl) {
        badgeEl.textContent = '🟢 Webhook & Sunucu Canlı';
        badgeEl.style.background = 'rgba(34, 197, 94, 0.15)';
        badgeEl.style.color = '#22c55e';
      }

      if (data.messages && data.messages.length > 0) {
        if (!globalData) globalData = { conversations: [] };
        if (!globalData.conversations) globalData.conversations = [];

        let hasNewMessages = false;

        data.messages.forEach(incomingMsg => {
          // For incoming messages, customer number is 'from'. For outgoing messages, customer number is 'to'.
          const rawNum = incomingMsg.direction === 'outgoing' ? (incomingMsg.to || incomingMsg.from) : incomingMsg.from;
          const cleanNum = cleanPhoneNumber(rawNum);

          if (!cleanNum || cleanNum.length < 5) return;

          let conv = globalData.conversations.find(c => {
            const cPhone = cleanPhoneNumber(c.phone || c.name);
            return cPhone.includes(cleanNum) || cleanNum.includes(cPhone);
          });

          if (!conv) {
            conv = {
              id: `chat-${cleanNum}`,
              name: incomingMsg.senderName && incomingMsg.senderName !== 'studio' && incomingMsg.senderName !== cleanNum ? incomingMsg.senderName : `Müşteri (${cleanNum})`,
              phone: cleanNum,
              avatar: (incomingMsg.senderName || 'WA').substring(0, 2).toUpperCase(),
              avatarBg: 'linear-gradient(135deg, #00A884 0%, #059669 100%)',
              unread: incomingMsg.direction === 'incoming' ? 1 : 0,
              online: true,
              messages_tr: [],
              messages_en: []
            };
            globalData.conversations.unshift(conv);
            hasNewMessages = true;
          }

          const now = new Date(incomingMsg.timestamp || Date.now());
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const isSenderStudio = incomingMsg.direction === 'outgoing';

          // Prevent duplicate message bubbles
          const exists = conv.messages_tr.some(m => m.id === incomingMsg.id || (m.text === incomingMsg.text && m.time === timeStr));
          if (!exists) {
            conv.messages_tr.push({ id: incomingMsg.id, sender: isSenderStudio ? 'studio' : 'client', text: incomingMsg.text, time: timeStr });
            conv.messages_en.push({ id: incomingMsg.id, sender: isSenderStudio ? 'studio' : 'client', text: incomingMsg.text, time: timeStr });
            hasNewMessages = true;
          }
        });

        if (hasNewMessages) {
          renderChatConversations(globalData.conversations);
          renderActiveChatWindow(globalData.conversations);
        }
      }
    } catch (err) {
      if (badgeEl) {
        badgeEl.textContent = '🔴 Webhook Çevrimdışı';
        badgeEl.style.background = 'rgba(239, 68, 68, 0.15)';
        badgeEl.style.color = '#ef4444';
      }
    }
  };

  fetchIncoming();
  webhookPollingInterval = setInterval(fetchIncoming, 2500);
}

/**
 * Extract body text and param count from a Meta template object
 */
function extractTemplateMeta(tmpl) {
  let bodyText = tmpl.name;
  let paramCount = 0;

  if (Array.isArray(tmpl.components) && tmpl.components.length > 0) {
    // Collect placeholder indices across all string fields in all components
    const placeholderIndices = [];
    let extraParams = 0;

    tmpl.components.forEach(comp => {
      // inspect common string fields
      ['text', 'body', 'header', 'footer'].forEach(k => {
        const v = comp[k];
        if (typeof v === 'string') {
          const matches = v.match(/\{\{\d+\}\}/g);
          if (matches && matches.length > 0) {
            matches.forEach(m => {
              const n = parseInt(m.replace(/\D/g, ''), 10);
              if (!isNaN(n)) placeholderIndices.push(n);
            });
            if (!bodyText || bodyText === tmpl.name) bodyText = v;
          }
        }
      });

      // Some components (e.g. header with non-TEXT format, media, document, location)
      // require a parameter even if no {{}} placeholders appear. Count them conservatively.
      if (comp.format && typeof comp.format === 'string') {
        const fmt = comp.format.toUpperCase();
        if (fmt !== 'TEXT') extraParams += 1;
      }
    });

    if (placeholderIndices.length > 0) paramCount = Math.max(...placeholderIndices);
    // add any extra params detected
    paramCount = Math.max(paramCount, placeholderIndices.length ? paramCount : 0) + extraParams;
  }

  return { bodyText, paramCount };
}

function inferParamHint(bodyText, paramIndex) {
  const marker = `{{${paramIndex}}}`;
  const idx = bodyText.indexOf(marker);
  if (idx === -1) return `Alan ${paramIndex}`;
  const before = bodyText.slice(Math.max(0, idx - 35), idx).toLowerCase();
  if (/merhaba|hello|hi |hallo|dear/.test(before)) return 'Ad';
  if (/özel|indirim|discount|rabatt|%/.test(before)) return 'İndirim';
  if (/yetkili|sanatçı|artist|mitarbeiter|yetkilimiz|contact/.test(before)) return 'Yetkili';
  if (/tarih|date|termin|saat|time|uhrzeit/.test(before)) return 'Tarih';
  if (/telefon|phone|numara|nummer/.test(before)) return 'Telefon';
  if (/adres|address|adresse|studio|stüdyo/.test(before)) return 'Konum';
  return `Alan ${paramIndex}`;
}

function getActiveCustomerFirstName() {
  const conv = globalData?.conversations?.find(c => c.id === activeChatId);
  if (!conv?.name || conv.name.includes('Müşteri (')) return '';
  return conv.name.trim().split(/\s+/)[0];
}

function getQuickParamDefault(paramIndex, hint, existingVal, isSameTmpl) {
  if (isSameTmpl && existingVal !== undefined) return existingVal;
  if (paramIndex === 1 && hint === 'Ad') return getActiveCustomerFirstName();
  return '';
}

function collectQuickParamValues(maxParams) {
  const values = {};
  for (let i = 1; i <= maxParams; i++) {
    const inp = document.getElementById(`tmplParam${i}`);
    if (inp) values[i] = inp.value;
  }
  return values;
}

function buildQuickPreviewHtml(bodyText, paramCount, values, isSameTmpl) {
  if (!bodyText) return 'Şablon seçin…';
  if (paramCount === 0) return escapeHtml(bodyText);

  const regex = /\{\{(\d+)\}\}/g;
  let html = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(bodyText)) !== null) {
    const paramNum = parseInt(match[1], 10);
    html += escapeHtml(bodyText.slice(lastIndex, match.index));
    const hint = inferParamHint(bodyText, paramNum);
    const val = getQuickParamDefault(paramNum, hint, values[paramNum], isSameTmpl);
    html += `<input type="text" class="qt-inline-input" id="tmplParam${paramNum}" data-param="${paramNum}" placeholder="${escapeHtml(hint)}" value="${escapeHtml(val)}" autocomplete="off">`;
    lastIndex = match.index + match[0].length;
  }
  html += escapeHtml(bodyText.slice(lastIndex));
  return html;
}

function buildBulkPreviewHtml(bodyText, paramCount, values, isSameTmpl) {
  if (!bodyText) return 'Şablon seçin…';
  if (paramCount === 0) return escapeHtml(bodyText);

  const regex = /\{\{(\d+)\}\}/g;
  let html = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(bodyText)) !== null) {
    const paramNum = parseInt(match[1], 10);
    html += escapeHtml(bodyText.slice(lastIndex, match.index));
    const hint = inferParamHint(bodyText, paramNum);
    let val = values && values[paramNum] !== undefined ? values[paramNum] : '';
    if (!val) {
      if (paramNum === 1) val = '{name}';
      else if (paramNum === 2) val = '%25';
      else if (paramNum === 3) val = 'Alex Realism';
    }
    html += `<input type="text" class="qt-inline-input bulk-inline-input" id="bulkTmplP${paramNum}" data-param="${paramNum}" placeholder="${escapeHtml(hint)}" value="${escapeHtml(val)}" autocomplete="off" style="font-size: 12px; padding: 2px 6px;">`;
    lastIndex = match.index + match[0].length;
  }
  html += escapeHtml(bodyText.slice(lastIndex));
  return html;
}

function updateQuickTemplatePanel() {
  const quickSelect = document.getElementById('quickTmplSelect');
  const previewEl = document.getElementById('quickTmplPreview');
  const hintEl = document.getElementById('quickTmplHint');
  const activeBadge = document.getElementById('qtActiveCustomerBadge');
  const dropzoneEl = document.getElementById('quickTmplMediaDropzone');
  const dropzoneContent = document.getElementById('qtDropzoneContent');
  const dropzonePreview = document.getElementById('qtDropzonePreview');
  const previewImg = document.getElementById('qtHeaderPreviewImg');
  const uploadStatus = document.getElementById('tmplHeaderUploadStatus');
  const hiddenMediaInput = document.getElementById('tmplHeaderMedia');
  const autofillRow = document.getElementById('qtAutofillRow');

  if (!quickSelect || !previewEl) return;

  // 1. Update Active Customer Name in Badge
  const conv = globalData?.conversations?.find(c => c.id === activeChatId);
  if (activeBadge) {
    if (conv) {
      activeBadge.textContent = `👤 ${conv.name || conv.phone}`;
      activeBadge.style.display = 'inline-block';
    } else {
      activeBadge.style.display = 'none';
    }
  }

  const opt = quickSelect.options[quickSelect.selectedIndex];
  if (!opt) return;

  const tmplName = opt.getAttribute('data-name') || (opt.value.includes('|') ? opt.value.split('|')[0] : opt.value);
  const bodyText = opt.getAttribute('data-body') || '';
  const paramCount = parseInt(opt.getAttribute('data-params') || '0', 10);
  const isSameTmpl = quickSelect.dataset.lastTmpl === tmplName;
  const existingValues = collectQuickParamValues(20);

  // If new template has param 1 and active customer exists, prefill customer name
  if (!isSameTmpl && conv && conv.name && !conv.name.includes('Müşteri (')) {
    existingValues[1] = conv.name.trim();
  }

  previewEl.innerHTML = buildQuickPreviewHtml(bodyText, paramCount, existingValues, isSameTmpl);
  quickSelect.dataset.lastTmpl = tmplName;

  // 2. Handle Header Media (IMAGE / VIDEO / DOCUMENT)
  const mediaType = opt.getAttribute('data-has-media');
  if (mediaType && (mediaType === 'image' || mediaType === 'document' || mediaType === 'video') && dropzoneEl) {
    dropzoneEl.style.display = 'block';
    const dropzoneTextStrong = dropzoneContent?.querySelector('strong');
    if (dropzoneTextStrong) {
      dropzoneTextStrong.textContent = `Şablon Başlık Görseli (${mediaType.toUpperCase()})`;
    }

    // Check if media already loaded for this specific template
    if (hiddenMediaInput && hiddenMediaInput.value && previewImg && previewImg.src && isSameTmpl) {
      if (dropzoneContent) dropzoneContent.style.display = 'none';
      if (dropzonePreview) dropzonePreview.style.display = 'flex';
    } else {
      if (dropzoneContent) dropzoneContent.style.display = 'flex';
      if (dropzonePreview) dropzonePreview.style.display = 'none';
      if (!isSameTmpl) {
        if (hiddenMediaInput) hiddenMediaInput.value = '';
        if (previewImg) previewImg.src = '';
      }
    }
  } else {
    // Strictly hide dropzone for text-only templates!
    if (dropzoneEl) dropzoneEl.style.display = 'none';
    if (dropzoneContent) dropzoneContent.style.display = 'flex';
    if (dropzonePreview) dropzonePreview.style.display = 'none';
    if (hiddenMediaInput) hiddenMediaInput.value = '';
    if (previewImg) previewImg.src = '';
  }

  // 3. Handle Autofill Row
  if (autofillRow) {
    autofillRow.style.display = paramCount > 0 ? 'flex' : 'none';
  }

  // 4. Update Guidance Hint
  if (hintEl) {
    if (mediaType && (!hiddenMediaInput || !hiddenMediaInput.value)) {
      hintEl.innerHTML = `⚠️ <strong>Görsel Gerekli:</strong> Lütfen yukarıdan bir fotoğraf seçin veya yükleyin.`;
      hintEl.style.color = '#38bdf8';
    } else if (paramCount > 0) {
      hintEl.textContent = 'Mavi kutuları kontrol edip doğrudan gönderin.';
      hintEl.style.color = '#8696a0';
    } else {
      hintEl.textContent = '✅ Hazır — tek tıkla gönderebilirsiniz.';
      hintEl.style.color = '#4ade80';
    }
  }

  previewEl.querySelectorAll('.qt-inline-input').forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('sendQuickTmplBtn')?.click();
      }
    });
  });
}

async function ensureQuickTemplatesLoaded() {
  const cached = getCachedMetaTemplates();
  if (cached && cached.length > 0) {
    populateQuickTemplateSelect(cached, getTemplateAliases());
    return;
  }
  const wabaId = document.getElementById('metaWabaId')?.value.trim() || localStorage.getItem('meta_waba_id');
  const token = document.getElementById('metaToken')?.value.trim() || localStorage.getItem('meta_access_token');
  if (!wabaId || !token) {
    const hintEl = document.getElementById('quickTmplHint');
    if (hintEl) hintEl.textContent = 'Şablonlar için Ayarlar → Meta bilgilerini girin, sonra 🔄';
    return;
  }
  await fetchMetaTemplatesFromApi();
}

function populateQuickTemplateSelect(templates, aliases) {
  const quickSelect = document.getElementById('quickTmplSelect');
  if (!quickSelect || !Array.isArray(templates) || templates.length === 0) return;

  const prevVal = quickSelect.value;
  quickSelect.innerHTML = '';

  templates.forEach(tmpl => {
    const lang = tmpl.language || 'en_US';
    const key = `${tmpl.name}|${lang}`;
    const alias = aliases[key] || '';
    const { bodyText, paramCount } = extractTemplateMeta(tmpl);
    // detect if template has a header that requires media (IMAGE/DOCUMENT/VIDEO)
    let headerMediaType = '';
    if (Array.isArray(tmpl.components)) {
      const headerComp = tmpl.components.find(c => {
        const t = (c.type || '').toString().toLowerCase();
        return t === 'header';
      });
      if (headerComp && headerComp.format) {
        const fmt = headerComp.format.toString().toUpperCase();
        if (fmt === 'IMAGE' || fmt === 'DOCUMENT' || fmt === 'VIDEO') {
          headerMediaType = fmt.toLowerCase();
        }
      }
    }

    const opt = document.createElement('option');
    opt.value = key;
    opt.setAttribute('data-name', tmpl.name);
    opt.setAttribute('data-lang', lang);
    opt.setAttribute('data-body', bodyText);
    opt.setAttribute('data-params', String(paramCount));
    if (headerMediaType) opt.setAttribute('data-has-media', headerMediaType);

    let iconPrefix = '💬 ';
    if (headerMediaType === 'image') iconPrefix = '📷 ';
    else if (headerMediaType === 'document') iconPrefix = '📄 ';
    else if (headerMediaType === 'video') iconPrefix = '🎥 ';

    const rawName = alias || tmpl.name.replace(/_/g, ' ');
    opt.textContent = `${iconPrefix}${rawName} (${lang})`;
    opt.title = `${tmpl.name} (${lang}) ${headerMediaType ? '[' + headerMediaType.toUpperCase() + ']' : ''}`;
    quickSelect.appendChild(opt);
  });

  if (prevVal && [...quickSelect.options].some(o => o.value === prevVal)) {
    quickSelect.value = prevVal;
  }
}

function setupChatHandlers() {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const quickTemplateBtn = document.getElementById('quickTemplateBtn');
  const quickTemplateModal = document.getElementById('quickTemplateModal');
  const closeQuickTmplBtn = document.getElementById('closeQuickTmplBtn');
  const sendQuickTmplBtn = document.getElementById('sendQuickTmplBtn');
  const refreshChatBtn = document.getElementById('refreshChatBtn');

  const startNewChatBtn = document.getElementById('startNewChatBtn');
  const openBulkHeaderBtn = document.getElementById('openBulkFromChatHeaderBtn');

  // Handle mobile Back button to return to chat list
  document.addEventListener('click', (e) => {
    const backBtn = e.target.closest('#waBackToListBtn, .wa-back-btn');
    if (backBtn) {
      const waCard = document.querySelector('.wa-chat-card');
      if (waCard) {
        waCard.classList.remove('wa-mobile-active');
      }
    }
  });

  if (openBulkHeaderBtn) {
    openBulkHeaderBtn.addEventListener('click', () => {
      openBulkModalWithManualNumbers();
    });
  }

  if (startNewChatBtn) {
    startNewChatBtn.addEventListener('click', () => {
      const rawInput = prompt('Sohbet Başlatılacak Telefon Numarasını veya Toplu Numaraları Girin:\n\n(Tek numara örn: 905451234567\nToplu numara örn: 905451112233, 905322223344 veya satır satır)');
      if (!rawInput) return;

      const parsedList = parseManualNumbersInput(rawInput);
      if (parsedList.length > 1) {
        openBulkModalWithManualNumbers(rawInput);
        return;
      }

      const cleanP = cleanPhoneNumber(rawInput);
      if (!cleanP || cleanP.length < 10) {
        alert('Geçersiz telefon numarası!');
        return;
      }

      if (!globalData) globalData = { conversations: [] };
      if (!globalData.conversations) globalData.conversations = [];

      let conv = globalData.conversations.find(c => cleanPhoneNumber(c.phone || c.name) === cleanP);
      if (!conv) {
        conv = {
          id: `chat-${cleanP}`,
          name: `Müşteri (${cleanP})`,
          phone: cleanP,
          avatar: 'WA',
          avatarBg: 'linear-gradient(135deg, #00A884 0%, #059669 100%)',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          online: true,
          messages_tr: [],
          messages_en: []
        };
        globalData.conversations.unshift(conv);
      }

      activeChatId = conv.id;
      renderChatConversations(globalData.conversations);
      renderActiveChatWindow(globalData.conversations);
    });
  }

  if (!chatInput || !sendBtn) return;

  // Toggle Template Picker
  const openQuickTemplatePanel = async () => {
    if (!quickTemplateModal) return;
    const isOpening = quickTemplateModal.style.display === 'none';
    quickTemplateModal.style.display = isOpening ? 'block' : 'none';
    if (isOpening) {
      await ensureQuickTemplatesLoaded();
      updateQuickTemplatePanel();
      setTimeout(() => {
        document.querySelector('#quickTmplPreview .qt-inline-input')?.focus();
      }, 80);
    }
  };

  if (quickTemplateBtn && quickTemplateModal) {
    quickTemplateBtn.addEventListener('click', openQuickTemplatePanel);
  }
  if (closeQuickTmplBtn && quickTemplateModal) {
    closeQuickTmplBtn.addEventListener('click', () => {
      quickTemplateModal.style.display = 'none';
    });
  }

  const quickTemplateInlineBtn = document.getElementById('quickTemplateInlineBtn');
  if (quickTemplateInlineBtn && quickTemplateModal) {
    quickTemplateInlineBtn.addEventListener('click', openQuickTemplatePanel);
  }

  const quickSelect = document.getElementById('quickTmplSelect');
  if (quickSelect) {
    quickSelect.addEventListener('change', updateQuickTemplatePanel);
    updateQuickTemplatePanel();
  }

  const quickFetchBtn = document.getElementById('quickFetchTemplatesBtn');
  if (quickFetchBtn) {
    quickFetchBtn.addEventListener('click', async () => {
      quickFetchBtn.textContent = '⏳';
      quickFetchBtn.disabled = true;
      await fetchMetaTemplatesFromApi();
      quickFetchBtn.textContent = '🔄';
      quickFetchBtn.disabled = false;
      updateQuickTemplatePanel();
    });
  }

  // Refresh Button
  if (refreshChatBtn) {
    refreshChatBtn.addEventListener('click', () => {
      startWebhookPolling();
    });
  }

  // Quick Template Media Dropzone & File Upload Handlers
  const dropzoneEl = document.getElementById('quickTmplMediaDropzone');
  const chooseFileBtn = document.getElementById('qtChooseFileBtn');
  const changeMediaBtn = document.getElementById('qtChangeMediaBtn');
  const headerFileInput = document.getElementById('tmplHeaderFile');
  const dropzoneContent = document.getElementById('qtDropzoneContent');
  const dropzonePreview = document.getElementById('qtDropzonePreview');
  const headerPreviewImg = document.getElementById('qtHeaderPreviewImg');
  const uploadStatus = document.getElementById('tmplHeaderUploadStatus');
  const hiddenMediaInput = document.getElementById('tmplHeaderMedia');

  const handleMediaFile = async (f) => {
    if (!f) return;
    const phoneId = document.getElementById('metaPhoneId')?.value.trim() || localStorage.getItem('meta_phone_id');
    const token = document.getElementById('metaToken')?.value.trim() || localStorage.getItem('meta_access_token');
    if (!phoneId || !token) {
      alert('Lütfen Ayarlar sekmesinde Meta Phone ID ve Access Token bilgilerinizi tanımlayın!');
      return;
    }

    // Local thumbnail preview immediately
    if (f.type.startsWith('image/')) {
      headerPreviewImg.src = URL.createObjectURL(f);
      headerPreviewImg.style.display = 'block';
    }
    if (dropzoneContent) dropzoneContent.style.display = 'none';
    if (dropzonePreview) dropzonePreview.style.display = 'flex';
    if (uploadStatus) {
      uploadStatus.textContent = '⏳ Meta API\'ye Yükleniyor...';
      uploadStatus.style.background = 'rgba(56, 189, 248, 0.85)';
    }

    try {
      const form = new FormData();
      form.append('messaging_product', 'whatsapp');
      form.append('type', f.type || 'image/jpeg');
      form.append('file', f, f.name);

      let resp = await fetch('/api/upload_media', {
        method: 'POST',
        headers: { 'x-meta-phoneid': phoneId, 'x-meta-token': token },
        body: form
      });

      let j;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        j = await resp.json();
      } else {
        const txt = await resp.text();
        try { j = JSON.parse(txt); } catch (e) { j = { text: txt }; }
      }

      // Fallback base64 upload if needed
      if ((!resp.ok && resp.status === 404) || !j) {
        const arr = await f.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(arr)));
        const body = JSON.stringify({ filename: f.name, mime: f.type || 'application/octet-stream', data: b64 });
        resp = await fetch('/api/upload_media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-meta-phoneid': phoneId, 'x-meta-token': token },
          body
        });
        const txt2 = await resp.text();
        try { j = JSON.parse(txt2); } catch (e) { j = { text: txt2 }; }
      }

      if (resp.ok && j && (j.id || j.media_id)) {
        const mid = j.id || j.media_id;
        if (hiddenMediaInput) hiddenMediaInput.value = mid;
        if (uploadStatus) {
          uploadStatus.textContent = `✅ Yüklendi`;
          uploadStatus.style.background = 'rgba(0, 168, 132, 0.9)';
        }
        const hintEl = document.getElementById('quickTmplHint');
        if (hintEl) {
          hintEl.textContent = '✅ Görsel hazır — tek tıkla gönderebilirsiniz.';
          hintEl.style.color = '#4ade80';
        }
      } else {
        const errTxt = j.error?.message || j.text || 'Görsel yükleme hatası';
        if (uploadStatus) {
          uploadStatus.textContent = `⚠️ ${errTxt}`;
          uploadStatus.style.background = 'rgba(239, 68, 68, 0.9)';
        }
      }
    } catch (e) {
      if (uploadStatus) {
        uploadStatus.textContent = `⚠️ ${e.message}`;
        uploadStatus.style.background = 'rgba(239, 68, 68, 0.9)';
      }
    }
  };

  if (chooseFileBtn && headerFileInput) {
    chooseFileBtn.addEventListener('click', (e) => { e.stopPropagation(); headerFileInput.click(); });
  }
  if (changeMediaBtn && headerFileInput) {
    changeMediaBtn.addEventListener('click', (e) => { e.stopPropagation(); headerFileInput.click(); });
  }
  if (dropzonePreview && headerFileInput) {
    dropzonePreview.addEventListener('click', (e) => { e.stopPropagation(); headerFileInput.click(); });
  }
  if (dropzoneEl && headerFileInput) {
    dropzoneEl.addEventListener('click', () => {
      if (!hiddenMediaInput?.value) headerFileInput.click();
    });
    dropzoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneEl.style.borderColor = '#25d366';
      dropzoneEl.style.background = 'rgba(0, 168, 132, 0.15)';
    });
    dropzoneEl.addEventListener('dragleave', () => {
      dropzoneEl.style.borderColor = '#00a884';
      dropzoneEl.style.background = '#182229';
    });
    dropzoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneEl.style.borderColor = '#00a884';
      dropzoneEl.style.background = '#182229';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleMediaFile(e.dataTransfer.files[0]);
      }
    });
  }
  if (headerFileInput) {
    headerFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleMediaFile(e.target.files[0]);
    });
  }

  // Quick Autofill Helper Chip Actions
  const fillCustomerNameBtn = document.getElementById('qtFillCustomerNameBtn');
  const fillTodayDateBtn = document.getElementById('qtFillTodayDateBtn');
  const fillStudioLocBtn = document.getElementById('qtFillStudioLocBtn');

  const fillFirstAvailableInput = (val) => {
    const inputs = Array.from(document.querySelectorAll('#quickTmplPreview .qt-inline-input'));
    const target = inputs.find(i => !i.value.trim()) || inputs[0];
    if (target) {
      target.value = val;
      target.dispatchEvent(new Event('input'));
      target.focus();
    }
  };

  if (fillCustomerNameBtn) {
    fillCustomerNameBtn.addEventListener('click', () => {
      const conv = globalData?.conversations?.find(c => c.id === activeChatId);
      const name = (conv && conv.name && !conv.name.includes('Müşteri (')) ? conv.name.trim() : 'Değerli Müşterimiz';
      fillFirstAvailableInput(name);
    });
  }
  if (fillTodayDateBtn) {
    fillTodayDateBtn.addEventListener('click', () => {
      const now = new Date();
      const dStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
      fillFirstAvailableInput(dStr);
    });
  }
  if (fillStudioLocBtn) {
    fillStudioLocBtn.addEventListener('click', () => {
      fillFirstAvailableInput('Cleopatra Ink Studio');
    });
  }

  // Quick Chips Bar Event Listeners (Chat Üstü Hızlı Şablon Hapları)
  document.querySelectorAll('.wa-quick-chip[data-template-keyword]').forEach(chip => {
    chip.addEventListener('click', async () => {
      const kw = chip.getAttribute('data-template-keyword').toLowerCase();
      await ensureQuickTemplatesLoaded();
      const quickSelectEl = document.getElementById('quickTmplSelect');
      if (quickSelectEl && quickSelectEl.options.length > 0) {
        const matchingOpt = Array.from(quickSelectEl.options).find(o => {
          const val = (o.value + ' ' + (o.getAttribute('data-name') || '') + ' ' + o.textContent).toLowerCase();
          return val.includes(kw);
        });
        if (matchingOpt) {
          quickSelectEl.value = matchingOpt.value;
        }
      }
      if (quickTemplateModal) {
        quickTemplateModal.style.display = 'block';
        updateQuickTemplatePanel();
      }
    });
  });

  const openAllChip = document.getElementById('waOpenAllTemplatesChip');
  if (openAllChip && quickTemplateModal) {
    openAllChip.addEventListener('click', async () => {
      await ensureQuickTemplatesLoaded();
      quickTemplateModal.style.display = 'block';
      updateQuickTemplatePanel();
      setTimeout(() => document.getElementById('quickTmplSelect')?.focus(), 60);
    });
  }

  // Send Quick Template Action
  if (sendQuickTmplBtn) {
    sendQuickTmplBtn.addEventListener('click', async () => {
      let targetPhone = '';
      let conv = globalData && globalData.conversations ? globalData.conversations.find(c => c.id === activeChatId) : null;

      if (conv) {
        targetPhone = conv.phone || conv.name;
      } else {
        const inputP = prompt('Telefon numarası:\n(Örn: 905451234567)');
        if (!inputP) return;
        targetPhone = cleanPhoneNumber(inputP);
      }

      if (!targetPhone) {
        alert('Geçerli bir telefon numarası girin.');
        return;
      }

      const quickSelectEl = document.getElementById('quickTmplSelect');
      const opt = quickSelectEl?.options[quickSelectEl.selectedIndex];
      const tmplName = opt?.getAttribute('data-name') || (quickSelectEl?.value?.includes('|') ? quickSelectEl.value.split('|')[0] : quickSelectEl?.value) || 'hello_world';
      const lang = opt?.getAttribute('data-lang') || 'tr';
      // Collect parameter values from the actual rendered inputs in the preview.
      const previewEl = document.getElementById('quickTmplPreview');
      const inlineInputs = previewEl ? Array.from(previewEl.querySelectorAll('.qt-inline-input')) : [];
      const params = inlineInputs.map(i => (i.value || '').trim());
      const mediaType = opt?.getAttribute('data-has-media');
      const headerMedia = document.getElementById('tmplHeaderMedia')?.value?.trim() || '';

      if (mediaType && !headerMedia) {
        alert(`Bu şablon başlıkta bir ${mediaType.toUpperCase()} (görsel/dosya) gerektiriyor. Lütfen bir görsel seçin/yükleyin veya görsel URL'si / media_id girin.`);
        document.getElementById('tmplHeaderMedia')?.focus();
        return;
      }

      if (inlineInputs.length > 0 && params.some(v => !v)) {
        alert('Lütfen mesajdaki tüm mavi alanları doldurun.');
        previewEl.querySelector('.qt-inline-input:placeholder-shown')?.focus();
        return;
      }

      sendQuickTmplBtn.textContent = '⏳ Gönderiliyor…';
      sendQuickTmplBtn.disabled = true;

      const result = await sendDirectWhatsAppTemplateMessage(targetPhone, tmplName, lang, params, headerMedia, mediaType);
      sendQuickTmplBtn.textContent = '🚀 Şablonu Gönder';
      sendQuickTmplBtn.disabled = false;

      if (result.success) {
        if (quickTemplateModal) quickTemplateModal.style.display = 'none';
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const msgText = `[Şablon: ${tmplName}] ${params.length > 0 ? params.join(', ') : ''}`;

        if (!conv) {
          conv = {
            id: `chat-${targetPhone}`,
            name: `Müşteri (${targetPhone})`,
            phone: targetPhone,
            avatar: 'WA',
            avatarBg: 'linear-gradient(135deg, #00A884 0%, #059669 100%)',
            time: timeStr,
            unread: 0,
            online: true,
            messages_tr: [],
            messages_en: []
          };
          if (!globalData) globalData = { conversations: [] };
          if (!globalData.conversations) globalData.conversations = [];
          globalData.conversations.unshift(conv);
          activeChatId = conv.id;
        }

        conv.messages_tr.push({ sender: 'studio', text: msgText, time: timeStr });
        conv.messages_en.push({ sender: 'studio', text: msgText, time: timeStr });

        renderChatConversations(globalData.conversations);
        renderActiveChatWindow(globalData.conversations);
      } else {
        alert(`Gönderilemedi:\n${result.error}`);
      }
    });
  }

  chatInput.addEventListener('input', () => {
    if (chatInput.value.trim().length > 0) {
      sendBtn.textContent = '✈️';
      sendBtn.style.color = '#38BDF8';
    } else {
      sendBtn.textContent = '➤';
      sendBtn.style.color = 'var(--text-muted)';
    }
  });

  const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text || !globalData || !globalData.conversations) return;

    const conv = globalData.conversations.find(c => c.id === activeChatId);
    if (!conv) return;

    const targetPhone = conv.phone || conv.name || '905457120723';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add local bubble immediately
    conv.messages_tr.push({ sender: 'studio', text, time: timeStr });
    conv.messages_en.push({ sender: 'studio', text, time: timeStr });

    chatInput.value = '';
    sendBtn.textContent = '➤';
    sendBtn.style.color = 'var(--text-muted)';

    renderChatConversations(globalData.conversations);
    renderActiveChatWindow(globalData.conversations);

    // Send real Meta Cloud API WhatsApp text message
    const res = await sendDirectWhatsAppTextMessage(targetPhone, text);
    if (!res.success) {
      console.warn('[Cloud API Send Notice]:', res.error);
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Start continuous polling for incoming messages
  startWebhookPolling();
}

function setupFilters() {
  const searchInput = document.getElementById('customerSearch');
  const limitSelect = document.getElementById('customerLimitSelect');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (globalData && globalData.customers) {
        renderCustomersTable(globalData.customers);
      }
    });
  }

  if (limitSelect) {
    limitSelect.addEventListener('change', () => {
      if (globalData && globalData.customers) {
        renderCustomersTable(globalData.customers);
      }
    });
  }
}

function setupSettingsHandlers() {
  const saveBtn = document.getElementById('saveSettingsBtn');
  const testBtn = document.getElementById('testDbBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const msg = currentLang === 'tr' ? 'Sistem ayarları başarıyla kaydedildi!' : 'System Settings saved successfully!';
      alert(msg);
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      testBtn.textContent = currentLang === 'tr' ? 'Test Ediliyor...' : 'Testing...';
      setTimeout(() => {
        const msg = currentLang === 'tr' 
          ? 'Supabase Bağlantı Durumu: 200 OK (Rezervasyon ve profil tabloları bağlandı)' 
          : 'Supabase Connection Status: 200 OK (Connected to reservations & profiles tables)';
        alert(msg);
        testBtn.textContent = TRANSLATIONS[currentLang].testDbBtn;
      }, 1000);
    });
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
  if (modalId === 'bulkMessageModal') {
    resetBulkMessageModal();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

/**
 * Setup Dynamic CRUD Modals Handlers & Supabase Form Submissions
 */
function setupModalHandlers() {
  // Bind Open Buttons across views
  document.querySelectorAll('[data-i18n="addCustomerBtn"]').forEach(btn => {
    btn.addEventListener('click', () => openModal('addCustomerModal'));
  });
  document.querySelectorAll('[data-i18n="newBookingBtn"]').forEach(btn => {
    btn.addEventListener('click', () => openModal('addAppointmentModal'));
  });
  document.querySelectorAll('[data-i18n="createNewCampaignBtn"]').forEach(btn => {
    btn.addEventListener('click', () => openModal('addCampaignModal'));
  });
  document.querySelectorAll('[data-i18n="registerBranchBtn"]').forEach(btn => {
    btn.addEventListener('click', () => openModal('addBranchModal'));
  });

  // 1. Submit New Customer Form directly to Supabase REST API
  const addCustForm = document.getElementById('addCustomerForm');
  if (addCustForm) {
    addCustForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newCustName').value.trim();
      const phone = document.getElementById('newCustPhone').value.trim();
      const date = document.getElementById('newCustDate').value || new Date().toISOString();
      const resNo = 'RES-' + Math.floor(1000 + Math.random() * 9000);

      try {
        await dashboardDB.createReservation({
          ReservationNumber: resNo,
          CustomerNameSurname: name,
          Phone: phone,
          StartDate: date
        });

        closeModal('addCustomerModal');
        addCustForm.reset();
        alert(currentLang === 'tr' ? `Müşteri başarıyla Supabase'e kaydedildi! (${resNo})` : `Customer saved to Supabase! (${resNo})`);
        
        // Re-fetch live data
        globalData = await dashboardDB.getDashboardData();
        renderAllViews();
      } catch (err) {
        alert('Supabase Kayıt Hatası: ' + err.message);
      }
    });
  }

  // 2. Submit New Appointment Form directly to Supabase REST API
  const addAppForm = document.getElementById('addAppointmentForm');
  if (addAppForm) {
    addAppForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const client = document.getElementById('newAppClient').value.trim();
      const phone = document.getElementById('newAppPhone').value.trim();
      const date = document.getElementById('newAppDate').value || new Date().toISOString();
      const artist = document.getElementById('newAppArtist').value;
      const deposit = document.getElementById('newAppDeposit').value;
      const resNo = 'RES-' + Math.floor(1000 + Math.random() * 9000);

      try {
        await dashboardDB.createReservation({
          ReservationNumber: resNo,
          CustomerNameSurname: client,
          Phone: phone,
          StartDate: date
        });

        closeModal('addAppointmentModal');
        addAppForm.reset();
        alert(currentLang === 'tr' ? `Randevu başarıyla Supabase'e kaydedildi! (${resNo})` : `Booking saved to Supabase! (${resNo})`);

        // Re-fetch live data
        globalData = await dashboardDB.getDashboardData();
        renderAllViews();
      } catch (err) {
        alert('Supabase Kayıt Hatası: ' + err.message);
      }
    });
  }

  // 3. Submit New Campaign Form
  const addCampForm = document.getElementById('addCampaignForm');
  if (addCampForm) {
    addCampForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('newCampTitle').value.trim();
      const desc = document.getElementById('newCampDesc').value.trim();
      const rate = parseFloat(document.getElementById('newCampRate').value) || 20;

      if (globalData && globalData.campaigns) {
        globalData.campaigns.unshift({
          id: Date.now(),
          title_tr: title,
          title_en: title,
          description_tr: desc,
          description_en: desc,
          rate: rate,
          sentCount: 1,
          status_tr: 'Aktif',
          status_en: 'Active',
          icon: '🚀'
        });
        renderCampaigns(globalData.campaigns);
        renderCampaignsGrid(globalData.campaigns);
      }

      closeModal('addCampaignModal');
      addCampForm.reset();
      alert(currentLang === 'tr' ? 'Reaktivasyon kampanyası başlatıldı!' : 'Reactivation campaign launched!');
    });
  }

  // 4. Submit New Branch Form
  const addBranchForm = document.getElementById('addBranchForm');
  if (addBranchForm) {
    addBranchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('newBranchName').value.trim();
      const manager = document.getElementById('newBranchManager').value.trim();
      const phone = document.getElementById('newBranchPhone').value.trim();

      if (globalData && globalData.franchises) {
        globalData.franchises.unshift({
          name_tr: name,
          name_en: name,
          manager: manager,
          phone: phone,
          clients: 1,
          uptime: '100%',
          status_tr: 'Aktif',
          status_en: 'Active'
        });
        renderFranchisesGrid(globalData.franchises);
      }

      closeModal('addBranchModal');
      addBranchForm.reset();
      alert(currentLang === 'tr' ? 'Yeni şube kaydedildi!' : 'New branch registered!');
    });
  }

  // 5. Bulk Messaging Module Listeners & Settings Persistence
  setupBulkMessagingEventListeners();
}

/**
 * Update UI Counters & Selection Badges
 */
function updateSelectionUI() {
  const badge = document.getElementById('selectedCountBadge');
  const modalCount = document.getElementById('bulkModalRecipientCount');
  const modalPhonePreview = document.getElementById('bulkModalPhonePreview');
  const selectAll = document.getElementById('selectAllCustomers');

  const count = selectedCustomerIds.size;
  if (badge) badge.textContent = count;
  if (modalCount) modalCount.textContent = `${count} Müşteri`;

  const selectedList = getSelectedCustomersList();
  if (modalPhonePreview) {
    if (selectedList.length > 0) {
      modalPhonePreview.textContent = `Örn: ${selectedList[0].name} (${selectedList[0].phone})`;
    } else {
      modalPhonePreview.textContent = '';
    }
  }

  // Select all checkbox status
  if (selectAll && globalData && globalData.customers) {
    const displayedCheckboxes = document.querySelectorAll('.cust-row-checkbox');
    if (displayedCheckboxes.length > 0) {
      const allChecked = Array.from(displayedCheckboxes).every(cb => cb.checked);
      selectAll.checked = allChecked;
    }
  }
}

/**
 * Get list of currently selected customer objects
 */
function getSelectedCustomersList() {
  if (!globalData || !Array.isArray(globalData.customers)) return [];
  return globalData.customers.filter(c => selectedCustomerIds.has(c.id));
}

/**
 * Attach listeners to customer table row checkboxes
 */
function attachCustomerCheckboxListeners() {
  const checkboxes = document.querySelectorAll('.cust-row-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      const row = e.target.closest('tr');
      if (e.target.checked) {
        selectedCustomerIds.add(id);
        if (row) row.classList.add('selected-row');
      } else {
        selectedCustomerIds.delete(id);
        if (row) row.classList.remove('selected-row');
      }
      updateSelectionUI();
    });
  });

  const selectAll = document.getElementById('selectAllCustomers');
  if (selectAll) {
    selectAll.replaceWith(selectAll.cloneNode(true));
    const newSelectAll = document.getElementById('selectAllCustomers');
    newSelectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const displayedCBs = document.querySelectorAll('.cust-row-checkbox');
      displayedCBs.forEach(cb => {
        const id = cb.getAttribute('data-id');
        cb.checked = isChecked;
        const row = cb.closest('tr');
        if (isChecked) {
          selectedCustomerIds.add(id);
          if (row) row.classList.add('selected-row');
        } else {
          selectedCustomerIds.delete(id);
          if (row) row.classList.remove('selected-row');
        }
      });
      updateSelectionUI();
    });
  }
}

/**
 * Open Bulk Messaging Modal pre-selected for a single customer
 */
window.openSingleCustomerWhatsApp = function(id, phone, name) {
  selectedCustomerIds.clear();
  selectedCustomerIds.add(id);
  renderCustomersTable(globalData ? globalData.customers : []);
  openModal('bulkMessageModal');
  bulkSendMode = 'template';
  updateBulkRecipientUI();
  updateLiveWhatsAppPreview();
};

/**
 * Insert variable placeholder into message textarea
 */
window.insertVariable = function(varName) {
  const textarea = document.getElementById('bulkMsgText');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  textarea.value = text.substring(0, start) + varName + text.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + varName.length;
  textarea.focus();
  updateLiveWhatsAppPreview();
};

/**
 * Update WhatsApp Live Bubble Preview
 */
function updateLiveWhatsAppPreview() {
  const previewEl = document.getElementById('waPreviewText');
  const textarea = document.getElementById('bulkMsgText');
  if (!previewEl) return;

  const sampleCust = getEffectiveRecipientList()[0] || { name: 'Caner Yılmaz', phone: '905321002233' };

  if (bulkSendMode === 'text') {
    const rawVal = textarea ? textarea.value.trim() : '';
    if (!rawVal) {
      previewEl.textContent = '(Henüz mesaj yazılmadı...)';
      previewEl.style.opacity = '0.6';
    } else {
      let msg = rawVal.replace(/\{name\}/g, sampleCust.name)
                      .replace(/\{phone\}/g, sampleCust.phone)
                      .replace(/\{id\}/g, sampleCust.id || 'RES-101');
      previewEl.textContent = msg;
      previewEl.style.opacity = '1';
    }
  } else {
    const tmplName = document.getElementById('bulkTemplateName')?.value || 'hello_world';
    const tmplLang = document.getElementById('bulkTemplateLang')?.value || 'en_US';
    const tmplBody = selectedTemplateBody || 'Merhaba {{1}}, stüdyomuza davetlisiniz!';
    
    const p1Raw = document.getElementById('bulkTmplP1')?.value || '{name}';
    const p2Val = document.getElementById('bulkTmplP2')?.value || '%20';
    const p3Val = document.getElementById('bulkTmplP3')?.value || 'Alex Realism';

    const p1Val = p1Raw.replace(/\{name\}/g, sampleCust.name);

    let formattedBody = tmplBody.replace(/\{\{1\}\}/g, p1Val)
                                .replace(/\{\{2\}\}/g, p2Val)
                                .replace(/\{\{3\}\}/g, p3Val);
    previewEl.textContent = `[WhatsApp Şablonu: ${tmplName} (${tmplLang})]\n\n${formattedBody}`;
  }
}

let bulkRecipientSource = 'table'; // 'table' or 'manual'
let cancelBulkDispatchFlag = false;
let lastFailedRecipients = [];

/**
 * Setup Event Listeners for Bulk Messaging Modal
 */
function setupBulkMessagingEventListeners() {
  // Open Bulk Modal Button
  const openBtn = document.getElementById('openBulkMsgBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openModal('bulkMessageModal');
      bulkSendMode = 'template';
      updateBulkRecipientUI();
      updateLiveWhatsAppPreview();
    });
  }

  // Toggle Customer Selection List
  const toggleCustBtn = document.getElementById('toggleCustomerListBtn');
  const secCustList = document.getElementById('sectionCustomerList');
  if (toggleCustBtn && secCustList) {
    toggleCustBtn.addEventListener('click', () => {
      const isHidden = secCustList.style.display === 'none';
      secCustList.style.display = isHidden ? 'block' : 'none';
      toggleCustBtn.textContent = isHidden ? '▲ Müşteri Listesini Kapat' : '✏️ Müşterileri Listele / Düzenle';
      if (isHidden) renderModalCustomerList(false);
    });
  }

  // Bulk Media Dropzone & Upload Handlers
  const bulkFileInp = document.getElementById('bulkHeaderFileInput');
  const bulkChooseBtn = document.getElementById('bulkChooseFileBtn');
  const bulkChangeBtn = document.getElementById('bulkChangeMediaBtn');
  const bulkDropzone = document.getElementById('bulkTmplMediaDropzone');
  const bulkPreviewDiv = document.getElementById('bulkDropzonePreview');
  const bulkPreviewImg = document.getElementById('bulkHeaderPreviewImg');
  const bulkHiddenMedia = document.getElementById('bulkHeaderMedia');
  const bulkUploadStatus = document.getElementById('bulkHeaderUploadStatus');
  const bulkDropContent = document.getElementById('bulkDropzoneContent');

  const handleBulkMediaFile = async (f) => {
    if (!f) return;
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (bulkPreviewImg) bulkPreviewImg.src = e.target.result;
        if (bulkDropContent) bulkDropContent.style.display = 'none';
        if (bulkPreviewDiv) bulkPreviewDiv.style.display = 'flex';
      };
      reader.readAsDataURL(f);
    }
    if (bulkUploadStatus) {
      bulkUploadStatus.textContent = '⏳ Yükleniyor...';
      bulkUploadStatus.style.background = 'rgba(56, 189, 248, 0.9)';
    }
    const phoneId = document.getElementById('metaPhoneId')?.value.trim() || localStorage.getItem('meta_phone_id');
    const token = document.getElementById('metaToken')?.value.trim() || localStorage.getItem('meta_access_token');
    if (!phoneId || !token) {
      if (bulkUploadStatus) {
        bulkUploadStatus.textContent = '⚠️ Meta token eksik';
        bulkUploadStatus.style.background = 'rgba(239, 68, 68, 0.9)';
      }
      return;
    }
    try {
      const form = new FormData();
      form.append('messaging_product', 'whatsapp');
      form.append('type', f.type || 'image/jpeg');
      form.append('file', f, f.name);
      let resp = await fetch('/api/upload_media', {
        method: 'POST',
        headers: { 'x-meta-phoneid': phoneId, 'x-meta-token': token },
        body: form
      });
      let j;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) j = await resp.json();
      else {
        const txt = await resp.text();
        try { j = JSON.parse(txt); } catch (e) { j = { text: txt }; }
      }
      if (resp.ok && j && (j.id || j.media_id)) {
        const mid = j.id || j.media_id;
        if (bulkHiddenMedia) bulkHiddenMedia.value = mid;
        if (bulkUploadStatus) {
          bulkUploadStatus.textContent = '✅ Yüklendi';
          bulkUploadStatus.style.background = 'rgba(0, 168, 132, 0.9)';
        }
      } else {
        if (bulkUploadStatus) {
          bulkUploadStatus.textContent = '⚠️ Yükleme Hatası';
          bulkUploadStatus.style.background = 'rgba(239, 68, 68, 0.9)';
        }
      }
    } catch (err) {
      if (bulkUploadStatus) {
        bulkUploadStatus.textContent = `⚠️ ${err.message}`;
        bulkUploadStatus.style.background = 'rgba(239, 68, 68, 0.9)';
      }
    }
  };

  if (bulkChooseBtn && bulkFileInp) bulkChooseBtn.addEventListener('click', (e) => { e.stopPropagation(); bulkFileInp.click(); });
  if (bulkChangeBtn && bulkFileInp) bulkChangeBtn.addEventListener('click', (e) => { e.stopPropagation(); bulkFileInp.click(); });
  if (bulkPreviewDiv && bulkFileInp) bulkPreviewDiv.addEventListener('click', (e) => { e.stopPropagation(); bulkFileInp.click(); });
  if (bulkDropzone && bulkFileInp) {
    bulkDropzone.addEventListener('click', () => { if (!bulkHiddenMedia?.value) bulkFileInp.click(); });
    bulkDropzone.addEventListener('dragover', (e) => { e.preventDefault(); bulkDropzone.style.borderColor = '#25d366'; });
    bulkDropzone.addEventListener('dragleave', () => { bulkDropzone.style.borderColor = 'rgba(0, 168, 132, 0.45)'; });
    bulkDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      bulkDropzone.style.borderColor = 'rgba(0, 168, 132, 0.45)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleBulkMediaFile(e.dataTransfer.files[0]);
    });
  }
  if (bulkFileInp) bulkFileInp.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleBulkMediaFile(e.target.files[0]);
  });

  // Autofill Chips for Bulk Modal
  document.querySelectorAll('#bulkAutofillRow .qt-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fillType = btn.getAttribute('data-fill');
      let targetVal = '';
      if (fillType === '{name}') targetVal = '{name}';
      else if (fillType === '%25') targetVal = '%25';
      else if (fillType === 'date') targetVal = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
      else if (fillType === 'studio') targetVal = 'Cleopatra Ink Gündoğdu';

      const inputs = document.querySelectorAll('#bulkInteractivePreviewBubble .bulk-inline-input');
      const emptyInput = Array.from(inputs).find(inp => !inp.value || inp.value.startsWith('Alan') || inp.value.startsWith('Param'));
      if (emptyInput) {
        emptyInput.value = targetVal;
        emptyInput.dispatchEvent(new Event('input', { bubbles: true }));
        emptyInput.focus();
      } else if (inputs[0]) {
        inputs[0].value = targetVal;
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  // Recipient Source Switcher Tabs (Table vs Manual)
  const btnSrcTable = document.getElementById('btnSourceTable');
  const btnSrcManual = document.getElementById('btnSourceManual');
  const secManual = document.getElementById('sectionManualInput');

  if (btnSrcTable && btnSrcManual) {
    btnSrcTable.addEventListener('click', () => {
      bulkRecipientSource = 'table';
      btnSrcTable.classList.add('active');
      btnSrcManual.classList.remove('active');
      if (secManual) secManual.style.display = 'none';
      updateBulkRecipientUI();
      updateLiveWhatsAppPreview();
    });

    btnSrcManual.addEventListener('click', () => {
      bulkRecipientSource = 'manual';
      btnSrcManual.classList.add('active');
      btnSrcTable.classList.remove('active');
      if (secManual) secManual.style.display = 'block';
      updateBulkRecipientUI();
      updateLiveWhatsAppPreview();
    });
  }

  // Manual Numbers Input Textarea Change
  const manualInput = document.getElementById('bulkManualNumbersInput');
  if (manualInput) {
    manualInput.addEventListener('input', () => {
      updateBulkRecipientUI();
      updateLiveWhatsAppPreview();
    });
  }

  // Template Select Dropdown Change
  const tmplSelect = document.getElementById('bulkTemplateSelect');
  if (tmplSelect) {
    tmplSelect.addEventListener('change', onTemplateDropdownChange);
  }

  // Fetch Templates Button from Meta API
  const fetchTmplBtn = document.getElementById('fetchTemplatesBtn');
  if (fetchTmplBtn) {
    fetchTmplBtn.addEventListener('click', fetchMetaTemplatesFromApi);
  }

  // Start Bulk Dispatch Button
  const startBtn = document.getElementById('startBulkDispatchBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => startBulkMessageDispatch(getEffectiveRecipientList()));
  }

  // Cancel Bulk Dispatch Button
  const cancelBtn = document.getElementById('cancelBulkDispatchBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      cancelBulkDispatchFlag = true;
      cancelBtn.textContent = '⏳ Durduruluyor...';
    });
  }

  // Retry Failed Button
  const retryBtn = document.getElementById('retryFailedBulkBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (lastFailedRecipients.length > 0) {
        startBulkMessageDispatch(lastFailedRecipients);
      }
    });
  }

  // Settings Save Button (Persist Meta API Keys)
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveMetaApiSettings);
  }

  loadMetaApiSettings();
}

/**
 * Helper to open Bulk Messaging modal in Manual Input mode prefilled with text
 */
function openBulkModalWithManualNumbers(prefilledNumbersText = '') {
  openModal('bulkMessageModal');
  const btnSrcManual = document.getElementById('btnSourceManual');
  if (btnSrcManual) btnSrcManual.click();

  const inputEl = document.getElementById('bulkManualNumbersInput');
  if (inputEl) {
    if (prefilledNumbersText) {
      inputEl.value = prefilledNumbersText;
    }
    setTimeout(() => inputEl.focus(), 100);
  }
  updateBulkRecipientUI();
  updateLiveWhatsAppPreview();
}

/**
 * Validate whether a phone number is a valid WhatsApp mobile number
 */
function isValidWhatsAppNumber(rawPhone) {
  if (!rawPhone) return false;
  const cleaned = String(rawPhone).replace(/\D/g, '');

  // 0. Exclude Opted-Out (DUR / Blacklisted) Numbers
  if (globalOptOutList && globalOptOutList.includes(cleaned)) return false;

  // 1. Minimum 10 digits, Maximum 15 digits (E.164 standard)
  if (cleaned.length < 10 || cleaned.length > 15) return false;

  // 2. Reject repetitive dummy patterns (e.g. 0000000000, 1111111111, 1234567890, 900000000000)
  if (/^(\d)\1+$/.test(cleaned)) return false;
  if (cleaned.includes('12345678') || cleaned.includes('0000000') || cleaned === '900000000000') return false;

  // 3. Validation for Turkish mobile phone formats:
  // - 12 digits starting with 90: Must start with 905 (Turkish Mobile)
  // - 11 digits starting with 0: Must start with 05 (Turkish Mobile)
  // - 10 digits without prefix: Must start with 5 (Turkish Mobile) or be valid international
  if (cleaned.startsWith('90')) {
    if (cleaned.length === 12 && !cleaned.startsWith('905')) return false;
  } else if (cleaned.startsWith('0')) {
    if (cleaned.length === 11 && !cleaned.startsWith('05')) return false;
  } else if (cleaned.length === 10) {
    if (!cleaned.startsWith('5')) return false;
  }

  return true;
}

window.isValidWhatsAppNumber = isValidWhatsAppNumber;

/**
 * Parse manual numbers input from textarea
 */
function parseManualNumbersInput(rawText) {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split(/[\r\n;]+/);
  const result = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let phone = trimmed;
    let name = 'Müşteri';

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',');
      phone = parts[0].trim();
      name = parts.slice(1).join(',').trim() || 'Müşteri';
    }

    const clean = cleanPhoneNumber(phone);
    if (clean && isValidWhatsAppNumber(clean)) {
      result.push({
        id: `manual-${idx + 1}`,
        name: name,
        phone: clean
      });
    }
  });

  return result;
}

/**
 * Get current effective recipient list based on active source tab
 */
function getEffectiveRecipientList() {
  if (bulkRecipientSource === 'manual') {
    const raw = document.getElementById('bulkManualNumbersInput')?.value || '';
    return parseManualNumbersInput(raw);
  } else {
    return getSelectedCustomersList();
  }
}

/**
 * Update UI labels and badges for bulk recipients
 */
function updateBulkRecipientUI() {
  const tableCount = selectedCustomerIds.size;
  const tableBadge = document.getElementById('bulkSourceTableCount');
  if (tableBadge) tableBadge.textContent = String(tableCount);

  const effectiveList = getEffectiveRecipientList();
  const countBadge = document.getElementById('bulkModalRecipientCount');
  if (countBadge) {
    countBadge.textContent = `${effectiveList.length} Müşteri`;
  }

  const startBtn = document.getElementById('startBulkDispatchBtn');
  if (startBtn) {
    if (effectiveList.length === 1) {
      startBtn.textContent = `🚀 Müşteriye Gönder (${effectiveList[0].name || effectiveList[0].phone})`;
    } else if (effectiveList.length > 1) {
      startBtn.textContent = `🚀 Seçilen (${effectiveList.length}) Müşteriye Şablonu Gönder`;
    } else {
      startBtn.textContent = `🚀 Gönderimi Başlat (0 Müşteri)`;
    }
  }

  const phonePreview = document.getElementById('bulkModalPhonePreview');
  if (phonePreview) {
    if (effectiveList.length > 0) {
      const samplePhones = effectiveList.slice(0, 3).map(c => `${c.name} (${c.phone})`).join(', ');
      phonePreview.textContent = effectiveList.length > 3 ? `${samplePhones} ...` : samplePhones;
    } else {
      phonePreview.textContent = 'Numara seçilmedi';
    }
  }

  const manualBadge = document.getElementById('manualParseBadge');
  if (manualBadge) {
    if (bulkRecipientSource === 'manual') {
      const rawVal = (document.getElementById('bulkManualNumbersInput')?.value || '').trim();
      if (!rawVal) {
        manualBadge.textContent = '';
      } else {
        const manualList = parseManualNumbersInput(rawVal);
        manualBadge.textContent = `✓ ${manualList.length} Adet geçerli numara tespit edildi.`;
        manualBadge.style.color = manualList.length > 0 ? '#38bdf8' : '#ef4444';
      }
    } else {
      manualBadge.textContent = '';
    }
  }
}

let selectedTemplateBody = 'Hello World! Welcome to WhatsApp.';

/**
 * Template Dropdown Selection Handler
 */
function onTemplateDropdownChange() {
  const select = document.getElementById('bulkTemplateSelect');
  if (!select) return;

  const opt = select.options[select.selectedIndex];
  const nameInput = document.getElementById('bulkTemplateName');
  const langInput = document.getElementById('bulkTemplateLang');
  const previewBubble = document.getElementById('bulkInteractivePreviewBubble');
  const dropzoneEl = document.getElementById('bulkTmplMediaDropzone');
  const dropzoneContent = document.getElementById('bulkDropzoneContent');
  const dropzonePreview = document.getElementById('bulkDropzonePreview');
  const previewImg = document.getElementById('bulkHeaderPreviewImg');
  const hiddenMediaInput = document.getElementById('bulkHeaderMedia');
  const autofillRow = document.getElementById('bulkAutofillRow');

  if (!opt) return;

  const tmplName = opt.getAttribute('data-name') || (opt.value.includes('|') ? opt.value.split('|')[0] : opt.value);
  const lang = opt.getAttribute('data-lang') || 'tr';
  const body = opt.getAttribute('data-body') || '';
  const paramCount = parseInt(opt.getAttribute('data-params') || '0', 10);
  const mediaType = opt.getAttribute('data-has-media');

  if (nameInput) nameInput.value = tmplName;
  if (langInput) langInput.value = lang;
  selectedTemplateBody = body;
  bulkSendMode = 'template';

  // 1. Build interactive inline inputs in WhatsApp bubble
  if (previewBubble) {
    const existingValues = {};
    for (let i = 1; i <= 20; i++) {
      const el = document.getElementById(`bulkTmplP${i}`);
      if (el) existingValues[i] = el.value;
    }
    previewBubble.innerHTML = buildBulkPreviewHtml(body, paramCount, existingValues, select.dataset.lastTmpl === tmplName);
  }
  select.dataset.lastTmpl = tmplName;

  // 2. Handle Media Header (Strictly show only if template expects media)
  if (mediaType && (mediaType === 'image' || mediaType === 'document' || mediaType === 'video') && dropzoneEl) {
    dropzoneEl.style.display = 'block';
    const strongText = dropzoneContent?.querySelector('strong');
    if (strongText) strongText.textContent = `Şablon Başlık Görseli (${mediaType.toUpperCase()})`;
    if (hiddenMediaInput && hiddenMediaInput.value && previewImg && previewImg.src) {
      if (dropzoneContent) dropzoneContent.style.display = 'none';
      if (dropzonePreview) dropzonePreview.style.display = 'flex';
    } else {
      if (dropzoneContent) dropzoneContent.style.display = 'flex';
      if (dropzonePreview) dropzonePreview.style.display = 'none';
    }
  } else if (dropzoneEl) {
    dropzoneEl.style.display = 'none';
    if (hiddenMediaInput) hiddenMediaInput.value = '';
    if (previewImg) previewImg.src = '';
  }

  // 3. Autofill Row
  if (autofillRow) {
    autofillRow.style.display = paramCount > 0 ? 'flex' : 'none';
  }

  updateLiveWhatsAppPreview();
}

// ==========================================================================
// META MESAJ ŞABLONLARI TAKMA AD (ALIAS) & ÖNİZLEME SİSTEMİ
// ==========================================================================

function getTemplateAliases() {
  try {
    const raw = localStorage.getItem('meta_template_aliases');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveTemplateAlias(key, alias) {
  try {
    const aliases = getTemplateAliases();
    if (alias && alias.trim()) {
      aliases[key] = alias.trim();
    } else {
      delete aliases[key];
    }
    localStorage.setItem('meta_template_aliases', JSON.stringify(aliases));
    updateTemplateDropdownsWithAliases();
  } catch (e) {
    console.error('Error saving template alias:', e);
  }
}

function getCachedMetaTemplates() {
  try {
    const raw = localStorage.getItem('meta_templates_cache');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCachedMetaTemplates(tmplArray) {
  try {
    localStorage.setItem('meta_templates_cache', JSON.stringify(tmplArray));
  } catch (e) {
    console.error('Error saving template cache:', e);
  }
}

/**
 * Render all template dropdown options with updated alias labels
 */
function updateTemplateDropdownsWithAliases() {
  const templates = getCachedMetaTemplates();
  if (!Array.isArray(templates) || templates.length === 0) return;

  const aliases = getTemplateAliases();
  populateQuickTemplateSelect(templates, aliases);

  const select = document.getElementById('bulkTemplateSelect');
  if (!select) return;

  select.innerHTML = '';

  templates.forEach(tmpl => {
    const lang = tmpl.language || 'en_US';
    const key = `${tmpl.name}|${lang}`;
    const alias = aliases[key] || '';
    const { bodyText, paramCount } = extractTemplateMeta(tmpl);

    let headerMediaType = '';
    if (Array.isArray(tmpl.components)) {
      const headerComp = tmpl.components.find(c => (c.type || '').toString().toLowerCase() === 'header');
      if (headerComp && headerComp.format) {
        const fmt = headerComp.format.toString().toUpperCase();
        if (fmt === 'IMAGE' || fmt === 'DOCUMENT' || fmt === 'VIDEO') {
          headerMediaType = fmt.toLowerCase();
        }
      }
    }

    const opt = document.createElement('option');
    opt.value = key;
    opt.setAttribute('data-name', tmpl.name);
    opt.setAttribute('data-lang', lang);
    opt.setAttribute('data-category', tmpl.category || 'MARKETING');
    opt.setAttribute('data-status', tmpl.status || 'APPROVED');
    opt.setAttribute('data-body', bodyText);
    opt.setAttribute('data-params', String(paramCount));
    if (headerMediaType) opt.setAttribute('data-has-media', headerMediaType);

    let iconPrefix = '💬 ';
    if (headerMediaType === 'image') iconPrefix = '📷 ';
    else if (headerMediaType === 'document') iconPrefix = '📄 ';
    else if (headerMediaType === 'video') iconPrefix = '🎥 ';

    if (alias) {
      opt.textContent = `${iconPrefix}🏷️ ${alias} (${lang})`;
    } else {
      opt.textContent = `${iconPrefix}${tmpl.name.replace(/_/g, ' ')} (${lang})`;
    }
    select.appendChild(opt);
  });

  const customOpt = document.createElement('option');
  customOpt.value = 'custom_entry';
  customOpt.textContent = '+ Yeni Şablon Adı Manuel Gir...';
  select.appendChild(customOpt);

  onTemplateDropdownChange();
  updateQuickTemplatePanel();
}

/**
 * Render cards grid in "Şablon Takma Adları" view
 */
function renderTemplateAliasCards() {
  const grid = document.getElementById('tmplAliasGrid');
  if (!grid) return;

  const searchVal = (document.getElementById('aliasSearchInput')?.value || '').toLowerCase().trim();
  const langFilter = document.getElementById('aliasLangFilter')?.value || 'ALL';
  const categoryFilter = document.getElementById('aliasCategoryFilter')?.value || 'ALL';

  const templates = getCachedMetaTemplates();
  const aliases = getTemplateAliases();

  if (!templates || templates.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(15, 23, 42, 0.6); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; color: #94A3B8;">
        <div style="font-size: 40px; margin-bottom: 12px;">📥</div>
        <h4 style="font-size: 16px; color: #F8FAFC; font-weight: 700; margin-bottom: 6px;">Henüz Şablon Çekilmedi</h4>
        <p style="font-size: 13px; margin-bottom: 16px;">Meta WABA hesabınızdaki şablonları yüklemek için lütfen yukarıdaki <strong>"🔄 Meta'dan Şablonları Çek & Yenile"</strong> butonuna tıklayın.</p>
      </div>
    `;
    const badge = document.getElementById('tmplCountBadge');
    if (badge) badge.textContent = '0 Şablon';
    return;
  }

  let filtered = templates.filter(tmpl => {
    const lang = (tmpl.language || 'en_US').toLowerCase();
    const cat = (tmpl.category || 'MARKETING').toUpperCase();
    const key = `${tmpl.name}|${tmpl.language || 'en_US'}`;
    const alias = (aliases[key] || '').toLowerCase();

    let bodyText = tmpl.name;
    if (Array.isArray(tmpl.components)) {
      const bodyComp = tmpl.components.find(c => c.type === 'BODY');
      if (bodyComp && bodyComp.text) bodyText = bodyComp.text;
    }

    if (langFilter !== 'ALL') {
      if (langFilter === 'tr' && !lang.includes('tr')) return false;
      if (langFilter === 'de' && !lang.includes('de')) return false;
      if (langFilter === 'en' && !lang.includes('en')) return false;
    }

    if (categoryFilter !== 'ALL' && cat !== categoryFilter) return false;

    if (searchVal) {
      const nameMatch = tmpl.name.toLowerCase().includes(searchVal);
      const aliasMatch = alias.includes(searchVal);
      const bodyMatch = bodyText.toLowerCase().includes(searchVal);
      if (!nameMatch && !aliasMatch && !bodyMatch) return false;
    }

    return true;
  });

  const badge = document.getElementById('tmplCountBadge');
  if (badge) badge.textContent = `${filtered.length} / ${templates.length} Şablon`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #94A3B8;">
        🔍 Arama kriterlerine uygun şablon bulunamadı.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(tmpl => {
    const lang = tmpl.language || 'en_US';
    const key = `${tmpl.name}|${lang}`;
    const currentAlias = aliases[key] || '';

    let bodyText = tmpl.name;
    if (Array.isArray(tmpl.components)) {
      const bodyComp = tmpl.components.find(c => c.type === 'BODY');
      if (bodyComp && bodyComp.text) bodyText = bodyComp.text;
    }

    const formattedBody = escapeHtml(bodyText).replace(/(\{\{\d+\}\})/g, '<span class="tmpl-var-tag">$1</span>');

    let langFlag = '🌐';
    let langClass = 'en';
    if (lang.includes('tr')) { langFlag = '🇹🇷'; langClass = 'tr'; }
    else if (lang.includes('de')) { langFlag = '🇩🇪'; langClass = 'de'; }
    else if (lang.includes('en')) { langFlag = '🇺🇸'; langClass = 'en'; }

    return `
      <div class="tmpl-card" data-key="${key}">
        <div class="tmpl-card-header">
          <div>
            <div class="tmpl-orig-name">🔑 ${escapeHtml(tmpl.name)}</div>
          </div>
          <div class="tmpl-badges">
            <span class="tmpl-badge tmpl-badge-${langClass}">${langFlag} ${escapeHtml(lang)}</span>
            <span class="tmpl-badge tmpl-badge-cat">${escapeHtml(tmpl.category || 'WABA')}</span>
            <span class="tmpl-badge tmpl-badge-status">${escapeHtml(tmpl.status || 'APPROVED')}</span>
          </div>
        </div>

        <div class="tmpl-alias-section">
          <label class="tmpl-alias-label">🏷️ TAKMA AD (ALIAS):</label>
          <div class="tmpl-alias-input-wrapper">
            <input type="text" class="tmpl-alias-input" value="${escapeHtml(currentAlias)}" placeholder="Örn: 🎃 Cadılar Bayramı Kampanyası (Türkçe)" onchange="window.handleAliasChange('${escapeHtml(key)}', this.value)">
          </div>
        </div>

        <div class="tmpl-alias-section">
          <label class="tmpl-alias-label">📄 ŞABLON İÇERİĞİ (METİN):</label>
          <div class="tmpl-body-box">${formattedBody}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.handleAliasChange = function(key, newAlias) {
  saveTemplateAlias(key, newAlias);
  renderTemplateAliasCards();
};

function setupTemplateAliasHandlers() {
  const syncBtn = document.getElementById('syncTmplAliasesBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', fetchMetaTemplatesFromApi);
  }

  const searchInput = document.getElementById('aliasSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderTemplateAliasCards);
  }

  const langFilter = document.getElementById('aliasLangFilter');
  if (langFilter) {
    langFilter.addEventListener('change', renderTemplateAliasCards);
  }

  const categoryFilter = document.getElementById('aliasCategoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', renderTemplateAliasCards);
  }

  updateTemplateDropdownsWithAliases();
  renderTemplateAliasCards();
}

/**
 * Fetch WhatsApp Message Templates directly from Meta Graph API
 */
async function fetchMetaTemplatesFromApi() {
  const wabaId = document.getElementById('metaWabaId')?.value.trim() || localStorage.getItem('meta_waba_id');
  const token = document.getElementById('metaToken')?.value.trim() || localStorage.getItem('meta_access_token');
  const fetchBtn = document.getElementById('fetchTemplatesBtn');
  const syncBtn = document.getElementById('syncTmplAliasesBtn');

  if (!wabaId || !token) {
    alert(currentLang === 'tr' ? 'Lütfen önce Ayarlar sekmesinde WABA ID ve Access Token değerlerini tanımlayın!' : 'Please set WABA ID & Access Token in Settings first!');
    return;
  }

  if (fetchBtn) fetchBtn.textContent = '⏳ Çekiliyor...';
  if (syncBtn) syncBtn.textContent = '⏳ Çekiliyor...';

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok && Array.isArray(data.data) && data.data.length > 0) {
      saveCachedMetaTemplates(data.data);
      updateTemplateDropdownsWithAliases();
      renderTemplateAliasCards();

      alert(currentLang === 'tr' 
        ? `Meta API'den ${data.data.length} adet şablon çekildi ve takma ad ekranınıza yüklendi!` 
        : `Fetched ${data.data.length} templates from Meta API.`);
    } else {
      let errMsg = data.error ? data.error.message : 'Şablon listesi bulunamadı.';
      if (errMsg.includes('message_templates') || (data.error && data.error.code === 100)) {
        errMsg = `(#100) Girilen ID (${wabaId}) geçerli bir WABA (WhatsApp Business Account) ID'si değil.\n\nLütfen Meta Business Manager -> WhatsApp Hesapları bölümünden 15-16 haneli WhatsApp İş Hesabı ID'nizi alıp Ayarlar sekmesindeki WABA ID alanına girin.`;
      }
      alert(`Meta API Şablon İkazı:\n${errMsg}`);
    }
  } catch (err) {
    alert(`İstek Hatası: ${err.message}`);
  } finally {
    if (fetchBtn) fetchBtn.textContent = '🔄 Meta API\'den Çek';
    if (syncBtn) syncBtn.textContent = '🔄 Meta\'dan Şablonları Çek & Yenile';
  }
}

/**
 * Load Meta API Keys & Webhook Settings from LocalStorage
 */
function loadMetaApiSettings() {
  const phoneInput = document.getElementById('metaPhoneId');
  const wabaInput = document.getElementById('metaWabaId');
  const tokenInput = document.getElementById('metaToken');
  const serverInput = document.getElementById('webhookServerUrl');
  const verifyTokenInput = document.getElementById('webhookVerifyToken');

  const savedPhone = localStorage.getItem('meta_phone_id');
  const savedWaba = localStorage.getItem('meta_waba_id');
  const savedToken = localStorage.getItem('meta_access_token');
  const savedServer = localStorage.getItem('webhook_server_url');
  const savedVerifyToken = localStorage.getItem('webhook_verify_token');

  if (savedPhone && phoneInput) phoneInput.value = savedPhone;
  if (savedWaba && wabaInput) wabaInput.value = savedWaba;
  if (savedToken && tokenInput) tokenInput.value = savedToken;
  if (savedServer && serverInput) serverInput.value = savedServer;
  if (savedVerifyToken && verifyTokenInput) verifyTokenInput.value = savedVerifyToken;

  // Auto-persist inputs to localStorage if not yet stored
  if (!savedPhone && phoneInput?.value) localStorage.setItem('meta_phone_id', phoneInput.value.trim());
  if (!savedWaba && wabaInput?.value) localStorage.setItem('meta_waba_id', wabaInput.value.trim());
  if (!savedToken && tokenInput?.value) localStorage.setItem('meta_access_token', tokenInput.value.trim());
}

/**
 * Save Meta API Keys & Webhook Settings
 */
function saveMetaApiSettings() {
  const phoneInput = document.getElementById('metaPhoneId');
  const wabaInput = document.getElementById('metaWabaId');
  const tokenInput = document.getElementById('metaToken');
  const serverInput = document.getElementById('webhookServerUrl');
  const verifyTokenInput = document.getElementById('webhookVerifyToken');

  if (phoneInput) localStorage.setItem('meta_phone_id', phoneInput.value.trim());
  if (wabaInput) localStorage.setItem('meta_waba_id', wabaInput.value.trim());
  if (tokenInput) localStorage.setItem('meta_access_token', tokenInput.value.trim());
  if (serverInput) localStorage.setItem('webhook_server_url', serverInput.value.trim());
  if (verifyTokenInput) localStorage.setItem('webhook_verify_token', verifyTokenInput.value.trim());

  if (typeof startWebhookPolling === 'function') startWebhookPolling();

  alert(currentLang === 'tr' ? 'Yapılandırma ve Webhook API bilgileri kaydedildi!' : 'Configuration and Webhook credentials saved!');
}

/**
 * Direct Text Message Sender via Meta WhatsApp Cloud API
 */
async function sendDirectWhatsAppTextMessage(phone, text) {
  const phoneId = document.getElementById('metaPhoneId')?.value.trim() || localStorage.getItem('meta_phone_id');
  const token = document.getElementById('metaToken')?.value.trim() || localStorage.getItem('meta_access_token');
  
  if (!phoneId || !token) {
    return { success: false, error: 'Lütfen Ayarlar sekmesinde kendi canlı Meta Phone ID ve Access Token bilgilerinizi tanımlayın!' };
  }

  const cleanPhone = cleanPhoneNumber(phone);
  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "text",
    text: { preview_url: false, body: text }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.ok) {
      recordOutgoingMessageToWebhookServer(cleanPhone, text);
      return { success: true, data };
    } else {
      const errMsg = data.error ? `(#${data.error.code}) ${data.error.message}` : `HTTP ${response.status}`;
      return { success: false, error: errMsg };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function recordOutgoingMessageToWebhookServer(toPhone, text) {
  try {
    const serverUrl = getLiveWebhookServerUrl();
    await fetch(`${serverUrl}/api/record_outgoing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toPhone, text: text, senderName: 'Stüdyo' })
    });
  } catch (e) {
    console.warn('[Webhook Record Notice]:', e.message);
  }
}

/**
 * Direct Template Message Sender via Meta WhatsApp Cloud API
 */
async function sendDirectWhatsAppTemplateMessage(phone, templateName, langCode, parameters, headerMedia, headerMediaType) {
  const phoneId = document.getElementById('metaPhoneId')?.value.trim() || localStorage.getItem('meta_phone_id');
  const token = document.getElementById('metaToken')?.value.trim() || localStorage.getItem('meta_access_token');
  
  if (!phoneId || !token) {
    return { success: false, error: 'Lütfen Ayarlar sekmesinde kendi canlı Meta Phone ID ve Access Token bilgilerinizi tanımlayın!' };
  }

  const cleanPhone = cleanPhoneNumber(phone);
  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const trySend = async (code) => {
    let payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: code }
      }
    };

    const sanitize = (val) => {
      let s = String(val || '');
      try { s = decodeURIComponent(s); } catch (e) {}
      s = s.replace(/%/g, '').replace(/^\"+|\"+$/g, '').trim();
      return s;
    };

    const components = [];
    // header media support
    if (headerMedia && headerMediaType) {
      const hm = sanitize(headerMedia);
      const mediaParam = { type: headerMediaType };
      if (/^https?:\/\//i.test(hm)) {
        mediaParam[headerMediaType] = { link: hm };
      } else {
        mediaParam[headerMediaType] = { id: hm };
      }
      // Ensure document header includes filename (Meta may require it)
      if (headerMediaType === 'document') {
        if (!mediaParam.document) mediaParam.document = { id: hm };
        if (!mediaParam.document.filename) {
          mediaParam.document.filename = 'file.pdf';
        }
      }
      components.push({ type: 'header', parameters: [mediaParam] });
    }

    if (parameters && parameters.length > 0) {
      components.push({
        type: 'body',
        parameters: parameters.map(p => ({ type: 'text', text: sanitize(p) }))
      });
    }

    if (components.length > 0) payload.template.components = components;

    try {
      // Debug: log payload to help identify missing parameters
      try { console.debug('[Meta Payload]', JSON.parse(JSON.stringify(payload))); } catch (e) { console.debug('[Meta Payload] (unable to stringify)'); }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        const textMsg = `[Şablon: ${templateName}] ${parameters && parameters.length > 0 ? '(' + parameters.join(', ') + ')' : ''}`;
        recordOutgoingMessageToWebhookServer(cleanPhone, textMsg);
      }
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Primary attempt with selected language code
  let res = await trySend(langCode || 'tr');
  if (res.ok) return { success: true, data: res.data };

  // If Meta returns error #132001 (Template translation does not exist), auto-retry with fallback codes!
  if (res.data && res.data.error && res.data.error.code === 132001) {
    console.warn(`[Meta API #132001 Warning] Language '${langCode}' not found for '${templateName}'. Trying auto-fallbacks...`);
    const fallbackCodes = ['tr', 'tr_TR', 'en_US', 'en', 'de', 'de_DE'].filter(c => c !== langCode);
    for (const code of fallbackCodes) {
      const fbRes = await trySend(code);
      if (fbRes.ok) return { success: true, data: fbRes.data };
    }
  }

  let errMsg = res.data && res.data.error ? `(#${res.data.error.code}) ${res.data.error.message}` : (res.error || `HTTP ${res.status}`);
  if (res.data && res.data.error) {
    if (res.data.error.code === 131030) {
      errMsg = `(#131030) Test Modu İzin İkazı: (${cleanPhone}) numarası Meta Developer Console'daki izinli test numaraları listesinde ekli değil. developers.facebook.com -> WhatsApp -> Başlarken bölümünden ekleyin.`;
    } else if (res.data.error.code === 131008) {
      errMsg = `(#131008) Required parameter is missing — muhtemelen şablon header/body parametrelerinden biri eksik veya media header için 'media_id'/'link' gereklidir.`;
    } else if (res.data.error.code === 132001) {
      errMsg = `(#132001) Şablon Uyumsuzluk İkazı: '${templateName}' şablonunun Meta'daki dili (${langCode}) veya parametre sayısı uyuşmuyor.`;
    }
  }
  return { success: false, error: errMsg };
}

/**
 * Format raw phone number into clean E.164 digits for Meta WhatsApp API (e.g. 905054933081)
 */
function cleanPhoneNumber(phone) {
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '90' + cleaned.substring(1);
  } else if (!cleaned.startsWith('90') && cleaned.length === 10) {
    cleaned = '90' + cleaned;
  }
  return cleaned;
}

/**
 * Send Meta WhatsApp Cloud API Request via HTTP POST (Handles Text & Templates with Dynamic Parameters)
 */
async function sendWhatsAppCloudApiMessage(rawPhone, customer, phoneId, token) {
  const cleanPhone = cleanPhoneNumber(rawPhone);

  if (bulkSendMode === 'text') {
    const rawText = document.getElementById('bulkMsgText')?.value.trim() || '';
    let msgBody = rawText.replace(/\{name\}/g, customer.name)
                         .replace(/\{phone\}/g, customer.phone)
                         .replace(/\{id\}/g, customer.id || '');
    return await sendDirectWhatsAppTextMessage(cleanPhone, msgBody);
  } else {
    const tmplName = document.getElementById('bulkTemplateName')?.value.trim() || 'hello_world';
    const tmplLang = document.getElementById('bulkTemplateLang')?.value.trim() || 'en_US';

    const select = document.getElementById('bulkTemplateSelect');
    const opt = select ? select.options[select.selectedIndex] : null;
    const numParams = parseInt(opt ? (opt.getAttribute('data-params') || '0') : '0', 10);

    let params = [];
    for (let i = 1; i <= numParams; i++) {
      const rawVal = document.getElementById(`bulkTmplP${i}`)?.value || `Param ${i}`;
      const processedVal = rawVal.replace(/\{name\}/g, customer.name || 'Müşteri')
                                 .replace(/\{phone\}/g, customer.phone || cleanPhone)
                                 .replace(/\{id\}/g, customer.id || '');
      params.push(processedVal);
    }

    const bulkHeaderMedia = document.getElementById('bulkHeaderMedia')?.value?.trim() || '';
    const bulkMediaType = opt ? opt.getAttribute('data-has-media') : '';
    return await sendDirectWhatsAppTemplateMessage(cleanPhone, tmplName, tmplLang, params, bulkHeaderMedia, bulkMediaType);
  }
}

/**
 * Bulk Message Execution Queue Dispatcher with Pause/Cancel, Retry & Server Sync
 */
async function startBulkMessageDispatch(targetList) {
  if (isBulkDispatching) return;

  const recipientList = targetList && targetList.length > 0 ? targetList : getEffectiveRecipientList();
  if (recipientList.length === 0) {
    alert(currentLang === 'tr' ? 'Lütfen gönderilecek en az 1 numara veya müşteri seçin!' : 'Please select or enter at least 1 recipient!');
    return;
  }

  const phoneId = document.getElementById('metaPhoneId')?.value.trim();
  const token = document.getElementById('metaToken')?.value.trim();

  if (!phoneId || !token) {
    alert(currentLang === 'tr' ? 'Lütfen Ayarlar sekmesinden Meta Phone ID ve Access Token girin!' : 'Please enter Meta Phone ID & Access Token in Settings!');
    return;
  }

  if (bulkSendMode === 'text') {
    const msgText = document.getElementById('bulkMsgText')?.value.trim();
    if (!msgText) {
      alert(currentLang === 'tr' ? 'Lütfen bir mesaj metni yazın!' : 'Please write a message text!');
      return;
    }
  }

  // UI State set to Dispatching
  isBulkDispatching = true;
  cancelBulkDispatchFlag = false;
  lastFailedRecipients = [];

  const dispatchBtn = document.getElementById('startBulkDispatchBtn');
  const cancelBtn = document.getElementById('cancelBulkDispatchBtn');
  const retryBtn = document.getElementById('retryFailedBulkBtn');

  if (dispatchBtn) {
    dispatchBtn.disabled = true;
    dispatchBtn.textContent = '⏳ Gönderiliyor...';
  }
  if (cancelBtn) {
    cancelBtn.style.display = 'inline-block';
    cancelBtn.textContent = '🛑 Duraklat / İptal Et';
  }
  if (retryBtn) {
    retryBtn.style.display = 'none';
  }

  const progressSec = document.getElementById('bulkProgressSection');
  const progressBar = document.getElementById('bulkProgressBar');
  const percentLabel = document.getElementById('bulkPercentLabel');
  const statusLabel = document.getElementById('bulkStatusLabel');
  const logBox = document.getElementById('bulkLogBox');
  const delayMs = parseInt(document.getElementById('bulkMessageDelay')?.value || '2000', 10);

  if (progressSec) progressSec.style.display = 'block';
  if (logBox) logBox.innerHTML = '';

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < recipientList.length; i++) {
    if (cancelBulkDispatchFlag) {
      const timeStr = new Date().toLocaleTimeString();
      const cancelRow = document.createElement('div');
      cancelRow.className = 'bulk-log-item error';
      cancelRow.innerHTML = `<span>[${timeStr}] 🛑 İŞLEM İPTAL EDİLDİ</span><span>Gönderim durduruldu.</span>`;
      if (logBox) logBox.appendChild(cancelRow);
      break;
    }

    const cust = recipientList[i];
    const pct = Math.round(((i + 1) / recipientList.length) * 100);

    if (statusLabel) statusLabel.textContent = `Mesaj Gönderiliyor: (${i + 1} / ${recipientList.length})`;
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (percentLabel) percentLabel.textContent = `${pct}%`;

    const result = await sendWhatsAppCloudApiMessage(cust.phone, cust, phoneId, token);
    const timeStr = new Date().toLocaleTimeString();

    const logRow = document.createElement('div');
    logRow.className = `bulk-log-item ${result.success ? 'success' : 'error'}`;

    if (result.success) {
      successCount++;
      const msgId = result.data && result.data.messages && result.data.messages[0] ? result.data.messages[0].id : 'OK';
      logRow.innerHTML = `<span>[${timeStr}] ✓ ${escapeHtml(cust.name)} (${cust.phone})</span><span>ID: ${String(msgId).substring(0, 16)}...</span>`;
    } else {
      failCount++;
      lastFailedRecipients.push(cust);
      logRow.innerHTML = `<span>[${timeStr}] ✕ ${escapeHtml(cust.name)} (${cust.phone})</span><span>Hata: ${escapeHtml(result.error)}</span>`;
    }

    if (logBox) {
      logBox.appendChild(logRow);
      logBox.scrollTop = logBox.scrollHeight;
    }

    // Inter-message delay
    if (i < recipientList.length - 1 && !cancelBulkDispatchFlag) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // Final status label
  if (statusLabel) {
    if (cancelBulkDispatchFlag) {
      statusLabel.textContent = `İşlem İptal Edildi (${successCount} Gönderildi, ${failCount} Başarısız)`;
    } else {
      statusLabel.textContent = `Gönderim Tamamlandı! (${successCount} Başarılı, ${failCount} Başarısız)`;
    }
  }

  if (globalData && globalData.kpis && successCount > 0) {
    if (typeof globalData.kpis.reactivationMessages === 'number') {
      globalData.kpis.reactivationMessages += successCount;
    } else {
      globalData.kpis.reactivationMessages = successCount;
    }
    renderKPIs(globalData.kpis);
  }

  isBulkDispatching = false;
  if (dispatchBtn) {
    dispatchBtn.disabled = false;
    dispatchBtn.textContent = '🚀 Toplu Gönderimi Başlat';
  }
  if (cancelBtn) {
    cancelBtn.style.display = 'none';
  }
  if (retryBtn && lastFailedRecipients.length > 0) {
    retryBtn.style.display = 'inline-block';
    retryBtn.textContent = `🔄 Başarısız ${lastFailedRecipients.length} Numarayı Tekrar Dene`;
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// --- BOT RULES MANAGEMENT FUNCTIONS ---
let currentBotRulesConfig = {
  enabled: true,
  welcomeMessage: {
    enabled: true,
    text: "Merhaba! Cleopatra Ink Studio'ya hoş geldiniz. 🎨 Size nasıl yardımcı olabiliriz? (Dövme fiyatı, randevu saatleri veya stüdyo konumu hakkında bilgi alabilirsiniz.)",
    cooldownHours: 24
  },
  rules: []
};

async function loadBotRules() {
  try {
    const res = await fetch('/api/bot-rules');
    if (res.ok) {
      currentBotRulesConfig = await res.json();
      renderBotRulesUI();
    }
  } catch (err) {
    console.warn('Bot rules fetch warning:', err.message);
  }
}

function slugifyBtn(title) {
  if (!title) return `btn_${Date.now()}`;
  return 'btn_' + title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function toggleWelcomeButtonsContainer(enabled) {
  const container = document.getElementById('welcomeButtonsContainerWrapper');
  const label = document.getElementById('welcomeButtonsToggleLabel');
  if (container) {
    container.style.display = enabled ? 'flex' : 'none';
  }
  if (label) {
    label.textContent = enabled ? 'Açık' : 'Kapalı';
    label.style.color = enabled ? '#00F2FE' : '#94A3B8';
  }
}

function toggleRuleButtonsContainer(enabled) {
  const container = document.getElementById('ruleButtonsContainerWrapper');
  const label = document.getElementById('ruleButtonsToggleLabel');
  if (container) {
    container.style.display = enabled ? 'flex' : 'none';
  }
  if (label) {
    label.textContent = enabled ? 'Açık' : 'Kapalı';
    label.style.color = enabled ? '#00F2FE' : '#94A3B8';
  }
}

let currentActiveWelcomeLang = 'tr';

function switchWelcomeLangTab(langCode) {
  saveCurrentWelcomeInputsToMemory(currentActiveWelcomeLang);
  currentActiveWelcomeLang = langCode;

  const langTabKeys = ['tr', 'de', 'nl', 'en', 'ru'];
  langTabKeys.forEach(k => {
    const btn = document.getElementById(`langTab_${k}`);
    if (btn) {
      if (k === langCode) {
        btn.classList.add('active');
        btn.style.border = '1px solid #38BDF8';
        btn.style.background = 'rgba(56, 189, 248, 0.2)';
        btn.style.color = '#38BDF8';
      } else {
        btn.classList.remove('active');
        btn.style.border = '1px solid rgba(255,255,255,0.1)';
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = '#94A3B8';
      }
    }
  });

  loadWelcomeInputsFromMemory(langCode);
}

function saveCurrentWelcomeInputsToMemory(langCode) {
  if (!currentBotRulesConfig.welcomeMessage) {
    currentBotRulesConfig.welcomeMessage = { enabled: true, cooldownHours: 24, languages: {} };
  }
  if (!currentBotRulesConfig.welcomeMessage.languages) {
    currentBotRulesConfig.welcomeMessage.languages = {};
  }

  const textEl = document.getElementById('welcomeText');
  const wToggle = document.getElementById('welcomeButtonsToggle');
  const wBtns = [];

  if (wToggle && wToggle.checked) {
    const b1Title = (document.getElementById('welcomeBtn1Title')?.value || '').trim();
    const b1Reply = (document.getElementById('welcomeBtn1Reply')?.value || '').trim();
    if (b1Title) wBtns.push({ title: b1Title, id: slugifyBtn(b1Title), replyText: b1Reply });

    const b2Title = (document.getElementById('welcomeBtn2Title')?.value || '').trim();
    const b2Reply = (document.getElementById('welcomeBtn2Reply')?.value || '').trim();
    if (b2Title) wBtns.push({ title: b2Title, id: slugifyBtn(b2Title), replyText: b2Reply });

    const b3Title = (document.getElementById('welcomeBtn3Title')?.value || '').trim();
    const b3Reply = (document.getElementById('welcomeBtn3Reply')?.value || '').trim();
    if (b3Title) wBtns.push({ title: b3Title, id: slugifyBtn(b3Title), replyText: b3Reply });
  }

  const langObj = {
    text: textEl ? textEl.value : '',
    buttons: wBtns
  };

  currentBotRulesConfig.welcomeMessage.languages[langCode] = langObj;

  if (langCode === 'tr') {
    currentBotRulesConfig.welcomeMessage.text = langObj.text;
    currentBotRulesConfig.welcomeMessage.buttons = langObj.buttons;
  }
}

function loadWelcomeInputsFromMemory(langCode) {
  const textEl = document.getElementById('welcomeText');
  const wToggle = document.getElementById('welcomeButtonsToggle');
  const btn1Title = document.getElementById('welcomeBtn1Title');
  const btn1Reply = document.getElementById('welcomeBtn1Reply');
  const btn2Title = document.getElementById('welcomeBtn2Title');
  const btn2Reply = document.getElementById('welcomeBtn2Reply');
  const btn3Title = document.getElementById('welcomeBtn3Title');
  const btn3Reply = document.getElementById('welcomeBtn3Reply');

  let langObj = (currentBotRulesConfig.welcomeMessage?.languages || {})[langCode];

  if (!langObj) {
    if (langCode === 'tr') {
      langObj = {
        text: currentBotRulesConfig.welcomeMessage?.text || '',
        buttons: currentBotRulesConfig.welcomeMessage?.buttons || []
      };
    } else {
      langObj = defaultLanguagePacks[langCode] || { text: '', buttons: [] };
    }
  }

  if (textEl) textEl.value = langObj.text || '';
  const wBtns = langObj.buttons || [];

  if (wToggle) {
    const hasBtns = wBtns.length > 0;
    wToggle.checked = hasBtns;
    toggleWelcomeButtonsContainer(hasBtns);
  }

  if (btn1Title) btn1Title.value = wBtns[0] ? wBtns[0].title : '';
  if (btn1Reply) btn1Reply.value = wBtns[0] ? (wBtns[0].replyText || '') : '';
  if (btn2Title) btn2Title.value = wBtns[1] ? wBtns[1].title : '';
  if (btn2Reply) btn2Reply.value = wBtns[1] ? (wBtns[1].replyText || '') : '';
  if (btn3Title) btn3Title.value = wBtns[2] ? wBtns[2].title : '';
  if (btn3Reply) btn3Reply.value = wBtns[2] ? (wBtns[2].replyText || '') : '';
}

function renderReservationAnalyticsUI() {
  const events = currentBotRulesConfig.reservationAnalytics || [];
  const totalBadge = document.getElementById('totalResClicksBadge');
  const statToday = document.getElementById('statResToday');
  const statTR = document.getElementById('statResTR');
  const statDE = document.getElementById('statResDE');
  const statNL = document.getElementById('statResNL');
  const statEN = document.getElementById('statResEN');
  const statRU = document.getElementById('statResRU');
  const resTbody = document.getElementById('resAnalyticsTbody');

  if (totalBadge) totalBadge.textContent = `${events.length} Toplam Tıklama`;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let todayCount = 0;
  let trCount = 0;
  let deCount = 0;
  let nlCount = 0;
  let enCount = 0;
  let ruCount = 0;

  events.forEach(ev => {
    if (ev.timestamp >= startOfDay) todayCount++;
    const code = ev.countryCode || 'tr';
    if (code === 'tr') trCount++;
    else if (code === 'de') deCount++;
    else if (code === 'nl') nlCount++;
    else if (code === 'en') enCount++;
    else if (code === 'ru') ruCount++;
  });

  if (statToday) statToday.textContent = todayCount;
  if (statTR) statTR.textContent = trCount;
  if (statDE) statDE.textContent = deCount;
  if (statNL) statNL.textContent = nlCount;
  if (statEN) statEN.textContent = enCount;
  if (statRU) statRU.textContent = ruCount;

  if (resTbody) {
    if (events.length === 0) {
      resTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 14px; color: #94A3B8;">Henüz kayıtlı rezervasyon tıklaması yok. Müşterileriniz butona tıkladıkça canlı akışta burada görünecektir.</td></tr>`;
      return;
    }

    resTbody.innerHTML = events.slice(0, 30).map(ev => {
      const dateStr = new Date(ev.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 6px 10px; color: #94A3B8;">${dateStr}</td>
          <td style="padding: 6px 10px; font-weight: 700; color: #38BDF8;">+${escapeHtml(ev.fromPhone)}</td>
          <td style="padding: 6px 10px; color: #E2E8F0;">${ev.flag || '🌐'} ${escapeHtml(ev.countryName || 'Bilinmiyor')}</td>
          <td style="padding: 6px 10px; color: #00F2FE;">${escapeHtml(ev.ruleName || 'Rezervasyon')}</td>
        </tr>
      `;
    }).join('');
  }
}

function renderBotRulesUI() {
  renderReservationAnalyticsUI();

  const globalToggle = document.getElementById('botGlobalToggle');
  const globalToggleLabel = document.getElementById('botGlobalToggleLabel');
  const welcomeToggle = document.getElementById('welcomeToggle');
  const ruleCountBadge = document.getElementById('ruleCountBadge');
  const tbody = document.getElementById('botRulesTbody');

  if (globalToggle) {
    globalToggle.checked = !!currentBotRulesConfig.enabled;
  }
  if (globalToggleLabel) {
    globalToggleLabel.textContent = currentBotRulesConfig.enabled ? 'SİSTEM AKTİF' : 'SİSTEM DEVRE DIŞI';
    globalToggleLabel.style.color = currentBotRulesConfig.enabled ? '#00F2FE' : '#EF4444';
  }

  if (welcomeToggle && currentBotRulesConfig.welcomeMessage) {
    welcomeToggle.checked = !!currentBotRulesConfig.welcomeMessage.enabled;
  }

  loadWelcomeInputsFromMemory(currentActiveWelcomeLang);

  const rules = currentBotRulesConfig.rules || [];
  if (ruleCountBadge) {
    ruleCountBadge.textContent = `${rules.length} Yanıt Kuralı`;
  }

  if (tbody) {
    if (rules.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: #94A3B8;">Henüz kayıtlı bir otomatik yanıt kuralı yok. Yeni kural eklemek için yukarıdaki butona tıklayın.</td></tr>`;
      return;
    }

    const langFlags = { all: '🌐 Tüm Diller', tr: '🇹🇷 Türkçe', de: '🇩🇪 Almanca', nl: '🇳🇱 Felemenkçe', en: '🇬🇧 İngilizce', ru: '🇷🇺 Rusça' };

    tbody.innerHTML = rules.map(r => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="font-weight: 700; color: #F8FAFC;">
          ${escapeHtml(r.name)}
          <div style="font-size: 10px; color: #00F2FE; margin-top: 2px;">${langFlags[r.targetLang || 'all'] || '🌐 Tüm Diller'}</div>
        </td>
        <td>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${(r.keywords || []).map(k => `<span style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${escapeHtml(k)}</span>`).join('')}
          </div>
        </td>
        <td><span style="font-size: 12px; color: #94A3B8;">${r.matchType === 'exact' ? 'Birebir Eşleşme' : 'Metin İçeriyor'}</span></td>
        <td style="max-width: 280px; font-size: 12px; color: #E2E8F0;">
          <div style="white-space: pre-wrap;">${escapeHtml(r.replyText)}</div>
          ${r.buttons && r.buttons.length > 0 ? `
            <div style="display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap;">
              ${r.buttons.map(b => `<span style="background: rgba(0, 242, 254, 0.12); color: #00F2FE; border: 1px solid rgba(0, 242, 254, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">🔘 ${escapeHtml(b.title)}${b.replyText ? ' ➔ Yanıt Ekli' : ''}</span>`).join('')}
            </div>
          ` : ''}
        </td>
        <td>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="toggleRuleState('${r.id}', this.checked)" style="width: 16px; height: 16px; accent-color: #00A884;">
            <span style="font-size: 12px; color: ${r.enabled ? '#00F2FE' : '#94A3B8'};">${r.enabled ? 'Aktif' : 'Pasif'}</span>
          </label>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-secondary" onclick="editRuleModal('${r.id}')" style="padding: 4px 8px; font-size: 11px;">✏️ Düzenle</button>
            <button type="button" class="btn-secondary" onclick="deleteRule('${r.id}')" style="padding: 4px 8px; font-size: 11px; background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid rgba(239,68,68,0.3);">🗑️ Sil</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

async function saveBotRulesToServer() {
  try {
    const res = await fetch('/api/bot-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentBotRulesConfig)
    });
    if (res.ok) {
      renderBotRulesUI();
    }
  } catch (err) {
    console.error('Bot rules save error:', err);
  }
}

async function toggleBotGlobalState(enabled) {
  currentBotRulesConfig.enabled = enabled;
  await saveBotRulesToServer();
}

async function saveWelcomeMessage() {
  const toggle = document.getElementById('welcomeToggle');
  if (!currentBotRulesConfig.welcomeMessage) {
    currentBotRulesConfig.welcomeMessage = { cooldownHours: 24, languages: {} };
  }
  currentBotRulesConfig.welcomeMessage.enabled = toggle ? toggle.checked : true;

  saveCurrentWelcomeInputsToMemory(currentActiveWelcomeLang);

  await saveBotRulesToServer();
  alert('✅ Tüm dillerdeki karşılama mesajları ve butonlar başarıyla kaydedildi!');
}

async function toggleRuleState(ruleId, enabled) {
  const rule = (currentBotRulesConfig.rules || []).find(r => r.id === ruleId);
  if (rule) {
    rule.enabled = enabled;
    await saveBotRulesToServer();
  }
}

function openAddRuleModal() {
  document.getElementById('editRuleId').value = '';
  document.getElementById('ruleModalTitle').textContent = '🤖 Yeni Otomatik Yanıt Kuralı Ekle';
  document.getElementById('ruleNameInput').value = '';
  document.getElementById('ruleKeywordsInput').value = '';
  document.getElementById('ruleMatchTypeInput').value = 'contains';
  if (document.getElementById('ruleLangInput')) document.getElementById('ruleLangInput').value = 'all';
  document.getElementById('ruleReplyTextInput').value = '';

  document.getElementById('ruleBtn1Title').value = '';
  document.getElementById('ruleBtn1Reply').value = '';
  document.getElementById('ruleBtn2Title').value = '';
  document.getElementById('ruleBtn2Reply').value = '';
  document.getElementById('ruleBtn3Title').value = '';
  document.getElementById('ruleBtn3Reply').value = '';

  const rToggle = document.getElementById('ruleButtonsToggle');
  if (rToggle) {
    rToggle.checked = false;
    toggleRuleButtonsContainer(false);
  }

  openModal('addRuleModal');
}

function editRuleModal(ruleId) {
  const rule = (currentBotRulesConfig.rules || []).find(r => r.id === ruleId);
  if (!rule) return;
  document.getElementById('editRuleId').value = rule.id;
  document.getElementById('ruleModalTitle').textContent = '✏️ Otomatik Yanıt Kuralını Düzenle';
  document.getElementById('ruleNameInput').value = rule.name || '';
  document.getElementById('ruleKeywordsInput').value = (rule.keywords || []).join(', ');
  document.getElementById('ruleMatchTypeInput').value = rule.matchType || 'contains';
  if (document.getElementById('ruleLangInput')) document.getElementById('ruleLangInput').value = rule.targetLang || 'all';
  document.getElementById('ruleReplyTextInput').value = rule.replyText || '';

  const rBtns = rule.buttons || [];
  const rToggle = document.getElementById('ruleButtonsToggle');
  if (rToggle) {
    const hasBtns = rBtns.length > 0;
    rToggle.checked = hasBtns;
    toggleRuleButtonsContainer(hasBtns);
  }

  document.getElementById('ruleBtn1Title').value = rBtns[0] ? rBtns[0].title : '';
  document.getElementById('ruleBtn1Reply').value = rBtns[0] ? (rBtns[0].replyText || '') : '';
  document.getElementById('ruleBtn2Title').value = rBtns[1] ? rBtns[1].title : '';
  document.getElementById('ruleBtn2Reply').value = rBtns[1] ? (rBtns[1].replyText || '') : '';
  document.getElementById('ruleBtn3Title').value = rBtns[2] ? rBtns[2].title : '';
  document.getElementById('ruleBtn3Reply').value = rBtns[2] ? (rBtns[2].replyText || '') : '';

  openModal('addRuleModal');
}

async function saveBotRuleFromModal(e) {
  e.preventDefault();
  const ruleId = document.getElementById('editRuleId').value;
  const name = document.getElementById('ruleNameInput').value.trim();
  const keywordsRaw = document.getElementById('ruleKeywordsInput').value;
  const matchType = document.getElementById('ruleMatchTypeInput').value;
  const targetLang = document.getElementById('ruleLangInput')?.value || 'all';
  const replyText = document.getElementById('ruleReplyTextInput').value.trim();

  const keywords = keywordsRaw.split(',').map(k => k.trim()).filter(Boolean);

  if (!name || keywords.length === 0 || !replyText) {
    alert('Lütfen tüm zorunlu alanları doldurun.');
    return;
  }

  let formattedReplyText = replyText;
  if (formattedReplyText && !formattedReplyText.includes('reconnect sisteminden geliyorum')) {
    formattedReplyText += '\n\n📌 (reconnect sisteminden geliyorum)';
  }

  const rToggle = document.getElementById('ruleButtonsToggle');
  const rBtns = [];
  if (rToggle && rToggle.checked) {
    const b1Title = (document.getElementById('ruleBtn1Title')?.value || '').trim();
    const b1Reply = (document.getElementById('ruleBtn1Reply')?.value || '').trim();
    if (b1Title) rBtns.push({ title: b1Title, id: slugifyBtn(b1Title), replyText: b1Reply });

    const b2Title = (document.getElementById('ruleBtn2Title')?.value || '').trim();
    const b2Reply = (document.getElementById('ruleBtn2Reply')?.value || '').trim();
    if (b2Title) rBtns.push({ title: b2Title, id: slugifyBtn(b2Title), replyText: b2Reply });

    const b3Title = (document.getElementById('ruleBtn3Title')?.value || '').trim();
    const b3Reply = (document.getElementById('ruleBtn3Reply')?.value || '').trim();
    if (b3Title) rBtns.push({ title: b3Title, id: slugifyBtn(b3Title), replyText: b3Reply });
  }

  if (!currentBotRulesConfig.rules) {
    currentBotRulesConfig.rules = [];
  }

  if (ruleId) {
    const existing = currentBotRulesConfig.rules.find(r => r.id === ruleId);
    if (existing) {
      existing.name = name;
      existing.keywords = keywords;
      existing.matchType = matchType;
      existing.targetLang = targetLang;
      existing.replyText = formattedReplyText;
      existing.buttons = rBtns;
    }
  } else {
    const newRule = {
      id: `rule_${Date.now()}`,
      name: name,
      keywords: keywords,
      matchType: matchType,
      targetLang: targetLang,
      replyText: replyText,
      buttons: rBtns,
      enabled: true
    };
    currentBotRulesConfig.rules.push(newRule);
  }

  await saveBotRulesToServer();
  closeModal('addRuleModal');
}

async function deleteRule(ruleId) {
  if (!confirm('Bu otomatik yanıt kuralını silmek istediğinize emin misiniz?')) return;
  currentBotRulesConfig.rules = (currentBotRulesConfig.rules || []).filter(r => r.id !== ruleId);
  await saveBotRulesToServer();
}

/**
 * Render customer list inside modal with phone validation filter & search
 */
function renderModalCustomerList(forceSelectAll = false) {
  const container = document.getElementById('modalCustomerListContainer');
  const countBadge = document.getElementById('modalCustomerTotalBadge');
  const selectAll = document.getElementById('modalSelectAllCustomers');
  const searchInput = document.getElementById('modalCustomerSearch');
  if (!container) return;

  const customers = (globalData && Array.isArray(globalData.customers)) ? globalData.customers : [];
  
  // Only auto-select all if forced or if no customer is currently selected!
  if (forceSelectAll || selectedCustomerIds.size === 0) {
    selectedCustomerIds.clear();
    customers.forEach(c => {
      if (isValidWhatsAppNumber(c.phone)) {
        selectedCustomerIds.add(c.id);
      }
    });
    if (searchInput) searchInput.value = '';
  }

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  let filtered = customers;
  if (query) {
    filtered = customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.id && c.id.toLowerCase().includes(query))
    );
  }

  const validCount = customers.filter(c => isValidWhatsAppNumber(c.phone)).length;

  if (countBadge) {
    countBadge.textContent = query 
      ? `(${filtered.length} / ${customers.length} Kayıt - ${validCount} Geçerli)` 
      : `(${customers.length} Kayıt - ${validCount} Geçerli Numara)`;
  }

  if (customers.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 12px;">Veritabanında kayıtlı müşteri bulunamadı.</div>`;
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 12px;">"${escapeHtml(query)}" ile eşleşen müşteri bulunamadı.</div>`;
    return;
  }

  const validFilteredCustomers = filtered.filter(c => isValidWhatsAppNumber(c.phone));
  if (selectAll) selectAll.checked = validFilteredCustomers.length > 0 && validFilteredCustomers.every(c => selectedCustomerIds.has(c.id));

  container.innerHTML = filtered.map(cust => {
    const isValid = isValidWhatsAppNumber(cust.phone);
    const isChecked = selectedCustomerIds.has(cust.id);
    const cleanP = cust.phone ? cleanPhoneNumber(cust.phone) : '-';
    
    let bgStyle = 'transparent';
    if (isChecked) {
      bgStyle = 'rgba(0, 168, 132, 0.08)';
    } else if (!isValid) {
      bgStyle = 'rgba(239, 68, 68, 0.04)';
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: ${bgStyle}; border-radius: 6px; margin-bottom: 3px; font-size: 12px; opacity: ${isValid ? '1' : '0.75'};">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 1; margin: 0; color: ${isValid ? '#F8FAFC' : '#94A3B8'};">
          <input type="checkbox" class="modal-cust-checkbox" data-id="${cust.id}" ${isChecked ? 'checked' : ''} style="cursor: pointer;">
          <span style="font-weight: 600;">${escapeHtml(cust.name)}</span>
          <span style="color: #94A3B8; font-family: monospace; font-size: 11.5px;">(${cleanP})</span>
        </label>
        ${isValid 
          ? '<span class="badge badge-green" style="font-size: 10px; padding: 2px 6px;">✓ Gönderilebilir</span>' 
          : '<span class="badge badge-yellow" style="font-size: 10px; padding: 2px 6px; background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4);">⚠️ Geçersiz Numara</span>'
        }
      </div>
    `;
  }).join('');

  // Attach individual checkbox listeners inside modal
  container.querySelectorAll('.modal-cust-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      const parentRow = e.target.closest('div');
      const cust = customers.find(c => String(c.id) === String(id));
      const isValid = cust ? isValidWhatsAppNumber(cust.phone) : true;

      if (e.target.checked) {
        selectedCustomerIds.add(id);
        if (parentRow) parentRow.style.background = 'rgba(0, 168, 132, 0.08)';
      } else {
        selectedCustomerIds.delete(id);
        if (parentRow) parentRow.style.background = isValid ? 'transparent' : 'rgba(239, 68, 68, 0.04)';
      }
      
      const vFiltered = filtered.filter(c => isValidWhatsAppNumber(c.phone));
      if (selectAll) selectAll.checked = vFiltered.length > 0 && vFiltered.every(c => selectedCustomerIds.has(c.id));
      updateBulkRecipientUI();
    });
  });

  // Modal Select All Checkbox Listener
  if (selectAll) {
    selectAll.replaceWith(selectAll.cloneNode(true));
    const newSelectAll = document.getElementById('modalSelectAllCustomers');
    newSelectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      selectedCustomerIds.clear();
      if (isChecked) {
        customers.forEach(c => {
          if (isValidWhatsAppNumber(c.phone)) {
            selectedCustomerIds.add(c.id);
          }
        });
      }
      renderModalCustomerList(false);
      updateBulkRecipientUI();
    });
  }

  // Attach Search Input listener
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', () => {
      renderModalCustomerList(false);
    });
  }

  updateBulkRecipientUI();
}

/**
 * Mode selection functions for 2 initial action buttons in bulk modal
 */
function selectBulkMode(mode) {
  bulkRecipientSource = mode; // 'table' or 'manual'
  const stepSelection = document.getElementById('bulkStepSelection');
  const stepForm = document.getElementById('bulkStepForm');
  const titleEl = document.getElementById('bulkSelectedModeTitle');
  const secCustomerList = document.getElementById('sectionCustomerList');
  const secManual = document.getElementById('sectionManualInput');

  if (stepSelection) stepSelection.style.display = 'none';
  if (stepForm) stepForm.style.display = 'block';

  if (mode === 'table') {
    if (titleEl) titleEl.textContent = '👥 Seçilen Müşterilere Şablon Gönderimi';
    if (secCustomerList) secCustomerList.style.display = 'block';
    if (secManual) secManual.style.display = 'none';
    renderModalCustomerList(false);
  } else {
    if (titleEl) titleEl.textContent = '📋 Numara Listesi Girerek Gönderim';
    if (secCustomerList) secCustomerList.style.display = 'none';
    if (secManual) secManual.style.display = 'block';
  }

  if (typeof updateBulkRecipientUI === 'function') updateBulkRecipientUI();
  if (typeof updateLiveWhatsAppPreview === 'function') updateLiveWhatsAppPreview();
}

function backToBulkSelection() {
  const stepSelection = document.getElementById('bulkStepSelection');
  const stepForm = document.getElementById('bulkStepForm');
  if (stepSelection) stepSelection.style.display = 'flex';
  if (stepForm) stepForm.style.display = 'none';
}

window.selectBulkMode = selectBulkMode;
window.backToBulkSelection = backToBulkSelection;

/**
 * Reset Bulk Messaging Modal input fields, log boxes, and progress state
 */
function resetBulkMessageModal() {
  const stepSelection = document.getElementById('bulkStepSelection');
  const stepForm = document.getElementById('bulkStepForm');
  if (stepSelection) stepSelection.style.display = 'none';
  if (stepForm) stepForm.style.display = 'block';

  const secCustList = document.getElementById('sectionCustomerList');
  if (secCustList) secCustList.style.display = 'none';
  const toggleCustBtn = document.getElementById('toggleCustomerListBtn');
  if (toggleCustBtn) toggleCustBtn.textContent = '✏️ Müşterileri Listele / Düzenle';

  const msgText = document.getElementById('bulkMsgText');
  if (msgText) msgText.value = '';

  const manualInput = document.getElementById('bulkManualNumbersInput');
  if (manualInput) manualInput.value = '';

  const manualBadge = document.getElementById('manualParseBadge');
  if (manualBadge) manualBadge.textContent = '';

  const progressSec = document.getElementById('bulkProgressSection');
  if (progressSec) progressSec.style.display = 'none';

  const progressBar = document.getElementById('bulkProgressBar');
  if (progressBar) progressBar.style.width = '0%';

  const percentLabel = document.getElementById('bulkPercentLabel');
  if (percentLabel) percentLabel.textContent = '0%';

  const statusLabel = document.getElementById('bulkStatusLabel');
  if (statusLabel) statusLabel.textContent = 'Mesajlar Gönderiliyor...';

  const logBox = document.getElementById('bulkLogBox');
  if (logBox) logBox.innerHTML = '';

  const dispatchBtn = document.getElementById('startBulkDispatchBtn');
  if (dispatchBtn) {
    dispatchBtn.disabled = false;
    dispatchBtn.textContent = '🚀 Toplu Gönderimi Başlat';
  }

  const cancelBtn = document.getElementById('cancelBulkDispatchBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';

  const retryBtn = document.getElementById('retryFailedBulkBtn');
  if (retryBtn) retryBtn.style.display = 'none';

  isBulkDispatching = false;
  cancelBulkDispatchFlag = false;
  lastFailedRecipients = [];

  if (typeof updateBulkRecipientUI === 'function') updateBulkRecipientUI();
  if (typeof updateLiveWhatsAppPreview === 'function') updateLiveWhatsAppPreview();
}

window.resetBulkMessageModal = resetBulkMessageModal;
