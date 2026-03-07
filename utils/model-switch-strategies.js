// 模型切换策略
class SwitchStrategy {
  async execute(targetModel, previousModel, controller) {
    throw new Error('Must implement execute()');
  }
}

// 快速切换策略（乐观更新）
class FastSwitchStrategy extends SwitchStrategy {
  async execute(targetModel, previousModel, controller) {
    // 立即更新 UI
    controller.updateCurrentModel(targetModel);

    // 后台异步写配置
    setImmediate(() => {
      controller.writeConfigAsync(targetModel).catch(err => {
        console.warn('配置写入失败:', err.message);
      });
    });

    return { success: true, mode: 'fast' };
  }
}

// 安全切换策略（验证完整）
class SafeSwitchStrategy extends SwitchStrategy {
  async execute(targetModel, previousModel, controller) {
    // 写配置
    const writeOk = await controller.writeConfig(targetModel);
    if (!writeOk) {
      return { success: false, mode: 'safe', reason: 'write_failed' };
    }

    // 先验证配置（这是切换是否生效的硬条件）
    const verified = await controller.verifyConfig(targetModel.id);
    if (!verified) {
      return { success: false, mode: 'safe', reason: 'verify_failed' };
    }

    // 再检查 Gateway（仅作为可用性提示，不再作为硬失败）
    let gatewayOk = await controller.quickCheckGateway(2500);
    if (!gatewayOk && typeof controller.waitForGatewayReady === 'function') {
      gatewayOk = await controller.waitForGatewayReady(7000);
    }

    if (!gatewayOk) {
      return {
        success: true,
        mode: 'safe',
        warning: 'gateway_slow_reload'
      };
    }

    return { success: true, mode: 'safe' };
  }
}

// 智能切换策略（自适应）
class SmartSwitchStrategy extends SwitchStrategy {
  async execute(targetModel, previousModel, controller) {
    const history = controller.getSwitchHistory();
    const successRate = history.getSuccessRate(targetModel.id);

    // 成功率高则使用快速策略
    if (successRate > 0.95 && history.getCount(targetModel.id) >= 3) {
      return new FastSwitchStrategy().execute(targetModel, previousModel, controller);
    }

    // 否则使用安全策略
    return new SafeSwitchStrategy().execute(targetModel, previousModel, controller);
  }
}

const STRATEGIES = {
  fast: FastSwitchStrategy,
  safe: SafeSwitchStrategy,
  smart: SmartSwitchStrategy
};

function getStrategy(type = 'smart') {
  const Strategy = STRATEGIES[type] || SmartSwitchStrategy;
  return new Strategy();
}

module.exports = { SwitchStrategy, FastSwitchStrategy, SafeSwitchStrategy, SmartSwitchStrategy, getStrategy };
