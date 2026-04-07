import { useState, useEffect, useRef } from 'react'
import {
    Bot, User, Send, FileText,
    ChevronDown, ChevronUp, AlertTriangle, X
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button, config, cn, supabase } from './App'
import type { Source } from './App'

// ============================================
// CONSTANTS
// ============================================
export const MAX_DEMO_QUESTIONS = 5
export const DEMO_STORAGE_KEY = 'demo_messages'
export const DEMO_DISCLAIMER_KEY = 'demo_disclaimer_accepted'

// ============================================
// TYPES
// ============================================
export interface DemoMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources: Source[] | null
    created_at: string
}

// ============================================
// SAVE DEMO MESSAGES AFTER SIGNUP
// ============================================
export async function saveDemoMessagesToDB(userId: string, accessToken: string) {
    const saved = sessionStorage.getItem(DEMO_STORAGE_KEY)
    if (!saved) return

    try {
        const demoMessages: DemoMessage[] = JSON.parse(saved)
        if (demoMessages.length === 0) return

        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
        )

        // Create a conversation for the demo messages
        const { data: conversation } = await client
            .from('conversations')
            .insert({
                user_id: userId,
                title: 'My Demo Conversation',
            })
            .select()
            .single()

        if (!conversation) return

        // Insert all demo messages
        const messagesToInsert = demoMessages.map(msg => ({
            conversation_id: conversation.id,
            role: msg.role,
            content: msg.content,
            sources: msg.sources ? JSON.stringify(msg.sources) : null,
            created_at: msg.created_at,
        }))

        await client.from('messages').insert(messagesToInsert)

        // Clear demo storage after saving
        sessionStorage.removeItem(DEMO_STORAGE_KEY)
        sessionStorage.removeItem(DEMO_DISCLAIMER_KEY)

        console.log('✅ Demo messages saved to database')
    } catch (err) {
        console.error('Failed to save demo messages:', err)
        // Don't block navigation if this fails
    }
}

