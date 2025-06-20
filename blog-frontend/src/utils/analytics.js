// src/utils/analytics.js
class Analytics {
  constructor() {
    this.events = [];
  }

  // Track page views
  trackPageView(page, title) {
    const event = {
      type: 'page_view',
      page,
      title,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    this.events.push(event);
    this.sendToServer(event);
  }

  // Track user interactions
  trackEvent(category, action, label = null, value = null) {
    const event = {
      type: 'event',
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString()
    };
    
    this.events.push(event);
    this.sendToServer(event);
  }

  // Track post reads
  trackPostRead(postId, title, readTime) {
    this.trackEvent('Post', 'Read', title, readTime);
  }

  // Send data to backend
  async sendToServer(event) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }
}

export const analytics = new Analytics();
