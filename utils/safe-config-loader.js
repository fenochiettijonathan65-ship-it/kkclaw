// 安全配置加载器
const fs = require('fs');

class SafeConfigLoader {
    /**
     * 安全加载 JSON 配置文件
     * @param {string} filePath - 配置文件路径
     * @param {object} defaultValue - 加载失败时的默认值
     * @returns {object} 配置对象
     */
    static load(filePath, defaultValue = {}) {
        try {
            if (!fs.existsSync(filePath)) {
                return defaultValue;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (err) {
            console.error(`⚠️ 配置加载失败 (${filePath}):`, err.message);
            return defaultValue;
        }
    }

    /**
     * 安全保存 JSON 配置文件
     */
    static save(filePath, data) {
        try {
            const dir = require('path').dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (err) {
            console.error(`⚠️ 配置保存失败 (${filePath}):`, err.message);
            return false;
        }
    }
}

module.exports = SafeConfigLoader;
