import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Bot, User, ArrowUpRight } from 'lucide-react';
import { aiApi } from '../../services/api';
import { Product } from '../../types';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  suggested_products?: Product[];
}

export const AIChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: "👋 Hi! I'm **PilotBot**, CommercePilot's AI store assistant. I have live access to our product catalog, warehouse inventory, and store policies. Ask me for recommendations, specs, or order questions!",
    }
  ]);

  const quickPrompts = [
    "Recommend top noise-cancelling headphones",
    "What laptops are best for AI workflows?",
    "How does your 30-day return policy work?",
    "Do you offer free shipping?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await aiApi.chatWithBot({
        message: text,
        history,
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        suggested_products: res.suggested_products,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm having a brief connection issue, but all our products can be browsed directly in the Catalog! We offer free shipping on orders over $50 and 30-day free returns.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white px-4 py-3 rounded-full shadow-lg shadow-brand-300 transition-all transform hover:scale-105 cursor-pointer"
          aria-label="Open AI Shopping Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full"></span>
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">Ask PilotBot AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-96 h-[540px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm">PilotBot Assistant</h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium border border-emerald-500/30">AI Live</span>
                </div>
                <p className="text-xs text-slate-300">Catalog-grounded intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 text-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Grounded Suggested Products Cards */}
                  {msg.suggested_products && msg.suggested_products.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-xs uppercase font-bold text-brand-600 tracking-wider">Suggested From Catalog:</span>
                      {msg.suggested_products.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <img
                              src={p.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80'}
                              alt={p.name}
                              className="w-8 h-8 rounded object-cover bg-white shrink-0"
                            />
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                              <p className="text-xs text-brand-600 font-bold">${Number(p.base_price).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Link
                              to={`/product/${p.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-1 rounded font-medium flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-xs text-slate-400">PilotBot analyzing catalog...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips (show when few messages) */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-xs">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="shrink-0 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 px-2.5 py-1 rounded-full transition cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about products, specs, shipping..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
