import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Heart, 
  X, 
  ChevronRight, 
  User, 
  UserCheck, 
  Flame, 
  Bot, 
  AlertCircle,
  HelpCircle,
  Smile,
  Palette
} from 'lucide-react';
import { UserProfile, SkinType, SkinToneType } from '../../types/auth';
import { DEMO_ACCOUNTS, GUEST_USER } from '../../data/mockUsers';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
  currentUser?: UserProfile | null;
  isModal?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onCancel,
  currentUser,
  isModal = false
}) => {
  // Tabs: 'sms' (验证码登录) | 'wechat' (微信一键登录) | 'password' (密码/注册) | 'onboarding' (个性化建档)
  const [activeTab, setActiveTab] = useState<'sms' | 'wechat' | 'password' | 'onboarding'>('sms');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState('13888886622');
  const [smsCode, setSmsCode] = useState('');
  const [password, setPassword] = useState('beauty2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // SMS Countdown
  const [countdown, setCountdown] = useState(0);
  const [smsSending, setSmsSending] = useState(false);

  // Toast / Error
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding Skin Profile Form (When registering or adjusting skin)
  const [onboardingNickname, setOnboardingNickname] = useState('晨曦');
  const [onboardingSkinType, setOnboardingSkinType] = useState<SkinType>('combination_oily');
  const [onboardingSkinTone, setOnboardingSkinTone] = useState<SkinToneType>('cool_fair');
  const [onboardingConcerns, setOnboardingConcerns] = useState<string[]>(['易泛红', 'T区出油']);
  const [onboardingCompanion, setOnboardingCompanion] = useState<string>('田柾国');
  const [onboardingCyclePhase, setOnboardingCyclePhase] = useState<'menstrual' | 'follicular' | 'ovulation' | 'luteal'>('follicular');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Trigger Mock SMS
  const handleSendSms = () => {
    if (!phone || phone.length < 11) {
      setErrorMessage('请输入正确的11位中国大陆手机号码');
      return;
    }
    setErrorMessage(null);
    setSmsSending(true);
    setTimeout(() => {
      setSmsSending(false);
      setCountdown(60);
      setSmsCode('888888'); // Auto-fill for test convenience
      showToast('验证码已发送至手机（已为您预填测试码 888888）');
    }, 600);
  };

  // Submit SMS Login
  const handleSmsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMessage('请先阅读并勾选用户服务协议与隐私条款');
      return;
    }
    if (!phone || phone.length < 11) {
      setErrorMessage('请输入正确的11位手机号码');
      return;
    }
    if (!smsCode || smsCode.length < 4) {
      setErrorMessage('请输入4-6位短信验证码');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      // Check if matches demo or create user
      const matchedDemo = DEMO_ACCOUNTS.find(d => d.phone === phone);
      if (matchedDemo) {
        showToast(`欢迎回来，${matchedDemo.profile.nickname}！已同步您的专属化妆台`);
        onLoginSuccess(matchedDemo.profile);
      } else {
        // Create new user profile with selected defaults
        const newUser: UserProfile = {
          id: `user_${Date.now()}`,
          nickname: `美妆达人_${phone.slice(-4)}`,
          phone,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          skinType: 'combination_oily',
          skinTone: 'cool_fair',
          concerns: ['易泛红', '水油平衡'],
          cyclePhase: 'follicular',
          idolCompanion: '田柾国',
          memberLevel: '普通会员',
          streakDays: 1,
          points: 200,
          isGuest: false,
          createdAt: new Date().toISOString().split('T')[0]
        };
        showToast('登录成功！已为您开启专属 AI 美妆档案');
        onLoginSuccess(newUser);
      }
    }, 600);
  };

  // Submit Password Login / Register
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMessage('请先阅读并勾选用户服务协议与隐私条款');
      return;
    }
    if (!phone || phone.length < 11) {
      setErrorMessage('请输入正确的手机账号');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('密码不能少于6位');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      if (isRegisterMode) {
        // Switch to onboarding to customize skin profile
        setActiveTab('onboarding');
        showToast('账号注册成功！请完善您的专属肤质档案');
      } else {
        const matchedDemo = DEMO_ACCOUNTS.find(d => d.phone === phone) || DEMO_ACCOUNTS[0];
        showToast(`登录成功，欢迎回来 ${matchedDemo.profile.nickname}`);
        onLoginSuccess(matchedDemo.profile);
      }
    }, 600);
  };

  // WeChat One-Click Fast Login
  const handleWechatLogin = () => {
    if (!agreeTerms) {
      setErrorMessage('请先阅读并勾选用户服务协议与隐私条款');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      const wechatUser: UserProfile = {
        id: `wx_${Date.now()}`,
        nickname: '微信用户·晚晚',
        phone: '138****6622',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        skinType: 'combination_oily',
        skinTone: 'cool_fair',
        concerns: ['换季易泛红', 'T区毛孔', '水油平衡'],
        cyclePhase: 'follicular',
        idolCompanion: '田柾国',
        memberLevel: '黑金挚友',
        streakDays: 19,
        points: 1350,
        isGuest: false,
        createdAt: '2025-11-12'
      };
      showToast('微信快捷授权成功！已同步小程序化妆台数据');
      onLoginSuccess(wechatUser);
    }, 500);
  };

  // Complete Onboarding
  const handleCompleteOnboarding = () => {
    const customizedUser: UserProfile = {
      id: `user_${Date.now()}`,
      nickname: onboardingNickname.trim() || '美妆达人',
      phone: phone || '13888886622',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      skinType: onboardingSkinType,
      skinTone: onboardingSkinTone,
      concerns: onboardingConcerns,
      cyclePhase: onboardingCyclePhase,
      idolCompanion: onboardingCompanion,
      memberLevel: '先锋试妆官',
      streakDays: 1,
      points: 500, // Onboarding bonus
      isGuest: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    showToast('专属肤质建档成功！已赠送 500 循环积分');
    onLoginSuccess(customizedUser);
  };

  // Quick switch to demo account
  const handleSelectDemo = (account: typeof DEMO_ACCOUNTS[0]) => {
    showToast(`已切换至演示账号：${account.name}`);
    onLoginSuccess(account.profile);
  };

  // Guest Direct Entry
  const handleGuestEntry = () => {
    showToast('以访客身份进入体验，可随时在个人中心登录同步数据');
    onLoginSuccess(GUEST_USER);
  };

  const concernOptions = [
    '易泛红', '屏障受损', 'T区出油', '干燥起皮', 
    '闭口粉刺', '暗沉发黄', '眼周干纹', '成分易敏感'
  ];

  return (
    <div className={`w-full min-h-full ${isModal ? 'p-3 sm:p-5' : 'py-8 px-4 sm:px-6'} bg-[#FAF6F3] text-stone-900 select-none flex flex-col items-center justify-center`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Luxury Auth Card */}
      <div className="w-full max-w-md bg-white/95 rounded-3xl shadow-xl border border-[#EDE5DE] overflow-hidden backdrop-blur-md relative transition-all">
        {/* Decorative Top Accent Glow */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#962F43] via-[#D4A373] to-[#3D634B]" />

        {/* Modal Close Button */}
        {onCancel && (
          <button 
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#962F43] to-[#C45C72] text-white shadow-md shadow-[#962F43]/20 mb-1">
              <span className="font-serif text-2xl font-bold">妆</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
                我的化妆台 · AI
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                专属智能美妆伴侣 · 科学理肤 · 取悦自我
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          {activeTab !== 'onboarding' && (
            <div className="flex items-center justify-between p-1 bg-[#F5EFEB] rounded-2xl text-xs font-medium text-stone-600">
              <button
                type="button"
                onClick={() => { setActiveTab('sms'); setErrorMessage(null); }}
                className={`flex-1 py-2 rounded-xl transition-all font-semibold ${
                  activeTab === 'sms' 
                    ? 'bg-white text-stone-900 shadow-xs' 
                    : 'hover:text-stone-900'
                }`}
              >
                手机快捷登录
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('wechat'); setErrorMessage(null); }}
                className={`flex-1 py-2 rounded-xl transition-all font-semibold ${
                  activeTab === 'wechat' 
                    ? 'bg-white text-stone-900 shadow-xs' 
                    : 'hover:text-stone-900'
                }`}
              >
                微信一键登录
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('password'); setErrorMessage(null); }}
                className={`flex-1 py-2 rounded-xl transition-all font-semibold ${
                  activeTab === 'password' 
                    ? 'bg-white text-stone-900 shadow-xs' 
                    : 'hover:text-stone-900'
                }`}
              >
                {isRegisterMode ? '快捷注册' : '账号密码'}
              </button>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200/60 rounded-xl text-red-600 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SMS Code Login */}
          {activeTab === 'sms' && (
            <form onSubmit={handleSmsLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                  <span>手机号码</span>
                  <span className="text-[10px] text-stone-400 font-normal">支持大陆 11 位手机号</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-500 font-medium">
                    +86
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    maxLength={11}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入手机号码"
                    className="w-full pl-13 pr-4 py-2.5 bg-stone-50 border border-[#EDE5DE] rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1.5 focus:ring-[#962F43] focus:bg-white transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                  <span>短信验证码</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSmsCode('888888');
                      showToast('已一键填入演示测试码 888888');
                    }}
                    className="text-[11px] text-[#962F43] hover:underline"
                  >
                    一键填入 888888
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={smsCode}
                    maxLength={6}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6位数字验证码"
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-[#EDE5DE] rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1.5 focus:ring-[#962F43] focus:bg-white transition-all tracking-wider placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={handleSendSms}
                    disabled={countdown > 0 || smsSending}
                    className={`px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      countdown > 0 
                        ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                        : 'bg-[#962F43]/10 text-[#962F43] border border-[#962F43]/30 hover:bg-[#962F43]/20 active:scale-98'
                    }`}
                  >
                    {smsSending ? '发送中...' : countdown > 0 ? `${countdown}s 后重新获取` : '获取验证码'}
                  </button>
                </div>
              </div>

              {/* Agreement */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agree-sms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-[#962F43] focus:ring-[#962F43]"
                />
                <label htmlFor="agree-sms" className="text-[11px] text-stone-500 leading-tight">
                  我已阅读并同意
                  <span className="text-stone-800 underline mx-0.5">《用户服务协议》</span>
                  与
                  <span className="text-stone-800 underline mx-0.5">《隐私与肤质数据保护声明》</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#962F43] hover:bg-[#832637] text-white rounded-xl text-xs font-semibold shadow-md shadow-[#962F43]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    正在安全验证与同步数据...
                  </span>
                ) : (
                  <>
                    <span>快捷登录 / 注册</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: WeChat One-Click Auth */}
          {activeTab === 'wechat' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#07C160] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-emerald-950">
                    微信官方快捷授权登录
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 leading-snug">
                    一键同步微信昵称与头像，自动绑定小程序云端化妆台档案。
                  </p>
                </div>
              </div>

              {/* WeChat User Preview Card */}
              <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
                    alt="WeChat Avatar"
                    className="w-10 h-10 rounded-full object-cover border border-white shadow-2xs"
                  />
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>微信用户·晚晚</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-medium">已授权</span>
                    </div>
                    <span className="text-[10px] text-stone-500">已关联手机号 138****6622</span>
                  </div>
                </div>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agree-wx"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-[#07C160] focus:ring-[#07C160]"
                />
                <label htmlFor="agree-wx" className="text-[11px] text-stone-500 leading-tight">
                  同意授权我的化妆台获取微信头像与昵称，用于生成专属美妆档案
                </label>
              </div>

              <button
                type="button"
                onClick={handleWechatLogin}
                disabled={isLoading}
                className="w-full py-3 bg-[#07C160] hover:bg-[#06ad56] text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    正在授权登录...
                  </span>
                ) : (
                  <>
                    <span>微信一键授权进入</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: Account & Password / Register */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">账号 / 手机号</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入已注册手机号或账号"
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-[#EDE5DE] rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1.5 focus:ring-[#962F43] focus:bg-white transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                  <label>{isRegisterMode ? '设置密码' : '登录密码'}</label>
                  {!isRegisterMode && (
                    <button
                      type="button"
                      onClick={() => showToast('请使用手机快捷验证码找回密码')}
                      className="text-[11px] text-stone-400 hover:text-stone-700 font-normal"
                    >
                      忘记密码？
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegisterMode ? '请设置6位以上密码' : '请输入密码'}
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-[#EDE5DE] rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1.5 focus:ring-[#962F43] focus:bg-white transition-all placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-[#962F43] focus:ring-[#962F43]"
                  />
                  <span className="text-[11px]">记住密码</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setErrorMessage(null);
                  }}
                  className="text-[11px] text-[#962F43] font-semibold hover:underline"
                >
                  {isRegisterMode ? '已有账号？去登录' : '没有账号？立即注册'}
                </button>
              </div>

              {/* Agreement */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agree-pwd"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-[#962F43] focus:ring-[#962F43]"
                />
                <label htmlFor="agree-pwd" className="text-[11px] text-stone-500 leading-tight">
                  我已阅读并同意
                  <span className="text-stone-800 underline mx-0.5">《用户服务协议》</span>
                  与
                  <span className="text-stone-800 underline mx-0.5">《隐私协议》</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#962F43] hover:bg-[#832637] text-white rounded-xl text-xs font-semibold shadow-md shadow-[#962F43]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    正在验证...
                  </span>
                ) : (
                  <>
                    <span>{isRegisterMode ? '立即注册并建档' : '立即登录'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 4: Personalized Skin Diagnostic & Onboarding */}
          {activeTab === 'onboarding' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>定制您的肤质与审美偏好，AI 将为您推荐最适配的底妆色号与护肤步序</span>
              </div>

              {/* Nickname */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">美妆昵称</label>
                <input
                  type="text"
                  value={onboardingNickname}
                  onChange={(e) => setOnboardingNickname(e.target.value)}
                  placeholder="例如：晚晚、晨曦..."
                  className="w-full px-3 py-2 bg-stone-50 border border-[#EDE5DE] rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1.5 focus:ring-[#962F43]"
                />
              </div>

              {/* Skin Tone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">底色与色号 (决定粉底与眼影搭配)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cool_fair', label: '冷白调 (冷一白/粉白)' },
                    { id: 'warm_light', label: '暖黄调 (黄一白/暖调自然)' },
                    { id: 'neutral_natural', label: '中性调 (自然透亮)' },
                    { id: 'healthy_tan', label: '健康小麦色' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOnboardingSkinTone(item.id as SkinToneType)}
                      className={`p-2 rounded-xl text-left text-xs font-medium border transition-all ${
                        onboardingSkinTone === item.id
                          ? 'border-[#962F43] bg-[#962F43]/5 text-[#962F43] font-semibold'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">当前肤质基底</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'combination_oily', label: '混油皮' },
                    { id: 'sensitive', label: '敏感修护' },
                    { id: 'dry', label: '大干皮' },
                    { id: 'oily', label: '油性皮' },
                    { id: 'combination_dry', label: '混干皮' },
                    { id: 'normal', label: '中性健康' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setOnboardingSkinType(st.id as SkinType)}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-medium border transition-all ${
                        onboardingSkinType === st.id
                          ? 'border-[#3D634B] bg-[#3D634B]/10 text-[#3D634B] font-bold'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concerns Multi-select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">核心修护诉求 (可多选)</label>
                <div className="flex flex-wrap gap-1.5">
                  {concernOptions.map((c) => {
                    const isSelected = onboardingConcerns.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setOnboardingConcerns(prev => prev.filter(item => item !== c));
                          } else {
                            setOnboardingConcerns(prev => [...prev, c]);
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-[#962F43] text-white border-[#962F43]'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Companion */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">专属护肤陪伴官</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['田柾国', '温润理肤师', '虚拟闺蜜'].map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setOnboardingCompanion(comp)}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs border transition-all ${
                        onboardingCompanion === comp
                          ? 'border-[#962F43] bg-[#962F43]/10 text-[#962F43] font-semibold'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteOnboarding}
                className="w-full py-3 bg-[#962F43] hover:bg-[#832637] text-white rounded-xl text-xs font-semibold shadow-md shadow-[#962F43]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                <span>完成建档，开启专属美妆台</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Demo Accounts Switcher */}
          <div className="pt-2 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold flex items-center gap-1 text-stone-700">
                <UserCheck className="w-3.5 h-3.5 text-[#3D634B]" />
                快速体验：预设达人账号
              </span>
              <span className="text-[10px] text-stone-400">点击直接免密登录</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.phone}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className="w-full p-2.5 rounded-xl border border-stone-200/90 bg-[#FAF7F4] hover:bg-white hover:border-[#962F43]/40 hover:shadow-2xs transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={acc.profile.avatar}
                      alt={acc.name}
                      className="w-8 h-8 rounded-full object-cover border border-white"
                    />
                    <div>
                      <div className="text-xs font-semibold text-stone-900 group-hover:text-[#962F43] flex items-center gap-1.5">
                        <span>{acc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 font-normal">
                          {acc.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        已收录化妆品 · 连续打卡 {acc.profile.streakDays} 天
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#962F43] group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Guest Entry Button */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleGuestEntry}
              className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-600 transition-colors"
            >
              暂不登录，以访客身份快速体验 →
            </button>
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="bg-[#FAF7F4] px-6 py-3 border-t border-[#EDE5DE] flex items-center justify-center gap-3 text-[11px] text-stone-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3D634B]" />
            <span>个人肤质数据本地加密保护</span>
          </div>
          <span>•</span>
          <span>不向第三方泄露敏感隐私</span>
        </div>
      </div>
    </div>
  );
};
