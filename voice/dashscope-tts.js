// 🎙️ DashScope CosyVoice TTS 模块
// 通过 cosyvoice-tts.py 调用阿里云百炼平台的 CosyVoice 语音合成
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs');

class DashScopeTTS {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.DASHSCOPE_API_KEY || '';
        this.model = options.model || 'cosyvoice-v3-plus';
        this.voice = options.voice || 'cosyvoice-v3-plus-tuantuan-28c7ca7e915943a081ab7ece12916d28';
        this.speechRate = options.speechRate || 1.1;  // 略快一点，更自然
        this.tempDir = options.tempDir || path.join(__dirname, 'temp');
        this.scriptPath = path.join(__dirname, 'cosyvoice-tts.py');
        
        this.initTempDir();
    }

    initTempDir() {
        try {
            // 如果 tempDir 是文件，删除它
            if (fs.existsSync(this.tempDir) && fs.statSync(this.tempDir).isFile()) {
                console.warn(`[DashScope TTS] ⚠️ ${this.tempDir} 是文件而非目录，正在删除`);
                fs.unlinkSync(this.tempDir);
            }
            
            // 创建目录
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }
        } catch (err) {
            console.error('[DashScope TTS] 创建临时目录失败:', err.message);
        }
    }

    /**
     * 🔊 合成语音
     * @param {string} text - 要合成的文本
     * @param {object} options - 选项 { voice, outputFile }
     * @returns {Promise<string>} 输出文件路径
     */
    async synthesize(text, options = {}) {
        const voice = options.voice || this.voice;
        const outputFile = options.outputFile || path.join(this.tempDir, `cosyvoice_${Date.now()}.mp3`);

        if (!this.apiKey) {
            throw new Error('DashScope API Key 未设置');
        }

        if (!text || !text.trim()) {
            throw new Error('文本为空');
        }

        // 转义双引号
        const safeText = text.replace(/"/g, "'").replace(/\n/g, ' ').trim();

        const cmd = `python "${this.scriptPath}" "${safeText}" -o "${outputFile}" -v ${voice} -m ${this.model} -r ${this.speechRate} -k ${this.apiKey}`;
        
        try {
            const { stdout, stderr } = await execAsync(cmd, {
                timeout: 30000,
                windowsHide: true
            });
            
            const resultPath = stdout.trim();
            if (resultPath && fs.existsSync(resultPath)) {
                const stat = fs.statSync(resultPath);
                console.log(`[DashScope TTS] ✅ 语音已保存: ${resultPath} (${(stat.size / 1024).toFixed(1)}KB)`);
                return resultPath;
            } else if (fs.existsSync(outputFile)) {
                const stat = fs.statSync(outputFile);
                console.log(`[DashScope TTS] ✅ 语音已保存: ${outputFile} (${(stat.size / 1024).toFixed(1)}KB)`);
                return outputFile;
            } else {
                throw new Error(`TTS 输出文件不存在: ${stderr || stdout}`);
            }
        } catch (err) {
            console.error('[DashScope TTS] ❌ 合成失败:', err.message);
            throw err;
        }
    }

    /**
     * 🎭 获取可用音色列表
     */
    static getVoices() {
        return {
            // 🎤 克隆音色
            'cosyvoice-v3-plus-tuantuan-28c7ca7e915943a081ab7ece12916d28': '🎤 小团团 - 克隆音色（当前使用）',
            // CosyVoice v3 萌系精选
            'longantai_v3': '龙安台 - 嗲甜台湾女',
            'longfeifei_v3': '龙菲菲 - 甜美娇气女',
            'longhua_v3': '龙华 - 元气甜美女',
            // CosyVoice v1 经典
            'longxiaochun': '龙小淳 - 甜美温柔女声',
            'longxiaoxia': '龙小夏 - 活泼元气女声',
            'longxiaobai': '龙小白 - 知性优雅女声',
            'longshu': '龙姝 - 温婉女声',
            'longwan': '龙婉 - 甜蜜女声',
            'longtong': '龙彤 - 萝莉女声',
            'longshuo': '龙硕 - 稳重男声',
            'longjing': '龙镜 - 播音男声',
            'longfei': '龙飞 - 激昂男声',
            'longyue': '龙悦 - 温暖男声',
            'longxiang': '龙翔 - 少年男声',
        };
    }
}

module.exports = DashScopeTTS;
