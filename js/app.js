/**
 * app.js - Main application initialization and navigation
 */

const navigation = {
    currentStep: 1,
    
    /**
     * Initialize navigation
     */
    init() {
        console.log("Initializing navigation");
        this.setupEventListeners();
        this.checkUrlHash();
    },
    
    /**
     * Set up event listeners for navigation
     */
    setupEventListeners() {
        // Set up step clicks
        document.querySelectorAll('.step').forEach(step => {
            step.addEventListener('click', (e) => {
                const stepNum = parseInt(step.id.replace('step', ''));
                if (!isNaN(stepNum)) {
                    this.goToStep(stepNum);
                }
            });
        });
        
        // Step 1 -> Step 2
        const btnToStep2 = document.getElementById('btnToStep2');
        if (btnToStep2) {
            btnToStep2.addEventListener('click', () => this.goToStep(2));
        }
        
        // Step 2 -> Step 3
        const btnToStep3 = document.getElementById('btnToStep3');
        if (btnToStep3) {
            btnToStep3.addEventListener('click', () => this.goToStep(3));
        }
        
        // Step 3 -> Step 4
        const btnToStep4 = document.getElementById('btnToStep4');
        if (btnToStep4) {
            btnToStep4.addEventListener('click', () => this.goToStep(4));
        }
        
        // Step 4 -> Step 5
        const btnToStep5 = document.getElementById('btnToStep5');
        if (btnToStep5) {
            btnToStep5.addEventListener('click', () => this.goToStep(5));
        }
        
        // Back buttons
        const btnBackToStep1 = document.getElementById('btnBackToStep1');
        if (btnBackToStep1) {
            btnBackToStep1.addEventListener('click', () => this.goToStep(1));
        }
        
        const btnBackToStep2 = document.getElementById('btnBackToStep2');
        if (btnBackToStep2) {
            btnBackToStep2.addEventListener('click', () => this.goToStep(2));
        }
        
        const btnBackToStep3 = document.getElementById('btnBackToStep3');
        if (btnBackToStep3) {
            btnBackToStep3.addEventListener('click', () => this.goToStep(3));
        }
        
        const btnBackToStep4 = document.getElementById('btnBackToStep4');
        if (btnBackToStep4) {
            btnBackToStep4.addEventListener('click', () => this.goToStep(4));
        }
        
        // Restart button
        const btnRestartProcess = document.getElementById('btnRestartProcess');
        if (btnRestartProcess) {
            btnRestartProcess.addEventListener('click', () => this.restartProcess());
        }
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.checkUrlHash());
    },
    
    /**
     * Navigate to a specific step
     * @param {number} stepNum - Step number to navigate to
     * @param {boolean} force - Whether to skip validation
     */
    goToStep(stepNum, force = false) {
        console.log(`Navigating to step ${stepNum}, force=${force}`);
        
        // Validate step number
        if (stepNum < 1 || stepNum > 5) {
            console.error('Invalid step number:', stepNum);
            return;
        }
        
        // Check if step is available
        if (!force && stepNum > this.currentStep) {
            // Validate stepping forward
            if (!this.validateStepTransition(this.currentStep, stepNum)) {
                return;
            }
        }
        
        // Update current step
        this.currentStep = stepNum;
        
        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 < stepNum) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === stepNum) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        // Show current section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const currentSection = document.getElementById(`section${stepNum}`);
        if (currentSection) {
            currentSection.classList.add('active');
        }
        
        // Update URL hash
        window.location.hash = `step${stepNum}`;
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('navigationChanged', {
            detail: { step: stepNum }
        }));
        
        // Special handling for Rule Builder step
        if (stepNum === 3) {
            // Ensure rule-builder and rule-storage are initialized
            setTimeout(() => {
                // Ensure ruleBuilder is initialized
                if (window.ruleBuilder && !window.ruleBuilder.initialized && typeof window.ruleBuilder.init === 'function') {
                    window.ruleBuilder.init();
                }
                
                // Ensure ruleStorage is initialized
                if (window.ruleStorage && !window.ruleStorage.initialized && typeof window.ruleStorage.init === 'function') {
                    window.ruleStorage.init();
                }
                
                // Update column dropdowns after initialization
                if (window.ruleBuilder && typeof window.ruleBuilder.updateAllColumnDropdowns === 'function') {
                    window.ruleBuilder.updateAllColumnDropdowns();
                }
            }, 300);
        }
    },
    
    /**
     * Validate transition between steps
     * @param {number} fromStep - Starting step
     * @param {number} toStep - Target step
     * @returns {boolean} - Whether transition is valid
     */
    validateStepTransition(fromStep, toStep) {
        // Simple sequential validation by default
        if (toStep > fromStep + 1 && !document.getElementById(`step${fromStep + 1}`).classList.contains('completed')) {
            return false;
        }
        
        switch(fromStep) {
            case 1: // Upload data -> Select process
                // Check if files are uploaded
                if (!window.appData || !window.appData.data || window.appData.data.length === 0) {
                    // Show message
                    const message = document.getElementById('uploadStatusMessage');
                    if (message) {
                        message.textContent = 'Please upload at least one Excel file before continuing.';
                        message.classList.remove('hidden');
                    }
                    return false;
                }
                break;
                
            case 2: // Select process -> Create rules
                // Check if processes are selected
                if (!window.appData || !window.appData.selectedProcesses || window.appData.selectedProcesses.length === 0) {
                    // Show message
                    const message = document.getElementById('processSelectionMessage');
                    if (message) {
                        message.textContent = 'Please select at least one process before continuing.';
                        message.classList.remove('hidden');
                    }
                    return false;
                }
                break;
                
            case 3: // Create rules -> Set thresholds
                // Check if rules are created
                if (!window.appRules || !window.appRules.rules || window.appRules.rules.length === 0) {
                    // Show message
                    const message = document.getElementById('noRulesWarning');
                    if (message) {
                        message.textContent = 'Please create at least one rule before continuing.';
                        message.classList.remove('hidden');
                    }
                    return false;
                }
                break;
                
            case 4: // Set thresholds -> Final results
                // Check if rules are selected
                const rulesDropdown = document.getElementById('savedRulesDropdown');
                if (rulesDropdown && rulesDropdown.selectedOptions.length === 0) {
                    // Show message
                    const message = document.getElementById('goalThresholdMessage');
                    if (message) {
                        message.textContent = 'Please select at least one rule to apply for goal calculation.';
                        message.classList.remove('hidden');
                    }
                    return false;
                }
                break;
        }
        
        return true;
    },
    
    /**
     * Check URL hash for direct navigation
     */
    checkUrlHash() {
        const hash = window.location.hash;
        if (hash.startsWith('#step')) {
            const stepNum = parseInt(hash.substring(5));
            if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 5) {
                // Only allow direct navigation to step 1 or completed steps
                if (stepNum === 1 || document.getElementById(`step${stepNum-1}`)?.classList.contains('completed')) {
                    this.goToStep(stepNum, true);
                }
            }
        }
    },
    
    /**
     * Restart the goal setting process
     */
    restartProcess() {
        if (confirm('Are you sure you want to start a new goal setting process? Your current work will not be saved.')) {
            // Reset application state
            window.appData = {
                columns: [],
                processes: [],
                data: [],
                filteredData: [],
                selectedProcesses: [],
                processColumnName: ''
            };
            
            window.appRules = {
                rules: [],
                selectedRuleIds: []
            };
            
            // Go to first step
            this.goToStep(1, true);
            
            // Reload page to ensure clean state
            window.location.reload();
        }
    }
};

