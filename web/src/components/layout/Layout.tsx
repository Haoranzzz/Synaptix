import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Search, Bell, User as UserIcon, Info, ExternalLink, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { AuthModal } from '../auth/AuthModal';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

export function Layout() {
  const { user, initialize, signOut } = useAuthStore();
  useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showDevTips, setShowDevTips] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex h-screen bg-background text-text-main flex-col md:flex-row overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="hidden md:flex h-16 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-10 px-6 items-center justify-between shrink-0">
          <div className="flex items-center flex-1 max-w-md gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="搜索资产、主题、资讯..." 
                className="w-full bg-surface border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowDevTips(!showDevTips)}
                className={cn(
                  "p-2 rounded-full transition-all active:scale-90",
                  showDevTips ? "bg-primary/20 text-primary" : "text-text-muted hover:text-text-main hover:bg-surface-hover"
                )}
                title="系统提示"
              >
                <Info className="w-5 h-5" />
              </button>

              {showDevTips && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      开发与调试建议
                    </h3>
                    <button onClick={() => setShowDevTips(false)} className="text-text-muted hover:text-text-main">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs text-text-muted leading-relaxed">
                        为了获得最佳开发体验，建议安装 <strong>React DevTools</strong>：
                      </p>
                      <a 
                        href="https://react.dev/link/react-devtools" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary font-medium hover:bg-primary/10 transition-colors"
                      >
                        下载 React DevTools
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                      <p className="text-[11px] text-yellow-500 font-medium leading-relaxed">
                        注意：如果遇到扩展连接错误（如 Zotero），请尝试在无痕模式下运行或暂时禁用冲突的浏览器扩展。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-text-muted hover:text-text-main transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full border border-border hover:bg-surface-hover transition-colors">
                  <span className="text-sm font-medium">{user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}</span>
                  <img src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} alt="avatar" className="w-8 h-8 rounded-full bg-surface-hover" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-text-main truncate">{user.user_metadata?.display_name || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <button 
                      onClick={() => window.location.href = '/settings'} 
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-text-muted" />
                      个人信息
                    </button>
                    <button 
                      onClick={signOut} 
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-down hover:bg-down/10 rounded-lg transition-colors mt-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full border border-border hover:bg-surface-hover transition-colors">
                <span className="text-sm font-medium">登录</span>
                <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-text-muted" />
                </div>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
