/* ==========================================================================
   doa4u — Data Service & Search Helpers
   Client-side fetch for data/duas.json with emotion indexing & keyword search
   ========================================================================== */

class DataService {
  constructor() {
    this.duasData = [];
    this.isLoaded = false;
  }

  async loadData() {
    if (this.isLoaded) return this.duasData;
    
    try {
      const response = await fetch('./data/duas.json');
      if (!response.ok) {
        throw new Error(`Gagal memuatkan data doa (${response.status})`);
      }
      this.duasData = await response.json();
      this.isLoaded = true;
      return this.duasData;
    } catch (err) {
      console.error('Error fetching duas.json:', err);
      return [];
    }
  }

  getAllEmotions() {
    return this.duasData;
  }

  slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  findEmotionBySlug(slug) {
    if (!slug) return null;
    const targetSlug = slug.toLowerCase().trim();
    return this.duasData.find(item => this.slugify(item.emotion_ms) === targetSlug) || null;
  }

  findEmotionByName(name) {
    if (!name) return null;
    const targetName = name.toLowerCase().trim();
    return this.duasData.find(item => item.emotion_ms.toLowerCase() === targetName) || null;
  }

  searchEmotions(query) {
    if (!query || query.trim() === '') return this.duasData;
    
    const q = query.toLowerCase().trim();
    return this.duasData.filter(item => {
      const matchEmotion = item.emotion_ms.toLowerCase().includes(q);
      const matchKeyword = item.keywords.some(kw => kw.toLowerCase().includes(q));
      const matchTranslation = item.duas.some(d => d.translation_ms.toLowerCase().includes(q) || d.rumi.toLowerCase().includes(q));
      return matchEmotion || matchKeyword || matchTranslation;
    });
  }
}

// Global Instance
window.DataServiceInstance = new DataService();
