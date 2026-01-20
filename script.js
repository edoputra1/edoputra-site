document.addEventListener('DOMContentLoaded', () => {
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(Math.floor(now.getMilliseconds() / 100));
    
    const clockElement = document.getElementById('clock');
    if (clockElement) {
      clockElement.textContent = `— H${hours} M${minutes} S${seconds}.${milliseconds}`;
    }
  }

  updateClock();
  setInterval(updateClock, 100);

  if (window.innerWidth > 700) {
    window.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        window.scrollBy({
          left: e.deltaY,
          behavior: 'auto'
        });
      }
    }, { passive: false });
  }

  document.querySelectorAll('.animated-btn').forEach(btn => {
    const text = btn.textContent.trim();
    const letters = [...text].map((char, i) =>
      `<span style="--i:${i}">${char === ' ' ? '&nbsp;' : char}</span>`
    ).join('');
    
    const chevronSVG = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    btn.innerHTML = `
      <span class="frame">
        <span class="sizer">${text}</span>
        <span class="text original">${letters}</span>
        <span class="text hover">${letters}</span>
      </span>
      <span class="chevron-frame">
        <span class="chevron-icon chevron-original">${chevronSVG}</span>
        <span class="chevron-icon chevron-hover">${chevronSVG}</span>
      </span>
    `;
  });
});