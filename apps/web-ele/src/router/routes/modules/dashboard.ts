import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:dashboard',
      order: 0,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/employee',
    children: [
      {
        name: 'DashboardAnalytics',
        path: 'analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:bar-chart-2',
          title: $t('page.dashboard.analytics'),
          authority: ['admin'],
        },
      },
      {
        name: 'DashboardWorkspace',
        path: 'workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:layout-grid',
          title: $t('page.dashboard.workspace'),
        },
      },
    ],
  },
];

export default routes;
