/**
 * Consultations & Astrology Advisory Controller
 * Gulshan Jewellers | Est. 1950
 * Handles service selection, 4-step gemstone quiz wizard, and confidential slot reservation.
 */

import { db } from './supabase.js';
import { showToast } from './components/toast.js';
import { Tracking } from './tracking.js';

document.addEventListener('DOMContentLoaded', () => {
  initServiceSelectButtons();
  initGemstoneQuiz();
  initBookingForm();
  setDefaultBookingDate();
});

let currentSelectedService = {
  id: 'gemstone-recommendation',
  title: 'Vedic Gemstone Recommendation',
  price: 2100,
  duration: 45
};

function setDefaultBookingDate() {
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    // Tomorrow as minimum date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

function initServiceSelectButtons() {
  const buttons = document.querySelectorAll('.btn-book-service');
  const serviceLabel = document.getElementById('booking-selected-service');
  const feeLabel = document.getElementById('booking-selected-fee');
  const durationLabel = document.getElementById('booking-selected-duration');
  const bookingSection = document.getElementById('booking-section');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-service');
      const title = btn.getAttribute('data-title');
      const price = parseInt(btn.getAttribute('data-price'), 10);
      const duration = parseInt(btn.getAttribute('data-duration'), 10);

      currentSelectedService = { id, title, price, duration };

      if (serviceLabel) serviceLabel.textContent = title;
      if (feeLabel) feeLabel.textContent = price === 0 ? 'Complimentary' : `₹${price.toLocaleString('en-IN')}`;
      if (durationLabel) durationLabel.textContent = `${duration} Minutes`;

      bookingSection?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function initGemstoneQuiz() {
  let currentStep = 1;
  const totalSteps = 4;

  const stepLabel = document.getElementById('quiz-step-label');
  const progressFill = document.getElementById('quiz-progress-fill');

  const nextBtns = document.querySelectorAll('.btn-quiz-next');
  const prevBtns = document.querySelectorAll('.btn-quiz-prev');
  const submitBtn = document.getElementById('btn-quiz-submit');

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.getAttribute('data-next'), 10);
      goToStep(nextStep);
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = parseInt(btn.getAttribute('data-prev'), 10);
      goToStep(prevStep);
    });
  });

  function goToStep(step) {
    document.querySelectorAll('.quiz-step-pane').forEach(el => el.style.display = 'none');
    const targetPane = document.getElementById(`quiz-step-${step}`);
    if (targetPane) targetPane.style.display = 'block';

    currentStep = step;
    if (stepLabel) stepLabel.textContent = `Step ${step} of ${totalSteps}`;
    if (progressFill) progressFill.style.width = `${(step / totalSteps) * 100}%`;
  }

  submitBtn?.addEventListener('click', () => {
    calculateRecommendation();
  });

  function calculateRecommendation() {
    const goal = document.querySelector('input[name="quizGoal"]:checked')?.value || 'wisdom_prosperity';
    const rashi = document.getElementById('quiz-rashi-select')?.value || 'skip';
    const metal = document.querySelector('input[name="quizMetal"]:checked')?.value || '22k_gold';
    const budget = document.querySelector('input[name="quizBudget"]:checked')?.value || 'accessible';

    let gemTitle = 'Natural Ceylon Yellow Sapphire (Pukhraj)';
    let gemDesc = 'Traditionally recommended for wisdom, clarity of intellect, prosperity, and expansive growth under Jupiter (Brihaspati). Best crafted in solid 22K yellow gold.';
    let shopUrl = 'collections.html?gemstone=pukhraj';

    if (goal === 'discipline_focus') {
      if (budget === 'accessible') {
        gemTitle = 'Natural Blue Kyanite (Certified Upratna)';
        gemDesc = 'An untreated natural blue stone prized in Vedic circles as an accessible alternative for Saturn (Shani), fostering discipline, mental grounding, and focus.';
        shopUrl = 'products/kyanite-artisan-silver-ring.html';
      } else {
        gemTitle = 'Natural Royal Blue Ceylon Sapphire (Neelam)';
        gemDesc = 'The premier stone of Saturn (Shani), representing unwavering focus, discipline, and perseverance. Handcrafted in 18K white gold or fine platinum.';
        shopUrl = 'collections.html?gemstone=neelam';
      }
    } else if (goal === 'intellect_communication') {
      gemTitle = 'Natural Colombian Emerald (Panna)';
      gemDesc = 'Aligns with Mercury (Budha), the planet of trade, articulate speech, logic, and intellectual acuity. Recommended in traditional 18K gold bezel setting.';
      shopUrl = 'collections.html?gemstone=emerald';
    } else if (goal === 'vitality_leadership') {
      gemTitle = 'Natural Mozambique Ruby (Manik)';
      gemDesc = 'Governed by the Sun (Surya), symbolizing regal confidence, life vitality, and steadfast leadership. Recommended in rich 22K gold.';
      shopUrl = 'collections.html?gemstone=ruby';
    }

    // Hide all step panes and show result
    document.querySelectorAll('.quiz-step-pane').forEach(el => el.style.display = 'none');
    const resultPane = document.getElementById('quiz-result-pane');
    if (resultPane) {
      document.getElementById('result-gem-title').textContent = gemTitle;
      document.getElementById('result-gem-desc').textContent = gemDesc;
      const shopBtn = document.getElementById('result-shop-btn');
      if (shopBtn) shopBtn.href = shopUrl;

      resultPane.style.display = 'block';
      if (stepLabel) stepLabel.textContent = 'Recommendation Completed';
      if (progressFill) progressFill.style.width = '100%';
    }
  }
}

