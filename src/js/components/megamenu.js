/**
 * Luxury Navigation Megamenu & Mobile Drawer
 * Gulshan Jewellers | Est. 1950
 */

export function initMegamenu() {
  const menuItemsWithSub = document.querySelectorAll('.nav-has-megamenu');

  menuItemsWithSub.forEach(item => {
    const trigger = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.megamenu-dropdown');

    if (!trigger || !dropdown) return;

    // Desktop hover & focus
    item.addEventListener('mouseenter', () => {
      dropdown.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
    });

    item.addEventListener('mouseleave', () => {
      dropdown.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
    });

    // Keyboard navigation
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dropdown.classList.toggle('active');
        trigger.setAttribute('aria-expanded', dropdown.classList.contains('active'));
      }
      if (e.key === 'Escape') {
        dropdown.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });
}
