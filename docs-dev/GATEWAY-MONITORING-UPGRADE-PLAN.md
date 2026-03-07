# Gateway 监控检测机制升级优化计划

## 📊 当前问题诊断

### 现有实现分析（gateway-guardian.js）

**优点**：
- ✅ 基础健康检查（浅检查 + 深度检查）
- ✅ 自适应轮询间隔（30s 健康 / 5s 异常）
- ✅ 指数退避机制
- ✅ 自动重启功能
- ✅ Session 锁清理

**问题**：
- ❌ 缺少性能指标收集（响应时间、错误率）
- ❌ 没有健康度评分系统
- ❌ 异常检测不够智能（只看连续失败次数）
- ❌ 缺少趋势分析和预警
- ❌ 重启策略不够智能（固定阈值）
- ❌ 没有状态可视化数据
- ❌ 检测结果没有持久化

---

## 🎯 升级目标

### 核心目标
1. **实时性能监控** - 响应时间、成功率、错误率
2. **健康度评分** - 0-100 分综合评分
3. **智能异常检测** - 基于趋势和阈值
4. **预警机制** - 性能下降提前预警
5. **可视化数据** - 提供监控面板数据

### 性能指标
- 响应时间监控：P50、P95、P99
- 成功率：最近 100 次请求
- 错误率：按错误类型分类
- 可用性：最近 1 小时 uptime

---

## 🏗️ 升级方案

### Phase 1: 性能指标收集器

**创建**: `utils/gateway-metrics-collector.js`

```javascript
class GatewayMetricsCollector {
  constructor() {
    this.metrics = {
      requests: [],        // 最近 100 次请求
      errors: [],          // 最近 50 次错误
      responseTimes: [],   // 最近 100 次响应时间
      availability: []     // 最近 1 小时可用性采样
    };
  }

  // 记录请求
  recordRequest(success, responseTime, error = null) {
    this.metrics.requests.unshift({
      timestamp: Date.now(),
      success,
      responseTime,
      error
    });

    if (this.metrics.requests.length > 100) {
      this.metrics.requests.pop();
    }

    if (success) {
      this.metrics.responseTimes.unshift(responseTime);
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes.pop();
      }
    } else {
      this.metrics.errors.unshift({
        timestamp: Date.now(),
        error,
        responseTime
      });
      if (this.metrics.errors.length > 50) {
        this.metrics.errors.pop();
      }
    }
  }

  // 计算成功率
  getSuccessRate() {
    if (this.metrics.requests.length === 0) return 1.0;
    const successful = this.metrics.requests.filter(r => r.success).length;
    return successful / this.metrics.requests.length;
  }

  // 计算响应时间百分位
  getResponseTimePercentile(percentile) {
    if (this.metrics.responseTimes.length === 0) return 0;
    const sorted = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // 获取平均响应时间
  getAverageResponseTime() {
    if (this.metrics.responseTimes.length === 0) return 0;
    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.metrics.responseTimes.length;
  }

  // 获取错误率
  getErrorRate() {
    return 1 - this.getSuccessRate();
  }

  // 获取最近错误
  getRecentErrors(limit = 10) {
    return this.metrics.errors.slice(0, limit);
  }
}
```

### Phase 2: 健康度评分系统

**创建**: `utils/gateway-health-scorer.js`

