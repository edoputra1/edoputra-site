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


  const words = [
    'EDO SEPTIYAN PUTRA ',
    'PRODUCT DESIGNER ',
    'AI-FIRST ',
    '(SEASONED) HELLDIVER '
  ];

  const typeTarget = document.getElementById('typewriter');
  const cursor = '—';

  if (typeTarget) {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typingSpeed = 90;
    const deletingSpeed = 20;
    const holdAfterType = 3000;

    function typeLoop() {
      const currentWord = words[wordIndex];

      if (!isDeleting) {
        charIndex++;
      } else {
        charIndex--;
      }

      typeTarget.textContent =
        currentWord.slice(0, charIndex) + cursor;

      if (!isDeleting && charIndex === currentWord.length) {
        setTimeout(() => (isDeleting = true), holdAfterType);
      }

      if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }

      setTimeout(
        typeLoop,
        isDeleting ? deletingSpeed : typingSpeed
      );
    }

    typeLoop();
  }


  const originalTitle = document.title; // save original
  const messages = [
    "Wait, don't go!",
    "I'll be here — waiting",
    "Browsing, eh?",
    "Big Brother is watching"
  ];
  let msgIndex = 0;
  let blinkInterval;

  function blinkTitleOnce(tempTitle, duration = 800) {
    let visible = true;
    blinkInterval = setInterval(() => {
      document.title = visible ? tempTitle : " ";
      visible = !visible;
    }, 200);

    // stop blinking after duration
    setTimeout(() => {
      clearInterval(blinkInterval);
      document.title = originalTitle;
    }, duration);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // user switched tab → change title to funny message
      document.title = messages[msgIndex % messages.length];
      msgIndex++;
    } else {
      // user returned → optional blink effect
      blinkTitleOnce(originalTitle);
    }
  });


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