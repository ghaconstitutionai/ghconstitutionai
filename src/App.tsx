import { useState, useEffect, useRef, useCallback, createContext, useContext, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, forwardRef } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { createClient, User, Session } from '@supabase/supabase-js'
import { X } from 'lucide-react'
import Landing from './Landing'
import Chat from './Chat'

console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('🔧 Anon Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20))

// ============================================
// SUPABASE CLIENT
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// CONFIG
// ============================================
export const config = {
    code: 'GH',
    name: 'Ghana',
    constitution: "Ghana's 1992 Constitution",
    colors: {
        primary: '#1a472a',
        secondary: '#2d5016',
        accent: '#ce1126',
    },
    gradient: 'linear-gradient(135deg, #1a472a 1%, #2d5016 50%, #ce1126 99%)',
    quickQuestions: [
        'What are the fundamental human rights in Ghana?',
        'How is the President of Ghana elected?',
        'What is the role of Parliament?',
        'Explain the Directive Principles of State Policy',
        'What are the requirements to become a citizen?',
    ],
}

// ============================================
// TYPES
// ============================================
export interface Conversation {
    id: string
    user_id: string
    title: string
    expires_at: string | null
    created_at: string
    updated_at: string
}

export interface Message {
    id: string
    conversation_id: string
    role: 'user' | 'assistant'
    content: string
    sources: Source[] | null
    created_at: string
}

export interface Source {
    article_number: string
    article_text: string
    chapter_number: number
    chapter_title: string
    similarity: number
}

// ============================================
// UTILS
// ============================================
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ')
}

export function formatTime(date: string | Date): string {
    return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date))
}

export function truncate(text: string, length: number): string {
    if (text.length <= length) return text
    return text.slice(0, length).trim() + '...'
}

export function generateTitle(message: string): string {
    const cleaned = message.replace(/\n/g, ' ').trim()
    return truncate(cleaned, 50)
}

// ============================================
// AUTH CONTEXT
// ============================================
interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
    signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
    signOut: () => Promise<{ error: any }>
    resetPassword: (email: string) => Promise<{ data: any; error: any }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check if this is a temporary session (Remember Me was unchecked)
                //const isTempSession = sessionStorage.getItem('temp_session') === 'true'

                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Session error:', error)
                    await supabase.auth.signOut()
                    setSession(null)
                    setUser(null)
                } else if (session) {
                    // If it's a temp session and page was reloaded (not just navigating), 
                    // the sessionStorage will persist. But on browser close, it will be cleared.
                    // So we just use the session normally.
                    setSession(session)
                    setUser(session.user)
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth event:', event)

                if (event === 'SIGNED_OUT') {
                    setSession(null)
                    setUser(null)
                    sessionStorage.removeItem('temp_session')
                } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    setSession(session)
                    setUser(session?.user ?? null)
                } else if (event === 'USER_UPDATED') {
                    setSession(session)
                    setUser(session?.user ?? null)
                }

                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email: string, password: string) => {
        return await supabase.auth.signUp({ email, password })
    }

    const signIn = async (email: string, password: string) => {
        return await supabase.auth.signInWithPassword({ email, password })
    }

    const signOut = async () => {
        sessionStorage.removeItem('temp_session')
        const result = await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        return result
    }

    const resetPassword = async (email: string) => {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
            {children}
        </AuthContext.Provider>
    )
}

// ============================================
// HOOKS
// ============================================
export function useSessionTimeout() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const warningRef = useRef<NodeJS.Timeout | null>(null)
    const [showWarning, setShowWarning] = useState(false)

    const TIMEOUT_DURATION = 30 * 60 * 1000  // 30 minutes
    const WARNING_BEFORE = 5 * 60 * 1000      // Show warning 5 minutes before

    const handleTimeout = useCallback(() => {
        setShowWarning(false)
        // DON'T sign out - just redirect to login with a message
        // The session stays alive, so auto-login will work when they return
        navigate('/login', {
            state: {
                message: 'Session expired due to inactivity. Please sign in again.',
                softLogout: true
            }
        })
    }, [navigate])

    const handleWarning = useCallback(() => {
        setShowWarning(true)
    }, [])

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (warningRef.current) clearTimeout(warningRef.current)
        setShowWarning(false)

        if (user) {
            warningRef.current = setTimeout(handleWarning, TIMEOUT_DURATION - WARNING_BEFORE)
            timeoutRef.current = setTimeout(handleTimeout, TIMEOUT_DURATION)
        }
    }, [user, handleTimeout, handleWarning])

    const extendSession = useCallback(() => {
        resetTimer()
    }, [resetTimer])

    useEffect(() => {
        if (!user) return

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
        resetTimer()
        events.forEach((event) => window.addEventListener(event, resetTimer))

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (warningRef.current) clearTimeout(warningRef.current)
            events.forEach((event) => window.removeEventListener(event, resetTimer))
        }
    }, [user, resetTimer])

    return { showWarning, extendSession }
}

