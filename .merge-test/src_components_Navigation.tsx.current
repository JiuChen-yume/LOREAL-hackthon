import React from 'react';
import { 
  Sparkles, 
  Layers, 
  CalendarClock, 
  Palette, 
  ShieldAlert, 
  ShoppingBag, 
  Recycle,
  Smartphone,
  Eye,
  Volume2,
  Camera
  ,PlugZap
} from 'lucide-react';

export type ActiveTab = 'home' | 'vanity' | 'routine' | 'makeup' | 'memory' | 'mall' | 'circular' | 'api';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  onQuickAddProduct: () => void;
  onSpeakGreeting?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  isMobilePreview,
  onToggleMobilePreview,
  isHighContrast,
  onToggleHighContrast,
  onQuickAddProduct,
  onSpeakGreeting
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: '首页', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'vanity', label: '我的化妆台', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'routine', label: 'AI 护理计划', icon: <CalendarClock className="w-3.5 h-3.5" /> },
    { id: 'makeup', label: '妆造工作室', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'mall', label: '发现商城', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'circular', label: '美丽循环', icon: <Recycle className="w-3.5 h-3.5" /> },
    { id: 'memory', label: '肌肤记忆档案', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: 'api', label: 'API 接入中心', icon: <PlugZap className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[rgba(255,250,247,0.88)] backdrop-blur-xl border-b border-[var(--bt-line)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f28a86] to-[#c94d5c] text-white flex items-center justify-center font-serif text-sm font-bold shadow-md">
              妆
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-stone-900 block font-serif">
                我的化妆台 · AI
              </span>
              <span className="text-[10px] text-stone-500 block -mt-0.5 tracking-normal">
                取悦自我的美妆护肤管理
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (hidden on small screens, tabs shown in mobile bottom bar) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[var(--bt-wine)] text-white font-semibold shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Quick Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio voice greeting */}
          {onSpeakGreeting && (
            <button
              onClick={onSpeakGreeting}
              title="温和语音伴侣"
              aria-label="温和语音伴侣"
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white/80 rounded-full transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}

          {/* High contrast mode toggle */}
          <button
            onClick={onToggleHighContrast}
            title={isHighContrast ? "关闭高对比度" : "高对比度模式"}
            aria-label="高对比度切换"
            className={`p-1.5 rounded-full transition-colors ${
              isHighContrast ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Layout switcher */}
          <button
            onClick={onToggleMobilePreview}
            title={isMobilePreview ? "切换至桌面平铺" : "切换至小程序视窗"}
            aria-label="视图切换"
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors border ${
              isMobilePreview 
                ? 'bg-[#962F43]/10 border-[#962F43]/30 text-[#962F43]' 
                : 'border-[#EDE5DE] bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isMobilePreview ? "小程序模式" : "平铺展开"}</span>
          </button>

          {/* Primary Quick Scan / Add Button */}
          <button
            onClick={onQuickAddProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#962F43] hover:bg-[#832637] active:scale-95 rounded-full shadow-xs transition-all whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>录入单品</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const MobileTabBar: React.FC<{
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#FAF6F3]/95 backdrop-blur-md border-t border-[#EDE5DE] px-3 flex items-center justify-around z-40">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'home' ? 'text-[#962F43] font-semibold' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Sparkles className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] mt-0.5">首页</span>
      </button>

      <button
        onClick={() => onTabChange('vanity')}
        className={`flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'vanity' ? 'text-[#962F43] font-semibold' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Layers className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] mt-0.5">化妆台</span>
      </button>

      <button
        onClick={() => onTabChange('routine')}
        className={`flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'routine' ? 'text-[#962F43] font-semibold' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <CalendarClock className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] mt-0.5">护理计划</span>
      </button>

      <button
        onClick={() => onTabChange('makeup')}
        className={`flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'makeup' ? 'text-[#962F43] font-semibold' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <Palette className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] mt-0.5">妆造</span>
      </button>

      <button
        onClick={() => onTabChange('memory')}
        className={`flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'memory' ? 'text-[#962F43] font-semibold' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <ShieldAlert className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] mt-0.5">我的</span>
      </button>
    </div>
  );
};
