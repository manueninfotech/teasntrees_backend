import React, { createContext, useContext, useMemo, useState } from 'react';

const RefreshContext = createContext({ tick: 0, bump: () => {} });

export const RefreshProvider = ({ children }) => {
    const [tick, setTick] = useState(0);
    const bump = () => setTick((t) => t + 1);
    const value = useMemo(() => ({ tick, bump }), [tick]);
    return (
        <RefreshContext.Provider value={value}>
            {children}
        </RefreshContext.Provider>
    );
};

export const useRefresh = () => useContext(RefreshContext);
