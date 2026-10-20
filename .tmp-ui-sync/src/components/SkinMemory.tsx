import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Heart, 
  AlertCircle, 
  Check, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Clock, 
  Calendar,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { BeautyProduct, BlacklistIngredient, SkinFeedbackLog } from '../types/beauty';

interface SkinMemoryProps {
  products: BeautyProduct[];
  blacklist: BlacklistIngredient[];
  feedbackLogs: SkinFeedbackLog[];
  onAddBlacklistIngredient: (ingredient: BlacklistIngredient) => void;
  onRemoveBlacklistIngredient: (name: string) => void;
  onUpdateProductListStatus: (productId: string, status: 'red' | 'yellow' | 'black' | 'none') => void;
}

export const SkinMemory: React.FC<SkinMemoryProps> = ({
  products,
  blacklist,
  feedbackLogs,
  onAddBlacklistIngredient,
  onRemoveBlacklistIngredient,
  onUpdateProductListStatus
}) => {
  const [activeTab, setActiveTab] = useState<'red' | 'yellow' | 'black' | 'ingredients' | 'feedback'>('red');
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientReason, setNewIngredientReason] = useState('');
  const [newIngredientRisk, setNewIngredientRisk] = useState<'high' | 'medium'>('high');

  // Categorized products
  const redListProducts = products.filter(p => p.list_status === 'red');
  const yellowListProducts = products.filter(p => p.list_status === 'yellow');
  const blackListProducts = products.filter(p => p.list_status === 'black');

  const handleCreateIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredientName.trim()) return;

    onAddBlacklistIngredient({
      name: newIngredientName.trim(),
      risk_level: newIngredientRisk,
      reason: newIngredientReason.trim() || '用户自定义避雷成分',
      associated_products_count: 0
    });

    setNewIngredientName('');
    setNewIngredientReason('');
    setShowAddIngredientModal(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>肌肤实证中枢</span>
              <span aria-hidden="true">·</span>
              <span>沉淀个人耐受档案与成分避雷库</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900 mt-1">
              我的肌肤记忆 (Skin Memory)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              记录每款产品在您面部的真实化学反馈。黑榜数据已自动联动全平台：智能拦截 Routine、妆造与商城推荐。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddIngredientModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加避雷成分</span>
            </button>
          </div>
        </div>

        {/* 5 Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none text-xs sm:text-sm">
          {[
            { id: 'red', label: `红榜圣杯 (${redListProducts.length})` },
            { id: 'yellow', label: `黄榜慎用 (${yellowListProducts.length})` },
            { id: 'black', label: `黑榜避雷 (${blackListProducts.length})` },
            { id: 'ingredients', label: `成分避雷库 (${blacklist.length})` },
            { id: 'feedback', label: `体感日志 (${feedbackLogs.length})` }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

      {/* Tab: 红榜 (Red List - Holy Grail) */}
      {activeTab === 'red' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl flex items-center gap-3">
            <Heart className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs text-rose-950">
              <strong>红榜定义：</strong> 极高耐受、显著改善肌肤屏障或底妆光泽的自用回购产品。系统将在常规 Routine 中优先推荐。
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {redListProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
                    <span className="font-medium text-stone-800">{p.subcategory || p.category}</span>
                    <span className="text-rose-700 font-semibold">自用认证</span>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mt-2">{p.product_name}</h3>
                  <span className="text-xs text-stone-500 block">{p.brand}</span>

                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-200/50">
                    {p.user_notes || '适合晨晚维稳，肤感极其舒适温和。'}
                  </p>

                  <div className="mt-3 text-[11px] text-stone-500">
                    核心成分: {p.ingredients.slice(0, 3).join(' · ')}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">累计使用 {p.usage_count} 次</span>
                  <button
                    onClick={() => onUpdateProductListStatus(p.id, 'yellow')}
                    className="text-xs text-stone-500 hover:text-stone-900"
                  >
                    移至黄榜
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: 黄榜 (Yellow List - Conditional) */}
      {activeTab === 'yellow' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div className="text-xs text-amber-950">
              <strong>黄榜定义：</strong> 活性较高或需严格控量（如A醇、高浓度果酸），需特定季节、搭配禁忌注意的产品。
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {yellowListProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
                    <span className="font-medium text-stone-800">{p.subcategory || p.category}</span>
                    <span className="text-amber-700 font-semibold">需控量/分早晚</span>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mt-2">{p.product_name}</h3>
                  <span className="text-xs text-stone-500 block">{p.brand}</span>

                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/50">
                    {p.user_notes}
                  </p>

                  <div className="mt-3 text-[11px] text-amber-800">
                    注意事项: 避免与果酸同用，仅限晚间薄涂
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => onUpdateProductListStatus(p.id, 'red')}
                    className="text-xs text-rose-700 hover:text-rose-900"
                  >
                    耐受升级至红榜
                  </button>
                  <button
                    onClick={() => onUpdateProductListStatus(p.id, 'black')}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    降级至黑榜
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: 黑榜 (Black List - Automatic Filtering) */}
      {activeTab === 'black' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />
            <div className="text-xs text-rose-950 leading-relaxed">
              <strong>黑榜强力拦截：</strong> 所有列入黑榜的产品已被系统永久锁定！护理计划将自动屏蔽排程，商城若出现类似高刺激成分也将标红警示。
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blackListProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
                    <span className="font-medium text-stone-800">{p.subcategory || p.category}</span>
                    <span className="text-rose-700 font-semibold">已强行阻断</span>
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mt-2">{p.product_name}</h3>
                  <span className="text-xs text-stone-500 block">{p.brand}</span>

                  <p className="text-xs text-rose-900 mt-2.5 leading-relaxed bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/60">
                    {p.user_notes || '使用后两颊立刻刺痛泛红，已提取变性乙醇入成分避雷库。'}
                  </p>

                  <div className="mt-3 text-[11px] text-stone-500">
                    提取的避雷标签: {p.allergen_tags.join(' · ') || '高浓度酒精刺激'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">建议空瓶回收或工具清洁</span>
                  <button
                    onClick={() => onUpdateProductListStatus(p.id, 'none')}
                    className="text-xs text-stone-600 hover:text-stone-900"
                  >
                    移出黑榜
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: 成分避雷库 (Ingredient Blacklist) */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">动态成分避雷库</h3>
                <p className="text-xs text-stone-500">
                  当用户在化妆台标记刺痛时，AI 将自动分析并提取化学致敏原，并在此处维护全局阻断规则。
                </p>
              </div>

              <button
                onClick={() => setShowAddIngredientModal(true)}
                className="px-3.5 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800"
              >
                + 添加新成分
              </button>
            </div>

            <div className="space-y-3">
              {blacklist.map((item) => (
                <div key={item.name} className="p-4 rounded-xl border border-stone-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-900">{item.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        item.risk_level === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.risk_level === 'high' ? '高风险致敏' : '中风险需警惕'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      {item.reason}
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveBlacklistIngredient(item.name)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors shrink-0"
                    title="移除该避雷成分"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 体感日志 (Feedback Logs) */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-4">
            <h3 className="text-sm font-semibold text-stone-900">肌肤历史体感记录</h3>
            {feedbackLogs.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">暂无记录，可在“护理计划 - 护肤打卡”中添加今日感受。</p>
            ) : (
              <div className="space-y-3">
                {feedbackLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium text-stone-800">{log.date}</span>
                        <span>{log.routine_type === 'morning' ? '晨间记录' : '晚间记录'}</span>
                      </div>
                      <span className="text-amber-800 font-medium">心情: {log.mood}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {log.feelings.map((f, idx) => (
                        <span key={idx} className="text-[11px] bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-700">
                          {f}
                        </span>
                      ))}
                    </div>

                    {log.notes && (
                      <p className="text-xs text-stone-600 bg-white p-2 rounded-lg border border-stone-200/50">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Blacklist Ingredient Modal */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900">手动添加避雷成分</h3>
              <button onClick={() => setShowAddIngredientModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">成分全名 / 俗称</label>
                <input
                  type="text"
                  required
                  placeholder="例如：苯氧乙醇, 水杨酸, 烟酰胺等"
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">避雷原因与不耐受表现</label>
                <textarea
                  placeholder="例如：使用后眼周出现发红瘙痒，或两颊大面积刺痛..."
                  value={newIngredientReason}
                  onChange={(e) => setNewIngredientReason(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">风险等级</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewIngredientRisk('high')}
                    className={`py-2 rounded-xl text-xs font-medium border ${
                      newIngredientRisk === 'high' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    高风险 (绝对阻断)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIngredientRisk('medium')}
                    className={`py-2 rounded-xl text-xs font-medium border ${
                      newIngredientRisk === 'medium' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    中风险 (需用量警示)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddIngredientModal(false)}
                  className="px-4 py-2 text-xs text-stone-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800"
                >
                  确认加入避雷库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
