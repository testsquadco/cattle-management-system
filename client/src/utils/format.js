/**
 * Formats a number as PKR currency
 * @param {number} amount - The amount to format
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'PKR 0.00';
    return `PKR ${amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}; 