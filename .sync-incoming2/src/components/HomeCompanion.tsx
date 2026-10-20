import React, { useState } from 'react';
import { 
  Sun, 
  Droplets, 
  Clock, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  SlidersHorizontal, 
  Layers,
  HeartHandshake,
  Check,
  ChevronRight,
  ShieldCheck,
  Palette,
  Heart
} from 'lucide-react';
import { BeautyProduct, RoutinePlan } from '../types/beauty';
import { vanityHero } from '../data/mockData';

interface HomeCompanionProps {
  products: BeautyProduct[];
  routinePlan: RoutinePlan;
  onNavigate: (tab: 'vanity' | 'routine' | 'makeup' | 'memory' | 'mall' | 'circular') => void;
  onOpenAddModal: (mode: 'camera' | 'manual' | 'batch') => void;
  onOpenCompatibilityModal: () => void;
  onGeneratePlan: (options: { timeBudget: '3min' | '5min' | 'full'; onlyVanity: boolean }) => Promise<void>;
  isGeneratingPlan: boolean;
}

export const HomeCompanion: React.FC<HomeCompanionProps> = ({
  products,
  routinePlan,
  onNavigate,
  onOpenAddModal,
  onOpenCompatibilityModal,
  onGeneratePlan,
  isGeneratingPlan
}) => {
  // Plan Generation Modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedTimeBudget, setSelectedTimeBudget] = useState<'3min' | '5min' | 'full'>('5min');
  const [onlyUseVanity, setOnlyUseVanity] = useState(true);

  // Daily task completed states
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    morning: false,
    evening: false,
    look: false,
    check_expiry: false
  });

  const toggleTask = (key: string) => {
    setCompletedTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Check expiring products
  const expiringProducts = products.filter(p => p.status === 'expiring_soon');

  const handleConfirmPlan = async () => {
    await onGeneratePlan({
      timeBudget: selectedTimeBudget,
      onlyVanity: onlyUseVanity
    });
    setShowPlanModal(false);
    onNavigate('routine');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. 顶部问候区 (Greeting & Environment) */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>2026年10月15日</span>
              <span aria-hidden="true">·</span>
              <span>周四晨间</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700">生理期·卵泡期 (代谢活跃)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900 mt-1">
              早上好，今天想让自己轻松一点，还是精致一点？
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              今天没有必须完成的KPI，护肤是一场温和关照自己、深呼吸的时刻。
            </p>
          </div>

          {/* Weather & Environmental metrics */}
          <div className="flex items-center gap-3 sm:gap-4 p-2.5 bg-stone-50 rounded-xl border border-stone-200/60 self-start md:self-auto shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>21°C 晴朗</span>
            </div>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <span className="font-medium text-amber-700">UV 4 (中等)</span>
            </div>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span>湿度 62%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Visual & 2. 今日状态卡 (Today Skin Condition) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col justify-between">
          <div className="relative h-44 sm:h-52 w-full overflow-hidden">
            <img 
              src={vanityHero} 
              alt="化妆台清晨陈列" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent flex items-end p-5">
              <div className="text-white">
                <span className="text-[11px] font-medium tracking-wider uppercase text-amber-200/90">
                  我的化妆台 · 核心数据中枢
                </span>
                <p className="text-base sm:text-lg font-serif font-semibold mt-0.5">
                  已收录 {products.length} 件爱用好物 · 实时监控保质期与成分兼容
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between flex-1 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>AI 肌肤微气候洞察</span>
                <span aria-hidden="true">·</span>
                <span>结合当前温湿度与最近反馈</span>
              </div>
              <div className="mt-2 p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <HeartHandshake className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">
                      今日皮肤状态：偏干 · 局部泛红风险微高
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      检测到今日紫外线适中但空气湿度略有下降。护理建议：以温和二裂酵母肌底修护为主，轻压神经酰胺封层，配合清透低负担底妆。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="text-xs text-stone-500">
                当前 Routine: 仅调用化妆台内 3 件已开封温和产品
              </div>
              <button
                onClick={() => setShowPlanModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>生成今日专属计划</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. 今日温和任务 (Daily Care Checklist - Anti-anxiety) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">今日温和照顾清单</h2>
                <p className="text-[11px] text-stone-500">轻点记录，不计入排名，依心情而定</p>
              </div>
              <span className="text-xs font-mono text-stone-500">
                {Object.values(completedTasks).filter(Boolean).length}/4 已完成
              </span>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {/* Task 1: 晨间护理 */}
              <div 
                onClick={() => toggleTask('morning')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  completedTasks.morning 
                    ? 'bg-stone-50 border-stone-200 text-stone-400 line-through' 
                    : 'bg-white border-stone-200/80 hover:bg-stone-50/70 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    completedTasks.morning ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                  }`}>
                    {completedTasks.morning && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-medium block">晨间护理 · 3 步唤醒水光</span>
                    <span className="text-[11px] text-stone-500">黑精华 + 色修 + 珂润神经酰胺</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onNavigate('routine'); }}
                  className="text-[11px] text-stone-500 hover:text-stone-900 underline underline-offset-2 ml-2"
                >
                  查看步骤
                </button>
              </div>

              {/* Task 2: 今日妆容 */}
              <div 
                onClick={() => toggleTask('look')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  completedTasks.look 
                    ? 'bg-stone-50 border-stone-200 text-stone-400 line-through' 
                    : 'bg-white border-stone-200/80 hover:bg-stone-50/70 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    completedTasks.look ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                  }`}>
                    {completedTasks.look && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-medium block">今日妆容 · 晨曦微光氧气通勤妆</span>
                    <span className="text-[11px] text-stone-500">巧用植村秀红棕做腮红（闲置拯救）</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onNavigate('makeup'); }}
                  className="text-[11px] text-stone-500 hover:text-stone-900 underline underline-offset-2 ml-2"
                >
                  去上妆
                </button>
              </div>

              {/* Task 3: 晚间护理 */}
              <div 
                onClick={() => toggleTask('evening')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  completedTasks.evening 
                    ? 'bg-stone-50 border-stone-200 text-stone-400 line-through' 
                    : 'bg-white border-stone-200/80 hover:bg-stone-50/70 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    completedTasks.evening ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                  }`}>
                    {completedTasks.evening && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-medium block">晚间护理 · B5 密集乳化厚敷</span>
                    <span className="text-[11px] text-stone-500">避开高浓度酸类，专注退红修复</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onNavigate('routine'); }}
                  className="text-[11px] text-stone-500 hover:text-stone-900 underline underline-offset-2 ml-2"
                >
                  晚间计划
                </button>
              </div>

              {/* Task 4: 临期提醒 */}
              {expiringProducts.length > 0 && (
                <div 
                  onClick={() => toggleTask('check_expiry')}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                    completedTasks.check_expiry 
                      ? 'bg-stone-50 border-stone-200 text-stone-400' 
                      : 'bg-amber-50/60 border-amber-200 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-xs font-medium block text-amber-900">
                        效期提醒：{expiringProducts[0].product_name.slice(0, 16)}...
                      </span>
                      <span className="text-[11px] text-amber-700">剩余 30 天保质，已优先排入晚间消耗</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNavigate('vanity'); }}
                    className="text-[11px] text-amber-800 underline underline-offset-2 ml-2 shrink-0"
                  >
                    去化妆台
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Gentle quote at bottom */}
          <div className="pt-3 mt-3 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>不用追求完美无暇，健康通透便是最好的状态。</span>
          </div>
        </div>
      </div>

      {/* 4. 快捷入口 (Quick Action Grid) */}
      <section>
        <h2 className="text-sm font-semibold text-stone-900 mb-3">快捷探索</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onOpenAddModal('camera')}
            className="p-4 bg-white hover:bg-stone-100/80 active:scale-98 rounded-xl border border-stone-200/80 flex flex-col items-center text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-stone-200 text-stone-800 flex items-center justify-center mb-2.5 transition-colors">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-900">拍照录入产品</span>
            <span className="text-[10px] text-stone-500 mt-0.5">OCR 识别品名与PAO</span>
          </button>

          <button
            onClick={() => setShowPlanModal(true)}
            className="p-4 bg-white hover:bg-stone-100/80 active:scale-98 rounded-xl border border-stone-200/80 flex flex-col items-center text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-900">生成护肤计划</span>
            <span className="text-[10px] text-stone-500 mt-0.5">3/5分钟·只用现有</span>
          </button>

          <button
            onClick={() => onNavigate('makeup')}
            className="p-4 bg-white hover:bg-stone-100/80 active:scale-98 rounded-xl border border-stone-200/80 flex flex-col items-center text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-rose-100 text-rose-800 flex items-center justify-center mb-2.5 transition-colors">
              <Palette className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-900">生成今日妆容</span>
            <span className="text-[10px] text-stone-500 mt-0.5">日常/仿妆/COS</span>
          </button>

          <button
            onClick={onOpenCompatibilityModal}
            className="p-4 bg-white hover:bg-stone-100/80 active:scale-98 rounded-xl border border-stone-200/80 flex flex-col items-center text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 group-hover:bg-sky-100 text-sky-800 flex items-center justify-center mb-2.5 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-900">扫描产品搭配</span>
            <span className="text-[10px] text-stone-500 mt-0.5">A醇/果酸碰撞排查</span>
          </button>

          <button
            onClick={() => onNavigate('memory')}
            className="p-4 bg-white hover:bg-stone-100/80 active:scale-98 rounded-xl border border-stone-200/80 flex flex-col items-center text-center transition-all group col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5 transition-colors">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-stone-900">记录皮肤感受</span>
            <span className="text-[10px] text-stone-500 mt-0.5">刺痛一键入黑榜</span>
          </button>
        </div>
      </section>

      {/* 5. 生成今日计划交互模态框 (Plan Customization Modal) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-serif font-semibold text-stone-900">
                生成今日护理 Routine
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                根据您化妆台的真实库存与今日皮肤状态量身定制，温和无负担。
              </p>
            </div>

            {/* Selection 1: 库存策略 */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-2">
                1. 产品调用范围
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyUseVanity(true)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    onlyUseVanity 
                      ? 'border-stone-900 bg-stone-900 text-white' 
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <span className="text-xs font-semibold block">只使用我的化妆台</span>
                  <span className={`text-[10px] block mt-0.5 ${onlyUseVanity ? 'text-stone-300' : 'text-stone-500'}`}>
                    不产生额外消费，充分利用现有存货
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyUseVanity(false)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    !onlyUseVanity 
                      ? 'border-stone-900 bg-stone-900 text-white' 
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <span className="text-xs font-semibold block">允许推荐缺失品类</span>
                  <span className={`text-[10px] block mt-0.5 ${!onlyUseVanity ? 'text-stone-300' : 'text-stone-500'}`}>
                    若缺少关键修护步，可提示温和替代方案
                  </span>
                </button>
              </div>
            </div>

            {/* Selection 2: 时间预算 */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-2">
                2. 今天想投入的时间预算
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '3min', label: '3 分钟', desc: '极简打底，两步快速出门' },
                  { id: '5min', label: '5 分钟', desc: '经典日常，水光维稳' },
                  { id: 'full', label: '完整护理', desc: '深度舒缓与晚间封层' },
                ].map((item) => {
                  const isSelected = selectedTimeBudget === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTimeBudget(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-colors ${
                        isSelected 
                          ? 'border-stone-900 bg-stone-900 text-white' 
                          : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <span className="text-xs font-semibold block">{item.label}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isGeneratingPlan}
                onClick={handleConfirmPlan}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isGeneratingPlan ? (
                  <>
                    <span className="animate-spin text-amber-300">✦</span>
                    <span>AI 正在匹配化妆台...</span>
                  </>
                ) : (
                  <>
                    <span>确认并生成</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
