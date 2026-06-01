'use client'

import { useEffect, useMemo } from "react";
import { apiClient } from "../api/apiClient";
import useCurrentUserInfo from "@/features/auth/hooks/useCurrentUserInfo";
import { createContext } from "react";

export const AuthContext = createContext<{
    userInfo: {
        id: string;
        email: string;
        username: string;
    } | null
}>({
    userInfo: null,
})

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data, isLoading, isFetching } = useCurrentUserInfo();
    const value = useMemo(() => ({ userInfo: data }), [data])


    if (isLoading || isFetching) {
        return <div>Loading...</div>
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}