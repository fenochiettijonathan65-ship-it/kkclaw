// 切换历史记录
class SwitchHistory {
  constructor() {
    this.history = [];
    this.maxHistory = 50;
  }

  record(event) {
    this.history.unshift({
      timestamp: Date.now(),
      from: event.previousModel?.id,
      to: event.targetModel.id,
      success: event.success,
      duration: event.duration,
      strategy: event.strategy,
      error: event.error
    });

    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  getSuccessRate(modelId) {
    const switches = this.history.filter(h => h.to === modelId);
    if (switches.length === 0) return 1.0;

    const successful = switches.filter(h => h.success).length;
    return successful / switches.length;
  }

  getCount(modelId) {
    return this.history.filter(h => h.to === modelId).length;
  }

  getAverageDuration(modelId) {
    const switches = this.history.filter(h => h.to === modelId && h.success);
    if (switches.length === 0) return 0;

    const total = switches.reduce((sum, h) => sum + h.duration, 0);
    return total / switches.length;
  }

  getRecent(limit = 10) {
    return this.history.slice(0, limit);
  }

  clear() {
    this.history = [];
  }
}

module.exports = SwitchHistory;
