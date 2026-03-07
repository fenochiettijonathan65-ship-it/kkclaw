const fs = require('fs');
const path = require('path');
const pathResolver = require('./openclaw-path-resolver');
const SafeConfigLoader = require('./safe-config-loader');

const PLUGIN_SESSION_REGEX = /(lark|feishu|discord|telegram|tg):/i;

function isPluginSessionKey(key) {
    return PLUGIN_SESSION_REGEX.test(String(key || ''));
}

function parsePidFromLock(content) {
    const text = String(content || '').trim();
    if (!text) return null;

    const patterns = [
        /pid\s*[:=]\s*(\d+)/i,
        /"pid"\s*:\s*(\d+)/i,
        /^(\d+)$/m
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const parsed = Number.parseInt(match[1], 10);
            if (Number.isInteger(parsed) && parsed > 0) return parsed;
        }
    }

    return null;
}

function isProcessAlive(pid) {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (err) {
        return err && err.code === 'EPERM';
    }
}

function safeUnlink(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch {
        return false;
    }
    return false;
}

function writeJsonAtomic(filePath, data) {
    const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
}

function inspectLock(lockPath, options = {}) {
    const lockStaleMs = Number.isFinite(options.lockStaleMs) ? options.lockStaleMs : 120000;
    const unknownPidStaleMs = Number.isFinite(options.unknownPidStaleMs) ? options.unknownPidStaleMs : 15000;
    const selfPidStaleMs = Number.isFinite(options.selfPidStaleMs) ? options.selfPidStaleMs : 5000;

    if (!fs.existsSync(lockPath)) {
        return {
            exists: false,
            stale: false,
            ageMs: 0,
            pid: null,
            pidAlive: false,
            reason: null
        };
    }

    let ageMs = 0;
    let content = '';
    try {
        const stats = fs.statSync(lockPath);
        ageMs = Date.now() - stats.mtimeMs;
    } catch {
        ageMs = lockStaleMs + 1;
    }

    try {
        content = fs.readFileSync(lockPath, 'utf8');
    } catch {
        content = '';
    }

    const pid = parsePidFromLock(content);
    const pidAlive = pid ? isProcessAlive(pid) : false;

    let stale = false;
    let reason = null;

    if (!pid) {
        stale = ageMs >= unknownPidStaleMs;
        reason = stale ? 'missing_pid' : 'missing_pid_recent';
    } else if (!pidAlive) {
        stale = true;
        reason = 'pid_not_alive';
    } else if (pid === process.pid && ageMs >= selfPidStaleMs) {
        stale = true;
        reason = 'self_stale';
    } else if (ageMs >= lockStaleMs) {
        stale = true;
        reason = 'age_timeout';
    }

    return {
        exists: true,
        stale,
        ageMs,
        pid,
        pidAlive,
        reason
    };
}

function cleanupPluginSessions(options = {}) {
    const agentId = options.agentId || 'main';
    const force = Boolean(options.force);
    const removeIndex = options.removeIndex !== false;
    const sessionDir = pathResolver.getSessionsDir(agentId);
    const sessionFile = pathResolver.getSessionsFilePath(agentId);

    const result = {
        success: true,
        deletedSessions: 0,
        removedLocks: 0,
        skippedLocked: 0,
        indexRemoved: 0,
        details: [],
        errors: []
    };

    if (!fs.existsSync(sessionFile)) return result;

    let sessionsData = {};
    try {
        sessionsData = SafeConfigLoader.load(sessionFile, {});
    } catch (err) {
        result.success = false;
        result.errors.push(`读取 sessions.json 失败: ${err.message}`);
        return result;
    }

    const updatedSessions = { ...sessionsData };
    let indexChanged = false;

    for (const [key, value] of Object.entries(sessionsData)) {
        if (!isPluginSessionKey(key) || !value?.sessionId) continue;

        const sessionId = value.sessionId;
        const sessionPath = path.join(sessionDir, `${sessionId}.jsonl`);
        const lockPath = `${sessionPath}.lock`;
        const lockInfo = inspectLock(lockPath, options);

        if (lockInfo.exists && !force && !lockInfo.stale) {
            result.skippedLocked++;
            result.details.push({
                key,
                sessionId,
                status: 'locked',
                pid: lockInfo.pid,
                ageMs: lockInfo.ageMs
            });
            continue;
        }

        if (lockInfo.exists && (force || lockInfo.stale)) {
            if (safeUnlink(lockPath)) {
                result.removedLocks++;
            }
        }

        let sessionDeleted = false;
        try {
            if (fs.existsSync(sessionPath)) {
                sessionDeleted = safeUnlink(sessionPath);
                if (sessionDeleted) {
                    result.deletedSessions++;
                } else {
                    result.errors.push(`删除会话失败: ${sessionId}`);
                }
            }
        } catch (err) {
            result.errors.push(`删除会话异常 ${sessionId}: ${err.message}`);
        }

        if (removeIndex && Object.prototype.hasOwnProperty.call(updatedSessions, key)) {
            delete updatedSessions[key];
            indexChanged = true;
            result.indexRemoved++;
        }

        result.details.push({
            key,
            sessionId,
            status: sessionDeleted ? 'deleted' : 'index_cleared'
        });
    }

    if (removeIndex && indexChanged) {
        try {
            writeJsonAtomic(sessionFile, updatedSessions);
        } catch (err) {
            result.success = false;
            result.errors.push(`写回 sessions.json 失败: ${err.message}`);
        }
    }

    return result;
}

function cleanupStaleLocks(options = {}) {
    const agentId = options.agentId || 'main';
    const sessionDir = pathResolver.getSessionsDir(agentId);
    const result = {
        success: true,
        removedLocks: 0,
        skippedLocks: 0,
        details: [],
        errors: []
    };

    if (!fs.existsSync(sessionDir)) return result;

    let files = [];
    try {
        files = fs.readdirSync(sessionDir).filter(name => name.endsWith('.jsonl.lock'));
    } catch (err) {
        result.success = false;
        result.errors.push(`读取 session 目录失败: ${err.message}`);
        return result;
    }

    const force = Boolean(options.force);
    for (const file of files) {
        const lockPath = path.join(sessionDir, file);
        const lockInfo = inspectLock(lockPath, options);
        if (!lockInfo.exists) continue;

        if (force || lockInfo.stale) {
            if (safeUnlink(lockPath)) {
                result.removedLocks++;
                result.details.push({ file, action: 'removed', reason: lockInfo.reason, pid: lockInfo.pid });
            } else {
                result.errors.push(`删除锁失败: ${file}`);
            }
        } else {
            result.skippedLocks++;
            result.details.push({ file, action: 'kept', pid: lockInfo.pid, ageMs: lockInfo.ageMs });
        }
    }

    return result;
}

module.exports = {
    isPluginSessionKey,
    inspectLock,
    cleanupPluginSessions,
    cleanupStaleLocks
};