// ============================================
// DEMO SOURCE CARD
// ============================================
function DemoSourceCard({ source }: { source: Source }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#2a2a2a] transition-colors"
            >
                <div className="flex items-center space-x-2 text-left min-w-0">
                    <FileText size={14} className="text-[#4ade80] flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="text-sm text-[#e5e5e5] font-medium">
                            Article {source.article_number}
                        </span>
                        <span className="text-xs text-[#a3a3a3] ml-2 hidden sm:inline">
                            Chapter {source.chapter_number}: {source.chapter_title}
                        </span>
                    </div>
                </div>
                {expanded
                    ? <ChevronUp size={16} className="text-[#a3a3a3] flex-shrink-0" />
                    : <ChevronDown size={16} className="text-[#a3a3a3] flex-shrink-0" />
                }
            </button>
            {expanded && (
                <div className="px-3 py-2 border-t border-[#333] bg-[#0f0f0f]">
                    <p className="text-xs text-[#737373] mb-1 sm:hidden">
                        Chapter {source.chapter_number}: {source.chapter_title}
                    </p>
                    <p className="text-sm text-[#a3a3a3] whitespace-pre-wrap leading-relaxed">
                        {source.article_text}
                    </p>
                    <div className="mt-2">
                        <span className="text-xs text-[#4ade80]">
                            {Math.round(source.similarity * 100)}% match
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================
// DEMO MESSAGE BUBBLE
// ============================================
function DemoMessageBubble({ message }: { message: DemoMessage }) {
    const isUser = message.role === 'user'

    return (
        <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
            <div className={cn(
                'flex max-w-[95%] sm:max-w-[85%]',
                isUser ? 'flex-row-reverse' : 'flex-row'
            )}>
                {/* Avatar */}
                <div className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                    isUser ? 'bg-primary ml-2' : 'bg-[#2a2a2a] mr-2'
                )}>
                    {isUser
                        ? <User size={14} className="text-white" />
                        : <Bot size={14} className="text-[#4ade80]" />
                    }
                </div>

                {/* Content */}
                <div className="flex flex-col min-w-0 flex-1">
                    <div className={cn(
                        'rounded-2xl px-3 py-2',
                        isUser
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-[#0d0d0d] text-[#e5e5e5] rounded-tl-sm border border-[#1a1a1a]'
                    )}>
                        {isUser ? (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content}
                            </p>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none
                                prose-p:text-[#d4d4d4] prose-p:text-[14px] prose-p:leading-[1.75] prose-p:my-2
                                prose-headings:text-[#4ade80] prose-headings:font-semibold
                                prose-h1:text-lg prose-h1:mt-4 prose-h1:mb-2
                                prose-h2:text-base prose-h2:mt-3 prose-h2:mb-2 prose-h2:text-[#f5f5f5]
                                prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1 prose-h3:text-[#e5e5e5]
                                prose-ul:my-2 prose-ul:pl-4
                                prose-ol:my-2 prose-ol:pl-4
                                prose-li:text-[#d4d4d4] prose-li:my-1 prose-li:text-[14px]
                                prose-li:marker:text-[#4ade80]
                                prose-strong:text-[#4ade80] prose-strong:font-semibold
                                prose-blockquote:border-l-2 prose-blockquote:border-[#4ade80]
                                prose-blockquote:bg-[#1a1a1a] prose-blockquote:pl-3 prose-blockquote:py-1
                                prose-blockquote:my-2 prose-blockquote:rounded-r-lg
                                prose-blockquote:text-[#c4c4c4] prose-blockquote:not-italic
                                prose-blockquote:text-[13px]
                            ">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {/* Sources */}
                    {!isUser && message.sources && message.sources.filter(s => s.similarity > 0.3).length > 0 && (
                        <div className="mt-2 space-y-1">
                            <p className="text-xs text-[#737373] font-medium">
                                📚 Constitutional References:
                            </p>
                            {message.sources
                                .filter(s => s.similarity > 0.3)
                                .map((source, index) => (
                                    <DemoSourceCard key={index} source={source} />
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================
// DEMO DISCLAIMER
// ============================================
function DemoDisclaimer({ onAccept }: { onAccept: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-3">
                Before You Start
            </h3>
            <div className="text-[#a3a3a3] text-sm space-y-2 text-left mb-6 max-w-sm">
                <p>
                    <strong className="text-[#e5e5e5]">{config.name} Legal AI</strong> is an
                    AI-powered assistant for understanding {config.constitution}.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>For <strong className="text-[#e5e5e5]">educational purposes only</strong></li>
                  <li>Does <strong className="text-[#e5e5e5]">not constitute legal advice</strong></li>
                    <li>You get <strong className="text-[#4ade80]">5 free questions</strong> to try</li>
                    <li>Sign up free to get unlimited access</li>
                </ul>
            </div>
            <Button onClick={onAccept} className="w-full max-w-xs">
                I Understand, Let's Go
            </Button>
        </div>
    )
}

// ============================================
// DEMO SIGNUP WALL
// ============================================
function DemoSignupWall({ onClose }: { onClose: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#4ade80]/10 flex items-center justify-center mb-4">
                <Bot size={28} className="text-[#4ade80]" />
            </div>
            <h3 className="text-xl font-semibold text-[#e5e5e5] mb-2">
                You've Used Your 5 Free Questions!
            </h3>
            <p className="text-[#a3a3a3] text-sm mb-6 max-w-sm">
                Create a free account to get unlimited access and keep your conversation history.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                    onClick={() => {
                        onClose()
                        window.location.href = '/signup'
                    }}
                    className="w-full"
                >
                    Create Free Account
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        onClose()
                        window.location.href = '/login'
                    }}
                    className="w-full"
                >
                    Sign In
                </Button>
            </div>
            <p className="text-xs text-[#737373] mt-4">
                No credit card required
            </p>
        </div>
    )
}

// ============================================
// DEMO CHAT MODAL - MAIN EXPORT
// ============================================
export default function DemoChatModal({ isOpen, onClose }: {
    isOpen: boolean
    onClose: () => void
}) {
    const [step, setStep] = useState<'disclaimer' | 'chat' | 'signup-wall'>('disclaimer')
    const [messages, setMessages] = useState<DemoMessage[]>([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [questionCount, setQuestionCount] = useState(0)
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Load saved demo messages from sessionStorage on open
    useEffect(() => {
        if (isOpen) {
            const saved = sessionStorage.getItem(DEMO_STORAGE_KEY)
            const disclaimerAccepted = sessionStorage.getItem(DEMO_DISCLAIMER_KEY)

            if (saved) {
                const parsed: DemoMessage[] = JSON.parse(saved)
                setMessages(parsed)
                const userMessages = parsed.filter(m => m.role === 'user').length
                setQuestionCount(userMessages)
                setStep(
                    disclaimerAccepted === 'true'
                        ? userMessages >= MAX_DEMO_QUESTIONS
                            ? 'signup-wall'
                            : 'chat'
                        : 'disclaimer'
                )
            } else {
                setStep(disclaimerAccepted === 'true' ? 'chat' : 'disclaimer')
            }
        }
    }, [isOpen])

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(messages))
        }
    }, [messages])

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, sending])

    const handleDisclaimerAccept = () => {
        sessionStorage.setItem(DEMO_DISCLAIMER_KEY, 'true')
        setStep('chat')
    }

    const handleSend = async () => {
        if (!input.trim() || sending) return

        if (questionCount >= MAX_DEMO_QUESTIONS) {
            setStep('signup-wall')
            return
        }

        const userMessage: DemoMessage = {
            id: `demo-user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            sources: null,
            created_at: new Date().toISOString(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setSending(true)

        const newCount = questionCount + 1
        setQuestionCount(newCount)

        if (textareaRef.current) textareaRef.current.style.height = 'auto'

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }))

            const { data, error } = await supabase.functions.invoke('demo', {
                body: {
                    message: userMessage.content,
                    history,
                },
            })

            if (error) throw error

            const assistantMessage: DemoMessage = {
                id: `demo-assistant-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                sources: data.sources || null,
                created_at: new Date().toISOString(),
            }

            setMessages(prev => [...prev, assistantMessage])

            // Show signup wall after last question is answered
            if (newCount >= MAX_DEMO_QUESTIONS) {
                setTimeout(() => setStep('signup-wall'), 1500)
            }
        } catch (err) {
            console.error('Demo error:', err)
            setMessages(prev => [
                ...prev,
                {
                    id: `demo-error-${Date.now()}`,
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again.',
                    sources: null,
                    created_at: new Date().toISOString(),
                }
            ])
            // Revert count on error
            setQuestionCount(prev => prev - 1)
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleInput = () => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
        }
    }

    if (!isOpen) return null

    const questionsLeft = MAX_DEMO_QUESTIONS - questionCount

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl h-[85vh] bg-[#0f0f0f] rounded-2xl shadow-2xl border border-[#333] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#1a1a1a] flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <Bot size={20} className="text-[#4ade80]" />
                        <span className="font-semibold text-[#e5e5e5]">
                            {config.name} Legal AI
                        </span>
                        <span className="text-xs text-[#737373]">— Demo</span>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Questions counter */}
                        {step === 'chat' && (
                            <span className={cn(
                                'text-xs px-2 py-1 rounded-full',
                                questionsLeft <= 1
                                    ? 'bg-red-500/10 text-red-400'
                                    : questionsLeft <= 2
                                        ? 'bg-yellow-500/10 text-yellow-400'
                                        : 'bg-[#4ade80]/10 text-[#4ade80]'
                            )}>
                                {questionsLeft} question{questionsLeft !== 1 ? 's' : ''} left
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col">

                    {/* DISCLAIMER STEP */}
                    {step === 'disclaimer' && (
                        <DemoDisclaimer onAccept={handleDisclaimerAccept} />
                    )}

                    {/* SIGNUP WALL STEP */}
                    {step === 'signup-wall' && (
                        <DemoSignupWall onClose={onClose} />
                    )}

                    {/* CHAT STEP */}
                    {step === 'chat' && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                        <Bot size={40} className="text-[#4ade80] mb-3" />
                                        <p className="text-[#e5e5e5] font-medium mb-1">
                                            Ask me anything about {config.constitution}
                                        </p>
                                        <p className="text-xs text-[#737373]">
                                            You have {MAX_DEMO_QUESTIONS} free questions
                                        </p>
                                    </div>
                                )}

                                {messages.map(message => (
                                    <DemoMessageBubble key={message.id} message={message} />
                                ))}

                                {sending && (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                            <Bot size={14} className="text-[#4ade80]" />
                                        </div>
                                        <div className="bg-[#2a2a2a] px-4 py-3 rounded-2xl rounded-tl-sm">
                                            <div className="flex space-x-1">
                                                <span className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce"
                                                    style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce"
                                                    style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce"
                                                    style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="border-t border-[#333] bg-[#1a1a1a] p-3 flex-shrink-0">
                                <div className="flex items-end space-x-2 bg-[#0f0f0f] border border-[#333] rounded-xl p-2">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onInput={handleInput}
                                        placeholder="Ask about the constitution..."
                                        disabled={sending}
                                        rows={1}
                                        className="flex-1 bg-transparent text-[#e5e5e5] placeholder-[#737373] resize-none focus:outline-none py-1.5 px-1 max-h-[120px] text-sm"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || !input.trim()}
                                        className={cn(
                                            'p-2 rounded-lg transition-colors flex-shrink-0',
                                            input.trim() && !sending
                                                ? 'bg-primary text-white hover:bg-secondary'
                                                : 'text-[#737373] cursor-not-allowed'
                                        )}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-[#737373] text-center mt-1.5">
                                    Press Enter to send · Shift+Enter for new line
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}