/**
 * LocalStorage data management
 */

import { formatDate } from '../utils/dateUtils.js';

const STORAGE_KEY = 'gratitudeEntries';

/**
 * Retrieves all entries from localStorage
 * @returns {Object} Object with date keys and array of entries
 */
export function getAllEntries() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return {};
    }
}

/**
 * Saves entries to localStorage
 * @param {Object} entries - Entries object to save
 * @throws {Error} If save fails
 */
export function saveEntries(entries) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        throw new Error('Failed to save entries to storage');
    }
}

/**
 * Gets entries for a specific date
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @returns {Array<string>} Array of gratitude entries for that date
 */
export function getEntriesByDate(dateKey) {
    const entries = getAllEntries();
    return entries[dateKey] || [];
}

/**
 * Adds a gratitude entry for a specific date
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @param {string} item - Gratitude entry text
 * @returns {boolean} True if successful, false otherwise
 */
export function addEntry(dateKey, item) {
    if (!item || !item.trim()) {
        return false;
    }
    
    const entries = getAllEntries();
    
    if (!entries[dateKey]) {
        entries[dateKey] = [];
    }
    
    entries[dateKey].push(item.trim());
    saveEntries(entries);
    return true;
}

/**
 * Merges imported entries with existing entries
 * @param {Object} importedEntries - Entries to merge
 * @returns {Object} Merged entries object
 */
export function mergeEntries(importedEntries) {
    const existingEntries = getAllEntries();
    const mergedEntries = { ...existingEntries };
    
    Object.entries(importedEntries).forEach(([date, items]) => {
        if (mergedEntries[date]) {
            // Merge items, avoiding duplicates
            items.forEach(item => {
                if (!mergedEntries[date].includes(item)) {
                    mergedEntries[date].push(item);
                }
            });
        } else {
            mergedEntries[date] = items;
        }
    });
    
    return mergedEntries;
}

/**
 * Gets total count of all entries
 * @returns {number} Total number of entries
 */
export function getTotalEntryCount() {
    const entries = getAllEntries();
    return Object.values(entries).reduce((sum, items) => sum + items.length, 0);
}

/**
 * Updates a specific gratitude entry
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @param {number} index - Index of the entry in the array
 * @param {string} newText - New text for the entry
 * @returns {boolean} True if successful, false otherwise
 */
export function updateEntry(dateKey, index, newText) {
    if (!newText || !newText.trim()) {
        return false;
    }
    
    const entries = getAllEntries();
    
    if (!entries[dateKey] || !Array.isArray(entries[dateKey])) {
        return false;
    }
    
    if (index < 0 || index >= entries[dateKey].length) {
        return false;
    }
    
    entries[dateKey][index] = newText.trim();
    saveEntries(entries);
    return true;
}

/**
 * Calculates the current streak of consecutive days with entries
 * @returns {number} Number of consecutive days with entries
 */
export function calculateStreak() {
    const entries = getAllEntries();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if today has entries
    const todayString = formatDate(currentDate);
    if (entries[todayString] && entries[todayString].length > 0) {
        streak = 1;
        currentDate.setDate(currentDate.getDate() - 1);
    } else {
        // If today has no entries, check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count backwards through consecutive days with entries
    while (true) {
        const dateString = formatDate(currentDate);
        if (entries[dateString] && entries[dateString].length > 0) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

/**
 * Gets the number of unique days that have entries
 * @returns {number} Number of days with entries
 */
export function getDaysWithEntriesCount() {
    const entries = getAllEntries();
    return Object.keys(entries).filter(date => {
        const dayEntries = entries[date];
        return dayEntries && Array.isArray(dayEntries) && dayEntries.length > 0;
    }).length;
}

/**
 * Calculates the longest consecutive streak of days with entries in all history
 * @returns {number} Longest streak of consecutive days with entries
 */
export function calculateLongestStreak() {
    const entries = getAllEntries();
    
    // Get all dates that have entries, sorted chronologically
    const datesWithEntries = Object.keys(entries)
        .filter(date => {
            const dayEntries = entries[date];
            return dayEntries && Array.isArray(dayEntries) && dayEntries.length > 0;
        })
        .sort((a, b) => a.localeCompare(b)); // Sort ascending (oldest first)
    
    if (datesWithEntries.length === 0) {
        return 0;
    }
    
    if (datesWithEntries.length === 1) {
        return 1;
    }
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    // Iterate through sorted dates and find consecutive sequences
    for (let i = 1; i < datesWithEntries.length; i++) {
        const prevDate = new Date(datesWithEntries[i - 1] + 'T00:00:00');
        const currentDate = new Date(datesWithEntries[i] + 'T00:00:00');
        
        // Calculate difference in days
        const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            // Consecutive day
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            // Not consecutive, reset current streak
            currentStreak = 1;
        }
    }
    
    return longestStreak;
}

/**
 * Gets the most frequent gratitude entries
 * @param {number} limit - Maximum number of entries to return (default: 5)
 * @returns {Array<{text: string, count: number}>} Array of entries with counts, sorted by frequency
 */
export function getMostFrequentEntries(limit = 5) {
    const entries = getAllEntries();
    const entryCounts = {};
    
    // Count all entries (case-insensitive, trimmed)
    Object.values(entries).forEach(dayEntries => {
        if (Array.isArray(dayEntries)) {
            dayEntries.forEach(entry => {
                const normalized = entry.trim().toLowerCase();
                if (normalized) {
                    entryCounts[normalized] = (entryCounts[normalized] || 0) + 1;
                }
            });
        }
    });
    
    // Convert to array and sort by count
    const sortedEntries = Object.entries(entryCounts)
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    
    return sortedEntries;
}

/**
 * Gets the most frequent words across all entries
 * @param {number} limit - Maximum number of words to return (default: 10)
 * @returns {Array<{word: string, count: number}>} Array of words with counts, sorted by frequency
 */
export function getMostFrequentWords(limit = 10) {
    const entries = getAllEntries();
    const wordCounts = {};
    
    // Common stop words to filter out
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'to', 'of', 'in', 'on', 'at',
        'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
        'me', 'him', 'us', 'them', 'am', 'so', 'if', 'as', 'up', 'out', 'off', 'over', 'under', 'again',
        'then', 'than', 'when', 'where', 'why', 'how', 'all', 'each', 'both', 'few', 'more', 'most',
        'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'very', 'what', 'which',
        'who', 'whom', 'whose', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
        'below', 'between', 'among', 'around', 'against', 'along', 'across', 'behind', 'beyond',
        'within', 'without', 'throughout', 'toward', 'towards', 'upon', 'about', 'above', 'across'
    ]);
    
    // Collect and count words from all entries
    Object.values(entries).forEach(dayEntries => {
        if (Array.isArray(dayEntries)) {
            dayEntries.forEach(entry => {
                // Split into words, remove punctuation, convert to lowercase
                const words = entry
                    .toLowerCase()
                    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
                    .split(/\s+/) // Split on whitespace
                    .filter(word => word.length >= 3 && !stopWords.has(word)); // Filter short words and stop words
                
                words.forEach(word => {
                    if (word) {
                        wordCounts[word] = (wordCounts[word] || 0) + 1;
                    }
                });
            });
        }
    });
    
    // Convert to array and sort by count
    const sortedWords = Object.entries(wordCounts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    
    return sortedWords;
}

