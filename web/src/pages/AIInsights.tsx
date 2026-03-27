import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BrainCircuit, Send, AlertTriangle, TrendingUp, History, Plus, X, User as UserIcon } from 'lucide-react';
import { getOpenAIClient, getAIConfig } from '@/lib/openai';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export function AIInsights() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '您好！我是 Synaptix AI。我可以为您分析市场异动、解读最新财报、或者推演特定事件对不同资产的影响。您想了解什么？'
    }
  ]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      setConversations(data);
    }
  };

  const loadConversation = async (id: string) => {
    setCurrentConversationId(id);
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setMessages(data.map(m => ({ role: m.role_type as 'user' | 'assistant', content: m.message_content })));
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        role: 'assistant',
        content: '您好！我是 Synaptix AI。我可以为您分析市场异动、解读最新财报、或者推演特定事件对不同资产的影响。您想了解什么？'
      }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const { model } = getAIConfig();
    try {
      let conversationId = currentConversationId;

      // Create conversation if it doesn't exist
      if (!conversationId && user) {
        const { data: conv, error: convError } = await supabase
          .from('ai_conversations')
          .insert({
            user_id: user.id,
            title: userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '')
          })
          .select()
          .single();
        
        if (convError) throw convError;
        conversationId = conv.id;
        setCurrentConversationId(conversationId);
        fetchConversations();
      }

      // Save user message to DB
      if (conversationId && user) {
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role_type: 'user',
          message_content: userMessage
        });
      }

      const openaiClient = getOpenAIClient();
      const response = await openaiClient.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: '你是Synaptix的金融AI助手，专业、冷静、客观。你的回答需要基于数据和逻辑，并明确指出可能的风险。如果被问及投资建议，请务必说明这仅供参考，不构成投资建议。' },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user', content: userMessage }
        ],
      });

      const reply = response.choices[0]?.message?.content || '抱歉，我现在无法回答这个问题。';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      // Save assistant message to DB
      if (conversationId && user) {
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role_type: 'assistant',
          message_content: reply
        });

        // Update conversation timestamp
        await supabase
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    } catch (error: unknown) {
      console.error('Error fetching AI response:', error);
      let errorMessage = '系统出现错误，请稍后再试。';
      
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('current user api does not support http call')) {
        errorMessage = `错误：当前配置的模型 (${model}) 在阿里云 DashScope 接口下不支持 HTTP 方式调用（例如 qvq-max 等视觉模型）。请在设置页中切换为 qwen-plus 或 qwen-max 等标准模型。`;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-5rem)] md:h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Sidebar with History and Insights */}
      {showHistory && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowHistory(false)}
        />
      )}
      <div className={cn(
        "lg:w-1/4 space-y-4 md:space-y-6 flex flex-col min-h-0 bg-surface lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none",
        "fixed inset-y-0 left-0 z-[60] w-[280px] sm:w-[320px] p-6 lg:relative lg:inset-auto lg:p-0 lg:w-1/4 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none",
        showHistory ? "translate-x-0 opacity-100" : "-translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100"
      )}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">AI 对话历史</h2>
          <div className="flex gap-2">
            <button 
              onClick={startNewChat}
              className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95 border border-primary/20"
              title="开启新对话"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowHistory(false)}
              className="lg:hidden p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {user && (
          <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-text-muted mb-3 px-1">
              <History className="w-4 h-4" />
              <span>最近对话</span>
            </div>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    loadConversation(conv.id);
                    setShowHistory(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 md:py-2.5 rounded-xl text-sm transition-all truncate border",
                    currentConversationId === conv.id 
                      ? "bg-primary/10 text-primary border-primary/30 font-medium shadow-sm" 
                      : "text-text-muted border-transparent hover:bg-surface-hover hover:text-text-main hover:border-border"
                  )}
                >
                  {conv.title}
                </button>
              ))
            ) : (
              <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl">
                <p className="text-xs text-text-muted">暂无对话记录</p>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-4 pt-4 border-t border-border mt-auto">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">发现洞察</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <Card className="border-up/30 bg-up/5 hover:bg-up/10 transition-colors cursor-pointer group" onClick={() => { setInput('详细分析一下NVDA这次发布会的影响'); setShowHistory(false); }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-up mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold">异动归因: $NVDA</span>
                </div>
                <p className="text-xs text-text-main line-clamp-2 group-hover:text-text-main transition-colors">
                  过去24小时上涨 3.2%。主要驱动因素为GTC大会发布的新一代Blackwell架构芯片超预期...
                </p>
              </CardContent>
            </Card>

            <Card className="border-down/30 bg-down/5 hover:bg-down/10 transition-colors cursor-pointer group" onClick={() => { setInput('比特币现在有什么具体的回调风险？'); setShowHistory(false); }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-down mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold">反直觉预警: $BTC</span>
                </div>
                <p className="text-xs text-text-main line-clamp-2 group-hover:text-text-main transition-colors">
                  价格创下新高，但巨鲸动向出现背离，历史数据显示回调概率达 68%...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 lg:w-3/4 flex flex-col min-h-0 bg-surface/30 backdrop-blur-sm border-border shadow-2xl lg:shadow-none">
        <CardHeader className="border-b border-border py-3 md:py-4 px-4 md:px-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowHistory(true)}
                className="lg:hidden p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl transition-all active:scale-95"
              >
                <History className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <BrainCircuit className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base md:text-lg truncate">Synaptix AI 助手</CardTitle>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span>在线 • 基于 {getAIConfig().model}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={startNewChat}
              className="lg:hidden p-2 text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={cn(
                "flex items-start gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                message.role === 'user' ? "bg-primary text-white" : "bg-surface-hover text-primary border border-border"
              )}>
                {message.role === 'user' ? <UserIcon className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[88%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                message.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-surface border border-border text-text-main rounded-tl-none"
              )}>
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-surface-hover border border-border flex items-center justify-center text-primary shadow-sm">
                <BrainCircuit className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-3 md:p-4 border-t border-border bg-surface/50 backdrop-blur-md shrink-0">
          <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "向 AI 提问：NVDA 的估值是否合理？" : "请先登录以使用 AI 助手"}
              disabled={isLoading || !user}
              className="w-full bg-background border border-border rounded-2xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 shadow-inner"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim() || !user}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-text-muted text-center mt-3 uppercase tracking-[0.2em] font-medium opacity-60">
            AI 生成内容仅供参考，不构成任何投资建议
          </p>
        </div>
      </Card>
    </div>
  );
}
