import { FC, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, MessageSquare, Calendar, Check, LogOut, 
  Search, Filter, Star, Archive, Trash2, Send, 
  ChevronRight, ChevronLeft, RefreshCcw, Sparkles, User, 
  Menu, X, Command, Inbox, LayoutDashboard, ArrowLeft,
  Settings, Bell, MoreVertical, Paperclip
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Mode = "reply" | "summary" | "schedule";
type MobileTab = "inbox" | "ai" | "settings";

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
  const [activeTab, setActiveTab] = useState<MobileTab>("inbox");
  
  const initialized = useRef(false);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);
      if (width > 1024) setIsSidebarOpen(true);
      else if (mobile) setIsSidebarOpen(false);
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
      if (savedEmail) setUserEmail(savedEmail);
      else navigate('/');
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
      const payload: Record<string, string> = { emailBody: selectedEmail.body || selectedEmail.snippet };
      if (mode === "reply") {
        endpoint = "/api/ai/reply";
        payload.intent = draft;
      } else if (mode === "schedule") endpoint = "/api/ai/schedule";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = JSON.parse(await res.text());
      if (mode === "reply") setGenerated(data.reply);
      else if (mode === "summary") setGenerated(data.summary);
      else if (mode === "schedule") {
        if (data.error) setGenerated("AI could not detect a meeting.");
        else {
          setGenerated(`📅 Event: ${data.title}\n📍 Location: ${data.location || 'TBD'}\n📝 Note: ${data.description}`);
          setCalUrl(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.title)}&dates=${data.startDate}/${data.endDate}&details=${encodeURIComponent(data.description)}&location=${encodeURIComponent(data.location)}`);
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      setGenerated("Error connecting to AI.");
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
      const subject = selectedEmail.subject.toLowerCase().startsWith('re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`;
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, to: toEmail, subject, body: generated })
      });
      if (!res.ok) throw new Error("Failed to send");
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error("Send Error:", error);
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
    if (isMobile) setMobileView("detail");
  };

  return (
    <div className="flex h-screen bg-background text-primary font-mono overflow-hidden selection:bg-primary/20 selection:text-primary relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] mix-blend-overlay noise-overlay" />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="h-full border-r border-primary/10 bg-primary/[0.02] flex flex-col z-50 overflow-hidden"
        >
          <div 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-6 flex items-center gap-3 border-b border-primary/10 cursor-pointer hover:bg-primary/5 transition-all duration-300 group relative ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <img src="/favicon.png" alt="Logo" className="w-8 h-8 object-contain transition-all duration-300 group-hover:opacity-0 group-hover:scale-75" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary">
                {isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </div>
            </div>
            {isSidebarOpen && (
              <span className="font-display tracking-widest text-primary text-xl uppercase whitespace-nowrap">MailMind</span>
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
              <button key={item.label} onClick={() => item.path && navigate(item.path)} className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors text-xs uppercase tracking-widest text-primary/60 hover:text-primary group">
                <span className="text-primary/40 group-hover:text-primary">{item.icon}</span>
                {isSidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-primary/10">
            <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-colors text-[10px] uppercase tracking-[0.2em] ${isSidebarOpen ? '' : 'justify-center'}`}>
              <LogOut className="w-4 h-4" />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </motion.aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Top Header */}
        {isMobile && (
          <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-primary/10 bg-background/50 backdrop-blur-md z-30">
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
              <span className="font-display tracking-widest text-primary text-sm uppercase">MailMind</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-primary/60"><Bell className="w-5 h-5" /></button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20"><User className="w-4 h-4 text-primary/40" /></div>
            </div>
          </header>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {/* Inbox List */}
          <motion.div 
            animate={{ x: isMobile && mobileView === "detail" ? "-100%" : "0%", opacity: isMobile && mobileView === "detail" ? 0 : 1 }}
            className={`flex flex-col bg-background border-r border-primary/10 z-10 transition-all duration-300
              ${isMobile ? "fixed inset-x-0 top-14 bottom-16" : "w-[380px] lg:w-[420px] relative"}`}
          >
            <div className="p-5 border-b border-primary/10 bg-primary/[0.01] flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary/30">Inbox Feed</h2>
                <button onClick={() => fetchInbox(userEmail!)} className="p-1 hover:text-primary transition-colors">
                  <RefreshCcw className={`w-3 h-3 ${loadingEmails ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/20 group-focus-within:text-primary transition-colors" />
                <input type="text" placeholder="SEARCH..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-primary/5 border border-primary/10 px-10 py-2.5 text-[9px] uppercase tracking-widest outline-none focus:border-primary/30 transition-all placeholder:opacity-20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingEmails ? (
                <div className="p-12 text-center opacity-20"><RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-4" /><p className="text-[9px] uppercase tracking-widest">Decrypting...</p></div>
              ) : filteredEmails.map((email) => (
                <div key={email.id} onClick={() => handleEmailSelect(email)} className={`p-5 border-b border-primary/5 cursor-pointer transition-all relative ${selectedEmail?.id === email.id ? "bg-primary/[0.05]" : "hover:bg-primary/[0.02]"}`}>
                  {selectedEmail?.id === email.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  <div className="flex justify-between items-start mb-2"><span className="text-[9px] font-bold text-primary uppercase tracking-wider truncate max-w-[70%]">{email.from.split('<')[0].trim()}</span><span className="text-[8px] opacity-40">{email.date.split(',')[0]}</span></div>
                  <h3 className={`text-[12px] mb-2 font-title font-semibold truncate leading-tight ${selectedEmail?.id === email.id ? 'text-primary' : 'text-primary/80'}`}>{email.subject || '(NO SUBJECT)'}</h3>
                  <p className="text-[9px] opacity-40 line-clamp-2 leading-[1.6]">{email.snippet}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Reading Pane */}
          <motion.div 
            animate={{ x: isMobile && mobileView === "list" ? "100%" : "0%", opacity: isMobile && mobileView === "list" ? 0 : 1 }}
            className={`flex-1 flex flex-col bg-background relative overflow-hidden z-20
              ${isMobile ? "fixed inset-x-0 top-14 bottom-16" : ""}`}
          >
            {isMobile && mobileView === "detail" && (
              <nav className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/[0.02] flex-shrink-0">
                <button onClick={() => setMobileView("list")} className="flex items-center gap-2 text-primary/60 hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-[9px] uppercase tracking-widest font-bold">Inbox</span>
                </button>
                <MoreVertical className="w-4 h-4 text-primary/30" />
              </nav>
            )}

            <AnimatePresence mode="wait">
              {selectedEmail ? (
                <motion.div key={selectedEmail.id} className="flex flex-col h-full overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="p-6 md:p-10 border-b border-primary/10 bg-primary/[0.01] flex-shrink-0">
                    <h1 className="text-xl md:text-3xl font-title font-extrabold mb-4 tracking-tight leading-[1.1] text-primary max-w-4xl break-words">
                      {selectedEmail.subject || '(NO SUBJECT)'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-[9px] md:text-[10px]">
                      <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">{selectedEmail.from[0].toUpperCase()}</div>
                      <div className="flex flex-col"><span className="text-primary font-bold tracking-widest uppercase">{selectedEmail.from.split('<')[0].trim()}</span><span className="text-primary/40 lowercase tracking-tighter">{selectedEmail.from.match(/<([^>]+)>/)?.[1] || selectedEmail.from}</span></div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-primary/[0.005]">
                      <div className="max-w-3xl font-mono text-[11px] md:text-[13px] text-primary/80 leading-[1.8] whitespace-pre-wrap">
                        {selectedEmail.body || selectedEmail.snippet}
                      </div>
                    </div>

                    {/* AI Sidebar */}
                    <div className={`w-full md:w-96 border-t md:border-t-0 md:border-l border-primary/10 bg-primary/[0.015] flex flex-col 
                      ${isMobile && activeTab !== "ai" ? "hidden" : "flex"}`}>
                      <div className="p-5 border-b border-primary/10 flex items-center gap-3 flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em]">AI Assistant</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div className="flex p-1 bg-primary/5 border border-primary/10 rounded-sm">
                          {(["reply", "summary", "schedule"] as Mode[]).map((m) => (
                            <button key={m} onClick={() => { setMode(m); setGenerated(null); }} className={`flex-1 py-2 text-[8px] uppercase tracking-[0.2em] rounded-sm transition-all ${mode === m ? 'bg-primary text-background font-bold' : 'text-primary/40 hover:text-primary/60'}`}>{m}</button>
                          ))}
                        </div>
                        {mode === "reply" && (
                          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="INSTRUCTIONS..." className="w-full bg-primary/[0.02] border border-primary/10 p-4 text-[10px] h-24 resize-none outline-none focus:border-primary/40 uppercase tracking-widest placeholder:opacity-10" />
                        )}
                        <button onClick={handleGenerate} disabled={pendingAI} className="w-full py-4 bg-primary text-background text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50">{pendingAI ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Command className="w-3 h-3" />}{pendingAI ? "Thinking..." : `Execute ${mode}`}</button>
                        <AnimatePresence>
                          {generated && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                              <div className="p-4 border border-primary/20 bg-primary/[0.05] backdrop-blur-md">
                                <div className="flex justify-between items-center mb-2"><span className="text-[7px] uppercase tracking-widest opacity-40">Output</span><button onClick={() => { navigator.clipboard.writeText(generated!); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-[7px] uppercase tracking-widest opacity-40 hover:opacity-100">{copied ? 'COPIED' : 'COPY'}</button></div>
                                <p className="text-[11px] leading-relaxed text-primary/90 whitespace-pre-wrap font-sans">{generated}</p>
                              </div>
                              {mode === "reply" && (
                                <button onClick={handleSendReply} disabled={sendingEmail || sendSuccess} className={`w-full py-4 border border-primary/40 text-[9px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 ${sendSuccess ? 'bg-green-500/10 border-green-500 text-green-500' : 'hover:bg-primary hover:text-background'}`}>{sendingEmail ? 'Transmitting...' : sendSuccess ? 'Sent' : 'Send via Gmail'}</button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-10"><LayoutDashboard className="w-20 h-20 mb-4" /><p className="text-[10px] uppercase tracking-[0.6em]">System Standby</p></div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="h-16 flex-shrink-0 flex items-center justify-around bg-background/80 backdrop-blur-xl border-t border-primary/10 z-50">
            {[
              { id: "inbox", icon: <Inbox className="w-5 h-5" />, label: "Inbox" },
              { id: "ai", icon: <Sparkles className="w-5 h-5" />, label: "AI Core" },
              { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Tools" }
            ].map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as MobileTab); if (tab.id === "inbox") setMobileView("list"); }} className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${activeTab === tab.id ? "text-primary" : "text-primary/30"}`}>
                {activeTab === tab.id && <motion.div layoutId="mobile-tab-pill" className="absolute -top-3 w-8 h-0.5 bg-primary" />}
                {tab.icon}
                <span className="text-[8px] uppercase tracking-[0.15em] font-bold">{tab.label}</span>
              </button>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
