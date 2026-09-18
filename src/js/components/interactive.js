/**
 * Interactive Components & Luxury Micro-features
 * Gulshan Jewellers | Est. 1950
 *
 * 1. Before/After Split Comparison Slider with Viewport Auto-Sweep
 * 2. Gemstone Classification Grid Ambient Glow & 3D Micro-tilt
 * 3. Bespoke Journey Sequential Stepper with Live Stage Switcher
 * 4. Pill-based Sub-Navigation with Drag-to-Scroll & Gradient Masks
 */

export function initInteractiveFeatures() {
  initComparisonSlider();
  initGemstoneGlow();
  initBespokeStepper();
  initPillTabsDrag();
}

/* --------------------------------------------------------------------------
   1. Interactive Before / After Split Slider
   -------------------------------------------------------------------------- */
export function initComparisonSlider() {
  const containers = document.querySelectorAll('.slider-comparison-box');
  if (!containers.length) return;

  containers.forEach(container => {
    const slider = container.querySelector('.slider-range-input');
    const overlay = container.querySelector('.slider-overlay-wrap');
    const handle = container.querySelector('.slider-handle-button');
    if (!slider || !overlay) return;

    let hasAutoSwept = false;
    let isUserInteracting = false;

    function setPosition(val) {
      const clamped = Math.max(0, Math.min(100, val));
      overlay.style.width = `${clamped}%`;
      if (handle) {
        handle.style.left = `${clamped}%`;
      }
      if (slider) {
        slider.value = clamped;
      }
    }

    // Input range listener
    slider.addEventListener('input', (e) => {
      isUserInteracting = true;
      overlay.classList.remove('animating');
      setPosition(parseFloat(e.target.value));
    });

    slider.addEventListener('change', () => {
      isUserInteracting = true;
      overlay.classList.remove('animating');
    });

    // Pointer / Touch drag support
    let isDragging = false;

    function handlePointerMove(e) {
      if (!isDragging) return;
      isUserInteracting = true;
      overlay.classList.remove('animating');
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const pos = ((clientX - rect.left) / rect.width) * 100;
      setPosition(pos);
    }

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      handlePointerMove(e);
    });

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch support
    container.addEventListener('touchstart', (e) => {
      isDragging = true;
      handlePointerMove(e);
    }, { passive: true });

    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Auto-sweep on initial viewport entry
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAutoSwept && !isUserInteracting) {
            hasAutoSwept = true;
            observer.disconnect();

            // Run smooth auto-sweep sequence
            overlay.classList.add('animating');
            if (handle) handle.style.transition = 'left 0.85s cubic-bezier(0.16, 1, 0.3, 1)';

            setTimeout(() => {
              if (isUserInteracting) return;
              setPosition(25);

              setTimeout(() => {
                if (isUserInteracting) return;
                setPosition(75);

                setTimeout(() => {
                  if (isUserInteracting) return;
                  setPosition(50);

                  setTimeout(() => {
                    overlay.classList.remove('animating');
                    if (handle) handle.style.transition = '';
                  }, 850);
                }, 900);
              }, 900);
            }, 500);
          }
        });
      }, { threshold: 0.35 });

      observer.observe(container);
    }
  });
}

/* --------------------------------------------------------------------------
   2. Gemstone Classification Grid Ambient Glow & Micro-Tilt
   -------------------------------------------------------------------------- */
