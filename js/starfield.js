/* ==========================================================================
   doa4u — Dynamic Canvas Starfield
   Night & Candlelight Star Field with loading density boost
   ========================================================================== */

class Starfield {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.numStars = 80;
    this.isBoosted = false;
    this.animId = null;
    
    // Check prefers-reduced-motion
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.resize();
    this.createStars();
    
    window.addEventListener('resize', () => this.resize());
    
    if (!this.reducedMotion) {
      this.animate();
    } else {
      this.drawStatic();
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createStars() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() < 0.8 ? 2 : 3, // Pixel sizes: 2px or 3px
        alpha: Math.random(),
        speed: (Math.random() * 0.015) + 0.005,
        twinkleSpeed: (Math.random() * 0.03) + 0.01,
        color: Math.random() > 0.3 ? '#E0B75C' : '#F4EFE4' // Gold or Cream
      });
    }
  }

  setBoost(boosted) {
    this.isBoosted = boosted;
  }

  drawStatic() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let star of this.stars) {
      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = 0.5;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const speedMultiplier = this.isBoosted ? 3.5 : 1;

    for (let star of this.stars) {
      star.alpha += star.twinkleSpeed * speedMultiplier;
      if (star.alpha > 1 || star.alpha < 0.1) {
        star.twinkleSpeed = -star.twinkleSpeed;
      }

      // Drift downward slightly
      star.y += star.speed * speedMultiplier;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }

      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
      this.ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

// Global instance
window.StarfieldInstance = null;
document.addEventListener('DOMContentLoaded', () => {
  window.StarfieldInstance = new Starfield('starfield-canvas');
});
