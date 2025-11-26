







document.addEventListener('DOMContentLoaded', () => {
  const openRoomsBtn = document.getElementById('open-rooms');
  const roomsSection = document.getElementById('rooms-section');
  const chevron = document.getElementById('rooms-chevron');
  const quickActionsContainer = document.getElementById('quick-actions');
  const loadingOverlay = document.getElementById('loading-overlay');
  const openNightRoutineBtn = document.getElementById('open-night-routine');
  const nightRoutineModal = document.getElementById('night-routine-modal');
  const nightRoutineBackdrop = document.getElementById('night-routine-backdrop');
  const closeNightRoutineBtn = document.getElementById('close-night-routine');
  const nightRoutineToggle = document.getElementById('night-routine-toggle');
  const nightRoutinePanelToggle = document.getElementById('night-routine-panel-toggle');
  const nightRoutinePanel = document.getElementById('night-routine-panel');
  const nightRoutineSettings = document.getElementById('night-routine-settings');
  const nightRoutineTimeInput = document.getElementById('night-routine-time');
  const nightRoutineActionSelect = document.getElementById('night-routine-action');
  const nightRoutineSummary = document.getElementById('night-routine-summary');
  const nightRoutineDeviceList = document.getElementById('night-routine-device-list');
  const nightRoutineSaveBtn = document.getElementById('night-routine-save');
  let nightRoutineRoomInputs = [];

  const DEVICE_STATE_PREFIX = 'smart-home-device-';
  const QUICK_ACTION_STORAGE_KEY = 'smart-home-quick-actions';
  const SNAPSHOT_STORAGE_KEY = 'smart-home-state-snapshot';
  const QUICK_ACTION_LIMIT = 5;
  const NIGHT_ROUTINE_ENABLED_KEY = 'smart-home-night-enabled';
  const NIGHT_ROUTINE_TIME_KEY = 'smart-home-night-time';
  const NIGHT_ROUTINE_ACTION_KEY = 'smart-home-night-action';
  const NIGHT_ROUTINE_ROOMS_KEY = 'smart-home-night-rooms';
  let lastFocusedTrigger = null;

  // Configuracoes dos dispositivos com id html, icones, etc
  const devicesConfig = [
    {
      id: 'living-room-light',
      location: 'Sala de Estar',
      action: 'Luz',
      featured: true,
      icon: 'lightbulb',
      iconClass: 'material-symbols-outlined text-xl text-yellow-400',
      group: 'salaEstar',
      groupLabel: 'Sala de Estar',
      zone: 'interno',
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
      groupLabel: 'Quarto 1',
      zone: 'interno',
      stateKey: 'lampada',
    },
    {
      id: 'bedroom1-bath',
      location: 'Quarto 1 - Banheiro',
      action: 'Luz Banheiro',
      icon: 'light',
      iconClass: 'material-symbols-outlined text-xl text-blue-400',
      group: 'quarto1',
      groupLabel: 'Quarto 1',
      zone: 'interno',
      stateKey: 'luzBanheiro',
    },
    {
      id: 'bedroom2-lamp',
      location: 'Quarto 2',
      action: 'Lâmpada',
      icon: 'lightbulb',
      iconClass: 'material-symbols-outlined text-xl text-yellow-400',
      group: 'quarto2',
      groupLabel: 'Quarto 2',
      zone: 'interno',
      stateKey: 'lampada',
    },
    {
      id: 'kitchen-light',
      location: 'Cozinha',
      action: 'Luz',
      icon: 'lightbulb',
      iconClass: 'material-symbols-outlined text-xl text-red-400',
      group: 'cozinha',
      groupLabel: 'Cozinha',
      zone: 'interno',
      stateKey: 'luz',
    },
    {
      id: 'balcony-light',
      location: 'Varanda',
      action: 'Luz Varanda',
      icon: 'lightbulb_circle',
      iconClass: 'material-symbols-outlined text-xl text-green-500',
      group: 'varanda',
      groupLabel: 'Varanda',
      zone: 'externo',
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
      groupLabel: 'Área Externa',
      zone: 'externo',
      stateKey: 'irrigacao',
    },
    {
      id: 'exterior-lights',
      location: 'Área Externa',
      action: 'Luzes Externas',
      icon: 'outdoor_garden',
      iconClass: 'material-symbols-outlined text-xl text-amber-500',
      group: 'areaExterna',
      groupLabel: 'Área Externa',
      zone: 'externo',
      stateKey: 'luzesExternas',
    },
  ];

  const deviceMap = new Map(devicesConfig.map(device => [device.id, device]));
  const deviceButtons = new Map();

  function groupDevicesByEnvironment() {
    return devicesConfig.reduce((acc, device) => {
      const key = device.group || 'geral';
      if (!acc.has(key)) {
        acc.set(key, {
          key,
          label: device.groupLabel || device.location,
          zone: device.zone || 'interno',
          devices: [],
        });
      }
      acc.get(key).devices.push(device);
      return acc;
    }, new Map());
  }

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

  // construcao da snapshot de 0 e 1 para representar estados desligado e ligado
  function buildStateSnapshot() {
    const snapshot = devicesConfig.reduce((acc, device) => {
      const groupKey = device.group || 'geral';
      const actionKey = device.stateKey || device.id;
      if (!acc[groupKey]) {
        acc[groupKey] = {};
      }
      acc[groupKey][actionKey] = getDeviceState(device.id) ? 1 : 0;
      return acc;
    }, {});

    const nightRoutineRooms = getStoredNightRoutineRooms();
    const nightRoutine = {
      habilitada: localStorage.getItem(NIGHT_ROUTINE_ENABLED_KEY) === 'true' ? 1 : 0,
      horario: localStorage.getItem(NIGHT_ROUTINE_TIME_KEY) || '22:00',
      acao: localStorage.getItem(NIGHT_ROUTINE_ACTION_KEY) || 'off',
      ambientes: buildNightRoutineAmbientesSnapshot(nightRoutineRooms),
      ambientesSelecionados: nightRoutineRooms,
    };
    snapshot.rotinaNoturna = nightRoutine;
    return snapshot;
  }

  // salva no localStorage
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

  function hideLoadingOverlay() {
    if (!loadingOverlay) return;
    loadingOverlay.classList.add('is-hidden');
    setTimeout(() => {
      if (loadingOverlay.parentElement) {
        loadingOverlay.remove();
      }
    }, 700);
  }

  function getStoredNightRoutineRooms() {
    const stored = localStorage.getItem(NIGHT_ROUTINE_ROOMS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(id => deviceMap.has(id));
        }
      } catch (error) {
        console.warn('Erro ao ler ambientes da rotina noturna:', error);
      }
    }
    return ['living-room-light', 'bedroom1-lamp'];
  }

  function persistNightRoutineRooms(rooms) {
    localStorage.setItem(NIGHT_ROUTINE_ROOMS_KEY, JSON.stringify(rooms));
  }

  function renderNightRoutineDeviceList(selectedRooms = []) {
    if (!nightRoutineDeviceList) return;

    const environmentMap = groupDevicesByEnvironment();
    const sections = [
      { zone: 'interno', title: 'Ambientes internos' },
      { zone: 'externo', title: 'Ambientes externos' },
    ];

    nightRoutineDeviceList.innerHTML = '';

    sections.forEach(section => {
      const column = document.createElement('div');
      column.className = 'space-y-2';

      const header = document.createElement('p');
      header.className = 'text-xs uppercase tracking-wide text-slate-400';
      header.textContent = section.title;
      column.appendChild(header);

      const envContainer = document.createElement('div');
      envContainer.className = 'space-y-3';

      const environments = Array.from(environmentMap.values()).filter(env => env.zone === section.zone);

      if (!environments.length) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'text-sm text-slate-400';
        emptyMessage.textContent = 'Nenhum ambiente disponível.';
        envContainer.appendChild(emptyMessage);
      } else {
        environments.forEach(env => {
          const card = document.createElement('div');
          card.className = 'rounded-2xl border border-slate-100 bg-white/80 p-3 space-y-2';

          const envLabel = document.createElement('p');
          envLabel.className = 'text-sm font-semibold text-slate-700';
          envLabel.textContent = env.label;
          card.appendChild(envLabel);

          env.devices.forEach(device => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 text-sm text-slate-600';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'night-routine-room accent-slate-800';
            input.value = device.id;
            input.checked = selectedRooms.includes(device.id);
            label.appendChild(input);

            if (device.icon) {
              const icon = document.createElement('span');
              icon.className = device.iconClass || 'material-symbols-outlined text-lg text-slate-400';
              icon.setAttribute('aria-hidden', 'true');
              icon.textContent = device.icon;
              label.appendChild(icon);
            }

            const textWrapper = document.createElement('span');
            textWrapper.className = 'flex flex-col leading-tight';

            const actionLabel = document.createElement('span');
            actionLabel.className = 'font-medium text-slate-700';
            actionLabel.textContent = device.action;

            const locationLabel = document.createElement('span');
            locationLabel.className = 'text-xs text-slate-400';
            locationLabel.textContent = device.location;

            textWrapper.appendChild(actionLabel);
            textWrapper.appendChild(locationLabel);
            label.appendChild(textWrapper);

            card.appendChild(label);
          });

          envContainer.appendChild(card);
        });
      }

      column.appendChild(envContainer);
      nightRoutineDeviceList.appendChild(column);
    });

    nightRoutineRoomInputs = Array.from(nightRoutineDeviceList.querySelectorAll('.night-routine-room'));
  }

  function buildNightRoutineAmbientesSnapshot(roomIds = []) {
    return roomIds.reduce((acc, roomId) => {
      const device = deviceMap.get(roomId);
      if (!device) return acc;
      const groupKey = device.group || 'geral';
      const actionKey = device.stateKey || device.id;
      if (!acc[groupKey]) {
        acc[groupKey] = {};
      }
      acc[groupKey][actionKey] = 1;
      return acc;
    }, {});
  }

  function getSelectedNightRoutineRooms() {
    return nightRoutineRoomInputs
      .filter(roomInput => roomInput.checked)
      .map(roomInput => roomInput.value);
  }

  function updateNightRoutineButton(enabled) {
    if (!nightRoutineToggle) return;
    nightRoutineToggle.textContent = enabled ? 'Desativar rotina' : 'Ativar rotina';
    nightRoutineToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    nightRoutineToggle.classList.toggle('bg-emerald-500', enabled);
    nightRoutineToggle.classList.toggle('bg-slate-800', !enabled);
  }

  function updateNightRoutineSettingsVisibility(enabled) {
    if (!nightRoutineSettings) return;
    nightRoutineSettings.classList.toggle('hidden', !enabled);
    [nightRoutineTimeInput, nightRoutineActionSelect].forEach(control => {
      if (!control) return;
      control.disabled = !enabled;
      control.classList.toggle('opacity-60', !enabled);
    });
  }

  function updateNightRoutineSummary(enabled, rooms, timeValue, actionValue) {
    if (!nightRoutineSummary) return;
    if (!enabled) {
      nightRoutineSummary.textContent = 'Rotina noturna desativada.';
      return;
    }
    const readableRooms = rooms
      .map(id => deviceMap.get(id)?.location || id)
      .join(', ');
    const actionText = actionValue === 'off' ? 'desligar' : 'ligar';
    nightRoutineSummary.textContent = rooms.length
      ? `Após ${timeValue}, a rotina vai ${actionText} ${readableRooms}.`
      : `Após ${timeValue}, a rotina vai ${actionText} os ambientes selecionados.`;
  }

  function initializeNightRoutineCard() {
    if (!nightRoutineToggle || !nightRoutinePanelToggle || !nightRoutinePanel) return;

    const savedEnabled = localStorage.getItem(NIGHT_ROUTINE_ENABLED_KEY) === 'true';
    const savedTime = localStorage.getItem(NIGHT_ROUTINE_TIME_KEY) || '22:00';
    const savedAction = localStorage.getItem(NIGHT_ROUTINE_ACTION_KEY) || 'off';
    const savedRooms = getStoredNightRoutineRooms();

    if (nightRoutineTimeInput) nightRoutineTimeInput.value = savedTime;
    if (nightRoutineActionSelect) nightRoutineActionSelect.value = savedAction;
    renderNightRoutineDeviceList(savedRooms);

    updateNightRoutineButton(savedEnabled);
    updateNightRoutineSettingsVisibility(savedEnabled);
    updateNightRoutineSummary(savedEnabled, savedRooms, savedTime, savedAction);

    nightRoutineToggle.addEventListener('click', () => {
      const current = localStorage.getItem(NIGHT_ROUTINE_ENABLED_KEY) === 'true';
      const next = !current;
      localStorage.setItem(NIGHT_ROUTINE_ENABLED_KEY, next);
      updateNightRoutineButton(next);
      updateNightRoutineSettingsVisibility(next);
      const rooms = getStoredNightRoutineRooms();
      const actionValue = localStorage.getItem(NIGHT_ROUTINE_ACTION_KEY) || savedAction;
      const timeValue = localStorage.getItem(NIGHT_ROUTINE_TIME_KEY) || savedTime;
      updateNightRoutineSummary(next, rooms, timeValue, actionValue);
      updateStateSnapshot();
    });

    nightRoutinePanelToggle.addEventListener('click', () => {
      const expanded = nightRoutinePanelToggle.getAttribute('aria-expanded') === 'true';
      const icon = nightRoutinePanelToggle.querySelector('.material-symbols-outlined');
      nightRoutinePanelToggle.setAttribute('aria-expanded', String(!expanded));
      nightRoutinePanel.classList.toggle('hidden');
      nightRoutinePanel.setAttribute('aria-hidden', expanded ? 'true' : 'false');
      if (icon) {
        icon.textContent = expanded ? 'expand_more' : 'expand_less';
      }
    });

    if (nightRoutineTimeInput) {
      nightRoutineTimeInput.addEventListener('change', event => {
        const value = event.target.value || savedTime;
        localStorage.setItem(NIGHT_ROUTINE_TIME_KEY, value);
        const enabled = localStorage.getItem(NIGHT_ROUTINE_ENABLED_KEY) === 'true';
        const rooms = getStoredNightRoutineRooms();
        const actionValue = localStorage.getItem(NIGHT_ROUTINE_ACTION_KEY) || savedAction;
        updateNightRoutineSummary(enabled, rooms, value, actionValue);
        updateStateSnapshot();
      });
    }

    if (nightRoutineActionSelect) {
      nightRoutineActionSelect.addEventListener('change', event => {
        const value = event.target.value || savedAction;
        localStorage.setItem(NIGHT_ROUTINE_ACTION_KEY, value);
        const enabled = localStorage.getItem(NIGHT_ROUTINE_ENABLED_KEY) === 'true';
        const rooms = getStoredNightRoutineRooms();
        const timeValue = localStorage.getItem(NIGHT_ROUTINE_TIME_KEY) || savedTime;
        updateNightRoutineSummary(enabled, rooms, timeValue, value);
        updateStateSnapshot();
      });
    }

    nightRoutineRoomInputs.forEach(input => {
      input.addEventListener('change', () => {
        const rooms = getSelectedNightRoutineRooms();
        persistNightRoutineRooms(rooms);
        const enabled = localStorage.getItem(NIGHT_ROUTINE_ENABLED_KEY) === 'true';
        const actionValue = localStorage.getItem(NIGHT_ROUTINE_ACTION_KEY) || savedAction;
        const timeValue = localStorage.getItem(NIGHT_ROUTINE_TIME_KEY) || savedTime;
        updateNightRoutineSummary(enabled, rooms, timeValue, actionValue);
        updateStateSnapshot();
      });
    });
  }

  function handleNightRoutineSave() {
    const rooms = getSelectedNightRoutineRooms();
    persistNightRoutineRooms(rooms);
    const timeValue = (nightRoutineTimeInput?.value) || localStorage.getItem(NIGHT_ROUTINE_TIME_KEY) || '22:00';
    const actionValue = (nightRoutineActionSelect?.value) || localStorage.getItem(NIGHT_ROUTINE_ACTION_KEY) || 'off';
    localStorage.setItem(NIGHT_ROUTINE_TIME_KEY, timeValue);
    localStorage.setItem(NIGHT_ROUTINE_ACTION_KEY, actionValue);
    const enabled = localStorage.getItem(NIGHT_ROUTINE_ENABLED_KEY) === 'true';
    updateNightRoutineSummary(enabled, rooms, timeValue, actionValue);
    updateStateSnapshot();
    closeNightRoutineModal();
  }

  function openNightRoutineModal() {
    if (!nightRoutineModal) return;
    lastFocusedTrigger = document.activeElement;
    nightRoutineModal.classList.remove('hidden');
    nightRoutineModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    nightRoutineToggle?.focus();
  }

  function closeNightRoutineModal() {
    if (!nightRoutineModal) return;
    nightRoutineModal.classList.add('hidden');
    nightRoutineModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    } else {
      openNightRoutineBtn?.focus();
    }
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
  initializeNightRoutineCard();
  if (openNightRoutineBtn) {
    openNightRoutineBtn.addEventListener('click', openNightRoutineModal);
  }
  if (closeNightRoutineBtn) {
    closeNightRoutineBtn.addEventListener('click', closeNightRoutineModal);
  }
  if (nightRoutineBackdrop) {
    nightRoutineBackdrop.addEventListener('click', closeNightRoutineModal);
  }
  if (nightRoutineSaveBtn) {
    nightRoutineSaveBtn.addEventListener('click', handleNightRoutineSave);
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !nightRoutineModal?.classList.contains('hidden')) {
      closeNightRoutineModal();
    }
  });
  setTimeout(hideLoadingOverlay, 800);
});