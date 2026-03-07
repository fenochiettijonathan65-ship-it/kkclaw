// 飞书文件上传系统 - 支持图片和文件
const fs = require('fs');
const path = require('path');
const https = require('https');

class LarkUploader {
    constructor() {
        this.uploadDir = path.join(__dirname, 'screenshots');
        // 从 OpenClaw 配置读取飞书凭证
        this.config = this.loadConfig();
        this.appId = this.config.appId;
        this.appSecret = this.config.appSecret;
        this.accessToken = null;
        this.tokenExpiry = 0;
    }

    loadConfig() {
        try {
            const pathResolver = require('./utils/openclaw-path-resolver');
            const SafeConfigLoader = require('./utils/safe-config-loader');
            const configPath = pathResolver.getConfigPath();
            const config = SafeConfigLoader.load(configPath, {});
            const lark = config.channels?.lark || {};
            const feishu = config.channels?.feishu || {};
            return {
                appId: lark.appId || feishu.appId,
                appSecret: lark.appSecret || feishu.appSecret
            };
        } catch (err) {
            console.error('❌ 读取飞书配置失败:', err.message);
            return { appId: null, appSecret: null };
        }
    }

    /**
     * 获取飞书 access_token
     */
    async getAccessToken() {
        // 检查缓存的 token 是否有效
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!this.config.appId || !this.config.appSecret) {
            throw new Error('飞书 appId 或 appSecret 未配置');
        }

        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                app_id: this.config.appId,
                app_secret: this.config.appSecret
            });

            const options = {
                hostname: 'open.feishu.cn',
                path: '/open-apis/auth/v3/tenant_access_token/internal',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (result.code === 0) {
                            this.accessToken = result.tenant_access_token;
                            this.tokenExpiry = Date.now() + (result.expire - 300) * 1000;
                            console.log('✅ 飞书 token 获取成功');
                            resolve(this.accessToken);
                        } else {
                            reject(new Error(`飞书认证失败: ${result.msg}`));
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    /**
     * 上传图片到飞书获取 image_key
     */
    async uploadImage(filepath) {
        const token = await this.getAccessToken();
        const imageBuffer = fs.readFileSync(filepath);
        const filename = path.basename(filepath);

        return new Promise((resolve, reject) => {
            const boundary = '----FormBoundary' + Math.random().toString(16).slice(2);

            const header = Buffer.from(
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="image_type"\r\n\r\n` +
                `message\r\n` +
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n` +
                `Content-Type: image/png\r\n\r\n`
            );
            const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
            const body = Buffer.concat([header, imageBuffer, footer]);

            const options = {
                hostname: 'open.feishu.cn',
                path: '/open-apis/im/v1/images',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': body.length
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.code === 0) {
                            console.log('✅ 图片上传成功, image_key:', result.data.image_key);
                            resolve(result.data.image_key);
                        } else {
                            reject(new Error(`图片上传失败: ${result.msg}`));
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    /**
     * 🆕 上传文件到飞书获取 file_key
     * @param {string} filepath - 文件路径
     * @param {string} fileType - 文件类型 (stream/pdf/doc等)
     */
    async uploadFile(filepath, fileType = 'stream') {
        const token = await this.getAccessToken();
        const fileBuffer = fs.readFileSync(filepath);
        const filename = path.basename(filepath);
        const fileSize = fileBuffer.length;

        console.log(`📤 上传文件: ${filename} (${(fileSize / 1024).toFixed(2)} KB)`);

        return new Promise((resolve, reject) => {
            const boundary = '----FormBoundary' + Math.random().toString(16).slice(2);

            // 构建 multipart/form-data
            const header = Buffer.from(
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="file_type"\r\n\r\n` +
                `${fileType}\r\n` +
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="file_name"\r\n\r\n` +
                `${filename}\r\n` +
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
                `Content-Type: application/octet-stream\r\n\r\n`
            );
            const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
            const body = Buffer.concat([header, fileBuffer, footer]);

            const options = {
                hostname: 'open.feishu.cn',
                path: '/open-apis/im/v1/files',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': body.length
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.code === 0) {
                            console.log('✅ 文件上传成功, file_key:', result.data.file_key);
                            resolve(result.data.file_key);
                        } else {
                            reject(new Error(`文件上传失败: ${result.msg}`));
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    /**
     * 🆕 智能检测文件类型
     */
    detectFileType(filepath) {
        const ext = path.extname(filepath).toLowerCase();
        
        // 图片类型
        if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext)) {
            return 'image';
        }
        
        // PDF
        if (ext === '.pdf') {
            return 'pdf';
        }
        
        // Office 文档
        if (['.doc', '.docx'].includes(ext)) {
            return 'doc';
        }
        
        if (['.xls', '.xlsx'].includes(ext)) {
            return 'xls';
        }
        
        if (['.ppt', '.pptx'].includes(ext)) {
            return 'ppt';
        }
        
        // 其他文件
        return 'stream';
    }

    /**
     * 🆕 通用上传方法 - 自动识别图片/文件
     * @param {string} filepath - 文件路径
     * @param {string} caption - 说明文字
     */
    async uploadToLark(filepath, caption = '') {
        try {
            console.log('📤 准备上传到飞书:', filepath);

            // 检查文件是否存在
            if (!fs.existsSync(filepath)) {
                throw new Error(`文件不存在: ${filepath}`);
            }

            const fileType = this.detectFileType(filepath);
            const filename = path.basename(filepath);
            const fileSize = fs.statSync(filepath).size;

            console.log(`📊 文件信息: ${filename}, 类型: ${fileType}, 大小: ${(fileSize / 1024).toFixed(2)} KB`);

            let key;
            if (fileType === 'image') {
                // 图片使用 uploadImage
                key = await this.uploadImage(filepath);
            } else {
                // 其他文件使用 uploadFile
                key = await this.uploadFile(filepath, fileType);
            }

            // 复制文件到 OpenClaw 数据目录
            const openclawDataDir = path.join(process.env.HOME || process.env.USERPROFILE, 'openclaw-data');
            const destFilename = fileType === 'image' ? 'screen.png' : `upload_${filename}`;
            const destPath = path.join(openclawDataDir, destFilename);
            fs.copyFileSync(filepath, destPath);
            console.log('📁 文件已复制到:', destPath);

            // 保存元数据
            const metaPath = path.join(openclawDataDir, 'last_upload.json');
            fs.writeFileSync(metaPath, JSON.stringify({
                filepath: destPath,
                originalPath: filepath,
                filename: filename,
                fileType: fileType,
                fileSize: fileSize,
                key: key,
                caption: caption,
                timestamp: Date.now()
            }, null, 2));

            console.log('✅ 飞书上传成功');
            console.log(`📎 ${fileType === 'image' ? 'image_key' : 'file_key'}:`, key);
            console.log('📝 说明:', caption);

            return {
                success: true,
                filepath: destPath,
                filename: filename,
                fileType: fileType,
                fileSize: fileSize,
                key: key,
                caption: caption
            };

        } catch (err) {
            console.error('❌ 上传飞书失败:', err.message);
            return {
                success: false,
                error: err.message,
                filepath: filepath
            };
        }
    }

}

module.exports = LarkUploader;