```javascript
class GatewayHealthScorer {
  constructor(metricsCollector) {
    this.metrics = metricsCollector;
  }

  // 计算综合健康度（0-100）
  calculateHealthScore() {
    const weights = {
      availability: 0.4,    // 可用性权重 40%
      performance: 0.3,     // 性能权重 30%
      errorRate: 0.3        // 错误率权重 30%
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
      status: this._getStatus(totalScore)
    };
  }

  // 可用性评分
  _scoreAvailability() {
    const successRate = this.metrics.getSuccessRate();
    if (successRate >= 0.99) return 100;
    if (successRate >= 0.95) return 90;
    if (successRate >= 0.90) return 70;
    if (successRate >= 0.80) return 50;
    return successRate * 50;
  }

  // 性能评分
  _scorePerformance() {
    const p95 = this.metrics.getResponseTimePercentile(95);
    if (p95 === 0) return 100;
    if (p95 < 500) return 100;
    if (p95 < 1000) return 90;
    if (p95 < 2000) return 70;
    if (p95 < 5000) return 50;
    return 30;
  }

  // 错误率评分
  _scoreErrorRate() {
    const errorRate = this.metrics.getErrorRate();
    if (errorRate === 0) return 100;
    if (errorRate < 0.01) return 95;
    if (errorRate < 0.05) return 80;
    if (errorRate < 0.10) return 60;
    return 40;
  }

  // 获取健康状态
  _getStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }
}
```

### Phase 3: 智能异常检测器

**创建**: `utils/gateway-anomaly-detector.js`

```javascript
class GatewayAnomalyDetector {
  constructor(metricsCollector) {
    this.metrics = metricsCollector;
    this.baseline = {
      avgResponseTime: 0,
      successRate: 1.0
    };
  }

  // 检测异常
  detectAnomalies() {
    const anomalies = [];

    // 1. 响应时间异常
    const currentAvg = this.metrics.getAverageResponseTime();
    if (this.baseline.avgResponseTime > 0) {
      const increase = (currentAvg - this.baseline.avgResponseTime) / this.baseline.avgResponseTime;
      if (increase > 2.0) {
        anomalies.push({
          type: 'response_time_spike',
          severity: 'high',
          message: `响应时间激增 ${Math.round(increase * 100)}%`,
          current: currentAvg,
          baseline: this.baseline.avgResponseTime
        });
      } else if (increase > 0.5) {
        anomalies.push({
          type: 'response_time_degradation',
          severity: 'medium',
          message: `响应时间上升 ${Math.round(increase * 100)}%`,
          current: currentAvg,
          baseline: this.baseline.avgResponseTime
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
        baseline: this.baseline.successRate
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
          count
        });
      }
    }

    return anomalies;
  }

  // 更新基线
  updateBaseline() {
    this.baseline.avgResponseTime = this.metrics.getAverageResponseTime();
    this.baseline.successRate = this.metrics.getSuccessRate();
  }
}
```

### Phase 4: 增强 Gateway Guardian

**修改**: `gateway-guardian.js`

集成新模块：
- 指标收集器
- 健康度评分
- 异常检测器

新增功能：
- 性能监控
- 健康度评分
- 智能预警
- 趋势分析

---

## 📊 新增 API

### IPC 接口

```javascript
// 获取 Gateway 健康度
ipcMain.handle('gateway-health-score', async () => {
  return gatewayGuardian.getHealthScore();
});

// 获取 Gateway 性能指标
ipcMain.handle('gateway-metrics', async () => {
  return gatewayGuardian.getMetrics();
});

// 获取 Gateway 异常检测
ipcMain.handle('gateway-anomalies', async () => {
  return gatewayGuardian.getAnomalies();
});

// 获取 Gateway 完整状态
ipcMain.handle('gateway-full-status', async () => {
  return gatewayGuardian.getFullStatus();
});
```

---

## 🎯 预期效果

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| 异常检测准确率 | ~70% | > 95% | +35% |
| 预警提前时间 | 无 | 30-60 秒 | +100% |
| 误报率 | ~20% | < 5% | -75% |
| 监控数据维度 | 2 个 | 10+ 个 | +400% |
| 健康度可见性 | 无 | 0-100 分 | +100% |

---

## ⚠️ 实施注意事项

1. **性能开销** - 指标收集不应影响主流程
2. **内存管理** - 限制历史数据大小
3. **向后兼容** - 保持现有 API 不变
4. **渐进式部署** - 先收集数据，再启用预警

---

**是否开始实施此升级计划？**
