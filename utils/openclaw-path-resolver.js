// OpenClaw 路径智能解析模块
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

class OpenClawPathResolver {
    constructor() {
        this._cachedPath = null;
        this._cachedBinary = null;
        this._cachedNodeBinary = null;
        this._cachedConfigDir = null;
    }

    _candidateScriptPaths(baseDir) {
        return [
            path.join(baseDir, 'dist', 'index.js'),
            path.join(baseDir, 'openclaw.mjs'),
        ];
    }

    /**
     * 智能查找 openclaw 安装路径
     * @returns {string|null} openclaw/dist/index.js 的完整路径，未找到返回 null
     */
    findOpenClawPath() {
        if (this._cachedPath) return this._cachedPath;

        const home = process.env.HOME || process.env.USERPROFILE;
        let openclawPath = null;

        // 方法1: pnpm root -g（需要添加 PNPM_HOME 到 PATH）
        if (!openclawPath) {
            try {
                const pnpmHome = process.env.PNPM_HOME || path.join(home, 'AppData', 'Local', 'pnpm');
                const env = { ...process.env, PATH: `${pnpmHome};${process.env.PATH}` };
                const pnpmRoot = execSync('pnpm root -g', { encoding: 'utf8', windowsHide: true, env }).trim();
                const p = path.join(pnpmRoot, 'openclaw', 'dist', 'index.js');
                if (fs.existsSync(p)) openclawPath = p;
            } catch (e) { /* fallback */ }
        }

        // 方法2: npm root -g
        if (!openclawPath) {
            try {
                const npmRoot = execSync('npm root -g', { encoding: 'utf8', windowsHide: true }).trim();
                const p = path.join(npmRoot, 'openclaw', 'dist', 'index.js');
                if (fs.existsSync(p)) openclawPath = p;
            } catch (e) { /* fallback */ }
        }

        // 方法3: yarn global dir
        if (!openclawPath) {
            try {
                const yarnDir = execSync('yarn global dir', { encoding: 'utf8', windowsHide: true }).trim();
                const p = path.join(yarnDir, 'node_modules', 'openclaw', 'dist', 'index.js');
                if (fs.existsSync(p)) openclawPath = p;
            } catch (e) { /* fallback */ }
        }

        // 方法4: where/which openclaw
        if (!openclawPath) {
            try {
                const cmd = process.platform === 'win32' ? 'where openclaw' : 'which openclaw';
                const binPath = execSync(cmd, { encoding: 'utf8', windowsHide: true }).trim().split('\n')[0];
                const binDir = path.dirname(binPath);
                const candidates = [
                    ...this._candidateScriptPaths(path.join(binDir, '..', 'node_modules', 'openclaw')),
                    ...this._candidateScriptPaths(path.join(binDir, '..', 'lib', 'node_modules', 'openclaw')),
                ];
                try {
                    const realBinPath = fs.realpathSync(binPath);
                    const realBinDir = path.dirname(realBinPath);
                    candidates.push(...this._candidateScriptPaths(path.join(realBinDir, '..')));
                } catch (e) { /* fallback */ }
                for (const c of candidates) {
                    if (fs.existsSync(path.normalize(c))) {
                        openclawPath = path.normalize(c);
                        break;
                    }
                }
            } catch (e) { /* fallback */ }
        }

        // 方法5: 常见安装路径
        if (!openclawPath) {
            const altPaths = [
                ...this._candidateScriptPaths(path.join(home, 'AppData', 'Local', 'pnpm', 'global', '5', 'node_modules', 'openclaw')),
                ...this._candidateScriptPaths(path.join(home, '.local', 'share', 'pnpm', 'global', '5', 'node_modules', 'openclaw')),
                ...this._candidateScriptPaths(path.join(home, '.npm-global', 'node_modules', 'openclaw')),
                ...this._candidateScriptPaths(path.join(home, 'AppData', 'Roaming', 'npm', 'node_modules', 'openclaw')),
                path.join('/usr/local/lib/node_modules/openclaw/dist/index.js'),
                path.join('/usr/local/lib/node_modules/openclaw/openclaw.mjs'),
                path.join('/usr/lib/node_modules/openclaw/dist/index.js'),
                path.join('/usr/lib/node_modules/openclaw/openclaw.mjs'),
                path.join('/opt/homebrew/lib/node_modules/openclaw/dist/index.js'),
                path.join('/opt/homebrew/lib/node_modules/openclaw/openclaw.mjs'),
                ...this._candidateScriptPaths(path.join(home, '.nvm/versions/node', process.version, 'lib/node_modules/openclaw')),
            ];
            for (const alt of altPaths) {
                if (fs.existsSync(alt)) {
                    openclawPath = alt;
                    break;
                }
            }
        }

        this._cachedPath = openclawPath;
        return openclawPath;
    }

