"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

type UserRole = "consumer"

type User = {
  id: string
  email: string
  username: string
  role: UserRole
}

type AuthContextType = {
  user: User | null
  login: (email: string, username: string) => void
  logout: () => void
  isLoggedIn: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  const login = useCallback(
    (email: string, username: string) => {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        username,
        role: "consumer",
      }

      setUser(newUser)
      localStorage.setItem("user", JSON.stringify(newUser))
      router.push("/consumer")
    },
    [router],
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/") // Redirect to the welcome page
  }, [router])

  const isLoggedIn = useCallback(() => {
    return !!localStorage.getItem("user")
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

