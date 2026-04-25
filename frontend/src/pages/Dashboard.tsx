import { FC, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, MessageSquare, Calendar, Check, LogOut, 
  Search, Filter, Star, Archive, Trash2, Send, 
  ChevronRight, ChevronLeft, RefreshCcw, Sparkles, User, 
  Menu, X, Command, Inbox, LayoutDashboard, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Mode = "reply" | "summary" | "schedule";

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
}

const STORAGE_KEY = "mailmind:playground";

const Dashboard: FC = () => {
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
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sidebar/Responsive State
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  
  const initialized = useRef(false);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width > 1024) setIsSidebarOpen(true);
      else if (width < 768) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY + ':email');
    navigate('/');
  }, [navigate]);

  const fetchInbox = useCallback(async (email: string) => {
    setLoadingEmails(true);
    try {
      const res = await fetch(`/api/gmail/inbox?email=${encodeURIComponent(email)}`);
      
      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const text = await res.text();
      if (!text) throw new Error("Empty response");
      
      const data = JSON.parse(text);
      if (data.emails) {
        setEmails(data.emails);
        // On desktop, auto-select first email
        if (!isMobile) {
          setSelectedEmail(prev => prev || (data.emails.length > 0 ? data.emails[0] : null));
        }
      }
    } catch (error) {
      console.error("Failed to fetch inbox:", error);
    } finally {
      setLoadingEmails(false);
    }
  }, [handleLogout, isMobile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    
    if (emailParam) {
      setUserEmail(emailParam);
      window.localStorage.setItem(STORAGE_KEY + ':email', emailParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedEmail = window.localStorage.getItem(STORAGE_KEY + ':email');
      if (savedEmail) {
        setUserEmail(savedEmail);
      } else {
        navigate('/');
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (userEmail && !initialized.current) {
      initialized.current = true;
      fetchInbox(userEmail);
    }
  }, [userEmail, fetchInbox]);

  const handleGenerate = useCallback(async () => {
    if (!selectedEmail) return;
    
    setPendingAI(true);
    setGenerated(null);
    setCalUrl(null);
    setSendSuccess(false);

    try {
      let endpoint = "/api/ai/summarize";
      const payload: Record<string, string> = { 
        emailBody: selectedEmail.body || selectedEmail.snippet 
      };
      
      if (mode === "reply") {
        endpoint = "/api/ai/reply";
        payload.intent = draft;
      } else if (mode === "schedule") {
        endpoint = "/api/ai/schedule";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const text = await res.text();
      if (!text) throw new Error("Empty response");
      
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
  }, [selectedEmail, mode, draft]);

  const handleSendReply = useCallback(async () => {
    if (!selectedEmail || !generated || !userEmail) return;
    
    setSendingEmail(true);
    try {
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

      if (!res.ok) throw new Error("Failed to send");
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error("Send Error:", error);
      alert("Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  }, [selectedEmail, generated, userEmail]);

  const filteredEmails = emails.filter(e => 
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEmailSelect = (email: EmailMessage) => {
    setSelectedEmail(email);
    if (isMobile) {
      setMobileView("detail");
    }
  };

  return (
    <div className="flex h-screen bg-background text-primary font-mono overflow-hidden selection:bg-primary/20 selection:text-primary relative">
      
      {/* Mobile Top Header */}
      {isMobile && (
        <div className="fixed top-0 inset-x-0 h-16 border-b border-primary/10 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-primary/60"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
            <span className="font-display tracking-widest text-primary text-sm uppercase">MailMind</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      )}

      {/* Sidebar Navigation */}
      <AnimatePresence mode="wait">
        {(isSidebarOpen || !isMobile) && (
          <>
            {/* Overlay for mobile */}
            {isMobile && isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              />
            )}
            
            <motion.aside 
              initial={isMobile ? { x: -300 } : false}
              animate={{ 
                x: 0,
                width: isSidebarOpen ? (isMobile ? 280 : 260) : 80,
                position: isMobile ? "fixed" : "relative"
              }}
              exit={isMobile ? { x: -300 } : undefined}
              className={`h-full border-r border-primary/10 bg-primary/[0.02] flex flex-col z-50 overflow-hidden ${isMobile ? "fixed inset-y-0 left-0" : ""}`}
            >
              <div 
                onClick={() => isMobile ? setIsSidebarOpen(false) : setIsSidebarOpen(!isSidebarOpen)}
                className={`p-6 flex items-center gap-3 border-b border-primary/10 cursor-pointer hover:bg-primary/5 transition-all duration-300 group relative ${!isSidebarOpen && !isMobile ? 'justify-center' : ''}`}
              >
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <motion.img 
                    src="/favicon.png" 
                    alt="MailMind Logo" 
                    className="w-8 h-8 object-contain transition-all duration-300 group-hover:opacity-0 group-hover:scale-75" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary">
                    {isSidebarOpen ? (
                      <ChevronLeft className="w-6 h-6" />
                    ) : (
                      <ChevronRight className="w-6 h-6" />
                    )}
                  </div>
                </div>
                
                {(isSidebarOpen || isMobile) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-display tracking-widest text-primary text-xl uppercase whitespace-nowrap"
                  >
                    MailMind
                  </motion.span>
                )}
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {[
                  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Home", path: "/" },
                  { icon: <Inbox className="w-4 h-4" />, label: "Inbox", count: emails.length },
                  { icon: <Star className="w-4 h-4" />, label: "Starred" },
                  { icon: <Send className="w-4 h-4" />, label: "Sent" },
                  { icon: <Archive className="w-4 h-4" />, label: "Archive" },
                  { icon: <Trash2 className="w-4 h-4" />, label: "Trash" },
                ].map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => {
                      if (item.path) navigate(item.path);
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors text-xs uppercase tracking-widest text-primary/60 hover:text-primary group"
                  >
                    <span className="text-primary/40 group-hover:text-primary">{item.icon}</span>
                    {(isSidebarOpen || isMobile) && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.count !== undefined && <span className="text-[10px] opacity-40">[{item.count}]</span>}
                      </>
                    )}
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-primary/10 space-y-4">
                <div className={`flex items-center gap-3 ${(isSidebarOpen || isMobile) ? '' : 'justify-center'}`}>
                  <div className="w-8 h-8 border border-primary/20 rounded-none flex items-center justify-center bg-primary/5">
                    <User className="w-4 h-4 text-primary/40" />
                  </div>
                  {(isSidebarOpen || isMobile) && (
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] truncate text-primary/60">{userEmail}</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-colors text-[10px] uppercase tracking-[0.2em] ${(isSidebarOpen || isMobile) ? '' : 'justify-center'}`}
                >
                  <LogOut className="w-4 h-4" />
                  {(isSidebarOpen || isMobile) && <span>Logout</span>}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`flex-1 flex overflow-hidden ${isMobile ? "mt-16" : ""}`}>
        
        {/* Email List Column */}
        <div className={`${isMobile && mobileView === "detail" ? "hidden" : "flex"} w-full md:w-[400px] border-r border-primary/10 flex-col bg-background relative z-10`}>
          <div className="p-6 border-b border-primary/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-primary/40">Messages</h2>
              <button 
                onClick={() => fetchInbox(userEmail!)}
                className="p-1 hover:bg-primary/10 rounded-none transition-colors text-primary/40 hover:text-primary"
              >
                <RefreshCcw className={`w-3 h-3 ${loadingEmails ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/30 group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="SEARCH..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-primary/5 border border-primary/10 px-9 py-2 text-[10px] uppercase tracking-widest outline-none focus:border-primary/40 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-primary/[0.01]">
            {loadingEmails ? (
              <div className="p-12 text-center space-y-4">
                <RefreshCcw className="w-6 h-6 animate-spin mx-auto text-primary/20" />
                <p className="text-[10px] uppercase tracking-widest text-primary/40">Decrypting Inbox...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-12 text-center space-y-4 opacity-30">
                <Mail className="w-8 h-8 mx-auto" />
                <p className="text-[10px] uppercase tracking-widest">No results found</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => handleEmailSelect(email)}
                  className={`p-6 border-b border-primary/5 cursor-pointer transition-all relative overflow-hidden group ${
                    selectedEmail?.id === email.id 
                      ? "bg-primary/[0.04] border-l-2 border-l-primary" 
                      : "hover:bg-primary/[0.02] border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-primary truncate max-w-[70%] uppercase tracking-wider">
                      {email.from.split('<')[0].trim() || email.from}
                    </span>
                    <span className="text-[9px] text-primary/40">
                      {email.date.split(',')[0]}
                    </span>
                  </div>
                  <h3 className={`text-[11px] mb-2 truncate ${selectedEmail?.id === email.id ? 'text-primary' : 'text-primary/80'}`}>
                    {email.subject || '(NO SUBJECT)'}
                  </h3>
                  <p className="text-[10px] text-primary/40 line-clamp-2 leading-relaxed">
                    {email.snippet}
                  </p>
                  
                  {/* Hover Accent */}
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-3 h-3 text-primary/30" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reading Pane + AI Tools */}
        <div className={`${isMobile && mobileView === "list" ? "hidden" : "flex"} flex-1 flex flex-col bg-background relative overflow-hidden`}>
          
          {/* Mobile Back Header */}
          {isMobile && (
            <div className="p-4 border-b border-primary/10 flex items-center gap-4 bg-primary/[0.02]">
              <button 
                onClick={() => setMobileView("list")}
                className="p-2 border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] uppercase tracking-widest font-bold">Back to Inbox</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {selectedEmail ? (
              <motion.div 
                key={selectedEmail.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full overflow-hidden"
              >
                {/* Email Header Area */}
                <div className="p-6 md:p-8 border-b border-primary/10 bg-primary/[0.01]">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h1 className="text-lg md:text-xl font-bold mb-4 tracking-tight leading-tight max-w-2xl">
                        {selectedEmail.subject || '(NO SUBJECT)'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 text-[10px]">
                        <div className="w-6 h-6 bg-primary/10 flex items-center justify-center text-primary/60 font-bold">
                          {selectedEmail.from[0].toUpperCase()}
                        </div>
                        <span className="text-primary/60 tracking-widest truncate max-w-[200px]">{selectedEmail.from}</span>
                        <span className="hidden sm:inline w-1 h-1 bg-primary/20 rounded-full" />
                        <span className="text-primary/40 uppercase tracking-widest">{selectedEmail.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button className="flex-1 md:flex-none p-2 border border-primary/10 hover:bg-primary/5 text-primary/40 hover:text-primary transition-colors flex justify-center">
                        <Star className="w-4 h-4" />
                      </button>
                      <button className="flex-1 md:flex-none p-2 border border-primary/10 hover:bg-primary/5 text-primary/40 hover:text-primary transition-colors flex justify-center">
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Split Content: Body and AI Sidebar */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  
                  {/* Email Body */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="max-w-3xl font-sans text-[13px] text-primary/80 leading-[1.8] whitespace-pre-wrap">
                      {selectedEmail.body || selectedEmail.snippet}
                    </div>
                  </div>

                  {/* AI Actions Sidebar */}
                  <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-primary/10 bg-primary/[0.01] flex flex-col h-auto md:h-full">
                    <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">AI Assistant</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                      {/* Mode Switcher */}
                      <div className="flex p-1 bg-primary/5 border border-primary/10">
                        {(["reply", "summary", "schedule"] as Mode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => {
                              setMode(m);
                              setGenerated(null);
                              setCalUrl(null);
                            }}
                            className={`flex-1 py-2 text-[9px] uppercase tracking-widest transition-all ${
                              mode === m ? 'bg-primary text-background font-bold' : 'text-primary/40 hover:text-primary/60'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>

                      {/* Mode Specific Inputs */}
                      {mode === "reply" && (
                        <div className="space-y-3">
                          <label className="text-[9px] uppercase tracking-widest text-primary/40">Instructions</label>
                          <textarea 
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="TELL AI HOW TO REPLY..."
                            className="w-full bg-primary/[0.03] border border-primary/10 p-4 text-[10px] h-24 resize-none outline-none focus:border-primary/40 transition-colors uppercase tracking-widest placeholder:opacity-20"
                          />
                        </div>
                      )}

                      <button 
                        onClick={handleGenerate}
                        disabled={pendingAI}
                        className="w-full py-3 bg-primary text-background text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {pendingAI ? (
                          <>
                            <RefreshCcw className="w-3 h-3 animate-spin" />
                            Thinking...
                          </>
                        ) : (
                          <>
                            <Command className="w-3 h-3" />
                            Generate {mode}
                          </>
                        )}
                      </button>

                      {/* AI Output Area */}
                      <AnimatePresence>
                        {generated && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="p-4 border border-primary/20 bg-primary/[0.04] relative">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[8px] uppercase tracking-[0.4em] text-primary/40">Output</span>
                                <div className="flex gap-4">
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(generated);
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="text-[8px] uppercase tracking-widest hover:text-primary transition-colors text-primary/40"
                                  >
                                    {copied ? 'COPIED' : 'COPY'}
                                  </button>
                                  {mode === "schedule" && calUrl && (
                                    <a 
                                      href={calUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[8px] uppercase tracking-widest text-primary hover:underline"
                                    >
                                      Add to Cal
                                    </a>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] leading-relaxed text-primary/90 whitespace-pre-wrap font-sans">
                                {generated}
                              </p>
                            </div>

                            {mode === "reply" && !pendingAI && (
                              <button 
                                onClick={handleSendReply}
                                disabled={sendingEmail || sendSuccess}
                                className={`w-full py-3 border border-primary text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${
                                  sendSuccess 
                                    ? 'bg-green-500/10 border-green-500 text-green-500' 
                                    : 'hover:bg-primary hover:text-background'
                                }`}
                              >
                                {sendingEmail ? 'Sending...' : sendSuccess ? 'Message Sent' : 'Send via Gmail'}
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-20 p-8 text-center">
                <LayoutDashboard className="w-16 h-16" />
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.5em] font-bold">MailMind Command Center</p>
                  <p className="text-[10px] mt-2 uppercase tracking-widest">Select a message to begin AI processing</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
