import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Layers, 
  AlertCircle, 
  Clock, 
  Tag, 
  ShieldAlert, 
  Sparkles, 
  Check, 
  Edit3, 
  Trash2, 
  Calendar, 
  HelpCircle,
  Lightbulb,
  CheckCircle,
  X,
  Camera,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Download,
  RotateCcw,
  Recycle,
  PackageCheck,
  ChevronDown,
  ShoppingBag
} from 'lucide-react';
import { BeautyProduct, ProductCategory, ListRating, ProductStatus, ColorTone } from '../types/beauty';

interface VanityHubProps {
  products: BeautyProduct[];
  onAddProduct: (newProduct: BeautyProduct) => void;
  onUpdateProduct: (updated: BeautyProduct) => void;
  onDeleteProduct: (id: string) => void;
  onBatchUpdateStatus: (ids: string[], status: ProductStatus) => void;
  onBatchUpdateListStatus: (ids: string[], listStatus: ListRating) => void;
  onBatchDelete: (ids: string[]) => void;
  onOpenCompatibilityWithSelected: (selectedProducts: BeautyProduct[]) => void;
  onOpenIdleRescue: (product: BeautyProduct) => void;
  onOpenAddModal: (mode: 'camera' | 'manual' | 'batch') => void;
  onSelectProductForDetail: (product: BeautyProduct) => void;
  onQuickRecycleUsedUp: (product: BeautyProduct) => void;
  onExportData: () => void;
}

