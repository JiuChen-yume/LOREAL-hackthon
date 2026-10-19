import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Save, 
  AlertTriangle, 
  ShieldAlert, 
  Heart, 
  Clock, 
  MapPin, 
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { BeautyProduct, ListRating, ProductStatus, ProductCategory } from '../types/beauty';

interface ProductDetailModalProps {
  product: BeautyProduct;
  onClose: () => void;
  onUpdate: (updated: BeautyProduct) => void;
  onDelete: (id: string) => void;
  onOpenCompatibility: (product: BeautyProduct) => void;
  onOpenIdleRescue: (product: BeautyProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onUpdate,
  onDelete,
  onOpenCompatibility,
  onOpenIdleRescue
}) => {
  const [brand, setBrand] = useState(product.brand);
  const [productName, setProductName] = useState(product.product_name);
  const [category, setCategory] = useState<ProductCategory>(product.category);
  const [subcategory, setSubcategory] = useState(product.subcategory || '');
  const [shadeName, setShadeName] = useState(product.shade_name || '');
  const [size, setSize] = useState(product.size || '');
  const [openedDate, setOpenedDate] = useState(product.opened_date || '');
  const [paoMonths, setPaoMonths] = useState(product.pao_months || 12);
  const [expiryDate, setExpiryDate] = useState(product.expiry_date || '');
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [listStatus, setListStatus] = useState<ListRating>(product.list_status);
  const [quantity, setQuantity] = useState<number>(product.quantity || 1);
  const [isHidden, setIsHidden] = useState<boolean>(product.is_hidden || false);
  const [shelfLocation, setShelfLocation] = useState(product.shelf_location || '');
  const [userNotes, setUserNotes] = useState(product.user_notes || '');
  const [ingredientsText, setIngredientsText] = useState(product.ingredients.join(', '));
  const [allergenTagsText, setAllergenTagsText] = useState(product.allergen_tags.join(', '));
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BeautyProduct = {
      ...product,
      brand,
      product_name: productName,
      category,
      subcategory,
      shade_name: shadeName || undefined,
      size: size || undefined,
      opened_date: openedDate,
      pao_months: paoMonths,
      expiry_date: expiryDate,
      status,
      list_status: listStatus,
      quantity,
      is_hidden: isHidden,
      shelf_location: shelfLocation || undefined,
      user_notes: userNotes || undefined,
      ingredients: ingredientsText ? ingredientsText.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : [],
      allergen_tags: allergenTagsText ? allergenTagsText.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : []
    };
    onUpdate(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <span className="text-[11px] text-stone-500 font-medium">产品全生命周期档案</span>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-stone-900 mt-0.5">
              {product.product_name}
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">品牌</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">产品完整名称</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">品类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
              >
                <option value="skincare">护肤</option>
                <option value="base">底妆</option>
                <option value="eye">眼妆</option>
                <option value="lip">唇妆</option>
                <option value="tool">工具</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">子分类</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">色号 / 规格</label>
              <input
                type="text"
                value={shadeName}
                onChange={(e) => setShadeName(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          {/* List Status & Usage Status */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/60">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                肌肤记忆归属 (红/黄/黑榜)
              </label>
              <select
                value={listStatus}
                onChange={(e) => setListStatus(e.target.value as any)}
                className="w-full p-2 text-xs bg-white border border-stone-200 rounded-lg font-medium"
              >
                <option value="none">暂不入榜 (中立待观察)</option>
                <option value="red">❤️ 红榜好物 (高耐受/优先使用)</option>
                <option value="yellow">⚠️ 黄榜慎用 (需控量/季相搭配)</option>
                <option value="black">⛔ 黑榜避雷 (排程与推荐绝对阻断)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                当前使用状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2 text-xs bg-white border border-stone-200 rounded-lg"
              >
                <option value="in_use">正在使用 (常备活跃)</option>
                <option value="idle">闲置状态 (待拯救妙用)</option>
                <option value="expiring_soon">临期预警 (≤30天加速消耗)</option>
                <option value="expired">已过期 (建议清洁剂/回收)</option>
                <option value="used_up">已用完 (空瓶待投递)</option>
              </select>
            </div>
          </div>

          {/* Stock Quantity & Privacy Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                库存件数 (多件囤货管理)
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono tabular-numbers"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="rounded text-stone-900 focus:ring-stone-900"
                />
                <span className="font-medium">设为私密隐藏 (保护隐私)</span>
              </label>
            </div>
          </div>

          {/* Dates & PAO */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">开封日期</label>
              <input
                type="date"
                value={openedDate}
                onChange={(e) => setOpenedDate(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">PAO 周期</label>
              <select
                value={paoMonths}
                onChange={(e) => setPaoMonths(Number(e.target.value))}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
              >
                <option value={6}>6M (半年)</option>
                <option value={12}>12M (1 年)</option>
                <option value={18}>18M (1.5 年)</option>
                <option value={24}>24M (2 年)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">到期日期</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              摆放位置 (如: 二阶抽屉/防晒区)
            </label>
            <input
              type="text"
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
              className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              主要成分列表 (参与 AI 碰撞检测)
            </label>
            <textarea
              rows={2}
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              个人使用笔记 / 肤感评价
            </label>
            <textarea
              rows={2}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="记录用量、是否搓泥、与哪款粉底最合拍等..."
              className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
            />
          </div>

          {/* Quick utility actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCompatibility(product);
              }}
              className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium"
            >
              检测成分搭配
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenIdleRescue(product);
              }}
              className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium"
            >
              闲置拯救方案
            </button>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                if (confirm(`确定要从化妆台删除「${product.product_name}」吗？`)) {
                  onDelete(product.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>移出化妆台</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
              >
                {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? '已保存' : '保存修改'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
