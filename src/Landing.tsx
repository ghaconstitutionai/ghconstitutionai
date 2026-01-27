import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ArrowRight, Scale, MessageSquare, Search, BookOpen, Clock, Shield, Smartphone, Zap } from 'lucide-react'
import { useAuth, Button, Input, LoadingSpinner, config, cn } from './App'


// ============================================
// NAVBAR
// ============================================
function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold" style={{ color: config.colors.primary }}>
                            Alora Legal AI
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-4">
                        <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2">Sign in</Link>
                        <Link to="/signup"><Button>Get Started</Button></Link>
                    </div>

                    <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            <div className={cn('md:hidden border-t border-gray-100 bg-white', isOpen ? 'block' : 'hidden')}>
                <div className="px-4 py-4 space-y-3">
                    <Link to="/login" className="block text-gray-600 hover:text-gray-900 py-2" onClick={() => setIsOpen(false)}>Sign in</Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)}><Button className="w-full">Get Started</Button></Link>
                </div>
            </div>
        </nav>
    )
}

// ============================================
// HERO
// ============================================
function Hero() {
    return (
        <section className="relative min-h-[80vh] flex items-center justify-center text-white" style={{ background: config.gradient }}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                    <Scale size={18} />
                    <span className="text-sm font-medium">Powered by AI</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                    Understand {config.constitution}
                    <span className="block mt-2">in Seconds</span>
                </h1>

                <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8">
                    Ask questions in plain English and get accurate answers with direct references to specific Articles and Chapters. No legal jargon required.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/signup">
                        <Button size="lg" className="bg-yellow text-primary hover:bg-gray-100 w-full sm:w-auto">
                            Start for Free <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </Link>
                    <Link to="/login">
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                            <MessageSquare size={20} className="mr-2" /> Sign In
                        </Button>
                    </Link>
                </div>

                <p className="mt-8 text-sm text-white/70">
                    ✓ Free to use &nbsp; ✓ No credit card required &nbsp; ✓ Instant answers
                </p>
            </div>
        </section>
    )
}

// ============================================
// FEATURES
// ============================================
const features = [
    { icon: Search, title: 'Smart Search', description: 'Ask questions in plain language. Our AI understands context and finds the most relevant constitutional provisions.' },
    { icon: BookOpen, title: 'Direct Citations', description: 'Every answer includes specific Article and Chapter references so you can verify the information yourself.' },
    { icon: Clock, title: 'Instant Answers', description: 'No more scrolling through hundreds of pages. Get accurate answers in seconds, not hours.' },
    { icon: Shield, title: 'Reliable Sources', description: 'Built on the official text of the constitution. Our AI only references verified legal content.' },
    { icon: Smartphone, title: 'Works Anywhere', description: 'Access from your phone, tablet, or computer. Research constitutional law on the go.' },
    { icon: Zap, title: 'Always Learning', description: 'Our AI continuously improves to provide better, more accurate responses over time.' },
]

