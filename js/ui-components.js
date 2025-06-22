/**
 * ui-components.js - Handles UI component interactions
 */

const uiComponents = {
    /**
     * Initialize UI components
     */
    init() {
        console.log("Initializing UI components");
        this.attachAllEventListeners();
    },
    
    /**
     * Attach all event listeners for UI components
     */
    attachAllEventListeners() {
        try {
            // Initialize visualization toggle if it exists
            const visualizeBtn = document.getElementById('visualizeRule');
            if (visualizeBtn) {
                visualizeBtn.addEventListener('click', this.toggleRuleVisualization);
            }
            
            // Initialize custom values toggle
            const useCustomValuesCheckbox = document.getElementById('useCustomValues');
            if (useCustomValuesCheckbox) {
                useCustomValuesCheckbox.addEventListener('change', function() {
                    const customValuesSection = document.getElementById('customValuesSection');
                    if (customValuesSection) {
                        if (this.checked) {
                            customValuesSection.classList.remove('hidden');
                        } else {
                            customValuesSection.classList.add('hidden');
                        }
                    }
                });
            }
            
            // Attach action type listeners
            document.querySelectorAll('.actionType').forEach(select => {
                select.removeEventListener('change', this.handleActionTypeChange);
                select.addEventListener('change', this.handleActionTypeChange);
            });
            
            // Attach toggle listeners for collapsible sections
            document.querySelectorAll('.toggle-section').forEach(toggle => {
                toggle.removeEventListener('click', this.toggleSection);
                toggle.addEventListener('click', this.toggleSection);
            });
            
            // Attach rule application details toggle
            const showDataDetailsBtn = document.getElementById('showDataDetails');
            if (showDataDetailsBtn) {
                showDataDetailsBtn.addEventListener('click', this.toggleRuleApplicationDetails);
            }
            
            // Initialize tooltips if Bootstrap is available
            if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.map(function (tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl);
                });
            }
            
            console.log("UI components initialized");
        } catch (error) {
            console.error("Error initializing UI components:", error);
        }
    },
    
    /**
     * Toggle a collapsible section
     * @param {Event} event - The click event
     */
    toggleSection(event) {
        try {
            const button = event.currentTarget;
            const section = button.closest('.rule-section') || button.closest('.section-header').parentElement;
            if (!section) return;
            
            const content = section.querySelector('.section-content');
            if (!content) return;
            
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                button.innerHTML = '<i class="fa fa-chevron-down"></i>';
                button.setAttribute('title', 'Collapse section');
            } else {
                content.classList.add('collapsed');
                button.innerHTML = '<i class="fa fa-chevron-right"></i>';
                button.setAttribute('title', 'Expand section');
            }
        } catch (error) {
            console.error("Error toggling section:", error);
        }
    },
    
    /**
     * Handle action type selection change
     * @param {Event} event - The change event
     */
    handleActionTypeChange() {
        try {
            const percentageSymbol = this.closest('.rule-box').querySelector('.percentage-symbol');
            
            if (!percentageSymbol) {
                console.warn("Percentage symbol element not found");
                return;
            }
            
            if (this.value === 'percent-increase' || this.value === 'percent-decrease') {
                percentageSymbol.classList.remove("hidden");
            } else {
                percentageSymbol.classList.add("hidden");
            }
            
            // If action type is 'reset', disable the threshold input
            const thresholdInput = this.closest('.rule-box').querySelector('.thresholdSelect');
            if (thresholdInput) {
                if (this.value === 'reset') {
                    thresholdInput.setAttribute('disabled', 'disabled');
                    thresholdInput.value = '0';
                } else {
                    thresholdInput.removeAttribute('disabled');
                }
            }
            
            // Update rule visualization if available
            uiComponents.updateRuleVisualization();
        } catch (error) {
            console.error("Error handling action type change:", error);
        }
    },
    
    /**
     * Update rule visualization if available
     */
    updateRuleVisualization() {
        try {
            // Check if visualization is visible
            const ruleVisualization = document.getElementById('ruleVisualization');
            if (ruleVisualization && !ruleVisualization.classList.contains('hidden')) {
                // Delay update to allow DOM to settle
                setTimeout(() => {
                    if (window.visualization && typeof window.visualization.visualizeRuleTree === 'function' && 
                        window.ruleBuilder && typeof window.ruleBuilder.buildRuleTree === 'function') {
                        const ruleTree = window.ruleBuilder.buildRuleTree();
                        window.visualization.visualizeRuleTree(ruleTree);
                    }
                }, 100);
            }
        } catch (error) {
            console.error("Error updating rule visualization:", error);
        }
    },
    
    /**
     * Toggle rule visualization
     */
    toggleRuleVisualization() {
        try {
            const ruleVisualization = document.getElementById('ruleVisualization');
            if (!ruleVisualization) return;
            
            if (ruleVisualization.classList.contains('hidden')) {
                // Show visualization
                if (window.visualization && typeof window.visualization.visualizeRuleTree === 'function' && 
                    window.ruleBuilder && typeof window.ruleBuilder.buildRuleTree === 'function') {
                    const ruleTree = window.ruleBuilder.buildRuleTree();
                    window.visualization.visualizeRuleTree(ruleTree);
                }
                ruleVisualization.classList.remove('hidden');
                this.textContent = '<i class="fa fa-eye-slash"></i> Hide Visualization';
            } else {
                // Hide visualization
                ruleVisualization.classList.add('hidden');
                this.textContent = '<i class="fa fa-project-diagram"></i> Visualize Rule';
            }
        } catch (error) {
            console.error("Error toggling rule visualization:", error);
        }
    },
    
    /**
     * Toggle rule application details
     */
    toggleRuleApplicationDetails() {
        try {
            const detailsContainer = document.getElementById('ruleApplicationDetails');
            const toggleButton = document.getElementById('showDataDetails');
            
            if (!detailsContainer || !toggleButton) return;
            
            if (detailsContainer.classList.contains('hidden')) {
                detailsContainer.classList.remove('hidden');
                toggleButton.innerHTML = '<i class="fa fa-times-circle"></i> Hide Details';
            } else {
                detailsContainer.classList.add('hidden');
                toggleButton.innerHTML = '<i class="fa fa-info-circle"></i> Show Details';
            }
        } catch (error) {
            console.error("Error toggling rule application details:", error);
        }
    },
    
    /**
     * Show a notification message
     * @param {string} message - The message to display
     * @param {string} type - Message type (info, success, warning, error)
     */
    showNotification(message, type = 'info') {
        try {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = message;
            
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
        } catch (error) {
            console.error("Error showing notification:", error);
        }
    },
    
    /**
     * Create an interactive chart for goal visualization
     * @param {Array} data - Goal data to visualize
     * @param {string} containerId - ID of container element
     */
    createGoalChart(data, containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container || !data || data.length === 0) return;
            
            // Group the data by goal tiers
            const processColumnName = window.appData?.processColumnName || 'Process';
            const g1Values = data.map(d => ({ process: d[processColumnName], value: d.G1_goal })).filter(v => v.value !== undefined);
            const g2Values = data.map(d => ({ process: d[processColumnName], value: d.G2_goal })).filter(v => v.value !== undefined);
            const g3Values = data.map(d => ({ process: d[processColumnName], value: d.G3_goal })).filter(v => v.value !== undefined);
            
            // Create a simple visualization
            let chartHTML = `
                <div class="goal-chart-container">
                    <h6 class="chart-title">Goal Distribution</h6>
                    <div class="chart-content">
                        <div class="goal-tiers">
                            <div class="goal-tier-box g1-tier">
                                <div class="tier-label">G1 Goal</div>
                                <div class="tier-count">${g1Values.length} goals</div>
                                <div class="tier-avg">Avg: ${this.calculateAverage(g1Values.map(v => v.value))}</div>
                            </div>
                            
                            <div class="goal-tier-box g2-tier">
                                <div class="tier-label">G2 Goal</div>
                                <div class="tier-count">${g2Values.length} goals</div>
                                <div class="tier-avg">Avg: ${this.calculateAverage(g2Values.map(v => v.value))}</div>
                            </div>
                            
                            <div class="goal-tier-box g3-tier">
                                <div class="tier-label">G3 Goal</div>
                                <div class="tier-count">${g3Values.length} goals</div>
                                <div class="tier-avg">Avg: ${this.calculateAverage(g3Values.map(v => v.value))}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = chartHTML;
        } catch (error) {
            console.error("Error creating goal chart:", error);
        }
    },
    
    /**
     * Calculate average of values
     * @param {Array} values - Array of numeric values
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
     * Format a number with thousand separators
     * @param {number} number - Number to format
     * @returns {string} - Formatted number
     */
    formatNumber(number) {
        try {
            return new Intl.NumberFormat().format(number);
        } catch (error) {
            return String(number);
        }
    },
    
    /**
     * Add export functionality for charts and tables
     * @param {string} containerId - Container ID to export
     * @param {string} filename - Filename for export
     */
    addExportButton(containerId, filename) {
        try {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn btn-sm btn-outline-primary export-btn';
            exportBtn.innerHTML = '<i class="fa fa-download"></i> Export';
            exportBtn.addEventListener('click', () => {
                this.exportToImage(containerId, filename);
            });
            
            container.appendChild(exportBtn);
        } catch (error) {
            console.error("Error adding export button:", error);
        }
    },
    
    /**
     * Export an element to an image
     * @param {string} elementId - Element ID to export
     * @param {string} filename - Filename for export
     */
    exportToImage(elementId, filename) {
        try {
            // This is a placeholder for export functionality
            // In a real implementation, you would use html2canvas or similar
            console.log(`Exporting ${elementId} to ${filename}`);
            this.showNotification(`Export feature will be implemented in a future update.`, 'info');
        } catch (error) {
            console.error("Error exporting to image:", error);
        }
    }
};

// Initialize UI components on page load
document.addEventListener('DOMContentLoaded', () => {
    uiComponents.init();
    
    // Listen for navigation events to update UI
    document.addEventListener('navigationChanged', (e) => {
        if (e.detail && e.detail.step) {
            // Re-attach event listeners when switching steps
            setTimeout(() => {
                uiComponents.attachAllEventListeners();
            }, 200);
        }
    });
});