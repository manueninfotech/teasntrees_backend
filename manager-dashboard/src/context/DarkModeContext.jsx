import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext(null);

export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (!context) {
        throw new Error('useDarkMode must be used within DarkModeProvider');
    }
    return context;
};

export const DarkModeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('managerDarkMode');
        return stored === 'true';
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('managerDarkMode', isDark);
    }, [isDark]);

    const toggleDarkMode = () => {
        setIsDark(prev => !prev);
    };

    return (
        <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};
