import { FC, ReactNode } from "react";
import { motion } from "framer-motion";
import { Mail, Calendar, Settings, Inbox, Send, FileText, ChevronRight } from "lucide-react";

const DashboardPreview: FC = () => {
  return (
    <section className="py-32 px-4 max-w-7xl mx-auto overflow-hidden">
      <div className="mb-16 flex flex-col items-center text-center gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary/40">Product Experience</span>
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-primary uppercase leading-tight max-w-4xl">
          Everything you need <br /> to own your inbox.
        </h2>
      </div>

      <div className="relative group">
        {/* Decorative elements */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* The Dashboard Frame */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-background border border-primary/20 shadow-[0_0_100px_rgba(255,0,0,0.05)] rounded-sm overflow-hidden flex flex-col md:flex-row min-h-[600px] w-full"
        >
          {/* Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-primary/15 bg-primary/[0.02] flex flex-col p-6 gap-8">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="MailMind Logo" className="w-8 h-8 object-contain" />
              <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">MailMind</span>
            </div>

            <div className="flex flex-col gap-2">
              <SidebarItem icon={<Inbox className="w-4 h-4" />} label="Smarter Inbox" active count="12" />
              <SidebarItem icon={<Mail className="w-4 h-4" />} label="Drafted Replies" count="4" />
              <SidebarItem icon={<Calendar className="w-4 h-4" />} label="AI Schedule" />
              <SidebarItem icon={<Send className="w-4 h-4" />} label="Sent" />
              <SidebarItem icon={<FileText className="w-4 h-4" />} label="Summaries" />
            </div>

            <div className="mt-auto pt-8 border-t border-primary/10">
              <SidebarItem icon={<Settings className="w-4 h-4" />} label="Settings" />
            </div>
          </div>

          {/* Main View */}
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b border-primary/15 px-8 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-primary/40">Inbox Overview</span>
              <div className="flex items-center gap-4">
                <div className="h-2 w-24 bg-primary/10 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-primary w-[65%]" />
                </div>
                <span className="font-mono text-[10px] text-primary/60 uppercase">65% Optimized</span>
              </div>
            </header>

            <main className="p-4 md:p-8 flex flex-col gap-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatusCard title="AI PROCESSING" value="ACTIVE" pulse />
                <StatusCard title="TIME SAVED" value="4.2H" />
              </div>

              <div className="space-y-4">
                <p className="font-mono text-xs uppercase tracking-widest text-primary/30">Recent Intelligent Actions</p>
                <InboxRow 
                  sender="Sarah Lin" 
                  subject="Q3 Budget Review" 
                  status="Reply Drafted" 
                  time="2m ago" 
                  color="primary"
                />
                <InboxRow 
                  sender="David North" 
                  subject="Discovery Call" 
                  status="Meeting Detected" 
                  time="15m ago" 
                  color="accent"
                />
                <InboxRow 
                  sender="Newsletter" 
                  subject="Market Update" 
                  status="Auto-Summarized" 
                  time="1h ago"
                />
              </div>

              {/* AI Insight Box */}
              <div className="mt-4 p-6 bg-primary/[0.04] border border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Mail className="w-16 h-16" />
                </div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-primary mb-2">MailMind Insight</h4>
                <p className="font-mono text-xs text-primary/60 leading-relaxed max-w-lg">
                  I've detected a high-priority meeting request from your biggest client. 
                  Would you like me to block out Wednesday 2pm PT on your calendar?
                </p>
                <button className="mt-4 font-mono text-[10px] uppercase tracking-widest bg-primary text-background px-4 py-2 hover:bg-primary/90 transition-colors">
                  Take Action →
                </button>
              </div>
            </main>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const SidebarItem = ({ icon, label, active = false, count }: { icon: ReactNode, label: string, active?: boolean, count?: string }) => (
  <div className={`flex items-center justify-between p-3 cursor-pointer group transition-colors ${active ? "bg-primary text-background" : "hover:bg-primary/5 text-primary/60 hover:text-primary"}`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
    </div>
    {count && <span className={`text-[9px] px-1.5 py-0.5 font-mono ${active ? "bg-background text-primary" : "bg-primary/10 text-primary/60"}`}>{count}</span>}
  </div>
);

const StatusCard = ({ title, value, pulse = false }: { title: string, value: string, pulse?: boolean }) => (
  <div className="border border-primary/15 p-5 bg-primary/[0.02] flex flex-col gap-2">
    <span className="font-mono text-[10px] uppercase tracking-widest text-primary/40">{title}</span>
    <div className="flex items-center gap-3">
      {pulse && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
      <span className="font-display text-3xl text-primary">{value}</span>
    </div>
  </div>
);

const InboxRow = ({ sender, subject, status, time, color = "muted" }: { sender: string, subject: string, status: string, time: string, color?: string }) => (
  <div className="group flex items-center justify-between p-4 border border-primary/10 hover:border-primary/30 transition-colors bg-background">
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-bold text-primary">{sender}</span>
        <span className="font-mono text-[10px] text-primary/30 tracking-widest">{subject}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 ${color === "primary" ? "bg-primary/20 text-primary" : "bg-primary/5 text-primary/40"}`}>
          {status}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span className="font-mono text-[10px] text-primary/30">{time}</span>
      <ChevronRight className="w-4 h-4 text-primary/20 group-hover:text-primary transition-colors" />
    </div>
  </div>
);

export default DashboardPreview;
