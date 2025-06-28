// Система звуков и музыки для GiftWins
class AudioSystem {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.isMuted = this.loadMuteState();
    this.musicVolume = 0.3;
    this.soundVolume = 0.6;
    this.audioContext = null;
    
    this.initAudioContext();
    this.initSounds();
    this.initMusic();
    this.createAudioControls();
  }

  // Инициализация AudioContext
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
      this.audioContext = null;
    }
  }

  // Загрузка состояния звука
  loadMuteState() {
    return localStorage.getItem('audioMuted') === 'true';
  }

  // Сохранение состояния звука
  saveMuteState() {
    localStorage.setItem('audioMuted', this.isMuted.toString());
  }

  // Инициализация звуковых эффектов
  initSounds() {
    if (!this.audioContext) {
      console.warn('AudioContext not available, sounds disabled');
      return;
    }
    
    // Создаем звуки с помощью Web Audio API
    this.sounds = {
      spin: this.createSpinSound(),
      win: this.createWinSound(),
      achievement: this.createAchievementSound(),
      levelUp: this.createLevelUpSound(),
      bonus: this.createBonusSound(),
      click: this.createClickSound(),
      notification: this.createNotificationSound(),
      rouletteStop: this.createRouletteStopSound()
    };
  }

  // Инициализация фоновой музыки
  initMusic() {
    if (!this.audioContext) {
      console.warn('AudioContext not available, music disabled');
      return;
    }
    
    // Создаем фоновую музыку
    this.music = this.createBackgroundMusic();
  }

  // Создание звука вращения рулетки
  createSpinSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.3, this.audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    return { oscillator, gainNode };
  }

  // Создание звука выигрыша
  createWinSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Создаем мелодию выигрыша
    const frequencies = [523, 659, 784, 1047]; // C, E, G, C
    const timeStep = 0.15;
    
    frequencies.forEach((freq, index) => {
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * timeStep);
    });
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.4, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + frequencies.length * timeStep);
    
    return { oscillator, gainNode };
  }

  // Создание звука достижения
  createAchievementSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Звук достижения - восходящая мелодия
    const frequencies = [440, 554, 659, 880]; // A, C#, E, A
    const timeStep = 0.1;
    
    frequencies.forEach((freq, index) => {
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * timeStep);
    });
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + frequencies.length * timeStep);
    
    return { oscillator, gainNode };
  }

  // Создание звука повышения уровня
  createLevelUpSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Звук повышения уровня - торжественная мелодия
    const frequencies = [523, 659, 784, 1047, 1319]; // C, E, G, C, E
    const timeStep = 0.12;
    
    frequencies.forEach((freq, index) => {
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * timeStep);
    });
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.5, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + frequencies.length * timeStep);
    
    return { oscillator, gainNode };
  }

  // Создание звука бонуса
  createBonusSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Звук бонуса - короткий и приятный
    oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    return { oscillator, gainNode };
  }

  // Создание звука клика
  createClickSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.2, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    return { oscillator, gainNode };
  }

  // Создание звука уведомления
  createNotificationSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(554, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.25, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    return { oscillator, gainNode };
  }

  // Создание звука остановки рулетки
  createRouletteStopSound() {
    if (!this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.4, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    return { oscillator, gainNode };
  }

  // Создание фоновой музыки
  createBackgroundMusic() {
    if (!this.audioContext) return null;
    
    const oscillators = [];
    const gainNodes = [];
    
    // Создаем простую мелодию
    const melody = [
      { freq: 261, duration: 0.5 }, // C
      { freq: 293, duration: 0.5 }, // D
      { freq: 329, duration: 0.5 }, // E
      { freq: 349, duration: 0.5 }, // F
      { freq: 392, duration: 0.5 }, // G
      { freq: 440, duration: 0.5 }, // A
      { freq: 493, duration: 0.5 }, // B
      { freq: 523, duration: 0.5 }  // C
    ];
    
    melody.forEach((note, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.1, this.audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration);
      
      oscillators.push(oscillator);
      gainNodes.push(gainNode);
    });
    
    return { oscillators, gainNodes };
  }

  // Создание элементов управления звуком
  createAudioControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'audio-controls';
    controlsContainer.innerHTML = `
      <button class="audio-btn" id="audio-toggle">
        <span class="audio-icon">🔊</span>
      </button>
      <div class="audio-slider-container">
        <input type="range" id="music-volume" min="0" max="100" value="30" class="audio-slider">
        <label for="music-volume">🎵</label>
      </div>
      <div class="audio-slider-container">
        <input type="range" id="sound-volume" min="0" max="100" value="60" class="audio-slider">
        <label for="sound-volume">🔊</label>
      </div>
      <button class="audio-btn" id="audio-close-btn" style="position:absolute;top:6px;right:6px;width:28px;height:28px;font-size:1.2em;line-height:1;">✖</button>
    `;
    controlsContainer.style.position = 'fixed';
    controlsContainer.style.top = '20px';
    controlsContainer.style.left = '20px';
    controlsContainer.style.zIndex = '1000';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.gap = '12px';
    controlsContainer.style.background = 'rgba(35, 43, 59, 0.9)';
    controlsContainer.style.border = '2px solid #2a3550';
    controlsContainer.style.borderRadius = '12px';
    controlsContainer.style.padding = '12px';
    controlsContainer.style.backdropFilter = 'blur(10px)';
    controlsContainer.style.transition = 'all 0.3s ease';
    controlsContainer.style.right = '';
    controlsContainer.style.bottom = '';
    controlsContainer.style.boxSizing = 'border-box';
    controlsContainer.style.minWidth = '0';
    controlsContainer.style.maxWidth = 'calc(100vw - 40px)';
    controlsContainer.style.flexWrap = 'wrap';
    controlsContainer.style.overflow = 'visible';
    controlsContainer.id = 'audio-controls-main';
    document.body.appendChild(controlsContainer);
    this.setupAudioControls();
    // Добавляем обработчик для кнопки закрытия
    const closeBtn = document.getElementById('audio-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        controlsContainer.style.display = 'none';
      });
    }
  }

  // Настройка элементов управления
  setupAudioControls() {
    const toggleBtn = document.getElementById('audio-toggle');
    const musicSlider = document.getElementById('music-volume');
    const soundSlider = document.getElementById('sound-volume');
    
    toggleBtn.addEventListener('click', () => {
      this.toggleMute();
    });
    
    musicSlider.addEventListener('input', (e) => {
      this.musicVolume = e.target.value / 100;
      this.updateMusicVolume();
    });
    
    soundSlider.addEventListener('input', (e) => {
      this.soundVolume = e.target.value / 100;
      this.updateSoundVolume();
    });
    
    this.updateAudioIcon();
  }

  // Переключение звука
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.saveMuteState();
    this.updateAudioIcon();
    
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
  }

  // Обновление иконки звука
  updateAudioIcon() {
    const icon = document.querySelector('.audio-icon');
    if (this.isMuted) {
      icon.textContent = '🔇';
    } else {
      icon.textContent = '🔊';
    }
  }

  // Обновление громкости музыки
  updateMusicVolume() {
    if (this.music && this.music.gainNodes) {
      this.music.gainNodes.forEach(gainNode => {
        gainNode.gain.setValueAtTime(this.musicVolume * 0.1, gainNode.context.currentTime);
      });
    }
  }

  // Обновление громкости звуков
  updateSoundVolume() {
    // Обновляем громкость для всех звуков
    Object.values(this.sounds).forEach(sound => {
      if (sound.gainNode) {
        sound.gainNode.gain.setValueAtTime(this.soundVolume, sound.audioContext.currentTime);
      }
    });
  }

  // Воспроизведение звука
  playSound(soundName) {
    if (this.isMuted) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      try {
        // Создаем новый экземпляр звука для каждого воспроизведения
        const newSound = this.createSoundCopy(soundName);
        newSound.oscillator.start();
        newSound.oscillator.stop(newSound.audioContext.currentTime + 0.5);
      } catch (error) {
        console.log('Ошибка воспроизведения звука:', error);
      }
    }
  }

  // Создание копии звука для воспроизведения
  createSoundCopy(soundName) {
    switch (soundName) {
      case 'spin': return this.createSpinSound();
      case 'win': return this.createWinSound();
      case 'achievement': return this.createAchievementSound();
      case 'levelUp': return this.createLevelUpSound();
      case 'bonus': return this.createBonusSound();
      case 'click': return this.createClickSound();
      case 'notification': return this.createNotificationSound();
      case 'rouletteStop': return this.createRouletteStopSound();
      default: return null;
    }
  }

  // Воспроизведение музыки
  playMusic() {
    if (this.isMuted || !this.music) return;
    
    try {
      this.music.oscillators.forEach(oscillator => {
        oscillator.start();
      });
    } catch (error) {
      console.log('Ошибка воспроизведения музыки:', error);
    }
  }

  // Остановка музыки
  stopMusic() {
    if (this.music) {
      try {
        this.music.oscillators.forEach(oscillator => {
          oscillator.stop();
        });
      } catch (error) {
        console.log('Ошибка остановки музыки:', error);
      }
    }
  }

  // Методы для воспроизведения конкретных звуков
  playSpinSound() { this.playSound('spin'); }
  playWinSound() { this.playSound('win'); }
  playAchievementSound() { this.playSound('achievement'); }
  playLevelUpSound() { this.playSound('levelUp'); }
  playBonusSound() { this.playSound('bonus'); }
  playClickSound() { this.playSound('click'); }
  playNotificationSound() { this.playSound('notification'); }
  playRouletteStopSound() { this.playSound('rouletteStop'); }
}

// Глобальный экземпляр системы звуков
window.audioSystem = new AudioSystem(); 