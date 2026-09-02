(() => {
  const root = document.documentElement;
  const panel = document.querySelector('#settings-panel');
  const openButton = document.querySelector('#settings-trigger');
  const closeButton = panel?.querySelector('.settings-panel__close');
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
  const sizeButtons = [...document.querySelectorAll('[data-size-choice]')];
  const themeColor = document.querySelector('#theme-color');
  const preferenceStatus = document.querySelector('#preference-status');

  if (!panel || !openButton || !closeButton) {
    return;
  }

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
      themeColor.content = theme === 'dark' ? '#04060a' : '#f3f5f8';
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
    if (typeof panel.showModal === 'function') {
      panel.showModal();
    } else {
      panel.setAttribute('open', '');
    }

    openButton.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  };

  const closePanel = () => {
    if (typeof panel.close === 'function') {
      panel.close();
    } else {
      panel.removeAttribute('open');
      openButton.setAttribute('aria-expanded', 'false');
      openButton.focus();
    }
  };

  openButton.addEventListener('click', () => {
    if (panel.open) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeButton.addEventListener('click', closePanel);

  panel.addEventListener('close', () => {
    openButton.setAttribute('aria-expanded', 'false');
    openButton.focus();
  });

  panel.addEventListener('click', (event) => {
    if (event.target !== panel) {
      return;
    }

    const bounds = panel.getBoundingClientRect();
    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (clickedOutside) {
      closePanel();
    }
  });

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice, true));
  });

  sizeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTextSize(button.dataset.sizeChoice, true));
  });

  applyTheme(root.dataset.theme);
  applyTextSize(root.dataset.textSize);
})();
