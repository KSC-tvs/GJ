/**
 * Conversion & Engagement Tracking
 * Gulshan Jewellers | Est. 1950
 */

export const Tracking = {
  logEvent(eventName, payload = {}) {
    const timestamp = new Date().toISOString();
    const eventData = { event: eventName, timestamp, ...payload };
    
    // Debug logging only when explicitly enabled in browser or dev environment
    if (typeof window !== 'undefined' && window.__GJ_DEBUG__) {
      console.info(`[GJ Analytics] ${eventName}:`, eventData);
    }
    
    // Dispatch custom DOM event for analytics hooks or headless integrations
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gj_analytics_event', { detail: eventData }));
      
      // Route to Google Tag / GA4 dataLayer if present
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload);
      } else if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...payload });
      }
    }
  },

  trackEnquiryClick(productTitle, category) {
    this.logEvent('enquiry_cta_clicked', { product: productTitle, category });
  },

  trackWhatsAppClick(source, prefillMessage) {
    this.logEvent('whatsapp_consultation_clicked', { source, message: prefillMessage });
  },

  trackConsultationSubmit(formData) {
    this.logEvent('consultation_form_submitted', {
      interest: formData.interest,
      gemstone: formData.gemstone,
      metal: formData.metal,
      budget: formData.budget
    });
  },

  trackProductView(productId, productTitle) {
    this.logEvent('view_item', { id: productId, title: productTitle });
  },

  trackAddToCart(item) {
    this.logEvent('add_to_cart', {
      id: item.id,
      title: item.title,
      price: item.priceAmount,
      quantity: item.quantity || 1
    });
  },

  trackCheckoutStart(itemCount, subtotal) {
    this.logEvent('begin_checkout', { itemCount, subtotal });
  },

  trackPurchase(orderRecord) {
    this.logEvent('purchase', {
      orderId: orderRecord.id,
      amount: orderRecord.total,
      itemCount: orderRecord.items?.length || 0
    });
  }
};
