/**
 * International Ring Size Guide & Measurement Tool
 * Gulshan Jewellers | Est. 1950
 */

let ringSizeModalDOM = null;

const RING_SIZES = [
  { indian: 10, us: 5.25, uk: 'K', eu: 50, mmDiameter: 15.9, mmCircumference: 50.0 },
  { indian: 12, us: 6.0, uk: 'L 1/2', eu: 52, mmDiameter: 16.5, mmCircumference: 51.9 },
  { indian: 14, us: 6.75, uk: 'N', eu: 54, mmDiameter: 17.2, mmCircumference: 54.0 },
  { indian: 16, us: 7.5, uk: 'P', eu: 56, mmDiameter: 17.8, mmCircumference: 56.0 },
  { indian: 18, us: 8.25, uk: 'Q 1/2', eu: 58, mmDiameter: 18.5, mmCircumference: 58.0 },
  { indian: 20, us: 9.0, uk: 'S', eu: 60, mmDiameter: 19.1, mmCircumference: 60.0 },
  { indian: 22, us: 10.0, uk: 'T 1/2', eu: 62, mmDiameter: 19.7, mmCircumference: 62.0 },
  { indian: 24, us: 10.75, uk: 'V', eu: 64, mmDiameter: 20.4, mmCircumference: 64.1 }
];

export function initRingSizeModal() {
  createRingSizeModalDOM();
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-trigger-size-guide]')) {
      e.preventDefault();
      openRingSizeModal();
    }
  });
}

function createRingSizeModalDOM() {
  if (document.getElementById('ring-size-guide-modal')) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'ring-size-guide-modal';
  backdrop.className = 'size-guide-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  backdrop.innerHTML = `
    <div class="size-guide-container">
      <div class="size-guide-header">
        <div>
          <span class="section-eyebrow" style="margin: 0; font-size: 0.65rem;">Precision Atelier Sizing</span>
          <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--color-ivory);">International Ring Sizing Chart</h3>
        </div>
        <button class="size-guide-close" aria-label="Close size guide">&times;</button>
      </div>
      <div class="size-guide-body">
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: var(--space-4);">
          Every Gulshan Jewellers ring is hand-sized by our master goldsmiths. If you are uncertain about your ring size, refer to the conversion chart below or consult our atelier for a complimentary sizing kit.
        </p>

        <div style="overflow-x: auto;">
          <table class="size-table">
            <thead>
              <tr>
                <th>Indian Size</th>
                <th>US / Canada</th>
                <th>UK / Australia</th>
                <th>European</th>
                <th>Inner Diameter (mm)</th>
                <th>Circumference (mm)</th>
              </tr>
            </thead>
            <tbody>
              ${RING_SIZES.map(s => `
                <tr>
                  <td><strong>Size ${s.indian}</strong></td>
                  <td>${s.us}</td>
                  <td>${s.uk}</td>
                  <td>${s.eu}</td>
                  <td>${s.mmDiameter} mm</td>
                  <td>${s.mmCircumference} mm</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background-color: var(--color-bg-card); padding: var(--space-5); border-radius: var(--radius-xs); border: 1px solid var(--color-border-hairline); margin-top: var(--space-6);">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-gold-champagne); margin-bottom: var(--space-2);">
            How to Measure at Home
          </h4>
          <ol style="font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.7; padding-left: var(--space-4); list-style: decimal;">
            <li>Wrap a narrow strip of paper or string around the base of the intended finger.</li>
            <li>Mark the point where the ends meet with a pen.</li>
            <li>Measure the length against a ruler in millimeters to determine the finger circumference.</li>
            <li>Match your measurement against the chart above. When in doubt, select the larger size.</li>
          </ol>
        </div>

        <div style="margin-top: var(--space-6); text-align: center;">
          <button type="button" class="btn btn-outline btn-sm" onclick="GJ.closeRingSizeModal(); GJ.openEnquiryModal({title: 'Bespoke Ring Sizing Consultation', primaryCategory: 'Sizing'});">
            Need Personal Sizing Assistance?
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  ringSizeModalDOM = backdrop;

  backdrop.querySelector('.size-guide-close').addEventListener('click', closeRingSizeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeRingSizeModal();
  });
}

export function openRingSizeModal() {
  if (!ringSizeModalDOM) createRingSizeModalDOM();
  ringSizeModalDOM.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeRingSizeModal() {
  if (!ringSizeModalDOM) return;
  ringSizeModalDOM.classList.remove('active');
  document.body.style.overflow = '';
}
