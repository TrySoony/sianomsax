// Система достижений и уровней
const ACHIEVEMENTS = {
  // Достижения за количество выигрышей
  FIRST_WIN: {
    id: 'first_win',
    name: 'Первый шаг',
    description: 'Выиграйте первый приз',
    icon: '🎯',
    condition: (stats) => stats.totalWins >= 1,
    reward: { attempts: 1 }
  },
  WINNER_5: {
    id: 'winner_5',
    name: 'Начинающий победитель',
    description: 'Выиграйте 5 призов',
    icon: '🏆',
    condition: (stats) => stats.totalWins >= 5,
    reward: { attempts: 2 }
  },
  WINNER_10: {
    id: 'winner_10',
    name: 'Опытный игрок',
    description: 'Выиграйте 10 призов',
    icon: '👑',
    condition: (stats) => stats.totalWins >= 10,
    reward: { attempts: 3 }
  },
  WINNER_25: {
    id: 'winner_25',
    name: 'Мастер рулетки',
    description: 'Выиграйте 25 призов',
    icon: '💎',
    condition: (stats) => stats.totalWins >= 25,
    reward: { attempts: 5 }
  },
  WINNER_50: {
    id: 'winner_50',
    name: 'Легенда',
    description: 'Выиграйте 50 призов',
    icon: '🌟',
    condition: (stats) => stats.totalWins >= 50,
    reward: { attempts: 10 }
  },
  
  // Достижения за редкие призы
  RARE_PRIZE: {
    id: 'rare_prize',
    name: 'Редкая находка',
    description: 'Выиграйте редкий приз',
    icon: '💫',
    condition: (stats) => stats.rarePrizes >= 1,
    reward: { attempts: 2 }
  },
  EPIC_PRIZE: {
    id: 'epic_prize',
    name: 'Эпический момент',
    description: 'Выиграйте эпический приз',
    icon: '🔥',
    condition: (stats) => stats.epicPrizes >= 1,
    reward: { attempts: 3 }
  },
  LEGENDARY_PRIZE: {
    id: 'legendary_prize',
    name: 'Легендарная удача',
    description: 'Выиграйте легендарный приз',
    icon: '⚡',
    condition: (stats) => stats.legendaryPrizes >= 1,
    reward: { attempts: 5 }
  },
  
  // Достижения за активность
  DAILY_LOGIN: {
    id: 'daily_login',
    name: 'Ежедневный игрок',
    description: 'Заходите в игру 7 дней подряд',
    icon: '📅',
    condition: (stats) => stats.consecutiveDays >= 7,
    reward: { attempts: 1 }
  },
  WEEKLY_LOGIN: {
    id: 'weekly_login',
    name: 'Преданный игрок',
    description: 'Заходите в игру 30 дней подряд',
    icon: '📆',
    condition: (stats) => stats.consecutiveDays >= 30,
    reward: { attempts: 5 }
  }
};

// Система уровней
const LEVELS = {
  1: { name: 'Новичок', xpRequired: 0, bonusAttempts: 0 },
  2: { name: 'Игрок', xpRequired: 100, bonusAttempts: 1 },
  3: { name: 'Опытный', xpRequired: 300, bonusAttempts: 2 },
  4: { name: 'Мастер', xpRequired: 600, bonusAttempts: 3 },
  5: { name: 'Эксперт', xpRequired: 1000, bonusAttempts: 4 },
  6: { name: 'Профессионал', xpRequired: 1500, bonusAttempts: 5 },
  7: { name: 'Ветеран', xpRequired: 2100, bonusAttempts: 6 },
  8: { name: 'Легенда', xpRequired: 2800, bonusAttempts: 7 },
  9: { name: 'Миф', xpRequired: 3600, bonusAttempts: 8 },
  10: { name: 'Бог рулетки', xpRequired: 4500, bonusAttempts: 10 }
};

// Функции для работы с достижениями
class AchievementSystem {
  constructor() {
    this.userStats = this.loadUserStats();
    this.achievements = this.loadAchievements();
  }

  loadUserStats() {
    const stats = localStorage.getItem('userStats');
    return stats ? JSON.parse(stats) : {
      totalWins: 0,
      rarePrizes: 0,
      epicPrizes: 0,
      legendaryPrizes: 0,
      consecutiveDays: 0,
      lastLoginDate: null,
      totalXP: 0,
      level: 1
    };
  }

  loadAchievements() {
    const achievements = localStorage.getItem('userAchievements');
    return achievements ? JSON.parse(achievements) : [];
  }

  saveUserStats() {
    localStorage.setItem('userStats', JSON.stringify(this.userStats));
  }

