// IPC 输入验证器
class IPCValidator {
    /**
     * 验证 provider 配置
     */
    static validateProvider(data) {
        const errors = [];
        const baseUrl = this._pickBaseUrl(data);

        if (!data.name || typeof data.name !== 'string') {
            errors.push('name 必须是非空字符串');
        }

        if (!baseUrl || typeof baseUrl !== 'string') {
            errors.push('baseUrl 必须是非空字符串');
        } else if (!this.isValidURL(baseUrl)) {
            errors.push('baseUrl 必须是有效的 URL');
        }

        if (data.apiKey !== undefined && typeof data.apiKey !== 'string') {
            errors.push('apiKey 必须是字符串');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * 验证 URL 格式
     */
    static isValidURL(str) {
        try {
            const url = new URL(str);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * 验证 PID
     */
    static validatePID(pid) {
        const parsed = parseInt(pid, 10);
        return Number.isInteger(parsed) && parsed > 0;
    }

    /**
     * 兼容 baseUrl / baseURL 两种写法
     */
    static _pickBaseUrl(data) {
        if (!data || typeof data !== 'object') return '';
        if (typeof data.baseUrl === 'string') return data.baseUrl;
        if (typeof data.baseURL === 'string') return data.baseURL;
        return '';
    }
}

module.exports = IPCValidator;
