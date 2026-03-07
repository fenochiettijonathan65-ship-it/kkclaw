# Mood ↔ Message/TTS 集成计划（heartbeat 启动）

目标：让桌面龙虾在消息往返与语音播报时自动切换情绪，提升状态可感知性。

## 触发映射（v0）
- 收到用户消息：`thinking`
- 开始生成回复：`talking`
- 语音播报进行中：`talking`
- 回复成功结束：`happy`
- Gateway/请求异常：`offline` 或 `sleepy`

## 最小改造点
1. `main.js`
   - 在消息入口/回复完成/异常分支发送情绪事件
   - 在 voiceSystem.speak 前后发送情绪事件
2. `index.html` / 渲染脚本
   - 监听 IPC 的 `mood-change`，更新球体样式
3. 监控联动
   - Guardian `unhealthy` -> `offline`
   - Guardian `recovered` -> `happy`

## 验收标准
- 正常对话至少触发：thinking -> talking -> happy
- 人为断开 gateway 可触发 offline，并恢复后回到 happy
- 不影响现有回复链路（无崩溃、无阻塞）
