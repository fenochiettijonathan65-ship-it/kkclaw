// Gateway 健康度评分系统
class GatewayHealthScorer {
  constructor(metricsCollector) {
    this.metrics = metricsCollector;
  }

  calculateHealthScore() {
    const weights = {
      availability: 0.4,
      performance: 0.3,
      errorRate: 0.3
    };

    const availabilityScore = this._scoreAvailability();
    const performanceScore = this._scorePerformance();
    const errorRateScore = this._scoreErrorRate();

    const totalScore =
      availabilityScore * weights.availability +
      performanceScore * weights.performance +
      errorRateScore * weights.errorRate;

    return {
      total: Math.round(totalScore),
      breakdown: {
        availability: Math.round(availabilityScore),
        performance: Math.round(performanceScore),
        errorRate: Math.round(errorRateScore)
      },
      status: this._getStatus(totalScore),
      timestamp: Date.now()
    };
  }

  _scoreAvailability() {
    const successRate = this.metrics.getSuccessRate();
    if (successRate >= 0.99) return 100;
    if (successRate >= 0.95) return 90;
    if (successRate >= 0.90) return 70;
    if (successRate >= 0.80) return 50;
    return successRate * 50;
  }

  _scorePerformance() {
    const p95 = this.metrics.getResponseTimePercentile(95);
    if (p95 === 0) return 100;
    if (p95 < 500) return 100;
    if (p95 < 1000) return 90;
    if (p95 < 2000) return 70;
    if (p95 < 5000) return 50;
    return 30;
  }

  _scoreErrorRate() {
    const errorRate = this.metrics.getErrorRate();
    if (errorRate === 0) return 100;
    if (errorRate < 0.01) return 95;
    if (errorRate < 0.05) return 80;
    if (errorRate < 0.10) return 60;
    return 40;
  }

  _getStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }
}

module.exports = GatewayHealthScorer;
