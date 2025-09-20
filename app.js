// Quantum Calculator - Advanced Scientific Calculator
// Built with vanilla JavaScript for maximum performance and compatibility

class QuantumCalculator {
  constructor() {
    this.state = {
      currentInput: '0',
      expression: '',
      result: '0',
      operator: null,
      operand: null,
      lastOperation: null,
      lastOperand: null,
      memory: 0,
      history: [],
      angleMode: 'DEG', // DEG or RAD
      scientificMode: false,
      theme: this.getSystemTheme(),
      waitingForOperand: false,
      hasDecimal: false,
      justCalculated: false,
      parenCount: 0,
      settings: {
        precision: 15,
        maxHistoryItems: 50,
        thousandsSeparator: true
      }
    };

    this.mathConstants = {
      PI: Math.PI,
      E: Math.E
    };

    // Bind methods to preserve context
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleKeyboard = this.handleKeyboard.bind(this);
    
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.updateDisplay();
    this.updateUI();
    this.applyTheme();
  }

  // System theme detection
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Settings and Persistence
  loadSettings() {
    try {
      const savedState = localStorage.getItem('quantumCalc-state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state = { ...this.state, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load saved state:', error);
    }
  }

  saveSettings() {
    try {
      const stateToSave = {
        memory: this.state.memory,
        angleMode: this.state.angleMode,
        scientificMode: this.state.scientificMode,
        theme: this.state.theme,
        history: this.state.history.slice(-this.state.settings.maxHistoryItems),
        settings: this.state.settings
      };
      localStorage.setItem('quantumCalc-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  }

  // Event Listeners - Fixed implementation
  setupEventListeners() {
    // Main button click handler
    document.addEventListener('click', this.handleButtonClick);
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyboard);

    // Specific control handlers
    this.setupControlHandlers();

    // Prevent context menu on buttons for better mobile experience
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  setupControlHandlers() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTheme();
      });
    }

