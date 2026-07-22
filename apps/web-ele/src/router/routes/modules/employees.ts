import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 1,
      title: $t('page.employees.title'),
      authority: ['admin'],
    },
    name: 'Employee',
    path: '/employee',
    children: [
      {
        name: 'EmployeeList',
        path: 'list',
        component: () => import('#/views/employees/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:list',
          title: $t('page.employees.list'),
          authority: ['admin'],
        },
      },
      {
        name: 'EmployeeProfile',
        path: 'profile/:id',
        component: () => import('#/views/employees/profile/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:user',
          title: $t('page.employees.profile'),
          authority: ['admin'],
        },
      },
      {
        name: 'EmployeeManageSettings',
        path: 'manage/settings',
        component: () => import('#/views/system/settings/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:gear',
          title: $t('page.system.settings'),
          authority: ['admin'],
        },
      },
    ],
  },
];

export default routes;
