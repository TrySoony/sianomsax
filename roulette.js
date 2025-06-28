const roulette = document.getElementById('roulette');
const spinBtn = document.getElementById('spin');
const resultDiv = document.getElementById('result');

// Maximum attempts
const MAX_ATTEMPTS = 2;

function getAttempts() {
  return parseInt(localStorage.getItem('roulette_attempts') || '0', 10);
}
function setAttempts(val) {
  localStorage.setItem('roulette_attempts', val);
}
function incAttempts() {
  setAttempts(getAttempts() + 1);
}

// Обновленная функция проверки доступности вращения
function isSpinAvailable() {
  const regularAttempts = getAttempts() < MAX_ATTEMPTS;
  const bonusAttempts = window.achievementSystem ? window.achievementSystem.getBonusAttempts() : 0;
  return regularAttempts || bonusAttempts > 0;
}

function updateSpinBtnState() {
  const available = isSpinAvailable();
  spinBtn.disabled = !available;
  
  if (!available) {
    spinBtn.textContent = 'No attempts left';
  } else {
    const regularAttempts = MAX_ATTEMPTS - getAttempts();
    const bonusAttempts = window.achievementSystem ? window.achievementSystem.getBonusAttempts() : 0;
    
    if (regularAttempts > 0) {
      spinBtn.textContent = `Spin! (${regularAttempts} left)`;
    } else if (bonusAttempts > 0) {
      spinBtn.textContent = `Spin! (Bonus: ${bonusAttempts})`;
    } else {
      spinBtn.textContent = 'Spin!';
    }
  }
}

function renderPrizes(extendedPrizes) {
  roulette.innerHTML = '';
  let tempPrize = document.createElement('div');
  tempPrize.className = 'prize';
  tempPrize.style.visibility = 'hidden';
  tempPrize.textContent = 'test';
  roulette.appendChild(tempPrize);
  let prizeWidth = tempPrize.offsetWidth;
  roulette.removeChild(tempPrize);
  if (!prizeWidth || prizeWidth < 10) {
    console.warn('prizeWidth вычислен некорректно, используем fallback 90px');
    prizeWidth = 90;
  }
  console.log('prizeWidth:', prizeWidth, 'extendedPrizes.length:', extendedPrizes.length, 'prizes:', typeof prizes !== 'undefined' ? prizes : 'undefined');

  if (!Array.isArray(extendedPrizes) || extendedPrizes.length === 0) {
    roulette.innerHTML = '<div style="color:#888;margin:20px;">Нет призов для отображения</div>';
    return;
  }
  // Определяем центральный индекс
  let visibleCount = Math.floor(roulette.parentElement.offsetWidth / prizeWidth);
  if (visibleCount < 1) visibleCount = 1;
  const centerIndex = Math.floor(visibleCount / 2);
  extendedPrizes.forEach((prize, i) => {
    const rarity = prize.rarity ? prize.rarity.toLowerCase() : 'common';
    const rarityClass = `prize-${rarity}`;
    const isCenter = i === centerIndex;
    const div = document.createElement('div');
    div.className = `prize ${rarityClass}${isCenter ? ' prize-center' : ''}`;
    let rarityLabel = prize.rarity ? `<div class=\"prize-rarity\">${prize.rarity}</div>` : '';
    let desc = prize.description ? `<div class=\"prize-desc\">${prize.description}</div>` : '';
    div.innerHTML = `
      <img src=\"${prize.img}\" class=\"prize-img\" alt=\"${prize.name}\">
      ${rarityLabel}
      <div class=\"prize-name\">${prize.name}</div>
      <div class=\"prize-price\">${prize.starPrice}⭐</div>
      ${desc}
    `;
    roulette.appendChild(div);
  });
}

function getPrizeWidth() {
  const tempPrize = document.createElement('div');
  tempPrize.className = 'prize';
  tempPrize.style.visibility = 'hidden';
  tempPrize.textContent = 'test';
  roulette.appendChild(tempPrize);
  const prizeWidth = tempPrize.offsetWidth || 90; // fallback для мобильных
  roulette.removeChild(tempPrize);
  return prizeWidth;
}