/**
 * Initialize application
 */
function initializeApp() {
    console.log("Initializing application");
    
    // Create global state containers if they don't exist
    if (!window.appData) {
        window.appData = {
            columns: [],
            processes: [],
            data: [],
            filteredData: [],
            selectedProcesses: [],
            processColumnName: ''
        };
    }
    
    if (!window.appRules) {
        window.appRules = {
            rules: [],
            selectedRuleIds: []
        };
    }
    
    // Ensure ruleBuilder is globally available
    if (typeof ruleBuilder !== 'undefined' && !window.ruleBuilder) {
        window.ruleBuilder = ruleBuilder;
    }
    
    // Ensure ruleStorage is globally available
    if (typeof ruleStorage !== 'undefined' && !window.ruleStorage) {
        window.ruleStorage = ruleStorage;
    }
    
    // Initialize navigation
    window.navigation = navigation;
    navigation.init();
    
    // Add debug mode toggle
    window.addEventListener('keydown', function(e) {
        // Ctrl+Shift+D to toggle debug console
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            const debugConsole = document.getElementById('debugConsole');
            if (debugConsole) {
                debugConsole.classList.toggle('hidden');
                if (!debugConsole.classList.contains('hidden')) {
                    console.log("Debug console enabled");
                }
            }
        }
    });
    
    // Override console.log for debug panel
    const originalConsoleLog = console.log;
    console.log = function() {
        // Call original console.log
        originalConsoleLog.apply(console, arguments);
        
        // Append to debug panel if it exists
        const debugOutput = document.getElementById('debugOutput');
        if (debugOutput) {
            const args = Array.prototype.slice.call(arguments);
            const output = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            
            debugOutput.innerHTML += output + '\n';
            
            // Scroll to bottom
            debugOutput.scrollTop = debugOutput.scrollHeight;
        }
    };
    
    // Add Font Awesome if not already loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }
    
    console.log('Goal Setting Framework initialized');
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);