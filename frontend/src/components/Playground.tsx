import { FC, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Mail, MessageSquare, Calendar, Check, LogIn, RefreshCcw, LogOut, Inbox, Sparkles, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthNoticeModal from "./AuthNoticeModal";
import LetterReveal from "./LetterReveal";

type Mode = "reply" | "summary" | "schedule";

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
}

interface PlaygroundProps {
  previewOnly?: boolean;
}

const STORAGE_KEY = "mailmind:playground";

const Playground: FC<PlaygroundProps> = ({ previewOnly = false }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("reply");
  const [draft, setDraft] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [calUrl, setCalUrl] = useState<string | null>(null);
  const [pendingAI, setPendingAI] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Authentication & Gmail State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showAuthNotice, setShowAuthNotice] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // 1. Check URL for email (after Google redirect)
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    
    if (emailParam) {
      setUserEmail(emailParam);
      window.localStorage.setItem(STORAGE_KEY + ':email', emailParam);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname + '#playground');
    } else {
      // 2. Check local storage
      const savedEmail = window.localStorage.getItem(STORAGE_KEY + ':email');
      if (savedEmail) setUserEmail(savedEmail);
    }
  }, []);

  // Fetch emails when userEmail is set
  useEffect(() => {
    if (userEmail && !initialized.current) {
      initialized.current = true;
      fetchInbox(userEmail);
    }
  }, [userEmail]);

  const fetchInbox = async (email: string) => {
    setLoadingEmails(true);
    try {
      const res = await fetch(`/api/gmail/inbox?email=${encodeURIComponent(email)}`);
      
      if (res.status === 401) {
        window.localStorage.removeItem(STORAGE_KEY + ':email');
        setUserEmail(null);
        alert("Your session has expired. Please log in again.");
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const text = await res.text();
      if (!text) throw new Error("Empty response from server");
      
      const data = JSON.parse(text);
      if (data.emails && data.emails.length > 0) {
        setEmails(data.emails);
        setSelectedEmail(data.emails[0]); // Select first email by default
      }
    } catch (error) {
      console.error("Failed to fetch inbox:", error);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleLogin = () => {
    setShowAuthNotice(true);
  };

  const handleProceedAuth = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLogout = () => {
    window.localStorage.removeItem(STORAGE_KEY + ':email');
    setUserEmail(null);
    setEmails([]);
    setSelectedEmail(null);
    setGenerated(null);
  };

  const handleGenerate = async () => {
    if (!selectedEmail) return;
    
    setPendingAI(true);
    setGenerated(null);
    setCalUrl(null);
    setSendSuccess(false);

    try {
      let endpoint = "/api/ai/summarize";
      const payload: { 
        emailBody: string; 
        intent?: string; 
        metadata: { 
          emailId: string; 
          subject: string; 
          from: string; 
        } 
      } = { 
        emailBody: selectedEmail.body || selectedEmail.snippet,
        metadata: {
          emailId: selectedEmail.id,
          subject: selectedEmail.subject,
          from: selectedEmail.from
        }
      };
      
      if (mode === "reply") {
        endpoint = "/api/ai/reply";
        payload.intent = draft;
      } else if (mode === "schedule") {
        endpoint = "/api/ai/schedule";
      }

       const res = await fetch(endpoint, {
         method: "POST",
         headers: { 
           "Content-Type": "application/json",
           "Authorization": `Bearer ${window.localStorage.getItem(STORAGE_KEY + ':token')}`
         },
         body: JSON.stringify(payload)
       });
      
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const text = await res.text();
      if (!text) throw new Error("Empty response from server");
      
      const data = JSON.parse(text);
      if (mode === "reply") {
        setGenerated(data.reply);
      } else if (mode === "summary") {
        setGenerated(data.summary);
      } else if (mode === "schedule") {
        if (data.error) {
          setGenerated("AI could not detect a meeting in this email.");
        } else {
          setGenerated(`📅 Event: ${data.title}\n📍 Location: ${data.location || 'TBD'}\n📝 Note: ${data.description}`);
          const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.title)}&dates=${data.startDate}/${data.endDate}&details=${encodeURIComponent(data.description)}&location=${encodeURIComponent(data.location)}`;
          setCalUrl(url);
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      setGenerated("Error connecting to AI. Please check your API keys.");
    } finally {
      setPendingAI(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !generated || !userEmail) return;
    
    setSendingEmail(true);
    try {
      // Basic extraction of raw email address if format is "Name <email@domain.com>"
      const toMatch = selectedEmail.from.match(/<([^>]+)>/);
      const toEmail = toMatch ? toMatch[1] : selectedEmail.from;
      
      const subject = selectedEmail.subject.toLowerCase().startsWith('re:') 
        ? selectedEmail.subject 
        : `Re: ${selectedEmail.subject}`;

      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          to: toEmail,
          subject: subject,
          body: generated
        })
      });

      const data = await res.json();
      if (data.success) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 3000);
      } else {
        alert("Failed to send: " + data.error);
      }
    } catch (error) {
      console.error("Send Error:", error);
      alert("Failed to send email. Check console.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setGenerated(null); // Reset output when mode changes
    setCalUrl(null);
    setSendSuccess(false);
  };

  return (
    <section id="playground" className="py-32 px-4 max-w-6xl mx-auto scroll-mt-20">
      <AuthNoticeModal 
        open={showAuthNotice} 
        onClose={() => setShowAuthNotice(false)} 
        onProceed={handleProceedAuth} 
      />
      <span id="demo" className="block -mt-20 pt-20" aria-hidden="true" />
      
      <div className="mb-16 flex items-baseline justify-between border-b border-primary/20 pb-6">
        <LetterReveal text="LIVE INBOX" className="font-display text-primary uppercase leading-none text-[36px] md:text-7xl lg:text-[96px]" />
        <span className="font-mono text-[10px] text-primary/40 tracking-widest hidden md:inline">
          [04] PLAYGROUND
        </span>
      </div>

      {!userEmail ? (
        // --- LOGIN PROMPT ---
        <div className="border border-primary/20 bg-primary/5 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <Mail className="w-12 h-12 text-primary/40 mb-6" />
          <h3 className="font-display text-2xl uppercase mb-4 text-primary">Connect your Inbox</h3>
          <p className="font-mono text-xs text-primary/60 max-w-md mb-8 leading-relaxed">
            Experience MailMind with your actual emails. We only request read access to generate summaries and draft replies. We do not store your emails.
          </p>
          <button
            onClick={handleLogin}
            className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.25em] bg-primary text-background px-4 md:px-6 py-4 md:py-3.5 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 cursor-pointer w-full max-w-[280px] sm:max-w-none"
          >
            <LogIn className="w-4 h-4 shrink-0" /> 
            <span className="whitespace-nowrap">Sign in with Google</span>
          </button>
        </div>
      ) : (
        // --- LIVE PLAYGROUND ---
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-primary/15 border border-primary/20">
          
          {/* Inbox Panel */}
          <div className="bg-background p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary/50 flex items-center gap-2">
                ▣ Inbox 
                {loadingEmails && <RefreshCcw className="w-3 h-3 animate-spin" />}
              </span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[9px] text-primary/30 hidden sm:inline">{userEmail}</span>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-[9px] font-mono text-primary/40 hover:text-red-500 transition-colors uppercase tracking-widest"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 flex-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {emails.length === 0 && !loadingEmails ? (
                <div className="flex flex-col items-center justify-center mt-12 opacity-50">
                  <Inbox className="w-8 h-8 mb-4 text-primary/40" />
                  <p className="font-mono text-xs text-primary/60 text-center uppercase tracking-widest">Inbox Empty</p>
                  <p className="font-mono text-[9px] text-primary/30 text-center mt-2 max-w-[200px]">No emails found or API returned an empty list.</p>
                </div>
              ) : (
                emails.map((email) => {
                  const isSelected = selectedEmail?.id === email.id;
                  // Extract just the name or email address nicely
                  const fromName = email.from.split('<')[0].trim() || email.from;
                  
                  return (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`border p-4 cursor-pointer transition-colors ${
                        isSelected 
                          ? "border-primary/60 bg-primary/[0.08]" 
                          : "border-primary/15 hover:border-primary/40 hover:bg-primary/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] text-primary font-bold truncate max-w-[70%]">
                          {fromName}
                        </span>
                        <span className="font-mono text-[9px] text-primary/40 truncate ml-2">
                          {email.date.split(',')[0]} {/* Just show day/date briefly */}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-primary/80 truncate mb-1">
                        {email.subject || '(No Subject)'}
                      </p>
                      <p className="font-mono text-[9px] text-primary/50 line-clamp-2 leading-[1.6]">
                        {email.snippet}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI Action Panel */}
          <div className="bg-background p-6 md:p-8 flex flex-col border-l border-primary/20 relative overflow-hidden">
            {previewOnly && userEmail && (
              <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-6 p-4 border border-primary/20 bg-background/90 space-y-4 max-w-xs">
                  <Sparkles className="w-8 h-8 text-primary mx-auto animate-pulse" />
                  <h4 className="font-display text-xl uppercase text-primary">Full AI Access</h4>
                  <p className="font-mono text-[10px] text-primary/60 tracking-widest leading-relaxed">
                    REPLYING, SUMMARIZING, AND SCHEDULING ARE AVAILABLE IN THE DEDICATED DASHBOARD.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="font-mono text-[10px] uppercase tracking-[0.3em] bg-primary text-background px-8 py-4 hover:bg-primary/90 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 shadow-[0_0_30px_rgba(255,0,0,0.2)]"
                >
                  <Command className="w-4 h-4" /> Open Dashboard
                </button>
              </div>
            )}

            {selectedEmail ? (
              <>
                <div className="flex items-center gap-px mb-6 border border-primary/20 w-fit">
                  {(["reply", "summary", "schedule"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleModeChange(m)}
                      className={`font-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 transition-colors ${
                        mode === m
                          ? "bg-primary text-background"
                          : "text-primary/60 hover:text-primary"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {mode === "reply" && (
                  <div className="mb-4">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-primary/40 block mb-2">
                      Reply Intent (Optional)
                    </label>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                      placeholder="e.g. Accept the meeting but suggest 3PM instead..."
                      rows={2}
                      maxLength={500}
                      className="w-full bg-transparent border border-primary/25 focus:border-primary/60 outline-none font-mono text-[11px] text-primary p-3 placeholder:text-primary/25 resize-none transition-colors"
                    />
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={pendingAI}
                  className="font-mono text-[10px] uppercase tracking-[0.25em] bg-primary text-background px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer w-fit mb-6"
                >
                  {pendingAI ? "Processing..." : `Generate ${mode}`}
                </button>

                <div className="flex-1 border border-primary/15 bg-primary/[0.02] p-4 min-h-[250px] flex flex-col relative overflow-y-auto custom-scrollbar">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-primary/40 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 ${pendingAI ? 'bg-primary animate-pulse' : 'bg-primary/50'}`} />
                      AI {mode === 'reply' ? 'Draft' : mode === 'schedule' ? 'Event Extractor' : 'Summary'}
                    </div>
                    {generated && !pendingAI && (
                      <div className="flex items-center gap-4">
                        {mode === 'schedule' && calUrl && (
                          <a
                            href={calUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[9px] uppercase tracking-widest flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                            title="Add to Google Calendar"
                          >
                            <Calendar className="w-3 h-3" />
                            <span className="hidden sm:inline">ADD TO CALENDAR</span>
                          </a>
                        )}
                        {mode === 'reply' && (
                          <button
                            onClick={handleSendReply}
                            disabled={sendingEmail || sendSuccess}
                            className={`font-mono text-[9px] uppercase tracking-widest flex items-center gap-1 transition-colors disabled:opacity-50 ${
                              sendSuccess ? 'text-green-500' : 'text-primary hover:text-primary/80'
                            }`}
                            title="Send Reply via Gmail"
                          >
                            <Mail className="w-3 h-3" />
                            <span className="hidden sm:inline">
                              {sendingEmail ? "SENDING..." : sendSuccess ? "SENT!" : "SEND REPLY"}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generated);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="hover:text-primary transition-colors flex items-center gap-1"
                          title="Copy to clipboard"
                        >
                          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                          <span className="hidden sm:inline">{copied ? "COPIED" : "COPY"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {pendingAI ? (
                      <motion.p
                        key="pending"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-mono text-[11px] text-primary/40 mt-4"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1 h-3 bg-primary animate-ping" />
                          Synthesizing {mode}...
                        </span>
                      </motion.p>
                    ) : generated ? (
                      <motion.pre
                        key={generated}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="font-mono text-[11px] text-primary/90 leading-[1.8] whitespace-pre-wrap font-sans"
                      >
                        {generated}
                      </motion.pre>
                    ) : (
                      <motion.p
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-mono text-[11px] text-primary/30 mt-4"
                      >
                        Select an email from the left and click generate.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-primary/20 bg-primary/[0.01]">
                <MessageSquare className="w-8 h-8 text-primary/20 mb-4" />
                <p className="font-mono text-[11px] text-primary/40 uppercase tracking-widest">Awaiting Selection</p>
                <p className="font-mono text-[9px] text-primary/30 mt-2 max-w-[200px]">Select an email from the left panel to begin AI processing.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Playground;
