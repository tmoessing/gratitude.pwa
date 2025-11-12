/**
 * UI view rendering functions
 */

import { getEntriesByDate, getAllEntries, calculateStreak, getTotalEntryCount, getDaysWithEntriesCount, calculateLongestStreak, getMostFrequentEntries, getMostFrequentWords } from '../data/storage.js';
import { formatDate, formatDateDisplay, getTodayDateString, formatDateHeader, getLastWeekDate, getLastMonthDate, getThreeMonthsAgoDate, getSixMonthsAgoDate, getOneYearAgoDate, getRandomDateFromEntries, findNearestDateWithEntries, getCalendarGridDates, getPreviousMonth, getNextMonth, getMonthName, getPreviousYear, getNextYear } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/htmlUtils.js';

/**
 * Renders today's gratitude entries
 */
export function renderTodayEntries() {
    const container = document.getElementById('todayEntries');
    if (!container) return;
    
    const today = getTodayDateString();
    const entries = getEntriesByDate(today);
    
    if (entries.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <ul class="gratitude-list">
            ${entries.map((entry, index) => `
                <li class="gratitude-item" data-date="${today}" data-index="${index}">
                    <div class="gratitude-item-content">${escapeHtml(entry)}</div>
                    <button type="button" class="edit-btn" aria-label="Edit entry">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </li>
            `).join('')}
        </ul>
    `;
}

/**
 * Renders past gratitude entries (excluding today)
 */
export function renderPastEntries() {
    const container = document.getElementById('pastEntries');
    if (!container) return;
    
    const allEntries = getAllEntries();
    const today = getTodayDateString();
    
    // Filter out today's entries and sort by date (newest first)
    const pastEntries = Object.entries(allEntries)
        .filter(([date]) => date !== today)
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
    
    if (pastEntries.length === 0) {
        container.innerHTML = '<p class="empty-state">No past entries yet. Start adding your gratitude entries!</p>';
        return;
    }
    
    container.innerHTML = pastEntries.map(([date, items]) => `
        <div class="date-group">
            <div class="date-header">${formatDateDisplay(date)}</div>
            <ul class="gratitude-list">
                ${items.map((item, index) => `
                    <li class="gratitude-item" data-date="${date}" data-index="${index}">
                        <div class="gratitude-item-content">${escapeHtml(item)}</div>
                        <button type="button" class="edit-btn" aria-label="Edit entry">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

/**
 * Renders calendar entries for a specific date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
export function renderCalendarEntries(dateString) {
    const container = document.getElementById('calendarEntries');
    const formContainer = document.getElementById('calendarFormContainer');
    if (!container) return;
    
    const entries = getEntriesByDate(dateString);
    
    if (entries.length === 0) {
        // Show form when there are no entries
        container.innerHTML = '<p class="empty-state">No entries for this date</p>';
        if (formContainer) {
            formContainer.style.display = 'block';
        }
    } else {
        // Show entries and hide form when entries exist
        container.innerHTML = `
            <ul class="gratitude-list">
                ${entries.map(entry => `
                    <li class="gratitude-item">${escapeHtml(entry)}</li>
                `).join('')}
            </ul>
        `;
        if (formContainer) {
            formContainer.style.display = 'none';
        }
    }
}

/**
 * Updates the calendar date title
 * @param {string} dateString - Date string in YYYY-MM-DD format
 */
export function updateCalendarDateTitle(dateString) {
    const titleElement = document.getElementById('calendarDateTitle');
    if (!titleElement) return;
    
    titleElement.textContent = formatDateDisplay(dateString);
}

/**
 * Renders the calendar grid for a specific month
 * @param {Date} monthDate - Date object representing the month to display
 * @param {string} selectedDate - Currently selected date string in YYYY-MM-DD format
 */
export function renderCalendarGrid(monthDate, selectedDate) {
    const gridContainer = document.getElementById('calendarGrid');
    if (!gridContainer) return;
    
    const allEntries = getAllEntries();
    const datesWithEntries = new Set(Object.keys(allEntries).filter(date => {
        const entries = allEntries[date];
        return entries && entries.length > 0;
    }));
    
    const today = getTodayDateString();
    const gridDates = getCalendarGridDates(monthDate);
    const currentMonth = monthDate.getMonth();
    const currentYear = monthDate.getFullYear();
    
    const monthName = getMonthName(monthDate);
    
    let html = `
        <div class="calendar-month-header">
            <button id="calendarPrevYearBtn" class="calendar-year-nav-btn" aria-label="Previous year">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="11 18 5 12 11 6"></polyline>
                    <polyline points="18 18 12 12 18 6"></polyline>
                </svg>
            </button>
            <button id="calendarPrevMonthBtn" class="calendar-month-nav-btn" aria-label="Previous month">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <button id="calendarMonthYearBtn" class="calendar-month-title-btn" aria-label="Select month and year">
                <h3 class="calendar-month-title">${monthName} ${currentYear}</h3>
            </button>
            <button id="calendarTodayBtn" class="calendar-today-nav-btn" aria-label="Go to today">Today</button>
            <button id="calendarNextMonthBtn" class="calendar-month-nav-btn" aria-label="Next month">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            <button id="calendarNextYearBtn" class="calendar-year-nav-btn" aria-label="Next year">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="13 18 19 12 13 6"></polyline>
                    <polyline points="6 18 12 12 6 6"></polyline>
                </svg>
            </button>
        </div>
        <div class="calendar-weekdays">
            <div class="calendar-weekday">Sun</div>
            <div class="calendar-weekday">Mon</div>
            <div class="calendar-weekday">Tue</div>
            <div class="calendar-weekday">Wed</div>
            <div class="calendar-weekday">Thu</div>
            <div class="calendar-weekday">Fri</div>
            <div class="calendar-weekday">Sat</div>
        </div>
        <div class="calendar-days">
    `;
    
    gridDates.forEach(date => {
        const dateString = formatDate(date);
        const day = date.getDate();
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = dateString === today;
        const isSelected = dateString === selectedDate;
        const hasEntries = datesWithEntries.has(dateString);
        const isFuture = dateString > today;
        
        let classes = 'calendar-day';
        if (!isCurrentMonth) {
            classes += ' calendar-day-other-month';
        }
        if (isToday) {
            classes += ' calendar-day-today';
        }
        if (isSelected) {
            classes += ' calendar-day-selected';
        }
        if (hasEntries) {
            classes += ' calendar-day-has-entries';
        }
        if (isFuture) {
            classes += ' calendar-day-future';
        }
        
        html += `
            <button 
                type="button" 
                class="${classes}" 
                data-date="${dateString}"
                data-future="${isFuture}"
                aria-label="${formatDateDisplay(dateString)}"
                ${isFuture ? 'disabled' : ''}
            >
                <span class="calendar-day-number">${day}</span>
                ${hasEntries ? '<span class="calendar-day-indicator"></span>' : ''}
            </button>
        `;
    });
    
    html += `
        </div>
    `;
    
    gridContainer.innerHTML = html;
}

/**
 * Renders the month/year picker modal
 * @param {Date} currentDate - Current date to highlight selected month/year
 */
export function renderMonthYearPicker(currentDate) {
    const yearPicker = document.getElementById('yearPicker');
    const monthPicker = document.getElementById('monthPicker');
    
    if (!yearPicker || !monthPicker) return;
    
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Generate years (current year ± 10 years)
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    let yearHtml = '';
    
    for (let year = startYear; year <= endYear; year++) {
        const isSelected = year === currentYear;
        yearHtml += `
            <button 
                type="button" 
                class="year-picker-item ${isSelected ? 'selected' : ''}" 
                data-year="${year}"
            >
                ${year}
            </button>
        `;
    }
    
    yearPicker.innerHTML = yearHtml;
    
    // Generate months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let monthHtml = '';
    
    months.forEach((month, index) => {
        const isSelected = index === currentMonth;
        monthHtml += `
            <button 
                type="button" 
                class="month-picker-item ${isSelected ? 'selected' : ''}" 
                data-month="${index}"
            >
                ${month}
            </button>
        `;
    });
    
    monthPicker.innerHTML = monthHtml;
}

/**
 * Renders the date display in the header
 */
export function renderDateDisplay() {
    const dateDisplay = document.getElementById('dateDisplay');
    if (!dateDisplay) return;
    
    dateDisplay.textContent = formatDateHeader();
}

/**
 * Renders the streak display in the header
 */
export function renderStreak() {
    const streakDisplay = document.getElementById('streakDisplay');
    if (!streakDisplay) return;
    
    const streak = calculateStreak();
    const streakCount = streakDisplay.querySelector('.streak-count');
    
    if (streakCount) {
        streakCount.textContent = streak;
    }
}

/**
 * Renders all entries with sorting
 * @param {string} sortBy - 'date' or 'alpha'
 */
export function renderAllEntries(sortBy = 'date') {
    const container = document.getElementById('allEntriesList');
    if (!container) return;
    
    const allEntries = getAllEntries();
    
    if (Object.keys(allEntries).length === 0) {
        container.innerHTML = '<p class="empty-state">No entries yet. Start adding your gratitude entries!</p>';
        return;
    }
    
    let entriesList = [];
    
    // Flatten all entries into a list with date information
    Object.entries(allEntries).forEach(([date, items]) => {
        items.forEach(item => {
            entriesList.push({
                date: date,
                text: item
            });
        });
    });
    
    // Sort entries
    if (sortBy === 'alpha') {
        entriesList.sort((a, b) => a.text.localeCompare(b.text));
    } else {
        // Sort by date (newest first), then by text
        entriesList.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return a.text.localeCompare(b.text);
        });
    }
    
    // Group by date if sorting by date
    if (sortBy === 'date') {
        const grouped = {};
        entriesList.forEach(entry => {
            if (!grouped[entry.date]) {
                grouped[entry.date] = [];
            }
            grouped[entry.date].push(entry.text);
        });
        
        container.innerHTML = Object.entries(grouped)
            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
            .map(([date, items]) => `
                <div class="date-group">
                    <div class="date-header">${formatDateDisplay(date)}</div>
                    <ul class="gratitude-list">
                        ${items.map(item => `
                            <li class="gratitude-item">${escapeHtml(item)}</li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');
    } else {
        // Alphabetical: show all entries in a flat list
        container.innerHTML = `
            <ul class="gratitude-list">
                ${entriesList.map(entry => `
                    <li class="gratitude-item">
                        <div class="gratitude-item-text">${escapeHtml(entry.text)}</div>
                        <div class="gratitude-item-date">${formatDateDisplay(entry.date)}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    }
}

/**
 * Renders random highlight at the top
 */
export function renderRandomHighlight() {
    const container = document.getElementById('randomHighlight');
    if (!container) return;
    
    const allEntries = getAllEntries();
    const randomDate = getRandomDateFromEntries(allEntries);
    
    if (!randomDate) {
        container.innerHTML = '<p class="empty-state">No entries yet. Start adding your gratitude entries!</p>';
        return;
    }
    
    const entries = getEntriesByDate(randomDate);
    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-state">No entries yet. Start adding your gratitude entries!</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="random-highlight-date">${formatDateDisplay(randomDate)}</div>
        <ul class="gratitude-list">
            ${entries.map(entry => `
                <li class="gratitude-item">${escapeHtml(entry)}</li>
            `).join('')}
        </ul>
    `;
}

/**
 * Renders historical highlights
 */
export function renderHistoricalHighlights() {
    const allEntries = getAllEntries();
    
    // Render random highlight
    const randomContainer = document.getElementById('randomHighlight');
    if (randomContainer) {
        const randomDate = getRandomDateFromEntries(allEntries);
        
        if (!randomDate) {
            randomContainer.innerHTML = '<p class="empty-state-small">No entries</p>';
        } else {
            const entries = getEntriesByDate(randomDate);
            if (entries.length === 0) {
                randomContainer.innerHTML = '<p class="empty-state-small">No entries</p>';
            } else {
                randomContainer.innerHTML = `
                    <div class="highlight-date">${formatDateDisplay(randomDate)}</div>
                    <ul class="highlight-list">
                        ${entries.map(entry => `
                            <li class="highlight-item">${escapeHtml(entry)}</li>
                        `).join('')}
                    </ul>
                `;
            }
        }
    }
    
    // Helper function to render a highlight
    const renderHighlight = (containerId, dateString, label) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let entries = getEntriesByDate(dateString);
        let displayDate = dateString;
        let isFallback = false;
        
        // If no entries for the exact date, find the nearest date with entries
        if (entries.length === 0) {
            const nearestDate = findNearestDateWithEntries(dateString, allEntries);
            if (nearestDate) {
                displayDate = nearestDate;
                entries = getEntriesByDate(nearestDate);
                isFallback = true;
            } else {
                container.innerHTML = '<p class="empty-state-small">No entries</p>';
                return;
            }
        }
        
        // Build date display with fallback indicator if needed
        let dateDisplay;
        if (isFallback) {
            dateDisplay = `
                <div class="highlight-date">
                    <span class="highlight-date-fallback">(nearest: ${formatDateDisplay(displayDate)})</span>
                </div>
            `;
        } else {
            dateDisplay = `<div class="highlight-date">${formatDateDisplay(displayDate)}</div>`;
        }
        
        container.innerHTML = `
            ${dateDisplay}
            <ul class="highlight-list">
                ${entries.map(entry => `
                    <li class="highlight-item">${escapeHtml(entry)}</li>
                `).join('')}
            </ul>
        `;
    };
    
    // Render each historical highlight
    renderHighlight('lastWeekHighlight', getLastWeekDate(), 'Last Week');
    renderHighlight('lastMonthHighlight', getLastMonthDate(), 'Last Month');
    renderHighlight('threeMonthsHighlight', getThreeMonthsAgoDate(), '3 Months Ago');
    renderHighlight('sixMonthsHighlight', getSixMonthsAgoDate(), '6 Months Ago');
    renderHighlight('oneYearHighlight', getOneYearAgoDate(), '1 Year Ago');
}

/**
 * Renders insights statistics
 */
export function renderInsights() {
    const totalEntries = getTotalEntryCount();
    const daysCompleted = getDaysWithEntriesCount();
    const longestStreak = calculateLongestStreak();
    
    const totalEntriesStat = document.getElementById('totalEntriesStat');
    const daysCompletedStat = document.getElementById('daysCompletedStat');
    const longestStreakStat = document.getElementById('longestStreakStat');
    
    if (totalEntriesStat) {
        totalEntriesStat.textContent = totalEntries;
    }
    
    if (daysCompletedStat) {
        daysCompletedStat.textContent = daysCompleted;
    }
    
    if (longestStreakStat) {
        longestStreakStat.textContent = longestStreak;
    }
    
    // Render most frequent entries
    const frequentEntries = getMostFrequentEntries(5);
    const frequentEntriesList = document.getElementById('frequentEntriesList');
    if (frequentEntriesList) {
        if (frequentEntries.length === 0) {
            frequentEntriesList.innerHTML = '<p class="empty-state-small">No frequent entries yet</p>';
        } else {
            frequentEntriesList.innerHTML = `
                <ul class="frequent-list">
                    ${frequentEntries.map(entry => `
                        <li class="frequent-item">
                            <span class="frequent-text">${escapeHtml(entry.text)}</span>
                            <span class="frequent-count">${entry.count}x</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
    }
    
    // Render most frequent words
    const frequentWords = getMostFrequentWords(10);
    const frequentWordsList = document.getElementById('frequentWordsList');
    if (frequentWordsList) {
        if (frequentWords.length === 0) {
            frequentWordsList.innerHTML = '<p class="empty-state-small">No frequent words yet</p>';
        } else {
            frequentWordsList.innerHTML = `
                <ul class="frequent-list">
                    ${frequentWords.map(word => `
                        <li class="frequent-item">
                            <span class="frequent-text">${escapeHtml(word.word)}</span>
                            <span class="frequent-count">${word.count}x</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
    }
}

/**
 * Renders all views (today entries, date display, and streak)
 */
export function renderAll() {
    renderDateDisplay();
    renderStreak();
    renderTodayEntries();
    // Historical highlights are rendered when the modal opens
}

