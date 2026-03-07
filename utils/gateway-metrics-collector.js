// Gateway 性能指标收集器
class GatewayMetricsCollector {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      responseTimes: [],
      availability: []
    };
    this.maxRequests = 100;
    this.maxErrors = 50;
    this.maxResponseTimes = 100;
  }

  recordRequest(success, responseTime, error = null) {
    this.metrics.requests.unshift({
      timestamp: Date.now(),
      success,
      responseTime,
      error
    });

    if (this.metrics.requests.length > this.maxRequests) {
      this.metrics.requests.pop();
    }

    if (success && responseTime) {
      this.metrics.responseTimes.unshift(responseTime);
      if (this.metrics.responseTimes.length > this.maxResponseTimes) {
        this.metrics.responseTimes.pop();
      }
    } else if (!success) {
      this.metrics.errors.unshift({
        timestamp: Date.now(),
        error: error || 'unknown',
        responseTime
      });
      if (this.metrics.errors.length > this.maxErrors) {
        this.metrics.errors.pop();
      }
    }
  }

  recordAvailability(available) {
    this.metrics.availability.unshift({
      timestamp: Date.now(),
      available
    });

    // 保留最近 1 小时数据（假设每 30 秒采样一次）
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics.availability = this.metrics.availability.filter(
      a => a.timestamp > oneHourAgo
    );
  }

  getSuccessRate() {
    if (this.metrics.requests.length === 0) return 1.0;
    const successful = this.metrics.requests.filter(r => r.success).length;
    return successful / this.metrics.requests.length;
  }

  getErrorRate() {
    return 1 - this.getSuccessRate();
  }

  getAverageResponseTime() {
    if (this.metrics.responseTimes.length === 0) return 0;
    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.responseTimes.length);
  }

  getResponseTimePercentile(percentile) {
    if (this.metrics.responseTimes.length === 0) return 0;
    const sorted = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  getRecentErrors(limit = 10) {
    return this.metrics.errors.slice(0, limit);
  }

  getUptime() {
    if (this.metrics.availability.length === 0) return 1.0;
    const available = this.metrics.availability.filter(a => a.available).length;
    return available / this.metrics.availability.length;
  }

  getMetricsSummary() {
    return {
      successRate: this.getSuccessRate(),
      errorRate: this.getErrorRate(),
      avgResponseTime: this.getAverageResponseTime(),
      p50: this.getResponseTimePercentile(50),
      p95: this.getResponseTimePercentile(95),
      p99: this.getResponseTimePercentile(99),
      uptime: this.getUptime(),
      totalRequests: this.metrics.requests.length,
      totalErrors: this.metrics.errors.length,
      recentErrors: this.getRecentErrors(5)
    };
  }

  clear() {
    this.metrics = {
      requests: [],
      errors: [],
      responseTimes: [],
      availability: []
    };
  }
}

module.exports = GatewayMetricsCollector;
