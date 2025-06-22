/**
 * data-handler.js - Handles Excel data processing and management
 */

// Variables for data management
const dataHandler = {
    columns: [],
    processes: [],
    data: [],
    uploadedFiles: [],
    filteredData: [],
    selectedProcesses: [],
    processColumnName: '',
    
    /**
     * Initialize data handler
     */
    init() {
        console.log("Initializing data handler");
        this.setupFileUpload();
        this.attachProcessSelectionEvents();
    },
    
    /**
     * Set up file upload functionality
     */
    setupFileUpload() {
        const fileUploadInput = document.getElementById("fileUpload");
        const uploadBtn = document.getElementById("uploadBtn");
        const uploadedFilesListContainer = document.getElementById("uploadedFilesList");
        const statusMessage = document.getElementById("uploadStatusMessage");
        
        if (uploadBtn) {
            uploadBtn.addEventListener("click", () => {
                if (fileUploadInput) {
                    fileUploadInput.click();
                }
            });
        }
        
        if (fileUploadInput) {
            fileUploadInput.addEventListener("change", async (event) => {
                const files = event.target.files;
                if (!files || files.length === 0) return;
                
                // Show loader
                if (uploadedFilesListContainer) {
                    uploadedFilesListContainer.innerHTML = `
                        <div class="spinner-container">
                            <div class="spinner"></div>
                            <div class="ms-3">Processing files...</div>
                        </div>
                    `;
                }
                
                try {
                    // Reset status message
                    if (statusMessage) {
                        statusMessage.classList.add("hidden");
                    }
                    
                    // Process each file
                    for (const file of Array.from(files)) {
                        await this.processExcelFile(file);
                    }
                    
                    // Update UI after processing
                    this.updateUploadedFilesUI();
                    this.updateDataPreview();
                    
                    // Enable continue button if we have files
                    const btnToStep2 = document.getElementById("btnToStep2");
                    if (btnToStep2) {
                        btnToStep2.disabled = this.uploadedFiles.length === 0;
                    }
                } catch (error) {
                    console.error("Error processing files:", error);
                    if (statusMessage) {
                        statusMessage.textContent = `Error processing files: ${error.message}`;
                        statusMessage.classList.remove("hidden");
                        statusMessage.classList.remove("alert-info");
                        statusMessage.classList.add("alert-danger");
                    }
                    
                    // Reset file input to allow selecting the same file again
                    fileUploadInput.value = '';
                }
            });
        }
    },
    
    /**
     * Convert Excel date to formatted string
     * @param {number} serialDate - Excel serial date
     * @returns {string} - Formatted date string
     */
    convertExcelDate(serialDate) {
        try {
            // Excel dates are stored as number of days since 1/1/1900
            const excelEpoch = new Date(1900, 0, 1);
            const offsetDays = serialDate - 2; // Excel incorrectly treats 1900 as leap year
            const date = new Date(excelEpoch.getTime() + offsetDays * 24 * 60 * 60 * 1000);
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]}_${date.getFullYear()}`;
        } catch (error) {
            console.error("Error converting Excel date:", error);
            return "Unknown_Date";
        }
    },
    
    /**
     * Check if a value is likely an Excel date
     * @param {*} value - Value to check
     * @returns {boolean} - Whether the value appears to be an Excel date
     */
    isExcelDate(value) {
        // Excel dates are typically stored as numbers between 1 and ~44000
        // (covering dates from 1900 to ~2020s)
        if (typeof value === 'number' && value > 0 && value < 100000) {
            // Additional check: try to convert and see if we get a reasonable date
            try {
                const excelEpoch = new Date(1900, 0, 1);
                const offsetDays = value - 2;
                const date = new Date(excelEpoch.getTime() + offsetDays * 24 * 60 * 60 * 1000);
                
                // Check if the resulting date is reasonable (between 1900 and 2100)
                const year = date.getFullYear();
                return year >= 1900 && year <= 2100;
            } catch (e) {
                return false;
            }
        }
        return false;
    },
    
    /**
     * Process Excel file and extract data
     * @param {File} file - The Excel file to process
     */
    async processExcelFile(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        if (!window.XLSX) {
                            reject(new Error("XLSX library not loaded. Please refresh the page and try again."));
                            return;
                        }
                        
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { 
                            type: "array",
                            cellDates: true,
                            dateNF: 'mm/dd/yyyy'
                        });
                        
                        // Get first sheet
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        
                        // Convert to JSON with header row
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                            header: 1,
                            raw: true,
                            dateNF: 'mm/dd/yyyy'
                        });
                        
                        if (jsonData.length < 2) {
                            reject(new Error("File contains insufficient data. Need at least headers and one data row."));
                            return;
                        }
                        
                        // Extract headers (first row) and process date columns
                        const headers = jsonData[0].map(header => {
                            if (header === null || header === undefined) {
                                return ""; // Handle null or undefined headers
                            }
                            
                            if (this.isExcelDate(header)) {
                                return this.convertExcelDate(header);
                            }
                            return String(header).trim();
                        });
                        
                        // Identify the process column (first column by default)
                        const processColumnIndex = 0;
                        const processColumnName = headers[processColumnIndex];
                        this.processColumnName = processColumnName;
                        
                        // Convert data to objects with proper headers
                        const formattedData = [];
                        for (let i = 1; i < jsonData.length; i++) {
                            const row = jsonData[i];
                            if (!row || row.length === 0) continue; // Skip empty rows
                            
                            const rowData = {};
                            // Ensure the process column exists
                            if (row[processColumnIndex] === undefined || row[processColumnIndex] === null) {
                                continue; // Skip rows without process identifier
                            }
                            
                            // Add each column with its header
                            for (let j = 0; j < headers.length; j++) {
                                const header = headers[j];
                                if (header) { // Only add if header exists
                                    rowData[header] = row[j];
                                }
                            }
                            
                            formattedData.push(rowData);
                        }
                        
                        // Update file data
                        const fileObj = {
                            name: file.name,
                            data: formattedData,
                            headers: headers.filter(Boolean), // Remove empty headers
                            size: file.size,
                            lastModified: file.lastModified
                        };
                        
                        // Replace existing file with same name or add new
                        const existingFileIndex = this.uploadedFiles.findIndex(f => f.name === file.name);
                        if (existingFileIndex >= 0) {
                            this.uploadedFiles[existingFileIndex] = fileObj;
                        } else {
                            this.uploadedFiles.push(fileObj);
                        }
                        
                        // Merge all data
                        this.mergeAllData();
                        
                        resolve();
                    } catch (error) {
                        console.error("Error processing Excel data:", error);
                        reject(new Error(`Error processing ${file.name}: ${error.message}`));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error(`Error reading file: ${file.name}`));
                };
                
                reader.readAsArrayBuffer(file);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Merge data from all uploaded files
     */
    mergeAllData() {
        // Reset main data arrays
        this.data = [];
        this.columns = [];
        this.processes = [];
        
        if (this.uploadedFiles.length === 0) {
            return;
        }
        
        // Collect all unique columns across files
        const allColumns = new Set();
        this.uploadedFiles.forEach(file => {
            file.headers.forEach(header => {
                if (header) allColumns.add(header);
            });
        });
        
        // Convert to array and ensure process column is first
        this.columns = Array.from(allColumns);
        
        // Move process column to first position if it exists
        if (this.processColumnName && this.columns.includes(this.processColumnName)) {
            this.columns = [
                this.processColumnName,
                ...this.columns.filter(col => col !== this.processColumnName)
            ];
        }
        
        // Merge data from all files
        this.uploadedFiles.forEach(file => {
            this.data = this.data.concat(file.data);
        });
        
        // Extract unique processes
        if (this.processColumnName) {
            this.processes = [...new Set(
                this.data
                    .map(row => row[this.processColumnName])
                    .filter(p => p !== undefined && p !== null)
            )].sort();
        }
        
        // Make data available globally
        window.appData = {
            columns: this.columns,
            processes: this.processes,
            data: this.data,
            filteredData: this.filteredData,
            selectedProcesses: this.selectedProcesses,
            processColumnName: this.processColumnName
        };
        
        // Update process dropdown
        this.updateProcessDropdown();
        
        // Debug output
        console.log("Data merged successfully:", {
            columns: this.columns.length,
            processes: this.processes.length,
            data: this.data.length
        });
    },
    
    /**
     * Update the UI to show uploaded files
     */
    updateUploadedFilesUI() {
        const container = document.getElementById('uploadedFilesList');
        if (!container) return;
        
        if (this.uploadedFiles.length === 0) {
            container.innerHTML = '<div class="text-muted">No files uploaded yet</div>';
            return;
        }
        
        let fileListHTML = '';
        
        // Create file list items
        this.uploadedFiles.forEach(file => {
            const rowCount = file.data.length;
            const fileSize = this.formatFileSize(file.size);
            
            fileListHTML += `
                <div class="uploaded-file">
                    <div class="uploaded-file-name">${file.name}</div>
                    <div class="uploaded-file-info">${rowCount} rows, ${fileSize}</div>
                    <div class="remove-file" data-filename="${file.name}">×</div>
                </div>
            `;
        });
        
        // Add to container
        container.innerHTML = fileListHTML;
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filename = e.target.getAttribute('data-filename');
                this.removeUploadedFile(filename);
            });
        });
    },
    
    /**
     * Update data preview to show sample of the data
     */
    updateDataPreview() {
        const container = document.getElementById('dataPreview');
        if (!container) return;
        
        if (this.data.length === 0 || this.columns.length === 0) {
            container.innerHTML = '<div class="text-muted">No data available for preview</div>';
            return;
        }
        
        // Show up to 5 rows for preview
        const previewData = this.data.slice(0, 5);
        
        let tableHTML = `
            <div class="data-preview-table table-responsive">
                <table class="table table-bordered table-sm">
                    <thead>
                        <tr>
                            ${this.columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Add data rows
        previewData.forEach(row => {
            tableHTML += '<tr>';
            this.columns.forEach(col => {
                const value = row[col] !== undefined && row[col] !== null ? row[col] : '';
                tableHTML += `<td>${value}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += `
                    </tbody>
                </table>
                <div class="text-end text-muted mt-2">
                    <small>Showing ${previewData.length} of ${this.data.length} rows</small>
                </div>
            </div>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    /**
     * Remove a file from the uploaded files list
     * @param {string} filename - The name of the file to remove
     */
    removeUploadedFile(filename) {
        // Remove from uploadedFiles array
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== filename);
        
        // Merge data again
        this.mergeAllData();
        
        // Update UI
        this.updateUploadedFilesUI();
        this.updateDataPreview();
        
        // Update process dropdown if it exists
        this.updateProcessDropdown();
        
        // Enable/disable the continue button
        const btnToStep2 = document.getElementById("btnToStep2");
        if (btnToStep2) {
            btnToStep2.disabled = this.uploadedFiles.length === 0;
        }
    },
    
    /**
     * Format file size in human-readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} - Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Update process dropdown with available processes
     */
    updateProcessDropdown() {
        const dropdown = document.getElementById("processDropdown");
        if (!dropdown) return;
        
        // Clear existing options
        dropdown.innerHTML = '';
        
        // Add new options
        if (this.processes && this.processes.length > 0) {
            this.processes.forEach(process => {
                const option = document.createElement('option');
                option.value = process;
                option.textContent = process;
                dropdown.appendChild(option);
            });
        }
        
        console.log(`Process dropdown updated with ${this.processes.length} processes`);
    },
    
    /**
     * Attach events for process selection
     */
    attachProcessSelectionEvents() {
        // Select all processes button
        const selectAllBtn = document.getElementById("selectAllProcesses");
        if (selectAllBtn) {
            selectAllBtn.addEventListener("click", () => {
                const dropdown = document.getElementById("processDropdown");
                if (dropdown) {
                    Array.from(dropdown.options).forEach(option => {
                        option.selected = true;
                    });
                    this.updateSelectedProcesses();
                }
            });
        }
        
        // Clear all processes button
        const clearAllBtn = document.getElementById("clearAllProcesses");
        if (clearAllBtn) {
            clearAllBtn.addEventListener("click", () => {
                const dropdown = document.getElementById("processDropdown");
                if (dropdown) {
                    Array.from(dropdown.options).forEach(option => {
                        option.selected = false;
                    });
                    this.updateSelectedProcesses();
                }
            });
        }
        
        // Process dropdown change
        const processDropdown = document.getElementById("processDropdown");
        if (processDropdown) {
            processDropdown.addEventListener("change", () => {
                this.updateSelectedProcesses();
            });
        }
    },
    
    /**
     * Update selected processes based on dropdown selection
     */
    updateSelectedProcesses() {
        const dropdown = document.getElementById("processDropdown");
        if (!dropdown) return;
        
        // Get selected options
        this.selectedProcesses = Array.from(dropdown.selectedOptions).map(option => option.value);
        
        // Update UI
        this.renderSelectedProcesses();
        
        // Update filtered data
        this.filterDataBySelectedProcesses();
        
        // Enable/disable continue button
        const btnToStep3 = document.getElementById("btnToStep3");
        if (btnToStep3) {
            btnToStep3.disabled = this.selectedProcesses.length === 0;
        }
        
        // Show/hide message
        const message = document.getElementById("processSelectionMessage");
        if (message) {
            if (this.selectedProcesses.length === 0) {
                message.classList.remove("hidden");
            } else {
                message.classList.add("hidden");
            }
        }
        
        // Update badge count
        const badge = document.getElementById("processCountBadge");
        if (badge) {
            badge.textContent = this.selectedProcesses.length;
        }
        
        // Update global app data
        if (window.appData) {
            window.appData.selectedProcesses = this.selectedProcesses;
            window.appData.filteredData = this.filteredData;
        }
    },
    
    /**
     * Render selected processes in the UI
     */
    renderSelectedProcesses() {
        const container = document.getElementById("selectedProcesses");
        if (!container) return;
        
        if (this.selectedProcesses.length === 0) {
            container.innerHTML = '<div class="text-muted small">No processes selected</div>';
            return;
        }
        
        container.innerHTML = this.selectedProcesses.map(process => 
            `<span class="process-badge">${process} <span class="remove" data-process="${process}">×</span></span>`
        ).join("");
        
        // Add event listeners to remove buttons
        document.querySelectorAll(".process-badge .remove").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const process = e.target.getAttribute("data-process");
                this.removeSelectedProcess(process);
            });
        });
    },
    
    /**
     * Remove a process from selected processes
     * @param {string} process - The process to remove
     */
    removeSelectedProcess(process) {
        this.selectedProcesses = this.selectedProcesses.filter(p => p !== process);
        
        // Update dropdown selection
        const dropdown = document.getElementById("processDropdown");
        if (dropdown) {
            Array.from(dropdown.options).forEach(option => {
                if (option.value === process) {
                    option.selected = false;
                }
            });
        }
        
        // Update UI
        this.renderSelectedProcesses();
        
        // Update filtered data
        this.filterDataBySelectedProcesses();
        
        // Enable/disable continue button
        const btnToStep3 = document.getElementById("btnToStep3");
        if (btnToStep3) {
            btnToStep3.disabled = this.selectedProcesses.length === 0;
        }
        
        // Show/hide message
        const message = document.getElementById("processSelectionMessage");
        if (message) {
            if (this.selectedProcesses.length === 0) {
                message.classList.remove("hidden");
            } else {
                message.classList.add("hidden");
            }
        }
        
        // Update badge count
        const badge = document.getElementById("processCountBadge");
        if (badge) {
            badge.textContent = this.selectedProcesses.length;
        }
        
        // Update global app data
        if (window.appData) {
            window.appData.selectedProcesses = this.selectedProcesses;
            window.appData.filteredData = this.filteredData;
        }
    },
    
    /**
     * Filter data based on selected processes
     */
    filterDataBySelectedProcesses() {
        if (this.selectedProcesses.length === 0) {
            this.filteredData = [];
            return;
        }
        
        this.filteredData = this.data.filter(row => 
            this.selectedProcesses.includes(String(row[this.processColumnName]))
        );
        
        // Store filtered data globally
        if (window.appData) {
            window.appData.filteredData = this.filteredData;
        }
        
        console.log(`Data filtered: ${this.filteredData.length} rows for ${this.selectedProcesses.length} processes`);
    },
    
    /**
     * Evaluate condition against a data row
     * @param {Object} condition - The condition to evaluate
     * @param {Object} row - The data row
     * @returns {boolean} - Whether the condition is met
     */
    evaluateCondition(condition, row) {
        if (!condition || !condition.leftColumn) return false;
        
        const leftValue = this.getRowValue(row, condition.leftColumn);
        let rightValue;
        
        if (condition.rightType === 'value' || condition.rightType === 'custom') {
            rightValue = parseFloat(condition.rightValue);
        } else {
            rightValue = this.getRowValue(row, condition.rightColumn);
        }
        
        // Handle NaN values
        if (isNaN(leftValue) || isNaN(rightValue)) {
            return false;
        }
        
        let conditionMet = false;
        
        switch(condition.operator) {
            case '>':
                conditionMet = leftValue > rightValue;
                break;
            case '<':
                conditionMet = leftValue < rightValue;
                break;
            case '=':
            case '==':
                conditionMet = leftValue == rightValue;
                break;
            case '>=':
                conditionMet = leftValue >= rightValue;
                break;
            case '<=':
                conditionMet = leftValue <= rightValue;
                break;
            case '!=':
                conditionMet = leftValue != rightValue;
                break;
            default:
                conditionMet = false;
        }
        
        return conditionMet;
    },
    
    /**
     * Get a numeric value from a row
     * @param {Object} row - The data row
     * @param {string} column - The column to get
     * @returns {number} - The numeric value
     */
    getRowValue(row, column) {
        let value = row[column];
        
        // Handle goal fields specially
        if (column.includes('_goal') && value === undefined) {
            return 0;
        }
        
        return parseFloat(value);
    },
    
    /**
     * Get all data and columns
     * @returns {Object} - Data object
     */
    getAllData() {
        return {
            columns: this.columns,
            processes: this.processes,
            data: this.data,
            filteredData: this.filteredData,
            selectedProcesses: this.selectedProcesses,
            processColumnName: this.processColumnName
        };
    }
};

// Initialize the data handler on page load
document.addEventListener('DOMContentLoaded', () => {
    dataHandler.init();
    
    // Add debug capability
    window.debugDataHandler = () => {
        console.log({
            columns: dataHandler.columns,
            processes: dataHandler.processes,
            data: dataHandler.data.length,
            filteredData: dataHandler.filteredData.length,
            selectedProcesses: dataHandler.selectedProcesses,
            processColumnName: dataHandler.processColumnName
        });
    };
});