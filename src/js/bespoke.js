/**
 * Bespoke Jewellery Creation Journey
 * Gulshan Jewellers | Est. 1950
 */

import { Tracking } from './tracking.js';
import { showToast } from './components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  initTransformationSlider();
  initBespokeForm();
});

function initTransformationSlider() {
  const slider = document.getElementById('transformation-slider');
  const overlay = document.getElementById('transformation-overlay');
  if (!slider || !overlay) return;

  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    overlay.style.width = `${val}%`;
  });
}

function initBespokeForm() {
  const form = document.getElementById('bespoke-consultation-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    Tracking.trackConsultationSubmit(data);

    showToast('Your bespoke enquiry has been received. Our master jeweller will contact you.');
    form.reset();

    const promptWa = confirm('Would you also like to open WhatsApp to share reference sketches or voice notes with our design team?');
    if (promptWa) {
      const summary = `Hello Gulshan Jewellers, I submitted a bespoke request for: ${data.itemType || 'Custom Piece'} in ${data.metal || 'Gold'} with ${data.gemstone || 'Selected Gemstone'}, budget approx ${data.budget || 'Flexible'}.`;
      window.open(`https://wa.me/919876543210?text=${encodeURIComponent(summary)}`, '_blank');
    }
  });
}
