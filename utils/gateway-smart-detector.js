// Gateway 智能检测器
class GatewaySmartDetector {
  constructor(gatewayHost = 'http://127.0.0.1:18789') {
    this.gatewayHost = gatewayHost;
    this.lastKnownState = 'unknown';
    this.stateCache = {
      timestamp: 0,
      ttl: 2000
    };
  }

  setGatewayHost(gatewayHost) {
    this.gatewayHost = gatewayHost;
    this.clearCache();
  }

  // 智能检测（使用缓存）
  async detectState() {
    if (Date.now() - this.stateCache.timestamp < this.stateCache.ttl) {
      return this.lastKnownState;
    }

    const state = await this._fastPing();
    this.lastKnownState = state;
    this.stateCache.timestamp = Date.now();

    return state;
  }

  // 快速 ping（500ms 超时）
  async _fastPing() {
    try {
      const response = await fetch(this.gatewayHost, {
        method: 'HEAD',
        signal: AbortSignal.timeout(500)
      });
      if (response.status === 405) {
        const fallback = await fetch(this.gatewayHost, {
          method: 'GET',
          signal: AbortSignal.timeout(500)
        });
        return fallback.status < 500 ? 'ready' : 'error';
      }
      return response.status < 500 ? 'ready' : 'error';
    } catch {
      return 'offline';
    }
  }

  // 快速检查（不使用缓存）
  async quickCheck(timeoutMs = 2000) {
    try {
      let response = await fetch(this.gatewayHost, {
        method: 'HEAD',
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (response.status === 405) {
        response = await fetch(this.gatewayHost, {
          method: 'GET',
          signal: AbortSignal.timeout(timeoutMs)
        });
      }
      return response.status < 500;
    } catch {
      return false;
    }
  }

  // 等待 Gateway 就绪（优化版）
  async waitReady(timeoutMs = 3000) {
    const startTime = Date.now();
    const checkInterval = 300;

    while (Date.now() - startTime < timeoutMs) {
      const ready = await this.quickCheck(500);
      if (ready) return true;

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    return false;
  }

  clearCache() {
    this.stateCache.timestamp = 0;
    this.lastKnownState = 'unknown';
  }
}

module.exports = GatewaySmartDetector;
