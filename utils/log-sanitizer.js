// 日志脱敏工具
class LogSanitizer {
    /**
     * 脱敏消息数组（用于 API 请求日志）
     */
    static sanitizeMessages(messages) {
        if (!Array.isArray(messages)) return messages;

        return messages.map(msg => ({
            role: msg.role,
            content: msg.content ? `[${msg.content.length} chars]` : undefined,
            ...(msg.name && { name: msg.name })
        }));
    }

    /**
     * 脱敏单条消息
     */
    static sanitizeMessage(message) {
        if (!message) return '[empty]';
        const preview = message.substring(0, 50);
        return message.length > 50 ? `${preview}... [${message.length} chars total]` : preview;
    }

    /**
     * 脱敏对象（移除敏感字段）
     */
    static sanitizeObject(obj, sensitiveKeys = ['token', 'password', 'apiKey', 'secret']) {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = { ...obj };
        for (const key of sensitiveKeys) {
            if (key in sanitized) {
                sanitized[key] = '[REDACTED]';
            }
        }
        return sanitized;
    }
}

module.exports = LogSanitizer;
