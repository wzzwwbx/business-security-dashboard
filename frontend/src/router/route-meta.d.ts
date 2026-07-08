import 'vue-router';
import type { AppPageCode } from '@/constants/navigation';
import type { SystemTabKey } from '@/types/iam';

declare module 'vue-router' {
  interface RouteMeta {
    shell?: boolean;
    publicRoute?: boolean;
    publicOnly?: boolean;
    pageCode?: AppPageCode;
    requiredAuthorities?: string[];
    systemTab?: SystemTabKey;
  }
}
