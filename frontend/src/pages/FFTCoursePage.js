import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Send, Terminal, BookOpen, Zap } from 'lucide-react';

const FFTCoursePage = () => {
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [terminalOutput, setTerminalOutput] = useState([
        '> Initializing FFT environment...',
        '> Loading model weights...',
        '> Connection to emergent established.'
    ]);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { type: 'bot', text: 'System ready. Do you have questions regarding the FFT pipeline or emergent integration?' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [openFaq, setOpenFaq] = useState(null);

    // Countdown - 14 days from now
    useEffect(() => {
        const launchDate = new Date().getTime() + (14 * 24 * 60 * 60 * 1000);
        
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = launchDate - now;

            setCountdown({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const runPreview = () => {
        setTerminalOutput(prev => [
            ...prev,
            '> Compiling target logic...',
            '> Analyzing variables...',
            '> Facts are Foes sync: SUCCESS.'
        ]);
    };

    const handleChatSubmit = (e) => {
        if (e.key === 'Enter' && chatInput.trim()) {
            setChatMessages(prev => [...prev, { type: 'user', text: chatInput }]);
            setChatInput('');
            
            setTimeout(() => {
                setChatMessages(prev => [...prev, { 
                    type: 'bot', 
                    text: 'Logged. This query will be routed to the emergent network for processing.' 
                }]);
            }, 1000);
        }
    };

    const syllabus = [
        { module: "Module 1: The Observer's Framework", week: "Week 1" },
        { module: "Module 2: Fast Fourier Transforms in AI", week: "Week 2" },
        { module: "Module 3: Neural Networking Fundamentals", week: "Week 3" },
        { module: "Module 4: Emergent System Integration", week: "Week 4" }
    ];

    const faqs = [
        {
            question: "How does this link to Facts are Foes?",
            answer: "This course provides the foundational machine learning API keys required to unlock advanced analytics within the Facts are Foes emergent environment."
        },
        {
            question: "Do I need prior coding experience?",
            answer: "We start from first principles. If you can observe patterns, you can learn to code them."
        },
        {
            question: "What tools will I need?",
            answer: "Access to the Facts are Foes platform and a modern web browser. All computational resources are provided through our emergent cloud infrastructure."
        }
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
            {/* Custom styles for this page */}
            <style>{`
                .fft-primary { color: #00ffcc; }
                .fft-accent { color: #ff0055; }
                .fft-bg-card { background-color: #15151e; }
                .fft-text-muted { color: #888899; }
                .fft-border { border-color: #333; }
                .fft-glow:hover { box-shadow: 0 0 20px #00ffcc; }
            `}</style>

            {/* Hero Section */}
            <header 
                className="py-24 px-6 text-center"
                style={{ background: 'linear-gradient(180deg, rgba(0,255,204,0.1) 0%, #0a0a0f 100%)' }}
            >
                <div className="max-w-4xl mx-auto">
                    <h1 
                        className="text-4xl md:text-6xl font-bold mb-6"
                        style={{ color: '#00ffcc' }}
                        data-testid="fft-title"
                    >
                        FFT Personal AI & Machine Learning
                    </h1>
                    <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: '#888899' }}>
                        Master the underlying patterns of intelligence. Build your own predictive models 
                        and bridge the gap to the Facts are Foes ecosystem.
                    </p>
                    
                    <Link 
                        to="/"
                        className="inline-block px-8 py-4 font-bold text-lg transition-all duration-300 fft-glow"
                        style={{ 
                            backgroundColor: '#00ffcc', 
                            color: '#0a0a0f',
                            borderRadius: '5px'
                        }}
                        data-testid="connect-btn"
                    >
                        <Zap className="inline w-5 h-5 mr-2" />
                        Connect to Facts are Foes App
                    </Link>

                    {/* Countdown */}
                    <div className="flex justify-center gap-4 md:gap-6 mt-12" data-testid="countdown">
                        {[
                            { value: countdown.days, label: 'Days' },
                            { value: countdown.hours, label: 'Hours' },
                            { value: countdown.minutes, label: 'Minutes' },
                            { value: countdown.seconds, label: 'Seconds' }
                        ].map((item, i) => (
                            <div 
                                key={i}
                                className="p-4 min-w-[80px] md:min-w-[90px] text-center"
                                style={{ 
                                    backgroundColor: '#15151e', 
                                    borderRadius: '8px',
                                    border: '1px solid #222'
                                }}
                            >
                                <span 
                                    className="block text-2xl md:text-3xl font-bold"
                                    style={{ color: '#ff0055' }}
                                >
                                    {String(item.value).padStart(2, '0')}
                                </span>
                                <span style={{ color: '#888899', fontSize: '0.875rem' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                {/* Grid Section */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {/* Syllabus Card */}
                    <div 
                        className="p-8"
                        style={{ 
                            backgroundColor: '#15151e', 
                            borderRadius: '10px',
                            border: '1px solid #333'
                        }}
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#00ffcc' }}>
                            <BookOpen className="w-6 h-6" />
                            Course Syllabus
                        </h2>
                        <ul className="space-y-0">
                            {syllabus.map((item, i) => (
                                <li 
                                    key={i}
                                    className="py-4 flex justify-between items-center"
                                    style={{ borderBottom: '1px solid #333' }}
                                >
                                    <span className="text-white">{item.module}</span>
                                    <span style={{ color: '#888899' }}>{item.week}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Terminal Preview Card */}
                    <div 
                        className="p-8"
                        style={{ 
                            backgroundColor: '#15151e', 
                            borderRadius: '10px',
                            border: '1px solid #333'
                        }}
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#00ffcc' }}>
                            <Terminal className="w-6 h-6" />
                            Terminal Preview
                        </h2>
                        <div 
                            className="p-4 h-64 overflow-y-auto font-mono text-sm"
                            style={{ 
                                backgroundColor: '#000', 
                                borderRadius: '5px',
                                color: '#0f0'
                            }}
                            data-testid="terminal"
                        >
                            {terminalOutput.map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                        <button 
                            onClick={runPreview}
                            className="mt-4 px-4 py-2 transition-all hover:bg-opacity-10"
                            style={{ 
                                backgroundColor: 'transparent',
                                color: '#00ffcc',
                                border: '1px solid #00ffcc',
                                borderRadius: '4px'
                            }}
                            data-testid="run-test-btn"
                        >
                            Run Test Sequence
                        </button>
                    </div>
                </div>

                {/* FAQ Section */}
                <h2 
                    className="text-3xl font-bold text-center mb-8"
                    style={{ color: '#00ffcc' }}
                >
                    Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <div 
                            key={i}
                            style={{ 
                                backgroundColor: '#15151e', 
                                borderRadius: '5px',
                                overflow: 'hidden'
                            }}
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full p-5 flex justify-between items-center text-left font-bold transition-colors hover:text-[#00ffcc]"
                                style={{ color: openFaq === i ? '#00ffcc' : '#f0f0f5' }}
                            >
                                {faq.question}
                                {openFaq === i ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            <div 
                                className="overflow-hidden transition-all duration-300"
                                style={{ 
                                    maxHeight: openFaq === i ? '200px' : '0',
                                    padding: openFaq === i ? '0 20px 20px' : '0 20px'
                                }}
                            >
                                <p style={{ color: '#888899' }}>{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chatbot Widget */}
            <div 
                className="fixed bottom-5 right-5 w-80 z-50 overflow-hidden"
                style={{ 
                    backgroundColor: '#15151e',
                    border: '1px solid #00ffcc',
                    borderRadius: '10px',
                    boxShadow: '0 0 15px rgba(0, 255, 204, 0.2)'
                }}
                data-testid="chatbot"
            >
                <div 
                    onClick={() => setChatOpen(!chatOpen)}
                    className="p-3 font-bold flex justify-between items-center cursor-pointer"
                    style={{ backgroundColor: '#00ffcc', color: '#0a0a0f' }}
                >
                    Ask the AI Assistant
                    {chatOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </div>
                
                {chatOpen && (
                    <>
                        <div 
                            className="h-64 p-3 overflow-y-auto flex flex-col gap-2"
                            style={{ backgroundColor: '#15151e' }}
                        >
                            {chatMessages.map((msg, i) => (
                                <div 
                                    key={i}
                                    className={`p-2 text-sm rounded ${msg.type === 'user' ? 'self-end' : ''}`}
                                    style={{ 
                                        backgroundColor: msg.type === 'bot' ? '#222' : '#00ffcc',
                                        color: msg.type === 'bot' ? '#f0f0f5' : '#0a0a0f',
                                        maxWidth: '85%'
                                    }}
                                >
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <div className="p-3" style={{ borderTop: '1px solid #333' }}>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={handleChatSubmit}
                                    placeholder="Type a message..."
                                    className="w-full p-2 pr-10"
                                    style={{ 
                                        backgroundColor: '#0a0a0f',
                                        border: '1px solid #444',
                                        color: '#f0f0f5',
                                        borderRadius: '4px'
                                    }}
                                    data-testid="chat-input"
                                />
                                <Send 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer"
                                    style={{ color: '#00ffcc' }}
                                    onClick={() => chatInput && handleChatSubmit({ key: 'Enter' })}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FFTCoursePage;
