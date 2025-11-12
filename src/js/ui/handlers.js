/**
 * Event handlers for UI interactions
 */

import { addEntry, updateEntry } from '../data/storage.js';
import { formatDate, getTodayDateString, getPreviousDay, getNextDay, getPreviousMonth, getNextMonth, getPreviousYear, getNextYear } from '../utils/dateUtils.js';
import { showNotification } from '../services/notificationService.js';
import { exportToCSV } from '../services/csvService.js';
import { importFromCSV } from '../services/csvService.js';
import { getAllEntries, getTotalEntryCount, getEntriesByDate } from '../data/storage.js';
import { renderAll, renderCalendarEntries, renderAllEntries, renderTodayEntries, renderPastEntries, renderHistoricalHighlights, renderInsights, renderCalendarGrid, renderMonthYearPicker } from './views.js';
import { escapeHtml } from '../utils/htmlUtils.js';

/**
 * Updates the numbering of all additional fields
 */
function updateAdditionalFieldNumbers() {
    const container = document.getElementById('additionalGratitudeFields');
    if (!container) return;
    
    const additionalFields = container.querySelectorAll('.gratitude-field');
    const baseFields = 3;
    
    additionalFields.forEach((field, index) => {
        const numberSpan = field.querySelector('.gratitude-number');
        if (numberSpan) {
            numberSpan.textContent = baseFields + index + 1;
        }
    });
}

/**
 * Removes an additional gratitude field
 * @param {HTMLElement} fieldElement - The field element to remove
 */
export function removeAdditionalGratitudeField(fieldElement) {
    if (!fieldElement) return;
    
    fieldElement.remove();
    updateAdditionalFieldNumbers();
}

/**
 * Adds a new gratitude input field dynamically
 */
