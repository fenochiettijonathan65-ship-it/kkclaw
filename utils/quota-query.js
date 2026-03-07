/**
 * 🎯 Quota Query — 智能识别 API 配额信息
 */

const https = require('https');

class QuotaQuery {
  constructor() {
    this.baseUrl = 'https://gptclubapi.xyz';
  }

  async _request(path, payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const options = {
        hostname: 'gptclubapi.xyz',
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (res.statusCode === 200 && result.success) {
              resolve(result.data);
            } else {
              reject(new Error(result.error || 'Request failed'));
            }
          } catch (err) {
            reject(new Error('Invalid response'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  async queryQuota(apiKey) {
    const keyData = await this._request('/apiStats/api/get-key-id', { apiKey });
    const stats = await this._request('/apiStats/api/user-stats', { apiId: keyData.id });
    return this._parseQuotaData(stats);
  }

  _parseQuotaData(data) {
    const usage = data.usage?.total || {};
    const limits = data.limits || {};

    return {
      name: data.name || 'Unknown',
      status: data.isActive ? 'active' : 'inactive',
      expiresAt: data.expiresAt,
      balance: limits.currentTotalCost || 0,
      dailyUsage: {
        cost: limits.currentDailyCost || 0,
        requests: usage.requests || 0,
        tokens: usage.tokens || 0
      },
      opusWeekly: {
        used: limits.weeklyOpusCost || 0,
        limit: limits.weeklyOpusCostLimit || 0,
        percentage: limits.weeklyOpusCostLimit > 0
          ? Math.round((limits.weeklyOpusCost / limits.weeklyOpusCostLimit) * 100)
          : 0
      }
    };
  }
}

module.exports = QuotaQuery;
