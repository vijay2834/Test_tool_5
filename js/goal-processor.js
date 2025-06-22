/**
 * goal-processor.js - Handles goal calculation and processing with null value handling
 * Updated to properly calculate G2 goals based on rule logic and show detailed rule application
 */

const goalProcessor = {
    bpsThreshold: 50, // Default BPS threshold (basis points)
    calculatedData: [], // Stored goal calculation results
    ruleApplicationDetails: {}, // Details of rule application for visualization
    nullHandling: 'flag', // Default null handling strategy: 'ignore' or 'flag'
    
    /**
     * Initialize goal processor
     */
    init() {
        console.log("Initializing goal processor");
        this.setupEventListeners();
    },
    
    /**
     * Check if a rule uses G2_calculated in its conditions
     * @param {Object} rule - Rule to check
     * @returns {boolean} - Whether the rule uses G2_calculated
     */
    ruleUsesG2Calculated(rule) {
        if (!rule || !rule.condition) return false;
        
        // Check main condition
        if (rule.condition.leftColumn === 'G2_calculated' || 
            rule.condition.rightColumn === 'G2_calculated') {
            return true;
        }
        
        // Check AND conditions
        if (rule.condition.andConditions) {
            for (const andCondition of rule.condition.andConditions) {
                if (andCondition.leftColumn === 'G2_calculated' || 
                    andCondition.rightColumn === 'G2_calculated') {
                    return true;
                }
            }
        }
        
        // Check OR conditions
        if (rule.condition.orConditions) {
            for (const orCondition of rule.condition.orConditions) {
                if (orCondition.leftColumn === 'G2_calculated' || 
                    orCondition.rightColumn === 'G2_calculated') {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // BPS threshold input
        const bpsInput = document.getElementById('bpsThresholdInput');
        if (bpsInput) {
            bpsInput.addEventListener('input', () => {
                const value = parseFloat(bpsInput.value);
                if (!isNaN(value) && value >= 0) {
                    this.bpsThreshold = value;
                    
                    // Update UI elements that show BPS values
                    this.updateBpsDisplay();
                }
            });
            
            // Initialize with default value
            bpsInput.value = this.bpsThreshold;
        }
        
        // Null handling option
        const nullHandlingSelect = document.getElementById('nullHandlingOption');
        if (nullHandlingSelect) {
            nullHandlingSelect.addEventListener('change', () => {
                this.nullHandling = nullHandlingSelect.value;
                console.log('Null handling strategy changed to:', this.nullHandling);
            });
            
            // Initialize with default value
            nullHandlingSelect.value = this.nullHandling;
        }
        
        // Calculate goals button
        const btnToStep5 = document.getElementById('btnToStep5');
        if (btnToStep5) {
            btnToStep5.addEventListener('click', () => this.calculateGoals());
        }
        
        // Rule selection dropdown
        const rulesDropdown = document.getElementById('savedRulesDropdown');
        if (rulesDropdown) {
            rulesDropdown.addEventListener('change', () => {
                const selectedOptions = Array.from(rulesDropdown.selectedOptions);
                
                // Enable/disable calculate button
                const btnToStep5 = document.getElementById('btnToStep5');
                if (btnToStep5) {
                    btnToStep5.disabled = selectedOptions.length === 0;
                }
                
                // Show/hide message
                const message = document.getElementById('goalThresholdMessage');
                if (message) {
                    if (selectedOptions.length === 0) {
                        message.textContent = 'Please select at least one rule to apply for goal calculation.';
                        message.classList.remove('hidden');
                    } else {
                        message.classList.add('hidden');
                    }
                }
                
                // Store selected rule IDs
                if (window.appRules) {
                    window.appRules.selectedRuleIds = selectedOptions.map(option => parseInt(option.value));
                }
            });
        }
        
        // Export results button
        const exportResultsBtn = document.getElementById('exportResults');
        if (exportResultsBtn) {
            exportResultsBtn.addEventListener('click', () => this.exportResults());
        }
        
        // Show details button
        const showDetailsBtn = document.getElementById('showDataDetails');
        if (showDetailsBtn) {
            showDetailsBtn.addEventListener('click', () => this.toggleRuleApplicationDetails());
        }
    },
    
    /**
     * Update BPS value display elements
     */
    updateBpsDisplay() {
        const bpsDisplayG1 = document.getElementById('bpsValueG1');
        const bpsDisplayG3 = document.getElementById('bpsValueG3');
        
        const bpsDecimal = this.bpsThreshold / 100;
        
        if (bpsDisplayG1) bpsDisplayG1.textContent = bpsDecimal;
        if (bpsDisplayG3) bpsDisplayG3.textContent = bpsDecimal;
    },
    
    /**
     * Calculate goals based on selected rules
     */
    calculateGoals() {
        try {
            // Get selected rules
            const rulesDropdown = document.getElementById('savedRulesDropdown');
            if (!rulesDropdown) {
                console.error('Rules dropdown not found');
                return;
            }
            
            const selectedRuleIds = Array.from(rulesDropdown.selectedOptions).map(option => parseInt(option.value));
            
            if (selectedRuleIds.length === 0) {
                // Show error message
                const message = document.getElementById('goalThresholdMessage');
                if (message) {
                    message.textContent = 'Please select at least one rule to apply for goal calculation.';
                    message.classList.remove('hidden');
                    message.classList.remove('alert-info');
                    message.classList.add('alert-warning');
                }
                return;
            }
            
            // Get null handling strategy
            const nullHandlingSelect = document.getElementById('nullHandlingOption');
            if (nullHandlingSelect) {
                this.nullHandling = nullHandlingSelect.value;
            }
            
            // Get filtered data
            const appData = window.appData || {};
            if (!appData.filteredData || appData.filteredData.length === 0) {
                console.error('No filtered data available for processing');
                // Show error message
                const resultsTable = document.getElementById('finalResultsTable');
                if (resultsTable) {
                    resultsTable.innerHTML = `
                        <div class="alert alert-danger">
                            <strong>Error:</strong> No data available for processing. Please select processes in Step 2.
                        </div>
                    `;
                }
                return;
            }
            
            // Create a deep copy of filtered data to avoid modifying original
            const filteredData = JSON.parse(JSON.stringify(appData.filteredData || []));
            
            // Get rules from storage
            const appRules = window.appRules || {};
            const rules = appRules.rules || [];
            
            if (rules.length === 0) {
                console.error('No rules available');
                return;
            }
            
            // Reset rule application details
            this.ruleApplicationDetails = {};
            
            // Process data with selected rules
            this.processDataWithRules(filteredData, rules, selectedRuleIds);
            
            // Store processed data
            this.calculatedData = filteredData;
            
            // Display results
            this.displayResults();
            
            // Update UI to show BPS values
            this.updateBpsDisplay();
            
            // Navigate to results step
            const navigation = window.navigation;
            if (navigation && typeof navigation.goToStep === 'function') {
                navigation.goToStep(5);
            }
            
            console.log(`Goals calculated for ${filteredData.length} processes using ${selectedRuleIds.length} rules with null handling: ${this.nullHandling}`);
        } catch (error) {
            console.error('Error calculating goals:', error);
            
            // Show error in results table
            const resultsTable = document.getElementById('finalResultsTable');
            if (resultsTable) {
                resultsTable.innerHTML = `
                    <div class="alert alert-danger">
                        <strong>Error calculating goals:</strong> ${error.message}
                    </div>
                `;
            }
        }
    },
    
    /**
     * Process data with selected rules - Updated logic for proper G2 goal calculation
     * @param {Array} data - Data to process
     * @param {Array} rules - Available rules
     * @param {Array} selectedRuleIds - IDs of selected rules
     */
    processDataWithRules(data, rules, selectedRuleIds) {
        try {
            // For each row in the data
            data.forEach((row, index) => {
                // Initialize rule application tracking for this row
                const processId = row[window.appData?.processColumnName] || `Row ${index + 1}`;
                this.ruleApplicationDetails[processId] = {
                    appliedRules: [],
                    originalValues: { ...row }, // Store original values for reference
                    resultValues: {},
                    processedRuleIds: [], // Track which rules were processed
                    nullValuesEncountered: {}, // Track null values encountered during processing
                    nullHandlingStrategy: this.nullHandling, // Store the strategy used
                    g2GoalCalculationPath: [], // Track how G2 goal was calculated
                    finalG2Goal: null,
                    g2GoalSource: null // Track which rule/condition led to G2 goal
                };
                
                // Store original G2 goal if it exists
                let calculatedG2Goal = null;
                let g2GoalSource = null;
                let g2CalculationPath = [];
                let baseRuleApplied = false;
                
                // Apply each selected rule
                selectedRuleIds.forEach(ruleId => {
                    const rule = rules.find(r => r.id === ruleId);
                    if (rule && rule.rule) {
                        // Process base rule first
                        if (rule.rule.baseRule) {
                            const baseRuleResult = this.processRule(rule.rule.baseRule, row, rule.name + ' (Base)', ruleId);
                            
                            // If base rule was applied and has a goal calculation
                            if (baseRuleResult.g2Goal !== null) {
                                calculatedG2Goal = baseRuleResult.g2Goal;
                                g2GoalSource = baseRuleResult.source;
                                g2CalculationPath = baseRuleResult.calculationPath;
                                baseRuleApplied = true;
                                
                                // Store the G2 goal in the row for calculated rule to use
                                row.G2_calculated = calculatedG2Goal;
                            }
                            
                            // Add to tracking
                            if (baseRuleResult.applied || Object.keys(baseRuleResult.nullValues).length > 0) {
                                this.ruleApplicationDetails[processId].appliedRules.push(baseRuleResult);
                                this.ruleApplicationDetails[processId].processedRuleIds.push(ruleId);
                                
                                // Merge null values
                                Object.assign(this.ruleApplicationDetails[processId].nullValuesEncountered, baseRuleResult.nullValues);
                            }
                        }
                        
                        // Process calculated rule - NEW LOGIC: Check if it depends on G2_calculated
                        if (rule.rule.calculatedRule) {
                            const calculatedRuleUsesG2 = this.ruleUsesG2Calculated(rule.rule.calculatedRule);
                            
                            // Apply calculated rule if:
                            // 1. Base rule was applied and produced G2 goal, OR
                            // 2. Base rule was not applied AND calculated rule doesn't use G2_calculated
                            if ((baseRuleApplied && calculatedG2Goal !== null) || (!baseRuleApplied && !calculatedRuleUsesG2)) {
                                
                                // If base rule was applied, ensure G2_calculated is available
                                if (baseRuleApplied) {
                                    row.G2_calculated = calculatedG2Goal;
                                }
                                
                                const calculatedRuleResult = this.processRule(rule.rule.calculatedRule, row, rule.name + ' (Calculated)', ruleId);
                                
                                // If calculated rule was applied, update or set the G2 goal
                                if (calculatedRuleResult.g2Goal !== null) {
                                    calculatedG2Goal = calculatedRuleResult.g2Goal;
                                    
                                    if (baseRuleApplied) {
                                        g2GoalSource = `${g2GoalSource} → ${calculatedRuleResult.source}`;
                                        g2CalculationPath = [...g2CalculationPath, ...calculatedRuleResult.calculationPath];
                                    } else {
                                        g2GoalSource = calculatedRuleResult.source;
                                        g2CalculationPath = calculatedRuleResult.calculationPath;
                                    }
                                }
                                
                                // Add to tracking
                                if (calculatedRuleResult.applied || Object.keys(calculatedRuleResult.nullValues).length > 0) {
                                    this.ruleApplicationDetails[processId].appliedRules.push(calculatedRuleResult);
                                    
                                    // Merge null values
                                    Object.assign(this.ruleApplicationDetails[processId].nullValuesEncountered, calculatedRuleResult.nullValues);
                                }
                            }
                        }
                        
                        // Handle old format rules (backward compatibility)
                        if (!rule.rule.baseRule && !rule.rule.calculatedRule) {
                            const ruleResult = this.processRule(rule.rule, row, rule.name, ruleId);
                            
                            if (ruleResult.g2Goal !== null) {
                                calculatedG2Goal = ruleResult.g2Goal;
                                g2GoalSource = ruleResult.source;
                                g2CalculationPath = ruleResult.calculationPath;
                            }
                            
                            // Add to tracking
                            if (ruleResult.applied || Object.keys(ruleResult.nullValues).length > 0) {
                                this.ruleApplicationDetails[processId].appliedRules.push(ruleResult);
                                this.ruleApplicationDetails[processId].processedRuleIds.push(ruleId);
                                
                                // Merge null values
                                Object.assign(this.ruleApplicationDetails[processId].nullValuesEncountered, ruleResult.nullValues);
                            }
                        }
                    }
                });
                
                // Set final G2 goal
                if (calculatedG2Goal !== null) {
                    row.G2_goal = calculatedG2Goal;
                    this.ruleApplicationDetails[processId].finalG2Goal = calculatedG2Goal;
                    this.ruleApplicationDetails[processId].g2GoalSource = g2GoalSource;
                    this.ruleApplicationDetails[processId].g2GoalCalculationPath = g2CalculationPath;
                } else {
                    // No rules applied or no valid G2 goal calculated
                    if (Object.keys(this.ruleApplicationDetails[processId].nullValuesEncountered).length > 0) {
                        if (this.nullHandling === 'flag') {
                            const nullColumnsMessage = Object.keys(this.ruleApplicationDetails[processId].nullValuesEncountered)
                                .map(column => `${column} is null`)
                                .join(', ');
                            row.G2_goal = nullColumnsMessage;
                        } else {
                            row.G2_goal = "All conditions failed";
                        }
                    } else {
                        row.G2_goal = "All conditions failed";
                        this.ruleApplicationDetails[processId].g2GoalSource = "All conditions failed";
                    }
                }
                
                // Calculate G1 and G3 based on G2
                this.calculateTierGoals(row);
                
                // Store final values
                this.ruleApplicationDetails[processId].resultValues = { ...row };
            });
        } catch (error) {
            console.error('Error processing data with rules:', error);
            throw new Error(`Error processing data: ${error.message}`);
        }
    },
    
    /**
     * Process a single rule and return the result with G2 goal calculation
     * @param {Object} rule - Rule to process
     * @param {Object} row - Data row
     * @param {string} ruleName - Name of the rule for tracking
     * @param {number} ruleId - ID of the rule
     * @returns {Object} - Processing result
     */
    processRule(rule, row, ruleName, ruleId) {
        const result = {
            ruleName: ruleName,
            ruleId: ruleId,
            applied: false,
            condition: null,
            action: null,
            nullValues: {},
            g2Goal: null, // The calculated G2 goal from this rule
            source: null, // Which condition/action led to this G2 goal
            calculationPath: [], // Detailed path of how G2 goal was calculated
            nestedRules: []
        };
        
        try {
            // Evaluate main condition
            const conditionResult = this.evaluateCondition(rule.condition, row, result.nullValues);
            let conditionMet = conditionResult.result;
            
            result.condition = {
                description: this.formatCondition(rule.condition),
                met: conditionMet,
                nullValues: conditionResult.nullValues,
                nullHandlingStrategy: this.nullHandling
            };
            
            // Merge null values
            Object.assign(result.nullValues, conditionResult.nullValues || {});
            
            // Check AND conditions
            if (conditionMet && rule.condition.andConditions && Array.isArray(rule.condition.andConditions)) {
                const andResults = [];
                
                for (const andCondition of rule.condition.andConditions) {
                    const andResult = this.evaluateCondition(andCondition, row, result.nullValues);
                    
                    andResults.push({
                        description: this.formatCondition(andCondition),
                        met: andResult.result,
                        nullValues: andResult.nullValues
                    });
                    
                    Object.assign(result.nullValues, andResult.nullValues || {});
                    
                    if (!andResult.result) {
                        conditionMet = false;
                        break;
                    }
                }
                
                result.condition.andConditions = andResults;
            }
            
            // Check OR conditions
            if (!conditionMet && rule.condition.orConditions && Array.isArray(rule.condition.orConditions)) {
                const orResults = [];
                
                for (const orCondition of rule.condition.orConditions) {
                    const orResult = this.evaluateCondition(orCondition, row, result.nullValues);
                    
                    orResults.push({
                        description: this.formatCondition(orCondition),
                        met: orResult.result,
                        nullValues: orResult.nullValues
                    });
                    
                    Object.assign(result.nullValues, orResult.nullValues || {});
                    
                    if (orResult.result) {
                        conditionMet = true;
                        break;
                    }
                }
                
                result.condition.orConditions = orResults;
            }
            
            // Apply action if condition is met and no blocking null values
            if (conditionMet && (this.nullHandling === 'ignore' || Object.keys(result.nullValues).length === 0)) {
                const actionResult = this.applyActionAndCalculateG2(row, rule.action);
                
                result.action = {
                    description: this.formatAction(rule.action),
                    applied: actionResult.success,
                    nullValues: actionResult.nullValues || {}
                };
                
                if (actionResult.success) {
                    result.applied = true;
                    result.g2Goal = actionResult.g2Goal;
                    result.source = `Main condition satisfied -> ${this.formatAction(rule.action)}`;
                    result.calculationPath.push({
                        step: 'Main condition satisfied',
                        action: this.formatAction(rule.action),
                        result: actionResult.g2Goal
                    });
                }
                
                Object.assign(result.nullValues, actionResult.nullValues || {});
            } 
            // Apply else action if condition is not met
            else if (!conditionMet && rule.elseAction && (this.nullHandling === 'ignore' || Object.keys(result.nullValues).length === 0)) {
                const elseResult = this.applyActionAndCalculateG2(row, rule.elseAction);
                
                result.action = {
                    description: this.formatAction(rule.elseAction),
                    applied: elseResult.success,
                    isElse: true,
                    nullValues: elseResult.nullValues || {}
                };
                
                if (elseResult.success) {
                    result.applied = true;
                    result.g2Goal = elseResult.g2Goal;
                    result.source = `Else condition -> ${this.formatAction(rule.elseAction)}`;
                    result.calculationPath.push({
                        step: 'Else condition applied',
                        action: this.formatAction(rule.elseAction),
                        result: elseResult.g2Goal
                    });
                }
                
                Object.assign(result.nullValues, elseResult.nullValues || {});
            }
            
            // Process nested rules if main condition was not met
            if (!conditionMet && rule.nestedRules && Array.isArray(rule.nestedRules)) {
                for (const nestedRule of rule.nestedRules) {
                    const nestedResult = this.processRule(nestedRule, row, `${ruleName} (Nested)`, ruleId);
                    
                    result.nestedRules.push(nestedResult);
                    Object.assign(result.nullValues, nestedResult.nullValues || {});
                    
                    // If nested rule produced a G2 goal, use it
                    if (nestedResult.g2Goal !== null) {
                        result.g2Goal = nestedResult.g2Goal;
                        result.source = `Nested rule -> ${nestedResult.source}`;
                        result.calculationPath.push({
                            step: 'Nested rule applied',
                            rule: nestedResult.ruleName,
                            result: nestedResult.g2Goal
                        });
                        result.applied = true;
                        break; // Use first nested rule that produces a result
                    }
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error processing rule:', error);
            result.error = error.message;
            return result;
        }
    },
    
    /**
     * Apply an action and calculate G2 goal
     * @param {Object} row - Data row
     * @param {Object} action - Action to apply
     * @returns {Object} - Result with G2 goal
     */
    applyActionAndCalculateG2(row, action) {
        if (!row || !action || !action.column) {
            return { success: false, nullValues: {}, g2Goal: null };
        }
        
        try {
            const result = { success: false, nullValues: {}, g2Goal: null };
            const column = action.column;
            
            // Get current value
            let currentValue = this.getRowValue(row, column);
            if (currentValue === null) {
                result.nullValues[column] = true;
                
                if (this.nullHandling === 'flag') {
                    return result;
                } else {
                    currentValue = 0; // Use 0 for ignore strategy
                }
            }
            
            // Get action value
            const actionValue = parseFloat(action.value) || 0;
            
            let newValue;
            
            // Calculate new value based on action type
            switch(action.type) {
                case 'value':
                    newValue = actionValue;
                    break;
                case 'add':
                    newValue = currentValue + actionValue;
                    break;
                case 'subtract':
                    newValue = currentValue - actionValue;
                    break;
                case 'percent-increase':
                    newValue = currentValue * (1 + actionValue / 100);
                    break;
                case 'percent-decrease':
                    newValue = currentValue * (1 - actionValue / 100);
                    break;
                case 'multiply':
                    newValue = currentValue * actionValue;
                    break;
                case 'divide':
                    if (actionValue === 0) {
                        console.warn('Divide by zero prevented');
                        newValue = currentValue;
                    } else {
                        newValue = currentValue / actionValue;
                    }
                    break;
                case 'reset':
                    newValue = 0;
                    break;
                default:
                    return result;
            }
            
            // Round to 2 decimal places
            newValue = Math.round(newValue * 100) / 100;
            
            // Update the row value (but don't modify original data columns)
            if (!column.includes('_goal')) {
                // This action affects a data column, so the G2 goal should be this new value
                result.g2Goal = newValue;
            } else {
                // This action directly sets a goal column
                row[column] = newValue;
                if (column === 'G2_goal' || column.includes('G2')) {
                    result.g2Goal = newValue;
                }
            }
            
            result.success = true;
            return result;
        } catch (error) {
            console.error('Error applying action:', error);
            return { success: false, nullValues: {}, g2Goal: null };
        }
    },
    
    /**
     * Evaluate condition against a data row
     * @param {Object} condition - Condition to evaluate
     * @param {Object} row - Data row
     * @param {Object} nullValuesTracking - Object to track null values
     * @returns {Object} - Evaluation result with null value tracking
     */
    evaluateCondition(condition, row, nullValuesTracking = {}) {
        if (!condition || !condition.leftColumn) {
            return { result: false, nullValues: {} };
        }
        
        try {
            const result = { result: false, nullValues: {} };
            
            // Check left column value
            const leftValue = this.getRowValue(row, condition.leftColumn);
            if (leftValue === null) {
                result.nullValues[condition.leftColumn] = true;
                
                if (this.nullHandling === 'flag') {
                    return result;
                } else {
                    result.result = false;
                    return result;
                }
            }
            
            let rightValue;
            let rightColumnName;
            
            // Handle right side based on type
            if (condition.rightType === 'column') {
                rightColumnName = condition.rightColumn;
                rightValue = this.getRowValue(row, rightColumnName);
                
                if (rightValue === null) {
                    result.nullValues[rightColumnName] = true;
                    
                    if (this.nullHandling === 'flag') {
                        return result;
                    } else {
                        result.result = false;
                        return result;
                    }
                }
            } else if (condition.rightType === 'value' || condition.rightType === 'custom') {
                rightValue = parseFloat(condition.rightValue);
                if (isNaN(rightValue)) {
                    result.result = false;
                    return result;
                }
            } else {
                // Legacy format
                rightColumnName = condition.rightColumn || condition.rightType;
                rightValue = this.getRowValue(row, rightColumnName);
                
                if (rightValue === null) {
                    result.nullValues[rightColumnName] = true;
                    
                    if (this.nullHandling === 'flag') {
                        return result;
                    } else {
                        result.result = false;
                        return result;
                    }
                }
            }
            
            // Evaluate condition
            switch(condition.operator) {
                case '>':
                    result.result = leftValue > rightValue;
                    break;
                case '<':
                    result.result = leftValue < rightValue;
                    break;
                case '=':
                case '==':
                    result.result = leftValue == rightValue;
                    break;
                case '>=':
                    result.result = leftValue >= rightValue;
                    break;
                case '<=':
                    result.result = leftValue <= rightValue;
                    break;
                case '!=':
                    result.result = leftValue != rightValue;
                    break;
                default:
                    result.result = false;
            }
            
            return result;
        } catch (error) {
            console.error('Error evaluating condition:', error);
            return { result: false, nullValues: {} };
        }
    },
    
    /**
     * Calculate G1 and G3 goals based on G2 and BPS
     * @param {Object} row - Data row
     */
    calculateTierGoals(row) {
        try {
            if (row.G2_goal !== undefined) {
                // If G2 goal is a string (null message or failure message), pass it to other goals too
                if (typeof row.G2_goal === 'string' && (row.G2_goal.includes('is null') || row.G2_goal.includes('failed'))) {
                    row.G1_goal = row.G2_goal;
                    row.G3_goal = row.G2_goal;
                    return;
                }
                
                const g2Value = parseFloat(row.G2_goal);
                if (!isNaN(g2Value)) {
                    const bpsAdjustment = this.bpsThreshold / 100;
                    
                    // G1 = G2 + BPS/100
                    row.G1_goal = Math.round((g2Value + bpsAdjustment) * 100) / 100;
                    
                    // G3 = G2 - BPS/100 (but never negative)
                    row.G3_goal = Math.max(0, Math.round((g2Value - bpsAdjustment) * 100) / 100);
                } else {
                    // If G2 goal is not a valid number, set defaults
                    row.G1_goal = "All conditions failed";
                    row.G3_goal = "All conditions failed";
                }
            }
        } catch (error) {
            console.error('Error calculating tier goals:', error);
        }
    },
    
    /**
     * Get a numeric value from a row
     * @param {Object} row - The data row
     * @param {string} column - The column to get
     * @returns {number|null} - The numeric value or null if value is undefined/null/NaN
     */
    getRowValue(row, column) {
        let value = row[column];
        
        // Check for null or undefined
        if (value === undefined || value === null) {
            return null;
        }
        
        // Handle goal fields specially
        if (column.includes('_goal') || column === 'G2_calculated') {
            if (value === undefined) {
                return 0;
            }
        }
        
        // Try to convert to number
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return null;
        }
        
        return numValue;
    },
    
    /**
     * Format a condition for display
     * @param {Object} condition - Condition object
     * @returns {string} - Formatted condition
     */
    formatCondition(condition) {
        if (!condition) return '';
        
        const leftColumn = condition.leftColumn || '?';
        const operator = condition.operator || '?';
        
        let rightPart = '';
        if (condition.rightType === 'value' || condition.rightType === 'custom') {
            rightPart = condition.rightValue || '0';
        } else {
            rightPart = condition.rightColumn || condition.rightType || '?';
        }
        
        return `${leftColumn} ${operator} ${rightPart}`;
    },
    
    /**
     * Format an action for display
     * @param {Object} action - Action object
     * @returns {string} - Formatted action
     */
    formatAction(action) {
        if (!action) return '';
        
        const column = action.column || '?';
        const actionType = action.type || '?';
        
        let formattedAction = '';
        switch (actionType) {
            case 'value':
                formattedAction = `Set ${column} = ${action.value || '0'}`;
                break;
            case 'add':
                formattedAction = `${column} + ${action.value || '0'}`;
                break;
            case 'subtract':
                formattedAction = `${column} - ${action.value || '0'}`;
                break;
            case 'percent-increase':
                formattedAction = `${column} × (1 + ${action.value || '0'}%)`;
                break;
            case 'percent-decrease':
                formattedAction = `${column} × (1 - ${action.value || '0'}%)`;
                break;
            case 'multiply':
                formattedAction = `${column} × ${action.value || '1'}`;
                break;
            case 'divide':
                formattedAction = `${column} ÷ ${action.value || '1'}`;
                break;
            case 'reset':
                formattedAction = `${column} = 0`;
                break;
            default:
                formattedAction = `${actionType} ${column} ${action.value || ''}`;
        }
        
        return formattedAction;
    },
    
    /**
     * Display calculated results
     */
    displayResults() {
        try {
            const resultsContainer = document.getElementById('finalResultsTable');
            if (!resultsContainer) return;
            
            if (!this.calculatedData || this.calculatedData.length === 0) {
                resultsContainer.innerHTML = '<div class="alert alert-warning">No results to display.</div>';
                return;
            }
            
            // Get process column name
            const processColumnName = window.appData?.processColumnName || 'Process';
            
            // Get all columns (excluding goals)
            const dataColumns = window.appData?.columns?.filter(col => 
                col !== processColumnName && !col.includes('_goal')
            ) || [];
            
            // Create table HTML
            let tableHTML = `
                <table class="table table-striped table-bordered table-hover results-table">
                    <thead>
                        <tr>
                            <th>${processColumnName}</th>
                            ${dataColumns.map(col => `<th>${col}</th>`).join('')}
                            <th class="bg-success text-white">G1 Goal</th>
                            <th class="bg-primary text-white">G2 Goal</th>
                            <th class="bg-danger text-white">G3 Goal</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            // Add rows
            this.calculatedData.forEach(row => {
                tableHTML += `
                    <tr>
                        <td>${row[processColumnName] || 'Unknown'}</td>
                        ${dataColumns.map(col => `<td>${this.formatValue(row[col])}</td>`).join('')}
                        <td class="result-success">${this.formatValue(row.G1_goal)}</td>
                        <td class="result-target">${this.formatValue(row.G2_goal)}</td>
                        <td class="result-threshold">${this.formatValue(row.G3_goal)}</td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
            `;
            
            resultsContainer.innerHTML = tableHTML;
            
            // Generate rule application details
            this.generateRuleApplicationDetails();
        } catch (error) {
            console.error('Error displaying results:', error);
            
            // Show error message
            const resultsContainer = document.getElementById('finalResultsTable');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <strong>Error displaying results:</strong> ${error.message}
                    </div>
                `;
            }
        }
    },
    
    /**
     * Format a value for display
     * @param {*} value - Value to format
     * @returns {string} - Formatted value
     */
    formatValue(value) {
        if (value === undefined || value === null) return '-';
        
        // Check if it's a string with failure or null messages
        if (typeof value === 'string' && (value.includes('is null') || value.includes('failed'))) {
            return `<span class="text-warning">${value}</span>`;
        }
        
        if (typeof value === 'number' || !isNaN(parseFloat(value))) {
            const numValue = parseFloat(value);
            return numValue.toFixed(2);
        }
        
        return value.toString();
    },
    
    /**
     * Generate rule application details HTML - Enhanced with G2 goal calculation path
     */
    generateRuleApplicationDetails() {
        try {
            const detailsContainer = document.getElementById('ruleApplicationSummary');
            if (!detailsContainer) return;
            
            let detailsHTML = '';
            
            // Add null handling strategy info at the top
            detailsHTML += `
                <div class="alert alert-info mb-3">
                    <strong>Null Value Handling Strategy:</strong> ${this.nullHandling === 'flag' ? 'Flag/Report' : 'Ignore'} 
                    <small class="d-block mt-1">
                        ${this.nullHandling === 'flag' ? 
                            'Stops calculation when null values are encountered and reports which columns have null values.' : 
                            'Treats null conditions as false and continues rule processing.'}
                    </small>
                </div>
            `;
            
            // For each process
            for (const processId in this.ruleApplicationDetails) {
                const processDetails = this.ruleApplicationDetails[processId];
                
                detailsHTML += `
                    <div class="rule-application-container mb-3">
                        <div class="rule-application-header">
                            ${processId}
                            <span class="badge bg-primary ms-2">G2 Goal: ${this.formatValue(processDetails.finalG2Goal)}</span>
                        </div>
                        <div class="rule-application-body">
                `;
                
                // Show G2 goal calculation path
                if (processDetails.g2GoalSource) {
                    detailsHTML += `
                        <div class="alert alert-success mb-3">
                            <strong>G2 Goal Calculation:</strong> ${processDetails.g2GoalSource}
                            <div class="mt-2">
                                <strong>Final G2 Goal:</strong> ${this.formatValue(processDetails.finalG2Goal)}
                            </div>
                    `;
                    
                    if (processDetails.g2GoalCalculationPath && processDetails.g2GoalCalculationPath.length > 0) {
                        detailsHTML += `
                            <div class="mt-2">
                                <strong>Calculation Steps:</strong>
                                <ol class="mb-0 mt-1">
                        `;
                        
                        processDetails.g2GoalCalculationPath.forEach(step => {
                            detailsHTML += `<li>${step.step}: ${step.action || step.rule} → ${this.formatValue(step.result)}</li>`;
                        });
                        
                        detailsHTML += `
                                </ol>
                            </div>
                        `;
                    }
                    
                    detailsHTML += `</div>`;
                }
                
                // Show null values encountered if any
                if (Object.keys(processDetails.nullValuesEncountered).length > 0) {
                    const nullHandlingText = processDetails.nullHandlingStrategy === 'flag' ? 
                        'Flagged (calculation stopped)' : 'Ignored (treated as false)';
                    
                    detailsHTML += `
                        <div class="alert alert-warning mb-3">
                            <strong>Null Values Encountered (${nullHandlingText}):</strong> 
                            ${Object.keys(processDetails.nullValuesEncountered).map(col => `<span class="badge bg-warning text-dark">${col}</span>`).join(' ')}
                        </div>
                    `;
                }
                
                if (processDetails.appliedRules.length === 0) {
                    detailsHTML += `
                        <div class="alert alert-info mb-0">
                            No rules were applied to this process. Default goals used.
                        </div>
                    `;
                } else {
                    // Display each applied rule with enhanced details
                    processDetails.appliedRules.forEach((appliedRule, index) => {
                        const ruleType = appliedRule.ruleName.includes('(Base)') ? 'base-rule' : 
                                        appliedRule.ruleName.includes('(Calculated)') ? 'calculated-rule' : 
                                        appliedRule.ruleName.includes('(Nested)') ? 'nested-rule' : '';
                        
                        detailsHTML += `
                            <div class="process-rule-detail ${ruleType}">
                                <div class="mb-2">
                                    <strong>Rule ${index + 1}:</strong> ${appliedRule.ruleName}
                                    ${appliedRule.applied ? '<span class="badge bg-success ms-2">Applied</span>' : '<span class="badge bg-secondary ms-2">Not Applied</span>'}
                                    ${appliedRule.g2Goal !== null ? `<span class="badge bg-primary ms-2">G2: ${this.formatValue(appliedRule.g2Goal)}</span>` : ''}
                                </div>
                                
                                <div class="condition-details mb-2">
                                    <div><strong>Condition:</strong> ${appliedRule.condition.description} 
                                    <span class="badge ${appliedRule.condition.met ? 'bg-success' : 'bg-danger'}">${appliedRule.condition.met ? 'Met' : 'Not Met'}</span></div>
                        `;
                        
                        // Show AND conditions
                        if (appliedRule.condition.andConditions) {
                            appliedRule.condition.andConditions.forEach(andCondition => {
                                detailsHTML += `
                                    <div class="ps-3"><strong>AND:</strong> ${andCondition.description} 
                                    <span class="badge ${andCondition.met ? 'bg-success' : 'bg-danger'}">${andCondition.met ? 'Met' : 'Not Met'}</span></div>
                                `;
                            });
                        }
                        
                        // Show OR conditions
                        if (appliedRule.condition.orConditions) {
                            appliedRule.condition.orConditions.forEach(orCondition => {
                                detailsHTML += `
                                    <div class="ps-3"><strong>OR:</strong> ${orCondition.description} 
                                    <span class="badge ${orCondition.met ? 'bg-success' : 'bg-danger'}">${orCondition.met ? 'Met' : 'Not Met'}</span></div>
                                `;
                            });
                        }
                        
                        // Show action
                        if (appliedRule.action) {
                            detailsHTML += `
                                </div>
                                <div class="action-details">
                                    <div><strong>${appliedRule.action.isElse ? 'Else Action' : 'Action'}:</strong> ${appliedRule.action.description} 
                                    <span class="badge ${appliedRule.action.applied ? 'bg-success' : 'bg-danger'}">${appliedRule.action.applied ? 'Applied' : 'Not Applied'}</span></div>
                                </div>
                            `;
                        }
                        
                        // Show nested rules if any
                        if (appliedRule.nestedRules && appliedRule.nestedRules.length > 0) {
                            detailsHTML += `
                                <div class="nested-rules-details mt-2">
                                    <div><strong>Nested Rules:</strong></div>
                            `;
                            
                            appliedRule.nestedRules.forEach((nestedRule, nestedIndex) => {
                                detailsHTML += `
                                    <div class="ps-3 mt-1">
                                        <strong>Nested ${nestedIndex + 1}:</strong> ${nestedRule.condition?.description || 'Unknown condition'} 
                                        <span class="badge ${nestedRule.condition?.met ? 'bg-success' : 'bg-danger'}">${nestedRule.condition?.met ? 'Met' : 'Not Met'}</span>
                                        ${nestedRule.g2Goal !== null ? `<span class="badge bg-info ms-1">G2: ${this.formatValue(nestedRule.g2Goal)}</span>` : ''}
                                    </div>
                                `;
                            });
                            
                            detailsHTML += `</div>`;
                        }
                        
                        detailsHTML += `</div>`;
                    });
                    
                    // Show value changes
                    detailsHTML += `
                        <div class="value-changes mt-3">
                            <h6>Goal Results:</h6>
                            <table class="table table-sm table-bordered table-hover">
                                <thead>
                                    <tr>
                                        <th>Goal Tier</th>
                                        <th>Value</th>
                                        <th>Calculation</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                    
                    const resultValues = processDetails.resultValues;
                    const bpsDecimal = this.bpsThreshold / 100;
                    
                    // Show goal tiers
                    if (resultValues.G1_goal !== undefined) {
                        detailsHTML += `
                            <tr class="bg-success text-white">
                                <td><strong>G1 Goal</strong></td>
                                <td>${this.formatValue(resultValues.G1_goal)}</td>
                                <td>G2 + ${bpsDecimal}</td>
                            </tr>
                        `;
                    }
                    
                    if (resultValues.G2_goal !== undefined) {
                        detailsHTML += `
                            <tr class="bg-primary text-white">
                                <td><strong>G2 Goal</strong></td>
                                <td>${this.formatValue(resultValues.G2_goal)}</td>
                                <td>Calculated from rules</td>
                            </tr>
                        `;
                    }
                    
                    if (resultValues.G3_goal !== undefined) {
                        detailsHTML += `
                            <tr class="bg-danger text-white">
                                <td><strong>G3 Goal</strong></td>
                                <td>${this.formatValue(resultValues.G3_goal)}</td>
                                <td>max(0, G2 - ${bpsDecimal})</td>
                            </tr>
                        `;
                    }
                    
                    detailsHTML += `
                                </tbody>
                            </table>
                        </div>
                    `;
                }
                
                detailsHTML += `
                        </div>
                    </div>
                `;
            }
            
            detailsContainer.innerHTML = detailsHTML;
            
            // Add interactivity
            document.querySelectorAll('.rule-application-container').forEach(container => {
                const header = container.querySelector('.rule-application-header');
                const body = container.querySelector('.rule-application-body');
                
                if (header && body) {
                    header.style.cursor = 'pointer';
                    header.addEventListener('click', () => {
                        body.classList.toggle('collapsed');
                        if (body.classList.contains('collapsed')) {
                            body.style.maxHeight = '0';
                            body.style.padding = '0';
                            header.classList.add('collapsed-header');
                        } else {
                            body.style.maxHeight = '';
                            body.style.padding = '';
                            header.classList.remove('collapsed-header');
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error generating rule application details:', error);
            
            const detailsContainer = document.getElementById('ruleApplicationSummary');
            if (detailsContainer) {
                detailsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <strong>Error generating details:</strong> ${error.message}
                    </div>
                `;
            }
        }
    },
    
    /**
     * Toggle rule application details visibility
     */
    toggleRuleApplicationDetails() {
        const detailsContainer = document.getElementById('ruleApplicationDetails');
        const toggleButton = document.getElementById('showDataDetails');
        const hideButton = document.getElementById('hideDataDetails');
        
        if (!detailsContainer || !toggleButton) return;
        
        const isHidden = detailsContainer.style.display === 'none' || detailsContainer.classList.contains('hidden');
        
        if (isHidden) {
            // Show details
            detailsContainer.style.display = 'block';
            detailsContainer.classList.remove('hidden');
            detailsContainer.classList.add('details-fade-in');
            
            // Update button text and icon
            toggleButton.innerHTML = '<i class="fa fa-eye-slash"></i> Hide Details';
            toggleButton.classList.remove('btn-outline-primary');
            toggleButton.classList.add('btn-outline-secondary');
            
            // Generate details if not already done
            if (!detailsContainer.querySelector('#ruleApplicationSummary').innerHTML.includes('rule-application-container')) {
                this.generateRuleApplicationDetails();
            }
        } else {
            // Hide details
            detailsContainer.style.display = 'none';
            detailsContainer.classList.add('hidden');
            detailsContainer.classList.remove('details-fade-in');
            
            // Update button text and icon
            toggleButton.innerHTML = '<i class="fa fa-info-circle"></i> Show Details';
            toggleButton.classList.remove('btn-outline-secondary');
            toggleButton.classList.add('btn-outline-primary');
        }
        
        // Add event listener to hide button if it exists
        if (hideButton) {
            hideButton.onclick = () => {
                detailsContainer.style.display = 'none';
                detailsContainer.classList.add('hidden');
                toggleButton.innerHTML = '<i class="fa fa-info-circle"></i> Show Details';
                toggleButton.classList.remove('btn-outline-secondary');
                toggleButton.classList.add('btn-outline-primary');
            };
        }
    },
    
    /**
     * Export results to Excel
     */
    exportResults() {
        try {
            if (!this.calculatedData || this.calculatedData.length === 0) {
                alert('No results to export.');
                return;
            }
            
            // Check if XLSX library is available
            if (!window.XLSX) {
                console.error('XLSX library not loaded');
                alert('Error: Excel export library not loaded. Please refresh the page and try again.');
                return;
            }
            
            // Get process column name
            const processColumnName = window.appData?.processColumnName || 'Process';
            
            // Create a new workbook
            const wb = XLSX.utils.book_new();
            
            // Create a deep copy of the data with metadata
            const exportData = this.calculatedData.map(row => {
                const exportRow = { ...row };
                exportRow['BPS_Threshold'] = this.bpsThreshold;
                exportRow['Null_Handling_Strategy'] = this.nullHandling;
                exportRow['Export_Date'] = new Date().toISOString().split('T')[0];
                return exportRow;
            });
            
            // Create the main worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Add header information
            XLSX.utils.sheet_add_aoa(ws, [
                ['Goal Setting Results'],
                [`BPS Threshold: ${this.bpsThreshold} basis points`],
                [`Null Handling Strategy: ${this.nullHandling}`],
                ['G1 = G2 + ' + (this.bpsThreshold/100) + ' (Goal)'],
                ['G2 = Base Goal (Target)'],
                ['G3 = G2 - ' + (this.bpsThreshold/100) + ' (Goal)'],
                [''] // Empty row for spacing
            ], { origin: 'A1' });
            
            // Add the worksheet to the workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Goal Results');
            
            // Create detailed rule application worksheet
            if (Object.keys(this.ruleApplicationDetails).length > 0) {
                const detailsData = [];
                
                // Add header row
                detailsData.push(['Process', 'G2 Goal Source', 'Final G2 Goal', 'G1 Goal', 'G3 Goal', 'Null Values', 'Applied Rules Count']);
                
                // Add details for each process
                for (const processId in this.ruleApplicationDetails) {
                    const processDetails = this.ruleApplicationDetails[processId];
                    
                    const nullValues = Object.keys(processDetails.nullValuesEncountered).join(', ');
                    
                    detailsData.push([
                        processId,
                        processDetails.g2GoalSource || 'No rules applied',
                        processDetails.finalG2Goal || 0,
                        processDetails.resultValues.G1_goal || 0,
                        processDetails.resultValues.G3_goal || 0,
                        nullValues || 'None',
                        processDetails.appliedRules.length
                    ]);
                }
                
                // Create worksheet
                const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
                
                // Add to workbook
                XLSX.utils.book_append_sheet(wb, detailsWs, 'Rule Application Details');
            }
            
            // Write to file and trigger download
            XLSX.writeFile(wb, 'goal_setting_results.xlsx');
        } catch (error) {
            console.error('Error exporting results:', error);
            alert(`Error exporting results: ${error.message}`);
        }
    }
};

// Initialize goal processor on page load
document.addEventListener('DOMContentLoaded', () => {
    goalProcessor.init();
    
    // Add debug capability
    window.debugGoalProcessor = () => {
        console.log("Goal Processor State:", {
            bpsThreshold: goalProcessor.bpsThreshold,
            nullHandling: goalProcessor.nullHandling,
            calculatedData: goalProcessor.calculatedData.length,
            ruleApplicationDetails: Object.keys(goalProcessor.ruleApplicationDetails).length,
            sampleRuleDetails: Object.keys(goalProcessor.ruleApplicationDetails).length > 0 ? 
                goalProcessor.ruleApplicationDetails[Object.keys(goalProcessor.ruleApplicationDetails)[0]] : null
        });
    };
});