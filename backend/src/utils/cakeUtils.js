export const normalizeCategoryName = (name = '') =>
    String(name).trim().toLowerCase();

export const isCakeCategoryName = (name = '') => {
    const normalized = normalizeCategoryName(name);
    const compact = normalized.replace(/[\s_-]/g, '');

    // Exclude cafe categories that contain "cake" as part of "pancake(s)"
    if (compact.includes('pancake')) return false;

    // Match explicit cake category words
    return /\b(cake|cakes|cheesecake|cheesecakes)\b/.test(normalized);
};

export const isLittlehCakeCategory = ({ brand, categoryName }) =>
    brand === 'littleh' && isCakeCategoryName(categoryName);
