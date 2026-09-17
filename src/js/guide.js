/**
 * Gemstone Guide & Educational Hub Logic
 * Gulshan Jewellers | Est. 1950
 */

import { fetchGemstones } from './data.js';
import { openEnquiryModal, showToast } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  const gemstones = await fetchGemstones();
  initGuideNavigation();
  initBuyerChecklist();
  initSpecialistCTA();
  initRattiCaratCalculator();
});

function initGuideNavigation() {
  const navItems = document.querySelectorAll('.guide-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const offset = 120;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = targetEl.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

function initBuyerChecklist() {
  const copyBtn = document.getElementById('copy-checklist-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const checklistText = `
Gulshan Jewellers | Est. 1950 — Gemstone Buyer's Checklist
1. Natural vs Lab-Grown: Verify the stone is 100% earth-mined corundum/beryl.
2. Treatment Disclosure: Ask explicitly whether the stone is unheated, heated, beryllium-diffused, or glass-filled.
3. Clarity & Silk: Confirm natural inclusions/silk verifying earth origin.
4. Independent Certification: Insist on an accredited testing laboratory certificate stating treatment and origin.
5. Metal & Setting: Ensure setting allows appropriate light entry without hiding fractures.
6. Consultation Ethics: Ensure guidance is framed responsibly without magical or guaranteed outcome promises.
      `.trim();

      navigator.clipboard.writeText(checklistText).then(() => {
        showToast('Checklist copied to clipboard. Take this to your consultation!');
      });
    });
  }

  const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const parent = cb.closest('.checklist-item');
      if (parent) {
        parent.classList.toggle('checked', cb.checked);
      }
    });
  });
}

function initRattiCaratCalculator() {
  const caratInput = document.getElementById('calc-carat-input');
  const rattiInput = document.getElementById('calc-ratti-input');
  const resultText = document.getElementById('calc-result-text');

  if (!caratInput || !rattiInput) return;

  caratInput.addEventListener('input', (e) => {
    const carats = parseFloat(e.target.value);
    if (!isNaN(carats) && carats > 0) {
      // 1 Carat = approx 1.10 Traditional Ratti
      const ratti = (carats * 1.0989).toFixed(2);
      rattiInput.value = ratti;
      if (resultText) {
        resultText.textContent = `${carats} Carats is approximately ${ratti} Traditional Ratti (approx. ${(carats * 200).toFixed(0)} mg). Standard astrological rings typically range from 4.25 to 7.25 Ratti.`;
      }
    } else {
      rattiInput.value = '';
      if (resultText) resultText.textContent = 'Enter a value to convert.';
    }
  });

  rattiInput.addEventListener('input', (e) => {
    const ratti = parseFloat(e.target.value);
    if (!isNaN(ratti) && ratti > 0) {
      // 1 Traditional Ratti = 0.91 Carats
      const carats = (ratti * 0.91).toFixed(2);
      caratInput.value = carats;
      if (resultText) {
        resultText.textContent = `${ratti} Ratti is approximately ${carats} Metric Carats (approx. ${(carats * 200).toFixed(0)} mg).`;
      }
    } else {
      caratInput.value = '';
      if (resultText) resultText.textContent = 'Enter a value to convert.';
    }
  });
}

function initSpecialistCTA() {
  const ctaBtn = document.getElementById('guide-consult-specialist-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      openEnquiryModal({
        title: 'Gemstone Educational Consultation',
        primaryCategory: 'gemstones',
        image: '/images/pukhraj-hero.jpg'
      });
    });
  }
}
