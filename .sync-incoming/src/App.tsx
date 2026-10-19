/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navigation, MobileTabBar, ActiveTab } from './components/Navigation';
import { HomeCompanion } from './components/HomeCompanion';
import { VanityHub } from './components/VanityHub';
import { CareRoutine } from './components/CareRoutine';
import { MakeupStudio } from './components/MakeupStudio';
import { SkinMemory } from './components/SkinMemory';
import { DiscoveryMall } from './components/DiscoveryMall';
import { BeautyCircular } from './components/BeautyCircular';

import { AddProductModal } from './components/AddProductModal';
import { CompatibilityModal } from './components/CompatibilityModal';
import { IdleRescueModal } from './components/IdleRescueModal';
import { ProductDetailModal } from './components/ProductDetailModal';

// WeChat Mini-Program Screens matching user mockup UI
import { WeChatFrame, MiniProgramTab } from './components/ui/WeChatFrame';
import { HomeScreen } from './components/screens/HomeScreen';
import { VanityScreen } from './components/screens/VanityScreen';
import { CarePlanScreen } from './components/screens/CarePlanScreen';
import { MakeupScreen } from './components/screens/MakeupScreen';
import { MallScreen } from './components/screens/MallScreen';
import { CircularScreen } from './components/screens/CircularScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { RoutinePushReminderModal } from './components/routine/RoutinePushReminderModal';

import { 
  BeautyProduct, 
  RoutinePlan, 
  MakeupLook, 
  MallItem, 
  CircularRecycleRecord, 
  BlacklistIngredient,
  SkinFeedbackLog,
  CyclePhase,
  IdolCompanionProfile,
  ProductStatus,
  ListRating,
  RoutineReminderSettings
} from './types/beauty';

