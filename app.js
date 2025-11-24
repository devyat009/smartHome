







document.addEventListener('DOMContentLoaded', () => {
  // const btn = document.getElementById('light-toggle');
  // const icon = document.getElementById('power-icon');
  // const status = document.getElementById('light-status');
  // let ligado = false;

  // btn.addEventListener('click', () => {
  //   ligado = !ligado;
  //   if (ligado) {
  //     btn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
  //     btn.classList.add('bg-green-500', 'hover:bg-green-600');
  //     icon.classList.remove('text-gray-400');
  //     icon.classList.add('text-white');
  //     status.textContent = 'Ligada';
  //   } else {
  //     btn.classList.remove('bg-green-500', 'hover:bg-green-600');
  //     btn.classList.add('bg-gray-400', 'hover:bg-gray-500');
  //     icon.classList.remove('text-white');
  //     icon.classList.add('text-white');
  //     status.textContent = 'Desligada';
  //   }
  // });

  // ROOM LIST TOGGLE
  const openRoomsBtn = document.getElementById('open-rooms');
  const roomsSection = document.getElementById('rooms-section');
  const chevron = document.getElementById('rooms-chevron'); // icone seta

  if (openRoomsBtn && roomsSection) {
    openRoomsBtn.addEventListener('click', () => {
      const expanded = openRoomsBtn.getAttribute('aria-expanded') === 'true';
      openRoomsBtn.setAttribute('aria-expanded', String(!expanded));
      roomsSection.classList.toggle('hidden');
      chevron.textContent = expanded ? 'keyboard_arrow_right' : 'keyboard_arrow_down';
      if (!expanded) {
        roomsSection.focus();
      }
    });
  }
  // Seleciona todos os botões de luz
  document.querySelectorAll('.light-toggle').forEach(btn => {
    const id = btn.getAttribute('data-id');
    const powerBg = btn.querySelector('.power-bg');
    const storageKey = `light-${id}`;
    let ligado = localStorage.getItem(storageKey) === 'true';

    function updateUI() {
      if (ligado) {
        powerBg.classList.remove('bg-gray-300');
        powerBg.classList.add('bg-green-500');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        powerBg.classList.remove('bg-green-500');
        powerBg.classList.add('bg-gray-300');
        btn.setAttribute('aria-pressed', 'false');
      }
    }

    updateUI();

    btn.addEventListener('click', () => {
      ligado = !ligado;
      localStorage.setItem(storageKey, ligado);
      updateUI();
    });
  });
});