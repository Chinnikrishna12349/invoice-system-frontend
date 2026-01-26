import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Country, getCountryPreference, setCountryPreference } from '../services/countryPreferenceService';

interface CountryContextType {
    country: Country;
    setCountry: (country: Country) => void;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const useCountry = () => {
    const context = useContext(CountryContext);
    if (!context) {
        throw new Error('useCountry must be used within a CountryProvider');
    }
    return context;
};

interface CountryProviderProps {
    children: ReactNode;
}

export const CountryProvider: React.FC<CountryProviderProps> = ({ children }) => {
    const [country, setCountryState] = useState<Country>(() => getCountryPreference());

    // Load country preference on mount
    useEffect(() => {
        const storedCountry = getCountryPreference();
        setCountryState(storedCountry);
    }, []);

    const setCountry = (newCountry: Country) => {
        setCountryPreference(newCountry);
        setCountryState(newCountry);
    };

    const value: CountryContextType = {
        country,
        setCountry,
    };

    return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
};

