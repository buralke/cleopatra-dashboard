/**
 * Cleopatra Rezervasyon Takipçisi - Privacy Policy Website Logic
 * Multi-language (TR / EN), Theme Switcher, ScrollSpy, Search Filter, Link Copying
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const themeToggleBtn = document.getElementById('themeToggle');
  const langToggleBtn = document.getElementById('langToggle');
  const searchInput = document.getElementById('searchInput');
  const backToTopBtn = document.getElementById('backToTop');
  const printBtn = document.getElementById('printBtn');
  const tocLinks = document.querySelectorAll('.toc-link');
  const sections = document.querySelectorAll('.policy-section');
  const toast = document.getElementById('toast');

  // State initialization
  let currentLang = localStorage.getItem('cleopatra_privacy_lang') || 'tr';
  let currentTheme = localStorage.getItem('cleopatra_privacy_theme') || 'dark';

  // Initialize Language & Theme
  setTheme(currentTheme);
  applyLanguage(currentLang);

  // 1. Theme Management
  themeToggleBtn.addEventListener('click', () => {
    currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(currentTheme);
  });

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cleopatra_privacy_theme', theme);

    const themeIcon = themeToggleBtn.querySelector('.theme-icon');
    const themeLabel = themeToggleBtn.querySelector('.btn-label');

    if (theme === 'light') {
      themeIcon.textContent = '🌙';
      if (themeLabel) {
        themeLabel.setAttribute('data-tr', 'Koyu');
        themeLabel.setAttribute('data-en', 'Dark');
      }
    } else {
      themeIcon.textContent = '☀️';
      if (themeLabel) {
        themeLabel.setAttribute('data-tr', 'Açık');
        themeLabel.setAttribute('data-en', 'Light');
      }
    }
    updateLanguageTexts();
  }

  // 2. Language Management (TR / EN)
  langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'tr' ? 'en' : 'tr';
    localStorage.setItem('cleopatra_privacy_lang', currentLang);
    applyLanguage(currentLang);
    showToast(currentLang === 'tr' ? 'Dil Türkçe olarak değiştirildi' : 'Language switched to English');
  });

  function applyLanguage(lang) {
    document.documentElement.setAttribute('lang', lang);

    // Update document title
    document.title = lang === 'tr' 
      ? 'Gizlilik Sözleşmesi | Cleopatra Rezervasyon Takipçisi' 
      : 'Privacy Policy | Cleopatra Reservation Tracker';

    // Update language toggle button label
    const langLabel = langToggleBtn.querySelector('.lang-label');
    if (langLabel) {
      langLabel.textContent = lang === 'tr' ? 'EN' : 'TR';
    }
    langToggleBtn.setAttribute('title', lang === 'tr' ? 'İngilizceye Geç / Switch to English' : 'Türkçeye Geç / Switch to Turkish');

    // Toggle block elements with [data-lang="tr"] / [data-lang="en"]
    document.querySelectorAll('[data-lang]').forEach(el => {
      const targetLang = el.getAttribute('data-lang');
      if (targetLang === lang) {
        el.style.display = '';
      } else if (targetLang === 'tr' || targetLang === 'en') {
        el.style.display = 'none';
      }
    });

    // Update elements with data-tr and data-en attributes
    updateLanguageTexts();
  }

  function updateLanguageTexts() {
    const lang = currentLang;
    document.querySelectorAll('[data-tr][data-en]').forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) {
        if (el.tagName === 'INPUT') {
          el.placeholder = text;
        } else {
          el.textContent = text;
        }
      }
    });
  }

  // 3. ScrollSpy / TOC Active Highlight
  const observerOptions = {
    root: null,
    rootMargin: '-100px 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        tocLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // 4. Live Search Filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      sections.forEach(section => {
        const text = section.textContent.toLowerCase();
        if (query === '' || text.includes(query)) {
          section.style.display = '';
        } else {
          section.style.display = 'none';
        }
      });
    });
  }

  // 5. Copy Anchor Links
  document.querySelectorAll('.copy-anchor-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const section = btn.closest('.policy-section');
      const id = section ? section.getAttribute('id') : '';
      const url = `${window.location.origin}${window.location.pathname}#${id}`;

      navigator.clipboard.writeText(url).then(() => {
        showToast(currentLang === 'tr' ? 'Bölüm bağlantısı kopyalandı!' : 'Section link copied to clipboard!');
      }).catch(() => {
        showToast('Kopyalama başarısız oldu / Failed to copy');
      });
    });
  });

  // 6. Print Button
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // 7. Back To Top Button
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Toast Notification System
  function showToast(msg) {
    if (!toast) return;
    toast.querySelector('.toast-msg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
});
