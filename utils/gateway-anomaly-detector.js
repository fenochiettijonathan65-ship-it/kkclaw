// Gateway 异常检测器
class GatewayAnomalyDetector {
  constructor(metricsCollector) {
    this.metrics = metricsCollector;
    this.baseline = {
      avgResponseTime: 0,
      successRate: 1.0,
      lastUpdate: 0
    };
    this.anomalies = [];
    this.maxAnomalies = 20;
  }

  detectAnomalies() {
    const anomalies = [];
    const now = Date.now();

    // 1. 响应时间异常
    const currentAvg = this.metrics.getAverageResponseTime();
    if (this.baseline.avgResponseTime > 0 && currentAvg > 0) {
      const increase = (currentAvg - this.baseline.avgResponseTime) / this.baseline.avgResponseTime;
      if (increase > 2.0) {
        anomalies.push({
          type: 'response_time_spike',
          severity: 'high',
          message: `响应时间激增 ${Math.round(increase * 100)}%`,
          current: currentAvg,
          baseline: this.baseline.avgResponseTime,
          timestamp: now
        });
      } else if (increase > 0.5) {
        anomalies.push({
          type: 'response_time_degradation',
          severity: 'medium',
          message: `响应时间上升 ${Math.round(increase * 100)}%`,
          current: currentAvg,
          baseline: this.baseline.avgResponseTime,
          timestamp: now
        });
      }
    }

    // 2. 成功率下降
    const currentSuccessRate = this.metrics.getSuccessRate();
    if (currentSuccessRate < 0.95 && this.baseline.successRate >= 0.95) {
      anomalies.push({
        type: 'success_rate_drop',
        severity: currentSuccessRate < 0.80 ? 'high' : 'medium',
        message: `成功率下降到 ${Math.round(currentSuccessRate * 100)}%`,
        current: currentSuccessRate,
        baseline: this.baseline.successRate,
        timestamp: now
      });
    }

    // 3. 错误率激增
    const recentErrors = this.metrics.getRecentErrors(10);
    const errorTypes = {};
    recentErrors.forEach(e => {
      errorTypes[e.error] = (errorTypes[e.error] || 0) + 1;
    });

    for (const [errorType, count] of Object.entries(errorTypes)) {
      if (count >= 5) {
        anomalies.push({
          type: 'error_burst',
          severity: 'high',
          message: `${errorType} 错误频发 (${count} 次)`,
          errorType,
          count,
          timestamp: now
        });
      }
    }

    // 4. P99 响应时间过高
    const p99 = this.metrics.getResponseTimePercentile(99);
    if (p99 > 10000) {
      anomalies.push({
        type: 'p99_high',
        severity: 'medium',
        message: `P99 响应时间过高 (${p99}ms)`,
        current: p99,
        timestamp: now
      });
    }

    // 记录异常历史
    anomalies.forEach(a => {
      this.anomalies.unshift(a);
    });

    if (this.anomalies.length > this.maxAnomalies) {
      this.anomalies = this.anomalies.slice(0, this.maxAnomalies);
    }

    return anomalies;
  }

  updateBaseline() {
    const avg = this.metrics.getAverageResponseTime();
    const rate = this.metrics.getSuccessRate();

    // 只在有足够数据时更新基线
    if (avg > 0 && this.metrics.metrics.requests.length >= 10) {
      this.baseline.avgResponseTime = avg;
      this.baseline.successRate = rate;
      this.baseline.lastUpdate = Date.now();
    }
  }

  getRecentAnomalies(limit = 10) {
    return this.anomalies.slice(0, limit);
  }

  clearAnomalies() {
    this.anomalies = [];
  }
}

module.exports = GatewayAnomalyDetector;
