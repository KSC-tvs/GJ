/**
 * Conversion & Engagement Tracking
 * Gulshan Jewellers | Est. 1950
 */

export const Tracking = {
  logEvent(eventName, payload = {}) {
    const timestamp = new Date().toISOString();
    const eventData = { event: eventName, timestamp, ...payload };
    console.info(`[GJ Tracking] ${eventName}:`, eventData);
    
    // Dispatch custom DOM event for analytics hooks or headless integrations
    window.dispatchEvent(new CustomEvent('gj_analytics_event', { detail: eventData }));
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
    this.logEvent('product_detail_viewed', { id: productId, title: productTitle });
  }
};