export function initGemstoneGlow() {
  const cards = document.querySelectorAll('.gem-card');
  if (!cards.length) return;

  const glowColors = {
    pukhraj: 'rgba(212, 175, 55, 0.45)',
    neelam: 'rgba(36, 73, 125, 0.65)',
    emerald: 'rgba(27, 88, 56, 0.65)',
    ruby: 'rgba(140, 29, 47, 0.65)',
    kyanite: 'rgba(44, 77, 117, 0.55)'
  };

  cards.forEach(card => {
    // Determine gem type from style attribute or href
    const href = card.getAttribute('href') || '';
    let gemKey = 'pukhraj';
    if (href.includes('neelam')) gemKey = 'neelam';
    else if (href.includes('emerald')) gemKey = 'emerald';
    else if (href.includes('ruby')) gemKey = 'ruby';
    else if (href.includes('kyanite')) gemKey = 'kyanite';

    card.style.setProperty('--gem-glow', glowColors[gemKey]);

    // Subtle 3D card tilt on hover
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const tiltX = (y / (rect.height / 2)) * -4;
      const tiltY = (x / (rect.width / 2)) * 4;
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* --------------------------------------------------------------------------
   3. Bespoke Process Sequential Stepper
   -------------------------------------------------------------------------- */
export function initBespokeStepper() {
  const stepperContainer = document.querySelector('.bespoke-split-banner');
  if (!stepperContainer) return;

  const steps = stepperContainer.querySelectorAll('.bespoke-step-item');
  const progressBar = stepperContainer.querySelector('.bespoke-timeline-progress');
  const bannerImage = stepperContainer.querySelector('#bespoke-stepper-img');
  const stageBadge = stepperContainer.querySelector('#bespoke-stage-badge');
  const previewTitle = stepperContainer.querySelector('#bespoke-preview-title');
  const previewDesc = stepperContainer.querySelector('#bespoke-preview-desc');

  if (!steps.length) return;

  const stepsData = [
    {
      num: '01',
      stage: 'Phase I · Creative Dialogue',
      title: '01 · Share Your Vision',
      desc: 'Discuss personal milestones, astrological recommendations, or family heirloom designs. Transparent consultation around your aesthetic taste and budget.',
      image: '/images/bespoke-workshop.jpg'
    },
    {
      num: '02',
      stage: 'Phase II · Gemstone Inspection',
      title: '02 · Stone Selection',
      desc: 'Examine certified natural earth-mined gems with complete thermal and clarity treatment disclosure. We evaluate light reflection, cut, and color saturation.',
      image: '/images/loose-sapphire.jpg'
    },
    {
      num: '03',
      stage: 'Phase III · Artisan Rendering',
      title: '03 · Approve Bespoke Design',
      desc: 'Review 3D wax renderings, claw vs bezel mountings, and comfortable ergonomic proportions prior to solid 22K/18K gold or sterling silver casting.',
      image: '/images/gold-solitaire.jpg'
    },
    {
      num: '04',
      stage: 'Phase IV · Heirloom Handover',
      title: '04 · Heirloom Finish',
      desc: 'Hand-forged by master karigars, hand-burnished, stamped with verified government BIS hallmarks, and presented with accredited laboratory certificates.',
      image: '/images/pukhraj-hero.jpg'
    }
  ];

  function activateStep(index) {
    steps.forEach((step, idx) => {
      if (idx === index) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    // Update progress bar
    if (progressBar) {
      const percentage = ((index + 1) / steps.length) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    const data = stepsData[index];
    if (!data) return;

    if (stageBadge) stageBadge.textContent = data.stage;
    if (previewTitle) previewTitle.textContent = data.title;
    if (previewDesc) previewDesc.textContent = data.desc;

    if (bannerImage && data.image) {
      bannerImage.style.opacity = '0.4';
      setTimeout(() => {
        bannerImage.src = data.image;
        bannerImage.style.opacity = '1';
      }, 200);
    }
  }

  steps.forEach((step, idx) => {
    step.addEventListener('click', () => {
      activateStep(idx);
    });
  });
}

/* --------------------------------------------------------------------------
   4. Pill-Based Sub-Navigation with Drag-to-Scroll & Gradient Mask Fades
   -------------------------------------------------------------------------- */
export function initPillTabsDrag() {
  const tabContainers = document.querySelectorAll('.guide-nav-bar-container');
  if (!tabContainers.length) return;

  tabContainers.forEach(container => {
    const scrollBox = container.querySelector('.guide-nav-links');
    if (!scrollBox) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    // Update gradient edge mask visibility based on scroll position
    function updateMasks() {
      const maxScroll = scrollBox.scrollWidth - scrollBox.clientWidth;
      if (maxScroll <= 0) {
        container.classList.add('hide-left-mask', 'hide-right-mask');
        return;
      }
      if (scrollBox.scrollLeft <= 5) {
        container.classList.add('hide-left-mask');
      } else {
        container.classList.remove('hide-left-mask');
      }

      if (scrollBox.scrollLeft >= maxScroll - 5) {
        container.classList.add('hide-right-mask');
      } else {
        container.classList.remove('hide-right-mask');
      }
    }

    scrollBox.addEventListener('scroll', updateMasks, { passive: true });
    window.addEventListener('resize', updateMasks);
    updateMasks();

    // Mouse drag scrolling
    scrollBox.addEventListener('mousedown', (e) => {
      isDown = true;
      isDragging = false;
      scrollBox.classList.add('dragging');
      startX = e.pageX - scrollBox.offsetLeft;
      scrollLeft = scrollBox.scrollLeft;
    });

    scrollBox.addEventListener('mouseleave', () => {
      isDown = false;
      scrollBox.classList.remove('dragging');
    });

    scrollBox.addEventListener('mouseup', () => {
      isDown = false;
      scrollBox.classList.remove('dragging');
    });

    scrollBox.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollBox.offsetLeft;
      const walk = (x - startX) * 1.6;
      if (Math.abs(walk) > 5) isDragging = true;
      scrollBox.scrollLeft = scrollLeft - walk;
    });

    // Prevent click on drag
    scrollBox.querySelectorAll('.guide-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      });
    });
  });
}
