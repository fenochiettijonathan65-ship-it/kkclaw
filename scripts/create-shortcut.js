// 创建桌面快捷方式
const { execFile } = require('child_process');
const path = require('path');

const homePath = process.env.USERPROFILE || process.env.HOME;
const desktopPath = path.join(homePath, 'Desktop');
const shortcutPath = path.join(desktopPath, 'Claw 桌面宠物.lnk');
const projectPath = path.resolve(__dirname, '..');
const iconPath = path.join(projectPath, 'icon.ico');
const electronExe = path.join(projectPath, 'node_modules', 'electron', 'dist', 'electron.exe');

function escapePowerShellSingleQuote(value) {
    return value.replace(/'/g, "''");
}

// 使用 PowerShell 创建快捷方式
const psScript = [
    '$WshShell = New-Object -ComObject WScript.Shell',
    `$Shortcut = $WshShell.CreateShortcut('${escapePowerShellSingleQuote(shortcutPath)}')`,
    `if (Test-Path '${escapePowerShellSingleQuote(electronExe)}') {`,
    `  $Shortcut.TargetPath = '${escapePowerShellSingleQuote(electronExe)}'`,
    `  $Shortcut.Arguments = '${escapePowerShellSingleQuote(projectPath)}'`,
    `} else {`,
    "  $Shortcut.TargetPath = 'cmd.exe'",
    `  $Shortcut.Arguments = '/c cd /d "${escapePowerShellSingleQuote(projectPath)}" && npm start'`,
    `}`,
    `$Shortcut.WorkingDirectory = '${escapePowerShellSingleQuote(projectPath)}'`,
    "$Shortcut.Description = 'Claw 桌面宠物 - OpenClaw AI 助手'",
    `$Shortcut.IconLocation = '${escapePowerShellSingleQuote(iconPath)}'`,
    '$Shortcut.WindowStyle = 7',
    '$Shortcut.Save()',
    `Write-Host '快捷方式已创建: ${escapePowerShellSingleQuote(shortcutPath)}'`
].join('; ');

console.log('正在创建桌面快捷方式...');

execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], (err, stdout) => {
    if (err) {
        console.error('创建失败:', err.message);
        console.log('\n手动创建方法:');
        console.log('1. 右键桌面 -> 新建 -> 快捷方式');
        console.log(`2. 位置输入: cmd /c "cd /d \"${projectPath}\" && npm start"`);
        console.log('3. 名称输入: Claw 桌面宠物');
        process.exitCode = 1;
        return;
    }
    if (stdout) {
        console.log(stdout.trim());
    }
    console.log('✅ 桌面快捷方式创建成功!');
});
