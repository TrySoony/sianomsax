// Система ежедневных бонусов
class DailyBonusSystem {
  constructor() {
    this.bonusData = this.loadBonusData();
  }

  loadBonusData() {
    const data = localStorage.getItem('dailyBonusData');
    return data ? JSON.parse(data) : {
      lastClaimDate: null,
      consecutiveDays: 0,
      totalClaims: 0
    };
  }

  saveBonusData() {
    localStorage.setItem('dailyBonusData', JSON.stringify(this.bonusData));
  }

  // Проверка доступности ежедневного бонуса
  canClaimBonus() {
    const today = new Date().toDateString();
    return this.bonusData.lastClaimDate !== today;
  }

  // Получение информации о бонусе
  getBonusInfo() {
    const today = new Date().toDateString();
    const lastClaim = this.bonusData.lastClaimDate;
    
    if (lastClaim === today) {
      return {
        canClaim: false,
        message: 'Бонус уже получен сегодня!',
        nextClaim: this.getNextClaimTime()
      };
    }

    const daysDiff = lastClaim ? this.getDaysDifference(lastClaim, today) : 1;
    const isConsecutive = daysDiff === 1;
    
    if (!isConsecutive && daysDiff > 1) {
      this.bonusData.consecutiveDays = 0;
    }

    const bonusAmount = this.calculateBonusAmount();
    
    return {
      canClaim: true,
      consecutiveDays: this.bonusData.consecutiveDays,
      bonusAmount: bonusAmount,
      message: this.getBonusMessage(bonusAmount, isConsecutive)
    };
  }

  // Получение бонуса
  claimBonus() {
    if (!this.canClaimBonus()) {
      return { success: false, message: 'Бонус уже получен сегодня!' };
    }

    const today = new Date().toDateString();
    const lastClaim = this.bonusData.lastClaimDate;
    const daysDiff = lastClaim ? this.getDaysDifference(lastClaim, today) : 1;
    
    // Обновляем данные
    this.bonusData.lastClaimDate = today;
    this.bonusData.totalClaims++;
    
    if (daysDiff === 1) {
      this.bonusData.consecutiveDays++;
    } else {
      this.bonusData.consecutiveDays = 1;
    }

    const bonusAmount = this.calculateBonusAmount();
    
    // Добавляем бонусные попытки
    if (window.achievementSystem) {
      window.achievementSystem.addBonusAttempts(bonusAmount);
    }

    this.saveBonusData();

    return {
      success: true,
      bonusAmount: bonusAmount,
      consecutiveDays: this.bonusData.consecutiveDays,
      message: `Получено ${bonusAmount} бонусных попыток!`
    };
  }

  // Расчет количества бонусных попыток
  calculateBonusAmount() {
    const baseAmount = 1;
    const consecutiveBonus = Math.floor(this.bonusData.consecutiveDays / 7) * 1; // +1 за каждую неделю
    const totalBonus = Math.floor(this.bonusData.totalClaims / 30) * 2; // +2 за каждый месяц
    
    return baseAmount + consecutiveBonus + totalBonus;
  }

  // Получение сообщения о бонусе
  getBonusMessage(amount, isConsecutive) {
    let message = `Ежедневный бонус: ${amount} попыток`;
    
    if (isConsecutive && this.bonusData.consecutiveDays > 1) {
      message += `\nСерия: ${this.bonusData.consecutiveDays} дней подряд!`;
    }
    
    if (this.bonusData.consecutiveDays >= 7) {
      message += `\n🎉 Недельная серия! +1 попытка`;
    }
    
    if (this.bonusData.totalClaims >= 30) {
      message += `\n🏆 Месячная серия! +2 попытки`;
    }
    
    return message;
  }

  // Время следующего бонуса
  getNextClaimTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeLeft = tomorrow - now;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}ч ${minutes}м`;
  }

  // Разница в днях между датами
  getDaysDifference(date1Str, date2Str) {
    const date1 = new Date(date1Str);
    const date2 = new Date(date2Str);
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Получение статистики
  getStats() {
    return {
      totalClaims: this.bonusData.totalClaims,
      consecutiveDays: this.bonusData.consecutiveDays,
      lastClaimDate: this.bonusData.lastClaimDate,
      canClaim: this.canClaimBonus()
    };
  }
}

// Глобальный экземпляр системы ежедневных бонусов
window.dailyBonusSystem = new DailyBonusSystem(); 