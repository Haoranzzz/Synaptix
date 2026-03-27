import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  LineChart, 
  Newspaper, 
  BrainCircuit, 
  Star, 
  ActivitySquare,
  Settings,
  Menu,
  X,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { AuthModal } from '../auth/AuthModal';

const navItems = [
  { icon: Home, label: '首页', href: '/' },
  { icon: LineChart, label: '行情', href: '/quotes' },
  { icon: Newspaper, label: '资讯', href: '/news' },
  { icon: BrainCircuit, label: 'AI 洞察', href: '/ai-insights' },
  { icon: Star, label: '自选', href: '/watchlist' },
  { icon: ActivitySquare, label: '信号', href: '/signals' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const renderContent = (isMobile: boolean) => (
    <>
      <div className="flex items-center h-16 px-6 border-b border-border justify-between shrink-0 relative">
        {(!collapsed || isMobile) && (
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-primary font-bold text-xl active:scale-95 transition-transform">
            <BrainCircuit className="w-6 h-6" />
            <span>Synaptix</span>
          </Link>
        )}
        {collapsed && !isMobile && (
          <div className="w-full flex justify-center text-primary">
            <BrainCircuit className="w-6 h-6" />
          </div>
        )}
        {!isMobile && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "text-text-muted hover:text-text-main p-1.5 hover:bg-surface-hover rounded-lg transition-colors hidden md:flex items-center justify-center", 
              collapsed ? "absolute -right-3 top-1/2 -translate-y-1/2 bg-surface border border-border rounded-full z-50 shadow-md w-6 h-6" : ""
            )}
          >
            <Menu className={cn("w-5 h-5", collapsed && "w-3 h-3")} />
          </button>
        )}
        {isMobile && (
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-text-muted hover:text-text-main p-2 hover:bg-surface-hover rounded-xl transition-all active:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-xl transition-all active:scale-[0.97]",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 font-semibold" 
                  : "text-text-muted hover:bg-surface-hover hover:text-text-main",
                collapsed && !isMobile && "justify-center px-2"
              )}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "")} />
              {(!collapsed || isMobile) && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-border bg-background/50 backdrop-blur-sm shrink-0 flex flex-col gap-2">
        {user ? (
          <div className={cn(
            "bg-surface-hover rounded-2xl border border-border/50 shadow-inner overflow-hidden transition-all duration-300",
            collapsed && !isMobile ? "p-2" : "p-3"
          )}>
            <div className={cn(
              "flex items-center gap-3",
              collapsed && !isMobile && "justify-center"
            )}>
              <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="relative shrink-0 hover:opacity-80 transition-opacity" title="个人设置">
                <img src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} alt="avatar" className={cn(
                  "rounded-full border-2 border-primary/20 shadow-sm object-cover",
                  collapsed && !isMobile ? "w-8 h-8" : "w-10 h-10"
                )} />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-surface rounded-full"></div>
              </Link>
              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-main truncate">{user.user_metadata?.display_name || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-text-muted truncate opacity-70">{user.email}</p>
                </div>
              )}
            </div>
            
            {(!collapsed || isMobile) && (
              <div className="mt-3 flex gap-2">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-text-muted hover:bg-background transition-all text-xs font-medium border border-border"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>设置</span>
                </Link>
                <button 
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-down hover:bg-down/10 transition-all text-xs font-medium border border-border hover:border-down/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>退出</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button 
              onClick={() => {
                setIsAuthModalOpen(true);
                // setMobileMenuOpen(false); // Keep sidebar open on mobile so it doesn't look like it's hidden behind
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary-hover transition-all font-bold shadow-lg shadow-primary/20 active:scale-95",
                collapsed && !isMobile && "px-0"
              )}
              title={collapsed && !isMobile ? "登录" : undefined}
            >
              <UserIcon className={cn("shrink-0", collapsed && !isMobile ? "w-6 h-6" : "w-5 h-5")} />
              {(!collapsed || isMobile) && <span>立即登录</span>}
            </button>
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-xl text-text-muted hover:bg-surface-hover hover:text-text-main transition-all active:scale-[0.97]",
                collapsed && !isMobile && "justify-center px-2"
              )}
              title={collapsed && !isMobile ? "设置" : undefined}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {(!collapsed || isMobile) && <span className="text-sm">设置</span>}
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-surface/95 backdrop-blur-md border-b border-border sticky top-0 z-30 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <BrainCircuit className="w-7 h-7" />
          <span>Synaptix</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
             <button 
              onClick={() => setMobileMenuOpen(true)}
              className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden ring-2 ring-primary/10 transition-all active:scale-95"
            >
              <img src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} alt="avatar" className="w-full h-full object-cover" />
            </button>
          ) : (
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-text-muted hover:text-text-main transition-colors active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside 
        className={cn(
          "fixed md:sticky top-0 z-[50] h-screen flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out shadow-xl md:shadow-none",
          // Mobile classes
          "left-0 w-[280px] transform md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop classes
          collapsed ? "md:w-[80px]" : "md:w-[240px]"
        )}
      >
        {renderContent(mobileMenuOpen)}
      </aside>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
