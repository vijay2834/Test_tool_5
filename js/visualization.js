/**
 * visualization.js - Handles data and rule visualizations
 * 
 * This module is responsible for creating visual representations of rules
 * and data within the Goal Setting Framework. It provides methods for
 * displaying rule structures visually to help users understand complex
 * rule hierarchies and relationships.
 */

const visualization = {
    /**
     * Initialize visualization functionality
     */
    init() {
        console.log("Initializing visualization");
        // Set up event listeners for visualization components
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for visualization components
     */
    setupEventListeners() {
        // Add listener for window resize to adjust visualizations
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Add listener for theme changes if applicable
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', this.updateVisualizationTheme.bind(this));
        }
        
        // Listen for navigation events
        document.addEventListener('navigationChanged', (e) => {
            if (e.detail && e.detail.step === 3) {
                // When navigating to rule builder step, ensure visualizations are updated
                setTimeout(() => {
                    this.refreshActiveVisualizations();
                }, 300);
            }
        });
    },
    
    /**
     * Handle window resize events
     */
    handleResize() {
        // Only update if there's an active visualization
        const visualizationContainer = document.getElementById('ruleVisualization');
        if (visualizationContainer && !visualizationContainer.classList.contains('hidden')) {
            this.refreshActiveVisualizations();
        }
    },
    
    /**
     * Refresh any active visualizations to adjust for size changes
     */
    refreshActiveVisualizations() {
        // Get current rule structure from ruleBuilder if available
        if (window.ruleBuilder && typeof window.ruleBuilder.buildRuleTree === 'function') {
            const ruleTree = window.ruleBuilder.buildRuleTree();
            if (ruleTree) {
                this.visualizeRuleTree(ruleTree);
            }
        }
    },
    
    /**
     * Update theme for visualizations
     * @param {Event} event - Theme change event
     */
    updateVisualizationTheme(event) {
        const isDarkMode = event.target.checked;
        this.applyThemeToVisualizations(isDarkMode);
    },
    
    /**
     * Apply theme to visualizations
     * @param {boolean} isDarkMode - Whether dark mode is enabled
     */
    applyThemeToVisualizations(isDarkMode) {
        const ruleNodes = document.querySelectorAll('.rule-node');
        ruleNodes.forEach(node => {
            if (isDarkMode) {
                node.classList.add('dark-theme');
            } else {
                node.classList.remove('dark-theme');
            }
        });
    },
    
    /**
     * Visualize a rule tree structure
     * @param {Object} ruleTree - Rule tree object from ruleBuilder
     */
    visualizeRuleTree(ruleTree) {
        const visualizationContainer = document.getElementById('ruleVisualization');
        if (!visualizationContainer) return;
        
        try {
            if (!ruleTree || (!ruleTree.baseRule && !ruleTree.calculatedRule)) {
                visualizationContainer.innerHTML = '<div class="text-muted">No valid rule to visualize</div>';
                return;
            }
            
            // Generate visualization HTML
            let visualizationHtml = '<div class="visualization-header">Rule Structure Visualization</div>';
            
            // Visualize base rule
            if (ruleTree.baseRule) {
                visualizationHtml += '<h6>Base Rule:</h6>';
                visualizationHtml += this.createRuleVisualization(ruleTree.baseRule);
            }
            
            // Visualize calculated rule
            if (ruleTree.calculatedRule) {
                visualizationHtml += '<h6 class="mt-3">Calculated Rule (based on G2):</h6>';
                visualizationHtml += this.createRuleVisualization(ruleTree.calculatedRule);
            }
            
            visualizationContainer.innerHTML = visualizationHtml;
            
            // Apply any currently active theme
            const isDarkMode = document.body.classList.contains('dark-mode');
            if (isDarkMode) {
                this.applyThemeToVisualizations(true);
            }
            
            // Add interactive functionality to the visualization
            this.addInteractivityToVisualization();
            
            console.log("Rule visualization updated");
        } catch (error) {
            console.error('Error visualizing rule:', error);
            visualizationContainer.innerHTML = `<div class="alert alert-danger">Error visualizing rule: ${error.message}</div>`;
        }
    },
    
    /**
     * Create visualization for a rule
     * @param {Object} rule - Rule object to visualize
     * @returns {string} - HTML representation of the rule
     */
    createRuleVisualization(rule) {
        if (!rule || !rule.condition) return '';
        
        let html = '<div class="rule-visualization-item">';
        
        // Main condition visualization with improved styling
        html += `<div class="rule-node condition-node" title="Main condition">IF ${this.formatCondition(rule.condition)}</div>`;
        
        // AND conditions visualization with better hierarchy
        if (rule.condition.andConditions && rule.condition.andConditions.length > 0) {
            html += '<div class="condition-group and-group">';
            rule.condition.andConditions.forEach(and => {
                html += `<div class="rule-node and-node" title="AND condition">AND ${this.formatCondition(and)}</div>`;
            });
            html += '</div>';
        }
        
        // OR conditions visualization with better hierarchy
        if (rule.condition.orConditions && rule.condition.orConditions.length > 0) {
            html += '<div class="condition-group or-group">';
            rule.condition.orConditions.forEach(or => {
                html += `<div class="rule-node or-node" title="OR condition">OR ${this.formatCondition(or)}</div>`;
            });
            html += '</div>';
        }
        
        // Action visualization 
        if (rule.action) {
            html += '<div class="rule-connector"></div>';
            html += `<div class="rule-node action-node" title="Action to perform">THEN ${this.formatAction(rule.action)}</div>`;
        }
        
        // Else action visualization with clear separation
        if (rule.elseAction) {
            html += '<div class="rule-connector"></div>';
            html += `<div class="rule-node else-node" title="Alternative action">ELSE ${this.formatAction(rule.elseAction)}</div>`;
        }
        
        // Nested rules visualization with better collapsible structure
        if (rule.nestedRules && rule.nestedRules.length > 0) {
            html += '<div class="rule-tree-container">';
            html += '<div class="nested-rules-label">Nested Rules:</div>';
            rule.nestedRules.forEach(nestedRule => {
                html += this.createRuleVisualization(nestedRule);
            });
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    },
    
    /**
     * Add interactivity to the visualization
     */
    addInteractivityToVisualization() {
        // Add hover effects with improved transitions
        const ruleNodes = document.querySelectorAll('.rule-node');
        ruleNodes.forEach(node => {
            node.addEventListener('mouseenter', function() {
                this.classList.add('node-hover');
            });
            
            node.addEventListener('mouseleave', function() {
                this.classList.remove('node-hover');
            });
            
            // Add expandable/collapsible for nested rule containers
            if (node.classList.contains('condition-node')) {
                node.addEventListener('click', function() {
                    const container = this.closest('.rule-visualization-item');
                    const nestedContainer = container?.querySelector('.rule-tree-container');
                    
                    if (nestedContainer) {
                        if (nestedContainer.classList.contains('collapsed')) {
                            nestedContainer.classList.remove('collapsed');
                            this.classList.remove('collapsed-node');
                        } else {
                            nestedContainer.classList.add('collapsed');
                            this.classList.add('collapsed-node');
                        }
                    }
                });
            }
        });
        
        // Add smooth transitions for all rule nodes
        document.querySelectorAll('.rule-node, .rule-tree-container').forEach(el => {
            el.style.transition = 'all 0.2s ease';
        });
    },
    
    /**
     * Format a condition for display
     * @param {Object} condition - Condition object
     * @returns {string} - Formatted condition string
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
        
        return `${this.formatColumnName(leftColumn)} ${operator} ${rightPart}`;
    },
    
    /**
     * Format an action for display
     * @param {Object} action - Action object
     * @returns {string} - Formatted action string
     */
    formatAction(action) {
        if (!action) return '';
        
        const column = action.column || '?';
        const actionType = action.type || '?';
        
        let formattedAction = '';
        switch (actionType) {
            case 'value':
                formattedAction = `Set ${this.formatColumnName(column)} = ${action.value || '0'}`;
                break;
            case 'add':
                formattedAction = `${this.formatColumnName(column)} + ${action.value || '0'}`;
                break;
            case 'subtract':
                formattedAction = `${this.formatColumnName(column)} - ${action.value || '0'}`;
                break;
            case 'percent-increase':
                formattedAction = `${this.formatColumnName(column)} × (1 + ${action.value || '0'}<span class="percent-symbol">%</span>)`;
                break;
            case 'percent-decrease':
                formattedAction = `${this.formatColumnName(column)} × (1 - ${action.value || '0'}<span class="percent-symbol">%</span>)`;
                break;
            case 'multiply':
                formattedAction = `${this.formatColumnName(column)} × ${action.value || '1'}`;
                break;
            case 'divide':
                formattedAction = `${this.formatColumnName(column)} ÷ ${action.value || '1'}`;
                break;
            case 'reset':
                formattedAction = `${this.formatColumnName(column)} = 0`;
                break;
            default:
                formattedAction = `${actionType} ${this.formatColumnName(column)} ${action.value || ''}`;
        }
        
        return formattedAction;
    },
    
    /**
     * Format column name for better display
     * @param {string} columnName - Original column name
     * @returns {string} - Formatted column name
     */
    formatColumnName(columnName) {
        // Check if column name is a goal column and apply special formatting
        if (columnName.includes('_goal')) {
            const tier = columnName.split('_')[0];
            switch (tier) {
                case 'G1':
                    return `<span class="goal-column g1-column">${columnName}</span>`;
                case 'G2':
                    return `<span class="goal-column g2-column">${columnName}</span>`;
                case 'G3':
                    return `<span class="goal-column g3-column">${columnName}</span>`;
                default:
                    return `<span class="goal-column">${columnName}</span>`;
            }
        }
        
        // Special case for calculated goal
        if (columnName === 'G2_calculated') {
            return `<span class="goal-column g2-calculated-column">${columnName}</span>`;
        }
        
        // Return regular column name
        return this.escapeHTML(columnName);
    },
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHTML(text) {
        if (text === null || text === undefined) return '';
        
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },
    
    /**
     * Create a data visualization chart for goal distribution
     * @param {Array} goalData - Data with goal values
     * @param {string} containerId - ID of container element
     */
    createGoalDistributionVisualization(goalData, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !goalData || goalData.length === 0) return;
        
        try {
            // Group the data by goal tiers
            const g1Values = goalData.map(d => d.G1_goal).filter(v => v !== undefined);
            const g2Values = goalData.map(d => d.G2_goal).filter(v => v !== undefined);
            const g3Values = goalData.map(d => d.G3_goal).filter(v => v !== undefined);
            
            // Create simplified visualization
            container.innerHTML = `
                <div class="goal-distribution-visualization">
                    <h6>Goal Distribution Overview</h6>
                    
                    <div class="goal-tier-summary">
                        <div class="goal-tier-box g1-tier">
                            <div class="tier-label">G1 Goal</div>
                            <div class="tier-count">${g1Values.length} goals</div>
                            <div class="tier-avg">Avg: ${this.calculateAverage(g1Values)}</div>
                        </div>
                        
                        <div class="goal-tier-box g2-tier">
                            <div class="tier-label">G2 Goal</div>
                            <div class="tier-count">${g2Values.length} goals</div>
                            <div class="tier-avg">Avg: ${this.calculateAverage(g2Values)}</div>
                        </div>
                        
                        <div class="goal-tier-box g3-tier">
                            <div class="tier-label">G3 Goal</div>
                            <div class="tier-count">${g3Values.length} goals</div>
                            <div class="tier-avg">Avg: ${this.calculateAverage(g3Values)}</div>
                        </div>
                    </div>
                    
                    <div class="visualization-note text-muted">
                        For detailed metrics, export results to Excel
                    </div>
                </div>
            `;
            
            console.log("Goal distribution visualization created");
        } catch (error) {
            console.error('Error creating goal distribution visualization:', error);
            container.innerHTML = `<div class="alert alert-danger">Error creating visualization: ${error.message}</div>`;
        }
    },
    
    /**
     * Calculate average of an array of numbers
     * @param {Array} values - Array of number values
     * @returns {string} - Formatted average
     */
    calculateAverage(values) {
        if (!values || values.length === 0) return '0';
        
        try {
            const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
            if (numericValues.length === 0) return '0';
            
            const sum = numericValues.reduce((acc, val) => acc + val, 0);
            const avg = sum / numericValues.length;
            
            return avg.toFixed(2);
        } catch (error) {
            console.error('Error calculating average:', error);
            return '0';
        }
    },
    
    /**
     * Visualize rules applied to a specific process
     * @param {string} processId - ID of the process
     * @param {Object} processDetails - Details of rule application
     * @returns {string} - HTML for the visualization
     */
    visualizeProcessRuleApplication(processId, processDetails) {
        if (!processId || !processDetails) return '';
        
        try {
            let html = `
                <div class="process-rule-application">
                    <h6>${processId}</h6>
            `;
            
            if (processDetails.appliedRules.length === 0) {
                html += `
                    <div class="alert alert-info">
                        No rules were applied to this process.
                    </div>
                `;
            } else {
                html += '<div class="applied-rules-list">';
                
                processDetails.appliedRules.forEach((rule, index) => {
                    const isBase = rule.ruleName.includes('(Base)');
                    const isCalculated = rule.ruleName.includes('(Calculated)');
                    
                    html += `
                        <div class="applied-rule ${isBase ? 'base-rule' : ''} ${isCalculated ? 'calculated-rule' : ''}">
                            <div class="rule-header">
                                <span class="rule-index">${index + 1}</span>
                                <span class="rule-name">${rule.ruleName}</span>
                            </div>
                            <div class="rule-body">
                                <div class="rule-condition">
                                    <div class="main-condition ${rule.condition.met ? 'condition-met' : 'condition-not-met'}">
                                        ${rule.condition.description}
                                    </div>
                    `;
                    
                    // Add AND conditions
                    if (rule.condition.andConditions && rule.condition.andConditions.length > 0) {
                        html += '<div class="and-conditions">';
                        rule.condition.andConditions.forEach(and => {
                            html += `
                                <div class="and-condition ${and.met ? 'condition-met' : 'condition-not-met'}">
                                    AND ${and.description}
                                </div>
                            `;
                        });
                        html += '</div>';
                    }
                    
                    // Add OR conditions
                    if (rule.condition.orConditions && rule.condition.orConditions.length > 0) {
                        html += '<div class="or-conditions">';
                        rule.condition.orConditions.forEach(or => {
                            html += `
                                <div class="or-condition ${or.met ? 'condition-met' : 'condition-not-met'}">
                                    OR ${or.description}
                                </div>
                            `;
                        });
                        html += '</div>';
                    }
                    
                    // Add action
                    if (rule.action) {
                        html += `
                                </div>
                                <div class="rule-action ${rule.action.applied ? 'action-applied' : 'action-not-applied'}">
                                    ${rule.action.isElse ? 'ELSE' : 'THEN'} ${rule.action.description}
                                </div>
                            </div>
                        </div>
                        `;
                    } else {
                        html += `
                                </div>
                            </div>
                        </div>
                        `;
                    }
                });
                
                html += '</div>';
            }
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error('Error visualizing process rule application:', error);
            return `<div class="alert alert-danger">Error visualizing rules: ${error.message}</div>`;
        }
    },
    
    /**
     * Show notification message
     * @param {string} message - Message to display
     * @param {string} type - Message type ('info', 'success', 'warning', 'error')
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            
            // Remove from DOM after transition
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
};

// Initialize visualization on page load
document.addEventListener('DOMContentLoaded', () => {
    visualization.init();
    
    // Add debug capability
    window.debugVisualization = () => {
        console.log("Visualization module ready");
        return {
            status: "ready",
            containers: {
                ruleVisualization: !!document.getElementById('ruleVisualization'),
                finalResultsTable: !!document.getElementById('finalResultsTable'),
                ruleApplicationSummary: !!document.getElementById('ruleApplicationSummary')
            }
        };
    };
});