import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ShieldAlert, 
  Sparkles, 
  Tag, 
  AlertTriangle, 
  Check, 
  Layers, 
  ArrowRight,
  ExternalLink,
  HelpCircle,
  X,
  MapPin,
  Recycle
} from 'lucide-react';
import { MallItem, BeautyProduct } from '../types/beauty';

interface DiscoveryMallProps {
  mallItems: MallItem[];
  vanityProducts: BeautyProduct[];
  onNavigateToVanityRescue: (productName: string) => void;
}

export const DiscoveryMall: React.FC<DiscoveryMallProps> = ({
  mallItems,
  vanityProducts,
  onNavigateToVanityRescue
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [antiImpulseTarget, setAntiImpulseTarget] = useState<MallItem | null>(null);
  const [shoppingCart, setShoppingCart] = useState<string[]>([]);

  // Filter items
  const filteredItems = mallItems.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'ai_suggest') return !item.is_commercial;
    if (activeFilter === 'commercial') return item.is_commercial;
    if (activeFilter === 'refill') return item.refill_available;
    return true;
  });

  const handleItemClick = (item: MallItem) => {
    // If user already owns similar products in vanity, intercept with anti-impulse modal!
    if (item.existing_vanity_count > 0) {
      setAntiImpulseTarget(item);
    } else {
      toggleCart(item.id);
    }
  };

  const toggleCart = (id: string) => {
    if (shoppingCart.includes(id)) {
      setShoppingCart(shoppingCart.filter(i => i !== id));
    } else {
      setShoppingCart([...shoppingCart, id]);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>反冲动消费商城</span>
              <span aria-hidden="true">·</span>
              <span>以化妆台真实缺失与平替为准则</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900 mt-1">
              美妆发现商城 (Discovery Mall)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              严格透明标注“AI 真实建议”与“商业品牌推广”。内置防重复购买拦截器，守护钱包与可持续绿色生活。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-mono">
              心愿清单: {shoppingCart.length} 件
            </span>
          </div>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none text-xs sm:text-sm">
          {[
            { id: 'all', label: '全部发现' },
            { id: 'ai_suggest', label: 'AI 真实建议 (无商业利益)' },
            { id: 'commercial', label: '品牌商业推广 (明确标注)' },
            { id: 'refill', label: '绿色替换芯 / 补货装' }
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-stone-900 text-white shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const inCart = shoppingCart.includes(item.id);

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border flex flex-col justify-between transition-all shadow-2xs ${
                item.contains_blacklist_ingredient
                  ? 'border-rose-300 bg-rose-50/10'
                  : item.is_commercial
                  ? 'border-stone-300'
                  : 'border-stone-200/80 hover:border-stone-400'
              }`}
            >
              <div>
                {/* Transparency Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-1.5">
                    {item.is_commercial ? (
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium border border-stone-200">
                        {item.commercial_tag || '商业合作品牌'}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-200">
                        AI 纯净算法推荐
                      </span>
                    )}

                    {item.refill_available && (
                      <span className="text-[10px] bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded font-medium">
                        环保替换芯
                      </span>
                    )}
                  </div>

                  {item.price > 0 ? (
                    <span className="text-sm font-semibold text-stone-900 font-serif tabular-numbers">
                      ¥{item.price}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700">
                      免费公益服务
                    </span>
                  )}
                </div>

                {/* Brand & Name */}
                <div className="mt-3">
                  <span className="text-xs text-stone-500 font-serif block">{item.brand}</span>
                  <h3 className="text-sm font-semibold text-stone-900 mt-0.5">
                    {item.name}
                  </h3>

                  {/* Recommendation Reason */}
                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-200/50">
                    {item.recommend_reason}
                  </p>

                  {/* Anti-Impulse warning if owned */}
                  {item.existing_vanity_count > 0 && (
                    <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>化妆台已有相似存货：</strong>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          {item.existing_vanity_names.join('、')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Blacklist Warning */}
                  {item.contains_blacklist_ingredient && (
                    <div className="mt-3 p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>安全拦截：含黑榜成分</strong>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          含您避雷库中的 {item.blacklist_ingredient_names.join('、')}，易致敏！
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer action */}
              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                {item.existing_vanity_count > 0 ? (
                  <button
                    onClick={() => handleItemClick(item)}
                    className="w-full py-2 px-3 text-xs font-medium text-amber-900 bg-amber-100/80 hover:bg-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>触发防冲动对比</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => toggleCart(item.id)}
                    className={`w-full py-2 px-3 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                      inCart 
                        ? 'bg-stone-900 text-white' 
                        : 'border border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {inCart ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                    <span>{inCart ? '已入心愿单' : '加入心愿单'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 防重复购买弹窗 (Anti-Impulse Purchase Modal) */}
      {antiImpulseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-amber-800">
              <Layers className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-serif font-semibold text-stone-900">
                防重复购买理性提醒
              </h3>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
              您的化妆台里已有 <strong>{antiImpulseTarget.existing_vanity_count}</strong> 件同类产品：
              <div className="mt-1 font-semibold text-stone-900">
                • {antiImpulseTarget.existing_vanity_names.join('、')}
              </div>
              <p className="mt-2 text-stone-600">
                目前已有产品尚未用完，您仍然想查看新品，还是先看看现有产品的使用与拯救方案？
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  const targetName = antiImpulseTarget.existing_vanity_names[0] || '';
                  setAntiImpulseTarget(null);
                  onNavigateToVanityRescue(targetName);
                }}
                className="w-full sm:flex-1 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl transition-colors text-center"
              >
                先看现有产品拯救方案 (推荐)
              </button>

              <button
                onClick={() => {
                  toggleCart(antiImpulseTarget.id);
                  setAntiImpulseTarget(null);
                }}
                className="w-full sm:w-auto py-2.5 px-4 border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-medium rounded-xl transition-colors text-center"
              >
                仍要加入心愿单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