    /**
     * 查找 openclaw 可执行文件路径
     * @returns {string|null}
     */
    findOpenClawBinary() {
        if (this._cachedBinary) return this._cachedBinary;

        const home = process.env.HOME || process.env.USERPROFILE;
        const candidates = process.platform === 'win32'
            ? [
                path.join(home || '', 'AppData', 'Roaming', 'npm', 'openclaw.cmd'),
                path.join(home || '', 'AppData', 'Local', 'pnpm', 'openclaw.cmd'),
            ]
            : [
                '/opt/homebrew/bin/openclaw',
                '/usr/local/bin/openclaw',
                path.join(home || '', '.local', 'bin', 'openclaw'),
                path.join(home || '', '.npm-global', 'bin', 'openclaw'),
            ];

        for (const candidate of candidates) {
            if (candidate && fs.existsSync(candidate)) {
                this._cachedBinary = candidate;
                return candidate;
            }
        }

        try {
            const cmd = process.platform === 'win32' ? 'where openclaw' : 'which openclaw';
            const binPath = execSync(cmd, { encoding: 'utf8', windowsHide: true }).trim().split('\n')[0];
            if (binPath && fs.existsSync(binPath)) {
                this._cachedBinary = binPath;
                return binPath;
            }
        } catch (e) { /* fallback */ }

        return null;
    }

    /**
     * 查找 node 可执行文件路径
     * @returns {string|null}
     */
    findNodeBinary() {
        if (this._cachedNodeBinary) return this._cachedNodeBinary;

        const home = process.env.HOME || process.env.USERPROFILE;
        const candidates = process.platform === 'win32'
            ? [
                path.join(home || '', 'AppData', 'Roaming', 'npm', 'node.exe'),
                'C:\\Program Files\\nodejs\\node.exe',
            ]
            : [
                '/opt/homebrew/bin/node',
                '/usr/local/bin/node',
                '/usr/bin/node',
                path.join(home || '', '.nvm', 'versions', 'node', process.version, 'bin', 'node'),
            ];

        for (const candidate of candidates) {
            if (candidate && fs.existsSync(candidate)) {
                this._cachedNodeBinary = candidate;
                return candidate;
            }
        }

        try {
            const cmd = process.platform === 'win32' ? 'where node' : 'which node';
            const binPath = execSync(cmd, { encoding: 'utf8', windowsHide: true }).trim().split('\n')[0];
            if (binPath && fs.existsSync(binPath)) {
                this._cachedNodeBinary = binPath;
                return binPath;
            }
        } catch (e) { /* fallback */ }

        return null;
    }

    /**
     * 获取 openclaw 配置目录
     * @returns {string} ~/.openclaw 目录路径
     */
    getConfigDir() {
        if (this._cachedConfigDir) return this._cachedConfigDir;
        const home = process.env.HOME || process.env.USERPROFILE;
        this._cachedConfigDir = path.join(home, '.openclaw');
        return this._cachedConfigDir;
    }

    /**
     * 获取 openclaw 配置文件路径
     * @returns {string} ~/.openclaw/openclaw.json 路径
     */
    getConfigPath() {
        return path.join(this.getConfigDir(), 'openclaw.json');
    }

    /**
     * 获取 agent sessions 目录
     * @param {string} agentId - agent ID，默认 'main'
     * @returns {string} ~/.openclaw/agents/{agentId}/sessions 路径
     */
    getSessionsDir(agentId = 'main') {
        return path.join(this.getConfigDir(), 'agents', agentId, 'sessions');
    }

    /**
     * 获取 sessions.json 文件路径
     * @param {string} agentId - agent ID，默认 'main'
     * @returns {string} sessions.json 文件路径
     */
    getSessionsFilePath(agentId = 'main') {
        return path.join(this.getSessionsDir(agentId), 'sessions.json');
    }

    /**
     * 获取缓存目录
     * @returns {string} ~/.openclaw/cache 路径
     */
    getCacheDir() {
        return path.join(this.getConfigDir(), 'cache');
    }

    /**
     * 获取 session 锁文件路径
     * @param {string} sessionId - session ID
     * @param {string} agentId - agent ID，默认 'main'
     * @returns {string} session.lock 文件路径
     */
    getSessionLockPath(sessionId, agentId = 'main') {
        return path.join(this.getSessionsDir(agentId), `${sessionId}.jsonl.lock`);
    }

    /**
     * 清除缓存（用于测试或强制重新检测）
     */
    clearCache() {
        this._cachedPath = null;
        this._cachedBinary = null;
        this._cachedNodeBinary = null;
        this._cachedConfigDir = null;
    }
}

// 导出单例
module.exports = new OpenClawPathResolver();
