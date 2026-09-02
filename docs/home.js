(() => {
  const root = document.documentElement;
  const panel = document.querySelector('#settings-panel');
  const openButton = document.querySelector('#settings-trigger');
  const closeButton = panel?.querySelector('.settings-panel__close');
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
  const sizeButtons = [...document.querySelectorAll('[data-size-choice]')];
  const themeColor = document.querySelector('#theme-color');
  const preferenceStatus = document.querySelector('#preference-status');
  const canvas = document.querySelector('#floppy-canvas');
  const workspace = document.querySelector('.workspace');
  const shortcutModifierLabels = [...document.querySelectorAll('[data-shortcut-modifier]')];

  if (!panel || !openButton || !closeButton) {
    return;
  }

  const isApplePlatform = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  shortcutModifierLabels.forEach((label) => {
    label.textContent = isApplePlatform ? '⌥' : 'Alt';
  });

  const initCanvas = () => {
    const context = canvas?.getContext('2d');
    if (!canvas || !workspace || !context) {
      return;
    }

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const points = [];
    let reduceMotion = motionPreference.matches;
    let isVisible = true;
    let isAnimating = false;
    let width = 0;
    let height = 0;
    let frame = 0;
    let phase = 0;

    const shouldAnimate = () => !reduceMotion && isVisible && !document.hidden;

    const stop = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      isAnimating = false;
    };

    const start = () => {
      if (!shouldAnimate() || isAnimating) {
        return;
      }

      isAnimating = true;
      frame = window.requestAnimationFrame(draw);
    };

    const resize = () => {
      const bounds = workspace.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const desiredCount = Math.min(180, Math.max(90, Math.round((width * height) / 7600)));
      while (points.length < desiredCount) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.5 + Math.random() * 1.5,
          velocityX: (Math.random() - 0.5) * 0.18,
          velocityY: (Math.random() - 0.5) * 0.18,
          alpha: 0.15 + Math.random() * 0.45,
        });
      }
      points.length = desiredCount;
    };

    const draw = () => {
      phase += 0.005;
      context.clearRect(0, 0, width, height);

      points.forEach((point) => {
        if (!reduceMotion) {
          point.x = (point.x + point.velocityX + width) % width;
          point.y = (point.y + point.velocityY + height) % height;
        }

        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(58,159,223,${point.alpha})`;
        context.fill();
      });

      const orbitX = width * (window.innerWidth <= 900 ? 0.5 : 0.54);
      const orbitY = height * (window.innerWidth <= 900 ? 0.39 : 0.49);
      const baseRadius = Math.min(width, height);

      [0.16, 0.25, 0.36, 0.48].forEach((ratio, index) => {
        context.beginPath();
        context.arc(orbitX, orbitY, baseRadius * ratio, 0, Math.PI * 2);
        context.strokeStyle = `rgba(60,100,160,${0.035 + 0.02 * Math.sin(phase * 0.5 + index)})`;
        context.lineWidth = 1;
        context.stroke();
      });

      if (shouldAnimate()) {
        isAnimating = true;
        frame = window.requestAnimationFrame(draw);
      } else {
        isAnimating = false;
        frame = 0;
      }
    };

    resize();
    draw();

    const handleResize = () => {
      resize();
      if (reduceMotion || !isAnimating) {
        draw();
      }
    };

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(workspace);
    } else {
      window.addEventListener('resize', handleResize);
    }

    if ('IntersectionObserver' in window) {
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          start();
        } else {
          stop();
        }
      });
      intersectionObserver.observe(workspace);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    motionPreference.addEventListener('change', (event) => {
      reduceMotion = event.matches;
      stop();
      draw();
    });
  };

  const savePreference = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // The controls still work for the current visit without storage.
    }
  };

  const announce = (message) => {
    if (!preferenceStatus) {
      return;
    }

    preferenceStatus.textContent = '';
    window.requestAnimationFrame(() => {
      preferenceStatus.textContent = message;
    });
  };

  const setPressedState = (buttons, selectedValue, dataKey) => {
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset[dataKey] === selectedValue));
    });
  };

  const applyTheme = (theme, shouldAnnounce = false) => {
    if (theme !== 'light' && theme !== 'dark') {
      return;
    }

    root.dataset.theme = theme;
    setPressedState(themeButtons, theme, 'themeChoice');
    savePreference('floppy-theme', theme);

    if (themeColor) {
      themeColor.content = theme === 'dark' ? '#05070d' : '#f2f5f8';
    }

    if (shouldAnnounce) {
      announce(`${theme[0].toUpperCase()}${theme.slice(1)} mode selected.`);
    }
  };

  const applyTextSize = (size, shouldAnnounce = false) => {
    if (!['small', 'medium', 'large'].includes(size)) {
      return;
    }

    root.dataset.textSize = size;
    setPressedState(sizeButtons, size, 'sizeChoice');
    savePreference('floppy-text-size', size);

    if (shouldAnnounce) {
      announce(`${size[0].toUpperCase()}${size.slice(1)} text selected.`);
    }
  };

  const openPanel = () => {
    panel.removeAttribute('inert');
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('is-open');
    openButton.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  };

  const closePanel = ({ restoreFocus = true } = {}) => {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      openButton.focus();
    }
    panel.setAttribute('inert', '');
  };

  openButton.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeButton.addEventListener('click', closePanel);

  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      return;
    }

    const controls = [...panel.querySelectorAll('button:not([disabled])')];
    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];
    const leavingBackward = event.shiftKey && document.activeElement === firstControl;
    const leavingForward = !event.shiftKey && document.activeElement === lastControl;

    if (leavingBackward || leavingForward) {
      event.preventDefault();
      closePanel();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) {
      event.preventDefault();
      closePanel();
    }
  });

  const shortcutTargets = new Map([
    ['Digit0', document.querySelector('#home-link')],
    ['Digit1', document.querySelector('#millenium-link')],
    ['Digit2', document.querySelector('#z-mode-link')],
    ['KeyU', document.querySelector('#updates-link')],
    ['KeyI', document.querySelector('#install-link')],
    ['KeyG', openButton],
  ]);
  const fallbackShortcutCodes = {
    '0': 'Digit0',
    '1': 'Digit1',
    '2': 'Digit2',
    u: 'KeyU',
    i: 'KeyI',
    g: 'KeyG',
  };

  const isEditableTarget = (target) => target instanceof Element && (
    target.matches('input, textarea, select') || target.isContentEditable
  );

  const activateShortcut = (target) => {
    if (!target) {
      return;
    }

    if (target === openButton) {
      openButton.click();
      return;
    }

    if (panel.classList.contains('is-open')) {
      target.focus({ preventScroll: true });
      closePanel({ restoreFocus: false });
    }

    const href = target.getAttribute('href');
    target.click();

    if (href?.startsWith('#')) {
      window.requestAnimationFrame(() => {
        document.querySelector(href)?.querySelector('h1, h2, h3, [tabindex="-1"]')?.focus({ preventScroll: true });
      });
    }
  };

  document.addEventListener('keydown', (event) => {
    if (
      event.defaultPrevented
      || event.repeat
      || event.isComposing
      || !event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
      || isEditableTarget(event.target)
    ) {
      return;
    }

    const fallbackCode = fallbackShortcutCodes[event.key?.toLowerCase()];
    const target = shortcutTargets.get(event.code) || shortcutTargets.get(fallbackCode);
    if (!target) {
      return;
    }

    event.preventDefault();
    activateShortcut(target);
  });

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice, true));
  });

  sizeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTextSize(button.dataset.sizeChoice, true));
  });

  applyTheme(root.dataset.theme);
  applyTextSize(root.dataset.textSize);
  initCanvas();
})();
