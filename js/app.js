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
    const chipsGrid = document.getElementById('chips-grid');
    const findBtn = document.getElementById('find-doa-btn');
    const showAllLink = document.getElementById('show-all-link');

    const emotions = window.DataServiceInstance.getAllEmotions();

    // Setup Custom Searchable Select (Select2 style)
    this.setupCustomSelect(emotions);

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

  setupCustomSelect(emotions) {
    const container = document.getElementById('custom-select-container');
    const trigger = document.getElementById('custom-select-trigger');
    const label = document.getElementById('custom-select-label');
    const dropdown = document.getElementById('custom-select-dropdown');
    const searchInput = document.getElementById('custom-select-search');
    const optionsList = document.getElementById('custom-select-options');
    const selectEl = document.getElementById('emotion-select');

    if (!container || !trigger || !dropdown || !optionsList) return;

    let highlightedIndex = -1;

    // Populate native select for fallback/accessibility
    if (selectEl) {
      selectEl.innerHTML = '<option value="">-- Pilih Perasaan Anda --</option>';
      emotions.forEach(item => {
        const option = document.createElement('option');
        option.value = window.DataServiceInstance.slugify(item.emotion_ms);
        option.textContent = item.emotion_ms;
        selectEl.appendChild(option);
      });
    }

    const renderOptions = (filterText = '') => {
      optionsList.innerHTML = '';
      const query = filterText.toLowerCase().trim();

      // Default Option
      if (!query) {
        const defaultLi = document.createElement('li');
        defaultLi.className = 'custom-option' + (this.selectedDropdownValue === '' ? ' selected' : '');
        defaultLi.setAttribute('role', 'option');
        defaultLi.dataset.value = '';
        defaultLi.innerHTML = `<span>-- Pilih Perasaan Anda --</span>${this.selectedDropdownValue === '' ? '<i class="fa-solid fa-check"></i>' : ''}`;
        defaultLi.addEventListener('click', () => selectOption('', '-- Pilih Perasaan Anda --'));
        optionsList.appendChild(defaultLi);
      }

      const filtered = emotions.filter(item => {
        if (!query) return true;
        const nameMatch = item.emotion_ms.toLowerCase().includes(query);
        const keywordMatch = item.keywords && item.keywords.some(k => k.toLowerCase().includes(query));
        return nameMatch || keywordMatch;
      });

      if (filtered.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'custom-option-empty';
        emptyLi.textContent = 'Tiada perasaan dijumpai';
        optionsList.appendChild(emptyLi);
        highlightedIndex = -1;
        return;
      }

      filtered.forEach((item) => {
        const slug = window.DataServiceInstance.slugify(item.emotion_ms);
        const isSelected = this.selectedDropdownValue === slug;
        const li = document.createElement('li');
        li.className = 'custom-option' + (isSelected ? ' selected' : '');
        li.setAttribute('role', 'option');
        li.dataset.value = slug;
        
        // Match indicator if matched via keyword
        const isNameMatch = item.emotion_ms.toLowerCase().includes(query);
        let subtitleText = '';
        if (query && !isNameMatch && item.keywords) {
          const matchedKw = item.keywords.find(k => k.toLowerCase().includes(query));
          if (matchedKw) subtitleText = `<span style="font-size:0.8rem; opacity:0.7; margin-left:6px;">(${matchedKw})</span>`;
        }

        li.innerHTML = `
          <span><i class="fa-solid fa-heart" style="font-size:0.75rem; margin-right:8px; color:var(--accent-gold);"></i> ${item.emotion_ms}${subtitleText}</span>
          ${isSelected ? '<i class="fa-solid fa-check"></i>' : ''}
        `;

        li.addEventListener('click', () => selectOption(slug, item.emotion_ms));
        optionsList.appendChild(li);
      });

      highlightedIndex = -1;
    };

    const openDropdown = () => {
      container.classList.add('open');
      dropdown.removeAttribute('hidden');
      trigger.setAttribute('aria-expanded', 'true');
      if (searchInput) {
        searchInput.value = '';
        renderOptions('');
        searchInput.focus();
      }
    };

    const closeDropdown = () => {
      container.classList.remove('open');
      dropdown.setAttribute('hidden', '');
      trigger.setAttribute('aria-expanded', 'false');
      highlightedIndex = -1;
    };

    const selectOption = (val, text) => {
      this.selectedDropdownValue = val;
      if (label) label.textContent = text;
      if (selectEl) selectEl.value = val;
      closeDropdown();
      trigger.focus();
    };

    // Toggle dropdown on trigger click
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (container.classList.contains('open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    // Keyboard support for trigger
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
    });

    // Search input filter
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderOptions(e.target.value);
      });

      searchInput.addEventListener('keydown', (e) => {
        const items = optionsList.querySelectorAll('.custom-option');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          highlightedIndex = (highlightedIndex + 1) % items.length;
          updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
          updateHighlight(items);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (highlightedIndex >= 0 && items[highlightedIndex]) {
            items[highlightedIndex].click();
          } else if (items.length > 0) {
            items[0].click();
          }
        } else if (e.key === 'Escape') {
          closeDropdown();
          trigger.focus();
        }
      });
    }

    const updateHighlight = (items) => {
      items.forEach((item, idx) => {
        if (idx === highlightedIndex) {
          item.classList.add('highlighted');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('highlighted');
        }
      });
    };

    // Click outside handler
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        closeDropdown();
      }
    });

    // Initial render
    renderOptions('');
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