// --- Win modal and confetti ---
const winModalOverlay = document.getElementById('win-modal-overlay');
const winModalImg = document.getElementById('win-modal-img');
const winModalTitle = document.getElementById('win-modal-title');
const winModalPrice = document.getElementById('win-modal-price');
const winModalBtn = document.getElementById('win-modal-btn');

function launchConfetti() {
  if (typeof confetti !== 'function') return;
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 101 };
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function showWinModal(prize) {
  winModalImg.src = prize.img;
  winModalTitle.textContent = prize.name;
  winModalPrice.textContent = `${prize.starPrice}⭐`;
  winModalOverlay.classList.add('visible');
  launchConfetti();
}
function hideWinModal() {
  winModalOverlay.classList.remove('visible');
}
winModalOverlay.addEventListener('click', (e) => {
  if (e.target === winModalOverlay) {
    hideWinModal();
  }
});
winModalBtn.addEventListener('click', () => {
  hideWinModal();
  // Switch to "My Gifts" tab
  const giftsTab = document.querySelector('.tab-btn[data-tab="gifts"]');
  if (giftsTab) giftsTab.click();
});

function spinRoulette() {
  if (!isSpinAvailable()) return;
  
  // Воспроизводим звук вращения
  if (window.audioSystem) {
    window.audioSystem.playSpinSound();
  }
  
  // Проверяем, используем ли мы бонусную попытку
  const regularAttempts = getAttempts() < MAX_ATTEMPTS;
  let usedBonusAttempt = false;
  
  if (!regularAttempts && window.achievementSystem) {
    usedBonusAttempt = window.achievementSystem.useBonusAttempt();
  } else {
    incAttempts();
  }
  
  updateSpinBtnState();
  resultDiv.textContent = '';

  const prizeCount = prizes.length;
  const prizeWidth = getPrizeWidth();
  let visibleCount = Math.floor(roulette.parentElement.offsetWidth / prizeWidth);
  if (visibleCount < 1) visibleCount = 1;
  const centerIndex = Math.floor(visibleCount / 2);

  const randomIndex = Math.floor(Math.random() * prizeCount);
  const rounds = Math.floor(Math.random() * 3) + 5;
  const totalSteps = rounds * prizeCount + randomIndex;
  let extendedLength = totalSteps + visibleCount + 2;
  if (extendedLength < prizeCount + 3) extendedLength = prizeCount + 3;
  let extendedPrizes = [];
  while (extendedPrizes.length < extendedLength) {
    extendedPrizes = extendedPrizes.concat(prizes);
  }
  extendedPrizes = extendedPrizes.slice(0, extendedLength);

  renderPrizes(extendedPrizes);

  const offset = Math.max((totalSteps - centerIndex) * prizeWidth, 0);

  roulette.style.transition = 'none';
  roulette.style.transform = 'translateX(0px)';

  requestAnimationFrame(() => {
    roulette.style.transition = 'transform 2s cubic-bezier(0.15, 0.85, 0.35, 1)';
    roulette.style.transform = `translateX(-${offset}px)`;
  });

  setTimeout(() => {
    // Воспроизводим звук остановки рулетки
    if (window.audioSystem) {
      window.audioSystem.playRouletteStopSound();
    }
    
    const pointer = document.querySelector('.pointer');
    const pointerRect = pointer.getBoundingClientRect();
    const prizeDivs = document.querySelectorAll('.prize');
    let foundPrize = null;
    prizeDivs.forEach(div => {
      const rect = div.getBoundingClientRect();
      if (
        pointerRect.left >= rect.left &&
        pointerRect.left <= rect.right
      ) {
        foundPrize = div.querySelector('.prize-name').textContent;
    }
    });
    let prizeUnderPointer = null;
    if (foundPrize) {
      prizeUnderPointer = prizes.find(prize => foundPrize === prize.name);
    }
    if (!prizeUnderPointer) {
      prizeUnderPointer = prizes[randomIndex % prizeCount];
    }
    if (prizeUnderPointer.starPrice > 0) {
      resultDiv.textContent = `You won: ${prizeUnderPointer.name} (${prizeUnderPointer.starPrice}⭐)!`;
      saveGift(prizeUnderPointer);
      
      // Интеграция с системой достижений
      if (window.achievementSystem) {
        window.achievementSystem.onPrizeWon(prizeUnderPointer);
      }
      
      // Воспроизводим звук выигрыша
      if (window.audioSystem) {
        window.audioSystem.playWinSound();
      }
      
      showWinModal(prizeUnderPointer);
      // Do not send sendData, just show modal
    } else {
      resultDiv.textContent = `No win this time. Try again!`;
      // Do not send sendData
    }
    
    updateSpinBtnState();
  }, 2000);
}

