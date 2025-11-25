







document.addEventListener('DOMContentLoaded', () => {
  const openRoomsBtn = document.getElementById('open-rooms');
  const roomsSection = document.getElementById('rooms-section');
  const chevron = document.getElementById('rooms-chevron');
  const quickActionsContainer = document.getElementById('quick-actions');

  const DEVICE_STATE_PREFIX = 'smart-home-device-';
  const QUICK_ACTION_STORAGE_KEY = 'smart-home-quick-actions';
  const SNAPSHOT_STORAGE_KEY = 'smart-home-state-snapshot';
  const QUICK_ACTION_LIMIT = 5;

  const devicesConfig = [
    {
      id: 'living-room-light',
      location: 'Sala de Estar',
      action: 'Luz',
      featured: true,
      icon: 'lightbulb',
      iconClass: 'material-symbols-outlined text-xl text-yellow-400',
      group: 'salaEstar',
      stateKey: 'luz',
    },
    {
      id: 'bedroom1-lamp',
      location: 'Quarto 1',
      action: 'Lâmpada',
      featured: true,
      icon: 'lightbulb',
      iconClass: 'material-symbols-outlined text-xl text-yellow-400',
      group: 'quarto1',
      stateKey: 'lampada',
    },
    {
      id: 'bedroom1-bath',
      location: 'Quarto 1 - Banheiro',
      action: 'Luz Banheiro',
      icon: 'light',
      iconClass: 'material-symbols-outlined text-xl text-blue-400',
      group: 'quarto1Banheiro',
      stateKey: 'luzBanheiro',
    },
    {
      id: 'bedroom2-lamp',
      location: 'Quarto 2',
      action: 'Lâmpada',
      icon: 'lightbulb',
      iconClass: 'material-symbols-outlined text-xl text-yellow-400',
      group: 'quarto2',
      stateKey: 'lampada',
    },
    {
      id: 'kitchen-light',
      location: 'Cozinha',
      action: 'Luz',
      icon: 'lightbulb',
      iconClass: 'material-symbols-outlined text-xl text-red-400',
      group: 'cozinha',
      stateKey: 'luz',
    },
    {
      id: 'balcony-light',
      location: 'Varanda',
      action: 'Luz Varanda',
      icon: 'lightbulb_circle',
      iconClass: 'material-symbols-outlined text-xl text-green-500',
      group: 'varanda',
      stateKey: 'luz',
    },
    {
      id: 'garden-irrigation',
      location: 'Área Externa',
      action: 'Irrigação',
      featured: true,
      icon: 'water_drop',
      iconClass: 'material-symbols-outlined text-xl text-emerald-500',
      group: 'areaExterna',
      stateKey: 'irrigacao',
    },
    {
      id: 'exterior-lights',
      location: 'Área Externa',
      action: 'Luzes Externas',
      icon: 'outdoor_garden',
      iconClass: 'material-symbols-outlined text-xl text-amber-500',
      group: 'areaExterna',
      stateKey: 'luzesExternas',
    },
  ];

  const deviceMap = new Map(devicesConfig.map(device => [device.id, device]));
  const deviceButtons = new Map();

  // Ambientes toggle with animation
  if (openRoomsBtn && roomsSection && chevron) {
    openRoomsBtn.addEventListener('click', () => {
      const expanded = openRoomsBtn.getAttribute('aria-expanded') === 'true';
      openRoomsBtn.setAttribute('aria-expanded', String(!expanded));
      chevron.textContent = expanded ? 'keyboard_arrow_right' : 'keyboard_arrow_down';

      if (!expanded) {
        roomsSection.classList.remove('hidden');
        requestAnimationFrame(() => {
          roomsSection.classList.remove('opacity-0', 'translate-y-4');
          roomsSection.classList.add('opacity-100', 'translate-y-0');
        });
        roomsSection.focus();
      } else {
        roomsSection.classList.remove('opacity-100', 'translate-y-0');
        roomsSection.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => {
          roomsSection.classList.add('hidden');
        }, 500);
      }
    });
  }

  function getDeviceState(id) {
    return localStorage.getItem(`${DEVICE_STATE_PREFIX}${id}`) === 'true';
  }

  function setDeviceState(id, state) {
    localStorage.setItem(`${DEVICE_STATE_PREFIX}${id}`, state);
  }

  function applyStateToButton(button, isOn) {
    button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    const powerBg = button.querySelector('.power-bg');
    if (powerBg) {
      powerBg.classList.toggle('bg-green-500', isOn);
      powerBg.classList.toggle('bg-gray-300', !isOn);
    }
  }

  function updateDeviceUI(id, state = getDeviceState(id)) {
    const relatedButtons = deviceButtons.get(id);
    if (!relatedButtons) return;
    relatedButtons.forEach(button => applyStateToButton(button, state));
  }

  function registerButton(button) {
    const id = button.getAttribute('data-id');
    if (!id || !deviceMap.has(id)) return;

    if (!deviceButtons.has(id)) {
      deviceButtons.set(id, new Set());
    }

    const trackedButtons = deviceButtons.get(id);
    if (trackedButtons.has(button)) return;

    trackedButtons.add(button);
    button.addEventListener('click', () => handleToggle(id));
    updateDeviceUI(id);
  }

  function unregisterQuickActionButtons() {
    if (!quickActionsContainer) return;
    quickActionsContainer.querySelectorAll('[data-id]').forEach(button => {
      const id = button.getAttribute('data-id');
      const trackedButtons = deviceButtons.get(id);
      if (trackedButtons) {
        trackedButtons.delete(button);
      }
    });
  }

  function handleToggle(id) {
    const nextState = !getDeviceState(id);
    setDeviceState(id, nextState);
    updateDeviceUI(id, nextState);
    updateQuickActionsOrder(id, nextState);
    updateStateSnapshot();
  }

  function getDefaultQuickActions() {
    return devicesConfig
      .filter(device => device.featured)
      .map(device => device.id);
  }

  function getQuickActions() {
    const stored = localStorage.getItem(QUICK_ACTION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.filter(id => deviceMap.has(id));
      } catch (error) {
        console.warn('Erro ao ler ações rápidas salvas:', error);
      }
    }
    return getDefaultQuickActions();
  }

  function setQuickActions(list) {
    localStorage.setItem(QUICK_ACTION_STORAGE_KEY, JSON.stringify(list));
  }

  function updateQuickActionsOrder(id, isOn) {
    if (!deviceMap.has(id)) return;
    const current = getQuickActions();
    const filtered = current.filter(item => item !== id);
    if (isOn) {
      filtered.unshift(id);
    } else {
      filtered.push(id);
    }
    const limited = filtered.slice(0, QUICK_ACTION_LIMIT);
    const active = limited.filter(item => getDeviceState(item));
    const inactive = limited.filter(item => !getDeviceState(item));
    setQuickActions([...active, ...inactive]);
    renderQuickActions();
  }

  function buildStateSnapshot() {
    return devicesConfig.reduce((snapshot, device) => {
      const groupKey = device.group || 'geral';
      const actionKey = device.stateKey || device.id;
      if (!snapshot[groupKey]) {
        snapshot[groupKey] = {};
      }
      snapshot[groupKey][actionKey] = getDeviceState(device.id) ? 1 : 0;
      return snapshot;
    }, {});
  }

  function persistStateSnapshot(snapshot) {
    if (typeof window !== 'undefined') {
      window.smartHomeState = snapshot;
    }
    try {
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('Erro ao salvar snapshot do estado:', error);
    }
    document.dispatchEvent(new CustomEvent('smart-home-state-update', { detail: snapshot }));
  }

  function updateStateSnapshot() {
    persistStateSnapshot(buildStateSnapshot());
    console.log('Snapshot do estado atualizado:', window.smartHomeState);
    // resultado exemplo
    // {
    //   "salaEstar": {
    //     "luz": 0
    //   },
    //   "quarto1": {
    //     "lampada": 0
    //   },
    //   "quarto1Banheiro": {
    //     "luzBanheiro": 0
    //   },
    //   "quarto2": {
    //     "lampada": 0
    //   },
    //   "cozinha": {
    //     "luz": 0
    //   },
    //   "varanda": {
    //     "luz": 0
    //   },
    //   "areaExterna": {
    //     "irrigacao": 0,
    //     "luzesExternas": 1
    //   }
    // }
  }

  // funcao para renderizar as acoes rapidas e seus eventos
  function renderQuickActions() {
    if (!quickActionsContainer) return;

    unregisterQuickActionButtons();
    quickActionsContainer.innerHTML = '';

    const actions = getQuickActions();
    if (!actions.length) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'text-sm text-gray-500';
      emptyMessage.textContent = 'Nenhuma ação rápida configurada por enquanto.';
      quickActionsContainer.appendChild(emptyMessage);
      return;
    }

    actions.forEach(id => {
      const device = deviceMap.get(id);
      if (!device) return;

      const iconClass = device.iconClass || 'material-symbols-outlined text-xl text-gray-400';
      const iconName = device.icon || 'tune';

      const card = document.createElement('button');
      card.className = 'quick-action-card bg-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-400 light-toggle';
      card.dataset.id = id;
      card.setAttribute('aria-label', `Atalho para ${device.action} em ${device.location}`);
      card.setAttribute('role', 'listitem');

      card.innerHTML = `
        <span class="flex items-center gap-3">
          <span class="${iconClass}" aria-hidden="true">${iconName}</span>
          <span>
            <p class="text-xs uppercase tracking-wide text-gray-500">${device.location}</p>
            <p class="text-lg font-semibold text-gray-800">${device.action}</p>
          </span>
        </span>
        <span class="power-bg rounded-full p-2 bg-gray-300 transition-colors duration-200 ml-4">
          <span class="material-symbols-outlined text-2xl text-white" aria-hidden="true">power_settings_new</span>
        </span>
      `;

      quickActionsContainer.appendChild(card);
      registerButton(card);
    });
  }

  if (!localStorage.getItem(QUICK_ACTION_STORAGE_KEY)) {
    setQuickActions(getDefaultQuickActions());
  }

  document.querySelectorAll('.light-toggle').forEach(registerButton);
  renderQuickActions();
  updateStateSnapshot();
});