import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MessageCircle, Minus, Send, Sparkles, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import ProductImage from './ProductImage';

const STORAGE_KEY = 'jm_chat_history';
const MAX_STORED = 40;

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm the JayaMart Assistant \ud83e\udd16\nAsk me about products, prices, stock, offers, delivery, payment or your orders - I always answer from the real JayaMart catalog.",
};

const SUGGESTIONS = [
  'Snacks under \u20b9200',
  'What offers are live?',
  'Delivery charges?',
  'Track my order',
];

/** Load the saved chat history (or start with the welcome message). */
function readHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(stored) && stored.length > 0) {
      const clean = stored.filter(
        (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      );
      if (clean.length > 0) return clean.slice(-MAX_STORED);
    }
  } catch {
    // Corrupted storage - fall back to a fresh conversation.
  }
  return [WELCOME_MESSAGE];
}

/**
 * Floating JayaMart shopping assistant.
 * The panel is rendered lazily and the API is only called when a message
 * is actually sent - nothing is loaded while the chatbot is closed.
 */
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(readHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, open]);

  const commit = (next) => {
    setMessages(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-MAX_STORED)));
    } catch {
      // Storage unavailable - the chat still works in memory.
    }
  };

  async function send(text) {
    const content = typeof text === 'string' ? text.trim() : input.trim();
    if (!content || loading) return;

    const withUser = [...messages, { role: 'user', content }];
    commit(withUser);
    setInput('');
    setLoading(true);

    try {
      // Last few turns give the AI conversational context.
      const history = withUser
        .slice(Math.max(0, withUser.length - 11), -1)
        .map((m) => ({ role: m.role, content: m.content }));
      const data = await api('/chat', {
        method: 'POST',
        body: { message: content, history },
      });
      commit([
        ...withUser,
        { role: 'assistant', content: data.reply, products: data.products || [] },
      ]);
    } catch {
      // Friendly fallback - the website never breaks because of the assistant.
      commit([
        ...withUser,
        {
          role: 'assistant',
          content:
            "Sorry, I couldn't reach the JayaMart assistant right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    commit([WELCOME_MESSAGE]);
    setInput('');
  }

  return (
    <>
      {/* Floating action button - bottom right, every page */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close JayaMart assistant' : 'Open JayaMart assistant'}
        aria-expanded={open}
        className="fixed bottom-6 right-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-navy-600 text-white shadow-lift transition hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-lavender-300"
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="JayaMart shopping assistant"
          className="animate-fade-up fixed bottom-24 right-4 z-[55] flex h-[min(34rem,calc(100vh-8rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-lift sm:right-5 sm:w-96"
        >
          {/* Header - JayaMart branding */}
          <div className="flex items-center gap-3 bg-navy-600 px-4 py-3 text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">JayaMart Assistant</p>
              <p className="flex items-center gap-1.5 text-xs text-lavender-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online - replies instantly
              </p>
            </div>
            <button
              type="button"
              onClick={clearChat}
              title="Clear chat"
              aria-label="Clear chat"
              className="rounded-lg p-1.5 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Minimize"
              aria-label="Minimize chat"
              className="rounded-lg p-1.5 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Close"
              aria-label="Close chat"
              className="rounded-lg p-1.5 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat history */}
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4"
          >
            {messages.map((msg, index) => (
              <div
                key={`${index}-${msg.role}`}
                className={`flex flex-col gap-1.5 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-navy-600 text-white'
                      : 'rounded-bl-sm border border-line bg-white text-navy-900 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Real product cards suggested by the assistant */}
                {msg.products?.length > 0 && (
                  <div className="w-[min(20rem,85%)] space-y-1.5">
                    {msg.products.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl border border-line bg-white p-2 transition hover:border-navy-300 hover:bg-navy-50"
                      >
                        <ProductImage
                          product={product}
                          className="h-12 w-12 shrink-0 rounded-lg"
                          emojiClass="text-xl"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-navy-900">
                            {product.name}
                          </p>
                          <p className="truncate text-[11px] text-navy-500">{product.category}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-navy-700">
                            {'\u20b9'}
                            {product.price}
                          </p>
                          {product.stock === 0 && (
                            <p className="text-[10px] font-semibold text-rose-500">Out of stock</p>
                          )}
                          {product.stock > 0 && product.stock < 10 && (
                            <p className="text-[10px] font-semibold text-amber-500">
                              Only {product.stock} left
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div
                aria-label="Assistant is typing"
                className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-3 shadow-sm"
              >
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-navy-400"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-navy-400"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-navy-400"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            )}

            {/* Quick suggestions right after the welcome message */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => send(text)}
                    className="rounded-full border border-lavender-300 bg-lavender-50 px-3 py-1.5 text-xs font-semibold text-lavender-800 transition hover:bg-lavender-100"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-line bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask about products, offers, orders..."
                aria-label="Message the JayaMart assistant"
                className="input max-h-24 flex-1 resize-none"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="btn-primary h-10 w-10 shrink-0 px-0"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