// Initial render (default 3 rounds)
(function(){
  const prizeCount = prizes.length;
  const prizeWidth = getPrizeWidth();
  const visibleCount = Math.floor(roulette.parentElement.offsetWidth / prizeWidth);
  const rounds = 3;
  const totalSteps = rounds * prizeCount;
  const extendedLength = totalSteps + visibleCount + 2;
  let extendedPrizes = [];
  while (extendedPrizes.length < extendedLength) {
    extendedPrizes = extendedPrizes.concat(prizes);
  }
  extendedPrizes = extendedPrizes.slice(0, extendedLength);
  renderPrizes(extendedPrizes);
})();

// On page load update gifts list
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateGiftsListFromStorage);
} else {
  updateGiftsListFromStorage();
}

// Handler for "Withdraw" button on gift
const myGiftsList = document.getElementById('my-gifts-list');
if (myGiftsList) {
  myGiftsList.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('gift-card-btn')) {
      const giftIndex = e.target.dataset.giftIndex;
      const gifts = JSON.parse(localStorage.getItem('my_gifts') || '[]');
      const gift = gifts[giftIndex];
      if (gift && window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({action: "withdraw_gift", gift}));
        Telegram.WebApp.close();
      }
    }
  });
}

function saveGift(prize) {
  if (prize.starPrice === 0) return; // do not save empty
  const gifts = JSON.parse(localStorage.getItem('my_gifts') || '[]');
  gifts.push({
    name: prize.name,
    img: prize.img,
    starPrice: prize.starPrice,
    date: new Date().toLocaleDateString('en-US')
  });
  localStorage.setItem('my_gifts', JSON.stringify(gifts));
  updateGiftsListFromStorage(); // update list after add
}

// Функция для обновления списка подарков на вкладке "Мои подарки"
function updateGiftsListFromStorage() {
  const gifts = JSON.parse(localStorage.getItem('my_gifts') || '[]');
  const list = document.getElementById('my-gifts-list');
  if (!list) return;
  if (gifts.length === 0) {
    list.innerHTML = '<div style="color:#888;margin-top:30px;">No gifts yet</div>';
    return;
  }
  list.innerHTML = gifts.map((gift, index) => `
    <li><div class="gift-card">
      <img src="${gift.img}" alt="${gift.name}">
      <div class="gift-card-title">${gift.name}</div>
      <div class="gift-card-date">Won: ${gift.date}</div>
      <button class="gift-card-btn withdraw-btn" data-gift-index="${index}">Withdraw</button>
    </div></li>
  `).join('');
}

// При загрузке страницы сразу обновляем список подарков
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateGiftsListFromStorage);
} else {
  updateGiftsListFromStorage();
}

spinBtn.addEventListener('click', spinRoulette);

document.addEventListener('DOMContentLoaded', function() {
  renderPrizes(prizes);
  updateSpinBtnState(); // Обновляем состояние кнопки при загрузке
});