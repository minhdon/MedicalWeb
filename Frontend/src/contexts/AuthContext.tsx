import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface Warehouse {
    id: string;
    name: string;
    address: string;
}

interface User {
    id: string;
    fullName: string;
    email: string;
    phoneNum?: string;
    role: string;
    warehouse: Warehouse | null;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isStaff: boolean;
    login: (userData: User, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Return default values when not wrapped in AuthProvider
        // This allows components to work without requiring login
        return {
            user: null,
            isLoggedIn: false,
            isStaff: false,
            login: () => { },
            logout: () => { }
        };
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedToken && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                // Invalid JSON, clear storage
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
    }, []);

    const login = (userData: User, token: string) => {
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // Check if user is staff (has Staff role)
    const isStaff = user?.role === 'Staff' || user?.role === 'Admin';

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn: !!user,
            isStaff,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
