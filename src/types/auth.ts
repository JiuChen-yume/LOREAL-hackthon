export type SkinType = 
  | 'dry'              // 干性肌
  | 'oily'             // 油性肌
  | 'combination_dry'  // 混干肌
  | 'combination_oily' // 混油肌
  | 'sensitive'        // 敏感/屏障受损肌
  | 'normal';          // 中性健康肌

export type SkinToneType = 
  | 'cool_fair'        // 冷白调 (粉一白/冷一白)
  | 'warm_light'       // 暖黄调 (黄一白/暖自然)
  | 'neutral_natural'  // 中性自然色
  | 'healthy_tan';     // 健康小麦色

export interface UserProfile {
  id: string;
  nickname: string;
  phone: string;
  avatar: string;
  skinType: SkinType;
  skinTone: SkinToneType;
  concerns: string[];
  cyclePhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  idolCompanion: string;
  memberLevel: '普通会员' | '黑金挚友' | '先锋试妆官';
  streakDays: number;
  points: number;
  isGuest: boolean;
  createdAt: string;
}

export interface DemoAccount {
  name: string;
  phone: string;
  badge: string;
  profile: UserProfile;
}

