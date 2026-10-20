import React from 'react';
import { 
  Home, 
  Layers, 
  Calendar, 
  Palette, 
  ShoppingBag, 
  Recycle, 
  User,
  MoreHorizontal,
  Circle,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

import { UserProfile } from '../../types/auth';

export type MiniProgramTab = 'home' | 'vanity' | 'routine' | 'makeup' | 'memory' | 'mall' | 'circular';

interface WeChatFrameProps {
  currentTab: MiniProgramTab;
  onTabChange: (tab: MiniProgramTab) => void;
  children: React.ReactNode;
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
}

export const WeChatFrame: React.FC<WeChatFrameProps> = ({
  currentTab,
  onTabChange,
  children,
  currentUser,
  onOpenLogin
}) => {

  return (
    <div className="w-full max-w-[430px] mx-auto bg-[#FAF6F3] sm:rounded-[36px] sm:shadow-xl sm:border sm:border-[#EDE5DE] overflow-hidden flex flex-col relative min-h-screen sm:min-h-[820px] transition-all">
      {/* 1. iOS Status Bar & Dynamic Island */}
      <div className="pt-2.5 px-6 pb-1 flex items-center justify-between text-[13px] font-semibold text-stone-900 shrink-0 select-none bg-[#FAF6F3] z-40">
        <span>9:41</span>
        {/* Dynamic Island pill */}
        <div className="w-24 h-4 bg-[#111] rounded-full flex items-center justify-end px-2">
          <div className="w-2 h-2 rounded-full bg-stone-900 border border-stone-800" />
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono text-[11px]">5G</span>
          <div className="w-5 h-2.5 border border-stone-800 rounded-xs p-0.5 flex items-center">
            <div className="w-full h-full bg-stone-900 rounded-2xs" />
          </div>
        </div>
      </div>

      {/* 2. WeChat Mini-Program Capsule Header */}
      <div className="sticky top-0 z-40 bg-[#FAF6F3]/95 backdrop-blur-md border-b border-[#F0EBE6]/90 px-4 py-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#E25C70] text-white flex items-center justify-center font-serif text-xs font-bold shadow-2xs">
            妆
          </div>
          <div>
            <h1 className="text-xs font-bold font-serif text-stone-900 tracking-tight leading-none">
              我的化妆台 · AI
            </h1>
            <p className="text-[9px] text-stone-400 mt-0.5 leading-none">
              7大核心全景设计
            </p>
          </div>
        </div>

        {/* User Status / Login Pill */}
        <div className="flex items-center gap-1.5">
          {currentUser && !currentUser.isGuest ? (
            <button
              onClick={onOpenLogin || (() => onTabChange('memory'))}
              className="flex items-center gap-1 py-0.5 px-1.5 rounded-full bg-white/80 border border-stone-200 text-[10px] text-stone-700 hover:bg-white"
              title="切换账号 / 个人中心"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.nickname}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span className="font-semibold max-w-[50px] truncate">{currentUser.nickname}</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-2 py-0.5 rounded-full bg-[#E25C70]/10 text-[#E25C70] border border-[#E25C70]/30 text-[10px] font-semibold hover:bg-[#E25C70]/20"
            >
              登录
            </button>
          )}

          {/* WeChat Iconic Capsule Button (••• | ⨀) */}
          <div className="flex items-center bg-white/90 border border-stone-300/60 rounded-full py-0.5 px-2.5 shadow-2xs gap-2">
          <button 
            type="button"
            className="text-stone-700 hover:text-stone-900 transition-colors" 
            title="小程序菜单"
          >
            <MoreHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          <div className="w-px h-3 bg-stone-200" />
          <button 
            type="button"
            onClick={() => onTabChange('home')}
            className="text-stone-700 hover:text-stone-900 transition-colors" 
            title="返回首页"
          >
            <Circle className="w-3 h-3 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>

    {/* Screen Content */}
    <div className="flex-1 overflow-y-auto pb-24">
        {children}
      </div>

      {/* 5. WeChat Mini-Program Bottom Tab Bar (matching the design image aesthetic) */}
      <div className="fixed sm:absolute bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#F0EBE6] px-1 flex items-center justify-around z-40 max-w-[430px] mx-auto shadow-lg sm:shadow-none">
        {/* Tab 1: 首页 */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'home' ? 'text-[#E25C70] font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5">首页</span>
        </button>

        {/* Tab 2: 化妆台 */}
        <button
          onClick={() => onTabChange('vanity')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'vanity' ? 'text-[#E25C70] font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Layers className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5">化妆台</span>
        </button>

        {/* Tab 3: 护理计划 */}
        <button
          onClick={() => onTabChange('routine')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'routine' ? 'text-[#E25C70] font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Calendar className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5">护理计划</span>
        </button>

        {/* Tab 4: 妆造 */}
        <button
          onClick={() => onTabChange('makeup')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'makeup' ? 'text-[#E25C70] font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Palette className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5">妆造</span>
        </button>

        {/* Tab 5: 商城 */}
        <button
          onClick={() => onTabChange('mall')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'mall' ? 'text-[#E25C70] font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5">商城</span>
        </button>

        {/* Tab 6: 循环 */}
        <button
          onClick={() => onTabChange('circular')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'circular' ? 'text-[#E25C70] font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Recycle className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5">循环</span>
        </button>

        {/* Tab 7: 我的 */}
        <button
          onClick={() => onTabChange('memory')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'memory' ? 'text-[#E25C70] font-semibold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <User className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5">我的</span>
        </button>
      </div>
    </div>
  );
};