  saveAchievements() {
    localStorage.setItem('userAchievements', JSON.stringify(this.achievements));
  }

  // Обновление статистики при выигрыше
  onPrizeWon(prize) {
    this.userStats.totalWins++;
    
    // Определяем редкость приза
    if (prize.starPrice >= 100000) {
      this.userStats.legendaryPrizes++;
    } else if (prize.starPrice >= 37500) {
      this.userStats.epicPrizes++;
    } else if (prize.starPrice >= 14000) {
      this.userStats.rarePrizes++;
    }

    // Добавляем XP за выигрыш
    const xpGained = Math.floor(prize.starPrice / 1000);
    this.addXP(xpGained);

    this.checkAchievements();
    this.saveUserStats();
  }

  // Добавление XP
  addXP(amount) {
    this.userStats.totalXP += amount;
    
    // Проверяем повышение уровня
    const newLevel = this.calculateLevel(this.userStats.totalXP);
    if (newLevel > this.userStats.level) {
      this.userStats.level = newLevel;
      this.showLevelUpNotification(newLevel);
    }
  }

  // Расчет уровня на основе XP
  calculateLevel(xp) {
    for (let level = Object.keys(LEVELS).length; level >= 1; level--) {
      if (xp >= LEVELS[level].xpRequired) {
        return level;
      }
    }
    return 1;
  }

  // Проверка достижений
  checkAchievements() {
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!this.achievements.includes(achievement.id) && 
          achievement.condition(this.userStats)) {
        this.unlockAchievement(achievement);
      }
    });
  }

  // Разблокировка достижения
  unlockAchievement(achievement) {
    this.achievements.push(achievement.id);
    this.saveAchievements();
    this.showAchievementNotification(achievement);
    
    // Применяем награду
    if (achievement.reward.attempts) {
      this.addBonusAttempts(achievement.reward.attempts);
    }
  }

  // Добавление бонусных попыток
  addBonusAttempts(amount) {
    const currentBonus = parseInt(localStorage.getItem('bonusAttempts') || '0');
    localStorage.setItem('bonusAttempts', (currentBonus + amount).toString());
  }

  // Получение бонусных попыток
  getBonusAttempts() {
    return parseInt(localStorage.getItem('bonusAttempts') || '0');
  }

  // Использование бонусной попытки
  useBonusAttempt() {
    const currentBonus = this.getBonusAttempts();
    if (currentBonus > 0) {
      localStorage.setItem('bonusAttempts', (currentBonus - 1).toString());
      return true;
    }
    return false;
  }

  // Проверка ежедневного входа
  checkDailyLogin() {
    const today = new Date().toDateString();
    if (this.userStats.lastLoginDate !== today) {
      if (this.userStats.lastLoginDate) {
        const lastLogin = new Date(this.userStats.lastLoginDate);
        const daysDiff = Math.floor((new Date() - lastLogin) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          this.userStats.consecutiveDays++;
        } else {
          this.userStats.consecutiveDays = 1;
        }
      } else {
        this.userStats.consecutiveDays = 1;
      }
      
      this.userStats.lastLoginDate = today;
      this.checkAchievements();
      this.saveUserStats();
    }
  }

  // Уведомления
  showAchievementNotification(achievement) {
    // Воспроизводим звук достижения
    if (window.audioSystem) {
      window.audioSystem.playAchievementSound();
    }
    
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-content">
        <div class="achievement-title">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
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

  showLevelUpNotification(level) {
    // Воспроизводим звук повышения уровня
    if (window.audioSystem) {
      window.audioSystem.playLevelUpSound();
    }
    
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
      <div class="level-up-icon">🎉</div>
      <div class="level-up-content">
        <div class="level-up-title">Новый уровень!</div>
        <div class="level-up-level">${LEVELS[level].name}</div>
        <div class="level-up-bonus">+${LEVELS[level].bonusAttempts} попыток</div>
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
  }

  // Получение статистики для отображения
  getStats() {
    return {
      ...this.userStats,
      bonusAttempts: this.getBonusAttempts(),
      achievements: this.achievements.length,
      totalAchievements: Object.keys(ACHIEVEMENTS).length,
      nextLevelXP: LEVELS[Math.min(this.userStats.level + 1, Object.keys(LEVELS).length)].xpRequired,
      currentLevelInfo: LEVELS[this.userStats.level]
    };
  }

  // Получение списка достижений
  getAchievementsList() {
    return Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: this.achievements.includes(achievement.id)
    }));
  }
}

// Глобальный экземпляр системы достижений
window.achievementSystem = new AchievementSystem(); 