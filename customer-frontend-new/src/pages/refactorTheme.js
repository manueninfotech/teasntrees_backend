const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ProfilePage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add BrandContext import
if (!content.includes('useBrand')) {
    content = content.replace(
        "import { useCart } from '../context/CartContext';",
        "import { useCart } from '../context/CartContext';\nimport { useBrand } from '../context/BrandContext';"
    );
}

// 2. Add useBrand hook inside component
if (!content.includes('const { theme, brandName } = useBrand();')) {
    content = content.replace(
        "const { setIsCartOpen, addToCart } = useCart();",
        "const { setIsCartOpen, addToCart } = useCart();\n    const { theme, brandName } = useBrand();"
    );
}

// 3. Dynamic replacement logic for classes
// Cafe-emerald -> #565A47 for LittleH
// text-cafe-emerald -> theme.isLittleH ? 'text-[#565A47]' : 'text-cafe-emerald'
// bg-cafe-emerald -> theme.isLittleH ? 'bg-[#565A47]' : 'bg-cafe-emerald'
// border-cafe-emerald -> theme.isLittleH ? 'border-[#565A47]' : 'border-cafe-emerald'
// focus:border-cafe-emerald -> ...
// etc.
// Additionally, cafe-teal (darker hover) -> #3f4233
// emerald-50 (light text/bg) -> #565A47/10
// emerald-100 -> #565A47/20
// emerald-600 -> #565A47
// text-emerald-700 -> #3f4233

// Function to replace plain string classNames with dynamic templated ones using 'cn'
function replaceClassNames(regex, replacementCallback) {
    content = content.replace(/className="([^"]+)"/g, (match, classStr) => {
        if (regex.test(classStr)) {
            // It has our target class, we should convert the entire string into a template literal
            // and use conditional replacement.
            // Wait, actually changing the whole string to template literal is tricky if it involves mixed replacements.
            // Better to wrap the whole static string with `cn` and dynamic strings?

            // Actually, we can just replace the specific words inside the string via regex and make the string a template literal.
            let dynamicStr = classStr;

            const replaced = replacementCallback(dynamicStr);
            if (replaced !== classStr) {
                return `className={cn("${classStr.replace(regex, '')}", ${replaced})}`;
            }
        }
        return match;
    });
}

// Helper to replace plain class strings safely
// It's safer to just run an exact template literal conversion
// Example: className="w-full bg-cafe-emerald hover:bg-cafe-teal"
// -> className={cn("w-full", theme.isLittleH ? "bg-[#565A47] hover:bg-[#3f4233]" : "bg-cafe-emerald hover:bg-cafe-teal")}

