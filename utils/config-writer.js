// 配置写入优化器（防抖 + 批量写入）
const fs = require('fs');

class ConfigWriter {
  constructor(configPath) {
    this.configPath = configPath;
    this.pendingWrites = new Map();
    this.writeTimer = null;
    this.writing = false;
    this.debounceDelay = 500;
  }

  // 防抖写入
  scheduleWrite(key, value) {
    this.pendingWrites.set(key, value);

    clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(() => {
      this._flushWrites();
    }, this.debounceDelay);
  }

  // 立即写入（用于切换）
  async writeImmediately(updates) {
    if (this.writing) {
      await this._waitForWrite();
    }

    this.writing = true;
    try {
      await this._doWrite(updates);
      return true;
    } catch (err) {
      console.error('配置写入失败:', err.message);
      return false;
    } finally {
      this.writing = false;
    }
  }

  async _flushWrites() {
    if (this.pendingWrites.size === 0) return;

    const writes = new Map(this.pendingWrites);
    this.pendingWrites.clear();

    this.writing = true;
    try {
      await this._batchWrite(writes);
    } finally {
      this.writing = false;
    }
  }

  async _doWrite(updates) {
    const SafeConfigLoader = require('./safe-config-loader');
    const config = SafeConfigLoader.load(this.configPath, {});

    // 应用更新
    for (const [key, value] of Object.entries(updates)) {
      this._setNestedValue(config, key, value);
    }

    // 原子写入
    const tmpPath = this.configPath + '.tmp';
    await fs.promises.writeFile(tmpPath, JSON.stringify(config, null, 2), 'utf8');
    await fs.promises.rename(tmpPath, this.configPath);
  }

  async _batchWrite(writes) {
    const updates = Object.fromEntries(writes);
    await this._doWrite(updates);
  }

  _setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  async _waitForWrite() {
    while (this.writing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

module.exports = ConfigWriter;
