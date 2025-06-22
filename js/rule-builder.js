/**
 * rule-builder.js - Complete Updated Version with Fixed Nested Rule Handling and Enhanced Indentation
 * Creates and manages rule building interface with improved nested rule tracking and visual indentation
 */

const ruleBuilder = {
    currentRuleId: 0,
    hasBaseRule: false,
    initialized: false,
    nestedRuleMap: new Map(), // Track nested rules by parent ID
    
    /**
     * Initialize rule builder
     */
    init() {
        console.log("Initializing rule builder");
        this.currentRuleId = 0;
        this.hasBaseRule = false;
        this.initialized = false;
        this.nestedRuleMap.clear();
        this.initializeRuleCreation();
        this.setupEventListeners();
        this.initialized = true;
        console.log("Rule builder initialized with ID:", this.currentRuleId);
    },
    
    /**
     * Set up all event listeners for rule builder
     */
    setupEventListeners() {
        // Save rule button
        const saveRuleBtn = document.getElementById("saveRule");
        if (saveRuleBtn) {
            saveRuleBtn.addEventListener("click", () => this.saveCurrentRule());
        }
        
        // Clear rule button
        const clearRuleBtn = document.getElementById("clearRule");
        if (clearRuleBtn) {
            clearRuleBtn.addEventListener("click", () => this.clearRuleForm());
        }
        
        // Add calculated rule button
        const addCalculatedRuleBtn = document.getElementById("addCalculatedRule");
        if (addCalculatedRuleBtn) {
            addCalculatedRuleBtn.addEventListener("click", () => this.addCalculatedRule());
        }
        
        // Rule container event delegation
        const ruleContainer = document.getElementById("ruleContainer");
        if (ruleContainer) {
            this.attachRuleContainerEvents(ruleContainer);
        }
        
        // Calculated rule container event delegation
        const calculatedRuleContainer = document.getElementById("calculatedRuleContainer");
        if (calculatedRuleContainer) {
            this.attachRuleContainerEvents(calculatedRuleContainer);
        }
        
        // Listen for navigation events to update rule options
        document.addEventListener('navigationChanged', (e) => {
            if (e.detail && e.detail.step === 3) {
                setTimeout(() => {
                    this.updateAllColumnDropdowns();
                    this.updateCalculatedRuleOption();
                }, 300);
            }
        });
    },
    
    /**
     * Attach events to a rule container
     */
    attachRuleContainerEvents(container) {
        container.addEventListener("click", (e) => {
            const target = e.target;
            
            if (target.classList.contains("addAndCondition")) {
                e.preventDefault();
                e.stopPropagation();
                this.addAndCondition(target);
            }
            
            if (target.classList.contains("addOrCondition")) {
                e.preventDefault();
                e.stopPropagation();
                this.addOrCondition(target);
            }
            
            if (target.classList.contains("addNestedIf")) {
                e.preventDefault();
                e.stopPropagation();
                this.addNestedRule(target);
            }
            
            if (target.classList.contains("addElseCondition")) {
                e.preventDefault();
                e.stopPropagation();
                this.addElseCondition(target);
            }
            
            if (target.classList.contains("remove-rule")) {
                e.preventDefault();
                e.stopPropagation();
                this.removeRulePart(target);
            }
            
            if (target.classList.contains("toggle-section")) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleRuleSection(target);
            }
        });
        
        container.addEventListener("change", (e) => {
            if (e.target.classList.contains("actionType")) {
                this.handleActionTypeChange(e.target);
            }
            
            if (e.target.classList.contains("columnSelect")) {
                this.handleColumnSelectChange(e.target);
            }
            
            if (e.target.classList.contains("valueSelect")) {
                this.handleValueSelectChange(e.target);
            }
        });
    },
    
    /**
     * Toggle rule section expand/collapse
     */
    toggleRuleSection(toggleElement) {
        const ruleSection = toggleElement.closest('.rule-section');
        if (!ruleSection) return;
        
        const sectionContent = ruleSection.querySelector('.section-content');
        if (!sectionContent) return;
        
        if (sectionContent.classList.contains('collapsed')) {
            sectionContent.classList.remove('collapsed');
            toggleElement.innerHTML = '<i class="fa fa-chevron-down"></i>';
            toggleElement.setAttribute('title', 'Collapse section');
        } else {
            sectionContent.classList.add('collapsed');
            toggleElement.innerHTML = '<i class="fa fa-chevron-right"></i>';
            toggleElement.setAttribute('title', 'Expand section');
        }
    },
    
    /**
     * Handle action type selection change
     */
    handleActionTypeChange(selectElement) {
        const percentageSymbol = selectElement.closest('.rule-box').querySelector('.percentage-symbol');
        const valueContainer = selectElement.closest('.rule-box').querySelector('.value-container');
        
        if (!percentageSymbol || !valueContainer) return;
        
        if (selectElement.value === 'percent-increase' || selectElement.value === 'percent-decrease') {
            percentageSymbol.classList.remove('hidden');
        } else {
            percentageSymbol.classList.add('hidden');
        }
        
        if (selectElement.value === 'reset') {
            const valueDropdown = valueContainer.querySelector('.thresholdSelect-dropdown');
            const valueInput = valueContainer.querySelector('.thresholdSelect');
            
            if (valueDropdown) valueDropdown.disabled = true;
            if (valueInput) {
                valueInput.value = '0';
                valueInput.disabled = true;
            }
        } else {
            const valueDropdown = valueContainer.querySelector('.thresholdSelect-dropdown');
            const valueInput = valueContainer.querySelector('.thresholdSelect');
            
            if (valueDropdown) valueDropdown.disabled = false;
            if (valueInput) valueInput.disabled = false;
        }
        
        this.updateResultColumnOptions(selectElement);
    },
    
    /**
     * Handle column selection change - FIXED VERSION
     */
    handleColumnSelectChange(selectElement) {
        try {
            const selectedColumn = selectElement.value;
            if (!selectedColumn) return;
            
            const ruleBox = selectElement.closest('.rule-box');
            if (!ruleBox) return;
            
            const valueContainer = ruleBox.querySelector('.value-container');
            if (!valueContainer) return;
            
            const valueSelect = valueContainer.querySelector('.valueSelect');
            const valueInput = valueContainer.querySelector('.valueInput');
            
            if (!valueSelect) return;
            
            // Get columns from app data, excluding process column and selected column
            const appData = window.appData || {};
            const allColumns = appData.columns || [];
            const processColumnName = appData.processColumnName || '';
            
            const columns = allColumns.filter(col => col !== processColumnName && col !== selectedColumn);
            
            // Build options HTML
            let optionsHtml = `<option value="custom">Custom Value</option>`;
            
            columns.forEach(col => {
                optionsHtml += `<option value="${this.escapeHTML(col)}">${this.escapeHTML(col)}</option>`;
            });
            
            // Add G2_calculated if in calculated rule container
            const containerElement = selectElement.closest('.nested-container');
            if (containerElement && containerElement.closest('#calculatedRuleContainer')) {
                optionsHtml += `<option value="G2_calculated">G2 (Calculated Goal)</option>`;
            }
            
            
            // Destroy Select2 before updating
            try {
                $(valueSelect).select2('destroy');
            } catch (err) {
                // Ignore if Select2 wasn't initialized
            }
            
            // Update dropdown options
            valueSelect.innerHTML = optionsHtml;
            valueSelect.value = 'custom';
            
            // Show and enable input field
            if (valueInput) {
                valueInput.style.display = 'block';
                valueInput.disabled = false;
                valueInput.value = '';
                valueInput.removeAttribute('data-selected-column');
                valueInput.focus();
            }
            
            // Reinitialize Select2
            $(valueSelect).select2({
                placeholder: "Select value or column",
                allowClear: true,
                width: '100%',
                dropdownParent: valueContainer
            });
            
            // Add event listener with namespace
            $(valueSelect).off('change.columnHandler').on('change.columnHandler', () => {
                this.handleValueSelectChange(valueSelect);
            });
            
        } catch (error) {
            console.error('Error handling column select change:', error);
        }
    },
    
    /**
     * Handle value select dropdown change - FIXED VERSION
     */
    handleValueSelectChange(selectElement) {
        try {
            const valueContainer = selectElement.closest('.value-container');
            if (!valueContainer) return;

            const valueInput = valueContainer.querySelector('.valueInput');
            if (!valueInput) return;

            console.log('Value select changed to:', selectElement.value);

            if (selectElement.value === 'custom' || selectElement.value === '') {
                // Show input for custom value
                valueInput.style.display = 'block';
                valueInput.disabled = false;
                valueInput.value = '';
                valueInput.removeAttribute('data-selected-column');
                valueInput.placeholder = 'Enter custom value';
                valueInput.focus();
                console.log('Showing custom input');
            } else {
                // Hide input when a column is selected
                valueInput.style.display = 'none';
                valueInput.disabled = true;
                valueInput.setAttribute('data-selected-column', selectElement.value);
                console.log('Selected column:', selectElement.value, 'Input hidden');
            }

            // Ensure dropdown maintains its value
            setTimeout(() => {
                if (selectElement.value !== 'custom' && selectElement.value !== '') {
                    const selectedOption = selectElement.querySelector(`option[value="${selectElement.value}"]`);
                    if (selectedOption) {
                        selectedOption.selected = true;
                    }
                    
                    if ($(selectElement).hasClass('select2-hidden-accessible')) {
                        $(selectElement).val(selectElement.value).trigger('change.select2');
                    }
                }
            }, 10);

        } catch (error) {
            console.error('Error handling value select change:', error);
        }
    },
    
    /**
     * Update result column options based on action type
     */
    updateResultColumnOptions(actionSelect) {
        try {
            const ruleBox = actionSelect.closest('.rule-box');
            if (!ruleBox) return;
            
            const resultColumn = ruleBox.querySelector('.resultColumn');
            if (!resultColumn) return;
            
            const currentSelection = resultColumn.value;
            
            const appData = window.appData || {};
            const columns = appData.columns || [];
            
            let columnOptions = columns.map(col => 
                `<option value="${this.escapeHTML(col)}">${this.escapeHTML(col)}</option>`
            ).join('');
            
            
            resultColumn.innerHTML = `
                <option value="" disabled>Select column</option>
                ${columnOptions}
            `;
            
            if (currentSelection) {
                resultColumn.value = currentSelection;
            }
            
            try {
                $(resultColumn).select2('destroy');
            } catch (err) {}
            
            $(resultColumn).select2({
                placeholder: "Select column",
                allowClear: true,
                width: '100%'
            });
        } catch (error) {
            console.error('Error updating result column options:', error);
        }
    },
    
    /**
     * Initialize rule creation UI
     */
    initializeRuleCreation() {
        console.log("Initializing rule creation UI");
        this.currentRuleId = 0;
        this.hasBaseRule = false;
        this.nestedRuleMap.clear();
        const ruleContainer = document.getElementById("ruleContainer");
        
        if (ruleContainer) {
            ruleContainer.innerHTML = '';
            
            this.currentRuleId++;
            const ruleHtml = this.getRuleHtml(this.currentRuleId);
            ruleContainer.innerHTML = ruleHtml;
            
            this.initializeRuleElements(ruleContainer);
        }
        
        this.updateCalculatedRuleOption();
        
        const calculatedRuleContainer = document.getElementById("calculatedRuleContainer");
        if (calculatedRuleContainer) {
            calculatedRuleContainer.classList.add("hidden");
            calculatedRuleContainer.innerHTML = '';
        }
    },
    
    /**
     * Initialize all rule elements in a container - IMPROVED VERSION
     */
    initializeRuleElements(container) {
        if (!container) return;
        
        // Initialize column selects with Select2
        $(container).find('.column-select').each(function() {
            $(this).select2({
                placeholder: "Select column",
                allowClear: true,
                width: '100%'
            });
        });
        
        $(container).find('.valueSelect').each(function() {
            const valueContainer = $(this).closest('.value-container')[0];
            $(this).select2({
                placeholder: "Select value or column",
                allowClear: true,
                width: '100%',
                dropdownParent: valueContainer ? $(valueContainer) : undefined
            });
        });
        
        // Setup column change events
        const columnSelects = container.querySelectorAll('.columnSelect');
        columnSelects.forEach(select => {
            select.removeEventListener('change', this.columnChangeHandler);
            this.columnChangeHandler = (e) => {
                this.handleColumnSelectChange(e.target);
            };
            select.addEventListener('change', this.columnChangeHandler);
        });
        
        // Setup value select change events
        const valueSelects = container.querySelectorAll('.valueSelect');
        valueSelects.forEach(select => {
            $(select).off('change.valueHandler');
            $(select).on('change.valueHandler', () => {
                this.handleValueSelectChange(select);
            });
            
            // Initialize display state
            const valueContainer = select.closest('.value-container');
            if (valueContainer) {
                const valueInput = valueContainer.querySelector('.valueInput');
                if (valueInput) {
                    if (select.value === 'custom' || !select.value) {
                        valueInput.style.display = 'block';
                        valueInput.disabled = false;
                    } else {
                        valueInput.style.display = 'none';
                        valueInput.disabled = true;
                    }
                }
            }
        });
        
        // Setup action type change events
        const actionTypes = container.querySelectorAll('.actionType');
        actionTypes.forEach(select => {
            select.addEventListener('change', (e) => {
                const ruleBox = e.target.closest('.rule-box');
                if (!ruleBox) return;
                
                const percentageSymbol = ruleBox.querySelector('.percentage-symbol');
                
                if (percentageSymbol) {
                    if (e.target.value === 'percent-increase' || e.target.value === 'percent-decrease') {
                        percentageSymbol.classList.remove('hidden');
                    } else {
                        percentageSymbol.classList.add('hidden');
                    }
                }
                
                const valueContainer = ruleBox.querySelector('.value-container');
                if (valueContainer) {
                    const valueInput = valueContainer.querySelector('.thresholdSelect');
                    if (valueInput) {
                        if (e.target.value === 'reset') {
                            valueInput.value = '0';
                            valueInput.disabled = true;
                        } else {
                            valueInput.disabled = false;
                        }
                    }
                }
            });
        });
        
        // Setup toggle section buttons
        const toggleButtons = container.querySelectorAll('.toggle-section');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const ruleSection = e.target.closest('.rule-section');
                if (!ruleSection) return;
                
                const sectionContent = ruleSection.querySelector('.section-content');
                if (!sectionContent) return;
                
                if (sectionContent.classList.contains('collapsed')) {
                    sectionContent.classList.remove('collapsed');
                    button.innerHTML = '<i class="fa fa-chevron-down"></i>';
                    button.setAttribute('title', 'Collapse section');
                } else {
                    sectionContent.classList.add('collapsed');
                    button.innerHTML = '<i class="fa fa-chevron-right"></i>';
                    button.setAttribute('title', 'Expand section');
                }
            });
        });
    },
    
    /**
     * Update all column dropdowns with current data
     */
    updateAllColumnDropdowns() {
        try {
            const ruleContainers = document.querySelectorAll('#ruleContainer, #calculatedRuleContainer');
            
            ruleContainers.forEach(container => {
                if (container) {
                    this.initializeRuleElements(container);
                    
                    const allColumnSelects = container.querySelectorAll('.columnSelect, .resultColumn');
                    
                    allColumnSelects.forEach(select => {
                        const currentValue = select.value;
                        
                        const appData = window.appData || {};
                        const allColumns = appData.columns || [];
                        const processColumnName = appData.processColumnName || '';
                        
                        const columns = allColumns.filter(col => col !== processColumnName);
                        
                        let optionsHtml = '<option value="" disabled>Select column</option>';
                        
                        columns.forEach(col => {
                            optionsHtml += `<option value="${this.escapeHTML(col)}">${this.escapeHTML(col)}</option>`;
                        });
                        
                        
                        if (container.id === 'calculatedRuleContainer') {
                            optionsHtml += `<option value="G2_calculated">G2 (Calculated Goal)</option>`;
                        }
                        
                        select.innerHTML = optionsHtml;
                        
                        if (currentValue && Array.from(select.options).some(option => option.value === currentValue)) {
                            select.value = currentValue;
                        }
                        
                        select.dispatchEvent(new Event('change'));
                    });
                }
            });
            
            console.log("All column dropdowns updated with current data");
        } catch (error) {
            console.error('Error updating column dropdowns:', error);
        }
    },
    
    /**
     * Generate HTML for a rule - UPDATED VERSION with enhanced indentation tracking
     */
    getRuleHtml(ruleId, isCalculatedRule = false, parentRuleId = null, nestingLevel = 0) {
        const appData = window.appData || {};
        const allColumns = appData.columns || [];
        const processColumnName = appData.processColumnName || '';
        
        const columns = allColumns.filter(col => col !== processColumnName);
        
        const columnOptions = columns.map(col => 
            `<option value="${this.escapeHTML(col)}">${this.escapeHTML(col)}</option>`
        ).join('');
        
        const calculatedOption = isCalculatedRule ? 
            `<option value="G2_calculated">G2 (Calculated Goal)</option>` : '';
        
        // Add parent rule ID and nesting level as data attributes for enhanced tracking
        const parentDataAttr = parentRuleId ? `data-parent-rule-id="${parentRuleId}"` : '';
        const nestingDataAttr = `data-nesting-level="${nestingLevel}"`;
        
        // Add visual nesting indicator
        const nestingIndicator = nestingLevel > 0 ? `<div class="nesting-indicator">Nested Level ${nestingLevel}</div>` : '';
        
        return `
            <div class="nested-container rule-container" data-rule-id="${ruleId}" ${parentDataAttr} ${nestingDataAttr}>
                ${nestingIndicator}
                <!-- IF Section -->
                <div class="rule-section if-section">
                    <div class="section-header">
                        <span class="section-label">IF</span>
                        <button class="toggle-section" title="Collapse section">
                            <i class="fa fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="section-content">
                        <div class="rule-box condition-box">
                            <select class="form-select column-select columnSelect" title="Select column" data-rule-id="${ruleId}">
                                <option value="" disabled selected>Select column</option>
                                ${columnOptions}
                                ${calculatedOption}
                            </select>
                            <select class="form-select operatorSelect" title="Select operator">
                                <option value="" disabled selected>Select operator</option>
                                <option value=">">></option>
                                <option value="<"><</option>
                                <option value="=">=</option>
                                <option value=">=">>=</option>
                                <option value="<="><=</option>
                                <option value="!=">!=</option>
                            </select>
                            <div class="value-container">
                                <select class="form-select valueSelect" title="Select value or column" data-rule-id="${ruleId}">
                                    <option value="custom" selected>Custom Value</option>
                                    ${columnOptions}
                                </select>
                                <input type="number" class="form-control valueInput" placeholder="Enter value" data-rule-id="${ruleId}" step="any" style="display: block;">
                            </div>
                            ${(isCalculatedRule || parentRuleId) ? '<button class="remove-rule btn btn-danger btn-sm" title="Remove rule">×</button>' : ''}
                        </div>
                        
                        <div class="rule-box logic-buttons">
                            <button class="btn btn-sm btn-outline-primary addAndCondition" title="Add AND condition">
                                <i class="fa fa-plus-circle"></i> AND
                            </button>
                            <button class="btn btn-sm btn-outline-primary addOrCondition" title="Add OR condition">
                                <i class="fa fa-plus-circle"></i> OR
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- THEN Section -->
                <div class="rule-section then-section">
                    <div class="section-header">
                        <span class="section-label">THEN</span>
                        <button class="toggle-section" title="Collapse section">
                            <i class="fa fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="section-content">
                        <div class="rule-box action-box">
                            <select class="form-select column-select resultColumn" title="Select column">
                                <option value="" disabled selected>Select column</option>
                                ${columnOptions}
                            </select>
                            <select class="form-select actionType" title="Select action">
                                <option value="" disabled selected>Select action</option>
                                <option value="value">Set Value</option>
                                <option value="add">Add Value</option>
                                <option value="subtract">Subtract Value</option>
                                <option value="percent-increase">% Increase</option>
                                <option value="percent-decrease">% Decrease</option>
                                <option value="multiply">Multiply By</option>
                                <option value="divide">Divide By</option>
                                <option value="reset">Reset to Zero</option>
                            </select>
                            <div class="value-container">
                                <input type="number" class="form-control thresholdSelect" placeholder="Enter custom value" step="any">
                            </div>
                            <span class="percentage-symbol hidden">%</span>
                        </div>
                    </div>
                </div>
                
                <!-- ELSE Section -->
                <div class="rule-section else-section">
                    <div class="section-header">
                        <span class="section-label">ELSE</span>
                        <button class="toggle-section" title="Collapse section">
                            <i class="fa fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="section-content">
                        <div class="rule-box logic-buttons">
                            <button class="btn btn-sm btn-outline-secondary addNestedIf" title="Add nested if condition">
                                <i class="fa fa-plus-circle"></i> Add Nested If
                            </button>
                            <button class="btn btn-sm btn-outline-secondary addElseCondition" title="Add else condition">
                                <i class="fa fa-plus-circle"></i> Add Else Condition
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Generate HTML for an AND condition - FIXED VERSION
     */
    getAndConditionHtml() {
        const appData = window.appData || {};
        const allColumns = appData.columns || [];
        const processColumnName = appData.processColumnName || '';
        
        const columns = allColumns.filter(col => col !== processColumnName);
        
        const columnOptions = columns.map(col => 
            `<option value="${this.escapeHTML(col)}">${this.escapeHTML(col)}</option>`
        ).join('');
        
        this.currentRuleId++;
        const ruleId = this.currentRuleId;
        
        return `
            <div class="rule-box and-condition" data-condition-id="${ruleId}">
                <span class="condition-type">AND</span>
                <select class="form-select column-select columnSelect" title="Select column" data-rule-id="${ruleId}">
                    <option value="" disabled selected>Select column</option>
                    ${columnOptions}
                </select>
                <select class="form-select operatorSelect" title="Select operator">
                    <option value="" disabled selected>Select operator</option>
                    <option value=">">></option>
                    <option value="<"><</option>
                    <option value="=">=</option>
                    <option value=">=">>=</option>
                    <option value="<="><=</option>
                    <option value="!=">!=</option>
                </select>
                <div class="value-container">
                    <select class="form-select valueSelect" title="Select value or column" data-rule-id="${ruleId}">
                        <option value="custom" selected>Custom Value</option>
                        ${columnOptions}
                    </select>
                    <input type="number" class="form-control valueInput" placeholder="Enter value" data-rule-id="${ruleId}" step="any" style="display: block;">
                </div>
                <button class="remove-rule btn btn-danger btn-sm" title="Remove condition">×</button>
            </div>
        `;
    },
    
    /**
     * Generate HTML for an OR condition - FIXED VERSION
     */
    getOrConditionHtml() {
        const appData = window.appData || {};
        const allColumns = appData.columns || [];
        const processColumnName = appData.processColumnName || '';
        
        const columns = allColumns.filter(col => col !== processColumnName);
        
        const columnOptions = columns.map(col => 
            `<option value="${this.escapeHTML(col)}">${this.escapeHTML(col)}</option>`
        ).join('');
        
        this.currentRuleId++;
        const ruleId = this.currentRuleId;
        
        return `
            <div class="rule-box or-condition" data-condition-id="${ruleId}">
                <span class="condition-type">OR</span>
                <select class="form-select column-select columnSelect" title="Select column" data-rule-id="${ruleId}">
                    <option value="" disabled selected>Select column</option>
                    ${columnOptions}
                </select>
                <select class="form-select operatorSelect" title="Select operator">
                    <option value="" disabled selected>Select operator</option>
                    <option value=">">></option>
                    <option value="<"><</option>
                    <option value="=">=</option>
                    <option value=">=">>=</option>
                    <option value="<="><=</option>
                    <option value="!=">!=</option>
                </select>
                <div class="value-container">
                    <select class="form-select valueSelect" title="Select value or column" data-rule-id="${ruleId}">
                        <option value="custom" selected>Custom Value</option>
                        ${columnOptions}
                    </select>
                    <input type="number" class="form-control valueInput" placeholder="Enter value" data-rule-id="${ruleId}" step="any" style="display: block;">
                </div>
                <button class="remove-rule btn btn-danger btn-sm" title="Remove condition">×</button>
            </div>
        `;
    },
    
    /**
     * Generate HTML for an else condition - FIXED VERSION
     */
    getElseConditionHtml() {
        const appData = window.appData || {};
        const allColumns = appData.columns || [];
        const processColumnName = appData.processColumnName || '';
        
        const columns = allColumns.filter(col => col !== processColumnName);
        
        const columnOptions = columns.map(col => 
            `<option value="${this.escapeHTML(col)}">${this.escapeHTML(col)}</option>`
        ).join('');
        
        this.currentRuleId++;
        const ruleId = this.currentRuleId;
        
        return `
            <div class="nested-container else-action" data-condition-id="${ruleId}">
                <div class="rule-section else-action-section">
                    <div class="section-header">
                        <span class="section-label">ELSE DO</span>
                        <button class="toggle-section" title="Collapse section">
                            <i class="fa fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="section-content">
                        <div class="rule-box action-box">
                            <select class="form-select column-select resultColumn" title="Select column">
                                <option value="" disabled selected>Select column</option>
                                ${columnOptions}
                            </select>
                            <select class="form-select actionType" title="Select action">
                                <option value="" disabled selected>Select action</option>
                                <option value="value">Set Value</option>
                                <option value="add">Add Value</option>
                                <option value="subtract">Subtract Value</option>
                                <option value="percent-increase">% Increase</option>
                                <option value="percent-decrease">% Decrease</option>
                                <option value="multiply">Multiply By</option>
                                <option value="divide">Divide By</option>
                                <option value="reset">Reset to Zero</option>
                            </select>
                            <div class="value-container">
                                <input type="number" class="form-control thresholdSelect" placeholder="Enter custom value" step="any">
                            </div>
                            <span class="percentage-symbol hidden">%</span>
                            <button class="remove-rule btn btn-danger btn-sm" title="Remove condition">×</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Add AND condition - FIXED VERSION
     */
    addAndCondition(button) {
        const logicButtons = button.closest('.logic-buttons');
        if (!logicButtons) return;
        
        const andHtml = this.getAndConditionHtml();
        logicButtons.insertAdjacentHTML('beforebegin', andHtml);
        
        const newAndBox = logicButtons.previousElementSibling;
        if (newAndBox) {
            setTimeout(() => {
                const columnSelect = newAndBox.querySelector('.columnSelect');
                if (columnSelect) {
                    $(columnSelect).select2({
                        placeholder: "Select column",
                        allowClear: true,
                        width: '100%'
                    });
                    
                    columnSelect.addEventListener('change', () => {
                        this.handleColumnSelectChange(columnSelect);
                    });
                }
                
                const valueSelect = newAndBox.querySelector('.valueSelect');
                const valueInput = newAndBox.querySelector('.valueInput');
                if (valueSelect) {
                    const valueContainer = newAndBox.querySelector('.value-container');
                    
                    $(valueSelect).select2({
                        placeholder: "Select value or column",
                        allowClear: true,
                        width: '100%',
                        dropdownParent: valueContainer ? $(valueContainer) : undefined
                    });
                    
                    $(valueSelect).off('change.andCondition').on('change.andCondition', (e) => {
                        console.log('AND condition value select changed:', e.target.value);
                        this.handleValueSelectChange(e.target);
                    });
                    
                    if (valueInput) {
                        valueInput.style.display = 'block';
                        valueInput.disabled = false;
                        valueInput.value = '';
                    }
                    
                    $(valueSelect).val('custom').trigger('change.select2');
                }
            }, 100);
        }
    },
    
    /**
     * Add OR condition - FIXED VERSION
     */
    addOrCondition(button) {
        const logicButtons = button.closest('.logic-buttons');
        if (!logicButtons) return;
        
        const orHtml = this.getOrConditionHtml();
        logicButtons.insertAdjacentHTML('beforebegin', orHtml);
        
        const newOrBox = logicButtons.previousElementSibling;
        if (newOrBox) {
            setTimeout(() => {
                const columnSelect = newOrBox.querySelector('.columnSelect');
                if (columnSelect) {
                    $(columnSelect).select2({
                        placeholder: "Select column",
                        allowClear: true,
                        width: '100%'
                    });
                    
                    columnSelect.addEventListener('change', () => {
                        this.handleColumnSelectChange(columnSelect);
                    });
                }
                
                const valueSelect = newOrBox.querySelector('.valueSelect');
                const valueInput = newOrBox.querySelector('.valueInput');
                if (valueSelect) {
                    const valueContainer = newOrBox.querySelector('.value-container');
                    
                    $(valueSelect).select2({
                        placeholder: "Select value or column",
                        allowClear: true,
                        width: '100%',
                        dropdownParent: valueContainer ? $(valueContainer) : undefined
                    });
                    
                    $(valueSelect).off('change.orCondition').on('change.orCondition', (e) => {
                        console.log('OR condition value select changed:', e.target.value);
                        this.handleValueSelectChange(e.target);
                    });
                    
                    if (valueInput) {
                        valueInput.style.display = 'block';
                        valueInput.disabled = false;
                        valueInput.value = '';
                    }
                    
                    $(valueSelect).val('custom').trigger('change.select2');
                }
            }, 100);
        }
    },
    
    /**
     * Add nested rule - IMPROVED VERSION WITH ENHANCED TRACKING AND INDENTATION
     */
    addNestedRule(button) {
        try {
            const parentRuleContainer = button.closest('.rule-container');
            if (!parentRuleContainer) return;
            
            const parentRuleId = parentRuleContainer.getAttribute('data-rule-id');
            const parentNestingLevel = parseInt(parentRuleContainer.getAttribute('data-nesting-level') || '0');
            const newNestingLevel = parentNestingLevel + 1;
            
            this.currentRuleId++;
            const nestedRuleId = this.currentRuleId;
            
            // Track nested rule relationship
            if (!this.nestedRuleMap.has(parentRuleId)) {
                this.nestedRuleMap.set(parentRuleId, []);
            }
            this.nestedRuleMap.get(parentRuleId).push(nestedRuleId);
            
            const nestedRuleHtml = this.getRuleHtml(nestedRuleId, false, parentRuleId, newNestingLevel);
            
            // Find the container that holds all rules
            const mainContainer = parentRuleContainer.parentElement;
            
            // Insert the nested rule after the parent rule
            parentRuleContainer.insertAdjacentHTML('afterend', nestedRuleHtml);
            
            // Get the newly created nested rule element
            const newNestedRule = document.querySelector(`[data-rule-id="${nestedRuleId}"]`);
            
            if (newNestedRule) {
                setTimeout(() => {
                    this.initializeRuleElements(newNestedRule);
                    
                    const columnSelects = newNestedRule.querySelectorAll('.columnSelect');
                    columnSelects.forEach(select => {
                        this.populateColumnOptions(select);
                    });
                    
                    console.log(`Nested rule ${nestedRuleId} added under parent ${parentRuleId} at nesting level ${newNestingLevel}`);
                    console.log('Nested rule map:', this.nestedRuleMap);
                }, 100);
            }
            
        } catch (error) {
            console.error('Error adding nested rule:', error);
        }
    },
    
    /**
     * Add else condition - IMPROVED VERSION
     */
    addElseCondition(button) {
        const elseSection = button.closest('.else-section');
        if (!elseSection) return;
        
        const elseHtml = this.getElseConditionHtml();
        
        const sectionContent = elseSection.querySelector('.section-content');
        if (sectionContent) {
            sectionContent.insertAdjacentHTML('beforeend', elseHtml);
            
            const newElseAction = sectionContent.querySelector('.else-action:last-child');
            if (newElseAction) {
                setTimeout(() => {
                    $(newElseAction).find('.column-select').select2({
                        placeholder: "Select column",
                        allowClear: true,
                        width: '100%'
                    });
                    
                    this.addDropdownEventListeners(newElseAction);
                }, 100);
            }
        }
    },
    
    /**
     * Add calculated rule - IMPROVED VERSION
     */
    addCalculatedRule() {
        const calculatedRuleContainer = document.getElementById("calculatedRuleContainer");
        if (!calculatedRuleContainer) return;
        
        calculatedRuleContainer.classList.remove("hidden");
        
        this.currentRuleId++;
        const calculatedRuleHtml = this.getRuleHtml(this.currentRuleId, true);
        
        calculatedRuleContainer.innerHTML = calculatedRuleHtml;
        
        setTimeout(() => {
            $(calculatedRuleContainer).find('.column-select').select2({
                placeholder: "Select column",
                allowClear: true,
                width: '100%'
            });
            
            $(calculatedRuleContainer).find('.valueSelect').select2({
                placeholder: "Select value",
                allowClear: true,
                width: '100%'
            });
            
            this.addDropdownEventListeners(calculatedRuleContainer);
        }, 100);
        
        const addButton = document.getElementById("addCalculatedRule");
        if (addButton) {
            addButton.classList.add("hidden");
        }
    },
    
    /**
     * Add event listeners to dropdowns in a container - IMPROVED VERSION
     */
    addDropdownEventListeners(container) {
        try {
            const columnSelects = container.querySelectorAll('.columnSelect');
            columnSelects.forEach(select => {
                select.addEventListener('change', () => this.handleColumnSelectChange(select));
            });
            
            const valueSelects = container.querySelectorAll('.valueSelect');
            valueSelects.forEach(select => {
                $(select).off('change.dropdownListener').on('change.dropdownListener', () => {
                    this.handleValueSelectChange(select);
                });
                
                const valueContainer = select.closest('.value-container');
                if (valueContainer) {
                    const valueInput = valueContainer.querySelector('.valueInput');
                    if (valueInput) {
                        valueInput.style.display = (select.value === 'custom') ? 'block' : 'none';
                    }
                }
            });
            
            const actionTypes = container.querySelectorAll('.actionType');
            actionTypes.forEach(select => {
                select.addEventListener('change', () => this.handleActionTypeChange(select));
            });
            
            const resultColumns = container.querySelectorAll('.resultColumn');
            resultColumns.forEach(select => {
                select.addEventListener('change', () => {
                    const ruleBox = select.closest('.rule-box');
                    if (ruleBox) {
                        const valueContainer = ruleBox.querySelector('.value-container');
                        if (valueContainer) {
                            this.updateActionValueDropdown(select, valueContainer);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error adding dropdown event listeners:', error);
        }
    },
    
    /**
     * Remove a rule part - UPDATED TO HANDLE NESTED RULES
     */
    removeRulePart(button) {
        const ruleBox = button.closest('.rule-box');
        const elseAction = button.closest('.else-action');
        const nestedContainer = button.closest('.nested-container');
        
        if (ruleBox && (ruleBox.classList.contains('and-condition') || ruleBox.classList.contains('or-condition'))) {
            ruleBox.remove();
        } else if (elseAction) {
            elseAction.remove();
        } else if (nestedContainer) {
            const calculatedContainer = document.getElementById('calculatedRuleContainer');
            if (calculatedContainer && calculatedContainer.contains(nestedContainer)) {
                calculatedContainer.innerHTML = '';
                calculatedContainer.classList.add('hidden');
                
                const addButton = document.getElementById("addCalculatedRule");
                if (addButton) {
                    addButton.classList.remove("hidden");
                }
            } else if (nestedContainer.classList.contains('rule-container')) {
                const ruleId = nestedContainer.getAttribute('data-rule-id');
                const parentRuleId = nestedContainer.getAttribute('data-parent-rule-id');
                
                // Remove from nested rule map
                if (parentRuleId && this.nestedRuleMap.has(parentRuleId)) {
                    const nestedRules = this.nestedRuleMap.get(parentRuleId);
                    const index = nestedRules.indexOf(ruleId);
                    if (index > -1) {
                        nestedRules.splice(index, 1);
                    }
                    if (nestedRules.length === 0) {
                        this.nestedRuleMap.delete(parentRuleId);
                    }
                }
                
                // Don't allow removal of the main base rule
                if (!parentRuleId && !nestedContainer.closest('#calculatedRuleContainer')) {
                    console.log("Cannot remove main rule container");
                    return;
                }
                
                nestedContainer.remove();
                console.log(`Removed nested rule ${ruleId} from parent ${parentRuleId}`);
                console.log('Updated nested rule map:', this.nestedRuleMap);
            }
        } else if (ruleBox) {
            ruleBox.remove();
        }
    },
    
    /**
     * Populate column options for a select element
     */
    populateColumnOptions(selectElement) {
        try {
            if (!selectElement) return;
            
            const appData = window.appData || {};
            const allColumns = appData.columns || [];
            const processColumnName = appData.processColumnName || '';
            
            const columns = allColumns.filter(col => col !== processColumnName);
            
            const currentValue = selectElement.value;
            
            let optionsHtml = '<option value="" disabled>Select column</option>';
            
            columns.forEach(col => {
                optionsHtml += `<option value="${this.escapeHTML(col)}">${this.escapeHTML(col)}</option>`;
            });
            
            
            const calculatedContainer = selectElement.closest('#calculatedRuleContainer');
            if (calculatedContainer) {
                optionsHtml += `<option value="G2_calculated">G2 (Calculated Goal)</option>`;
            }
            
            selectElement.innerHTML = optionsHtml;
            
            if (currentValue && Array.from(selectElement.options).some(option => option.value === currentValue)) {
                selectElement.value = currentValue;
            }
            
            if ($(selectElement).hasClass('select2-hidden-accessible')) {
                $(selectElement).trigger('change');
            }
            
        } catch (error) {
            console.error('Error populating column options:', error);
        }
    },
    
    /**
     * Update action value dropdown based on selected column
     */
    updateActionValueDropdown(columnSelect, container) {
        try {
            if (!columnSelect || !container) return;
            
            const selectedColumn = columnSelect.value;
            if (!selectedColumn) return;
            
            const valueInput = container.querySelector('.thresholdSelect');
            
            if (!valueInput) return;
            
            valueInput.disabled = false;
            valueInput.value = '';
            
        } catch (error) {
            console.error('Error updating action value dropdown:', error);
        }
    },
    
    /**
     * Save the current rule - IMPROVED VERSION
     */
    saveCurrentRule() {
        try {
            const ruleName = document.getElementById('ruleName').value.trim();
            if (!ruleName) {
                this.showValidationMessage('Please enter a rule name');
                return;
            }
            
            const ruleDescription = document.getElementById('ruleDescription').value.trim();
            
            const ruleTree = this.buildRuleTree();
            
            if (!ruleTree) {
                this.showValidationMessage('Please create a valid rule before saving');
                return;
            }
            
            if (!ruleTree.baseRule) {
                this.showValidationMessage('Please create at least a base rule before saving');
                return;
            }
            
            if (!this.validateRule(ruleTree.baseRule)) {
                this.showValidationMessage('Please complete the base rule with condition and action');
                return;
            }
            
            if (ruleTree.calculatedRule && !this.validateRule(ruleTree.calculatedRule)) {
                this.showValidationMessage('Please complete the calculated rule with condition and action');
                return;
            }
            
            console.log("Saving rule with structure:", JSON.stringify(ruleTree, null, 2));
            
            if (!window.ruleStorage) {
                console.error("ruleStorage is not initialized");
                
                if (typeof ruleStorage !== 'undefined') {
                    window.ruleStorage = ruleStorage;
                    if (typeof window.ruleStorage.init === 'function') {
                        window.ruleStorage.init();
                        console.log("Initialized ruleStorage");
                    }
                } else {
                    this.showValidationMessage("Error: Rule storage is not available. Please refresh the page.");
                    return;
                }
            }
            
            if (window.ruleStorage && typeof window.ruleStorage.saveRule === 'function') {
                if (window.ruleStorage.saveRule(ruleName, ruleDescription, ruleTree)) {
                    this.clearRuleForm();
                    this.updateCalculatedRuleOption();
                    this.showNotification(`Rule "${ruleName}" saved successfully`);
                }
            } else {
                console.error("ruleStorage.saveRule is not available");
                this.showValidationMessage("Error: Rule storage is not available");
            }
        } catch (error) {
            console.error('Error saving rule:', error);
            this.showValidationMessage(`Error saving rule: ${error.message}`);
        }
    },
    
    /**
     * Validate a single rule
     */
    validateRule(rule) {
        if (!rule) return false;
        
        if (!rule.condition || !rule.condition.leftColumn || !rule.condition.operator) {
            return false;
        }
        
        if (rule.condition.rightType === 'value' && !rule.condition.rightValue) {
            return false;
        } else if (rule.condition.rightType === 'column' && !rule.condition.rightColumn) {
            return false;
        }
        
        if (!rule.action || !rule.action.column || !rule.action.type) {
            return false;
        }
        
        if (rule.action.type !== 'reset' && !rule.action.value) {
            return false;
        }
        
        return true;
    },
    
    /**
     * Clear the rule form
     */
    clearRuleForm() {
        const nameInput = document.getElementById('ruleName');
        const descriptionInput = document.getElementById('ruleDescription');
        
        if (nameInput) nameInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        
        this.nestedRuleMap.clear();
        this.initializeRuleCreation();
        
        const validationMessage = document.getElementById('ruleValidationMessage');
        if (validationMessage) {
            validationMessage.classList.add('hidden');
        }
    },
    
    /**
     * Build rule tree from UI elements - IMPROVED VERSION WITH FIXED NESTED RULE HANDLING
     */
    buildRuleTree() {
        try {
            const result = {
                baseRule: null,
                calculatedRule: null
            };
            
            const ruleContainer = document.getElementById('ruleContainer');
            if (ruleContainer) {
                const mainRule = ruleContainer.querySelector(':scope > .rule-container');
                if (mainRule) {
                    result.baseRule = this.buildRuleFromElement(mainRule);
                    console.log('Built base rule:', result.baseRule);
                }
            }
            
            const calculatedContainer = document.getElementById('calculatedRuleContainer');
            if (calculatedContainer && !calculatedContainer.classList.contains('hidden')) {
                const calculatedRule = calculatedContainer.querySelector(':scope > .rule-container');
                if (calculatedRule) {
                    result.calculatedRule = this.buildRuleFromElement(calculatedRule);
                    console.log('Built calculated rule:', result.calculatedRule);
                }
            }
            
            console.log('Complete rule tree:', result);
            console.log('Nested rule map:', this.nestedRuleMap);
            return result;
        } catch (error) {
            console.error('Error building rule tree:', error);
            return null;
        }
    },
    
    /**
     * Build rule object from DOM element - FIXED VERSION WITH IMPROVED NESTED RULE HANDLING
     */
    buildRuleFromElement(ruleElement) {
        try {
            if (!ruleElement) return null;
            
            const ruleId = ruleElement.getAttribute('data-rule-id');
            
            const ifSection = ruleElement.querySelector('.if-section');
            if (!ifSection) return null;
            
            const conditionBox = ifSection.querySelector('.condition-box');
            if (!conditionBox) return null;
            
            const leftColumn = conditionBox.querySelector('.columnSelect')?.value;
            const operator = conditionBox.querySelector('.operatorSelect')?.value;
            
            if (!leftColumn || !operator) {
                return null;
            }
            
            const valueContainer = conditionBox.querySelector('.value-container');
            const valueSelect = valueContainer?.querySelector('.valueSelect');
            const valueInput = valueContainer?.querySelector('.valueInput');
            
            let rightType = 'value';
            let rightValue = '';
            let rightColumn = '';
            
            if (valueSelect && valueInput) {
                if (valueSelect.value === 'custom' || valueSelect.value === '') {
                    rightType = 'value';
                    rightValue = valueInput.value || '0';
                } else {
                    rightType = 'column';
                    rightColumn = valueSelect.value;
                    
                    const storedColumn = valueInput.getAttribute('data-selected-column');
                    if (storedColumn) {
                        rightColumn = storedColumn;
                    }
                }
            } else if (valueInput) {
                rightType = 'value';
                rightValue = valueInput.value || '0';
            }
            
            // Extract AND conditions
            const andConditions = [];
            const andBoxes = Array.from(ifSection.querySelectorAll('.and-condition'));
            
            andBoxes.forEach(andBox => {
                const andLeftColumn = andBox.querySelector('.columnSelect')?.value;
                const andOperator = andBox.querySelector('.operatorSelect')?.value;
                
                if (andLeftColumn && andOperator) {
                    const andValueContainer = andBox.querySelector('.value-container');
                    const andValueSelect = andValueContainer?.querySelector('.valueSelect');
                    const andValueInput = andValueContainer?.querySelector('.valueInput');
                    
                    let andRightType = 'value';
                    let andRightValue = '';
                    let andRightColumn = '';
                    
                    if (andValueSelect && andValueInput) {
                        if (andValueSelect.value === 'custom' || andValueSelect.value === '') {
                            andRightType = 'value';
                            andRightValue = andValueInput.value || '0';
                        } else {
                            andRightType = 'column';
                            andRightColumn = andValueSelect.value;
                            
                            const storedColumn = andValueInput.getAttribute('data-selected-column');
                            if (storedColumn) {
                                andRightColumn = storedColumn;
                            }
                        }
                    } else if (andValueInput) {
                        andRightType = 'value';
                        andRightValue = andValueInput.value || '0';
                    }
                    
                    andConditions.push({
                        leftColumn: andLeftColumn,
                        operator: andOperator,
                        rightType: andRightType,
                        rightValue: andRightType === 'value' ? andRightValue : '',
                        rightColumn: andRightType === 'column' ? andRightColumn : ''
                    });
                }
            });
            
            // Extract OR conditions
            const orConditions = [];
            const orBoxes = Array.from(ifSection.querySelectorAll('.or-condition'));
            
            orBoxes.forEach(orBox => {
                const orLeftColumn = orBox.querySelector('.columnSelect')?.value;
                const orOperator = orBox.querySelector('.operatorSelect')?.value;
                
                if (orLeftColumn && orOperator) {
                    const orValueContainer = orBox.querySelector('.value-container');
                    const orValueSelect = orValueContainer?.querySelector('.valueSelect');
                    const orValueInput = orValueContainer?.querySelector('.valueInput');
                    
                    let orRightType = 'value';
                    let orRightValue = '';
                    let orRightColumn = '';
                    
                    if (orValueSelect && orValueInput) {
                        if (orValueSelect.value === 'custom' || orValueSelect.value === '') {
                            orRightType = 'value';
                            orRightValue = orValueInput.value || '0';
                        } else {
                            orRightType = 'column';
                            orRightColumn = orValueSelect.value;
                            
                            const storedColumn = orValueInput.getAttribute('data-selected-column');
                            if (storedColumn) {
                                orRightColumn = storedColumn;
                            }
                        }
                    } else if (orValueInput) {
                        orRightType = 'value';
                        orRightValue = orValueInput.value || '0';
                    }
                    
                    orConditions.push({
                        leftColumn: orLeftColumn,
                        operator: orOperator,
                        rightType: orRightType,
                        rightValue: orRightType === 'value' ? orRightValue : '',
                        rightColumn: orRightType === 'column' ? orRightColumn : ''
                    });
                }
            });
            
            // Extract action from THEN section
            const thenSection = ruleElement.querySelector('.then-section');
            if (!thenSection) return null;
            
            const actionBox = thenSection.querySelector('.action-box');
            if (!actionBox) return null;
            
            const actionColumn = actionBox.querySelector('.resultColumn')?.value;
            const actionType = actionBox.querySelector('.actionType')?.value;
            
            if (!actionColumn || !actionType) {
                return null;
            }
            
            const actionValueContainer = actionBox.querySelector('.value-container');
            const actionValueInput = actionValueContainer?.querySelector('.thresholdSelect');
            
            let actionValue = '';
            
            if (actionValueInput) {
                actionValue = actionValueInput.value;
            }
            
            if (!actionValue && actionType !== 'reset') {
                actionValue = '0';
            }
            
            const rule = {
                condition: {
                    leftColumn,
                    operator,
                    rightType,
                    rightValue: rightType === 'value' ? rightValue : '',
                    rightColumn: rightType === 'column' ? rightColumn : ''
                },
                action: {
                    column: actionColumn,
                    type: actionType,
                    value: actionValue
                }
            };
            
            if (andConditions.length > 0) {
                rule.condition.andConditions = andConditions;
            }
            
            if (orConditions.length > 0) {
                rule.condition.orConditions = orConditions;
            }
            
            // Check for else action
            const elseSection = ruleElement.querySelector('.else-section');
            if (elseSection) {
                const elseAction = elseSection.querySelector('.else-action');
                if (elseAction) {
                    const elseActionBox = elseAction.querySelector('.action-box');
                    if (elseActionBox) {
                        const elseColumn = elseActionBox.querySelector('.resultColumn')?.value;
                        const elseType = elseActionBox.querySelector('.actionType')?.value;
                        
                        if (elseColumn && elseType) {
                            const elseValueContainer = elseActionBox.querySelector('.value-container');
                            const elseValueInput = elseValueContainer?.querySelector('.thresholdSelect');
                            
                            let elseValue = '';
                            
                            if (elseValueInput) {
                                elseValue = elseValueInput.value;
                            }
                            
                            if (!elseValue && elseType !== 'reset') {
                                elseValue = '0';
                            }
                            
                            rule.elseAction = {
                                column: elseColumn,
                                type: elseType,
                                value: elseValue
                            };
                        }
                    }
                }
            }
            
            // Find nested rules using the improved tracking system
            const nestedRules = this.findNestedRulesImproved(ruleId);
            if (nestedRules.length > 0) {
                rule.nestedRules = nestedRules;
            }
            
            return rule;
        } catch (error) {
            console.error('Error building rule from element:', error);
            return null;
        }
    },
    
    /**
     * Find nested rules using improved tracking - FIXED VERSION
     */
    findNestedRulesImproved(parentRuleId) {
        const nestedRules = [];
        
        try {
            // Check if there are any nested rules for this parent
            if (!this.nestedRuleMap.has(parentRuleId)) {
                return nestedRules;
            }
            
            const nestedRuleIds = this.nestedRuleMap.get(parentRuleId);
            
            for (const nestedRuleId of nestedRuleIds) {
                // Find the nested rule element by its data-rule-id
                const nestedRuleElement = document.querySelector(`[data-rule-id="${nestedRuleId}"]`);
                
                if (nestedRuleElement) {
                    const nestedRule = this.buildRuleFromElement(nestedRuleElement);
                    if (nestedRule) {
                        nestedRules.push(nestedRule);
                    }
                } else {
                    console.warn(`Nested rule element not found for ID: ${nestedRuleId}`);
                }
            }
            
            console.log(`Found ${nestedRules.length} nested rules for parent ${parentRuleId}`);
            return nestedRules;
            
        } catch (error) {
            console.error('Error finding nested rules:', error);
            return [];
        }
    },
    
    /**
     * Show validation message
     */
    showValidationMessage(message) {
        const validationMessage = document.getElementById('ruleValidationMessage');
        if (validationMessage) {
            validationMessage.textContent = message;
            validationMessage.classList.remove('hidden');
            
            setTimeout(() => {
                validationMessage.classList.add('hidden');
            }, 5000);
        }
    },
    
    /**
     * Show notification message
     */
    showNotification(message) {
        let notification = document.getElementById("ruleNotificationMessage");
        
        if (!notification) {
            notification = document.createElement("div");
            notification.id = "ruleNotificationMessage";
            notification.className = "alert alert-success position-fixed bottom-0 end-0 m-3";
            notification.style.zIndex = "1050";
            notification.style.maxWidth = "300px";
            notification.style.opacity = "0";
            notification.style.transition = "opacity 0.3s ease";
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        
        setTimeout(() => {
            notification.style.opacity = "1";
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = "0";
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },
    
    /**
     * Update calculated rule option visibility
     */
    updateCalculatedRuleOption() {
        const calculatedRuleOption = document.getElementById('calculatedRuleOption');
        const calculatedRuleContainer = document.getElementById('calculatedRuleContainer');
        const addCalculatedRuleBtn = document.getElementById('addCalculatedRule');
        
        if (!calculatedRuleOption) return;
        
        calculatedRuleOption.classList.remove('hidden');
        
        if (calculatedRuleContainer && !calculatedRuleContainer.classList.contains('hidden') &&
            calculatedRuleContainer.querySelector('.nested-container')) {
            if (addCalculatedRuleBtn) {
                addCalculatedRuleBtn.classList.add('hidden');
            }
        } else {
            if (addCalculatedRuleBtn) {
                addCalculatedRuleBtn.classList.remove('hidden');
            }
        }
    },
    
    /**
     * Recreate rule from definition object - COMPREHENSIVE VERSION
     */
    recreateRuleFromDefinition(ruleDefinition) {
        try {
            if (!ruleDefinition) return;
            
            this.currentRuleId = 0;
            this.nestedRuleMap.clear();
            
            if (ruleDefinition.baseRule) {
                const ruleContainer = document.getElementById('ruleContainer');
                if (ruleContainer) {
                    ruleContainer.innerHTML = '';
                    
                    this.currentRuleId++;
                    const ruleHtml = this.getRuleHtml(this.currentRuleId);
                    ruleContainer.innerHTML = ruleHtml;
                    
                    this.initializeRuleElements(ruleContainer);
                    this.setRuleValues(ruleContainer, ruleDefinition.baseRule);
                }
            }
            
            if (ruleDefinition.calculatedRule) {
                const calculatedRuleContainer = document.getElementById('calculatedRuleContainer');
                if (calculatedRuleContainer) {
                    calculatedRuleContainer.classList.remove('hidden');
                    
                    this.currentRuleId++;
                    const calculatedRuleHtml = this.getRuleHtml(this.currentRuleId, true);
                    
                    calculatedRuleContainer.innerHTML = calculatedRuleHtml;
                    
                    this.initializeRuleElements(calculatedRuleContainer);
                    this.setRuleValues(calculatedRuleContainer, ruleDefinition.calculatedRule);
                    
                    const addButton = document.getElementById('addCalculatedRule');
                    if (addButton) {
                        addButton.classList.add('hidden');
                    }
                }
            }
        } catch (error) {
            console.error('Error recreating rule from definition:', error);
        }
    },
    
    /**
     * Set rule values from a rule definition - COMPREHENSIVE VERSION WITH NESTED RULE SUPPORT
     */
    setRuleValues(container, ruleDefinition) {
        try {
            if (!container || !ruleDefinition) return;
            
            const ruleContainer = container.querySelector('.rule-container') || container;
            if (!ruleContainer) return;
            
            const parentRuleId = ruleContainer.getAttribute('data-rule-id');
            
            // Set main condition values
            const ifSection = ruleContainer.querySelector('.if-section');
            if (ifSection && ruleDefinition.condition) {
                const conditionBox = ifSection.querySelector('.condition-box');
                if (conditionBox) {
                    const columnSelect = conditionBox.querySelector('.columnSelect');
                    const operatorSelect = conditionBox.querySelector('.operatorSelect');
                    const valueSelect = conditionBox.querySelector('.valueSelect');
                    const valueInput = conditionBox.querySelector('.valueInput');
                    
                    if (columnSelect && ruleDefinition.condition.leftColumn) {
                        columnSelect.value = ruleDefinition.condition.leftColumn;
                        $(columnSelect).trigger('change');
                    }
                    
                    if (operatorSelect && ruleDefinition.condition.operator) {
                        operatorSelect.value = ruleDefinition.condition.operator;
                    }
                    
                    // Handle right side value/column
                    if (ruleDefinition.condition.rightType === 'column') {
                        if (valueSelect && ruleDefinition.condition.rightColumn) {
                            this.handleColumnSelectChange(columnSelect);
                            setTimeout(() => {
                                valueSelect.value = ruleDefinition.condition.rightColumn;
                                $(valueSelect).trigger('change');
                                this.handleValueSelectChange(valueSelect);
                            }, 100);
                        }
                    } else {
                        if (valueSelect) {
                            valueSelect.value = 'custom';
                            $(valueSelect).trigger('change');
                        }
                        
                        if (valueInput && ruleDefinition.condition.rightValue) {
                            valueInput.disabled = false;
                            valueInput.value = ruleDefinition.condition.rightValue;
                            valueInput.style.display = 'block';
                        }
                    }
                    
                    // Add AND conditions
                    if (ruleDefinition.condition.andConditions && ruleDefinition.condition.andConditions.length > 0) {
                        const logicButtons = ifSection.querySelector('.logic-buttons');
                        if (logicButtons) {
                            ruleDefinition.condition.andConditions.forEach(andCondition => {
                                const addAndBtn = logicButtons.querySelector('.addAndCondition');
                                if (addAndBtn) {
                                    this.addAndCondition(addAndBtn);
                                    
                                    const newAndBox = logicButtons.previousElementSibling;
                                    if (newAndBox && newAndBox.classList.contains('and-condition')) {
                                        setTimeout(() => {
                                            this.setAndOrConditionValues(newAndBox, andCondition);
                                        }, 150);
                                    }
                                }
                            });
                        }
                    }
                    
                    // Add OR conditions
                    if (ruleDefinition.condition.orConditions && ruleDefinition.condition.orConditions.length > 0) {
                        const logicButtons = ifSection.querySelector('.logic-buttons');
                        if (logicButtons) {
                            ruleDefinition.condition.orConditions.forEach(orCondition => {
                                const addOrBtn = logicButtons.querySelector('.addOrCondition');
                                if (addOrBtn) {
                                    this.addOrCondition(addOrBtn);
                                    
                                    const newOrBox = logicButtons.previousElementSibling;
                                    if (newOrBox && newOrBox.classList.contains('or-condition')) {
                                        setTimeout(() => {
                                            this.setAndOrConditionValues(newOrBox, orCondition);
                                        }, 150);
                                    }
                                }
                            });
                        }
                    }
                }
                
                // Set action values
                const thenSection = ruleContainer.querySelector('.then-section');
                if (thenSection && ruleDefinition.action) {
                    const actionBox = thenSection.querySelector('.action-box');
                    if (actionBox) {
                        const resultColumn = actionBox.querySelector('.resultColumn');
                        const actionType = actionBox.querySelector('.actionType');
                        const thresholdInput = actionBox.querySelector('.thresholdSelect');
                        
                        if (resultColumn && ruleDefinition.action.column) {
                            resultColumn.value = ruleDefinition.action.column;
                            $(resultColumn).trigger('change');
                        }
                        
                        if (actionType && ruleDefinition.action.type) {
                            actionType.value = ruleDefinition.action.type;
                            const event = new Event('change');
                            actionType.dispatchEvent(event);
                        }
                        
                        if (thresholdInput && ruleDefinition.action.value) {
                            thresholdInput.value = ruleDefinition.action.value;
                        }
                    }
                }
                
                // Set else action if exists
                if (ruleDefinition.elseAction) {
                    const elseSection = ruleContainer.querySelector('.else-section');
                    if (elseSection) {
                        const addElseBtn = elseSection.querySelector('.addElseCondition');
                        if (addElseBtn) {
                            this.addElseCondition(addElseBtn);
                            
                            setTimeout(() => {
                                const elseAction = elseSection.querySelector('.else-action');
                                if (elseAction) {
                                    const actionBox = elseAction.querySelector('.action-box');
                                    if (actionBox) {
                                        const resultColumn = actionBox.querySelector('.resultColumn');
                                        const actionType = actionBox.querySelector('.actionType');
                                        const thresholdInput = actionBox.querySelector('.thresholdSelect');
                                        
                                        if (resultColumn && ruleDefinition.elseAction.column) {
                                            resultColumn.value = ruleDefinition.elseAction.column;
                                            $(resultColumn).trigger('change');
                                        }
                                        
                                        if (actionType && ruleDefinition.elseAction.type) {
                                            actionType.value = ruleDefinition.elseAction.type;
                                            const event = new Event('change');
                                            actionType.dispatchEvent(event);
                                        }
                                        
                                        if (thresholdInput && ruleDefinition.elseAction.value) {
                                            thresholdInput.value = ruleDefinition.elseAction.value;
                                        }
                                    }
                                }
                            }, 150);
                        }
                    }
                }
                
                // Add nested rules if they exist - IMPROVED VERSION
                if (ruleDefinition.nestedRules && ruleDefinition.nestedRules.length > 0) {
                    const elseSection = ruleContainer.querySelector('.else-section');
                    if (elseSection) {
                        ruleDefinition.nestedRules.forEach((nestedRule, index) => {
                            const addNestedBtn = elseSection.querySelector('.addNestedIf');
                            if (addNestedBtn) {
                                // Add the nested rule
                                this.addNestedRule(addNestedBtn);
                                
                                // Wait for the nested rule to be created, then set its values
                                setTimeout(() => {
                                    // Find the newly created nested rule
                                    const nestedRuleElements = document.querySelectorAll(`[data-parent-rule-id="${parentRuleId}"]`);
                                    const targetNestedRule = nestedRuleElements[index];
                                    
                                    if (targetNestedRule) {
                                        this.setRuleValues(targetNestedRule, nestedRule);
                                    }
                                }, 200 * (index + 1));
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error setting rule values:', error);
        }
    },
    
    /**
     * Set values for AND/OR conditions
     */
    setAndOrConditionValues(conditionBox, conditionDefinition) {
        try {
            const columnSelect = conditionBox.querySelector('.columnSelect');
            const operatorSelect = conditionBox.querySelector('.operatorSelect');
            const valueSelect = conditionBox.querySelector('.valueSelect');
            const valueInput = conditionBox.querySelector('.valueInput');
            
            if (columnSelect && conditionDefinition.leftColumn) {
                columnSelect.value = conditionDefinition.leftColumn;
                $(columnSelect).trigger('change');
            }
            
            if (operatorSelect && conditionDefinition.operator) {
                operatorSelect.value = conditionDefinition.operator;
            }
            
            // Handle right side value/column
            if (conditionDefinition.rightType === 'column') {
                if (valueSelect && conditionDefinition.rightColumn) {
                    setTimeout(() => {
                        this.handleColumnSelectChange(columnSelect);
                        setTimeout(() => {
                            valueSelect.value = conditionDefinition.rightColumn;
                            $(valueSelect).trigger('change');
                            this.handleValueSelectChange(valueSelect);
                        }, 50);
                    }, 50);
                }
            } else {
                if (valueSelect) {
                    valueSelect.value = 'custom';
                    $(valueSelect).trigger('change');
                }
                
                if (valueInput && conditionDefinition.rightValue) {
                    valueInput.disabled = false;
                    valueInput.value = conditionDefinition.rightValue;
                    valueInput.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error setting AND/OR condition values:', error);
        }
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHTML(text) {
        if (text === undefined || text === null) return '';
        
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },
    
    /**
     * Debug method to check nested rule tracking
     */
    debugNestedRules() {
        console.log('=== Nested Rule Debug Info ===');
        console.log('Nested rule map:', this.nestedRuleMap);
        
        // Check all rule containers in DOM
        const allRuleContainers = document.querySelectorAll('.rule-container');
        console.log('Rule containers in DOM:');
        allRuleContainers.forEach(container => {
            const ruleId = container.getAttribute('data-rule-id');
            const parentId = container.getAttribute('data-parent-rule-id');
            const nestingLevel = container.getAttribute('data-nesting-level');
            console.log(`- Rule ID: ${ruleId}, Parent ID: ${parentId || 'none'}, Nesting Level: ${nestingLevel || '0'}`);
        });
    }
};

// Initialize rule builder on page load
document.addEventListener('DOMContentLoaded', () => {
    ruleBuilder.init();
    
    // Add debug capability
    window.debugRuleBuilder = () => {
        console.log("Rule Builder State:", {
            currentRuleId: ruleBuilder.currentRuleId,
            hasBaseRule: ruleBuilder.hasBaseRule,
            initialized: ruleBuilder.initialized,
            nestedRuleMap: ruleBuilder.nestedRuleMap,
            appData: window.appData
        });
        
        ruleBuilder.debugNestedRules();
    };
    
    // Explicitly make ruleBuilder available globally
    window.ruleBuilder = ruleBuilder;
    
    // Listen for step navigation to update dropdowns
    document.addEventListener('navigationChanged', (e) => {
        if (e.detail && e.detail.step === 3) {
            setTimeout(() => {
                ruleBuilder.updateAllColumnDropdowns();
                ruleBuilder.updateCalculatedRuleOption();
            }, 200);
        }
    });
});