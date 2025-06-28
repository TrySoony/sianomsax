// Система рефералов
class ReferralSystem {
  constructor() {
    this.referralData = this.loadReferralData();
  }

  loadReferralData() {
    const data = localStorage.getItem('referralData');
    return data ? JSON.parse(data) : {
      referralCode: null,
      referredBy: null,
      referrals: [],
      totalReferrals: 0,
      rewardsClaimed: []
    };
  }

  saveReferralData() {
    localStorage.setItem('referralData', JSON.stringify(this.referralData));
  }

  // Генерация реферального кода
  generateReferralCode() {
    if (this.referralData.referralCode) {
      return this.referralData.referralCode;
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    this.referralData.referralCode = code;
    this.saveReferralData();
    return code;
  }

  // Применение реферального кода
  applyReferralCode(code) {
    if (this.referralData.referredBy) {
      return { success: false, message: 'Вы уже использовали реферальный код' };
    }

    if (code === this.referralData.referralCode) {
      return { success: false, message: 'Нельзя использовать свой собственный код' };
    }

    // В реальном приложении здесь была бы проверка кода на сервере
    this.referralData.referredBy = code;
    this.saveReferralData();

    // Даем бонус за использование кода
    if (window.achievementSystem) {
      window.achievementSystem.addBonusAttempts(2);
    }

    return { 
      success: true, 
      message: 'Реферальный код применен! Получено 2 бонусные попытки',
      bonusAttempts: 2
    };
  }

  // Добавление реферала (вызывается когда кто-то использует ваш код)
  addReferral(referralUserId) {
    if (!this.referralData.referrals.includes(referralUserId)) {
      this.referralData.referrals.push(referralUserId);
      this.referralData.totalReferrals++;
      this.saveReferralData();
      
      // Проверяем достижения
      this.checkReferralAchievements();
    }
  }

  // Проверка достижений за рефералов
  checkReferralAchievements() {
    const referralCount = this.referralData.totalReferrals;
    
    // Достижения за рефералов
    const referralAchievements = [
      { count: 1, name: 'Первый реферал', reward: 1 },
      { count: 5, name: '5 рефералов', reward: 3 },
      { count: 10, name: '10 рефералов', reward: 5 },
      { count: 25, name: '25 рефералов', reward: 10 },
      { count: 50, name: '50 рефералов', reward: 20 }
    ];

    referralAchievements.forEach(achievement => {
      if (referralCount >= achievement.count && 
          !this.referralData.rewardsClaimed.includes(achievement.count)) {
        
        // Добавляем награду
        if (window.achievementSystem) {
          window.achievementSystem.addBonusAttempts(achievement.reward);
        }
        
        this.referralData.rewardsClaimed.push(achievement.count);
        this.saveReferralData();

        // Показываем уведомление
        this.showReferralAchievementNotification(achievement);
      }
    });
  }

  // Уведомление о достижении реферала
  showReferralAchievementNotification(achievement) {
    // Воспроизводим звук достижения
    if (window.audioSystem) {
      window.audioSystem.playAchievementSound();
    }
    
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">👥</div>
      <div class="achievement-content">
        <div class="achievement-title">${achievement.name}</div>
        <div class="achievement-description">Получено ${achievement.reward} бонусных попыток!</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Получение статистики рефералов
  getReferralStats() {
    return {
      referralCode: this.referralData.referralCode,
      referredBy: this.referralData.referredBy,
      totalReferrals: this.referralData.totalReferrals,
      rewardsClaimed: this.referralData.rewardsClaimed,
      nextReward: this.getNextReward()
    };
  }

  // Получение следующей награды
  getNextReward() {
    const referralCount = this.referralData.totalReferrals;
    const rewards = [1, 5, 10, 25, 50];
    
    for (let reward of rewards) {
      if (referralCount < reward && !this.referralData.rewardsClaimed.includes(reward)) {
        return {
          count: reward,
          remaining: reward - referralCount,
          reward: this.getRewardAmount(reward)
        };
      }
    }
    
    return null;
  }

  // Получение размера награды
  getRewardAmount(count) {
    const rewardMap = {
      1: 1,
      5: 3,
      10: 5,
      25: 10,
      50: 20
    };
    return rewardMap[count] || 0;
  }

  // Копирование реферального кода
  copyReferralCode() {
    const code = this.generateReferralCode();
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.showCopyNotification('Код скопирован!');
      });
    } else {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showCopyNotification('Код скопирован!');
    }
  }

  // Поделиться реферальным кодом
  shareReferralCode() {
    const code = this.generateReferralCode();
    const shareText = `🎁 Привет! Используй мой реферальный код "${code}" в Gift Roulette и получи бонусные попытки!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Gift Roulette - Реферальный код',
        text: shareText,
        url: window.location.href
      });
    } else {
      // Fallback - копируем в буфер обмена
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
          this.showCopyNotification('Текст для приглашения скопирован!');
        });
      }
    }
  }

  // Уведомление о копировании
  showCopyNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">📋</div>
      <div class="achievement-content">
        <div class="achievement-title">Скопировано!</div>
        <div class="achievement-description">${message}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }

  // Получение ссылки для приглашения
  getReferralLink() {
    const code = this.generateReferralCode();
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('ref', code);
    return currentUrl.toString();
  }
}

// Глобальный экземпляр системы рефералов
window.referralSystem = new ReferralSystem();

// Обработка реферального кода из URL при загрузке
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');
  
  if (referralCode && window.referralSystem) {
    const result = window.referralSystem.applyReferralCode(referralCode);
    if (result.success) {
      // Показываем уведомление о применении кода
      setTimeout(() => {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
          <div class="achievement-icon">🎁</div>
          <div class="achievement-content">
            <div class="achievement-title">Реферальный код применен!</div>
            <div class="achievement-description">${result.message}</div>
          </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 4000);
      }, 1000);
    }
  }
}); 