import { 
  INITIAL_PRODUCTS, 
  INITIAL_BLACKLIST, 
  INITIAL_ROUTINE_PLAN, 
  INITIAL_MAKEUP_LOOKS, 
  INITIAL_MALL_ITEMS, 
  INITIAL_RECYCLE_RECORDS 
} from './data/mockData';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Accessibility & UI Modes (Default to WeChat Mini-Program for user presentation)
  const [isMobilePreview, setIsMobilePreview] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Female Physiological Cycle State
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>(() => {
    try {
      const saved = localStorage.getItem('vanity_cycle_phase');
      if (saved) return saved as CyclePhase;
    } catch (e) {}
    return 'follicular';
  });

  // Idol Companion Profile State (From Proposal)
  const [idolProfile, setIdolProfile] = useState<IdolCompanionProfile>(() => {
    try {
      const saved = localStorage.getItem('vanity_idol_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      style: 'idol',
      idolName: '田柾国',
      cosProjectName: '赛博机械精灵',
      reminderTimeMorning: '08:30',
      reminderTimeEvening: '22:00'
    };
  });

  // Core Data Center State (Persisted in localStorage with fallback)
  const [products, setProducts] = useState<BeautyProduct[]>(() => {
    try {
      const saved = localStorage.getItem('vanity_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PRODUCTS;
  });

  const [blacklist, setBlacklist] = useState<BlacklistIngredient[]>(() => {
    try {
      const saved = localStorage.getItem('vanity_blacklist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_BLACKLIST;
  });

  const [routinePlan, setRoutinePlan] = useState<RoutinePlan>(() => {
    try {
      const saved = localStorage.getItem('vanity_routine_plan');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_ROUTINE_PLAN;
  });

  const [looks, setLooks] = useState<MakeupLook[]>(() => {
    try {
      const saved = localStorage.getItem('vanity_looks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MAKEUP_LOOKS;
  });

  const [mallItems, setMallItems] = useState<MallItem[]>(INITIAL_MALL_ITEMS);
  const [recycleRecords, setRecycleRecords] = useState<CircularRecycleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('vanity_recycle_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RECYCLE_RECORDS;
  });

  const [feedbackLogs, setFeedbackLogs] = useState<SkinFeedbackLog[]>(() => {
    try {
      const saved = localStorage.getItem('vanity_feedback_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'log_prev_1',
        date: '2026-10-14',
        routine_type: 'morning',
        feelings: ['舒服水润'],
        mood: '充满元气',
        notes: '黑精华打底配合色修，早起泛红明显减轻，上粉底一整天不卡粉。',
        products_used_ids: ['prod_1', 'prod_5', 'prod_10']
      }
    ];
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'camera' | 'barcode' | 'manual' | 'batch'>('barcode');
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [compatibilityTargetProducts, setCompatibilityTargetProducts] = useState<BeautyProduct[]>([]);
  const [idleRescueProduct, setIdleRescueProduct] = useState<BeautyProduct | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<BeautyProduct | null>(null);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showGlobalReminderModal, setShowGlobalReminderModal] = useState(false);
  const [globalReminderType, setGlobalReminderType] = useState<'morning' | 'evening'>('morning');

  const [reminderSettings, setReminderSettings] = useState<RoutineReminderSettings>(() => {
    try {
      const saved = localStorage.getItem('vanity_routine_reminder');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      morningTime: '08:00',
      eveningTime: '21:30',
      webPushGranted: false,
      coreAdviceMorning: '受干燥冷空气影响，角质层水分流失较快。晨间建议「温和无泡洁面 + 拍敷精华水」，选用滋润型乳液锁水，最后务必使用温和防晒成膜，抵御光老化与泛红。',
      coreAdviceEvening: '夜间为屏障密集修护期。先用舒妍卸妆水彻底溶解彩妆浮尘，再厚敷二裂酵母修复精华深层滋养，夜间切忌高浓度频繁刷酸。'
    };
  });

  useEffect(() => {
    localStorage.setItem('vanity_routine_reminder', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  // Async API loading indicators
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingLook, setIsGeneratingLook] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('vanity_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('vanity_blacklist', JSON.stringify(blacklist));
  }, [blacklist]);

  useEffect(() => {
    localStorage.setItem('vanity_routine_plan', JSON.stringify(routinePlan));
  }, [routinePlan]);

  useEffect(() => {
    localStorage.setItem('vanity_looks', JSON.stringify(looks));
  }, [looks]);

  useEffect(() => {
    localStorage.setItem('vanity_feedback_logs', JSON.stringify(feedbackLogs));
  }, [feedbackLogs]);

  useEffect(() => {
    localStorage.setItem('vanity_cycle_phase', cyclePhase);
  }, [cyclePhase]);

  useEffect(() => {
    localStorage.setItem('vanity_idol_profile', JSON.stringify(idolProfile));
  }, [idolProfile]);

  useEffect(() => {
    localStorage.setItem('vanity_recycle_records', JSON.stringify(recycleRecords));
  }, [recycleRecords]);

  // High contrast effect
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('accessibility-high-contrast');
    } else {
      document.body.classList.remove('accessibility-high-contrast');
    }
  }, [isHighContrast]);

  // Gentle voice synthesis greeting with Idol awareness
  const speakGentleGreeting = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const idolGreeting = idolProfile.style === 'idol' && idolProfile.idolName
        ? `早上好！${idolProfile.idolName}也在好好照顾自己，今天想让自己轻松一点，还是精致一点？不用追求完美，健康通透便是最好的状态。`
        : "早上好。今天想让自己轻松一点，还是精致一点？护肤是一场温和照顾自己的时刻，健康通透便是最好的状态。";

      const utterance = new SpeechSynthesisUtterance(idolGreeting);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("早上好！今天想让自己轻松一点，还是精致一点？护肤是一场照顾自己的温柔时刻。");
    }
  };

  // Synced products from vanity to daily routine plan
  const [syncedPlanProducts, setSyncedPlanProducts] = useState<BeautyProduct[]>(() => {
    try {
      const saved = localStorage.getItem('vanity_synced_plan_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleAddToTodayPlan = (product: BeautyProduct) => {
    setSyncedPlanProducts(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }
      const next = [product, ...prev];
      localStorage.setItem('vanity_synced_plan_products', JSON.stringify(next));
      return next;
    });
  };

  // 1. Add Product Handlers
  const handleAddProduct = (newProduct: BeautyProduct) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleAddBatchProducts = (batch: BeautyProduct[]) => {
    setProducts(prev => [...batch, ...prev]);
  };

  // 2. Update Product Handler
  const handleUpdateProduct = (updated: BeautyProduct) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // 3. Delete Product Handler
  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // 4. Batch Operations
  const handleBatchUpdateStatus = (ids: string[], newStatus: ProductStatus) => {
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: newStatus } : p));
  };

  const handleBatchUpdateListStatus = (ids: string[], newListStatus: ListRating) => {
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, list_status: newListStatus } : p));
  };

  const handleBatchDelete = (ids: string[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)));
  };

  // 5. Quick Recycle from empty bottle
  const handleQuickRecycleUsedUp = (product: BeautyProduct) => {
    const newRecord: CircularRecycleRecord = {
      id: `rec_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      station_name: '巴黎欧莱雅环球港旗舰店 · 绿色循环服务站',
      type: 'glass_bottle',
      item_name: `${product.brand} ${product.product_name} (空瓶投递)`,
      points: 100,
      status: 'verified'
    };
    setRecycleRecords(prev => [newRecord, ...prev]);
    setActiveTab('circular');
  };

  // 6. Data Export (Privacy compliance from proposal)
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      products,
      blacklist,
      routinePlan,
      looks,
      feedbackLogs,
      exported_at: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `my_vanity_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 7. Stinging report -> moves to blacklist and extracts allergen
  const handleReportStinging = (productId: string, productName: string) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    // Move product to blacklist
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          list_status: 'black',
          user_notes: '使用后两颊刺痛灼热，已自动加入黑榜拦截。'
        };
      }
      return p;
    }));

    // Extract potential allergen if not in blacklist
    const extractedTag = target.allergen_tags[0] || `${productName} 所含高刺激成分`;
    if (!blacklist.some(b => b.name === extractedTag)) {
      setBlacklist(prev => [
        {
          name: extractedTag,
          risk_level: 'high',
          reason: `用户在使用「${productName}」时记录了明显刺痛灼热，系统自动提取拦截。`,
          associated_products_count: 1
        },
        ...prev
      ]);
    }
  };

  // 8. Generate Routine Plan (3min/5min/full, onlyVanity)
  const handleGeneratePlan = async (options: { timeBudget: '3min' | '5min' | 'full'; onlyVanity: boolean }) => {
    setIsGeneratingPlan(true);
    try {
      const response = await fetch('/api/home/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeBudget: options.timeBudget,
          onlyVanity: options.onlyVanity,
          vanityProducts: products.filter(p => p.list_status !== 'black'),
          blacklist: blacklist.map(b => b.name),
          skinCondition: cyclePhase === 'luteal' ? '黄体期偏油易爆痘' : cyclePhase === 'menstrual' ? '经期脆弱易泛红' : '偏干，局部微泛红'
        })
      });
      const data = await response.json();
      if (data.success && data.plan) {
        setRoutinePlan({
          ...data.plan,
          id: `plan_${Date.now()}`,
          mode: 'routine',
          time_budget: options.timeBudget,
          only_vanity: options.onlyVanity,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // 9. Generate Special Scenario Routine
  const handleGenerateSpecialScenario = async (scenario: string) => {
    setIsGeneratingPlan(true);
    try {
      const response = await fetch('/api/home/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialScenario: scenario,
          timeBudget: '5min',
          onlyVanity: true,
          vanityProducts: products.filter(p => p.list_status !== 'black'),
          blacklist: blacklist.map(b => b.name),
          skinCondition: `${scenario}特殊应激状态`
        })
      });
      const data = await response.json();
      if (data.success && data.plan) {
        setRoutinePlan({
          ...data.plan,
          id: `plan_${Date.now()}`,
          mode: 'special',
          special_scenario: scenario,
          time_budget: '5min',
          only_vanity: true,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // 10. Generate Makeup Look
  const handleGenerateAILook = async (params: { lookType: 'daily' | 'imitation' | 'cos'; referenceText?: string }) => {
    setIsGeneratingLook(true);
    try {
      const response = await fetch('/api/makeup/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookType: params.lookType,
          referenceDescription: params.referenceText,
          vanityProducts: products.filter(p => p.category !== 'skincare' && p.list_status !== 'black')
        })
      });
      const data = await response.json();
      if (data.success && data.look) {
        const newLook: MakeupLook = {
          ...data.look,
          id: `look_${Date.now()}`,
          type: params.lookType,
          created_at: new Date().toISOString().split('T')[0]
        };
        setLooks(prev => [newLook, ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingLook(false);
    }
  };

  // 11. Rate Look to 3 Lists
  const handleRateLookToList = (lookTitle: string, rating: 'red' | 'yellow' | 'black', reason: string) => {
    // Save to feedback logs
    const newFeedback: SkinFeedbackLog = {
      id: `look_rating_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      routine_type: 'morning',
      feelings: [rating === 'red' ? '妆造巨适配' : rating === 'black' ? '妆面不适' : '效果一般'],
      mood: '犒劳自己',
      notes: `【妆造评价-${lookTitle}】${reason}`,
      products_used_ids: []
    };
    setFeedbackLogs(prev => [newFeedback, ...prev]);
  };

  // Navigation to Idle Rescue from Discovery Mall
  const handleNavigateToVanityRescue = (productName: string) => {
    setActiveTab('vanity');
    const match = products.find(p => p.product_name.includes(productName) || productName.includes(p.product_name));
    if (match) {
      setIdleRescueProduct(match);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-stone-900 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar matching the warm luxury aesthetic */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        onQuickAddProduct={() => {
          setAddModalMode('barcode');
          setShowAddModal(true);
        }}
        onSpeakGreeting={speakGentleGreeting}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto px-0 sm:px-4 py-0 sm:py-6 flex justify-center items-start">
        {isMobilePreview ? (
          /* WeChat Mini-Program Experience */
          <div className="w-full flex justify-center">

            <WeChatFrame
              currentTab={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'home' && (
                <HomeScreen
                  onNavigate={setActiveTab}
                  onOpenAddModal={(m) => {
                    setAddModalMode(m || 'barcode');
                    setShowAddModal(true);
                  }}
                  onOpenRoutineReminder={(t) => {
                    setGlobalReminderType(t);
                    setShowGlobalReminderModal(true);
                  }}
                  reminderSettings={reminderSettings}
                  products={products}
                />
              )}

              {activeTab === 'vanity' && (
                <VanityScreen
                  products={products}
                  onOpenAddModal={() => {
                    setAddModalMode('barcode');
                    setShowAddModal(true);
                  }}
                  onSelectProductForDetail={(p) => setSelectedProductForDetail(p)}
                  onOpenCompatibility={(selected) => {
                    setCompatibilityTargetProducts(selected);
                    setShowCompatibilityModal(true);
                  }}
                  onAddToTodayPlan={handleAddToTodayPlan}
                />
              )}

              {activeTab === 'routine' && (
                <CarePlanScreen
                  routinePlan={routinePlan}
                  products={products}
                  syncedProducts={syncedPlanProducts}
                  onBack={() => setActiveTab('home')}
                  onGeneratePlan={() => handleGeneratePlan({ timeBudget: '5min', onlyVanity: true })}
                  isGenerating={isGeneratingPlan}
                  reminderSettings={reminderSettings}
                  onUpdateReminderSettings={setReminderSettings}
                  onAddFeedbackLog={(log) => setFeedbackLogs(prev => [log, ...prev])}
                />
              )}

              {activeTab === 'makeup' && (
                <MakeupScreen
                  products={products}
                  looks={looks}
                  onGenerateLook={handleGenerateAILook}
                  onRateLook={handleRateLookToList}
                  isGenerating={isGeneratingLook}
                />
              )}

              {activeTab === 'mall' && (
                <MallScreen
                  mallItems={mallItems}
                  vanityProducts={products}
                  onNavigateToVanityRescue={handleNavigateToVanityRescue}
                />
              )}

              {activeTab === 'circular' && (
                <CircularScreen
                  recycleRecords={recycleRecords}
                  onAddRecycleRecord={(rec) => setRecycleRecords(prev => [rec, ...prev])}
                />
              )}

              {activeTab === 'memory' && (
                <ProfileScreen
                  products={products}
                  blacklist={blacklist}
                  feedbackLogs={feedbackLogs}
                  cyclePhase={cyclePhase}
                  onUpdateCyclePhase={setCyclePhase}
                  idolProfile={idolProfile}
                  onUpdateIdolProfile={setIdolProfile}
                  onAddBlacklistIngredient={(item) => setBlacklist(prev => [item, ...prev])}
                  onRemoveBlacklistIngredient={(name) => setBlacklist(prev => prev.filter(b => b.name !== name))}
                  onUpdateProductListStatus={(productId, status) => setProducts(prev => prev.map(p => p.id === productId ? { ...p, list_status: status } : p))}
                  onAddFeedbackLog={(log) => setFeedbackLogs(prev => [log, ...prev])}
                  onExportData={handleExportData}
                  onShowPrivacyModal={() => setShowPrivacyPolicyModal(true)}
                />
              )}
            </WeChatFrame>
          </div>
        ) : (
          /* Responsive Unified Luxury View */
          <div className="w-full max-w-2xl mx-auto bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-sm border border-[#EDE5DE]">
            {activeTab === 'home' && (
              <HomeScreen
                onNavigate={setActiveTab}
                onOpenAddModal={(m) => {
                  setAddModalMode(m || 'barcode');
                  setShowAddModal(true);
                }}
                onOpenRoutineReminder={(t) => {
                  setGlobalReminderType(t);
                  setShowGlobalReminderModal(true);
                }}
                reminderSettings={reminderSettings}
                products={products}
              />
            )}

            {activeTab === 'vanity' && (
              <VanityScreen
                products={products}
                onOpenAddModal={() => {
                  setAddModalMode('barcode');
                  setShowAddModal(true);
                }}
                onSelectProductForDetail={(p) => setSelectedProductForDetail(p)}
                onOpenCompatibility={(selected) => {
                  setCompatibilityTargetProducts(selected);
                  setShowCompatibilityModal(true);
                }}
                onAddToTodayPlan={handleAddToTodayPlan}
              />
            )}

            {activeTab === 'routine' && (
              <CarePlanScreen
                routinePlan={routinePlan}
                products={products}
                syncedProducts={syncedPlanProducts}
                onBack={() => setActiveTab('home')}
                onGeneratePlan={() => handleGeneratePlan({ timeBudget: '5min', onlyVanity: true })}
                isGenerating={isGeneratingPlan}
                reminderSettings={reminderSettings}
                onUpdateReminderSettings={setReminderSettings}
                onAddFeedbackLog={(log) => setFeedbackLogs(prev => [log, ...prev])}
              />
            )}

            {activeTab === 'makeup' && (
              <MakeupScreen
                products={products}
                looks={looks}
                onGenerateLook={handleGenerateAILook}
                onRateLook={handleRateLookToList}
                isGenerating={isGeneratingLook}
              />
            )}

            {activeTab === 'mall' && (
              <MallScreen
                mallItems={mallItems}
                vanityProducts={products}
                onNavigateToVanityRescue={handleNavigateToVanityRescue}
              />
            )}

            {activeTab === 'circular' && (
              <CircularScreen
                recycleRecords={recycleRecords}
                onAddRecycleRecord={(rec) => setRecycleRecords(prev => [rec, ...prev])}
              />
            )}

            {activeTab === 'memory' && (
              <ProfileScreen
                products={products}
                blacklist={blacklist}
                feedbackLogs={feedbackLogs}
                cyclePhase={cyclePhase}
                onUpdateCyclePhase={setCyclePhase}
                idolProfile={idolProfile}
                onUpdateIdolProfile={setIdolProfile}
                onAddBlacklistIngredient={(item) => setBlacklist(prev => [item, ...prev])}
                onRemoveBlacklistIngredient={(name) => setBlacklist(prev => prev.filter(b => b.name !== name))}
                onUpdateProductListStatus={(productId, status) => setProducts(prev => prev.map(p => p.id === productId ? { ...p, list_status: status } : p))}
                onAddFeedbackLog={(log) => setFeedbackLogs(prev => [log, ...prev])}
                onExportData={handleExportData}
                onShowPrivacyModal={() => setShowPrivacyPolicyModal(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* Warm Luxury Footer */}
      <footer className="border-t border-[#EDE5DE] bg-[#FAF6F3] py-4 px-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 我的化妆台 · AI 美妆护肤伴侣. 陪伴取悦自我的每一天</p>
          <div className="flex items-center gap-4 text-[11px] text-stone-600">
            <button
              onClick={() => setShowPrivacyPolicyModal(true)}
              className="hover:text-stone-900 underline underline-offset-2"
            >
              隐私保护与医疗免责声明
            </button>
            <button
              onClick={handleExportData}
              className="hover:text-stone-900 underline underline-offset-2"
            >
              导出全量数据 (JSON)
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Tab Bar on Small Screens when not in WeChat frame */}
      {!isMobilePreview && (
        <div className="lg:hidden">
          <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}

      {/* Global Modals */}
      {showAddModal && (
        <AddProductModal
          initialMode={addModalMode}
          onClose={() => setShowAddModal(false)}
          onAddProduct={handleAddProduct}
          onAddBatchProducts={handleAddBatchProducts}
        />
      )}

      {showCompatibilityModal && (
        <CompatibilityModal
          initialProducts={compatibilityTargetProducts}
          allProducts={products}
          blacklist={blacklist}
          onClose={() => setShowCompatibilityModal(false)}
        />
      )}

      {idleRescueProduct && (
        <IdleRescueModal
          product={idleRescueProduct}
          onClose={() => setIdleRescueProduct(null)}
          onSaveRepurposeIdea={(productId, idea) => {
            setProducts(prev => prev.map(p => {
              if (p.id === productId) {
                return {
                  ...p,
                  repurpose_ideas: [...(p.repurpose_ideas || []), idea]
                };
              }
              return p;
            }));
          }}
        />
      )}

      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onUpdate={handleUpdateProduct}
          onDelete={handleDeleteProduct}
          onOpenCompatibility={(p) => {
            setCompatibilityTargetProducts([p]);
            setShowCompatibilityModal(true);
          }}
          onOpenIdleRescue={(p) => setIdleRescueProduct(p)}
        />
      )}

      {/* Privacy and Medical Disclaimer Modal */}
      {showPrivacyPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <h3 className="text-base font-serif font-semibold text-stone-900">
              数据隐私承诺与医疗免责声明
            </h3>
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed max-h-72 overflow-y-auto">
              <div className="p-3 bg-stone-50 rounded-xl">
                <strong className="text-stone-900 block mb-1">1. 数据完全自主私有：</strong>
                用户录入化妆台的全部美妆品牌、批号、个人日记与肤质敏感档案均归属于用户个人。系统绝不向任何外部品牌或广告联盟转让敏感数据。支持一键导出备份及一键清空。
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-amber-950">
                <strong className="block mb-1">2. 医疗健康免责声明：</strong>
                本应用提供的 AI 护理计划、成分搭配排查、闲置拯救建议及肤质分析属于日常美容护理与常识性指引，绝不构成任何专业医疗诊断、处方或临床治疗方案。若遇急性皮炎、大面积破溃、严重痤疮或持续过敏，请立即前往正规三甲医院皮肤科就医。
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setShowPrivacyPolicyModal(false)}
                className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800"
              >
                我已阅读并知悉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routine Push Notification & Core Advice Modal */}
      <RoutinePushReminderModal
        isOpen={showGlobalReminderModal}
        onClose={() => setShowGlobalReminderModal(false)}
        type={globalReminderType}
        reminderSettings={reminderSettings}
        onUpdateSettings={setReminderSettings}
        onStartRoutine={(type) => {
          setActiveTab('routine');
        }}
        products={products}
      />
    </div>
  );
}