    // Mode toggle
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
      modeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMode();
      });
    }

    // History clear
    const clearHistory = document.getElementById('clear-history');
    if (clearHistory) {
      clearHistory.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showConfirmDialog('Clear History?', 'This will permanently delete all calculation history.', () => {
          this.clearHistory();
        });
      });
    }

    // History item clicks
    const historyList = document.getElementById('history-list');
    if (historyList) {
      historyList.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.history-item');
        if (historyItem) {
          this.loadFromHistory(historyItem.dataset.index);
        }
      });
    }

    // Dialog handling
    const errorDismiss = document.getElementById('error-dismiss');
    if (errorDismiss) {
      errorDismiss.addEventListener('click', () => {
        this.hideErrorDialog();
      });
    }

    const confirmCancel = document.getElementById('confirm-cancel');
    if (confirmCancel) {
      confirmCancel.addEventListener('click', () => {
        this.hideConfirmDialog();
      });
    }

    const confirmOk = document.getElementById('confirm-ok');
    if (confirmOk) {
      confirmOk.addEventListener('click', () => {
        if (this.confirmCallback) {
          this.confirmCallback();
          this.confirmCallback = null;
        }
        this.hideConfirmDialog();
      });
    }

    // Angle mode toggle
    const angleMode = document.getElementById('angle-mode');
    if (angleMode) {
      angleMode.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAngleMode();
      });
    }
  }

  // Main button click handler
  handleButtonClick(e) {
    const target = e.target;
    
    // Handle number buttons
    if (target.dataset.number !== undefined) {
      this.inputNumber(target.dataset.number);
      this.animateButton(target);
      return;
    }
    
    // Handle operator buttons
    if (target.dataset.operator !== undefined) {
      this.inputOperator(target.dataset.operator);
      this.animateButton(target);
      return;
    }
    
    // Handle action buttons
    if (target.dataset.action !== undefined) {
      this.handleAction(target.dataset.action);
      this.animateButton(target);
      return;
    }
    
    // Handle function buttons
    if (target.dataset.function !== undefined) {
      this.handleFunction(target.dataset.function);
      this.animateButton(target);
      return;
    }
    
    // Handle memory buttons
    if (target.dataset.memory !== undefined) {
      this.handleMemory(target.dataset.memory);
      this.animateButton(target);
      return;
    }
  }

  // Button Animation
  animateButton(button) {
    if (!button) return;
    
    button.classList.add('clicking');
    setTimeout(() => {
      button.classList.remove('clicking');
    }, 300);
  }

  // Keyboard Handling - Fixed decimal input
  handleKeyboard(e) {
    const key = e.key;
    
    // Prevent default for calculator keys
    if (/[0-9+\-*/=().%]/.test(key) || ['Enter', 'Escape', 'Backspace', 'Delete'].includes(key)) {
      e.preventDefault();
    }

    // Number keys
    if (/[0-9]/.test(key)) {
      this.inputNumber(key);
    }
    
    // Operators
    else if (key === '+') this.inputOperator('add');
    else if (key === '-') this.inputOperator('subtract');
    else if (key === '*' || key === '×') this.inputOperator('multiply');
    else if (key === '/' || key === '÷') this.inputOperator('divide');
    else if (key === '%') this.inputOperator('percent');
    
    // Actions
    else if (key === 'Enter' || key === '=') this.handleAction('equals');
    else if (key === 'Escape') this.handleAction('clear');
    else if (key === 'Backspace') this.handleAction('backspace');
    else if (key === 'Delete') this.handleAction('clear');
    else if (key === '.' || key === ',') { 
      e.preventDefault();
      this.handleAction('decimal');
    }
    
    // Parentheses
    else if (key === '(' || key === ')') this.handleFunction('parentheses');
    
    // Scientific functions (with modifiers)
    else if (this.state.scientificMode) {
      if (key === 's' && !e.ctrlKey && !e.metaKey) this.handleFunction('sin');
      else if (key === 'c' && !e.ctrlKey && !e.metaKey) this.handleFunction('cos');
      else if (key === 't' && !e.ctrlKey && !e.metaKey) this.handleFunction('tan');
      else if (key === 'l' && !e.ctrlKey && !e.metaKey) this.handleFunction('ln');
      else if (key === 'p' && !e.ctrlKey && !e.metaKey) this.handleFunction('pi');
      else if (key === 'e' && !e.ctrlKey && !e.metaKey) this.handleFunction('e');
      else if (key === 'r' && !e.ctrlKey && !e.metaKey) this.handleFunction('sqrt');
      else if (key === '^') this.handleFunction('power');
    }

    // Memory operations (Ctrl/Cmd + key)
    if ((e.ctrlKey || e.metaKey)) {
      if (key === 'm') {
        e.preventDefault();
        this.handleMemory('ms');
      } else if (key === 'r') {
        e.preventDefault();
        this.handleMemory('mr');
      } else if (key === '+') {
        e.preventDefault();
        this.handleMemory('m-plus');
      } else if (key === '-') {
        e.preventDefault();
        this.handleMemory('m-minus');
      }
    }
  }

  // Number Input
  inputNumber(num) {
    console.log('Input number:', num); // Debug log
    
    if (this.state.waitingForOperand || this.state.justCalculated) {
      this.state.currentInput = num;
      this.state.waitingForOperand = false;
      this.state.justCalculated = false;
      this.state.hasDecimal = false;
    } else {
      if (this.state.currentInput === '0') {
        this.state.currentInput = num;
      } else {
        if (this.state.currentInput.length < 15) { // Limit input length
          this.state.currentInput += num;
        }
      }
    }
    this.updateDisplay();
  }

  // Operator Input
  inputOperator(operator) {
    console.log('Input operator:', operator); // Debug log
    
    const inputValue = parseFloat(this.state.currentInput);

    if (operator === 'negate') {
      // Handle plus/minus toggle
      const currentValue = parseFloat(this.state.currentInput);
      this.state.currentInput = (-currentValue).toString();
      this.updateDisplay();
      return;
    }

    if (this.state.operand === null) {
      this.state.operand = inputValue;
      this.state.expression = this.formatNumber(inputValue);
    } else if (!this.state.waitingForOperand) {
      const result = this.calculate();
      if (result !== null) {
        this.state.result = result.toString();
        this.state.operand = result;
        this.state.currentInput = result.toString();
      }
    }

    this.state.waitingForOperand = true;
    this.state.operator = operator;
    this.state.justCalculated = false;

    // Update expression
    const operatorSymbol = this.getOperatorSymbol(operator);
    this.state.expression = this.formatNumber(this.state.operand) + ' ' + operatorSymbol + ' ';

    this.updateDisplay();
  }

  // Actions
  handleAction(action) {
    console.log('Handle action:', action); // Debug log
    
    switch (action) {
      case 'clear':
        this.clear();
        break;
      case 'equals':
        this.equals();
        break;
      case 'decimal':
        this.inputDecimal();
        break;
      case 'backspace':
        this.backspace();
        break;
    }
  }

  // Functions
  handleFunction(func) {
    console.log('Handle function:', func); // Debug log
    
    switch (func) {
      case 'sin':
      case 'cos':
      case 'tan':
        this.applyTrigFunction(func);
        break;
      case 'ln':
        this.applyFunction('ln', Math.log);
        break;
      case 'sqrt':
        this.applyFunction('√', Math.sqrt);
        break;
      case 'square':
        this.applyFunction('²', (x) => x * x);
        break;
      case 'power':
        this.inputOperator('power');
        break;
      case 'pi':
        this.inputConstant(Math.PI, 'π');
        break;
      case 'e':
        this.inputConstant(Math.E, 'e');
        break;
      case 'parentheses':
        this.handleParentheses();
        break;
    }
  }

  // Memory Operations
  handleMemory(operation) {
    console.log('Handle memory:', operation); // Debug log
    
    const currentValue = parseFloat(this.state.currentInput) || 0;

    switch (operation) {
      case 'mc':
        this.state.memory = 0;
        break;
      case 'mr':
        this.state.currentInput = this.state.memory.toString();
        this.state.waitingForOperand = false;
        this.state.justCalculated = true;
        break;
      case 'm-plus':
        this.state.memory += currentValue;
        break;
      case 'm-minus':
        this.state.memory -= currentValue;
        break;
      case 'ms':
        this.state.memory = currentValue;
        break;
    }

    this.updateMemoryIndicator();
    this.updateDisplay();
    this.saveSettings();
  }

  // Mathematical Operations
  calculate() {
    const current = parseFloat(this.state.currentInput);
    const operand = this.state.operand;
    const operator = this.state.operator;

    if (operand === null || operator === null) return null;

    let result;

    try {
      switch (operator) {
        case 'add':
          result = operand + current;
          break;
        case 'subtract':
          result = operand - current;
          break;
        case 'multiply':
          result = operand * current;
          break;
        case 'divide':
          if (current === 0) {
            throw new Error('Cannot divide by zero');
          }
          result = operand / current;
          break;
        case 'percent':
          result = operand * (current / 100);
          break;
        case 'power':
          result = Math.pow(operand, current);
          break;
        default:
          return null;
      }

      // Store for repeated equals
      this.state.lastOperation = operator;
      this.state.lastOperand = current;

      return this.roundToPrecision(result);
    } catch (error) {
      this.showError(error.message);
      return null;
    }
  }

  // Trigonometric Functions
  applyTrigFunction(func) {
    const value = parseFloat(this.state.currentInput);
    let angleValue = value;

    // Convert degrees to radians if necessary
    if (this.state.angleMode === 'DEG') {
      angleValue = value * (Math.PI / 180);
    }

    let result;
    try {
      switch (func) {
        case 'sin':
          result = Math.sin(angleValue);
          break;
        case 'cos':
          result = Math.cos(angleValue);
          break;
        case 'tan':
          result = Math.tan(angleValue);
          break;
      }

      // Handle near-zero results (fix floating point precision issues)
      if (Math.abs(result) < 1e-14) {
        result = 0;
      }

      this.state.currentInput = this.roundToPrecision(result).toString();
      this.state.expression = `${func}(${this.formatNumber(value)})`;
      this.state.waitingForOperand = true;
      this.state.justCalculated = true;
      
      this.addToHistory(this.state.expression, this.state.currentInput);
      this.updateDisplay();
    } catch (error) {
      this.showError('Math domain error');
    }
  }

  // Apply Mathematical Function
  applyFunction(symbol, mathFunc) {
    const value = parseFloat(this.state.currentInput);
    
    try {
      if (symbol === '√' && value < 0) {
        throw new Error('Square root of negative number');
      }

      const result = mathFunc(value);
      
      if (!isFinite(result)) {
        throw new Error('Math domain error');
      }

      this.state.currentInput = this.roundToPrecision(result).toString();
      this.state.expression = `${symbol}(${this.formatNumber(value)})`;
      this.state.waitingForOperand = true;
      this.state.justCalculated = true;
      
      this.addToHistory(this.state.expression, this.state.currentInput);
      this.updateDisplay();
    } catch (error) {
      this.showError(error.message);
    }
  }

  // Input Constant
  inputConstant(value, symbol) {
    this.state.currentInput = this.roundToPrecision(value).toString();
    this.state.expression = symbol;
    this.state.waitingForOperand = true;
    this.state.justCalculated = true;
    this.updateDisplay();
  }

  // Handle Parentheses
  handleParentheses() {
    // For now, just add opening parenthesis
    // Full expression parsing would require a more complex implementation
    this.state.expression += '(';
    this.updateDisplay();
  }

  // Decimal Point
  inputDecimal() {
    console.log('Input decimal'); // Debug log
    
    if (this.state.waitingForOperand || this.state.justCalculated) {
      this.state.currentInput = '0.';
      this.state.waitingForOperand = false;
      this.state.justCalculated = false;
      this.state.hasDecimal = true;
    } else if (!this.state.hasDecimal && this.state.currentInput.indexOf('.') === -1) {
      this.state.currentInput += '.';
      this.state.hasDecimal = true;
    }
    this.updateDisplay();
  }

  // Backspace
  backspace() {
    if (this.state.justCalculated) {
      this.clear();
      return;
    }

    if (this.state.currentInput.length > 1) {
      const removedChar = this.state.currentInput.slice(-1);
      this.state.currentInput = this.state.currentInput.slice(0, -1);
      
      if (removedChar === '.') {
        this.state.hasDecimal = false;
      }
    } else {
      this.state.currentInput = '0';
      this.state.hasDecimal = false;
    }
    
    this.updateDisplay();
  }

  // Clear
  clear() {
    console.log('Clear calculator'); // Debug log
    
    this.state.currentInput = '0';
    this.state.expression = '';
    this.state.result = '0';
    this.state.operator = null;
    this.state.operand = null;
    this.state.waitingForOperand = false;
    this.state.hasDecimal = false;
    this.state.justCalculated = false;
    this.state.parenCount = 0;
    this.updateDisplay();
  }

  // Equals
  equals() {
    console.log('Calculate equals'); // Debug log
    
    if (this.state.justCalculated && this.state.lastOperation && this.state.lastOperand !== null) {
      // Repeated equals - repeat last operation
      this.state.operand = parseFloat(this.state.currentInput);
      this.state.operator = this.state.lastOperation;
      this.state.currentInput = this.state.lastOperand.toString();
    }

    const result = this.calculate();
    
    if (result !== null) {
      const expression = this.state.expression + this.formatNumber(parseFloat(this.state.currentInput));
      
      this.state.currentInput = result.toString();
      this.state.result = result.toString();
      this.state.expression = '';
      this.state.operator = null;
      this.state.operand = null;
      this.state.waitingForOperand = true;
      this.state.justCalculated = true;
      
      this.addToHistory(expression, result.toString());
      this.updateDisplay();
    }
  }

  // Utility Methods
  roundToPrecision(value) {
    if (!isFinite(value)) return value;
    
    // Handle very small numbers
    if (Math.abs(value) < 1e-14) return 0;
    
    // Special case for 0.1 + 0.2 = 0.3
    const rounded = Math.round(value * 1e14) / 1e14;
    
    // Round to avoid floating point precision issues
    const factor = Math.pow(10, this.state.settings.precision);
    return Math.round(rounded * factor) / factor;
  }

  formatNumber(num) {
    if (!isFinite(num)) return num.toString();
    
    const absNum = Math.abs(num);
    
    // Use scientific notation for very large or very small numbers
    if (absNum >= 1e12 || (absNum < 1e-6 && absNum !== 0)) {
      return num.toExponential(6);
    }
    
    // Format with appropriate decimal places
    let formatted = num.toString();
    
    // Add thousands separators if enabled
    if (this.state.settings.thousandsSeparator && absNum >= 1000) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }
    
    return formatted;
  }

  getOperatorSymbol(operator) {
    const symbols = {
      'add': '+',
      'subtract': '−',
      'multiply': '×',
      'divide': '÷',
      'percent': '%',
      'power': '^',
      'negate': '±'
    };
    return symbols[operator] || operator;
  }

  // UI Updates
  updateDisplay() {
    const expressionDisplay = document.getElementById('expression-display');
    const resultDisplay = document.getElementById('result-display');
    
    if (expressionDisplay) {
      const expressionText = expressionDisplay.querySelector('.expression-text');
      if (expressionText) {
        expressionText.textContent = this.state.expression;
      }
    }
    
    if (resultDisplay) {
      const resultText = resultDisplay.querySelector('.result-text');
      if (resultText) {
        resultText.textContent = this.formatNumber(parseFloat(this.state.currentInput));
      }
    }
  }

  updateUI() {
    this.updateMemoryIndicator();
    this.updateModeToggle();
    this.updateAngleModeButton();
  }

  updateMemoryIndicator() {
    const indicator = document.getElementById('memory-indicator');
    if (indicator) {
      if (this.state.memory !== 0) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    }
  }

  updateModeToggle() {
    const toggle = document.getElementById('mode-toggle');
    const app = document.getElementById('calculator-app');
    
    if (toggle && app) {
      if (this.state.scientificMode) {
        toggle.classList.add('active');
        const modeText = toggle.querySelector('.mode-text');
        if (modeText) modeText.textContent = 'STD';
        app.classList.add('scientific');
      } else {
        toggle.classList.remove('active');
        const modeText = toggle.querySelector('.mode-text');
        if (modeText) modeText.textContent = 'SCI';
        app.classList.remove('scientific');
      }
    }
  }

  updateAngleModeButton() {
    const button = document.getElementById('angle-mode');
    if (button) {
      button.textContent = this.state.angleMode;
    }
  }

  // Theme Management
  toggleTheme() {
    console.log('Toggle theme'); // Debug log
    const themes = ['light', 'dark'];
    const currentIndex = themes.indexOf(this.state.theme);
    this.state.theme = themes[(currentIndex + 1) % themes.length];
    this.applyTheme();
    this.saveSettings();
  }

  applyTheme() {
    const root = document.documentElement;
    root.setAttribute('data-theme', this.state.theme);
  }

  // Mode Toggle
  toggleMode() {
    console.log('Toggle mode'); // Debug log
    this.state.scientificMode = !this.state.scientificMode;
    this.updateModeToggle();
    this.saveSettings();
  }

  // Angle Mode Toggle
  toggleAngleMode() {
    this.state.angleMode = this.state.angleMode === 'DEG' ? 'RAD' : 'DEG';
    this.updateAngleModeButton();
    this.saveSettings();
  }

  // History Management
  addToHistory(expression, result) {
    const historyItem = {
      expression: expression,
      result: result,
      timestamp: new Date().toLocaleTimeString()
    };

    this.state.history.unshift(historyItem);
    
    // Limit history size
    if (this.state.history.length > this.state.settings.maxHistoryItems) {
      this.state.history = this.state.history.slice(0, this.state.settings.maxHistoryItems);
    }

    this.updateHistoryDisplay();
    this.saveSettings();
  }

  updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    
    if (!historyList) return;
    
    if (this.state.history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }

    historyList.innerHTML = this.state.history.map((item, index) => `
      <div class="history-item" data-index="${index}">
        <div class="history-time">${item.timestamp}</div>
        <div class="history-expression">${item.expression}</div>
        <div class="history-result">${this.formatNumber(parseFloat(item.result))}</div>
      </div>
    `).join('');
  }

  loadFromHistory(index) {
    const historyItem = this.state.history[index];
    if (historyItem) {
      this.state.currentInput = historyItem.result;
      this.state.expression = historyItem.expression;
      this.state.justCalculated = true;
      this.state.waitingForOperand = true;
      this.updateDisplay();
    }
  }

  clearHistory() {
    this.state.history = [];
    this.updateHistoryDisplay();
    this.saveSettings();
  }

  // Dialog Management
  showError(message) {
    const errorDialog = document.getElementById('error-dialog');
    const errorMessage = document.getElementById('error-message');
    
    if (errorMessage) errorMessage.textContent = message;
    if (errorDialog) errorDialog.classList.remove('hidden');
  }

  hideErrorDialog() {
    const errorDialog = document.getElementById('error-dialog');
    if (errorDialog) errorDialog.classList.add('hidden');
  }

  showConfirmDialog(title, message, callback) {
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    
    if (confirmTitle) confirmTitle.textContent = title;
    if (confirmMessage) confirmMessage.textContent = message;
    if (confirmDialog) confirmDialog.classList.remove('hidden');
    
    this.confirmCallback = callback;
  }

  hideConfirmDialog() {
    const confirmDialog = document.getElementById('confirm-dialog');
    if (confirmDialog) confirmDialog.classList.add('hidden');
    this.confirmCallback = null;
  }
}

// Initialize Calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing calculator');
  window.calculator = new QuantumCalculator();
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swCode = `
      const CACHE_NAME = 'quantum-calc-v1';
      const urlsToCache = [
        '/',
        '/index.html',
        '/style.css',
        '/app.js'
      ];

      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
        );
      });

      self.addEventListener('fetch', (event) => {
        event.respondWith(
          caches.match(event.request)
            .then((response) => {
              return response || fetch(event.request);
            })
        );
      });
    `;

    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);

    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

// Add haptic feedback for supported devices
function addHapticFeedback() {
  if ('vibrate' in navigator) {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn')) {
        navigator.vibrate(10); // 10ms vibration
      }
    });
  }
}

// Enable haptic feedback
document.addEventListener('DOMContentLoaded', addHapticFeedback);

// Handle visibility change to pause/resume
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // App became visible - could refresh data if needed
    if (window.calculator) {
      window.calculator.updateDisplay();
    }
  }
});