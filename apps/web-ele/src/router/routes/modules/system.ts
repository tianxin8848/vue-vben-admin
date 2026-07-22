import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 3,
      title: $t('page.system.title'),
      authority: ['admin'],
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'RegionalHolidays',
        path: 'holidays',
        component: () => import('#/views/system/holidays/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:calendar-check',
          title: $t('page.system.holidays'),
          authority: ['admin'],
        },
      },
    ],
  },
];

export default routes;