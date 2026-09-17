/**
 * Mobile Navigation Drawer & Bottom Dock
 * Gulshan Jewellers | Est. 1950
 */

import { store } from '../state/store.js';
import { openSearchModal } from './searchModal.js';
import { openTrayDrawer } from './consultationTray.js';
import { openEnquiryModal } from '../main.js';

let mobileDrawerDOM = null;
let mobileDockDOM = null;

export function initMobileNav() {
  createMobileDrawerDOM();
  createMobileDockDOM();
  bindMobileHeaderToggles();
  updateDockActiveState();
}

/**
 * Creates and appends the luxury slide-over Mobile Navigation Drawer
 */
function createMobileDrawerDOM() {
  if (document.getElementById('mobile-menu-drawer')) return;

  const drawer = document.createElement('div');
  drawer.id = 'mobile-menu-drawer';
  drawer.className = 'mobile-drawer-backdrop';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Mobile Navigation');

  const currentCurrency = store.getCurrency();

  drawer.innerHTML = `
    <div class="mobile-drawer-panel">
      <!-- Header -->
      <div class="mobile-drawer-header">
        <a href="index.html" class="brand-logo" onclick="GJ.closeMobileDrawer()">
          <span class="brand-name" style="font-size: 1.3rem;">Gulshan Jewellers</span>
          <span class="brand-subline" style="font-size: 0.6rem;">Est. 1950 &middot; Heritage House</span>
        </a>
        <button type="button" class="mobile-drawer-close" id="mobile-drawer-close-btn" aria-label="Close menu">&times;</button>
      </div>

      <!-- Quick Action Utilities -->
      <div class="mobile-drawer-utility">
        <div class="mobile-currency-wrap">
          <label for="mobile-drawer-currency" class="mobile-util-label">Currency</label>
          <select id="mobile-drawer-currency" class="currency-selector" aria-label="Select Currency">
            <option value="INR" ${currentCurrency === 'INR' ? 'selected' : ''}>INR (₹)</option>
            <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
            <option value="AED" ${currentCurrency === 'AED' ? 'selected' : ''}>AED (د.إ)</option>
            <option value="GBP" ${currentCurrency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
            <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
          </select>
        </div>
        <button type="button" class="mobile-util-btn" id="mobile-drawer-search-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Search
        </button>
      </div>

      <!-- Nav Links & Accordion Groups -->
      <nav class="mobile-drawer-nav">
        <!-- Gemstones Group -->
        <div class="mobile-nav-group">
          <button type="button" class="mobile-group-trigger" aria-expanded="false">
            <span>Natural Gemstones</span>
            <span class="mobile-group-arrow">&plus;</span>
          </button>
          <div class="mobile-group-content">
            <a href="collections.html?gemstone=pukhraj" class="mobile-sublink" onclick="GJ.closeMobileDrawer()">
              <span class="gem-dot" style="background:#D4AF37;"></span> Yellow Sapphire (Pukhraj)
            </a>
            <a href="collections.html?gemstone=neelam" class="mobile-sublink" onclick="GJ.closeMobileDrawer()">
              <span class="gem-dot" style="background:#24497D;"></span> Blue Sapphire (Neelam)
            </a>
            <a href="collections.html?gemstone=emerald" class="mobile-sublink" onclick="GJ.closeMobileDrawer()">
              <span class="gem-dot" style="background:#1B5838;"></span> Colombian Emerald (Panna)
            </a>
            <a href="collections.html?gemstone=ruby" class="mobile-sublink" onclick="GJ.closeMobileDrawer()">
              <span class="gem-dot" style="background:#731A29;"></span> Natural Ruby (Manik)
            </a>
            <a href="collections.html?gemstone=kyanite" class="mobile-sublink" onclick="GJ.closeMobileDrawer()">
              <span class="gem-dot" style="background:#2E5584;"></span> Blue Kyanite (Accessible Alternative)
            </a>
            <a href="collections.html?category=gemstones" class="mobile-sublink view-all-link" onclick="GJ.closeMobileDrawer()">
              View All Certified Gemstones &rarr;
            </a>
          </div>
        </div>

        <!-- Fine Gold & Diamonds -->
        <div class="mobile-nav-group">
          <button type="button" class="mobile-group-trigger" aria-expanded="false">
            <span>Fine Gold & Diamonds</span>
            <span class="mobile-group-arrow">&plus;</span>
          </button>
          <div class="mobile-group-content">
            <a href="collections.html?category=gold" class="mobile-sublink" onclick="GJ.closeMobileDrawer()">22K & 18K Hallmarked Gold</a>
            <a href="collections.html?category=diamonds" class="mobile-sublink" onclick="GJ.closeMobileDrawer()">14K Everyday Natural Diamonds</a>
            <a href="collections.html?category=silver" class="mobile-sublink" onclick="GJ.closeMobileDrawer()">Handcrafted 925 Sterling Silver</a>
            <a href="collections.html" class="mobile-sublink view-all-link" onclick="GJ.closeMobileDrawer()">Browse All Creations &rarr;</a>
          </div>
        </div>

        <!-- Standalone Nav Items -->
        <a href="collections.html" class="mobile-main-link" onclick="GJ.closeMobileDrawer()">
          <span>Explore All Collections</span>
          <span class="link-arrow">&rarr;</span>
        </a>

        <a href="gemstone-guide.html" class="mobile-main-link" onclick="GJ.closeMobileDrawer()">
          <span>The Gemstone Guide</span>
          <span class="badge-mini">6 Foundations</span>
        </a>

        <a href="bespoke.html" class="mobile-main-link" onclick="GJ.closeMobileDrawer()">
          <span>Bespoke Commission</span>
          <span class="badge-mini">Heirloom</span>
        </a>

        <a href="about.html" class="mobile-main-link" onclick="GJ.closeMobileDrawer()">
          <span>Our Ethos & Heritage</span>
        </a>

        <a href="contact.html" class="mobile-main-link" onclick="GJ.closeMobileDrawer()">
          <span>Boutique & Concierge</span>
        </a>
      </nav>

      <!-- Footer CTA -->
      <div class="mobile-drawer-footer">
        <a href="https://wa.me/919876543210?text=Hello%20Gulshan%20Jewellers,%20I%20would%20like%20to%20consult%20on%20natural%20gemstones%20and%20bespoke%20jewellery." 
           target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="width: 100%; justify-content: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
          </svg>
          Chat with Senior Gemmologist
        </a>
        <div class="mobile-heritage-tag">
          100% Earth-Mined &middot; BIS Hallmarked &middot; Est. 1950
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(drawer);
  mobileDrawerDOM = drawer;

  // Bind Close Buttons
  const closeBtn = drawer.querySelector('#mobile-drawer-close-btn');
  closeBtn.addEventListener('click', closeMobileDrawer);
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) closeMobileDrawer();
  });

  // Bind Mobile Currency
  const currSelect = drawer.querySelector('#mobile-drawer-currency');
  currSelect.addEventListener('change', (e) => {
    store.setCurrency(e.target.value);
  });
  store.subscribe('currency', (curr) => {
    currSelect.value = curr;
  });

  // Bind Drawer Search
  drawer.querySelector('#mobile-drawer-search-btn').addEventListener('click', () => {
    closeMobileDrawer();
    openSearchModal();
  });

  // Bind Accordion Groups
  drawer.querySelectorAll('.mobile-group-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.parentElement;
      const isOpen = parent.classList.contains('open');
      
      // Close sibling groups for neatness
      drawer.querySelectorAll('.mobile-nav-group').forEach(grp => {
        grp.classList.remove('open');
        grp.querySelector('.mobile-group-trigger')?.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        parent.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/**
 * Injects the fixed App-like Mobile Bottom Dock Navigation
 */
function createMobileDockDOM() {
  if (document.getElementById('mobile-bottom-dock')) return;

  const dock = document.createElement('nav');
  dock.id = 'mobile-bottom-dock';
  dock.className = 'mobile-bottom-dock';
  dock.setAttribute('aria-label', 'Mobile Dock Navigation');

  const trayCount = store.getTray().length;

  dock.innerHTML = `
    <a href="index.html" class="mobile-dock-item" data-page="home">
      <svg class="mobile-dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <span class="mobile-dock-label">Home</span>
    </a>

    <a href="collections.html" class="mobile-dock-item" data-page="collections">
      <svg class="mobile-dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
      <span class="mobile-dock-label">Catalogue</span>
    </a>

    <button type="button" class="mobile-dock-item" id="mobile-dock-search-btn">
      <svg class="mobile-dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <span class="mobile-dock-label">Search</span>
    </button>

    <button type="button" class="mobile-dock-item mobile-dock-tray" id="mobile-dock-tray-btn">
      <div class="dock-tray-wrap">
        <svg class="mobile-dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="7"></circle>
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3"></path>
        </svg>
        <span class="tray-counter-pill" style="${trayCount > 0 ? 'display:inline-flex;' : 'display:none;'}">${trayCount}</span>
      </div>
      <span class="mobile-dock-label">My Tray</span>
    </button>

    <button type="button" class="mobile-dock-item mobile-dock-wa" id="mobile-dock-concierge-btn">
      <svg class="mobile-dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="mobile-dock-label">Concierge</span>
    </button>
  `;

  document.body.appendChild(dock);
  mobileDockDOM = dock;

  // Dock button actions
  dock.querySelector('#mobile-dock-search-btn').addEventListener('click', () => {
    openSearchModal();
  });

  dock.querySelector('#mobile-dock-tray-btn').addEventListener('click', () => {
    openTrayDrawer();
  });

  dock.querySelector('#mobile-dock-concierge-btn').addEventListener('click', () => {
    openEnquiryModal({
      title: 'Personal Jewellery Consultation',
      primaryCategory: 'General Boutique Enquiry'
    });
  });
}

/**
 * Highlights the active icon in the bottom dock
 */
function updateDockActiveState() {
  if (!mobileDockDOM) return;
  const path = window.location.pathname;
  const items = mobileDockDOM.querySelectorAll('.mobile-dock-item');
  items.forEach(item => {
    item.classList.remove('active');
    const page = item.getAttribute('data-page');
    if (page === 'home' && (path.endsWith('index.html') || path === '/' || path.endsWith('/'))) {
      item.classList.add('active');
    } else if (page === 'collections' && path.includes('collections.html')) {
      item.classList.add('active');
    }
  });
}

/**
 * Links hamburger toggle buttons in the header to open the slide drawer
 */
function bindMobileHeaderToggles() {
  const toggles = document.querySelectorAll('.mobile-nav-toggle');
  toggles.forEach(toggle => {
    // Remove old inline listeners if any by cloning or replacing
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      openMobileDrawer();
    });
  });
}

export function openMobileDrawer() {
  if (!mobileDrawerDOM) createMobileDrawerDOM();
  mobileDrawerDOM.classList.add('active');
  document.body.classList.add('mobile-nav-active');
  document.body.style.overflow = 'hidden';
}

export function closeMobileDrawer() {
  if (!mobileDrawerDOM) return;
  mobileDrawerDOM.classList.remove('active');
  document.body.classList.remove('mobile-nav-active');
  document.body.style.overflow = '';
}