export function addAnotherGratitudeField() {
    const container = document.getElementById('additionalGratitudeFields');
    if (!container) return;
    
    // Count existing fields (3 base + any additional)
    const baseFields = 3;
    const additionalFields = container.querySelectorAll('.gratitude-field').length;
    const fieldNumber = baseFields + additionalFields + 1;
    
    // Create new field
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'gratitude-field additional-gratitude-field';
    fieldDiv.innerHTML = `
        <label class="gratitude-label">I am grateful for</label>
        <div class="gratitude-input-wrapper">
            <span class="gratitude-number">${fieldNumber}</span>
            <input 
                type="text"
                class="gratitude-input additional-gratitude-input"
                placeholder="What else are you grateful for?"
            >
            <button type="button" class="remove-field-btn" aria-label="Remove field">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    
    container.appendChild(fieldDiv);
    
    // Add event listener to remove button
    const removeBtn = fieldDiv.querySelector('.remove-field-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            removeAdditionalGratitudeField(fieldDiv);
        });
    }
    
    // Focus on the new input
    const newInput = fieldDiv.querySelector('.gratitude-input');
    if (newInput) {
        setTimeout(() => newInput.focus(), 100);
    }
}

/**
 * Handles form submission for adding a gratitude entry
 * @param {Event} e - Form submit event
 */
export function handleFormSubmit(e) {
    e.preventDefault();
    const input1 = document.getElementById('gratitudeInput1');
    const input2 = document.getElementById('gratitudeInput2');
    const input3 = document.getElementById('gratitudeInput3');
    
    if (!input1) return;
    
    // Collect all inputs including dynamically added ones
    const items = [
        input1.value.trim(),
        input2?.value.trim() || '',
        input3?.value.trim() || ''
    ];
    
    // Add dynamically created inputs
    const additionalInputs = document.querySelectorAll('.additional-gratitude-input');
    additionalInputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            items.push(value);
        }
    });
    
    // Filter out empty items
    const nonEmptyItems = items.filter(item => item.length > 0);
    
    // Require at least 3 gratitude entries (the base 3 fields)
    if (nonEmptyItems.length === 0) {
        showNotification('Please enter something you\'re grateful for', 'error');
        return;
    }
    
    if (nonEmptyItems.length < 3) {
        showNotification('Please enter at least 3 things you\'re grateful for', 'error');
        return;
    }
    
    const today = formatDate(new Date());
    let successCount = 0;
    
    // Add each item as a separate entry
    nonEmptyItems.forEach(item => {
        if (addEntry(today, item)) {
            successCount++;
        }
    });
    
    if (successCount > 0) {
        // Clear all inputs
        input1.value = '';
        if (input2) input2.value = '';
        if (input3) input3.value = '';
        
        // Clear additional inputs and remove them
        additionalInputs.forEach(input => {
            input.value = '';
        });
        const container = document.getElementById('additionalGratitudeFields');
        if (container) {
            container.innerHTML = '';
        }
        
        renderAll();
        // Refresh highlights if we're on that view
        if (currentView === 'highlights') {
            renderHistoricalHighlights();
        }
        const message = successCount === 1 
            ? 'Gratitude entry added!' 
            : `${successCount} gratitude entries added!`;
        showNotification(message, 'success');
        
        // Navigate back to highlights after successful submission
        if (currentView === 'today') {
            setTimeout(() => {
                navigateToHighlightsFromToday();
            }, 500); // Small delay to let user see the notification
        }
    } else {
        showNotification('Error adding entries', 'error');
    }
}

/**
 * Handles calendar form submission for adding a gratitude entry to a specific date
 * @param {Event} e - Form submit event
 */
export function handleCalendarFormSubmit(e) {
    e.preventDefault();
    const input1 = document.getElementById('calendarGratitudeInput1');
    const input2 = document.getElementById('calendarGratitudeInput2');
    const input3 = document.getElementById('calendarGratitudeInput3');
    
    if (!input1) return;
    
    // Collect all non-empty inputs
    const items = [
        input1.value.trim(),
        input2?.value.trim() || '',
        input3?.value.trim() || ''
    ].filter(item => item.length > 0);
    
    if (items.length === 0) {
        showNotification('Please enter something you\'re grateful for', 'error');
        return;
    }
    
    // Use the current calendar date instead of today
    const selectedDate = currentCalendarDate;
    let successCount = 0;
    
    // Add each item as a separate entry
    items.forEach(item => {
        if (addEntry(selectedDate, item)) {
            successCount++;
        }
    });
    
    if (successCount > 0) {
        // Clear all inputs
        input1.value = '';
        if (input2) input2.value = '';
        if (input3) input3.value = '';
        // Update the calendar view to show the new entries
        updateCalendarView(selectedDate);
        renderAll();
        // Refresh highlights if we're on that view
        if (currentView === 'highlights') {
            renderHistoricalHighlights();
        }
        const message = successCount === 1 
            ? 'Gratitude entry added!' 
            : `${successCount} gratitude entries added!`;
        showNotification(message, 'success');
    } else {
        showNotification('Error adding entries', 'error');
    }
}

/**
 * Handles export button click
 */
export function handleExport() {
    const entryCount = getTotalEntryCount();
    
    if (entryCount === 0) {
        showNotification('No entries to export', 'error');
        return;
    }
    
    try {
        exportToCSV();
        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting data', 'error');
    }
}

/**
 * Handles import file selection
 * @param {Event} event - File input change event
 */
export async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    
    try {
        const importedCount = await importFromCSV(file);
        renderAll();
        showNotification(`Imported ${importedCount} entries successfully!`, 'success');
    } catch (error) {
        console.error('Import error:', error);
        showNotification(error.message || 'Error importing CSV file', 'error');
    } finally {
        // Reset file input
        event.target.value = '';
    }
}

/**
 * Toggles the settings dropdown menu
 */
export function toggleSettingsMenu() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    
    if (!settingsBtn || !settingsDropdown) return;
    
    const isOpen = settingsDropdown.classList.contains('show');
    
    if (isOpen) {
        settingsDropdown.classList.remove('show');
        settingsBtn.setAttribute('aria-expanded', 'false');
    } else {
        settingsDropdown.classList.add('show');
        settingsBtn.setAttribute('aria-expanded', 'true');
    }
}

/**
 * Closes the settings dropdown menu
 */
export function closeSettingsMenu() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    
    if (settingsDropdown) {
        settingsDropdown.classList.remove('show');
    }
    if (settingsBtn) {
        settingsBtn.setAttribute('aria-expanded', 'false');
    }
}

// Calendar state
let currentCalendarDate = getTodayDateString();
let currentCalendarMonth = new Date(); // Current month being displayed in calendar grid

// All entries state
let currentSortMode = 'date';

// Current view state
let currentView = 'highlights'; // Default to highlights

/**
 * Opens the calendar view (now a page view, not modal)
 */
export function openCalendarView() {
    switchView('calendar');
    // Initialize calendar view
    const datePicker = document.getElementById('calendarDatePicker');
    if (datePicker) {
        currentCalendarDate = getTodayDateString();
        datePicker.value = currentCalendarDate;
        updateCalendarView(currentCalendarDate);
    }
}

/**
 * Updates the calendar view for a specific date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
export function updateCalendarView(dateString) {
    currentCalendarDate = dateString;
    
    // Update the month view to show the month containing the selected date
    const selectedDate = new Date(dateString + 'T00:00:00');
    currentCalendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    
    renderCalendarEntries(dateString);
    renderCalendarGrid(currentCalendarMonth, dateString);
}

/**
 * Navigates to the previous day
 */
export function navigateToPreviousDay() {
    const newDate = getPreviousDay(currentCalendarDate);
    updateCalendarView(newDate);
}

/**
 * Navigates to the next day
 */
export function navigateToNextDay() {
    const newDate = getNextDay(currentCalendarDate);
    updateCalendarView(newDate);
}

/**
 * Navigates to today
 */
export function navigateToToday() {
    const today = getTodayDateString();
    updateCalendarView(today);
}

/**
 * Switches to a specific view
 * @param {string} viewName - Name of the view to show ('today', 'highlights', 'calendar', 'allEntries', 'insights')
 */
export function switchView(viewName) {
    // Hide all views
    const views = ['todayView', 'highlightsView', 'calendarView', 'allEntriesView', 'insightsView'];
    views.forEach(viewId => {
        const view = document.getElementById(viewId);
        if (view) {
            view.style.display = 'none';
        }
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the selected view
    const targetView = document.getElementById(`${viewName}View`);
    if (targetView) {
        targetView.style.display = 'block';
        currentView = viewName;
        
        // Render content for the view
        if (viewName === 'highlights') {
            renderHistoricalHighlights();
        } else if (viewName === 'calendar') {
            // Initialize calendar view with today's date
            const today = getTodayDateString();
            currentCalendarDate = today;
            currentCalendarMonth = new Date(); // Set to current month
            updateCalendarView(today);
        } else if (viewName === 'allEntries') {
            renderAllEntries(currentSortMode);
        } else if (viewName === 'insights') {
            renderInsights();
        }
        
        // Set active tab in all views
        document.querySelectorAll(`.view-tab[data-view="${viewName}"]`).forEach(tab => {
            tab.classList.add('active');
        });
    }
}

/**
 * Navigates to the Today view from highlights
 */
export function navigateToTodayFromHighlights() {
    switchView('today');
    
    // Focus on the first input field
    setTimeout(() => {
        const firstInput = document.getElementById('gratitudeInput1');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

/**
 * Navigates back to Highlights view from Today
 */
export function navigateToHighlightsFromToday() {
    switchView('highlights');
}

/**
 * Toggles dark mode on/off
 */
export function toggleDarkMode() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon and label
    updateDarkModeUI(newTheme);
}

/**
 * Updates dark mode toggle UI
 */
function updateDarkModeUI(theme) {
    const icon = document.getElementById('darkModeIcon');
    const label = document.getElementById('darkModeLabel');
    
    if (icon && label) {
        if (theme === 'dark') {
            // Sun icon for light mode (to switch back)
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
            label.textContent = 'Light Mode';
        } else {
            // Moon icon for dark mode
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
            label.textContent = 'Dark Mode';
        }
    }
}

/**
 * Initializes dark mode from localStorage
 */
export function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    html.setAttribute('data-theme', savedTheme);
    updateDarkModeUI(savedTheme);
}

/**
 * Opens the all entries view (now a page view, not modal)
 */
export function openAllEntriesView() {
    switchView('allEntries');
}

/**
 * Opens the insights view (now a page view, not modal)
 */
export function openInsightsView() {
    switchView('insights');
    renderInsights();
}

/**
 * Closes the insights view and returns to highlights
 */
export function closeInsightsView() {
    switchView('highlights');
}

/**
 * Opens the month/year picker modal
 */
export function openMonthYearPicker() {
    const modal = document.getElementById('monthYearPickerModal');
    if (!modal) return;
    
    renderMonthYearPicker(currentCalendarMonth);
    modal.style.display = 'flex';
}

/**
 * Closes the month/year picker modal
 */
export function closeMonthYearPicker() {
    const modal = document.getElementById('monthYearPickerModal');
    if (!modal) return;
    
    modal.style.display = 'none';
}

/**
 * Selects a year in the picker
 * @param {number} year - Year to select
 */
function selectYear(year) {
    const newDate = new Date(currentCalendarMonth);
    newDate.setFullYear(year);
    currentCalendarMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    renderMonthYearPicker(currentCalendarMonth);
    renderCalendarGrid(currentCalendarMonth, currentCalendarDate);
}

/**
 * Selects a month in the picker and closes the modal
 * @param {number} month - Month index (0-11)
 */
function selectMonth(month) {
    const newDate = new Date(currentCalendarMonth);
    newDate.setMonth(month);
    currentCalendarMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    
    // Update calendar view to show the selected month
    // Use the first day of the month as the selected date, but don't select future dates
    const firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    const firstDayString = formatDate(firstDayOfMonth);
    const today = getTodayDateString();
    
    // If the first day of the month is in the future, select today instead
    const dateToSelect = firstDayString > today ? today : firstDayString;
    updateCalendarView(dateToSelect);
    
    closeMonthYearPicker();
}

/**
 * Changes the sort mode and re-renders
 * @param {string} sortMode - 'date' or 'alpha'
 */
export function changeSortMode(sortMode) {
    currentSortMode = sortMode;
    
    // Update active button
    const sortByDateBtn = document.getElementById('sortByDateBtn');
    const sortByAlphaBtn = document.getElementById('sortByAlphaBtn');
    
    if (sortByDateBtn && sortByAlphaBtn) {
        if (sortMode === 'date') {
            sortByDateBtn.classList.add('active');
            sortByAlphaBtn.classList.remove('active');
        } else {
            sortByAlphaBtn.classList.add('active');
            sortByDateBtn.classList.remove('active');
        }
    }
    
    // Re-render entries
    renderAllEntries(sortMode);
}

/**
 * Handles clicking the edit button to start editing an entry
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @param {number} index - Index of the entry in the array
 */
export function handleEditEntry(dateKey, index) {
    const entries = getEntriesByDate(dateKey);
    if (index < 0 || index >= entries.length) {
        return;
    }
    
    const originalText = entries[index];
    const listItem = document.querySelector(`.gratitude-item[data-date="${dateKey}"][data-index="${index}"]`);
    if (!listItem) return;
    
    // Store original text in case of cancel
    listItem.setAttribute('data-original-text', originalText);
    listItem.classList.add('editing');
    
    // Escape HTML for input value attribute
    const escapedText = originalText
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    listItem.innerHTML = `
        <div class="edit-form-wrapper">
            <input 
                type="text" 
                class="edit-input" 
                value="${escapedText}" 
                autofocus
            >
            <div class="edit-actions">
                <button type="button" class="save-edit-btn" aria-label="Save changes">Save</button>
                <button type="button" class="cancel-edit-btn" aria-label="Cancel editing">Cancel</button>
            </div>
        </div>
    `;
    
    const input = listItem.querySelector('.edit-input');
    if (input) {
        input.focus();
        input.select();
        
        // Handle Enter key to save
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveEdit(dateKey, index);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelEdit(dateKey, index);
            }
        });
    }
    
    // Set up save and cancel button handlers
    const saveBtn = listItem.querySelector('.save-edit-btn');
    const cancelBtn = listItem.querySelector('.cancel-edit-btn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => handleSaveEdit(dateKey, index));
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => handleCancelEdit(dateKey, index));
    }
}

/**
 * Handles saving an edited entry
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @param {number} index - Index of the entry in the array
 */
export function handleSaveEdit(dateKey, index) {
    const listItem = document.querySelector(`.gratitude-item[data-date="${dateKey}"][data-index="${index}"]`);
    if (!listItem) return;
    
    const input = listItem.querySelector('.edit-input');
    if (!input) return;
    
    const newText = input.value.trim();
    
    if (!newText) {
        showNotification('Entry cannot be empty', 'error');
        return;
    }
    
    if (updateEntry(dateKey, index, newText)) {
        // Determine which view to re-render
        const today = getTodayDateString();
        if (dateKey === today) {
            renderTodayEntries();
        } else {
            renderPastEntries();
        }
        renderAll(); // Update streak and date display
        // Refresh highlights if we're on that view
        if (currentView === 'highlights') {
            renderHistoricalHighlights();
        }
        showNotification('Entry updated successfully!', 'success');
    } else {
        showNotification('Error updating entry', 'error');
    }
}

/**
 * Handles canceling an edit and reverting to original text
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @param {number} index - Index of the entry in the array
 */
export function handleCancelEdit(dateKey, index) {
    const listItem = document.querySelector(`.gratitude-item[data-date="${dateKey}"][data-index="${index}"]`);
    if (!listItem) return;
    
    const originalText = listItem.getAttribute('data-original-text') || '';
    const entries = getEntriesByDate(dateKey);
    const currentText = entries[index] || originalText;
    
    // Re-render the item in its normal state
    listItem.classList.remove('editing');
    listItem.removeAttribute('data-original-text');
    
    listItem.innerHTML = `
        <div class="gratitude-item-content">${escapeHtml(currentText)}</div>
        <button type="button" class="edit-btn" aria-label="Edit entry">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    `;
}

/**
 * Sets up swipe gesture handling for calendar
 */
function setupSwipeGesture() {
    const calendarModal = document.getElementById('calendarModal');
    if (!calendarModal) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;
    
    calendarModal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    calendarModal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right - go to previous day
                navigateToPreviousDay();
            } else {
                // Swipe left - go to next day
                navigateToNextDay();
            }
        }
    }
}

/**
 * Sets up all event listeners
 */
export function setupEventListeners() {
    const gratitudeForm = document.getElementById('gratitudeForm');
    const calendarGratitudeForm = document.getElementById('calendarGratitudeForm');
    const settingsBtn = document.getElementById('settingsBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const calendarNavBtn = document.getElementById('calendarNavBtn');
    const calendarModal = document.getElementById('calendarModal');
    const calendarCloseBtn = document.getElementById('calendarCloseBtn');
    const calendarDatePicker = document.getElementById('calendarDatePicker');
    const calendarPrevBtn = document.getElementById('calendarPrevBtn');
    const calendarNextBtn = document.getElementById('calendarNextBtn');
    const calendarTodayBtn = document.getElementById('calendarTodayBtn');
    const highlightsModal = document.getElementById('highlightsModal');
    const highlightsCloseBtn = document.getElementById('highlightsCloseBtn');
    const allEntriesNavBtn = document.getElementById('allEntriesNavBtn');
    const allEntriesModal = document.getElementById('allEntriesModal');
    const allEntriesCloseBtn = document.getElementById('allEntriesCloseBtn');
    const sortByDateBtn = document.getElementById('sortByDateBtn');
    const sortByAlphaBtn = document.getElementById('sortByAlphaBtn');
    const insightsBtn = document.getElementById('insightsBtn');
    
    if (gratitudeForm) {
        gratitudeForm.addEventListener('submit', handleFormSubmit);
    }
    
    const addAnotherBtn = document.getElementById('addAnotherGratitudeBtn');
    if (addAnotherBtn) {
        addAnotherBtn.addEventListener('click', addAnotherGratitudeField);
    }
    
    if (calendarGratitudeForm) {
        calendarGratitudeForm.addEventListener('submit', handleCalendarFormSubmit);
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSettingsMenu();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSettingsMenu();
            handleExport();
        });
    }
    
    if (importBtn && importFile) {
        importBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSettingsMenu();
            importFile.click();
        });
    }
    
    if (importFile) {
        importFile.addEventListener('change', handleImport);
    }
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDarkMode();
        });
    }
    
    if (insightsBtn) {
        insightsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSettingsMenu();
            openInsightsView();
        });
    }
    
    const insightsCloseBtn = document.getElementById('insightsCloseBtn');
    if (insightsCloseBtn) {
        insightsCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeInsightsView();
        });
    }
    
    // Tab navigation - use event delegation for all tab buttons
    document.addEventListener('click', (e) => {
        const tab = e.target.closest('.view-tab');
        if (tab) {
            e.preventDefault();
            e.stopPropagation();
            const viewName = tab.getAttribute('data-view');
            if (viewName) {
                switchView(viewName);
            }
        }
    });
    
    // Keep old handlers for backward compatibility if they exist
    if (calendarNavBtn) {
        calendarNavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openCalendarView();
        });
    }
    
    // Calendar grid date click handler (event delegation)
    document.addEventListener('click', (e) => {
        const calendarDay = e.target.closest('.calendar-day');
        if (calendarDay) {
            e.preventDefault();
            e.stopPropagation();
            // Don't allow clicking on future dates
            const isFuture = calendarDay.getAttribute('data-future') === 'true';
            if (isFuture) {
                return;
            }
            const dateString = calendarDay.getAttribute('data-date');
            if (dateString) {
                updateCalendarView(dateString);
            }
            return;
        }
        
        // Month navigation
        if (e.target.closest('#calendarPrevMonthBtn')) {
            e.preventDefault();
            e.stopPropagation();
            currentCalendarMonth = getPreviousMonth(currentCalendarMonth);
            renderCalendarGrid(currentCalendarMonth, currentCalendarDate);
        } else if (e.target.closest('#calendarNextMonthBtn')) {
            e.preventDefault();
            e.stopPropagation();
            currentCalendarMonth = getNextMonth(currentCalendarMonth);
            renderCalendarGrid(currentCalendarMonth, currentCalendarDate);
        } else if (e.target.closest('#calendarPrevYearBtn')) {
            e.preventDefault();
            e.stopPropagation();
            currentCalendarMonth = getPreviousYear(currentCalendarMonth);
            renderCalendarGrid(currentCalendarMonth, currentCalendarDate);
        } else if (e.target.closest('#calendarNextYearBtn')) {
            e.preventDefault();
            e.stopPropagation();
            currentCalendarMonth = getNextYear(currentCalendarMonth);
            renderCalendarGrid(currentCalendarMonth, currentCalendarDate);
        } else if (e.target.closest('#calendarTodayBtn')) {
            e.preventDefault();
            e.stopPropagation();
            const today = getTodayDateString();
            updateCalendarView(today);
        } else if (e.target.closest('#calendarMonthYearBtn')) {
            e.preventDefault();
            e.stopPropagation();
            openMonthYearPicker();
        } else if (e.target.closest('#monthYearPickerCloseBtn') || e.target.closest('.month-year-picker-overlay')) {
            e.preventDefault();
            e.stopPropagation();
            closeMonthYearPicker();
        } else if (e.target.closest('.year-picker-item')) {
            e.preventDefault();
            e.stopPropagation();
            const yearBtn = e.target.closest('.year-picker-item');
            const year = parseInt(yearBtn.getAttribute('data-year'));
            selectYear(year);
        } else if (e.target.closest('.month-picker-item')) {
            e.preventDefault();
            e.stopPropagation();
            const monthBtn = e.target.closest('.month-picker-item');
            const month = parseInt(monthBtn.getAttribute('data-month'));
            selectMonth(month);
        }
    });
    
    // Keep old handlers for backward compatibility if they exist
    if (calendarDatePicker) {
        calendarDatePicker.addEventListener('change', (e) => {
            updateCalendarView(e.target.value);
        });
    }
    
    if (calendarPrevBtn) {
        calendarPrevBtn.addEventListener('click', navigateToPreviousDay);
    }
    
    if (calendarNextBtn) {
        calendarNextBtn.addEventListener('click', navigateToNextDay);
    }
    
    if (calendarTodayBtn) {
        calendarTodayBtn.addEventListener('click', navigateToToday);
    }
    
    // Add buttons for all views - navigate to Today
    const highlightsAddBtn = document.getElementById('highlightsAddBtn');
    const calendarAddBtn = document.getElementById('calendarAddBtn');
    const allEntriesAddBtn = document.getElementById('allEntriesAddBtn');
    
    if (highlightsAddBtn) {
        highlightsAddBtn.addEventListener('click', navigateToTodayFromHighlights);
    }
    
    if (calendarAddBtn) {
        calendarAddBtn.addEventListener('click', navigateToTodayFromHighlights);
    }
    
    if (allEntriesAddBtn) {
        allEntriesAddBtn.addEventListener('click', navigateToTodayFromHighlights);
    }
    
    const todayBackBtn = document.getElementById('todayBackBtn');
    if (todayBackBtn) {
        todayBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateToHighlightsFromToday();
        });
    }
    
    if (allEntriesNavBtn) {
        allEntriesNavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openAllEntriesView();
        });
    }
    
    if (sortByDateBtn) {
        sortByDateBtn.addEventListener('click', () => changeSortMode('date'));
    }
    
    if (sortByAlphaBtn) {
        sortByAlphaBtn.addEventListener('click', () => changeSortMode('alpha'));
    }
    
    
    // Setup swipe gesture
    setupSwipeGesture();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const settingsMenu = document.querySelector('.settings-menu');
        if (settingsMenu && !settingsMenu.contains(e.target)) {
            closeSettingsMenu();
        }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSettingsMenu();
        }
    });
    
    // Event delegation for edit buttons
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            e.preventDefault();
            e.stopPropagation();
            const listItem = editBtn.closest('.gratitude-item');
            if (listItem) {
                const dateKey = listItem.getAttribute('data-date');
                const index = parseInt(listItem.getAttribute('data-index'), 10);
                if (dateKey && !isNaN(index)) {
                    handleEditEntry(dateKey, index);
                }
            }
        }
    });
}

