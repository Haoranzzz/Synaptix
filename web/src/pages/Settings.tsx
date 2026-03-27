import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth';
import { User, Settings as SettingsIcon, Bell, Shield, Palette, Globe, LogOut, CheckCircle2, Key, Info, Trash2, Zap, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type TabType = 'profile' | 'preferences' | 'notifications' | 'security' | 'api' | 'about';

export function Settings() {
  const { user, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '');

  // Preferences State (using localStorage)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [refreshRate, setRefreshRate] = useState(localStorage.getItem('refresh_rate') || '30s');
  const [defaultPage, setDefaultPage] = useState(localStorage.getItem('default_page') || 'home');

  // API State
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('custom_openai_key') || '');
  const [showKey, setShowKey] = useState(false);

  const handleSavePreferences = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('refresh_rate', refreshRate);
    localStorage.setItem('default_page', defaultPage);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('custom_openai_key', openaiKey);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });
      
      if (authError) throw authError;

      // Update Public Profile if it exists
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', user.id);
        
      if (profileError) {
        console.error('Failed to update public profile, might not exist yet.', profileError);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: '个人信息', icon: User },
    { id: 'preferences', label: '偏好设置', icon: Palette },
    { id: 'notifications', label: '消息通知', icon: Bell },
    { id: 'security', label: '账号安全', icon: Shield },
    { id: 'api', label: 'API 设置', icon: Key },
    { id: 'about', label: '关于应用', icon: Info },
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-4">
          <SettingsIcon className="w-8 h-8 text-text-muted" />
        </div>
        <h2 className="text-xl font-bold text-text-main mb-2">需要登录</h2>
        <p className="text-text-muted mb-6 text-center max-w-md">请先登录您的 Synaptix 账号以访问和修改个人设置。</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-main mb-2">设置</h1>
        <p className="text-text-muted">管理您的账号信息和应用偏好</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Card className="md:w-64 shrink-0 h-fit bg-surface/50 backdrop-blur-sm border-border shadow-sm">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      activeTab === tab.id
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-text-muted hover:bg-surface-hover hover:text-text-main"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-border">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-down hover:bg-down/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="bg-surface/50 backdrop-blur-sm border-border shadow-sm">
                <CardHeader>
                  <CardTitle>个人资料</CardTitle>
                  <CardDescription>更新您的头像和基本信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                      <img 
                        src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=random`} 
                        alt="avatar" 
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-surface shadow-lg object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-medium">更换头像</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-main text-lg">{displayName}</h3>
                      <p className="text-sm text-text-muted">{user.email}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 border-t border-border">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-text-main">显示名称</label>
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="max-w-md bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="请输入您的昵称"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-text-main">电子邮箱</label>
                      <input 
                        type="email" 
                        value={user.email || ''}
                        disabled
                        className="max-w-md bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-text-muted">邮箱地址目前不支持修改</p>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                      <button 
                        type="submit"
                        disabled={isSaving || !displayName.trim()}
                        className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? '保存中...' : '保存更改'}
                      </button>
                      {saveSuccess && (
                        <span className="flex items-center gap-1.5 text-sm text-green-500 animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4" />
                          已保存
                        </span>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="bg-surface/50 backdrop-blur-sm border-border shadow-sm">
                <CardHeader>
                  <CardTitle>外观与偏好</CardTitle>
                  <CardDescription>自定义您的 Synaptix 体验</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-text-main mb-1">主题模式</h4>
                      <p className="text-sm text-text-muted">选择您喜欢的界面颜色主题</p>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-background border border-border rounded-xl">
                      <button 
                        onClick={() => setTheme('dark')}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                          theme === 'dark' ? "bg-surface-hover text-text-main shadow-sm" : "text-text-muted hover:text-text-main"
                        )}
                      >
                        暗色
                      </button>
                      <button 
                        onClick={() => setTheme('light')}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                          theme === 'light' ? "bg-surface-hover text-text-main shadow-sm" : "text-text-muted hover:text-text-main"
                        )}
                      >
                        浅色
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-t border-border">
                    <div>
                      <h4 className="font-medium text-text-main mb-1">默认启动页</h4>
                      <p className="text-sm text-text-muted">设置登录后默认跳转的页面</p>
                    </div>
                    <select 
                      value={defaultPage}
                      onChange={(e) => setDefaultPage(e.target.value)}
                      className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="home">首页工作台</option>
                      <option value="quotes">行情中心</option>
                      <option value="watchlist">我的自选</option>
                      <option value="ai-insights">AI 洞察</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-border">
                    <div>
                      <h4 className="font-medium text-text-main mb-1 flex items-center gap-2">
                        <RefreshCcw className="w-4 h-4 text-primary" />
                        行情刷新频率
                      </h4>
                      <p className="text-sm text-text-muted">设置实时数据的更新间隔</p>
                    </div>
                    <select 
                      value={refreshRate}
                      onChange={(e) => setRefreshRate(e.target.value)}
                      className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="10s">10秒 (极速)</option>
                      <option value="30s">30秒 (默认)</option>
                      <option value="1m">1分钟</option>
                      <option value="manual">手动刷新</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-border">
                    <div>
                      <h4 className="font-medium text-text-main mb-1">语言设置</h4>
                      <p className="text-sm text-text-muted">选择界面的显示语言</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl text-sm opacity-50 cursor-not-allowed">
                      <Globe className="w-4 h-4 text-text-muted" />
                      <span>简体中文</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      onClick={handleSavePreferences}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-2"
                    >
                      保存偏好
                    </button>
                    {saveSuccess && (
                      <span className="flex items-center gap-1.5 text-sm text-green-500 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        已应用
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="bg-surface/50 backdrop-blur-sm border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    API 密钥管理
                  </CardTitle>
                  <CardDescription>配置您的自定义 AI 模型密钥（可选）</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex gap-3">
                    <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-text-main leading-relaxed">
                      默认情况下，我们使用系统集成的 OpenAI 接口。如果您希望使用自己的 API Key 以获得更高的配额或使用特定模型，可以在下方配置。
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-text-main">OpenAI API Key</label>
                      <div className="relative max-w-xl">
                        <input 
                          type={showKey ? "text" : "password"} 
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="sk-..."
                        />
                        <button 
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                        >
                          {showKey ? "隐藏" : "显示"}
                        </button>
                      </div>
                      <p className="text-xs text-text-muted">密钥仅保存在您的浏览器本地，不会上传到服务器。</p>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={handleSaveApiKey}
                        className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-hover active:scale-95 transition-all"
                      >
                        保存密钥
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="bg-surface/50 backdrop-blur-sm border-border shadow-sm">
                <CardHeader>
                  <CardTitle>账号安全</CardTitle>
                  <CardDescription>管理您的登录凭据和安全选项</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-text-main mb-1">修改密码</h4>
                      <p className="text-sm text-text-muted">定期更换密码以保障账号安全</p>
                    </div>
                    <button className="px-4 py-2 bg-surface-hover border border-border rounded-xl text-sm font-medium hover:bg-border transition-all">
                      立即修改
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-border">
                    <div>
                      <h4 className="font-medium text-text-main mb-1">双重身份验证 (2FA)</h4>
                      <p className="text-sm text-text-muted">为您的账号增加一层额外的保护</p>
                    </div>
                    <button className="px-4 py-2 bg-surface-hover border border-border rounded-xl text-sm font-medium hover:bg-border transition-all opacity-50">
                      即将推出
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-down/20 bg-down/5">
                <CardHeader>
                  <CardTitle className="text-down flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    危险区域
                  </CardTitle>
                  <CardDescription>这些操作无法撤销，请谨慎操作</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-text-main mb-1">注销账号</h4>
                      <p className="text-sm text-text-muted">永久删除您的账号及所有自选、对话数据</p>
                    </div>
                    <button className="px-4 py-2 bg-down text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all">
                      注销账号
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="bg-surface/50 backdrop-blur-sm border-border shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary/20 to-purple-500/20 flex items-center justify-center border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text-main tracking-tight">Synaptix AI</h2>
                      <p className="text-xs text-primary font-mono font-bold">VERSION 1.0.4-STABLE</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-text-main">关于项目</h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      Synaptix 是一款基于 AI 驱动的金融直觉引擎，旨在通过多维度数据分析和神经网络模型，为投资者提供更深层次的市场洞察。我们结合了实时行情、社交情绪、新闻挖掘以及大语言模型，将碎片化的市场信息转化为可感知的交易信号。
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-1">
                      <p className="text-xs text-text-muted uppercase tracking-wider">开发团队</p>
                      <p className="text-sm font-medium text-text-main">Synaptix Labs</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-text-muted uppercase tracking-wider">最后更新</p>
                      <p className="text-sm font-medium text-text-main">2026年3月27日</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-text-muted uppercase tracking-wider">运行环境</p>
                      <p className="text-sm font-medium text-text-main text-up flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Healthy
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-text-muted uppercase tracking-wider">许可证</p>
                      <p className="text-sm font-medium text-text-main">Enterprise Edition</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-between items-center">
                    <p className="text-[10px] text-text-muted font-mono">© 2026 Synaptix AI. All rights reserved.</p>
                    <div className="flex gap-4">
                      <button className="text-xs text-primary hover:underline">使用条款</button>
                      <button className="text-xs text-primary hover:underline">隐私政策</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="bg-surface/50 backdrop-blur-sm border-border shadow-sm">
                <CardHeader>
                  <CardTitle>通知设置</CardTitle>
                  <CardDescription>控制您希望接收的提醒类型</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'AI 异动预警', desc: '当自选资产出现异常波动或重要信号时通知我' },
                    { title: '每日市场摘要', desc: '每天早晨接收由 AI 生成的全球市场速览' },
                    { title: '重大新闻推送', desc: '发生可能影响全局市场的突发新闻时通知我' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start justify-between py-3 border-b border-border last:border-0 last:pb-0">
                      <div>
                        <h4 className="font-medium text-text-main mb-1">{item.title}</h4>
                        <p className="text-sm text-text-muted">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                        <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="bg-surface/50 backdrop-blur-sm border-border shadow-sm">
                <CardHeader>
                  <CardTitle>安全设置</CardTitle>
                  <CardDescription>管理您的密码和账号安全</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-text-main mb-1">修改密码</h4>
                      <p className="text-sm text-text-muted">我们建议您定期更新密码以保障账号安全</p>
                    </div>
                    <button className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors">
                      更新密码
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-down mb-2">危险区域</h4>
                    <p className="text-sm text-text-muted mb-4">注销账号将永久删除您的所有数据，此操作无法撤销。</p>
                    <button className="px-4 py-2 border border-down/50 text-down rounded-xl text-sm font-medium hover:bg-down/10 transition-colors">
                      注销账号
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}