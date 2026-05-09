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
import { sounds } from "@/lib/sounds";

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
  const [generatedOutputs, setGeneratedOutputs] = useState<Record<string, string | null>>({
    reply: null,
    summary: null,
    schedule: null
  });
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
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1200);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [activeTab, setActiveTab] = useState<MobileTab>("inbox");
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false); // Default closed on tablet/small screens
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFolderSwitcher, setShowFolderSwitcher] = useState(false);
  
  const initialized = useRef(false);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1200;
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      if (width > 1200) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
      
      // Auto-open AI panel only on large desktops
      if (width > 1400) setIsAiPanelOpen(true);
      else setIsAiPanelOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY + ':email');
    window.localStorage.removeItem(STORAGE_KEY + ':token');
    navigate('/');
  }, [navigate]);

  const fetchInbox = useCallback(async (email: string, label: string = 'INBOX', isBackgroundPoll: boolean = false) => {
    if (!isBackgroundPoll) {
      setLoadingEmails(true);
      setSelectedEmailIds([]); // Clear selections when folder changes
    }
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
        // Only update selected email on manual fetch, not background poll
        // Background polling updating selectedEmail causes Framer Motion removeChild crash
        if (!isBackgroundPoll && !isMobile) {
          setSelectedEmail(prev => {
            if (prev && data.emails.find((e: EmailMessage) => e.id === prev.id)) {
              return data.emails.find((e: EmailMessage) => e.id === prev.id);
            }
            return data.emails.length > 0 ? data.emails[0] : null;
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch inbox:", error);
    } finally {
      if (!isBackgroundPoll) setLoadingEmails(false);
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

      if (mode === "reply") {
        const result = data.reply;
        setGenerated(result);
        setGeneratedOutputs(prev => ({ ...prev, reply: result }));
        sounds.playSuccess();
      } else if (mode === "summary") {
        const result = data.summary;
        setGenerated(result);
        setGeneratedOutputs(prev => ({ ...prev, summary: result }));
        sounds.playSuccess();
      } else if (mode === "schedule") {
        if (data.error) setGenerated("AI could not detect a meeting.");
        else {
          setRawSchedule(data);
          const result = `📅 Event: ${data.title}\n📍 Location: ${data.location || 'TBD'}\n📝 Note: ${data.description}`;
          setGenerated(result);
          setGeneratedOutputs(prev => ({ ...prev, schedule: result }));
          setCalUrl(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.title)}&dates=${data.startDate}/${data.endDate}&details=${encodeURIComponent(data.description)}&location=${encodeURIComponent(data.location)}`);
          sounds.playSuccess();
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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to schedule");
      }
      setScheduleSuccess(true);
      setTimeout(() => setScheduleSuccess(false), 3000);
    } catch (error) {
      console.error("Schedule Error:", error);
      setAiError(error instanceof Error ? error.message : "Failed to create calendar event");
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
    setGenerated(null);
    setGeneratedOutputs({ reply: null, summary: null, schedule: null });
    setRawSchedule(null);
    setAiError(null);
    if (isMobile) setMobileView("detail");
  };

  // Background Polling for new emails — isBackgroundPoll=true prevents selectedEmail state updates
  useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(() => {
      fetchInbox(userEmail, activeFolder, true);
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userEmail, activeFolder, fetchInbox]);

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
        <>
          {/* Tablet Sidebar Backdrop */}
          <AnimatePresence>
            {isTablet && isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[45]"
              />
            )}
          </AnimatePresence>

          <motion.aside 
            initial={false}
            animate={{ 
              width: isSidebarOpen ? 260 : (isTablet ? 0 : 80),
              x: (isTablet && !isSidebarOpen) ? -260 : 0
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`h-full border-r border-primary/10 bg-background flex flex-col z-50 overflow-hidden shrink-0 
              ${isTablet ? 'fixed inset-y-0 left-0 shadow-2xl border-r-primary/20' : 'relative'}`}
          >
            <div 
              onClick={() => !isTablet && setIsSidebarOpen(!isSidebarOpen)}
              className={`p-6 flex items-center gap-3 border-b border-primary/10 transition-all duration-300 group relative 
                ${!isSidebarOpen && !isTablet ? 'justify-center' : ''} ${!isTablet ? 'cursor-pointer hover:bg-primary/5' : ''}`}
            >
              <div className="relative w-8 h-8 flex items-center justify-center">
                <img src="/favicon.png" alt="Logo" className="w-8 h-8 object-contain transition-all duration-300 group-hover:opacity-0 group-hover:scale-75" />
                {!isTablet && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary">
                    {isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </div>
                )}
              </div>
              {(isSidebarOpen || isTablet) && (
                <span 
                  onClick={(e) => { e.stopPropagation(); navigate("/"); }} 
                  className="font-display tracking-widest text-primary text-xl uppercase whitespace-nowrap hover:opacity-70 transition-opacity cursor-pointer"
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
                     sounds.playTick();
                     if (item.id === "HOME") {
                       navigate("/");
                     } else if (item.id === "ARCHIVE") {
                       // Archive logic
                     } else {
                       setActiveFolder(item.id);
                       fetchInbox(userEmail!, item.id);
                       if (isTablet) setIsSidebarOpen(false); // Auto-close drawer on tablet selection
                     }
                   }} 
                   className={`w-full flex items-center gap-3 p-3 transition-all duration-300 text-xs uppercase tracking-widest group border rounded-sm
                     ${activeFolder === item.id ? "bg-primary/20 text-primary border-primary/20" : "hover:bg-primary/10 text-primary/60 hover:text-primary border-transparent"}
                     ${!isSidebarOpen && !isTablet ? 'justify-center' : ''}`}
                 >
                   <span className={`${activeFolder === item.id ? "text-primary" : "text-primary/40 group-hover:text-primary"} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                   {(isSidebarOpen || isTablet) && <span className="flex-1 text-left font-bold">{item.label}</span>}
                   {(isSidebarOpen || isTablet) && item.count !== undefined && <span className="text-[8px] opacity-40 tabular-nums">{item.count}</span>}
                 </button>
               ))}
            </nav>
            <div className="p-4 border-t border-primary/10 bg-primary/[0.01] flex-shrink-0">
              <div className={`flex items-center gap-3 px-2 mb-3 ${!isSidebarOpen && !isTablet ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <User className="w-4 h-4 text-primary/40" />
                </div>
                {(isSidebarOpen || isTablet) && (
                  <div className="flex flex-col truncate">
                    <span className="text-[10px] text-primary font-bold truncate uppercase tracking-widest">{userEmail?.split('@')[0]}</span>
                    <span className="text-[8px] text-primary/40 truncate lowercase">{userEmail}</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 p-3 transition-all duration-300 text-xs uppercase tracking-widest group border border-transparent rounded-sm hover:bg-primary/10 text-primary/60 hover:text-primary ${!isSidebarOpen && !isTablet ? 'justify-center' : ''}`}
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors" />
                {(isSidebarOpen || isTablet) && <span className="font-bold">Logout</span>}
              </button>
            </div>
          </motion.aside>
        </>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {(isMobile || isTablet) && (
          <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-primary/10 bg-background/95 z-50">
            <div className="flex items-center gap-4">
              {isTablet && (
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 -ml-2 text-primary/60 hover:text-primary transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div 
                onClick={() => navigate("/")}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
                  <span className="font-display tracking-widest text-primary text-xs uppercase">MailMind</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 transition-colors relative ${showNotifications ? 'text-primary' : 'text-primary/60 hover:text-primary'}`}
                >
                  <Bell className="w-4 h-4" />
                  {history.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-background shadow-sm animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifications(false)} />
                )}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      key="notifications"
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-72 bg-background border border-primary/20 shadow-[0_10px_40px_rgba(255,255,255,0.1)] z-[70] overflow-hidden"
                    >
                        <div className="p-3 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
                          <p className="text-[8px] uppercase tracking-widest text-primary/40">Recent Activity</p>
                          <button onClick={() => fetchHistory()} className="text-[8px] text-primary hover:underline transition-all">Refresh</button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          {history.length === 0 ? (
                            <div className="p-8 text-center opacity-30">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                              <p className="text-[8px] uppercase tracking-widest">No new updates</p>
                            </div>
                          ) : (
                            history.slice(0, 5).map((item) => (
                              <div key={item._id} className="p-4 border-b border-primary/5 hover:bg-primary/5 transition-colors cursor-pointer group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-[6px] px-1.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-tighter ${item.type === 'summary' ? 'text-blue-400' : 'text-green-400'}`}>
                                    {item.type}
                                  </span>
                                  <span className="text-[6px] opacity-30">{new Date(item.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-[9px] font-bold text-primary/80 truncate">{item.subject}</p>
                                <p className="text-[8px] text-primary/40 line-clamp-1 italic">{item.aiResult}</p>
                              </div>
                            ))
                          )}
                        </div>
                        {history.length > 0 && (
                          <button 
                            onClick={() => { setShowNotifications(false); setMode("history"); setIsAiPanelOpen(true); }}
                            className="w-full p-3 text-center bg-primary/5 hover:bg-primary/10 text-[8px] uppercase tracking-[0.2em] font-bold transition-colors border-t border-primary/10"
                          >
                            View Full History →
                          </button>
                        )}
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-colors"
                  title="User Menu"
                >
                  <User className="w-3.5 h-3.5 text-primary/40" />
                </button>

                {showUserMenu && (
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowUserMenu(false)} />
                )}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      key="user-menu"
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-44 bg-background border border-primary/20 shadow-[0_10px_40px_rgba(255,255,255,0.1)] z-[70] overflow-hidden"
                    >
                        <div className="p-3 border-b border-primary/10 bg-primary/5">
                          <p className="text-[8px] uppercase tracking-widest text-primary/40 mb-1">User Account</p>
                          <p className="text-[10px] text-primary truncate font-bold">{userEmail}</p>
                        </div>
                        
                        <button 
                          onClick={() => { setShowUserMenu(false); handleLogout(); }}
                          className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-primary/5 transition-colors group"
                        >
                          <RefreshCcw className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] uppercase tracking-widest text-primary/80 group-hover:text-primary">Clear Session</span>
                        </button>
                        
                        <button 
                          onClick={() => { setShowUserMenu(false); handleLogout(); }}
                          className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-primary/5 transition-colors group border-t border-primary/10"
                        >
                          <LogOut className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary transition-colors" />
                          <span className="text-[10px] uppercase tracking-widest text-primary/80 group-hover:text-primary">Logout</span>
                        </button>
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {/* Inbox List */}
          <motion.div 
            animate={{ x: isMobile && mobileView === "detail" ? "-100%" : "0%", opacity: isMobile && mobileView === "detail" ? 0 : 1 }}
            className={`flex flex-col bg-background border-r border-primary/10 z-10 transition-all duration-300 shrink-0
              ${isMobile ? "fixed inset-x-0 top-14 bottom-16" : isTablet ? (isAiPanelOpen ? "w-0 opacity-0 overflow-hidden" : "w-[260px]") : "w-[360px] lg:w-[400px]"}`}
          >
            <div className="p-5 border-b border-primary/10 bg-primary/[0.01] flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowFolderSwitcher(!showFolderSwitcher)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 border border-primary/10 rounded-sm transition-all duration-200
                        ${showFolderSwitcher ? 'bg-primary text-background border-primary' : 'bg-primary/5 text-primary/40 hover:text-primary hover:bg-primary/10'}`}
                    >
                      <span className="text-[9px] uppercase tracking-[0.3em] font-black">
                        {activeFolder}
                      </span>
                      <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${showFolderSwitcher ? 'rotate-90' : ''}`} />
                    </button>

                    {showFolderSwitcher && (
                      <div className="fixed inset-0 z-40" onClick={() => setShowFolderSwitcher(false)} />
                    )}
                    <AnimatePresence>
                      {showFolderSwitcher && (
                        <motion.div 
                          key="folder-switcher"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 mt-3 w-48 bg-background border border-primary/20 shadow-2xl z-50 p-1"
                        >
                            {[
                              { id: 'INBOX', label: 'Inbox', icon: <Inbox className="w-3.5 h-3.5" /> },
                              { id: 'STARRED', label: 'Starred', icon: <Star className="w-3.5 h-3.5" /> },
                              { id: 'SENT', label: 'Sent', icon: <Send className="w-3.5 h-3.5" /> },
                              { id: 'TRASH', label: 'Trash', icon: <Trash2 className="w-3.5 h-3.5" /> },
                            ].map((f) => (
                              <button
                                key={f.id}
                                onClick={() => {
                                  setActiveFolder(f.id);
                                  fetchInbox(userEmail!, f.id);
                                  setShowFolderSwitcher(false);
                                  sounds.playTick();
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-[9px] uppercase tracking-widest transition-colors
                                  ${activeFolder === f.id ? 'bg-primary text-background font-bold' : 'hover:bg-primary/5 text-primary/60'}`}
                              >
                                {f.icon}
                                {f.label}
                              </button>
                            ))}
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
                       className={`absolute left-0 top-0 bottom-0 w-1.5 bg-primary ${!isMobile ? "shadow-[0_0_15px_rgba(255,255,255,0.3)]" : ""}`} 
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
                            ${email.category === 'Action Required' ? 'border-primary text-primary bg-primary/10' : 
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
                <motion.div key={selectedEmail.id} className="flex flex-col h-full overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex-1 flex overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar bg-primary/[0.02] flex flex-col items-center">
                      <div className="w-full max-w-4xl space-y-6">
                        {/* Email Header Card */}
                        <div className="p-6 bg-background border border-primary/10 rounded-sm">
                          <h1 className="text-xl md:text-3xl font-title font-extrabold mb-6 tracking-tight leading-tight text-primary uppercase">
                            {selectedEmail.subject || '(NO SUBJECT)'}
                          </h1>
                          <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary font-black border-2 border-primary/20 text-xl shadow-[4px_4px_0px_rgba(var(--primary-rgb),0.1)]">
                                {selectedEmail.from.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-[0.3em] text-primary/40 mb-0.5">Sender</span>
                                <span className="text-primary font-black tracking-widest uppercase text-xs md:text-sm">
                                  {selectedEmail.from.includes('<') ? selectedEmail.from.split('<')[0].trim() : 'System/Service'}
                                </span>
                                <span className="text-primary/60 lowercase tracking-tight text-[10px] font-medium opacity-80">
                                  {selectedEmail.from.match(/<([^>]+)>/)?.[1] || selectedEmail.from}
                                </span>
                              </div>
                            </div>
                            
                            <div className="md:ml-auto flex flex-col md:items-end">
                              <span className="text-[8px] uppercase tracking-[0.3em] text-primary/40 mb-0.5">Received At</span>
                              <span className="text-primary/60 uppercase tracking-[0.15em] text-[9px] font-bold">
                                {selectedEmail.date}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Email Content Card */}
                        <div className="w-full font-sans text-black leading-relaxed overflow-x-auto bg-white border border-primary/10 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] custom-scrollbar">
                          {selectedEmail.body && /<[a-z][\s\S]*>/i.test(selectedEmail.body) ? (
                            <div 
                              className="email-content-wrapper p-4 md:p-12"
                              dangerouslySetInnerHTML={{ __html: selectedEmail.body }} 
                            />
                          ) : (
                            <div className="p-8 md:p-12 font-mono text-[12px] md:text-[14px] text-black leading-loose whitespace-pre-wrap">
                              {selectedEmail.body || selectedEmail.snippet}
                            </div>
                          )}
                        </div>
                      </div>
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
                            ${isTablet ? "relative w-[300px]" : "relative w-[400px]"}`}
                        >
                          <div className="p-5 border-b border-primary/10 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-primary" /><span className="text-[10px] font-bold uppercase tracking-[0.4em]">AI Assistant</span></div>
                            <button onClick={() => setIsAiPanelOpen(false)} className="p-1 hover:text-primary transition-colors"><PanelRightClose className="w-4 h-4" /></button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="flex p-1 bg-primary/5 border border-primary/10 rounded-sm">
                              {(["reply", "summary", "schedule", "history"] as Mode[]).map((m) => (
                                <button key={m} onClick={() => { setMode(m); setAiError(null); }} className={`flex-1 py-2 text-[8px] uppercase tracking-[0.2em] rounded-sm transition-all ${mode === m ? 'bg-primary text-background font-bold' : 'text-primary/40 hover:text-primary/60'}`}>{m}</button>
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
                               className="w-full py-5 border border-primary text-primary text-[10px] uppercase tracking-[0.5em] font-black hover:bg-primary hover:text-background transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                             >
                               {pendingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />}
                               {pendingAI ? "PROCESSING..." : `PROCESS ${mode}`}
                             </button>
                            {(generatedOutputs[mode] || (mode === "history" && generated)) && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="p-4 border border-primary/20 bg-primary/[0.05] backdrop-blur-md">
                                  <div className="flex justify-between items-center mb-2"><span className="text-[7px] uppercase tracking-widest opacity-40">Output</span><button onClick={() => { navigator.clipboard.writeText(generatedOutputs[mode] || generated!); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-[7px] uppercase tracking-widest opacity-40 hover:opacity-100">{copied ? 'COPIED' : 'COPY'}</button></div>
                                  <p className="text-[11px] leading-relaxed text-primary/90 whitespace-pre-wrap font-sans">{generatedOutputs[mode] || generated}</p>
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
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-10">
                  <LayoutDashboard className="w-20 h-20 mb-4" />
                  <p className="text-[10px] uppercase tracking-[0.6em]">System Standby</p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Mobile AI Overlay */}
        {isMobile && activeTab === "ai" && (
          <div className="fixed inset-0 top-14 bottom-16 bg-background z-40 flex flex-col p-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchHistory()} className="p-2 text-primary/40 hover:text-primary"><RefreshCcw className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex p-1 bg-primary/5 border border-primary/10 rounded-sm">
                {(["reply", "summary", "schedule", "history"] as Mode[]).map((m) => (
                  <button key={m} onClick={() => { setMode(m); }} className={`flex-1 py-2 text-[8px] uppercase tracking-[0.2em] rounded-sm transition-all ${mode === m ? 'bg-primary text-background font-bold' : 'text-primary/40 hover:text-primary/60'}`}>{m}</button>
                ))}
              </div>

              {aiError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 flex items-start gap-3 rounded-sm">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-red-500/70 leading-relaxed">{aiError}</p>
                </div>
              )}

              {mode === "reply" && (
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="INSTRUCTIONS..." className="w-full bg-primary/[0.02] border border-primary/10 p-4 text-[10px] h-24 resize-none outline-none focus:border-primary/40 uppercase tracking-widest placeholder:opacity-10" />
              )}

              <button 
                onClick={handleGenerate} 
                disabled={pendingAI} 
                className="w-full py-5 bg-primary text-background text-[10px] uppercase tracking-[0.5em] font-black active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {pendingAI ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />}
                {pendingAI ? "PROCESSING..." : `PROCESS ${mode}`}
              </button>

              {(generatedOutputs[mode] || (mode === "history" && generated)) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
                  <div className="p-4 border border-primary/20 bg-primary/[0.05]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[7px] uppercase tracking-widest opacity-40">AI Output</span>
                      <button onClick={() => { navigator.clipboard.writeText(generatedOutputs[mode] || generated!); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-[7px] uppercase tracking-widest opacity-40">{copied ? 'COPIED' : 'COPY'}</button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-primary/90 whitespace-pre-wrap font-sans">{generatedOutputs[mode] || generated}</p>
                  </div>
                  
                  {mode === "reply" && (
                    <button onClick={handleSendReply} disabled={sendingEmail || sendSuccess} className={`w-full py-4 border border-primary/40 text-[9px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 ${sendSuccess ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-primary text-background'}`}>{sendingEmail ? 'Sending...' : sendSuccess ? 'Sent' : 'Send via Gmail'}</button>
                  )}

                  {mode === "schedule" && rawSchedule && (
                    <button onClick={handleScheduleToCalendar} disabled={scheduling || scheduleSuccess} className={`w-full py-4 border border-primary/40 text-[9px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 ${scheduleSuccess ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-primary text-background'}`}>
                      {scheduling ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
                      {scheduling ? 'Scheduling...' : scheduleSuccess ? 'Saved' : 'Save to Calendar'}
                    </button>
                  )}
                </div>
              )}

              {mode === "history" && (
                <div className="space-y-4">
                  {loadingHistory ? (
                    <div className="py-12 text-center opacity-20"><RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" /><p className="text-[8px] uppercase tracking-widest">Loading...</p></div>
                  ) : history.length === 0 ? (
                    <div className="py-12 text-center opacity-20"><Inbox className="w-6 h-6 mx-auto mb-2" /><p className="text-[8px] uppercase tracking-widest">No Logs</p></div>
                  ) : (
                    history.map((item) => (
                      <div key={item._id} className="p-3 border border-primary/10 bg-primary/[0.02]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[7px] uppercase tracking-widest text-primary/40">{item.type}</span>
                          <span className="text-[7px] opacity-30">{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[9px] font-bold truncate opacity-80">{item.subject}</p>
                        <p className="text-[10px] leading-relaxed opacity-60 line-clamp-2 font-sans italic">"{item.aiResult}"</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Tools Overlay */}
        {isMobile && activeTab === "settings" && (
          <div className="fixed inset-0 top-14 bottom-16 bg-background z-40 flex flex-col p-6 animate-in slide-in-from-right duration-300 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 mb-8">
              <Settings className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">System Tools</span>
            </div>
            
            <div className="space-y-8">
              <div className="p-6 border border-primary/10 bg-primary/[0.02]">
                <p className="text-[8px] uppercase tracking-[0.3em] text-primary/40 mb-4 font-bold">Account Profile</p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <User className="w-6 h-6 text-primary/40" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs text-primary font-black truncate uppercase tracking-widest">{userEmail?.split('@')[0]}</span>
                    <span className="text-[10px] text-primary/40 truncate lowercase">{userEmail}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-red-500/20 transition-all rounded-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout System
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.3em] text-primary/40 font-bold">Quick Actions</p>
                <button onClick={() => { setActiveTab("inbox"); fetchInbox(userEmail!, activeFolder); }} className="w-full p-4 border border-primary/10 text-left flex items-center justify-between group">
                  <span className="text-[9px] uppercase tracking-widest">Force Sync Inbox</span>
                  <RefreshCcw className="w-3.5 h-3.5 text-primary/20 group-active:animate-spin" />
                </button>
                <button onClick={() => { setActiveTab("ai"); setMode("history"); }} className="w-full p-4 border border-primary/10 text-left flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest">View AI Logs</span>
                  <ChevronRight className="w-3.5 h-3.5 text-primary/20" />
                </button>
              </div>
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
