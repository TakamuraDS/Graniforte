
import { useState, useEffect } from 'react';

function getValue<T>(key: string, initialValue: T | (() => T)): T {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
        // The reviver function correctly reconstructs Date objects
        return JSON.parse(savedValue, (key, value) => {
            // Check if the value is a string that looks like an ISO date string.
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                const potentialDate = new Date(value);
                // After parsing, check if the date is valid to prevent issues with invalid date strings (e.g., "2023-99-99T...").
                if (!isNaN(potentialDate.getTime())) {
                    return potentialDate;
                }
            }
            return value;
        });
    }

    if (initialValue instanceof Function) {
        return initialValue();
    }
    return initialValue;
}

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
    const [value, setValue] = useState<T>(() => getValue(key, initialValue));

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue] as const;
}