import { UserProfile, DemoAccount } from '../types/auth';
import { homePortraitImg, makeupGlamourImg } from './mockData';

export const DEFAULT_USER: UserProfile = {
  id: 'user_wanwan_01',
  nickname: '晚晚',
  phone: '13888886622',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  skinType: 'combination_oily',
  skinTone: 'cool_fair',
  concerns: ['易泛红', 'T区出油', '换季屏障不耐受'],
  cyclePhase: 'follicular',
  idolCompanion: '田柾国',
  memberLevel: '黑金挚友',
  streakDays: 18,
  points: 1260,
  isGuest: false,
  createdAt: '2025-11-12'
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: '晚晚 (混油敏感·冷一白)',
    phone: '13888886622',
    badge: '黑金挚友',
    profile: {
      id: 'user_wanwan_01',
      nickname: '晚晚',
      phone: '13888886622',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      skinType: 'combination_oily',
      skinTone: 'cool_fair',
      concerns: ['易泛红', 'T区出油', '换季屏障不耐受'],
      cyclePhase: 'follicular',
      idolCompanion: '田柾国',
      memberLevel: '黑金挚友',
      streakDays: 18,
      points: 1260,
      isGuest: false,
      createdAt: '2025-11-12'
    }
  },
  {
    name: '诺诺 (干皮修护·暖调白)',
    phone: '13912345678',
    badge: '先锋试妆官',
    profile: {
      id: 'user_nuonuo_02',
      nickname: '诺诺',
      phone: '13912345678',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      skinType: 'dry',
      skinTone: 'warm_light',
      concerns: ['角质层薄', '冬季起皮', '暗沉粗糙'],
      cyclePhase: 'luteal',
      idolCompanion: '温润理肤师',
      memberLevel: '先锋试妆官',
      streakDays: 42,
      points: 2450,
      isGuest: false,
      createdAt: '2025-08-01'
    }
  },
  {
    name: '小林 (中性健康·自然色)',
    phone: '13699887766',
    badge: '普通会员',
    profile: {
      id: 'user_lin_03',
      nickname: '小林Lin',
      phone: '13699887766',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      skinType: 'normal',
      skinTone: 'neutral_natural',
      concerns: ['抗初老', '提亮光泽'],
      cyclePhase: 'ovulation',
      idolCompanion: '赛博精灵',
      memberLevel: '普通会员',
      streakDays: 7,
      points: 380,
      isGuest: false,
      createdAt: '2026-01-15'
    }
  }
];

export const GUEST_USER: UserProfile = {
  id: 'guest_user',
  nickname: '访客体验官',
  phone: '未绑定手机号',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  skinType: 'combination_oily',
  skinTone: 'cool_fair',
  concerns: ['探索护肤方案'],
  cyclePhase: 'follicular',
  idolCompanion: '温润理肤师',
  memberLevel: '普通会员',
  streakDays: 1,
  points: 100,
  isGuest: true,
  createdAt: '2026-10-19'
};