function Features() {
    return (
        <section id="features" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: config.colors.primary }}>
                        Everything You Need
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Powerful features designed to make constitutional research simple and accessible for everyone.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${config.colors.primary}15` }}>
                                <feature.icon size={24} style={{ color: config.colors.primary }} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ============================================
// CTA
// ============================================
function CTA() {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: config.colors.primary }}>
                    Ready to Get Started?
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    Join thousands of citizens, students, and legal professionals who use {config.name} Legal AI to understand their constitutional rights.
                </p>
                <Link to="/signup">
                    <Button size="lg">Create Free Account <ArrowRight size={20} className="ml-2" /></Button>
                </Link>
                <p className="mt-4 text-sm text-gray-500">No credit card required. Start asking questions immediately.</p>
            </div>
        </section>
    )
}

// ============================================
// FOOTER
// ============================================
function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-gray-900 text-gray-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4" style={{ color: config.colors.accent }}>{config.name} Legal AI</h3>
                        <p className="text-sm">AI-powered assistant for understanding {config.constitution}. Built to make legal knowledge accessible to everyone.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-medium mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-medium mb-4">Contact</h4>
                        <p className="text-sm">Have questions or feedback?<br /><a href="mailto:hello@ghanalegal.ai" className="hover:text-white transition-colors">hello@ghanalegal.ai</a></p>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
                    <p>© {currentYear} {config.name} Legal AI. Created by Joel.</p>
                    <p className="mt-1 text-gray-500">This is an AI assistant and does not constitute legal advice.</p>
                </div>
            </div>
        </footer>
    )
}

// ============================================
// AUTH FORM
// ============================================
function AuthForm({ type }: { type: 'login' | 'signup' | 'reset' }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [rememberMe, setRememberMe] = useState(true)

    const navigate = useNavigate()
    const location = useLocation()
    const { signIn, signUp, resetPassword } = useAuth()

    // Check for timeout message from soft logout
    const timeoutMessage = location.state?.message

    // Clear the message from history state after displaying
    useEffect(() => {
        if (timeoutMessage) {
            // Clear the state so message doesn't show again on refresh
            window.history.replaceState({}, document.title)
        }
    }, [timeoutMessage])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (type === 'signup' && password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (type !== 'reset' && password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            if (type === 'login') {
                const { error } = await signIn(email, password)
                if (error) throw error

                if (!rememberMe) {
                    sessionStorage.setItem('temp_session', 'true')
                } else {
                    sessionStorage.removeItem('temp_session')
                }

                navigate('/chat')
            } else if (type === 'signup') {
                const { data, error } = await signUp(email, password)
                if (error) throw error
                if (data.user && !data.session) {
                    setSuccess('Check your email to confirm your account!')
                } else {
                    navigate('/chat')
                }
            } else {
                const { error } = await resetPassword(email)
                if (error) throw error
                setSuccess('Check your email for the reset link!')
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const titles = { login: 'Welcome back', signup: 'Create your account', reset: 'Reset your password' }
    const buttonText = { login: 'Sign in', signup: 'Create account', reset: 'Send reset link' }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <Link to="/">
                        <h1 className="text-3xl font-bold" style={{ color: config.colors.primary }}>{config.name} Legal AI</h1>
                    </Link>
                    <h2 className="mt-4 text-xl text-gray-900">{titles[type]}</h2>
                </div>

                <div className="mt-8 bg-white py-8 px-6 shadow-lg rounded-xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Timeout Message (from soft logout) */}
                        {timeoutMessage && type === 'login' && (
                            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                <p className="text-sm text-yellow-700">{timeoutMessage}</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-sm text-green-600">{success}</p>
                            </div>
                        )}

                        <Input
                            type="email"
                            label="Email address"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        {type !== 'reset' && (
                            <Input
                                type="password"
                                label="Password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        )}

                        {type === 'signup' && (
                            <Input
                                type="password"
                                label="Confirm password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        )}

                        {/* Remember Me & Forgot Password - Only show on login */}
                        {type === 'login' && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                        Remember me
                                    </span>
                                </label>
                                <Link
                                    to="/reset-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <Button type="submit" className="w-full" isLoading={loading}>
                            {buttonText[type]}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        {type === 'login' && (
                            <p>Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link></p>
                        )}
                        {type === 'signup' && (
                            <p>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
                        )}
                        {type === 'reset' && (
                            <p>Remember your password? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================
// HOME PAGE
// ============================================
function HomePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
                <Hero />
                <Features />
                <CTA />
            </main>
            <Footer />
        </div>
    )
}

    // ============================================
    // MAIN EXPORT
    // ============================================
export default function Landing({ page }: { page: 'home' | 'login' | 'signup' | 'reset' }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, loading } = useAuth()

    // Check if this was a soft logout (session still valid)
    const isSoftLogout = location.state?.softLogout === true

    // Redirect if already logged in (but not if soft logout)
    useEffect(() => {
        if (!loading && user && page !== 'home' && !isSoftLogout) {
            navigate('/chat', { replace: true })
        }
    }, [user, loading, navigate, page, isSoftLogout])

    // Show loading while checking auth (except for home page)
    if (loading && page !== 'home') {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (page === 'home') return <HomePage />
    if (page === 'login') return <AuthForm type="login" />
    if (page === 'signup') return <AuthForm type="signup" />
    if (page === 'reset') return <AuthForm type="reset" />
    return null
}     