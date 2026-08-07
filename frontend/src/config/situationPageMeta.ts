import type { SituationPageCode } from '@/types/situation';

export interface SituationPageMetaConfig {
  name: string;
  title: string;
  subtitle: string;
  location: string;
}

export const SITUATION_PAGE_META: Record<SituationPageCode, SituationPageMetaConfig> = {
  overview: {
    name: '综合态势',
    title: '综合态势',
    subtitle: '统一联动态势与处置闭环',
    location: '综合态势中心'
  },
  security: {
    name: '安全态势',
    title: '安全态势',
    subtitle: '攻击面、风险链路与处置闭环',
    location: '安全保密中心'
  },
  business: {
    name: '业务态势',
    title: '签阅流转态势',
    subtitle: '阅办行为、文件流转与数据准备度',
    location: '业务运行中心 · 签阅系统初步对接'
  },
  terminal: {
    name: '终端态势',
    title: '终端态势',
    subtitle: '终端资产、人员关联与保障状态',
    location: '终端保障中心'
  }
};
