import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    Menu,
    Plus,
    MessageSquare,
    Trash2,
    LogOut,
    Send,
    Paperclip,
    User,
    Bot,
    HelpCircle,
    AlertTriangle,
    FileText,
    ChevronDown,
    ChevronUp,
    X,
    Upload,
    Clock
} from 'lucide-react'
import { useAuth, useSessionTimeout, useConversations, useChat, Button, Modal, LoadingSpinner, config, cn, formatTime, truncate, generateTitle, supabase } from './App'
import type { Message, Source } from './App'

// ============================================
// LEGAL TEXT FORMATTER - NEW!
// ============================================
function formatLegalContent(content: string): string {
    let formatted = content;

    // Avoid double-processing already bolded text
    // First, protect existing bold markers
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const protectedBolds: string[] = [];
    formatted = formatted.replace(boldPattern, (match) => {
        protectedBolds.push(match);
        return `__PROTECTED_${protectedBolds.length - 1}__`;
    });

    // Bold Article references: "Article 1", "Article 21(1)(a)", "Articles 12 and 13"
    formatted = formatted.replace(
        /\b(Articles?\s+\d+(?:\s*\(\d+\))*(?:\s*\([a-z]\))*(?:\s*(?:and|,)\s*\d+(?:\s*\(\d+\))*(?:\s*\([a-z]\))*)*)/gi,
        '**$1**'
    );

    // Bold Chapter references
    formatted = formatted.replace(
        /\b(Chapters?\s+\d+(?:\s*(?:and|,)\s*\d+)*)/gi,
        '**$1**'
    );

    // Bold Section references
    formatted = formatted.replace(
        /\b(Sections?\s+\d+(?:\s*\(\d+\))*(?:\s*\([a-z]\))*)/gi,
        '**$1**'
    );

    // Bold Clause references
    formatted = formatted.replace(
        /\b(Clauses?\s+\d+(?:\s*\(\d+\))*(?:\s*\([a-z]\))*)/gi,
        '**$1**'
    );

    // Bold Part references
    formatted = formatted.replace(
        /\b(Parts?\s+[IVXLCDM]+|\bParts?\s+\d+)/gi,
        '**$1**'
    );

    // Bold "The Constitution" references
    formatted = formatted.replace(
        /\b(the\s+1992\s+Constitution|the\s+Constitution\s+of\s+Ghana|Ghana'?s?\s+Constitution)/gi,
        '**$1**'
    );

    // Restore protected bolds
    protectedBolds.forEach((bold, index) => {
        formatted = formatted.replace(`__PROTECTED_${index}__`, bold);
    });

    return formatted;
}

// ============================================
// SOURCE CARD
// ============================================
function SourceCard({ source }: { source: Source }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden">
            <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#2a2a2a] transition-colors">
                <div className="flex items-center space-x-2 text-left min-w-0">
                    <FileText size={14} className="text-[#4ade80] flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="text-sm text-[#e5e5e5] font-medium">Article {source.article_number}</span>
                        <span className="text-xs text-[#a3a3a3] ml-2 hidden sm:inline">Chapter {source.chapter_number}: {source.chapter_title}</span>
                    </div>
                </div>
                {expanded ? <ChevronUp size={16} className="text-[#a3a3a3] flex-shrink-0" /> : <ChevronDown size={16} className="text-[#a3a3a3] flex-shrink-0" />}
            </button>
            {expanded && (
                <div className="px-3 py-2 border-t border-[#333] bg-[#0f0f0f]">
                    <p className="text-xs text-[#737373] mb-1 sm:hidden">Chapter {source.chapter_number}: {source.chapter_title}</p>
                    <p className="text-sm text-[#a3a3a3] whitespace-pre-wrap leading-relaxed">{source.article_text}</p>
                    <div className="mt-2">
                        <span className="text-xs text-[#4ade80]">{Math.round(source.similarity * 100)}% match</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================
// MESSAGE BUBBLE - UPDATED FOR WIDER MOBILE
// ============================================
function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user'

    // Format AI content with legal term highlighting
    const formattedContent = isUser ? message.content : formatLegalContent(message.content);

    return (
        <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
            {/* CHANGED: Wider on mobile - 95% on mobile, 90% on sm, 80% on md+ */}
            <div className={cn(
                'flex max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[75%]',
                isUser ? 'flex-row-reverse' : 'flex-row'
            )}>
                {/* Avatar - smaller on mobile */}
                <div className={cn(
                    'flex-shrink-0 rounded-full flex items-center justify-center',
                    'w-6 h-6 sm:w-8 sm:h-8', // Smaller on mobile
                    isUser ? 'bg-primary ml-2 sm:ml-3' : 'bg-[#2a2a2a] mr-2 sm:mr-3'
                )}>
                    {isUser ?
                        <User size={14} className="text-white sm:w-4 sm:h-4" /> :
                        <Bot size={14} className="text-[#4ade80] sm:w-4 sm:h-4" />
                    }
                </div>

                {/* Content */}
                <div className="flex flex-col min-w-0 flex-1">
                    {/* CHANGED: Less padding on mobile */}
                    <div className={cn(
                        'rounded-2xl',
                        'px-3 py-2 sm:px-4 sm:py-3', // Reduced padding on mobile
                        isUser
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-[#0d0d0d] text-[#e5e5e5] rounded-tl-sm border border-[#1a1a1a]'
                    )}>
                        {isUser ? (
                            <p className="whitespace-pre-wrap text-[14px] sm:text-[15px] leading-relaxed">{message.content}</p>
                        ) : (
                            <div className="prose prose-invert prose-sm sm:prose-base max-w-none
                                prose-p:text-[#d4d4d4] prose-p:text-[14px] sm:prose-p:text-[15px] prose-p:leading-[1.75] prose-p:my-2 sm:prose-p:my-3
                                prose-headings:text-[#4ade80] prose-headings:font-semibold prose-headings:border-b prose-headings:border-[#333] prose-headings:pb-1
                                prose-h1:text-lg sm:prose-h1:text-xl prose-h1:mt-4 sm:prose-h1:mt-6 prose-h1:mb-2 sm:prose-h1:mb-3 prose-h1:first:mt-0
                                prose-h2:text-base sm:prose-h2:text-lg prose-h2:mt-4 sm:prose-h2:mt-5 prose-h2:mb-2 prose-h2:first:mt-0 prose-h2:text-[#f5f5f5]
                                prose-h3:text-sm sm:prose-h3:text-base prose-h3:mt-3 sm:prose-h3:mt-4 prose-h3:mb-2 prose-h3:first:mt-0 prose-h3:text-[#e5e5e5] prose-h3:border-none
                                prose-ul:my-2 sm:prose-ul:my-3 prose-ul:pl-4 sm:prose-ul:pl-5
                                prose-ol:my-2 sm:prose-ol:my-3 prose-ol:pl-4 sm:prose-ol:pl-5
                                prose-li:text-[#d4d4d4] prose-li:my-1 sm:prose-li:my-1.5 prose-li:text-[14px] sm:prose-li:text-[15px] prose-li:leading-[1.7]
                                prose-li:marker:text-[#4ade80]
                                prose-strong:text-[#f5f5f5] prose-strong:font-semibold
                                prose-em:text-[#a3a3a3] prose-em:italic
                                prose-code:text-[#f87171] prose-code:bg-[#262626] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[12px] sm:prose-code:text-[13px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
                                prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#333] prose-pre:rounded-lg prose-pre:p-3 sm:prose-pre:p-4 prose-pre:my-3 sm:prose-pre:my-4 prose-pre:overflow-x-auto prose-pre:text-[13px]
                                prose-blockquote:border-l-3 prose-blockquote:border-[#4ade80] prose-blockquote:bg-[#1a1a1a] prose-blockquote:pl-3 sm:prose-blockquote:pl-4 prose-blockquote:pr-3 prose-blockquote:py-2 prose-blockquote:my-3 sm:prose-blockquote:my-4 prose-blockquote:rounded-r-lg prose-blockquote:text-[#c4c4c4] prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-[13px] sm:prose-blockquote:text-[14px]
                                prose-a:text-[#60a5fa] prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[#93c5fd]
                                prose-hr:border-[#333] prose-hr:my-4 sm:prose-hr:my-6
                            ">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Custom link component
                                        a: ({ href, children }) => (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#60a5fa] underline underline-offset-2 hover:text-[#93c5fd] transition-colors"
                                            >
                                                {children}
                                            </a>
                                        ),
                                        // Better blockquote styling
                                        blockquote: ({ children }) => (
                                            <blockquote className="border-l-3 border-[#4ade80] bg-[#1a1a1a]/50 pl-4 pr-3 py-2 my-3 rounded-r-lg text-[#c4c4c4] italic">
                                                {children}
                                            </blockquote>
                                        ),
                                        // Custom strong for legal terms
                                        strong: ({ children }) => (
                                            <strong className="text-[#4ade80] font-semibold">
                                                {children}
                                            </strong>
                                        ),
                                    }}
                                >
                                    {formattedContent}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {/* Sources - UPDATED: Better mobile layout */}
                    {!isUser && (
                        <div className="mt-2">
                            {message.sources && message.sources.filter(s => s.similarity > 0.3).length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-[#737373] font-medium mb-1">📚 Constitutional References:</p>
                                    {message.sources
                                        .filter(s => s.similarity > 0.3)
                                     //   .slice(0, 3) // Limit to 3 on mobile for cleaner look
                                        .map((source, index) => (
                                            <SourceCard key={index} source={source} />
                                        ))}
                                </div>
                            ) : (
                                <p className="text-xs text-[#737373] italic">ℹ️ General response - no specific articles cited</p>
                            )}
                        </div>
                    )}

                    {/* Time */}
                    <span className={cn('text-[10px] sm:text-xs text-[#a3a3a3] mt-1', isUser ? 'text-right' : 'text-left')}>
                        {formatTime(message.created_at)}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ============================================
// MESSAGE LIST - UPDATED: Better mobile padding
// ============================================
function MessageList({ messages, loading, sending }: { messages: Message[]; loading: boolean; sending: boolean }) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, sending])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-4">
                    <Bot size={32} className="text-[#4ade80]" />
                </div>
                <h2 className="text-xl font-semibold text-[#e5e5e5] mb-2">Welcome to {config.name} Legal AI</h2>
                <p className="text-[#a3a3a3] max-w-md">Ask me anything about {config.constitution}. I'll provide answers with specific Article references.
                    <br /> I'm an AI Assistant and can make mistakes. Please consult a licensed professional for legal advice.</p>
            </div>
        )
    }

    return (
        // CHANGED: Less horizontal padding on mobile
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-6">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {sending && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                            <Bot size={14} className="text-[#4ade80]" />
                        </div>
                        <div className="bg-[#2a2a2a] px-4 py-3 rounded-2xl rounded-tl-sm">
                            <div className="flex space-x-1">
                                <span className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    )
}


// ============================================
// CHAT INPUT
// ============================================
function ChatInput({ onSend, onFileUpload, disabled }: { onSend: (message: string) => void; onFileUpload: () => void; disabled: boolean }) {
    const [message, setMessage] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim())
            setMessage('')
            if (textareaRef.current) textareaRef.current.style.height = 'auto'
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleInput = () => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
        }
    }

    return (
        <div className="border-t border-[#333] bg-[#1a1a1a] p-4">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-end space-x-3 bg-[#0f0f0f] border border-[#333] rounded-xl p-2">
                    <button onClick={onFileUpload} disabled={disabled} className="p-2 text-[#a3a3a3] hover:text-[#e5e5e5] transition-colors disabled:opacity-50" title="Upload file">
                        <Paperclip size={20} />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onInput={handleInput}
                        placeholder="Ask about the constitution..."
                        disabled={disabled}
                        rows={1}
                        className="flex-1 bg-transparent text-[#e5e5e5] placeholder-[#a3a3a3] resize-none focus:outline-none py-2 px-1 max-h-[150px]"
                    />

                    <button
                        onClick={handleSend}
                        disabled={disabled || !message.trim()}
                        className={cn('p-2 rounded-lg transition-colors', message.trim() && !disabled ? 'bg-primary text-white hover:bg-secondary' : 'text-[#a3a3a3] cursor-not-allowed')}
                    >
                        <Send size={20} />
                    </button>
                </div>
                <p className="text-xs text-[#a3a3a3] text-center mt-2">Press Enter to send, Shift+Enter for new line</p>
            </div>
        </div>
    )
}

// ============================================
// QUICK QUESTIONS
// ============================================
function QuickQuestions({ onSelect }: { onSelect: (question: string) => void }) {
    return (
        <div className="px-4 py-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center space-x-2 text-[#a3a3a3] mb-4">
                    <HelpCircle size={18} />
                    <span className="text-sm font-medium">Try asking:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {config.quickQuestions.map((question, index) => (
                        <button
                            key={index}
                            onClick={() => onSelect(question)}
                            className="text-left px-4 py-3 rounded-lg border border-[#333] bg-[#1a1a1a] text-[#e5e5e5] hover:bg-[#2a2a2a] hover:border-[#4ade80]/50 transition-colors text-sm"
                        >
                            {question}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ============================================
// DISCLAIMER MODAL
// ============================================
function DisclaimerModal({ isOpen, onAccept }: { isOpen: boolean; onAccept: () => void }) {
    return (
        <Modal isOpen={isOpen} onClose={() => { }}>
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} className="text-yellow-500" />
                </div>
                <h2 className="text-xl font-semibold text-[#e5e5e5] mb-3">Important Disclaimer</h2>
                <div className="text-[#a3a3a3] text-sm space-y-3 text-left mb-6">
                    <p><strong className="text-[#e5e5e5]">{config.name} Legal AI</strong> is an AI-powered assistant designed to help you understand {config.constitution}.</p>
                    <p>Please note:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>This tool provides <strong className="text-[#e5e5e5]">educational information only</strong></li>
                        <li>It does <strong className="text-[#e5e5e5]">not constitute legal advice</strong></li>
                        <li>Always consult a qualified legal professional for legal matters</li>
                        <li>AI responses may sometimes contain errors</li>
                    </ul>
                    <p>By continuing, you acknowledge that you understand these limitations.</p>
                </div>
                <Button onClick={onAccept} className="w-full">I Understand, Continue</Button>
            </div>
        </Modal>
    )
}

// ============================================
// FILE UPLOAD MODAL
// ============================================
function FileUploadModal({ isOpen, onClose, onUpload }: { isOpen: boolean; onClose: () => void; onUpload: (content: string) => void }) {
    const [file, setFile] = useState<File | null>(null)
    const [content, setContent] = useState('')
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.txt') && selectedFile.type !== 'text/plain') {
            setError('Only .txt files are supported')
            return
        }

        if (selectedFile.size > 100 * 1024) {
            setError('File must be smaller than 100KB')
            return
        }

        setError(null)
        setFile(selectedFile)

        try {
            const text = await selectedFile.text()
            setContent(text)
        } catch {
            setError('Failed to read file')
            setFile(null)
        }
    }

    const handleUpload = () => {
        if (content) {
            onUpload(content)
            handleClose()
        }
    }

    const handleClose = () => {
        setFile(null)
        setContent('')
        setError(null)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload Document">
            <div className="space-y-4">
                <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-[#333] rounded-lg p-8 text-center cursor-pointer hover:border-[#4ade80]/50 transition-colors"
                >
                    {file ? (
                        <div className="flex items-center justify-center space-x-3">
                            <FileText size={24} className="text-[#4ade80]" />
                            <span className="text-[#e5e5e5]">{file.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setFile(null); setContent('') }} className="p-1 hover:bg-[#2a2a2a] rounded">
                                <X size={16} className="text-[#a3a3a3]" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Upload size={32} className="text-[#a3a3a3] mx-auto mb-2" />
                            <p className="text-[#e5e5e5] mb-1">Click to upload a text file</p>
                            <p className="text-xs text-[#a3a3a3]">.txt files only, max 100KB</p>
                        </>
                    )}
                </div>

                <input ref={inputRef} type="file" accept=".txt,text/plain" onChange={handleFileSelect} className="hidden" />

                {error && <p className="text-sm text-[#ce1126]">{error}</p>}

                {content && (
                    <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-xs text-[#a3a3a3] mb-1">Preview:</p>
                        <p className="text-sm text-[#e5e5e5] whitespace-pre-wrap">{content.slice(0, 500)}{content.length > 500 && '...'}</p>
                    </div>
                )}

                <div className="flex space-x-3">
                    <Button variant="ghost" onClick={handleClose} className="flex-1">Cancel</Button>
                    <Button onClick={handleUpload} disabled={!content} className="flex-1">Analyze Document</Button>
                </div>
            </div>
        </Modal>
    )
}

// ============================================
// FEEDBACK MODAL
// ============================================
function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user } = useAuth()
    const [message, setMessage] = useState('')
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'rate-limited'>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!message.trim() || !user) return
        if (message.length > 2000) {
            alert('Message too long (max 2000 characters)')
            return
        }

        setStatus('sending')

        try {
            const { data: canSubmit } = await supabase
                .rpc('check_feedback_rate_limit', { check_user_id: user.id })

            if (!canSubmit) {
                setStatus('rate-limited')
                return
            }

            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: user.id,
                    email: user.email || '',
                    message: message.trim()
                })

            if (error) throw error

            setStatus('success')
            setMessage('')

            setTimeout(() => {
                setStatus('idle')
                onClose()
            }, 2000)
        } catch (err) {
            console.error('Feedback error:', err)
            setStatus('error')
        }
    }

    const handleClose = () => {
        if (status !== 'sending') {
            setStatus('idle')
            setMessage('')
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Send Feedback">
            {status === 'success' ? (
                <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#e5e5e5] mb-2">Thank You!</h3>
                    <p className="text-[#a3a3a3]">Your feedback has been submitted successfully.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-[#a3a3a3]">
                        Help us improve {config.name} Legal AI! Share your thoughts, report issues, or suggest features.
                    </p>

                    <div>
                        <textarea
                            placeholder="Your feedback..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={5}
                            maxLength={2000}
                            disabled={status === 'sending'}
                            className="w-full px-4 py-3 rounded-lg border border-[#333] bg-[#0f0f0f] text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none disabled:opacity-50"
                        />
                        <p className="text-xs text-[#737373] mt-1 text-right">{message.length}/2000</p>
                    </div>

                    {status === 'error' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
                        </div>
                    )}

                    {status === 'rate-limited' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <p className="text-yellow-400 text-sm text-center">Too many submissions. Please try again later.</p>
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <Button type="button" variant="ghost" onClick={handleClose} className="flex-1" disabled={status === 'sending'}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={status === 'sending' || !message.trim()} isLoading={status === 'sending'}>
                            Send Feedback
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    )
}

// ============================================
// MAIN CHAT COMPONENT
// ============================================
export default function Chat() {
    const navigate = useNavigate()
    const { signOut } = useAuth()
    const { conversations, createConversation, deleteConversation } = useConversations()

    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [showDisclaimer, setShowDisclaimer] = useState(true)
    const [showFileUpload, setShowFileUpload] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed on mobile

    const { messages, loading: messagesLoading, sending, fetchMessages, sendMessage, clearMessages } = useChat(currentConversationId)
    const { showWarning, extendSession } = useSessionTimeout()

    // Check screen size and set sidebar default
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Check disclaimer
    useEffect(() => {
        const accepted = localStorage.getItem('disclaimer_accepted')
        if (accepted === 'true') setShowDisclaimer(false)
    }, [])

    // Fetch messages when conversation changes
    useEffect(() => {
        if (currentConversationId) fetchMessages()
    }, [currentConversationId, fetchMessages])

    // Handle send
    const handleSend = useCallback(async (content: string) => {
        let convId = currentConversationId

        if (!convId) {
            const title = generateTitle(content)
            const newConv = await createConversation(title)
            if (newConv) {
                convId = newConv.id
                setCurrentConversationId(convId)
            }
        }

        if (convId) await sendMessage(content, convId)
    }, [currentConversationId, createConversation, sendMessage])

    // Handle new chat
    const handleNewChat = () => {
        setCurrentConversationId(null)
        clearMessages()
        if (window.innerWidth < 768) setSidebarOpen(false)
    }

    // Handle select conversation
    const handleSelectConversation = (id: string) => {
        setCurrentConversationId(id)
        if (window.innerWidth < 768) setSidebarOpen(false)
    }

    // Handle logout
    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    // Handle disclaimer accept
    const handleDisclaimerAccept = () => {
        localStorage.setItem('disclaimer_accepted', 'true')
        setShowDisclaimer(false)
    }

    // Handle file upload
    const handleFileUpload = (content: string) => {
        handleSend(`Please analyze the following document and explain any constitutional implications:\n\n${content}`)
    }

    // Handle delete
    const handleDeleteConversation = async (id: string) => {
        await deleteConversation(id)
        if (currentConversationId === id) {
            setCurrentConversationId(null)
            clearMessages()
        }
    }

    // Toggle sidebar
    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev)
    }

    return (
        <div className="h-screen flex bg-[#0f0f0f]">
            {/* Modals */}
            <DisclaimerModal isOpen={showDisclaimer} onAccept={handleDisclaimerAccept} />
            <FileUploadModal isOpen={showFileUpload} onClose={() => setShowFileUpload(false)} onUpload={handleFileUpload} />
            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

            {/* Session Warning Modal */}
            {showWarning && (
                <Modal isOpen={showWarning} onClose={extendSession} title="Hope you're still there">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} className="text-yellow-500" />
                        </div>
                        <p className="text-[#a3a3a3] mb-6">
                            You will be logged-out after 5 minutes due to inactivity.
                        </p>
                        <Button onClick={extendSession} className="w-full">
                            Stay Logged In
                        </Button>
                    </div>
                </Modal>
            )}

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'h-full bg-[#1a1a1a] border-r border-[#333] flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
                    'fixed md:static z-40',
                    sidebarOpen 
                        ? 'w-72' 
                        : 'w-0 md:w-0'
                )}
            >
                <div className="w-72 h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-[#333] flex items-center justify-between flex-shrink-0">
                        <h1 className="text-lg font-bold" style={{ color: config.colors.accent }}>
                            {config.name} Legal AI
                        </h1>
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* New chat button */}
                    <div className="p-3 flex-shrink-0">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors"
                        >
                            <Plus size={18} />
                            <span>New Chat</span>
                        </button>
                    </div>

                    {/* Conversations list */}
                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                        {conversations.length === 0 ? (
                            <p className="text-[#a3a3a3] text-sm text-center py-8">No conversations yet</p>
                        ) : (
                            <div className="space-y-1">
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className={cn(
                                            'group flex items-center rounded-lg cursor-pointer transition-colors',
                                            currentConversationId === conv.id
                                                ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                                                : 'text-[#a3a3a3] hover:bg-[#2a2a2a] hover:text-[#e5e5e5]'
                                        )}
                                    >
                                        <button
                                            onClick={() => handleSelectConversation(conv.id)}
                                            className="flex-1 flex items-center space-x-3 px-3 py-2.5 min-w-0"
                                        >
                                            <MessageSquare size={16} className="flex-shrink-0" />
                                            <span className="truncate text-sm">{truncate(conv.title, 25)}</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id) }}
                                            className="p-2 opacity-0 group-hover:opacity-100 text-[#a3a3a3] hover:text-[#ce1126] transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom buttons */}
                    <div className="p-3 border-t border-[#333] space-y-2 flex-shrink-0">
                        <button
                            onClick={() => setShowFeedback(true)}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-[#a3a3a3] hover:bg-[#2a2a2a] hover:text-[#4ade80] transition-colors"
                        >
                            <MessageSquare size={18} />
                            <span>Send Feedback</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-[#a3a3a3] hover:bg-[#2a2a2a] hover:text-[#ce1126] transition-colors"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#0f0f0f] flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <span className="font-bold" style={{ color: config.colors.accent }}>
                            {config.name} Legal AI
                        </span>
                    </div>

                    <button
                        onClick={handleNewChat}
                        className="p-2 text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        title="New chat"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Messages or Welcome + Quick Questions */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {messages.length === 0 && !messagesLoading ? (
                        <div className="flex-1 flex flex-col overflow-y-auto">
                            {/* Welcome Section */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
                                <div className="w-16 h-16 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-4">
                                    <Bot size={32} className="text-[#4ade80]" />
                                </div>
                                <h2 className="text-xl font-semibold text-[#e5e5e5] mb-2">Welcome to {config.name} Legal AI</h2>
                                <p className="text-[#a3a3a3] max-w-md mb-6">Ask me anything about {config.constitution}. <br /> I'll provide answers with specific Article references. 
                                <br /> I'm an AI Assistant and I can make mistakes. Please consult a licensed professional for legal advice.
                                </p>
                            </div>

                            {/* Quick Questions */}
                            <QuickQuestions onSelect={handleSend} />
                        </div>
                    ) : (
                        <MessageList messages={messages} loading={messagesLoading} sending={sending} />
                    )}
                </div>

                {/* Input */}
                <ChatInput onSend={handleSend} onFileUpload={() => setShowFileUpload(true)} disabled={sending} />
            </div>
        </div>
    )
}