export const VanityHub: React.FC<VanityHubProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBatchUpdateStatus,
  onBatchUpdateListStatus,
  onBatchDelete,
  onOpenCompatibilityWithSelected,
  onOpenIdleRescue,
  onOpenAddModal,
  onSelectProductForDetail,
  onQuickRecycleUsedUp,
  onExportData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeColorTone, setActiveColorTone] = useState<ColorTone | 'all'>('all');
  const [showHiddenProducts, setShowHiddenProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Statistics
  const totalCount = products.length;
  const expiringCount = products.filter(p => p.status === 'expiring_soon').length;
  const idleCount = products.filter(p => p.status === 'idle').length;
  const usableCount = products.filter(p => p.status !== 'expired' && p.status !== 'used_up' && p.list_status !== 'black').length;

  // Replenishment alert for high-frequency consumption (e.g. cleanser or moisturizer almost empty)
  const replenishItems = products.filter(p => p.subcategory === '洁面' || (p.usage_count > 60 && p.status === 'in_use'));

  // Calculate days since last used
  const getDaysSinceLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return 90;
    const diff = Math.floor((new Date('2026-10-15').getTime() - new Date(lastUsed).getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diff);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Privacy filter
      if (product.is_hidden && !showHiddenProducts) return false;

      // Search match
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.brand.toLowerCase().includes(query) ||
        product.product_name.toLowerCase().includes(query) ||
        (product.subcategory && product.subcategory.toLowerCase().includes(query)) ||
        (product.shade_name && product.shade_name.toLowerCase().includes(query)) ||
        product.ingredients.some(i => i.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Color Tone Filter for Makeup
      if (activeColorTone !== 'all') {
        if (product.color_tone !== activeColorTone) return false;
      }

      // Category / Status Filter
      if (activeFilter === 'all') return true;
      if (['skincare', 'base', 'eye', 'lip', 'tool'].includes(activeFilter)) {
        return product.category === activeFilter;
      }
      if (activeFilter === 'in_use') return product.status === 'in_use';
      if (activeFilter === 'idle') return product.status === 'idle';
      if (activeFilter === 'expiring_soon') return product.status === 'expiring_soon';
      if (activeFilter === 'expired') return product.status === 'expired';
      if (activeFilter === 'used_up') return product.status === 'used_up';
      if (activeFilter === 'red') return product.list_status === 'red';
      if (activeFilter === 'yellow') return product.list_status === 'yellow';
      if (activeFilter === 'black') return product.list_status === 'black';

      return true;
    });
  }, [products, searchQuery, activeFilter, activeColorTone, showHiddenProducts]);

  // Selection toggle
  const toggleSelection = (id: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const handleLaunchCompatibility = () => {
    const selected = products.filter(p => selectedProductIds.includes(p.id));
    onOpenCompatibilityWithSelected(selected);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Statistical Overview Strip */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>数据中枢</span>
              <span aria-hidden="true">·</span>
              <span>护理计划/妆造/肌肤记忆底座</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900 mt-1">
              我的化妆台 (Vanity Hub)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              记录每件美妆全生命周期，掌控开封效期与成分安全，告别囤积与盲目拔草。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddModal('camera')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" />
              <span>拍照 AI 识别</span>
            </button>
            <button
              onClick={() => onOpenAddModal('manual')}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>手动添加</span>
            </button>
            <button
              onClick={onExportData}
              title="导出全部化妆台数据 (JSON)"
              className="p-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/60">
            <span className="text-xs text-stone-500 block">收纳总件数</span>
            <span className="text-2xl font-serif font-semibold text-stone-900 mt-0.5 block tabular-numbers">
              {totalCount}
            </span>
            <span className="text-[11px] text-stone-600 mt-0.5 block">包含多瓶库存与工具</span>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70">
            <span className="text-xs text-amber-800 block">临期预警 (≤30天)</span>
            <span className="text-2xl font-serif font-semibold text-amber-900 mt-0.5 block tabular-numbers">
              {expiringCount}
            </span>
            <span className="text-[11px] text-amber-700 mt-0.5 block">已自动置顶优先消耗</span>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/60">
            <span className="text-xs text-stone-500 block">闲置待拯救</span>
            <span className="text-2xl font-serif font-semibold text-stone-900 mt-0.5 block tabular-numbers">
              {idleCount}
            </span>
            <span className="text-[11px] text-stone-600 mt-0.5 block">支持一键生成多用途企划</span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
            <span className="text-xs text-emerald-800 block">今日安全可用</span>
            <span className="text-2xl font-serif font-semibold text-emerald-900 mt-0.5 block tabular-numbers">
              {usableCount}
            </span>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">已排除黑榜刺痛成分</span>
          </div>
        </div>

        {/* Replenishment Gentle Reminder */}
        {replenishItems.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>消耗提醒：</strong>您的「{replenishItems[0].product_name}」使用频次较高且余量接近用完，条件允许可考虑平替或补货~
              </span>
            </div>
            <span className="text-[11px] text-amber-800 shrink-0 underline underline-offset-2 ml-2">
              高频生活品
            </span>
          </div>
        )}
      </div>

      {/* 2. Search & Filter Bar & Selection Floating Banner */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索品牌、品名、色号或特定成分 (如: A醇, 玻尿酸, 理肤泉)..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Privacy Hide Toggle */}
          <button
            onClick={() => setShowHiddenProducts(!showHiddenProducts)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
              showHiddenProducts 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            {showHiddenProducts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showHiddenProducts ? '隐藏私密单品' : '展示全部(含隐藏)'}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: '全部' },
            { id: 'skincare', label: '护肤' },
            { id: 'base', label: '底妆' },
            { id: 'eye', label: '眼妆' },
            { id: 'lip', label: '唇妆' },
            { id: 'tool', label: '工具' },
            { id: 'in_use', label: '正在使用' },
            { id: 'idle', label: '闲置拯救' },
            { id: 'expiring_soon', label: '临期' },
            { id: 'used_up', label: '已用完' },
            { id: 'red', label: '红榜好物' },
            { id: 'yellow', label: '黄榜慎用' },
            { id: 'black', label: '黑榜避雷' }
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                  isActive 
                    ? 'bg-stone-900 text-white' 
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Color Tone Sub-filter for Makeup */}
        {(activeFilter === 'all' || ['base', 'eye', 'lip'].includes(activeFilter)) && (
          <div className="flex items-center gap-2 text-xs pt-1">
            <span className="text-stone-500 text-[11px]">彩妆色系筛选:</span>
            {[
              { id: 'all', label: '全部色系' },
              { id: 'warm', label: '暖调 (暖橘/金棕/红茶)' },
              { id: 'cool', label: '冷调 (冷粉/紫灰/冷棕)' },
              { id: 'neutral', label: '中性裸调' },
            ].map((tone) => (
              <button
                key={tone.id}
                onClick={() => setActiveColorTone(tone.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                  activeColorTone === tone.id 
                    ? 'bg-stone-800 text-white font-medium' 
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>
        )}

        {/* Batch Operations Bar */}
        {selectedProductIds.length > 0 && (
          <div className="p-3 bg-stone-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-md animate-in fade-in">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold">已勾选 {selectedProductIds.length} 件产品</span>
              <button onClick={selectAll} className="text-stone-300 underline hover:text-white">
                {selectedProductIds.length === filteredProducts.length ? '取消全选' : '全选当前'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Compatibility Check */}
              <button
                onClick={handleLaunchCompatibility}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>搭配检测 ({selectedProductIds.length})</span>
              </button>

              {/* Batch State Update */}
              <button
                onClick={() => onBatchUpdateStatus(selectedProductIds, 'idle')}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg"
              >
                设为闲置
              </button>
              <button
                onClick={() => onBatchUpdateStatus(selectedProductIds, 'in_use')}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg"
              >
                设为在用
              </button>

              {/* Batch List Status */}
              <button
                onClick={() => onBatchUpdateListStatus(selectedProductIds, 'red')}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-rose-900/60 text-rose-300 rounded-lg"
              >
                移入红榜
              </button>
              <button
                onClick={() => onBatchUpdateListStatus(selectedProductIds, 'black')}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-red-900/60 text-red-300 rounded-lg"
              >
                移入黑榜
              </button>

              {/* Batch Delete */}
              <button
                onClick={() => {
                  if (confirm(`确定要批量删除选中的 ${selectedProductIds.length} 件产品吗？`)) {
                    onBatchDelete(selectedProductIds);
                    setSelectedProductIds([]);
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>批量删除</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <Layers className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-800">没有找到匹配的产品</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            尝试更换搜索词或重置筛选条件，也可以轻触上方“拍照录入”为您的化妆台增添新藏品。
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveFilter('all'); setActiveColorTone('all'); }}
            className="mt-4 px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            重置全部筛选
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            const isExpiring = product.status === 'expiring_soon';
            const isBlacklist = product.list_status === 'black';
            const isUsedUp = product.status === 'used_up';
            const daysSinceUsed = getDaysSinceLastUsed(product.last_used_at);
            const isLongIdle = daysSinceUsed >= 45 && product.status !== 'used_up';

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between relative group ${
                  isSelected 
                    ? 'border-stone-900 ring-2 ring-stone-900/10 shadow-sm' 
                    : isExpiring 
                    ? 'border-amber-300/80 bg-amber-50/20' 
                    : isBlacklist
                    ? 'border-rose-300/80 bg-rose-50/15'
                    : isUsedUp
                    ? 'border-stone-300 bg-stone-50/60 opacity-80'
                    : 'border-stone-200/80 hover:border-stone-300 shadow-2xs'
                }`}
              >
                <div>
                  {/* Top Bar on Card: Category, Status & Selection */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                      <span className="font-medium text-stone-800">{product.subcategory || product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>PAO {product.pao_months}M</span>
                      {product.quantity > 1 && (
                        <span className="bg-stone-100 text-stone-700 px-1 rounded font-mono">
                          ×{product.quantity}
                        </span>
                      )}
                      {product.color_tone && product.color_tone !== 'none' && (
                        <span className="text-stone-500">
                          · {product.color_tone === 'warm' ? '暖调' : product.color_tone === 'cool' ? '冷调' : '中性'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Privacy icon */}
                      {product.is_hidden && (
                        <span title="已设为私密隐藏">
                          <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                        </span>
                      )}

                      {/* List Status Label (Red/Yellow/Black) */}
                      {product.list_status === 'red' && (
                        <span className="text-[11px] text-rose-700 font-medium">
                          红榜好物
                        </span>
                      )}
                      {product.list_status === 'yellow' && (
                        <span className="text-[11px] text-amber-700 font-medium">
                          黄榜慎用
                        </span>
                      )}
                      {product.list_status === 'black' && (
                        <span className="text-[11px] text-red-700 font-semibold">
                          黑榜避雷
                        </span>
                      )}

                      {/* Select Checkbox for batch actions */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }}
                        title="勾选管理"
                        className="p-1 text-stone-400 hover:text-stone-900 transition-colors ml-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-stone-900" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-300 hover:text-stone-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Brand & Product Name */}
                  <div className="mt-3 cursor-pointer" onClick={() => onSelectProductForDetail(product)}>
                    <span className="text-xs text-stone-500 font-serif tracking-tight block">
                      {product.brand}
                    </span>
                    <h3 className="text-sm font-semibold text-stone-900 mt-0.5 line-clamp-2 hover:text-stone-700 transition-colors">
                      {product.product_name}
                    </h3>

                    {/* Shade if applicable */}
                    {product.shade_name && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-600">
                        {product.shade_hex && (
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" 
                            style={{ backgroundColor: product.shade_hex }}
                          />
                        )}
                        <span className="font-medium text-stone-700">{product.shade_name}</span>
                      </div>
                    )}

                    {/* Expiry / Usage Dates */}
                    <div className="mt-2.5 flex items-center gap-2 text-[11px] text-stone-500">
                      <span>开封: {product.opened_date || '未记录'}</span>
                      <span aria-hidden="true">·</span>
                      <span className={isExpiring ? 'text-amber-700 font-semibold' : ''}>
                        到期: {product.expiry_date}
                      </span>
                    </div>

                    {/* Idle warning badge if not used for a long time */}
                    {isLongIdle && (
                      <div className="mt-2 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                        ⚠️ 已闲置 {daysSinceUsed} 天未调用 · 建议搭配活用或拯救
                      </div>
                    )}

                    {/* Used Up status */}
                    {isUsedUp && (
                      <div className="mt-2 text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded inline-block">
                        已空瓶 · 可参与绿色循环
                      </div>
                    )}

                    {/* Shelf Location */}
                    {product.shelf_location && (
                      <div className="mt-1 text-[11px] text-stone-400">
                        位置: {product.shelf_location}
                      </div>
                    )}

                    {/* Allergen or Risk Tag Warning */}
                    {product.allergen_tags && product.allergen_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.allergen_tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Quick Recycle if empty */}
                    {isUsedUp ? (
                      <button
                        type="button"
                        onClick={() => onQuickRecycleUsedUp(product)}
                        className="text-[11px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors font-medium flex items-center gap-1"
                      >
                        <Recycle className="w-3 h-3" />
                        <span>空瓶回收</span>
                      </button>
                    ) : product.status === 'idle' || (product.repurpose_ideas && product.repurpose_ideas.length > 0) ? (
                      <button
                        type="button"
                        onClick={() => onOpenIdleRescue(product)}
                        className="text-[11px] text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md transition-colors font-medium flex items-center gap-1"
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span>闲置拯救</span>
                      </button>
                    ) : null}

                    {/* Quick compatibility test */}
                    <button
                      type="button"
                      onClick={() => onOpenCompatibilityWithSelected([product])}
                      className="text-[11px] text-stone-600 hover:text-stone-900 px-2 py-1 rounded-md hover:bg-stone-100 transition-colors"
                    >
                      检测搭配
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectProductForDetail(product)}
                    className="text-xs font-medium text-stone-900 hover:underline underline-offset-2"
                  >
                    详情编辑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
