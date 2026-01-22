document.addEventListener('DOMContentLoaded', () => {
  const isDesktop = () => window.innerWidth > 700;


  if (isDesktop()) {
    function updateClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(Math.floor(now.getMilliseconds() / 100));

      const clockElement = document.getElementById('clock');
      if (clockElement) {
        requestAnimationFrame(() => {
          clockElement.textContent = `— H${hours} M${minutes} S${seconds}.${milliseconds}`;
        });
      }
    }

    updateClock();
    setInterval(updateClock, 100);
  }


  const words = [
    'EDO SEPTIYAN PUTRA ',
    'PRODUCT DESIGNER ',
    'AI-FIRST ',
    '(SEASONED) HELLDIVER '
  ];

  const typeTarget = document.getElementById('typewriter');
  const cursor = '—';

  if (typeTarget && isDesktop()) {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typingSpeed = 90;
    const deletingSpeed = 20;
    const holdAfterType = 3000;

    function typeLoop() {
      const currentWord = words[wordIndex];

      if (!isDeleting) charIndex++;
      else charIndex--;

      requestAnimationFrame(() => {
        typeTarget.textContent = currentWord.slice(0, charIndex) + cursor;
      });

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


  if (isDesktop()) {
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


  document.querySelectorAll('.cta-animated').forEach(cta => {
    const textEl = cta.querySelector('.cta-text');
    if (!textEl) return;

    const text = textEl.textContent.trim();

    const letters = [...text]
      .map((char, i) =>
        `<span style="--i:${i}">${char === ' ' ? '&nbsp;' : char}</span>`
      )
      .join('');

    const arrowSVG = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 17L17 7M17 7H7M17 7V17"
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;

    textEl.innerHTML = `
      <span class="frame">
        <span class="sizer">${text}</span>
        <span class="text original">${letters}</span>
        <span class="text hover">${letters}</span>
      </span>
    `;

    const arrow = document.createElement('span');
    arrow.className = 'cta-arrow';
    arrow.innerHTML = arrowSVG;
    cta.appendChild(arrow);

    if (isDesktop()) {
    }
  });


  document.querySelectorAll('.nav-animated').forEach(link => {
    const text = link.textContent.trim();

    const letters = [...text].map((char, i) =>
      `<span style="--i:${i}">${char === ' ' ? '&nbsp;' : char}</span>`
    ).join('');

    const chevronSVG = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;

    link.innerHTML = `
      <span class="frame">
        <span class="sizer">${text}</span>
        <span class="text original">${letters}</span>
        <span class="text hover">${letters}</span>
      </span>

      <span class="nav-chevron">
        <span class="chevron-original">${chevronSVG}</span>
        <span class="chevron-hover">${chevronSVG}</span>
      </span>
    `;

    if (isDesktop()) {
    }
  });


  const allSVGs = [
  'ep01.svg','ep02.svg','ep03.svg','ep04.svg','ep05.svg',
  'ep06.svg','ep07.svg','ep08.svg','ep09.svg','ep10.svg',
  'ep11.svg','ep12.svg','ep13.svg','ep14.svg','ep15.svg'
  ];

  const preloadPromises = allSVGs.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(src);
      img.src = `assets/svgs/${src}`;
    });
  });

  const normalSlots = {
    slotC: 250
  };

  function getRandomSVG() {
    const index = Math.floor(Math.random() * allSVGs.length);
    return allSVGs[index];
  }

  // Start cycling after preload
  Promise.all(preloadPromises)
    .then(() => {
    console.log('All SVGs loaded successfully');
    
    Object.entries(normalSlots).forEach(([slotId, interval]) => {
      const container = document.getElementById(slotId);
      if (!container) return;

      const img = document.createElement('img');
      img.width = 128;
      img.height = 128;
      img.alt = '';
      img.src = `assets/svgs/${getRandomSVG()}`;
      container.appendChild(img);

      setInterval(() => {
        img.src = `assets/svgs/${getRandomSVG()}`;
      }, interval);
    });
    
    // Handle slotA
    const slotA = document.getElementById('slotA');
    if (slotA) {
      const img = document.createElement('img');
      img.width = 128;
      img.height = 128;
      img.alt = '';
      img.src = `assets/svgs/${getRandomSVG()}`;
      slotA.appendChild(img);

      let currentInterval = 70;
      let intervalId;

      const startInterval = (speed) => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          img.src = `assets/svgs/${getRandomSVG()}`;
        }, speed);
      };
      startInterval(70);

      setInterval(() => {
        currentInterval = currentInterval === 70 ? 300 : 70;
        startInterval(currentInterval);
        console.log(`SlotA speed: ${currentInterval}ms`);
      }, 3000);
    }

    // Handle slotB
    const slotB = document.getElementById('slotB');
    if (slotB) {
      const img = document.createElement('img');
      img.width = 128;
      img.height = 128;
      img.alt = '';
      img.src = `assets/svgs/${getRandomSVG()}`;
      slotB.appendChild(img);

      let currentInterval = 400;
      let intervalId;

      const startInterval = (speed) => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          img.src = `assets/svgs/${getRandomSVG()}`;
        }, speed);
      };
      startInterval(400);

      setInterval(() => {
        currentInterval = currentInterval === 400 ? 800 : 400;
        startInterval(currentInterval);
        console.log(`SlotB speed: ${currentInterval}ms`);
      }, 2000);
    }
  })

  .catch(err => {
    console.error('Failed to load some SVGs:', err);
  });

  
  setTimeout(() => {
    const originalTitle = document.title;
    const messages = [
      "Wait, don't go!",
      "I'll be here — waiting",
      "Browsing, eh?",
      "Big Brother is watching"
    ];
    let msgIndex = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.title = messages[msgIndex % messages.length];
        msgIndex++;
      } else {
        document.title = originalTitle;
      }
    });
  }, 0);
});