function applyDynamicTheme(content) {
    return content.replace(/className="([^"]*(cafe-emerald|cafe-teal|emerald-\d+)[^"]*)"/g, (match, classNames) => {

        let littleHClasses = classNames;

        // bg-cafe-emerald -> bg-[#565A47]
        littleHClasses = littleHClasses.replace(/\bbg-cafe-emerald\b/g, 'bg-[#565A47]');
        // text-cafe-emerald -> text-[#565A47]
        littleHClasses = littleHClasses.replace(/\btext-cafe-emerald\b/g, 'text-[#565A47]');
        littleHClasses = littleHClasses.replace(/\bborder-cafe-emerald\b/g, 'border-[#565A47]');
        littleHClasses = littleHClasses.replace(/\bring-cafe-emerald\b/g, 'ring-[#565A47]');

        // hover/focus variants
        littleHClasses = littleHClasses.replace(/cafe-emerald/g, '[#565A47]');
        littleHClasses = littleHClasses.replace(/cafe-teal/g, '[#3f4233]');

        // emerald variants
        littleHClasses = littleHClasses.replace(/\btext-emerald-600\b/g, 'text-[#565A47]');
        littleHClasses = littleHClasses.replace(/\btext-emerald-700\b/g, 'text-[#3f4233]');
        littleHClasses = littleHClasses.replace(/\bbg-emerald-50\b/g, 'bg-[#FAF1E8]');
        littleHClasses = littleHClasses.replace(/\bbg-emerald-100\b/g, 'bg-[#FDF5EC]');
        littleHClasses = littleHClasses.replace(/\bborder-emerald-100\b/g, 'border-[#8B8E7B]/20');
        littleHClasses = littleHClasses.replace(/\bfill-emerald-400\b/g, 'fill-[#565A47]');
        littleHClasses = littleHClasses.replace(/\btext-emerald-400\b/g, 'text-[#565A47]');

        // Remove the original strings from the generic base class list to prevent duplication
        let genericClasses = classNames;
        const toRemove = ['bg-cafe-emerald', 'text-cafe-emerald', 'border-cafe-emerald', 'cafe-teal', 'emerald-50', 'emerald-100', 'emerald-600', 'emerald-700', 'emerald-400'];

        // Instead of removing from generic, we can just supply base + conditional string.
        // But some variants like `focus:ring-cafe-emerald/50` are harder to split.
        // It's MUCH easier to just use `cn("...", theme.isLittleH ? "..." : "...")` where the first string is classes that DO NOT contain our targets.

        const safeBaseClasses = [];
        const tntSpecificClasses = [];
        const littleHSpecificClasses = [];

        classNames.split(' ').forEach(cls => {
            if (!cls) return;
            if (cls.includes('emerald') || cls.includes('teal')) {
                tntSpecificClasses.push(cls);

                // transform specifically for LittleH
                let transformed = cls;
                transformed = transformed.replace(/cafe-emerald/g, '[#565A47]');
                transformed = transformed.replace(/cafe-teal/g, '[#3f4233]');
                transformed = transformed.replace(/emerald-50/g, '[#FAF1E8]');
                transformed = transformed.replace(/emerald-100/g, '[#FDF5EC]');
                transformed = transformed.replace(/emerald-600/g, '[#565A47]');
                transformed = transformed.replace(/emerald-700/g, '[#3f4233]');
                transformed = transformed.replace(/emerald-400/g, '[#565A47]');
                littleHSpecificClasses.push(transformed);
            } else {
                safeBaseClasses.push(cls);
            }
        });

        const baseClassStr = safeBaseClasses.join(' ');
        const tntStr = tntSpecificClasses.join(' ');
        const litStr = littleHSpecificClasses.join(' ');

        return `className={cn("${baseClassStr}", theme.isLittleH ? "${litStr}" : "${tntStr}")}`;
    });
}

const originalContent = content;
content = applyDynamicTheme(content);

// Apply similar logic for template literals 
// e.g. className={`... bg-cafe-emerald...`}
// Wait, ProfilePage doesn't have many active template literals with cafe-emerald. 
// Let's verify if there are any.
content = content.replace(/className=\{`([^`]*(cafe-emerald|cafe-teal|emerald-\d+)[^`]*)`\}/g, (match, innerStr) => {
    // We already have string interpolation here.
    // Replace it inside the `cn` function
    let genericStr = innerStr.replace(/\$\{([^}]+)\}/g, "TEMP_LITERAL");

    const safeBaseParts = [];
    const tntParts = [];
    const litParts = [];

    // Naively splitting by space might break if there are complex template expressions.
    // Instead of parsing, we can just replace the specific words inside the whole string.
    let tntVersion = innerStr;
    let litVersion = innerStr;

    litVersion = litVersion.replace(/cafe-emerald/g, '[#565A47]');
    litVersion = litVersion.replace(/cafe-teal/g, '[#3f4233]');
    litVersion = litVersion.replace(/emerald-50/g, '[#FAF1E8]');
    litVersion = litVersion.replace(/emerald-100/g, '[#FDF5EC]');
    litVersion = litVersion.replace(/emerald-600/g, '[#565A47]');
    litVersion = litVersion.replace(/emerald-700/g, '[#3f4233]');
    litVersion = litVersion.replace(/emerald-400/g, '[#565A47]');

    // We replace the whole className={...} with cn(..., theme.isLittleH ? ... : ...)
    return `className={cn(theme.isLittleH ? \`${litVersion}\` : \`${tntVersion}\`)}`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored ProfilePage.jsx for theme dynamism.');

