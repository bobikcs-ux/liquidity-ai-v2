import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Loader2, Terminal, Send, Clock, Brain, ChevronUp, ChevronDown, X, 
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { PaywallOverlay } from './PaywallOverlay';
import { useSubscription } from '../context/SubscriptionContext';

// Message types for the AI chat
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'success' | 'error' | 'pending';
}

// Design tokens - Sovereign Sand palette
const DESIGN = {
  sovereignSand: '#A3937B',
  sovereignSandLight: '#B8A892',
  matrixGreen: '#00FF41',
  bgPrimary: '#0a0a0a',
  bgPanel: '#111111',
  textPrimary: '#d4d4d8', // zinc-300
  textMuted: '#71717a',
  border: 'rgba(163, 147, 123, 0.15)',
};

// Core copilot component (internal)
function IntelligenceCopilotCore() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [systemStatus, setSystemStatus] = useState<'INIT' | 'ACTIVE' | 'FAIL' | 'OFFLINE'>('INIT');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const { uiTheme } = useAdaptiveTheme();
  
  const isDark = uiTheme === 'dark' || uiTheme === 'terminal';

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // System initialization test on first open
  useEffect(() => {
    if (isOpen && systemStatus === 'INIT') {
      testSystemInit();
    }
  }, [isOpen, systemStatus]);

  // Test SYSTEM_INIT
  const testSystemInit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInit: 'SYSTEM_INIT' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ACTIVE') {
          setSystemStatus('ACTIVE');
          setMessages([{
            role: 'system',
            content: `AURELIUS INTELLIGENCE CORE: ONLINE\n\nTables Loaded: t63, t76, t81, t94, t95\nMode: STRATEGIST\n\nSystem Ready for Query. Standing by.`,
            timestamp: new Date(),
            status: 'success'
          }]);
        } else {
          setSystemStatus('FAIL');
        }
      } else {
        setSystemStatus('FAIL');
      }
    } catch (error) {
      console.error('[v0] System init failed:', error);
      setSystemStatus('FAIL');
      setMessages([{
        role: 'system',
        content: 'SYSTEM_INIT FAIL - Няма връзка с Gemini API',
        timestamp: new Date(),
        status: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to Gemini
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response || data.fallback || 'Няма отговор',
        timestamp: new Date(),
        status: data.status === 'ACTIVE' ? 'success' : data.status === 'FALLBACK' ? 'success' : 'error'
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error('[v0] Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Грешка при комуникация с AI. Моля, опитайте отново.',
        timestamp: new Date(),
        status: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Отвори Gemini Intelligence чат"
        className="fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl transition-all hover:scale-105 z-50 min-h-[44px]"
        style={{ 
          background: `linear-gradient(135deg, ${DESIGN.sovereignSand} 0%, ${DESIGN.sovereignSandLight} 100%)`,
          border: `1px solid ${DESIGN.border}`
        }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-black" aria-hidden="true" />
          <span className="font-semibold text-black">Gemini Intelligence</span>
        </div>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 left-4 sm:left-auto rounded-2xl shadow-2xl transition-all z-50 overflow-hidden ${
        isExpanded ? 'sm:w-[600px] h-[80vh] sm:h-[700px]' : 'sm:w-[420px] h-[70vh] sm:h-[550px]'
      }`}
      style={{ 
        background: DESIGN.bgPrimary,
        border: `1px solid ${DESIGN.border}`
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4"
        style={{ borderBottom: `1px solid ${DESIGN.border}` }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-xl"
            style={{ background: `${DESIGN.sovereignSand}20`, border: `1px solid ${DESIGN.sovereignSand}40` }}
          >
            <Terminal className="w-5 h-5" style={{ color: DESIGN.sovereignSand }} />
          </div>
          <div>
            <h3 className="font-bold font-mono text-sm" style={{ color: DESIGN.sovereignSand }}>
              GEMINI INTELLIGENCE
            </h3>
            <div className="flex items-center gap-2">
              {systemStatus === 'ACTIVE' && (
                <span className="flex items-center gap-1 text-xs font-mono" style={{ color: DESIGN.matrixGreen }}>
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              )}
              {systemStatus === 'FAIL' && (
                <span className="flex items-center gap-1 text-xs font-mono text-red-500">
                  <AlertCircle className="w-3 h-3" /> FAIL
                </span>
              )}
              {systemStatus === 'INIT' && (
                <span className="flex items-center gap-1 text-xs font-mono" style={{ color: DESIGN.textMuted }}>
                  <Loader2 className="w-3 h-3 animate-spin" /> INIT...
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Намали прозореца' : 'Уголеми прозореца'}
            className="p-2 rounded-lg transition-colors hover:bg-zinc-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: DESIGN.textMuted }}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Затвори чата"
            className="p-2 rounded-lg transition-colors hover:bg-zinc-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: DESIGN.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isExpanded ? 'h-[calc(100%-140px)]' : 'h-[calc(100%-140px)]'
        }`}
        style={{ background: DESIGN.bgPrimary }}
      >
        {messages.length === 0 && systemStatus === 'INIT' ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: DESIGN.sovereignSand }} />
            <p className="text-sm font-mono" style={{ color: DESIGN.textMuted }}>
              Инициализация на Gemini Intelligence...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: DESIGN.sovereignSand }} />
            <p className="text-sm font-mono" style={{ color: DESIGN.textMuted }}>
              Задайте въпрос за енергийни пазари, shipping или crack spreads
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-xl p-3 ${
                  msg.role === 'user' 
                    ? 'rounded-br-sm' 
                    : 'rounded-bl-sm'
                }`}
                style={{ 
                  background: msg.role === 'user' 
                    ? `${DESIGN.sovereignSand}20` 
                    : DESIGN.bgPanel,
                  border: `1px solid ${msg.role === 'user' ? DESIGN.sovereignSand + '40' : DESIGN.border}`,
                }}
              >
                {msg.role !== 'user' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="text-xs font-mono uppercase tracking-wider"
                      style={{ color: msg.status === 'error' ? '#ef4444' : DESIGN.sovereignSand }}
                    >
                      {msg.role === 'system' ? 'SYSTEM' : 'AURELIUS'}
                    </span>
                    <span className="text-xs font-mono" style={{ color: DESIGN.textMuted }}>
                      {msg.timestamp.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <p 
                  className="text-sm font-mono whitespace-pre-wrap leading-relaxed"
                  style={{ 
                    color: msg.role === 'user' 
                      ? DESIGN.sovereignSandLight 
                      : msg.status === 'error' 
                        ? '#ef4444' 
                        : DESIGN.textPrimary 
                  }}
                >
                  {msg.content}
                </p>
                {msg.role === 'user' && (
                  <div className="flex justify-end mt-1">
                    <span className="text-xs font-mono" style={{ color: DESIGN.textMuted }}>
                      {msg.timestamp.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div 
              className="rounded-xl rounded-bl-sm p-3"
              style={{ background: DESIGN.bgPanel, border: `1px solid ${DESIGN.border}` }}
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: DESIGN.sovereignSand }} />
                <span className="text-sm font-mono" style={{ color: DESIGN.textMuted }}>
                  Gemini анализира...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div 
        className="p-4"
        style={{ borderTop: `1px solid ${DESIGN.border}`, background: DESIGN.bgPrimary }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Задайте въпрос на български..."
            disabled={isLoading || systemStatus === 'FAIL'}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{ 
              background: DESIGN.bgPanel,
              border: `1px solid ${DESIGN.border}`,
              color: DESIGN.textPrimary,
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || systemStatus === 'FAIL'}
            className="px-4 py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: DESIGN.sovereignSand,
              color: '#000'
            }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {['WTI цена?', 'Crack spread?', 'Bab el-Mandeb?', 'US Inventory?'].map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isLoading || systemStatus === 'FAIL'}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:opacity-80 disabled:opacity-50"
              style={{ 
                background: `${DESIGN.sovereignSand}15`,
                border: `1px solid ${DESIGN.sovereignSand}30`,
                color: DESIGN.sovereignSandLight
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Guarded version with paywall
export function IntelligenceCopilot() {
  const { subscription } = useSubscription();
  
  return (
    <PaywallOverlay show={!subscription.isPaid}>
      <IntelligenceCopilotCore />
    </PaywallOverlay>
  );
}

export default IntelligenceCopilot;
