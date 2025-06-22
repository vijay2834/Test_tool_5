/**
 * rule-storage.js - Complete Updated Version with Individual JSON Downloads
 * Handles saving, loading, and managing rule definitions with full nested rule support
 */

const ruleStorage = {
    rules: [],
    selectedRuleIds: [],
    initialized: false,
    
    /**
     * Initialize rule storage and event listeners
     */
    init() {
        console.log("Initializing rule storage");
        
        if (!this.rules) {
            this.rules = [];
        }
        
        if (!this.selectedRuleIds) {
            this.selectedRuleIds = [];
        }
        
        this.initEvents();
        
        window.appRules = {
            rules: this.rules,
            selectedRuleIds: this.selectedRuleIds
        };
        
        this.displaySavedRules();
        
        this.initialized = true;
        console.log("Rule storage initialized");
    },
    
    /**
     * Initialize event listeners
     */
    initEvents() {
        const exportBtn = document.getElementById("exportRules");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => this.exportRules());
        }
        
        const importBtn = document.getElementById("importRules");
        if (importBtn) {
            importBtn.addEventListener("click", () => {
                const importInput = document.getElementById("importRulesInput");
                if (importInput) {
                    importInput.click();
                }
            });
        }
        
        const importInput = document.getElementById("importRulesInput");
        if (importInput) {
            importInput.addEventListener("change", (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.importRulesFromFile(file);
                }
                importInput.value = "";
            });
        }
        
        const downloadSelectedBtn = document.getElementById("downloadSelectedRules");
        if (downloadSelectedBtn) {
            downloadSelectedBtn.addEventListener("click", () => this.downloadSelectedRules());
        }
        
        const deleteSelectedBtn = document.getElementById("deleteSelectedRules");
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener("click", () => this.deleteSelectedRules());
        }
    },
    
    /**
     * Save a rule - IMPROVED to handle complex nested structures
     */
    saveRule(name, description, ruleDefinition) {
        try {
            if (!this.initialized) {
                this.init();
            }
            
            if (!name || typeof name !== 'string') {
                this.showValidationMessage("Rule name is required");
                return false;
            }
            
            if (!ruleDefinition || typeof ruleDefinition !== 'object') {
                this.showValidationMessage("Invalid rule structure");
                return false;
            }
            
            console.log("Saving rule definition:", JSON.stringify(ruleDefinition, null, 2));
            
            // Enhanced validation for complex rule structures
            if (!this.validateComplexRuleStructure(ruleDefinition)) {
                this.showValidationMessage("Invalid rule structure - please check all conditions and actions");
                return false;
            }
            
            const existingRuleIndex = this.rules.findIndex(r => 
                r.name.toLowerCase() === name.toLowerCase()
            );
            
            const timestamp = new Date().toISOString();
            
            if (existingRuleIndex >= 0) {
                this.rules[existingRuleIndex] = {
                    ...this.rules[existingRuleIndex],
                    name: name,
                    description: description || '',
                    rule: this.deepCloneRule(ruleDefinition), // Deep clone to prevent reference issues
                    lastModified: timestamp
                };
                
                this.showNotification(`Rule "${name}" has been updated`, "success");
            } else {
                const newRule = {
                    id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique ID
                    name: name,
                    description: description || '',
                    rule: this.deepCloneRule(ruleDefinition), // Deep clone to prevent reference issues
                    created: timestamp,
                    lastModified: timestamp
                };
                
                this.rules.push(newRule);
                this.showNotification(`Rule "${name}" has been saved`, "success");
            }
            
            this.displaySavedRules();
            
            window.appRules = {
                rules: this.rules,
                selectedRuleIds: this.selectedRuleIds
            };
            
            const noRulesWarning = document.getElementById("noRulesWarning");
            if (noRulesWarning) {
                noRulesWarning.classList.add("hidden");
            }
            
            const btnToStep4 = document.getElementById("btnToStep4");
            if (btnToStep4) {
                btnToStep4.disabled = false;
            }
            
            console.log(`Rule saved: ${name}, ID: ${this.rules[this.rules.length-1]?.id}`);
            return true;
        } catch (error) {
            console.error("Error saving rule:", error);
            this.showValidationMessage(`Error saving rule: ${error.message}`);
            return false;
        }
    },
    
    /**
     * Deep clone a rule to prevent reference issues
     */
    deepCloneRule(rule) {
        try {
            return JSON.parse(JSON.stringify(rule));
        } catch (error) {
            console.error('Error deep cloning rule:', error);
            return rule;
        }
    },
    
    /**
     * Validate complex rule structure - ENHANCED VERSION
     */
    validateComplexRuleStructure(ruleDefinition) {
        try {
            if (!ruleDefinition || typeof ruleDefinition !== 'object') {
                console.error('Rule definition is not an object');
                return false;
            }
            
            // Check if we have at least a base rule
            if (!ruleDefinition.baseRule) {
                console.error('No base rule found');
                return false;
            }
            
            // Validate base rule
            if (!this.validateSingleRule(ruleDefinition.baseRule, 'Base Rule')) {
                return false;
            }
            
            // Validate calculated rule if present
            if (ruleDefinition.calculatedRule) {
                if (!this.validateSingleRule(ruleDefinition.calculatedRule, 'Calculated Rule')) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error validating complex rule structure:', error);
            return false;
        }
    },
    
    /**
     * Validate a single rule with enhanced nested rule validation
     */
    validateSingleRule(rule, ruleName = 'Rule') {
        try {
            if (!rule || typeof rule !== 'object') {
                console.error(`${ruleName}: Rule is not an object`);
                return false;
            }
            
            // Check main condition
            if (!rule.condition || !rule.condition.leftColumn || !rule.condition.operator) {
                console.error(`${ruleName}: Missing main condition parts`);
                return false;
            }
            
            // Check right side of condition
            if (rule.condition.rightType === 'value') {
                if (!rule.condition.rightValue && rule.condition.rightValue !== '0') {
                    console.error(`${ruleName}: Missing right value for value comparison`);
                    return false;
                }
            } else if (rule.condition.rightType === 'column') {
                if (!rule.condition.rightColumn) {
                    console.error(`${ruleName}: Missing right column for column comparison`);
                    return false;
                }
            }
            
            // Check main action
            if (!rule.action || !rule.action.column || !rule.action.type) {
                console.error(`${ruleName}: Missing action parts`);
                return false;
            }
            
            // For non-reset actions, check if value exists
            if (rule.action.type !== 'reset' && !rule.action.value && rule.action.value !== '0') {
                console.error(`${ruleName}: Missing action value for ${rule.action.type}`);
                return false;
            }
            
            // Validate AND conditions if present
            if (rule.condition.andConditions && Array.isArray(rule.condition.andConditions)) {
                for (let i = 0; i < rule.condition.andConditions.length; i++) {
                    const andCondition = rule.condition.andConditions[i];
                    if (!this.validateCondition(andCondition, `${ruleName} AND Condition ${i + 1}`)) {
                        return false;
                    }
                }
            }
            
            // Validate OR conditions if present
            if (rule.condition.orConditions && Array.isArray(rule.condition.orConditions)) {
                for (let i = 0; i < rule.condition.orConditions.length; i++) {
                    const orCondition = rule.condition.orConditions[i];
                    if (!this.validateCondition(orCondition, `${ruleName} OR Condition ${i + 1}`)) {
                        return false;
                    }
                }
            }
            
            // Validate else action if present
            if (rule.elseAction) {
                if (!rule.elseAction.column || !rule.elseAction.type) {
                    console.error(`${ruleName}: Missing else action parts`);
                    return false;
                }
                
                if (rule.elseAction.type !== 'reset' && !rule.elseAction.value && rule.elseAction.value !== '0') {
                    console.error(`${ruleName}: Missing else action value`);
                    return false;
                }
            }
            
            // Validate nested rules if present
            if (rule.nestedRules && Array.isArray(rule.nestedRules)) {
                for (let i = 0; i < rule.nestedRules.length; i++) {
                    const nestedRule = rule.nestedRules[i];
                    if (!this.validateSingleRule(nestedRule, `${ruleName} Nested Rule ${i + 1}`)) {
                        return false;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Error validating ${ruleName}:`, error);
            return false;
        }
    },
    
    /**
     * Validate a condition (for AND/OR conditions)
     */
    validateCondition(condition, conditionName) {
        try {
            if (!condition || !condition.leftColumn || !condition.operator) {
                console.error(`${conditionName}: Missing condition parts`);
                return false;
            }
            
            // Check right side
            if (condition.rightType === 'value') {
                if (!condition.rightValue && condition.rightValue !== '0') {
                    console.error(`${conditionName}: Missing right value`);
                    return false;
                }
            } else if (condition.rightType === 'column') {
                if (!condition.rightColumn) {
                    console.error(`${conditionName}: Missing right column`);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Error validating ${conditionName}:`, error);
            return false;
        }
    },
    
    /**
     * Display saved rules in the UI - ENHANCED VERSION
     */
    displaySavedRules() {
        const container = document.getElementById("savedRulesContainer");
        if (!container) return;
        
        const ruleDropdown = document.getElementById("savedRulesDropdown");
        
        if (!this.rules || this.rules.length === 0) {
            container.innerHTML = '<p class="text-muted">No saved rules yet.</p>';
            
            if (ruleDropdown) {
                ruleDropdown.innerHTML = '';
            }
            
            const ruleActions = document.getElementById("ruleActions");
            if (ruleActions) {
                ruleActions.classList.add("hidden");
            }
            
            return;
        }
        
        const ruleActions = document.getElementById("ruleActions");
        if (ruleActions) {
            ruleActions.classList.remove("hidden");
        }
        
        let rulesHTML = '';
        
        this.rules.forEach(rule => {
            const isSelected = this.selectedRuleIds.includes(rule.id);
            
            // Enhanced badges for rule complexity
            const badges = this.generateRuleBadges(rule);
            
            rulesHTML += `
                <div class="rule-item">
                    <div class="rule-header">
                        <input type="checkbox" class="rule-checkbox" data-id="${rule.id}" id="rule-check-${rule.id}" 
                            ${isSelected ? 'checked' : ''}>
                        <div>
                            <div class="rule-name">${this.escapeHTML(rule.name)}${badges}</div>
                            ${rule.description ? `<div class="rule-description">${this.escapeHTML(rule.description)}</div>` : ''}
                            <div class="rule-complexity">${this.getRuleComplexityDescription(rule)}</div>
                        </div>
                    </div>
                    <div class="rule-controls">
                        <button class="btn btn-sm btn-outline-primary edit-rule" data-id="${rule.id}" title="Edit rule">Edit</button>
                        <button class="btn btn-sm btn-outline-secondary duplicate-rule" data-id="${rule.id}" title="Duplicate rule">Clone</button>
                        <button class="btn btn-sm btn-outline-info preview-rule" data-id="${rule.id}" title="Preview rule structure">Preview</button>
                        <button class="btn btn-sm btn-outline-danger delete-rule" data-id="${rule.id}" title="Delete rule">Delete</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = rulesHTML;
        
        this.attachRuleEventListeners();
        
        if (ruleDropdown) {
            ruleDropdown.innerHTML = this.rules.map(rule => 
                `<option value="${rule.id}">${this.escapeHTML(rule.name)}</option>`
            ).join('');
            
            if (this.selectedRuleIds.length > 0) {
                Array.from(ruleDropdown.options).forEach(option => {
                    option.selected = this.selectedRuleIds.includes(parseInt(option.value));
                });
            }
        }
    },
    
    /**
     * Generate badges for rule complexity
     */
    generateRuleBadges(rule) {
        let badges = '';
        
        if (rule.rule && rule.rule.calculatedRule) {
            badges += '<span class="badge bg-info ms-2">Has Calculated Rule</span>';
        }
        
        if (rule.rule && rule.rule.baseRule) {
            // Check for nested rules
            if (rule.rule.baseRule.nestedRules && rule.rule.baseRule.nestedRules.length > 0) {
                badges += `<span class="badge bg-secondary ms-2">Has ${rule.rule.baseRule.nestedRules.length} Nested Rule${rule.rule.baseRule.nestedRules.length > 1 ? 's' : ''}</span>`;
            }
            
            // Check for else action
            if (rule.rule.baseRule.elseAction) {
                badges += '<span class="badge bg-warning ms-2">Has Else Action</span>';
            }
            
            // Check for AND/OR conditions
            const andCount = rule.rule.baseRule.condition?.andConditions?.length || 0;
            const orCount = rule.rule.baseRule.condition?.orConditions?.length || 0;
            
            if (andCount > 0) {
                badges += `<span class="badge bg-primary ms-2">${andCount} AND</span>`;
            }
            
            if (orCount > 0) {
                badges += `<span class="badge bg-success ms-2">${orCount} OR</span>`;
            }
        }
        
        return badges;
    },
    
    /**
     * Get rule complexity description
     */
    getRuleComplexityDescription(rule) {
        try {
            const parts = [];
            
            if (rule.rule && rule.rule.baseRule) {
                parts.push('Base Rule');
                
                const baseRule = rule.rule.baseRule;
                
                // Count conditions
                let conditionCount = 1; // Main condition
                if (baseRule.condition?.andConditions) conditionCount += baseRule.condition.andConditions.length;
                if (baseRule.condition?.orConditions) conditionCount += baseRule.condition.orConditions.length;
                
                if (conditionCount > 1) {
                    parts.push(`${conditionCount} conditions`);
                }
                
                if (baseRule.elseAction) {
                    parts.push('Else action');
                }
                
                if (baseRule.nestedRules && baseRule.nestedRules.length > 0) {
                    parts.push(`${baseRule.nestedRules.length} nested rule${baseRule.nestedRules.length > 1 ? 's' : ''}`);
                }
            }
            
            if (rule.rule && rule.rule.calculatedRule) {
                parts.push('Calculated Rule');
            }
            
            return parts.length > 0 ? parts.join(' • ') : 'Simple rule';
        } catch (error) {
            console.error('Error getting rule complexity description:', error);
            return 'Unknown complexity';
        }
    },
    
    /**
     * Attach event listeners to rule items - ENHANCED VERSION
     */
    attachRuleEventListeners() {
        // Checkbox selection
        document.querySelectorAll(".rule-checkbox").forEach(checkbox => {
            checkbox.addEventListener("change", (e) => {
                const ruleId = parseInt(e.target.getAttribute("data-id"));
                
                if (e.target.checked) {
                    if (!this.selectedRuleIds.includes(ruleId)) {
                        this.selectedRuleIds.push(ruleId);
                    }
                } else {
                    this.selectedRuleIds = this.selectedRuleIds.filter(id => id !== ruleId);
                }
                
                this.updateActionButtonsState();
                
                window.appRules.selectedRuleIds = this.selectedRuleIds;
            });
        });
        
        // Edit rule button
        document.querySelectorAll(".edit-rule").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const ruleId = parseInt(e.target.getAttribute("data-id"));
                const rule = this.rules.find(r => r.id === ruleId);
                if (rule) {
                    this.editRule(rule);
                }
            });
        });
        
        // Duplicate rule button
        document.querySelectorAll(".duplicate-rule").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const ruleId = parseInt(e.target.getAttribute("data-id"));
                const rule = this.rules.find(r => r.id === ruleId);
                if (rule) {
                    this.duplicateRule(rule);
                }
            });
        });
        
        // Preview rule button - NEW FEATURE
        document.querySelectorAll(".preview-rule").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const ruleId = parseInt(e.target.getAttribute("data-id"));
                const rule = this.rules.find(r => r.id === ruleId);
                if (rule) {
                    this.previewRule(rule);
                }
            });
        });
        
        // Delete rule button
        document.querySelectorAll(".delete-rule").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const ruleId = parseInt(e.target.getAttribute("data-id"));
                this.deleteRule(ruleId);
            });
        });
    },
    
    /**
     * Preview rule structure - NEW FEATURE
     */
    previewRule(rule) {
        try {
            const previewHTML = this.generateRulePreviewHTML(rule);
            
            // Create modal or popup for preview
            const modal = document.createElement('div');
            modal.className = 'rule-preview-modal';
            modal.innerHTML = `
                <div class="rule-preview-content">
                    <div class="rule-preview-header">
                        <h5>Rule Preview: ${this.escapeHTML(rule.name)}</h5>
                        <button class="close-preview">&times;</button>
                    </div>
                    <div class="rule-preview-body">
                        ${previewHTML}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add close functionality
            modal.querySelector('.close-preview').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            
        } catch (error) {
            console.error('Error previewing rule:', error);
            this.showNotification('Error previewing rule', 'error');
        }
    },
    
    /**
     * Generate HTML for rule preview
     */
    generateRulePreviewHTML(rule) {
        try {
            let html = '';
            
            if (rule.description) {
                html += `<div class="rule-preview-description"><strong>Description:</strong> ${this.escapeHTML(rule.description)}</div>`;
            }
            
            if (rule.rule.baseRule) {
                html += '<div class="rule-preview-section"><h6>Base Rule:</h6>';
                html += this.formatRuleForPreview(rule.rule.baseRule);
                html += '</div>';
            }
            
            if (rule.rule.calculatedRule) {
                html += '<div class="rule-preview-section"><h6>Calculated Rule:</h6>';
                html += this.formatRuleForPreview(rule.rule.calculatedRule);
                html += '</div>';
            }
            
            return html;
        } catch (error) {
            console.error('Error generating rule preview HTML:', error);
            return '<div class="alert alert-danger">Error generating preview</div>';
        }
    },
    
    /**
     * Format a rule for preview display
     */
    formatRuleForPreview(rule) {
        try {
            let html = '<div class="rule-preview-rule">';
            
            // Main condition
            html += `<div class="rule-preview-condition">
                <strong>IF</strong> ${this.formatConditionForPreview(rule.condition)}
            </div>`;
            
            // AND conditions
            if (rule.condition.andConditions && rule.condition.andConditions.length > 0) {
                rule.condition.andConditions.forEach(andCondition => {
                    html += `<div class="rule-preview-and-condition">
                        <strong>AND</strong> ${this.formatConditionForPreview(andCondition)}
                    </div>`;
                });
            }
            
            // OR conditions
            if (rule.condition.orConditions && rule.condition.orConditions.length > 0) {
                rule.condition.orConditions.forEach(orCondition => {
                    html += `<div class="rule-preview-or-condition">
                        <strong>OR</strong> ${this.formatConditionForPreview(orCondition)}
                    </div>`;
                });
            }
            
            // Main action
            html += `<div class="rule-preview-action">
                <strong>THEN</strong> ${this.formatActionForPreview(rule.action)}
            </div>`;
            
            // Else action
            if (rule.elseAction) {
                html += `<div class="rule-preview-else-action">
                    <strong>ELSE</strong> ${this.formatActionForPreview(rule.elseAction)}
                </div>`;
            }
            
            // Nested rules
            if (rule.nestedRules && rule.nestedRules.length > 0) {
                html += '<div class="rule-preview-nested"><strong>Nested Rules:</strong>';
                rule.nestedRules.forEach((nestedRule, index) => {
                    html += `<div class="rule-preview-nested-rule">
                        <strong>Nested Rule ${index + 1}:</strong>
                        ${this.formatRuleForPreview(nestedRule)}
                    </div>`;
                });
                html += '</div>';
            }
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error('Error formatting rule for preview:', error);
            return '<div class="text-danger">Error formatting rule</div>';
        }
    },
    
    /**
     * Format condition for preview
     */
    formatConditionForPreview(condition) {
        try {
            const leftColumn = condition.leftColumn || '?';
            const operator = condition.operator || '?';
            
            let rightPart = '';
            if (condition.rightType === 'value' || condition.rightType === 'custom') {
                rightPart = condition.rightValue || '0';
            } else {
                rightPart = condition.rightColumn || condition.rightType || '?';
            }
            
            return `${this.escapeHTML(leftColumn)} ${operator} ${this.escapeHTML(rightPart)}`;
        } catch (error) {
            return 'Invalid condition';
        }
    },
    
    /**
     * Format action for preview
     */
    formatActionForPreview(action) {
        try {
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
            
            return this.escapeHTML(formattedAction);
        } catch (error) {
            return 'Invalid action';
        }
    },
    
    /**
     * Update state of action buttons based on selection
     */
    updateActionButtonsState() {
        const downloadBtn = document.getElementById("downloadSelectedRules");
        const deleteBtn = document.getElementById("deleteSelectedRules");
        
        if (downloadBtn) {
            downloadBtn.disabled = this.selectedRuleIds.length === 0;
        }
        
        if (deleteBtn) {
            deleteBtn.disabled = this.selectedRuleIds.length === 0;
        }
    },
    
    /**
     * Load a rule for editing - COMPREHENSIVE VERSION
     */
    editRule(rule) {
        if (!rule) return;
        
        try {
            console.log('Editing rule:', rule.name);
            console.log('Rule structure:', JSON.stringify(rule.rule, null, 2));
            
            if (!window.ruleBuilder) {
                console.error("ruleBuilder is not initialized");
                
                if (typeof ruleBuilder !== 'undefined') {
                    window.ruleBuilder = ruleBuilder;
                    console.log("Explicitly set window.ruleBuilder");
                } else {
                    this.showNotification("Error: Rule builder is not available. Please refresh the page.", "error");
                    return;
                }
            }
            
            // Set form values
            const nameInput = document.getElementById("ruleName");
            const descriptionInput = document.getElementById("ruleDescription");
            
            if (nameInput) nameInput.value = rule.name;
            if (descriptionInput) descriptionInput.value = rule.description || '';
            
            // Clear any existing rules from the UI
            this.clearRuleBuilderUI();
            
            // Wait for UI to clear, then recreate the rule
            setTimeout(() => {
                if (window.ruleBuilder && typeof window.ruleBuilder.recreateRuleFromDefinition === 'function') {
                    window.ruleBuilder.recreateRuleFromDefinition(rule.rule);
                } else {
                    console.error("Rule builder recreateRuleFromDefinition method not available");
                    this.showNotification("Error: Rule builder functionality is not available", "error");
                    return;
                }
            }, 100);
            
            // Remove the rule from storage (will be re-added on save)
            this.rules = this.rules.filter(r => r.id !== rule.id);
            
            // Update UI
            this.displaySavedRules();
            
            this.showNotification(`Rule "${rule.name}" loaded for editing`, "info");
            
        } catch (error) {
            console.error('Error editing rule:', error);
            this.showNotification(`Error loading rule for editing: ${error.message}`, "error");
        }
    },
    
    /**
     * Clear rule builder UI
     */
    clearRuleBuilderUI() {
        try {
            // Clear rule containers
            const ruleContainer = document.getElementById('ruleContainer');
            if (ruleContainer) {
                ruleContainer.innerHTML = '';
            }
            
            const calculatedRuleContainer = document.getElementById('calculatedRuleContainer');
            if (calculatedRuleContainer) {
                calculatedRuleContainer.innerHTML = '';
                calculatedRuleContainer.classList.add('hidden');
            }
            
            // Show add calculated rule button
            const addCalculatedRuleBtn = document.getElementById('addCalculatedRule');
            if (addCalculatedRuleBtn) {
                addCalculatedRuleBtn.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Error clearing rule builder UI:', error);
        }
    },
    
    /**
     * Duplicate a rule - ENHANCED VERSION
     */
    duplicateRule(rule) {
        if (!rule) return;
        
        try {
            const ruleCopy = this.deepCloneRule(rule);
            
            let newName = `${rule.name} (Copy)`;
            let counter = 1;
            
            while (this.rules.some(r => r.name === newName)) {
                counter++;
                newName = `${rule.name} (Copy ${counter})`;
            }
            
            this.saveRule(newName, rule.description, ruleCopy.rule);
            this.showNotification(`Rule duplicated as "${newName}"`, "success");
        } catch (error) {
            console.error('Error duplicating rule:', error);
            this.showNotification('Error duplicating rule', 'error');
        }
    },
    
    /**
     * Delete a rule
     */
    deleteRule(ruleId) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (!rule) return;
        
        if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
            return;
        }
        
        this.rules = this.rules.filter(r => r.id !== ruleId);
        this.selectedRuleIds = this.selectedRuleIds.filter(id => id !== ruleId);
        
        this.displaySavedRules();
        this.updateActionButtonsState();
        
        window.appRules = {
            rules: this.rules,
            selectedRuleIds: this.selectedRuleIds
        };
        
        this.showNotification(`Rule "${rule.name}" has been deleted`, "info");
        
        if (this.rules.length === 0) {
            const noRulesWarning = document.getElementById("noRulesWarning");
            if (noRulesWarning) {
                noRulesWarning.classList.remove("hidden");
            }
            
            const btnToStep4 = document.getElementById("btnToStep4");
            if (btnToStep4) {
                btnToStep4.disabled = true;
            }
        }
    },
    
    /**
     * Delete multiple selected rules
     */
    deleteSelectedRules() {
        if (this.selectedRuleIds.length === 0) return;
        
        const selectedCount = this.selectedRuleIds.length;
        
        if (!confirm(`Are you sure you want to delete ${selectedCount} selected rule${selectedCount !== 1 ? 's' : ''}?`)) {
            return;
        }
        
        this.rules = this.rules.filter(rule => !this.selectedRuleIds.includes(rule.id));
        this.selectedRuleIds = [];
        
        this.displaySavedRules();
        this.updateActionButtonsState();
        
        window.appRules = {
            rules: this.rules,
            selectedRuleIds: this.selectedRuleIds
        };
        
        this.showNotification(`${selectedCount} rule${selectedCount !== 1 ? 's' : ''} deleted`, "info");
        
        if (this.rules.length === 0) {
            const noRulesWarning = document.getElementById("noRulesWarning");
            if (noRulesWarning) {
                noRulesWarning.classList.remove("hidden");
            }
            
            const btnToStep4 = document.getElementById("btnToStep4");
            if (btnToStep4) {
                btnToStep4.disabled = true;
            }
        }
    },
    
    /**
     * Export all rules as JSON
     */
    exportRules() {
        if (this.rules.length === 0) {
            this.showValidationMessage("No rules to export");
            return;
        }
        
        const exportData = {
            version: "2.2", // Updated version for enhanced rule structure
            exportDate: new Date().toISOString(),
            appInfo: {
                name: "Goal Setting Framework",
                creator: "Enhanced Rule Builder with Complex Nested Rules"
            },
            rules: this.rules.map(rule => ({
                ...rule,
                rule: this.deepCloneRule(rule.rule) // Ensure clean copy
            }))
        };
        
        const rulesJSON = JSON.stringify(exportData, null, 2);
        this.downloadJSON(rulesJSON, "goal_setting_rules.json");
        
        this.showNotification(`Exported ${this.rules.length} rules`, "success");
    },
    
    /**
     * Download selected rules - UPDATED VERSION for individual JSON files
     */
    downloadSelectedRules() {
        if (this.selectedRuleIds.length === 0) {
            this.showValidationMessage("No rules selected for download");
            return;
        }
        
        const selectedRules = this.rules.filter(rule => 
            this.selectedRuleIds.includes(rule.id)
        );
        
        if (selectedRules.length === 1) {
            // Single rule - download as individual file
            const rule = selectedRules[0];
            this.downloadSingleRule(rule);
        } else {
            // Multiple rules - download each as individual file
            this.downloadMultipleRulesAsIndividualFiles(selectedRules);
        }
        
        this.showNotification(`Downloaded ${selectedRules.length} rule${selectedRules.length > 1 ? 's' : ''} as individual JSON file${selectedRules.length > 1 ? 's' : ''}`, "success");
    },
    
    /**
     * Download a single rule as individual JSON file with rule name and description first
     */
    downloadSingleRule(rule) {
        try {
            const sanitizedName = this.sanitizeFilename(rule.name);
            
            // Create export data with rule name and description first
            const exportData = {
                ruleName: rule.name,
                ruleDescription: rule.description || '',
                version: "2.2",
                exportDate: new Date().toISOString(),
                appInfo: {
                    name: "Goal Setting Framework",
                    creator: "Enhanced Rule Builder with Complex Nested Rules"
                },
                id: rule.id,
                created: rule.created,
                lastModified: rule.lastModified,
                rule: this.deepCloneRule(rule.rule)
            };
            
            const ruleJSON = JSON.stringify(exportData, null, 2);
            this.downloadJSON(ruleJSON, `${sanitizedName}.json`);
            
        } catch (error) {
            console.error('Error downloading single rule:', error);
            this.showNotification('Error downloading rule', 'error');
        }
    },
    
    /**
     * Download multiple rules as individual JSON files
     */
    downloadMultipleRulesAsIndividualFiles(selectedRules) {
        try {
            selectedRules.forEach((rule, index) => {
                // Add a small delay between downloads to prevent browser blocking
                setTimeout(() => {
                    this.downloadSingleRule(rule);
                }, index * 100);
            });
            
        } catch (error) {
            console.error('Error downloading multiple rules:', error);
            this.showNotification('Error downloading rules', 'error');
        }
    },
    
    /**
     * Sanitize a string for use as a filename
     */
    sanitizeFilename(name) {
        return name.replace(/[\\/:*?"<>|]/g, '_')
                  .replace(/\s+/g, '_')
                  .replace(/_{2,}/g, '_');
    },
    
    /**
     * Create JSON download
     */
    downloadJSON(jsonStr, filename) {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    
    /**
     * Import rules from file
     */
    importRulesFromFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const jsonText = e.target.result;
                this.importRules(jsonText);
            } catch (error) {
                console.error("Error reading rule file:", error);
                this.showValidationMessage(`Error reading file: ${error.message}`);
            }
        };
        
        reader.onerror = () => {
            this.showValidationMessage("Error reading file");
        };
        
        reader.readAsText(file);
    },
    
    /**
     * Import rules from JSON - ENHANCED VERSION
     */
    importRules(jsonText) {
        try {
            const importedData = JSON.parse(jsonText);
            
            let importedRules = [];
            
            // Handle different import formats
            if (importedData.ruleName && importedData.rule) {
                // Single rule format with rule name first
                importedRules = [{
                    name: importedData.ruleName,
                    description: importedData.ruleDescription || '',
                    rule: importedData.rule,
                    id: importedData.id || Date.now() + Math.floor(Math.random() * 1000),
                    created: importedData.created || new Date().toISOString(),
                    lastModified: importedData.lastModified || new Date().toISOString()
                }];
            } else if (Array.isArray(importedData)) {
                importedRules = importedData;
            } else if (importedData.rules && Array.isArray(importedData.rules)) {
                importedRules = importedData.rules;
                
                if (importedData.version) {
                    console.log(`Importing rules from version: ${importedData.version}`);
                }
            } else {
                throw new Error("Invalid rule file format");
            }
            
            if (importedRules.length === 0) {
                throw new Error("No rules found in the file");
            }
            
            console.log("Imported rules:", importedRules);
            
            // Enhanced validation for imported rules
            importedRules.forEach((rule, index) => {
                if (!rule.name || !rule.rule) {
                    throw new Error(`Invalid rule structure at index ${index}`);
                }
                
                // Convert old format to new format if needed
                if (rule.rule.baseRule || rule.rule.calculatedRule) {
                    // Already in new format
                    if (rule.rule.baseRule && !this.validateSingleRule(rule.rule.baseRule, `Imported rule ${rule.name} (Base)`)) {
                        throw new Error(`Invalid base rule structure in rule: ${rule.name}`);
                    }
                    if (rule.rule.calculatedRule && !this.validateSingleRule(rule.rule.calculatedRule, `Imported rule ${rule.name} (Calculated)`)) {
                        throw new Error(`Invalid calculated rule structure in rule: ${rule.name}`);
                    }
                } else {
                    // Old format - convert to new format
                    if (!this.validateSingleRule(rule.rule, `Imported rule ${rule.name}`)) {
                        throw new Error(`Invalid rule structure in rule: ${rule.name}`);
                    }
                    // Convert to new format
                    rule.rule = {
                        baseRule: rule.rule,
                        calculatedRule: null
                    };
                }
            });
            
            if (!this.initialized) {
                this.init();
            }
            
            if (this.rules.length > 0) {
                const confirmMessage = `You have ${this.rules.length} existing rules. Do you want to:\n\n` +
                                     "OK - Merge (add new rules, skip duplicates)\n" +
                                     "Cancel - Replace all existing rules";
                
                if (confirm(confirmMessage)) {
                    // Merge rules
                    const existingNames = this.rules.map(r => r.name.toLowerCase());
                    let newRulesCount = 0;
                    
                    importedRules.forEach(rule => {
                        if (!existingNames.includes(rule.name.toLowerCase())) {
                            rule.id = Date.now() + Math.floor(Math.random() * 1000);
                            this.rules.push(rule);
                            newRulesCount++;
                        }
                    });
                    
                    this.showNotification(`Imported ${newRulesCount} new rules`, "success");
                } else {
                    // Replace all rules
                    this.rules = importedRules.map(rule => ({
                        ...rule,
                        id: rule.id || Date.now() + Math.floor(Math.random() * 1000)
                    }));
                    
                    this.showNotification(`Replaced all rules. Imported ${importedRules.length} rules`, "success");
                }
            } else {
                // No existing rules
                this.rules = importedRules.map(rule => ({
                    ...rule,
                    id: rule.id || Date.now() + Math.floor(Math.random() * 1000)
                }));
                
                this.showNotification(`Imported ${importedRules.length} rules`, "success");
            }
            
            this.displaySavedRules();
            
            window.appRules = {
                rules: this.rules,
                selectedRuleIds: this.selectedRuleIds
            };
            
            const noRulesWarning = document.getElementById("noRulesWarning");
            if (noRulesWarning) {
                noRulesWarning.classList.add("hidden");
            }
            
            const btnToStep4 = document.getElementById("btnToStep4");
            if (btnToStep4) {
                btnToStep4.disabled = false;
            }
        } catch (error) {
            console.error("Error importing rules:", error);
            this.showValidationMessage(`Error importing rules: ${error.message}`);
        }
    },
    
    /**
     * Show validation message in the UI
     */
    showValidationMessage(message) {
        const validationMessage = document.getElementById("ruleValidationMessage");
        if (validationMessage) {
            validationMessage.textContent = message;
            validationMessage.classList.remove("hidden");
            
            setTimeout(() => {
                validationMessage.classList.add("hidden");
            }, 5000);
        }
    },
    
    /**
     * Show notification message
     */
    showNotification(message, type = "info") {
        let notification = document.getElementById("notificationMessage");
        
        if (!notification) {
            notification = document.createElement("div");
            notification.id = "notificationMessage";
            notification.className = `notification notification-${type}`;
            notification.style.position = "fixed";
            notification.style.bottom = "20px";
            notification.style.right = "20px";
            notification.style.maxWidth = "300px";
            notification.style.padding = "15px";
            notification.style.borderRadius = "4px";
            notification.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            notification.style.zIndex = "1000";
            notification.style.opacity = "0";
            notification.style.transform = "translateY(10px)";
            notification.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            document.body.appendChild(notification);
        } else {
            notification.className = `notification notification-${type}`;
        }
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#f6ffed';
                notification.style.borderLeft = '4px solid #52c41a';
                notification.style.color = '#389e0d';
                break;
            case 'error':
                notification.style.backgroundColor = '#fff1f0';
                notification.style.borderLeft = '4px solid #f5222d';
                notification.style.color = '#cf1322';
                break;
            case 'warning':
                notification.style.backgroundColor = '#fffbe6';
                notification.style.borderLeft = '4px solid #faad14';
                notification.style.color = '#d48806';
                break;
            default: // info
                notification.style.backgroundColor = '#e6f7ff';
                notification.style.borderLeft = '4px solid #1890ff';
                notification.style.color = '#0050b3';
        }
        
        notification.textContent = message;
        
        setTimeout(() => {
            notification.style.opacity = "1";
            notification.style.transform = "translateY(0)";
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = "0";
            notification.style.transform = "translateY(10px)";
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    ruleStorage.init();
    
    // Explicitly make ruleStorage available globally
    window.ruleStorage = ruleStorage;
    
    // Add debug capability
    window.debugRuleStorage = () => {
        console.log("Rule Storage State:", {
            rules: ruleStorage.rules.length,
            selectedRuleIds: ruleStorage.selectedRuleIds,
            initialized: ruleStorage.initialized,
            rulesDetails: ruleStorage.rules.map(rule => ({
                id: rule.id,
                name: rule.name,
                hasBaseRule: !!rule.rule?.baseRule,
                hasCalculatedRule: !!rule.rule?.calculatedRule,
                hasNestedRules: !!(rule.rule?.baseRule?.nestedRules?.length),
                complexity: ruleStorage.getRuleComplexityDescription(rule)
            }))
        });
    };
});

// Add CSS for rule preview modal
const style = document.createElement('style');
style.textContent = `
    .rule-preview-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1050;
    }
    
    .rule-preview-content {
        background: white;
        border-radius: 8px;
        max-width: 80%;
        max-height: 80%;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .rule-preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
        background-color: #f8f9fa;
        border-radius: 8px 8px 0 0;
    }
    
    .close-preview {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    }
    
    .close-preview:hover {
        color: #000;
    }
    
    .rule-preview-body {
        padding: 20px;
    }
    
    .rule-preview-section {
        margin-bottom: 20px;
        padding: 15px;
        border: 1px solid #eee;
        border-radius: 4px;
    }
    
    .rule-preview-condition {
        margin-bottom: 10px;
        padding: 8px;
        background-color: #e6f7ff;
        border-radius: 4px;
    }
    
    .rule-preview-and-condition {
        margin-bottom: 10px;
        margin-left: 20px;
        padding: 8px;
        background-color: #f0f8ff;
        border-radius: 4px;
    }
    
    .rule-preview-or-condition {
        margin-bottom: 10px;
        margin-left: 20px;
        padding: 8px;
        background-color: #fff0f5;
        border-radius: 4px;
    }
    
    .rule-preview-action {
        margin-bottom: 10px;
        padding: 8px;
        background-color: #f6ffed;
        border-radius: 4px;
    }
    
    .rule-preview-else-action {
        margin-bottom: 10px;
        padding: 8px;
        background-color: #fff7e6;
        border-radius: 4px;
    }
    
    .rule-preview-nested {
        margin-top: 15px;
        padding: 10px;
        border-left: 3px solid #ccc;
        background-color: #fafafa;
    }
    
    .rule-preview-nested-rule {
        margin-top: 10px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: white;
    }
    
    .rule-complexity {
        font-size: 0.85em;
        color: #666;
        margin-top: 5px;
        font-style: italic;
    }
`;

document.head.appendChild(style);