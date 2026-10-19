import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Info,
  Clock,
  Layers
} from 'lucide-react';
import { BeautyProduct, BlacklistIngredient } from '../types/beauty';

interface CompatibilityModalProps {
  initialProducts: BeautyProduct[];
  allProducts: BeautyProduct[];
  blacklist: BlacklistIngredient[];
  onClose: () => void;
}

export const CompatibilityModal: React.FC<CompatibilityModalProps> = ({
  initialProducts,
  allProducts,
  blacklist,
  onClose
}) => {
  const [selectedProducts, setSelectedProducts] = useState<BeautyProduct[]>(() => {
    if (initialProducts.length > 0) return initialProducts;
    // Default pick Retinol cream + Glycolic Acid serum to immediately demonstrate the competition narrative!
    const retinol = allProducts.find(p => p.product_name.includes('A醇'));
    const acid = allProducts.find(p => p.product_name.includes('果酸'));
    const b5 = allProducts.find(p => p.product_name.includes('B5'));
    return [retinol, acid, b5].filter(Boolean) as BeautyProduct[];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  // Run compatibility check
  const runCheck = async (productsToCheck: BeautyProduct[]) => {
    if (productsToCheck.length < 2) {
      setReport(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/compatibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productsToCheck,
          blacklist: blacklist.map(b => b.name)
        })
      });
      const data: any = await response.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runCheck(selectedProducts);
  }, []);

  const toggleProduct = (product: BeautyProduct) => {
    let updated: BeautyProduct[];
    if (selectedProducts.some(p => p.id === product.id)) {
      updated = selectedProducts.filter(p => p.id !== product.id);
    } else {
      if (selectedProducts.length >= 5) return;
      updated = [...selectedProducts, product];
    }
    setSelectedProducts(updated);
    runCheck(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>高价值子功能</span>
              <span aria-hidden="true">·</span>
              <span>成分化学冲突排查</span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-stone-900 mt-0.5">
              产品兼容性与刺激性检测
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product selector strip (pick 2-5 products) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-stone-800">
              已选待检测单品 ({selectedProducts.length}/5 件，建议 2-5 件)
            </span>
            <span className="text-stone-500">点击下方标签可切换</span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 border border-stone-200/60 rounded-xl max-h-32 overflow-y-auto">
            {allProducts.filter(p => p.category === 'skincare' || p.category === 'base').map((p) => {
              const isSelected = selectedProducts.some(sp => sp.id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProduct(p)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-stone-900 border-stone-900 text-white font-medium shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {p.product_name.slice(0, 14)}...
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <Sparkles className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
            <p className="text-xs font-semibold text-stone-800">AI 正在扫描成分分子量与活性物相互作用...</p>
            <p className="text-[11px] text-stone-500">审查 A醇/果酸、pH值抵消与黑榜避雷规则</p>
          </div>
        )}

        {/* Report Output */}
        {!isLoading && report && (
          <div className="space-y-4">
            {/* Safety Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              report.safety_level === 'danger'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : report.safety_level === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              {report.safety_level === 'danger' ? (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : report.safety_level === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-semibold">
                  {report.safety_level === 'danger' ? '高刺激冲突警告 (不建议同时使用)' : report.safety_level === 'warning' ? '需注意使用频率与搭配间隔' : '搭配温和相容'}
                </h4>
                <p className="text-xs mt-1 leading-relaxed">
                  {report.summary}
                </p>
              </div>
            </div>

            {/* Chemical Conflicts Detail */}
            {report.conflicts && report.conflicts.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-stone-800 block">冲突成分详细机理：</span>
                {report.conflicts.map((conf: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-rose-800 font-semibold">
                      <span>{conf.product_a}</span>
                      <span>×</span>
                      <span>{conf.product_b}</span>
                    </div>
                    <div className="text-[11px] text-stone-600">
                      冲突对: <strong>{conf.ingredient_a}</strong> + <strong>{conf.ingredient_b}</strong>
                    </div>
                    <p className="text-stone-700 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200/50">
                      {conf.risk_description}
                    </p>
                    <div className="p-2 bg-amber-50 text-amber-900 rounded-lg font-medium text-[11px]">
                      💡 <strong>调整建议：</strong>{conf.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommended order */}
            {report.recommended_order && (
              <div>
                <span className="text-xs font-semibold text-stone-800 block mb-2">
                  推荐使用顺序与分流方案：
                </span>
                <div className="space-y-1.5">
                  {report.recommended_order.map((ord: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-mono">
                          {ord.step}
                        </span>
                        <span className="font-semibold text-stone-900">{ord.product_name}</span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {ord.timing} · {ord.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer Requirement */}
            <div className="p-3 bg-stone-100/70 rounded-xl text-[11px] text-stone-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{report.disclaimer || '护肤搭配建议，不构成医疗诊断。'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800"
          >
            关闭检测
          </button>
        </div>
      </div>
    </div>
  );
};
