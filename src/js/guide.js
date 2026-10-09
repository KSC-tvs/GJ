/**
 * Gemstone Guide & Educational Hub Logic
 * Gulshan Jewellers | Est. 1950
 */

import { fetchGemstones, normalizeAssetPath } from './data.js';
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
Gulshan Jewellers | Est. 1950 — Gemstone Buyer's Verification Checklist
1. Natural Earth-Origin: Confirm the gemstone crystallized in the earth, with no synthetic lab-growth.
2. Treatment Disclosure: Explicit disclosure of unheated vs standard heated vs chemical diffusion.
3. Microscopic Verification: Natural inclusions/silk validating earth origin without compromising brilliance.
4. Independent Certification: Accredited gem testing report (IIGJ or reputed testing lab) stating species, origin, and treatment.
5. Metal & Setting: Setting designed to protect the pavilion with open basket for natural light entry.
6. Consultation Ethics: Responsible guidance free from exaggerated supernatural or guaranteed promises.
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

  function updateFromCarats(carats) {
    if (isNaN(carats) || carats <= 0) {
      rattiInput.value = '';
      if (resultText) resultText.textContent = 'Enter a carat weight or traditional Ratti value above to inspect exact gemological conversions.';
      return;
    }

    const mg = Math.round(carats * 200);
    // Pakka Ratti: 1 Pakka Ratti = 182 mg (approx. 0.91 ct) -> Carats * 1.0989
    const pakkaRatti = (carats * 1.0989).toFixed(2);
    // Sunari Ratti: 1 Sunari Ratti = 121.5 mg (approx. 0.6075 ct) -> Carats * 1.646
    const sunariRatti = (carats / 0.6075).toFixed(2);

    rattiInput.value = pakkaRatti;

    if (resultText) {
      resultText.innerHTML = `
        <div style="font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px;">
          ${carats} Metric Carats = ${mg} milligrams (mg)
        </div>
        <div style="font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.6;">
          &bull; <strong>Standard Gemological (Pakka) Ratti:</strong> ${pakkaRatti} Ratti (1 Ratti = 182 mg / 0.91 ct)<br>
          &bull; <strong>Traditional Goldsmith (Sunari) Ratti:</strong> ${sunariRatti} Ratti (1 Ratti = 121.5 mg / 0.61 ct)
        </div>
      `;
    }
  }

  function updateFromRatti(ratti) {
    if (isNaN(ratti) || ratti <= 0) {
      caratInput.value = '';
      if (resultText) resultText.textContent = 'Enter a value to convert.';
      return;
    }

    // Default assumes Standard Gemological (Pakka) Ratti (1 Ratti = 0.91 Carat = 182 mg)
    const carats = (ratti * 0.91).toFixed(2);
    const mg = Math.round(carats * 200);
    caratInput.value = carats;

    if (resultText) {
      resultText.innerHTML = `
        <div style="font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px;">
          ${ratti} Standard Gemological Ratti = ${carats} Metric Carats (~${mg} mg)
        </div>
        <div style="font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.6;">
          &bull; If calculated in <strong>Traditional Goldsmith (Sunari) Ratti</strong> (121.5 mg): ${(ratti * 0.6075).toFixed(2)} Carats (${Math.round(ratti * 121.5)} mg)
        </div>
      `;
    }
  }

  caratInput.addEventListener('input', (e) => {
    updateFromCarats(parseFloat(e.target.value));
  });

  rattiInput.addEventListener('input', (e) => {
    updateFromRatti(parseFloat(e.target.value));
  });
}

function initSpecialistCTA() {
  const ctaBtn = document.getElementById('guide-consult-specialist-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      openEnquiryModal({
        id: 'gemstone-consultation',
        title: 'Gemstone Guidance Consultation',
        primaryCategory: 'gemstones',
        image: 'images/pukhraj-hero.jpg'
      });
    });
  }
}
