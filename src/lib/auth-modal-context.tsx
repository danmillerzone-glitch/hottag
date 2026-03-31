'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface AuthModalContextType {
  isOpen: boolean
  message: string
  openAuthModal: (message: string) => void
  closeAuthModal: () => void
  triggerRef: React.MutableRefObject<HTMLElement | null>
}

const AuthModalContext = createContext<AuthModalContextType>({
  isOpen: false,
  message: '',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  triggerRef: { current: null },
})

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const triggerRef = useRef<HTMLElement | null>(null)

  const openAuthModal = useCallback((msg: string) => {
    triggerRef.current = document.activeElement as HTMLElement
    setMessage(msg)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
    // Restore focus to trigger element
    setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  return (
    <AuthModalContext.Provider value={{ isOpen, message, openAuthModal, closeAuthModal, triggerRef }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  return useContext(AuthModalContext)
}
