// cc-switch 同步工具
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

class CCSwitchSync {
    constructor() {
        this.dbPath = path.join(os.homedir(), '.cc-switch', 'cc-switch.db');
        this.sqlite3Path = 'C:\\Users\\zhouk\\AppData\\Local\\Android\\Sdk\\platform-tools\\sqlite3.exe';
    }

    /**
     * 从cc-switch读取Claude提供商
     */
    syncProviders() {
        try {
            const query = `SELECT id, name, settings_config FROM providers WHERE app_type='claude';`;
            const cmd = `"${this.sqlite3Path}" "${this.dbPath}" "${query}"`;

            const output = execSync(cmd, { encoding: 'utf8', windowsHide: true });
            const lines = output.trim().split('\n');

            const providers = [];
            for (const line of lines) {
                const [id, name, configJson] = line.split('|');
                if (!configJson) continue;

                try {
                    const config = JSON.parse(configJson);
                    const token = config.env?.ANTHROPIC_AUTH_TOKEN;
                    const baseUrl = config.env?.ANTHROPIC_BASE_URL;

                    if (token && baseUrl) {
                        providers.push({
                            name: name.trim(),
                            apiKey: token,
                            baseURL: baseUrl,
                            models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5']
                        });
                    }
                } catch (e) {
                    console.warn(`解析provider配置失败: ${name}`, e.message);
                }
            }

            return providers;
        } catch (error) {
            console.error('同步cc-switch失败:', error.message);
            return [];
        }
    }
}

module.exports = new CCSwitchSync();
