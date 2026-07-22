import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      title: $t('page.system.title'),
      authority: ['admin'],
    },
    name: 'SystemSettingsExtra',
    path: '/employee/manage/settings',
    children: [
      {
        name: 'RegionalHolidays',
        path: 'holidays',
        component: () => import('#/views/system/holidays/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:calendar-check',
          title: $t('page.system.holidays'),
          authority: ['admin'],
        },
      },
    ],
  },
];

export default routes;
