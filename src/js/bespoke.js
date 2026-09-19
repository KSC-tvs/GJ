/**
 * Bespoke Jewellery Creation Journey
 * Gulshan Jewellers | Est. 1950
 */

import { Tracking } from './tracking.js';
import { showToast } from './components/toast.js';
import { initComparisonSlider } from './components/interactive.js';
import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  initComparisonSlider();
  initBespokeForm();
});

function initBespokeForm() {
  const form = document.getElementById('bespoke-consultation-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    Tracking.trackConsultationSubmit(data);

    const enquiryPayload = {
      name: data.name || 'Bespoke Client',
      contact: data.contact || data.phone || data.email || '+91 95828 41454',
      piece: `Bespoke: ${data.itemType || 'Custom Piece'} (${data.metal || 'Gold'} / ${data.gemstone || 'Selected Gemstone'})`,
      message: `Budget: ${data.budget || 'Flexible'}. Notes: ${data.notes || 'Bespoke Atelier Consultation'}`,
      status: 'New'
    };

    // 1. Dispatch to Supabase CRM
    try {
      await db.createEnquiry(enquiryPayload);
    } catch (err) {
      console.warn('Supabase bespoke CRM write error:', err);
    }

    // 2. Local storage copy
    try {
      const existing = JSON.parse(localStorage.getItem('gj_enquiries') || '[]');
      existing.unshift({
        id: 'ENQ-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        ...enquiryPayload
      });
      localStorage.setItem('gj_enquiries', JSON.stringify(existing));
    } catch (_) {}

    showToast('Your bespoke enquiry has been received. Our master jeweller will contact you.');
    form.reset();

    const promptWa = confirm('Would you also like to open WhatsApp to share reference sketches or voice notes with our design team?');
    if (promptWa) {
      const summary = `Hello Gulshan Jewellers, I submitted a bespoke request for: ${data.itemType || 'Custom Piece'} in ${data.metal || 'Gold'} with ${data.gemstone || 'Selected Gemstone'}, budget approx ${data.budget || 'Flexible'}.`;
      window.open(`https://wa.me/919582841454?text=${encodeURIComponent(summary)}`, '_blank');
    }
  });
}
