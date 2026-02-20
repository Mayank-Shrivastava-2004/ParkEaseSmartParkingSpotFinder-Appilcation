import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: 'light' | 'dark';
    mode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const deviceColorScheme = useDeviceColorScheme();
    const [mode, setMode] = useState<ThemeMode>('light');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Load persisted theme
        const loadTheme = async () => {
            try {
                const savedMode = await AsyncStorage.getItem('appTheme');
                if (savedMode) {
                    setMode(savedMode as ThemeMode);
                } else {
                    // Default to light if no preference saved
                    setMode('light');
                }
            } catch (e) {
                console.error('Failed to load theme', e);
            }
        };
        loadTheme();
    }, []);

    useEffect(() => {
        if (mode === 'system') {
            setTheme(deviceColorScheme || 'light');
        } else {
            setTheme(mode === 'dark' ? 'dark' : 'light');
        }
    }, [mode, deviceColorScheme]);

    const setThemeMode = async (newMode: ThemeMode) => {
        try {
            setMode(newMode);
            await AsyncStorage.setItem('appTheme', newMode);
        } catch (e) {
            console.error('Failed to save theme', e);
            // Fallback to light if failed
            setMode('light');
        }
    };

    const toggleTheme = () => {
        try {
            const newMode = theme === 'dark' ? 'light' : 'dark';
            setThemeMode(newMode);
        } catch (err) {
            console.error('Theme toggle crash:', err);
            setMode('light');
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, mode, setThemeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
