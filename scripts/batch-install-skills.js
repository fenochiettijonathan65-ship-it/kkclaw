// 批量安装热门技能 - 不分类,先堆数量!
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const ProgressReporter = require('../utils/progress-reporter');

// ClawdHub 热门技能列表 (基于下载量排序)
const popularSkills = [
    // 超高人气 (500+)
    'memory-setup',      // 2032下载
    'reddit-scraper',    // 748下载
    'google-slides',     // 595下载
    'desktop-control',   // 597下载
    'mailchimp',        // 541下载
    'klaviyo',          // 537下载
    'google-play',      // 531下载
    'firecrawler',      // 443下载
    
    // 高人气 (200-500)
    'serpapi',          // 310下载
    'affiliatematic',   // 270下载
    'camelcamelcamel-alerts', // 244下载
    'instagram-marketing',    // 239下载
    'deep-scraper',     // 226下载
    'scrappa-skill',    // 194下载
    'buy-anything',     // 187下载
    'notion-cli',       // 140下载
    
    // 中等人气 (50-200)
    'project-orchestrator', // 83下载 - 多Agent协作!
    'emotion-state',    // 75下载
    'tardis',          // 69下载
    'qmd-1-0-0',       // 62下载 - 本地搜索
    'torch-market',    // 55下载
    'mantis-manager',  // 50下载
    
    // 新兴技能
    'abstract-onboard', // 24下载
    'side-peace',      // 20下载 - 安全密钥传递
    'gemini-web-search', // 26下载
    'arya-reminders',  // 16下载
    'postiz-ext',      // 16下载
    
    // 电商套装 (已安装但保留)
    'product-description-generator',
    'review-summarizer',
    'price-tracker',
    
    // 实用工具
    'svg-draw',
    'imap-idle',
    'openclaw-wallet'
];

async function batchInstall() {
    const reporter = new ProgressReporter();
    
    // 检查已安装
    const installedSkills = new Set();
    try {
        const { stdout } = await execAsync('ls "C:\\Users\\zhouk\\openclaw-data\\skills" -Name', { shell: 'powershell.exe' });
        stdout.split('\n').forEach(line => {
            const skill = line.trim();
            if (skill) installedSkills.add(skill);
        });
    } catch (err) {
        console.log('检查已安装技能失败,继续安装');
    }
    
    // 过滤已安装的
    const toInstall = popularSkills.filter(s => !installedSkills.has(s));
    
    console.log(`📦 总计: ${popularSkills.length} 个技能`);
    console.log(`✅ 已安装: ${installedSkills.size} 个`);
    console.log(`⬇️ 待安装: ${toInstall.length} 个`);
    
    if (toInstall.length === 0) {
        reporter.complete('所有技能已安装!');
        return;
    }
    
    reporter.startTask(`批量安装 ${toInstall.length} 个技能`, toInstall);
    
    const results = {
        success: [],
        failed: [],
        skipped: []
    };
    
    for (let i = 0; i < toInstall.length; i++) {
        const skill = toInstall[i];
        const percent = Math.round(((i + 1) / toInstall.length) * 100);
        
        reporter.progress(`[${i+1}/${toInstall.length}] 安装 ${skill}...`, percent);
        
        try {
            const cmd = `npx clawhub@latest install ${skill}`;
            const { stdout, stderr } = await execAsync(cmd, { 
                timeout: 120000,
                cwd: __dirname,
                shell: 'cmd.exe'
            });
            
            console.log(`✅ ${skill} 安装成功`);
            results.success.push(skill);
            
        } catch (err) {
            console.error(`❌ ${skill} 安装失败:`, err.message.substring(0, 100));
            results.failed.push(skill);
        }
        
        // 延迟避免API限流
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const summary = `
🎉 批量安装完成!

✅ 成功: ${results.success.length}/${toInstall.length}
❌ 失败: ${results.failed.length}
📦 总技能数: ${installedSkills.size + results.success.length}

现在我变强了! 🦞💪
    `.trim();
    
    reporter.complete(summary);
    
    console.log('\n成功安装:');
    results.success.forEach(s => console.log(`  ✅ ${s}`));
    
    if (results.failed.length > 0) {
        console.log('\n失败:');
        results.failed.forEach(s => console.log(`  ❌ ${s}`));
    }
    
    return results;
}

batchInstall().catch(err => {
    console.error('批量安装出错:', err);
    process.exit(1);
});
