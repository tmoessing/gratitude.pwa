/**
 * CSV import/export service
 */

import { formatDate } from '../utils/dateUtils.js';
import { getAllEntries, mergeEntries, saveEntries } from '../data/storage.js';

/**
 * Exports all entries to CSV format and triggers download
 */
export function exportToCSV() {
    const entries = getAllEntries();
    const rows = [];
    
    // Header
    rows.push(['Date', 'Gratitude Entry']);
    
    // Data rows
    Object.entries(entries).forEach(([date, items]) => {
        items.forEach(item => {
            rows.push([date, item]);
        });
    });
    
    // Convert to CSV
    const csvContent = rows.map(row => {
        return row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        }).join(',');
    }).join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gratitude-entries-${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Parses CSV content and returns entries object
 * @param {string} csvContent - CSV file content
 * @returns {Object} Parsed entries object
 */
export function parseCSV(csvContent) {
    const entries = {};
    const lines = csvContent.split('\n');
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles quoted fields)
        const row = parseCSVLine(line);
        if (row.length >= 2) {
            const date = row[0].trim();
            const item = row[1].trim();
            
            if (date && item) {
                // Validate date format (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    if (!entries[date]) {
                        entries[date] = [];
                    }
                    entries[date].push(item);
                }
            }
        }
    }
    
    return entries;
}

/**
 * Parses a single CSV line handling quoted fields
 * @param {string} line - CSV line to parse
 * @returns {Array<string>} Array of field values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add last field
    result.push(current);
    return result;
}

/**
 * Imports entries from a CSV file
 * @param {File} file - CSV file to import
 * @returns {Promise<number>} Promise resolving to count of imported entries
 */
export function importFromCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                const importedEntries = parseCSV(csvContent);
                
                if (Object.keys(importedEntries).length === 0) {
                    reject(new Error('No valid entries found in CSV file'));
                    return;
                }
                
                // Merge with existing entries
                const mergedEntries = mergeEntries(importedEntries);
                saveEntries(mergedEntries);
                
                const importedCount = Object.values(importedEntries).reduce(
                    (sum, items) => sum + items.length, 
                    0
                );
                
                resolve(importedCount);
            } catch (error) {
                console.error('Error importing CSV:', error);
                reject(new Error('Error importing CSV file'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}

