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
    name: 'Employees',
    path: '/employees',
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
    ],
  },
];

export default routes;