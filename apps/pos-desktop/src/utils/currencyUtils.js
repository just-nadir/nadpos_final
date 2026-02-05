export const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '0 so\'m';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
};
