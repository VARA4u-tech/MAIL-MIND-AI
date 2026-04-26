import { FC, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, MessageSquare, Calendar, Check, LogOut, 
  Search, Filter, Star, Archive, Trash2, Send, 
  ChevronRight, ChevronLeft, RefreshCcw, Sparkles, User, 
  Menu, X, Command, Inbox, LayoutDashboard, ArrowLeft,
  Settings, Bell, MoreVertical, Paperclip, PanelRightOpen, PanelRightClose,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Mode = "reply" | "summary" | "schedule" | "history";
type MobileTab = "inbox" | "ai" | "settings";

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  category?: string;
}

interface HistoryItem {
  _id: string;
  emailId: string;
  subject: string;
  from: string;
  originalContent: string;
  aiResult: string;
  type: "summary" | "reply" | "schedule";
  createdAt: string;
}

const STORAGE_KEY = "mailmind:playground";

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("reply");
  const [draft, setDraft] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
   const [scheduling, setScheduling] = useState(false);
   const [scheduleSuccess, setScheduleSuccess] = useState(false);
   const [activeFolder, setActiveFolder] = useState("INBOX");

  interface RawSchedule {
    title: string;
    description: string;
    location?: string;
    startDate: string;
    endDate: string;
  }
  const [rawSchedule, setRawSchedule] = useState<RawSchedule | null>(null);
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<EmailMessage[] | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [isBulkSummarizing, setIsBulkSummarizing] = useState(false);
  
  // Sidebar/Responsive State
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1200);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1100);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [activeTab, setActiveTab] = useState<MobileTab>("inbox");
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false); // Default closed on tablet/small screens
  
  const initialized = useRef(false);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1100;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (width > 1200) setIsSidebarOpen(true);
      else if (tablet || mobile) setIsSidebarOpen(false);
      
      // Auto-open AI panel only on large desktops
      if (width > 1400) setIsAiPanelOpen(true);
      else if (width < 1300) setIsAiPanelOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY + ':email');
    window.localStorage.removeItem(STORAGE_KEY + ':token');
    navigate('/');
  }, [navigate]);

   const fetchInbox = useCallback(async (email: string, label: string = 'INBOX') => {
     setLoadingEmails(true);
     setSelectedEmailIds([]); // Clear selections when folder changes
     try {
       const res = await fetch(`/api/gmail/inbox?label=${label}`, {
         headers: {
           'Authorization': `Bearer ${window.localStorage.getItem(STORAGE_KEY + ':token')}`
         }
       });
       if (res.status === 401) {
         handleLogout();
         return;
       }
       if (!res.ok) throw new Error(`Server returned status ${res.status}`);
       const text = await res.text();
       const data = JSON.parse(text);
       if (data.emails) {
         setEmails(data.emails);
         if (!isMobile) {
           setSelectedEmail(data.emails.length > 0 ? data.emails[0] : null);
         }
       }
     } catch (error) {
      console.error("Failed to fetch inbox:", error);
    } finally {
      setLoadingEmails(false);
    }
  }, [handleLogout, isMobile]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/ai/history`, {
        headers: {
          'Authorization': `Bearer ${window.localStorage.getItem(STORAGE_KEY + ':token')}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("History fetch error:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('token');
    
    if (emailParam && tokenParam) {
      setUserEmail(emailParam);
      setAuthToken(tokenParam);
      window.localStorage.setItem(STORAGE_KEY + ':email', emailParam);
      window.localStorage.setItem(STORAGE_KEY + ':token', tokenParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedEmail = window.localStorage.getItem(STORAGE_KEY + ':email');
      const savedToken = window.localStorage.getItem(STORAGE_KEY + ':token');
      if (savedEmail && savedToken) {
        setUserEmail(savedEmail);
        setAuthToken(savedToken);
      } else navigate('/');
    }
  }, [navigate]);

   useEffect(() => {
     if (userEmail && authToken && !initialized.current) {
       initialized.current = true;
       fetchInbox(userEmail, activeFolder);
       fetchHistory();
     }
   }, [userEmail, authToken, fetchInbox, fetchHistory, activeFolder]);

  const handleGenerate = useCallback(async () => {
    if (!selectedEmail) return;
    setPendingAI(true);
    setGenerated(null);
    setAiError(null);
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
      } else if (mode === "schedule") endpoint = "/api/ai/schedule";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || `Server Error ${res.status}`);

      if (mode === "reply") setGenerated(data.reply);
      else if (mode === "summary") setGenerated(data.summary);
      else if (mode === "schedule") {
        if (data.error) setGenerated("AI could not detect a meeting.");
        else {
          setRawSchedule(data);
          setGenerated(`📅 Event: ${data.title}\n📍 Location: ${data.location || 'TBD'}\n📝 Note: ${data.description}`);
          setCalUrl(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.title)}&dates=${data.startDate}/${data.endDate}&details=${encodeURIComponent(data.description)}&location=${encodeURIComponent(data.location)}`);
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      setAiError(error instanceof Error ? error.message : "An unexpected AI error occurred");
    } finally {
      setPendingAI(false);
      if (userEmail) fetchHistory();
    }
  }, [selectedEmail, mode, draft, userEmail, authToken, fetchHistory]);

  const handleSendReply = useCallback(async () => {
    if (!selectedEmail || !generated || !userEmail) return;
    setSendingEmail(true);
    try {
      const toMatch = selectedEmail.from.match(/<([^>]+)>/);
      const toEmail = toMatch ? toMatch[1] : selectedEmail.from;
      const subject = selectedEmail.subject.toLowerCase().startsWith('re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`;
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ to: toEmail, subject, body: generated })
      });
      if (!res.ok) throw new Error("Failed to send");
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error("Send Error:", error);
    } finally {
      setSendingEmail(false);
    }
  }, [selectedEmail, generated, userEmail, authToken]);

  const handleScheduleToCalendar = useCallback(async () => {
    if (!rawSchedule || !authToken) return;
    setScheduling(true);
    setScheduleSuccess(false);
    try {
      const res = await fetch("/api/calendar/create-event", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: rawSchedule.title,
          description: rawSchedule.description,
          location: rawSchedule.location,
          startDate: rawSchedule.startDate,
          endDate: rawSchedule.endDate
        })
      });
      if (!res.ok) throw new Error("Failed to schedule");
      setScheduleSuccess(true);
      setTimeout(() => setScheduleSuccess(false), 3000);
    } catch (error) {
      console.error("Schedule Error:", error);
      setAiError("Failed to extract schedule");
    } finally {
      setPendingAI(false);
    }
  }, [authToken, rawSchedule]);

  const handleBulkSummarize = async () => {
    if (selectedEmailIds.length === 0 || !authToken) return;
    setIsBulkSummarizing(true);
    setGenerated(null);
    setIsAiPanelOpen(true);
    try {
      const res = await fetch('/api/ai/summarize-bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ emailIds: selectedEmailIds })
      });
      const data = await res.json();
      if (data.summary) {
        setGenerated(data.summary);
      } else {
        throw new Error(data.error || "Bulk summary failed");
      }
    } catch (error) {
      console.error("Bulk Summary Error:", error);
      setAiError("Failed to generate bulk summary");
     } finally {
       setIsBulkSummarizing(false);
       if (userEmail) fetchHistory();
     }
  };

  const toggleEmailSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmailIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredEmails = aiSearchResults || emails.filter(e => 
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAISearch = useCallback(async () => {
    if (!searchQuery.trim() || !authToken) return;
    setIsAISearching(true);
    setAiSearchResults(null);
    try {
      const res = await fetch(`/api/gmail/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("AI Search failed");
      const data = await res.json();
      setAiSearchResults(data.emails || []);
    } catch (error) {
      console.error("AI Search Error:", error);
      setAiError("AI Search failed to process query");
    } finally {
      setIsAISearching(false);
    }
  }, [searchQuery, authToken]);

  const clearAISearch = () => {
    setAiSearchResults(null);
    setSearchQuery("");
  };

  const handleEmailSelect = (email: EmailMessage) => {
    setSelectedEmail(email);
    if (isMobile) setMobileView("detail");
  };

  const cleanEmailBody = (html: string) => {
    if (!html) return "";
    // Basic cleanup of raw HTML if it's being displayed as text
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };

  return (
    <div className="flex h-screen bg-background text-primary font-mono overflow-hidden selection:bg-primary/20 selection:text-primary relative">
      {!isMobile && <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] mix-blend-overlay noise-overlay" />}

      {/* Adaptive Sidebar */}
      {!isMobile && (
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="h-full border-r border-primary/10 bg-primary/[0.02] flex flex-col z-50 overflow-hidden shrink-0"
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
              <span 
                onClick={(e) => { e.stopPropagation(); navigate("/"); }} 
                className="font-display tracking-widest text-primary text-xl uppercase whitespace-nowrap hover:opacity-70 transition-opacity"
              >
                MailMind
              </span>
            )}
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
             {[
               { icon: <LayoutDashboard className="w-4 h-4" />, label: "Home", id: "HOME" },
               { icon: <Inbox className="w-4 h-4" />, label: "Inbox", id: "INBOX", count: activeFolder === "INBOX" ? emails.length : undefined },
               { icon: <Star className="w-4 h-4" />, label: "Starred", id: "STARRED", count: activeFolder === "STARRED" ? emails.length : undefined },
               { icon: <Send className="w-4 h-4" />, label: "Sent", id: "SENT", count: activeFolder === "SENT" ? emails.length : undefined },
               { icon: <Archive className="w-4 h-4" />, label: "Archive", id: "ARCHIVE" },
               { icon: <Trash2 className="w-4 h-4" />, label: "Trash", id: "TRASH", count: activeFolder === "TRASH" ? emails.length : undefined },
             ].map((item) => (
               <button 
                 key={item.label} 
                 onClick={() => {
                   if (item.id === "HOME") {
                     navigate("/");
                   } else if (item.id === "ARCHIVE") {
                     // Archive logic (search for not in inbox)
                   } else {
                     setActiveFolder(item.id);
                     fetchInbox(userEmail!, item.id);
                   }
                 }} 
                 className={`w-full flex items-center gap-3 p-3 transition-all duration-300 text-xs uppercase tracking-widest group border rounded-sm
                   ${activeFolder === item.id ? "bg-primary/20 text-primary border-primary/20" : "hover:bg-primary/10 text-primary/60 hover:text-primary border-transparent"}`}
               >
                 <span className={`${activeFolder === item.id ? "text-primary" : "text-primary/40 group-hover:text-primary"} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                 {isSidebarOpen && <span className="flex-1 text-left font-bold">{item.label}</span>}
                 {isSidebarOpen && item.count !== undefined && <span className="text-[8px] opacity-40 tabular-nums">{item.count}</span>}
               </button>
             ))}
          </nav>
        </motion.aside>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {(isMobile || !isSidebarOpen) && (
          <header className={`h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-primary/10 bg-background/95 ${!isMobile ? "backdrop-blur-md" : ""} z-30`}>
            <div 
              onClick={() => navigate("/")}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
                <span className="font-display tracking-widest text-primary text-xs uppercase">MailMind</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-primary/60"><Bell className="w-4 h-4" /></button>
              <button 
                onClick={handleLogout}
                className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-colors"
                title="Logout"
              >
                <User className="w-3.5 h-3.5 text-primary/40" />
              </button>
            </div>
          </header>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {/* Inbox List */}
          <motion.div 
            animate={{ x: isMobile && mobileView === "detail" ? "-100%" : "0%", opacity: isMobile && mobileView === "detail" ? 0 : 1 }}
            className={`flex flex-col bg-background border-r border-primary/10 z-10 transition-all duration-300 shrink-0
              ${isMobile ? "fixed inset-x-0 top-14 bottom-16" : isTablet ? "w-[260px]" : "w-[360px] lg:w-[400px]"}`}
          >
            <div className="p-5 border-b border-primary/10 bg-primary/[0.01] flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary/30">Inbox</h2>
                  {selectedEmailIds.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-primary text-background font-bold rounded-sm animate-pulse">
                      {selectedEmailIds.length} SELECTED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {selectedEmailIds.length > 1 && (
                    <button 
                      onClick={handleBulkSummarize}
                      disabled={isBulkSummarizing}
                      className="text-[9px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-sm border border-primary/20"
                    >
                      {isBulkSummarizing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      BULK AI
                    </button>
                  )}
                  <button onClick={() => fetchInbox(userEmail!)} className="p-1 hover:text-primary transition-colors">
                    <RefreshCcw className={`w-3 h-3 ${loadingEmails ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/20 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder={aiSearchResults ? "AI SEARCH ACTIVE..." : "SEARCH..."} 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                  className="w-full bg-primary/5 border border-primary/10 px-10 py-2.5 text-[9px] uppercase tracking-widest outline-none focus:border-primary/30 transition-all placeholder:opacity-20" 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {aiSearchResults ? (
                    <button onClick={clearAISearch} className="p-1 text-primary hover:scale-110 transition-transform">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleAISearch} 
                      disabled={isAISearching || !searchQuery.trim()}
                      className="p-1 text-primary/40 hover:text-primary hover:scale-110 transition-transform disabled:opacity-20"
                      title="AI Semantic Search"
                    >
                      {isAISearching ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingEmails ? (
                <div className="p-12 text-center opacity-20"><RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" /><p className="text-[9px] uppercase tracking-widest animate-pulse">Syncing Inbox...</p></div>
              ) : filteredEmails.map((email) => (
                <div 
                   key={email.id} 
                   onClick={() => handleEmailSelect(email)} 
                   className={`p-5 border-b border-primary/5 cursor-pointer transition-all duration-200 relative group
                     ${selectedEmail?.id === email.id ? "bg-primary/[0.08]" : "hover:bg-primary/[0.03]"}
                     ${selectedEmailIds.includes(email.id) ? "bg-primary/[0.04]" : ""}`}
                 >
                   {selectedEmail?.id === email.id && (
                     <div 
                       className={`absolute left-0 top-0 bottom-0 w-1.5 bg-primary ${!isMobile ? "shadow-[0_0_15px_rgba(255,0,0,0.5)]" : ""}`} 
                     />
                   )}
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex items-center gap-3 max-w-[70%]">
                      <div 
                        onClick={(e) => toggleEmailSelection(email.id, e)}
                        className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0
                          ${selectedEmailIds.includes(email.id) ? 'bg-primary border-primary' : 'border-primary/20 group-hover:border-primary/40'}`}
                      >
                        {selectedEmailIds.includes(email.id) && <Check className="w-3 h-3 text-background" />}
                      </div>
                      <div className="flex flex-col gap-1.5 truncate">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest truncate opacity-70 group-hover:opacity-100 transition-opacity">
                          {email.from.split('<')[0].trim()}
                        </span>
                        {email.category && (
                          <span className={`text-[7px] px-1.5 py-0.5 rounded-full border w-fit uppercase tracking-tighter font-bold
                            ${email.category === 'Action Required' ? 'border-red-500 text-red-500 bg-red-500/5' : 
                              email.category === 'Meeting' ? 'border-blue-400 text-blue-400 bg-blue-400/5' : 
                              email.category === 'Social' ? 'border-green-400 text-green-400 bg-green-400/5' :
                              email.category === 'Promotions' ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' :
                              'border-primary/20 text-primary/40'}`}>
                            {email.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] opacity-30 font-bold">{email.date.split(',')[0]}</span>
                  </div>
                  <h3 className={`text-xs mb-2 font-title font-bold truncate leading-tight tracking-tight pl-7
                    ${selectedEmail?.id === email.id ? 'text-primary' : 'text-primary/70 group-hover:text-primary'}`}>
                    {email.subject || '(NO SUBJECT)'}
                  </h3>
                  <p className="text-[10px] opacity-40 line-clamp-2 leading-[1.6] pl-7 group-hover:opacity-60 transition-opacity">
                    {email.snippet}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Reading Pane */}
          <motion.div 
            animate={{ x: isMobile && mobileView === "list" ? "100%" : "0%", opacity: isMobile && mobileView === "list" ? 0 : 1 }}
            className={`flex-1 flex flex-col bg-background relative overflow-hidden z-20 transition-all duration-300
              ${isMobile ? "fixed inset-x-0 top-14 bottom-16 transform-gpu" : ""}`}
            style={{ transform: 'translateZ(0)' }}
          >
            <nav className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/[0.02] flex-shrink-0">
              <div className="flex items-center gap-4">
                {isMobile && mobileView === "detail" && (
                  <button onClick={() => setMobileView("list")} className="flex items-center gap-2 text-primary/60 hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-widest font-bold">Inbox</span>
                  </button>
                )}
                {!isMobile && (
                  <div className="flex gap-2">
                    <button className="p-2 border border-primary/10 hover:bg-primary/5 transition-colors text-primary/40"><Star className="w-4 h-4" /></button>
                    <button className="p-2 border border-primary/10 hover:bg-primary/5 transition-colors text-primary/40"><Archive className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              {!isMobile && (
                <button 
                  onClick={() => setIsAiPanelOpen(!isAiPanelOpen)} 
                  className={`flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all
                    ${isAiPanelOpen ? 'bg-primary text-background' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> {isAiPanelOpen ? 'Hide AI' : 'AI Assistant'}
                </button>
              )}
            </nav>

            <AnimatePresence mode="wait">
              {selectedEmail ? (
                <motion.div key={selectedEmail.id} className="flex flex-col h-full overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="p-6 md:p-8 lg:p-10 border-b border-primary/10 bg-primary/[0.01] flex-shrink-0">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-title font-extrabold mb-4 tracking-tight leading-[1.2] text-primary max-w-4xl break-words uppercase">
                      {selectedEmail.subject || '(NO SUBJECT)'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-[9px] md:text-[10px]">
                      <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">{selectedEmail.from[0].toUpperCase()}</div>
                      <div className="flex flex-col">
                        <span className="text-primary font-bold tracking-widest uppercase">{selectedEmail.from.split('<')[0].trim()}</span>
                        <span className="text-primary/40 lowercase tracking-tighter truncate max-w-[200px]">{selectedEmail.from.match(/<([^>]+)>/)?.[1] || selectedEmail.from}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 custom-scrollbar bg-primary/[0.005]">
                      {selectedEmail.body && selectedEmail.body.includes('<') ? (
                        <div className="max-w-3xl font-sans text-[13px] text-primary/90 leading-relaxed overflow-hidden bg-white/5 p-6 border border-primary/10 rounded-sm">
                          <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                        </div>
                      ) : (
                        <div className="max-w-3xl font-mono text-[11px] md:text-[12px] lg:text-[13px] text-primary/80 leading-[1.8] whitespace-pre-wrap">
                          {selectedEmail.body || selectedEmail.snippet}
                        </div>
                      )}
                    </div>

                    {/* AI Sidebar - Improved Overlay for Tablet */}
                    <AnimatePresence>
                      {isAiPanelOpen && !isMobile && (
                        <motion.aside 
                          initial={{ x: "100%" }}
                          animate={{ x: 0 }}
                          exit={{ x: "100%" }}
                          transition={{ type: "spring", damping: 25, stiffness: 200 }}
                          className={`border-l border-primary/10 bg-background/98 ${!isMobile ? "backdrop-blur-xl" : ""} flex flex-col shrink-0 z-40 shadow-2xl
                            ${isTablet ? "absolute inset-y-0 right-0 w-[320px]" : "relative w-[400px]"}`}
                        >
                          <div className="p-5 border-b border-primary/10 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-primary" /><span className="text-[10px] font-bold uppercase tracking-[0.4em]">AI Assistant</span></div>
                            <button onClick={() => setIsAiPanelOpen(false)} className="p-1 hover:text-primary transition-colors"><PanelRightClose className="w-4 h-4" /></button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="flex p-1 bg-primary/5 border border-primary/10 rounded-sm">
                              {(["reply", "summary", "schedule", "history"] as Mode[]).map((m) => (
                                <button key={m} onClick={() => { setMode(m); setGenerated(null); setAiError(null); }} className={`flex-1 py-2 text-[8px] uppercase tracking-[0.2em] rounded-sm transition-all ${mode === m ? 'bg-primary text-background font-bold' : 'text-primary/40 hover:text-primary/60'}`}>{m}</button>
                              ))}
                            </div>
                            
                            {aiError && (
                              <div className="p-4 bg-red-500/10 border border-red-500/20 flex items-start gap-3 rounded-sm">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Error</p>
                                  <p className="text-[9px] text-red-500/70 leading-relaxed break-words">{aiError}</p>
                                </div>
                              </div>
                            )}

                            {mode === "reply" && (
                              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="INSTRUCTIONS..." className="w-full bg-primary/[0.02] border border-primary/10 p-4 text-[10px] h-24 resize-none outline-none focus:border-primary/40 uppercase tracking-widest placeholder:opacity-10" />
                            )}
                            <button 
                               onClick={handleGenerate} 
                               disabled={pendingAI} 
                               className="w-full py-5 bg-primary text-background text-[10px] uppercase tracking-[0.5em] font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.98] shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                             >
                               {pendingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />}
                               {pendingAI ? "PROCESSING..." : `PROCESS ${mode}`}
                             </button>
                            {generated && mode !== "history" && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="p-4 border border-primary/20 bg-primary/[0.05] backdrop-blur-md">
                                  <div className="flex justify-between items-center mb-2"><span className="text-[7px] uppercase tracking-widest opacity-40">Output</span><button onClick={() => { navigator.clipboard.writeText(generated!); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-[7px] uppercase tracking-widest opacity-40 hover:opacity-100">{copied ? 'COPIED' : 'COPY'}</button></div>
                                  <p className="text-[11px] leading-relaxed text-primary/90 whitespace-pre-wrap font-sans">{generated}</p>
                                </div>
                                {mode === "reply" && (
                                  <button onClick={handleSendReply} disabled={sendingEmail || sendSuccess} className={`w-full py-4 border border-primary/40 text-[9px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 ${sendSuccess ? 'bg-green-500/10 border-green-500 text-green-500' : 'hover:bg-primary hover:text-background'}`}>{sendingEmail ? 'Sending...' : sendSuccess ? 'Sent' : 'Send via Gmail'}</button>
                                )}
                                {mode === "schedule" && rawSchedule && (
                                  <div className="flex gap-2">
                                    <button onClick={handleScheduleToCalendar} disabled={scheduling || scheduleSuccess} className={`flex-1 py-4 border border-primary/40 text-[9px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 ${scheduleSuccess ? 'bg-green-500/10 border-green-500 text-green-500' : 'hover:bg-primary hover:text-background'}`}>
                                      {scheduling ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
                                      {scheduling ? 'Scheduling...' : scheduleSuccess ? 'Saved' : 'Save to Calendar'}
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}

                            {mode === "history" && (
                              <div className="space-y-4">
                                {loadingHistory ? (
                                  <div className="py-12 text-center opacity-20"><RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" /><p className="text-[8px] uppercase tracking-widest">Retrieving AI History...</p></div>
                                ) : history.length === 0 ? (
                                  <div className="py-12 text-center opacity-20"><Inbox className="w-6 h-6 mx-auto mb-2" /><p className="text-[8px] uppercase tracking-widest">No Logs Found</p></div>
                                ) : (
                                  history.map((item) => (
                                    <div key={item._id} className="p-3 border border-primary/10 bg-primary/[0.02] hover:bg-primary/[0.05] transition-colors group">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[7px] px-1.5 py-0.5 border border-primary/20 rounded-full uppercase tracking-widest ${item.type === 'summary' ? 'text-blue-400' : item.type === 'reply' ? 'text-green-400' : 'text-purple-400'}`}>{item.type}</span>
                                        <span className="text-[7px] opacity-30">{new Date(item.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-[9px] font-bold truncate mb-1 opacity-80">{item.subject}</p>
                                      <p className="text-[10px] leading-relaxed opacity-60 line-clamp-3 font-sans italic">"{item.aiResult}"</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </motion.aside>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-10"><LayoutDashboard className="w-20 h-20 mb-4" /><p className="text-[10px] uppercase tracking-[0.6em]">System Standby</p></div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Mobile AI Overlay */}
        {isMobile && activeTab === "ai" && (
          <div className="fixed inset-0 top-14 bottom-16 bg-background z-40 flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">AI Assistant</span>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex p-1 bg-primary/5 border border-primary/10">
                {(["reply", "summary", "schedule"] as Mode[]).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 text-[8px] uppercase tracking-[0.2em] ${mode === m ? 'bg-primary text-background' : 'text-primary/40'}`}>{m}</button>
                ))}
              </div>
              <button onClick={handleGenerate} className="w-full py-4 bg-primary text-background text-[10px] font-bold uppercase tracking-[0.4em]">Generate</button>
              {generated && <div className="p-4 border border-primary/20 text-[11px] whitespace-pre-wrap">{generated}</div>}
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="h-16 flex-shrink-0 flex items-center justify-around bg-background border-t border-primary/10 z-50">
            {[
              { id: "inbox", icon: <Inbox className="w-5 h-5" />, label: "Inbox" },
              { id: "ai", icon: <Sparkles className="w-5 h-5" />, label: "AI Assistant" },
              { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Tools" }
            ].map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as MobileTab); if (tab.id === "inbox") setMobileView("list"); }} className={`flex flex-col items-center gap-1 transition-all duration-200 relative ${activeTab === tab.id ? "text-primary" : "text-primary/30"}`}>
                {activeTab === tab.id && <div className="absolute -top-3 w-8 h-0.5 bg-primary" />}
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