export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    const fetchConversations = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const { data } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
        setConversations(data || [])
        setLoading(false)
    }, [user])

    const createConversation = async (title: string): Promise<Conversation | null> => {
        if (!user) return null
        const { data } = await supabase
            .from('conversations')
            .insert({ user_id: user.id, title })
            .select()
            .single()
        if (data) setConversations((prev) => [data, ...prev])
        return data
    }

    const deleteConversation = async (id: string) => {
        await supabase.from('conversations').delete().eq('id', id)
        setConversations((prev) => prev.filter((conv) => conv.id !== id))
    }

    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    return { conversations, loading, createConversation, deleteConversation }
}

export function useChat(conversationId: string | null) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)

    const fetchMessages = useCallback(async () => {
        if (!conversationId) {
            setMessages([])
            return
        }
        setLoading(true)
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })

        const parsed = (data || []).map((msg) => ({
            ...msg,
            sources: msg.sources ? JSON.parse(msg.sources) : null,
        }))
        setMessages(parsed)
        setLoading(false)
    }, [conversationId])

    // ✅ ADD convId parameter here
    const sendMessage = async (content: string, convId?: string): Promise<boolean> => {
        const targetConversationId = convId || conversationId  // ✅ Use passed ID or default

        if (!targetConversationId || !content.trim()) return false
        setSending(true)

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: targetConversationId,
            role: 'user',
            content,
            sources: null,
            created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, tempMessage])

        try {
            console.log('🚀 Sending to Edge Function:', {
                conversationId: targetConversationId,
                content,
            })

            const { data, error } = await supabase.functions.invoke('chat', {
                body: { conversation_id: targetConversationId, message: content },
            })

            console.log('📥 Response:', { data, error })

            if (error) {
                console.error('❌ Error:', error)
                throw error
            }

            setMessages((prev) => [
                ...prev.filter((m) => m.id !== tempMessage.id),
                {
                    id: data.user_message_id,
                    conversation_id: targetConversationId,
                    role: 'user',
                    content,
                    sources: null,
                    created_at: data.created_at
                },
                {
                    id: data.assistant_message_id,
                    conversation_id: targetConversationId,
                    role: 'assistant',
                    content: data.response,
                    sources: data.sources || null,
                    created_at: data.created_at
                },
            ])
            return true
        } catch (err) {
            console.error('💥 Error:', err)
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
            return false
        } finally {
            setSending(false)
        }
    }

    const clearMessages = () => setMessages([])

    return { messages, loading, sending, fetchMessages, sendMessage, clearMessages }
}

// ============================================
// UI COMPONENTS
// ============================================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
}

export function Button({ children, variant = 'primary', size = 'md', isLoading, className, disabled, ...props }: ButtonProps) {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
        primary: 'bg-primary text-white hover:bg-secondary focus:ring-primary',
        secondary: 'bg-secondary text-white hover:bg-primary focus:ring-secondary',
        outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
        ghost: 'text-primary hover:bg-primary/10 focus:ring-primary',
    }
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    }

    return (
        <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || isLoading} {...props}>
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : null}
            {isLoading ? 'Loading...' : children}
        </button>
    )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>}
        <input
            ref={ref}
            className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-primary',
                error && 'border-accent focus:border-accent focus:ring-accent',
                className
            )}
            {...props}
        />
        {error && <p className="mt-1 text-sm text-accent">{error}</p>}
    </div>
))
Input.displayName = 'Input'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md mx-4 bg-[#1a1a1a] rounded-xl shadow-2xl border border-[#333]">
                {title && (
                    <div className="flex items-center justify-between p-4 border-b border-[#333]">
                        <h2 className="text-lg font-semibold text-[#e5e5e5]">{title}</h2>
                        <button onClick={onClose} className="p-1 rounded-lg text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#2a2a2a]">
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className="p-4">{children}</div>
            </div>
        </div>
    )
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
    return (
        <div className="flex items-center justify-center">
            <svg className={cn('animate-spin text-primary', sizes[size])} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
        </div>
    )
}

// ============================================
// PROTECTED ROUTE
// ============================================
function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    return <>{children}</>
}

// ============================================
// APP
// ============================================
export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Landing page="home" />} />
                <Route path="/login" element={<Landing page="login" />} />
                <Route path="/signup" element={<Landing page="signup" />} />
                <Route path="/reset-password" element={<Landing page="reset" />} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            </Routes>
        </AuthProvider>
    )
}