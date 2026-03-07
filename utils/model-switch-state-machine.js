// 模型切换状态机
const EventEmitter = require('events');

const SwitchState = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  SWITCHING: 'switching',
  VALIDATING: 'validating',
  SYNCING: 'syncing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ROLLING_BACK: 'rolling_back'
};

class ModelSwitchStateMachine extends EventEmitter {
  constructor() {
    super();
    this.state = SwitchState.IDLE;
    this.context = {
      targetModel: null,
      previousModel: null,
      startTime: null,
      error: null,
      strategy: 'smart'
    };
  }

  async transition(newState, context = {}) {
    const oldState = this.state;
    this.state = newState;
    this.context = { ...this.context, ...context };

    this.emit('state-change', {
      from: oldState,
      to: newState,
      context: this.context,
      progress: this.getProgress()
    });
  }

  getProgress() {
    const stateProgress = {
      [SwitchState.IDLE]: 0,
      [SwitchState.PREPARING]: 10,
      [SwitchState.SWITCHING]: 30,
      [SwitchState.VALIDATING]: 60,
      [SwitchState.SYNCING]: 80,
      [SwitchState.COMPLETED]: 100,
      [SwitchState.FAILED]: 0,
      [SwitchState.ROLLING_BACK]: 50
    };
    return stateProgress[this.state] || 0;
  }

  getState() {
    return this.state;
  }

  getContext() {
    return this.context;
  }

  reset() {
    this.state = SwitchState.IDLE;
    this.context = {
      targetModel: null,
      previousModel: null,
      startTime: null,
      error: null,
      strategy: 'smart'
    };
  }

  isIdle() {
    return this.state === SwitchState.IDLE || this.state === SwitchState.COMPLETED;
  }

  isSwitching() {
    return this.state !== SwitchState.IDLE &&
           this.state !== SwitchState.COMPLETED &&
           this.state !== SwitchState.FAILED;
  }
}

module.exports = { ModelSwitchStateMachine, SwitchState };
