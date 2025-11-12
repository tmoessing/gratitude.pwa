/**
 * Date utility functions
 */

/**
 * Formats a date object to YYYY-MM-DD string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a date string for display (Today, Yesterday, or full date)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Human-readable date string
 */
export function formatDateDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (formatDate(date) === formatDate(today)) {
        return 'Today';
    } else if (formatDate(date) === formatDate(yesterday)) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

/**
 * Gets today's date as a formatted string
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function getTodayDateString() {
    return formatDate(new Date());
}

/**
 * Gets the previous day from a date string
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Previous day in YYYY-MM-DD format
 */
export function getPreviousDay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    return formatDate(date);
}

/**
 * Gets the next day from a date string
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Next day in YYYY-MM-DD format
 */
export function getNextDay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    return formatDate(date);
}

/**
 * Gets ordinal suffix for a day number (st, nd, rd, th)
 * @param {number} day - Day number
 * @returns {string} Ordinal suffix
 */
function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Formats a date for header display: "Tuesday 11th, November 2025"
 * @param {Date} date - Date object to format (defaults to today)
 * @returns {string} Formatted date string
 */
export function formatDateHeader(date = new Date()) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayOfWeek = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    const ordinalSuffix = getOrdinalSuffix(day);
    
    return `${dayOfWeek} ${day}${ordinalSuffix}, ${month} ${year}`;
}

/**
 * Gets a date string for a specific time period ago
 * @param {number} daysAgo - Number of days ago
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getDateDaysAgo(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return formatDate(date);
}

/**
 * Gets a date string for approximately a week ago (7 days)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getLastWeekDate() {
    return getDateDaysAgo(7);
}

/**
 * Gets a date string for approximately a month ago (30 days)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getLastMonthDate() {
    return getDateDaysAgo(30);
}

/**
 * Gets a date string for approximately 3 months ago (90 days)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getThreeMonthsAgoDate() {
    return getDateDaysAgo(90);
}

/**
 * Gets a date string for approximately 6 months ago (180 days)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getSixMonthsAgoDate() {
    return getDateDaysAgo(180);
}

/**
 * Gets a date string for approximately 1 year ago (365 days)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getOneYearAgoDate() {
    return getDateDaysAgo(365);
}

/**
 * Gets a random date from all available entries
 * @param {Object} allEntries - Object with date keys and array of entries
 * @returns {string|null} Random date string in YYYY-MM-DD format, or null if no entries
 */
export function getRandomDateFromEntries(allEntries) {
    const dates = Object.keys(allEntries).filter(date => {
        const entries = allEntries[date];
        return entries && entries.length > 0;
    });
    
    if (dates.length === 0) {
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * dates.length);
    return dates[randomIndex];
}

/**
 * Finds the nearest date with entries before (or equal to) the target date
 * @param {string} targetDateString - Target date string in YYYY-MM-DD format
 * @param {Object} allEntries - Object with date keys and array of entries
 * @returns {string|null} Nearest date string in YYYY-MM-DD format, or null if no entries exist before target date
 */
export function findNearestDateWithEntries(targetDateString, allEntries) {
    // Get all dates that have entries
    const datesWithEntries = Object.keys(allEntries).filter(date => {
        const entries = allEntries[date];
        return entries && entries.length > 0;
    });
    
    if (datesWithEntries.length === 0) {
        return null;
    }
    
    // Sort dates in descending order (newest first)
    const sortedDates = datesWithEntries.sort((a, b) => b.localeCompare(a));
    
    // Find the most recent date that is <= target date
    for (const date of sortedDates) {
        if (date <= targetDateString) {
            return date;
        }
    }
    
    // If no date found before target, return null
    return null;
}

/**
 * Gets the first day of the month for a given date
 * @param {Date} date - Date object
 * @returns {Date} First day of the month
 */
export function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Gets the last day of the month for a given date
 * @param {Date} date - Date object
 * @returns {Date} Last day of the month
 */
export function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Gets the first day of the calendar grid (may include previous month's days)
 * @param {Date} date - Date object
 * @returns {Date} First day to show in calendar grid
 */
export function getCalendarStartDate(date) {
    const firstDay = getFirstDayOfMonth(date);
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - dayOfWeek);
    return startDate;
}

/**
 * Gets all dates for a calendar month grid (6 weeks = 42 days)
 * @param {Date} date - Date object for the month to display
 * @returns {Array<Date>} Array of dates for the calendar grid
 */
export function getCalendarGridDates(date) {
    const startDate = getCalendarStartDate(date);
    const dates = [];
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        dates.push(currentDate);
    }
    return dates;
}

/**
 * Gets the previous month from a date
 * @param {Date} date - Date object
 * @returns {Date} Previous month
 */
export function getPreviousMonth(date) {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() - 1);
    return newDate;
}

/**
 * Gets the next month from a date
 * @param {Date} date - Date object
 * @returns {Date} Next month
 */
export function getNextMonth(date) {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    return newDate;
}

/**
 * Gets month name from a date
 * @param {Date} date - Date object
 * @returns {string} Month name
 */
export function getMonthName(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
}