function initBookingForm() {
  const form = document.getElementById('consultation-booking-form');
  const successModal = document.getElementById('booking-success-modal');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('booking-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Securing Appointment Slot...';
    }

    const bookingRef = `GJ-CONS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const bookingData = {
      bookingRef,
      createdAt: new Date().toISOString(),
      service: currentSelectedService,
      appointment: {
        date: document.getElementById('booking-date')?.value,
        timeSlot: document.getElementById('booking-time-slot')?.value,
        mode: form.querySelector('input[name="consultationMode"]:checked')?.value || 'google_meet'
      },
      client: {
        name: document.getElementById('booking-name')?.value.trim(),
        phone: document.getElementById('booking-phone')?.value.trim(),
        email: document.getElementById('booking-email')?.value.trim(),
        language: document.getElementById('booking-language')?.value
      },
      birthDetails: {
        dob: document.getElementById('booking-dob')?.value,
        tob: document.getElementById('booking-tob')?.value,
        pob: document.getElementById('booking-pob')?.value.trim(),
        query: document.getElementById('booking-query')?.value.trim()
      },
      status: 'Confirmed'
    };

    // 1. Save to local storage
    try {
      const existing = JSON.parse(localStorage.getItem('gj_consultations') || '[]');
      existing.unshift(bookingData);
      localStorage.setItem('gj_consultations', JSON.stringify(existing));
    } catch (err) {
      console.warn('Local storage error:', err);
    }

    // 2. Dispatch to Supabase Consultations & CRM
    try {
      await db.createConsultation({
        id: bookingRef,
        clientName: bookingData.client.name,
        clientEmail: bookingData.client.email,
        clientPhone: bookingData.client.phone,
        serviceId: bookingData.service.id,
        serviceName: bookingData.service.title,
        slotDate: bookingData.appointment.date,
        slotTime: bookingData.appointment.timeSlot,
        birthDate: bookingData.birthDetails.dob,
        birthTime: bookingData.birthDetails.tob,
        birthPlace: bookingData.birthDetails.pob,
        concern: bookingData.birthDetails.query,
        notes: `Mode: ${bookingData.appointment.mode}`
      });
    } catch (err) {
      console.warn('Supabase consultation dispatch note:', err);
    }

    // 3. Fire Analytics Event
    Tracking.trackEnquirySubmit?.({
      type: 'consultation',
      service: bookingData.service.title,
      reference: bookingRef
    });

    // 4. Show success state
    form.style.display = 'none';
    if (successModal) {
      document.getElementById('booking-ref-display').textContent = bookingRef;
      successModal.style.display = 'block';
      successModal.scrollIntoView({ behavior: 'smooth' });
    }

    showToast('Your consultation slot has been reserved successfully!');
  });
}
