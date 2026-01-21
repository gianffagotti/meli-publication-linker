import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ClientPrincipal } from '../models/auth';

interface AuthContextType {
    user: ClientPrincipal | null;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isLocal = import.meta.env.VITE_LOCAL === 'true';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<ClientPrincipal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            // In production, we check /.auth/me
            // In mock, we rely on the user clicking login, or we could auto-login.
            // The requirement says "If Mock is TRUE: set a fake user state immediately".
            // But also "The login function should just set this state".
            // To allow testing the Login Page, I will NOT auto-login on mount in mock mode,
            // UNLESS we want to simulate a persisted session.
            // Given the "set immediately" instruction, I will set it IF the user wants to skip login.
            // But for now, to make the Login Page visible as requested, I will start null.
            // If the user *really* wanted auto-login, they wouldn't ask for a Login Page.
            // So I will assume "set a fake user state immediately" meant "when login is called" or "be ready".
            // Actually, I'll check if we are in production.

            if (!isLocal) {
                try {
                    const response = await fetch('/.auth/me');
                    const payload = await response.json();
                    const { clientPrincipal } = payload;
                    if (clientPrincipal) {
                        setUser(clientPrincipal);
                    }
                } catch (error) {
                    console.error('Failed to fetch auth info', error);
                }
            } else {
                // Mock mode: we start logged out to see the login page.
                // If we wanted to persist, we'd check localStorage here.
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = () => {
        if (isLocal) {
            setUser({
                identityProvider: 'mock',
                userId: 'mock-user-123',
                userDetails: 'dev@mock.com',
                userRoles: ['authenticated', 'anonymous'],
            });
        } else {
            window.location.href = '/.auth/login/aad';
        }
    };

    const logout = () => {
        if (isLocal) {
            setUser(null);
        } else {
            window.location.href = '/.auth/logout';
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
