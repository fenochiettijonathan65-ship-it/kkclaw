// 安全存储模块 - 推荐使用环境变量保护敏感信息
// 根据 OpenClaw 官方文档：https://docs.openclaw.ai/gateway/configuration
// 配置文件应使用 ${ENV_VAR} 引用环境变量，而不是修改字段结构

const fs = require('fs');

class SecureStorage {
    /**
     * 获取 token（从配置文件读取，支持环境变量引用）
     * @param {string} configPath - 配置文件路径
     * @returns {string|null} token
     */
    static getSecureToken(configPath) {
        if (!fs.existsSync(configPath)) return null;

        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return config.gateway?.auth?.token || null;
        } catch (err) {
            console.error('⚠️ 读取 token 失败:', err.message);
            return null;
        }
    }

    /**
     * 推荐的安全配置方式：
     *
     * 1. 在配置文件中使用环境变量引用：
     *    {
     *      "gateway": {
     *        "auth": {
     *          "token": "${OPENCLAW_GATEWAY_TOKEN}"
     *        }
     *      }
     *    }
     *
     * 2. 在 ~/.openclaw/.env 中设置：
     *    OPENCLAW_GATEWAY_TOKEN=your-secret-token
     *
     * 3. OpenClaw 会自动读取并替换环境变量
     */
}

module.exports = SecureStorage;
