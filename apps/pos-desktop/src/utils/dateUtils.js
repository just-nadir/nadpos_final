export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
};

export const formatTime = (date) => {
    if (!date) return '';
    // Agar sana "HH:mm" formatida bo'lsa (eski ma'lumot)
    if (typeof date === 'string' && date.length === 5 && date.includes(':')) {
        return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Invalid Date bo'lsa o'zini qaytar

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const formatDateTime = (date) => {
    if (!date) return '';
    return `${formatDate(date)} ${formatTime(date)}`;
};
