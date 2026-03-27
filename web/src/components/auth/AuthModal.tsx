import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { AuthError } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        // Supabase sign up might require email confirmation depending on settings
        setError('注册成功！请检查您的邮箱进行确认（如果启用了邮件确认）。');
        return;
      }
      onClose();
    } catch (err: unknown) {
      const authError = err as AuthError;
      setError(authError.message || '发生错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-surface border-t sm:border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-text-main mb-2">
              {mode === 'login' ? '欢迎回来' : '开启 AI 投研之旅'}
            </h2>
            <p className="text-sm sm:text-base text-text-muted">
              {mode === 'login' ? '登录您的 Synaptix 账号' : '创建一个新账号以开始使用'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-text-muted ml-1">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-text-muted ml-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg text-xs sm:text-sm",
                error.includes('成功') ? "bg-green-500/10 text-green-500" : "bg-error/10 text-error"
              )}>
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-semibold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-sm sm:text-base">{mode === 'login' ? '登录' : '注册'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">
              {mode === 'login' ? '还没有账号？' : '已经有账号了？'}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-primary font-semibold hover:underline"
              >
                {mode === 'login' ? '立即注册' : '返回登录'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
