/* ==========================================================================
   doa4u — SPA Controller & Hash Router
   Single-Page App logic, emotion picker, du'aa card render, copy/share API
   ========================================================================== */

class AppController {
  constructor() {
    this.currentEmotion = null;
    this.currentDuaIndex = 0;
    this.selectedDropdownValue = '';

    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  async init() {
    // Load dataset
    await window.DataServiceInstance.loadData();

    // Setup DOM Listeners
    this.setupHomeView();
    this.setupDirectoryView();
    this.setupResultActions();
    
    // Hash Router Listener
    window.addEventListener('hashchange', () => this.handleRoute());

    // Initial Route Evaluation
    this.handleRoute();
  }

  // --- HASH ROUTER ---
  handleRoute() {
    const hash = window.location.hash || '#/';
    
    if (hash.startsWith('#/doa/')) {
      const slug = hash.replace('#/doa/', '').trim();
      const emotionObj = window.DataServiceInstance.findEmotionBySlug(slug);
      if (emotionObj) {
        this.showResultView(emotionObj);
      } else {
        // Fallback to home if slug invalid
        window.location.hash = '#/';
      }
    } else if (hash === '#/directory') {
      this.showDirectoryView();
    } else {
      this.showHomeView();
    }
  }

  switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.add('active');
      window.scrollTo(0, 0);
    }
  }

  // --- HOME VIEW SETUP ---
  setupHomeView() {
    const selectEl = document.getElementById('emotion-select');
    const chipsGrid = document.getElementById('chips-grid');
    const findBtn = document.getElementById('find-doa-btn');
    const showAllLink = document.getElementById('show-all-link');

    const emotions = window.DataServiceInstance.getAllEmotions();

    // Populate Dropdown
    if (selectEl) {
      selectEl.innerHTML = '<option value="">-- Pilih Perasaan Anda --</option>';
      emotions.forEach(item => {
        const option = document.createElement('option');
        option.value = window.DataServiceInstance.slugify(item.emotion_ms);
        option.textContent = item.emotion_ms;
        selectEl.appendChild(option);
      });

      selectEl.addEventListener('change', (e) => {
        this.selectedDropdownValue = e.target.value;
      });
    }

    // Populate Quick Pick Chips (Top 12 common emotions)
    if (chipsGrid) {
      chipsGrid.innerHTML = '';
      const quickPickList = emotions.slice(0, 12);
      quickPickList.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip-btn';
        btn.innerHTML = `<i class="fa-solid fa-heart"></i> ${item.emotion_ms}`;
        btn.addEventListener('click', () => {
          const slug = window.DataServiceInstance.slugify(item.emotion_ms);
          window.location.hash = `#/doa/${slug}`;
        });
        chipsGrid.appendChild(btn);
      });
    }

    // Find Button Click
    if (findBtn) {
      findBtn.addEventListener('click', () => {
        if (this.selectedDropdownValue) {
          window.location.hash = `#/doa/${this.selectedDropdownValue}`;
        } else {
          window.UIManagerInstance.showToast('Sila pilih perasaan anda dahulu!', 'fa-solid fa-circle-exclamation');
        }
      });
    }

    // Show All Directory Link
    if (showAllLink) {
      showAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#/directory';
      });
    }
  }

  showHomeView() {
    this.switchView('home-view');
  }

  // --- RESULT VIEW SETUP ---
  showResultView(emotionObj, resetIndex = true) {
    if (resetIndex) {
      this.currentDuaIndex = 0;
    }
    this.currentEmotion = emotionObj;

    // Show loading overlay for ~600ms then render card
    window.UIManagerInstance.showLoading(() => {
      this.renderResultCard();
      this.switchView('result-view');
    });
  }

  renderResultCard() {
    if (!this.currentEmotion || !this.currentEmotion.duas.length) return;

    const dua = this.currentEmotion.duas[this.currentDuaIndex];
    const totalDuas = this.currentEmotion.duas.length;

    // Badge
    const badgeEl = document.getElementById('result-emotion-badge');
    if (badgeEl) {
      badgeEl.innerHTML = `<i class="fa-solid fa-moon"></i> Perasaan: ${this.currentEmotion.emotion_ms}`;
    }

    // Card Content
    const arabicEl = document.getElementById('dua-arabic');
    const rumiEl = document.getElementById('dua-rumi');
    const translationEl = document.getElementById('dua-translation');
    const sourceEl = document.getElementById('dua-source');
    const cycleBtn = document.getElementById('cycle-dua-btn');

    if (arabicEl) arabicEl.textContent = dua.arabic;
    if (rumiEl) rumiEl.textContent = `"${dua.rumi}"`;
    if (translationEl) translationEl.textContent = dua.translation_ms;
    if (sourceEl) sourceEl.innerHTML = `<i class="fa-solid fa-book-bookmark"></i> Sumber: ${dua.source}`;

    // Cycle Button Visibility
    if (cycleBtn) {
      if (totalDuas > 1) {
        cycleBtn.style.display = 'inline-flex';
        cycleBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Doa Lain (${this.currentDuaIndex + 1}/${totalDuas})`;
      } else {
        cycleBtn.style.display = 'none';
      }
    }
  }

  setupResultActions() {
    const cycleBtn = document.getElementById('cycle-dua-btn');
    const copyBtn = document.getElementById('copy-dua-btn');
    const shareBtn = document.getElementById('share-dua-btn');
    const backBtn = document.getElementById('back-to-home-btn');

    // Cycle Button
    if (cycleBtn) {
      cycleBtn.addEventListener('click', () => {
        if (!this.currentEmotion || !this.currentEmotion.duas.length) return;
        this.currentDuaIndex = (this.currentDuaIndex + 1) % this.currentEmotion.duas.length;
        
        window.UIManagerInstance.showLoading(() => {
          this.renderResultCard();
        });
      });
    }

    // Copy Button
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!this.currentEmotion || !this.currentEmotion.duas.length) return;
        const dua = this.currentEmotion.duas[this.currentDuaIndex];
        
        const formattedText = `[doa4u] Doa ketika ${this.currentEmotion.emotion_ms}:\n\n${dua.arabic}\n\n"${dua.rumi}"\n\nMaksud: ${dua.translation_ms}\n\nSumber: ${dua.source}\n\nKongsi via: ${window.location.href}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(formattedText).then(() => {
            window.UIManagerInstance.showToast('Teks doa telah disalin!', 'fa-solid fa-copy');
          }).catch(() => {
            this.fallbackCopyText(formattedText);
          });
        } else {
          this.fallbackCopyText(formattedText);
        }
      });
    }

    // Share Button
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (!this.currentEmotion) return;
        
        const shareData = {
          title: `doa4u - Doa untuk Perasaan ${this.currentEmotion.emotion_ms}`,
          text: `Cari doa mengikut perasaan anda di doa4u. Doa untuk ${this.currentEmotion.emotion_ms}:`,
          url: window.location.href
        };

        if (navigator.share) {
          navigator.share(shareData).catch((err) => {
            // User cancelled or share failed -> copy URL fallback
            if (err.name !== 'AbortError') {
              this.copyUrlToClipboard();
            }
          });
        } else {
          this.copyUrlToClipboard();
        }
      });
    }

    // Back Button
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.hash = '#/';
      });
    }
  }

  fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      window.UIManagerInstance.showToast('Teks doa telah disalin!', 'fa-solid fa-copy');
    } catch (e) {
      window.UIManagerInstance.showToast('Gagal menyalin teks.', 'fa-solid fa-circle-exclamation');
    }
    document.body.removeChild(textArea);
  }

  copyUrlToClipboard() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        window.UIManagerInstance.showToast('Pautan telah disalin!', 'fa-solid fa-share-nodes');
      });
    } else {
      this.fallbackCopyText(url);
    }
  }

  // --- DIRECTORY VIEW SETUP ---
  setupDirectoryView() {
    const searchInput = document.getElementById('directory-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderDirectoryGrid(e.target.value);
      });
    }
  }

  showDirectoryView() {
    const searchInput = document.getElementById('directory-search');
    if (searchInput) searchInput.value = '';
    this.renderDirectoryGrid('');
    this.switchView('directory-view');
  }

  renderDirectoryGrid(query = '') {
    const gridEl = document.getElementById('directory-grid');
    if (!gridEl) return;

    const filtered = window.DataServiceInstance.searchEmotions(query);

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-magnifying-glass"></i>
          <p>Tiada perasaan dijumpai untuk "${query}"</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = '';
    filtered.forEach(item => {
      const slug = window.DataServiceInstance.slugify(item.emotion_ms);
      const card = document.createElement('div');
      card.className = 'dir-card tilt-card';
      card.innerHTML = `
        <div class="dir-card-title">
          <i class="fa-solid fa-heart-pulse"></i> ${item.emotion_ms}
        </div>
        <div class="dir-card-desc">
          ${item.keywords.slice(0, 4).join(', ')}
        </div>
        <div class="dir-card-count">
          ${item.duas.length} Doa
        </div>
      `;
      card.addEventListener('click', () => {
        window.location.hash = `#/doa/${slug}`;
      });
      gridEl.appendChild(card);
    });

    // Re-initialize tilt effect for newly rendered cards
    if (window.UIManagerInstance) {
      window.UIManagerInstance.initTiltEffect();
    }
  }
}

// Global Instance
window.AppControllerInstance = new AppController();
