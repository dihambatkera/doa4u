/* ==========================================================================
   doa4u — UI Micro-interactions & Visual Effects
   Card 3D tilt, 8-bit pixel confetti burst, toast notifications & loading bar
   ========================================================================== */

class UIManager {
  constructor() {
    this.toastContainer = null;
    this.loadingOverlay = null;
    this.loadingFill = null;
    this.confettiCanvas = null;
    this.confettiCtx = null;
    this.particles = [];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', () => {
      this.initElements();
      this.initTiltEffect();
    });
  }

  initElements() {
    this.toastContainer = document.getElementById('toast-notification');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.loadingFill = document.getElementById('loading-bar-fill');
    this.confettiCanvas = document.getElementById('confetti-canvas');
    if (this.confettiCanvas) {
      this.confettiCtx = this.confettiCanvas.getContext('2d');
      this.resizeConfetti();
      window.addEventListener('resize', () => this.resizeConfetti());
    }
  }

  resizeConfetti() {
    if (!this.confettiCanvas) return;
    this.confettiCanvas.width = window.innerWidth;
    this.confettiCanvas.height = window.innerHeight;
  }

  // --- 8-Bit Pixel Particle Confetti Burst ---
  triggerConfettiBurst(originX, originY) {
    if (this.reducedMotion || !this.confettiCtx) return;

    const colors = ['#E0B75C', '#F4EFE4', '#FFD166', '#FF9F1C', '#FFFFFF'];
    const particleCount = 45;
    this.particles = [];

    const startX = originX || window.innerWidth / 2;
    const startY = originY || window.innerHeight / 3;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3, // slightly upward impulse
        size: Math.random() < 0.6 ? 4 : 6, // 8-bit square pixels
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: Math.random() * 0.025 + 0.015,
        gravity: 0.25
      });
    }

    this.animateConfetti();
  }

  animateConfetti() {
    if (!this.confettiCtx) return;

    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

    let activeParticles = 0;

    for (let p of this.particles) {
      if (p.life <= 0) continue;

      activeParticles++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;

      this.confettiCtx.fillStyle = p.color;
      this.confettiCtx.globalAlpha = Math.max(0, p.life);
      // Pixel square
      this.confettiCtx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }

    if (activeParticles > 0) {
      requestAnimationFrame(() => this.animateConfetti());
    } else {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }
  }

  // --- 8-Bit Loading Animation (~600ms) ---
  showLoading(callback) {
    if (!this.loadingOverlay || !this.loadingFill) {
      if (callback) callback();
      return;
    }

    // Boost starfield background
    if (window.StarfieldInstance) {
      window.StarfieldInstance.setBoost(true);
    }

    this.loadingOverlay.classList.add('active');
    this.loadingFill.style.width = '0%';

    let progress = 0;
    const duration = 650; // ms
    const intervalTime = 30;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      progress += step;
      if (progress >= 100) {
        progress = 100;
        this.loadingFill.style.width = '100%';
        clearInterval(timer);

        setTimeout(() => {
          this.loadingOverlay.classList.remove('active');
          if (window.StarfieldInstance) {
            window.StarfieldInstance.setBoost(false);
          }
          if (callback) callback();
        }, 120);
      } else {
        this.loadingFill.style.width = progress + '%';
      }
    }, intervalTime);
  }

  // --- Toast Notification ---
  showToast(message, iconClass = 'fa-solid fa-check') {
    if (!this.toastContainer) return;
    
    this.toastContainer.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    this.toastContainer.classList.add('show');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastContainer.classList.remove('show');
    }, 2800);
  }

  // --- Card 3D Tilt Effect (Disabled for static card) ---
  initTiltEffect() {
    // Cursor-tracking tilt effect removed to keep card static
  }
}

// Global Instance
window.UIManagerInstance = new UIManager();
