import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 1,
      title: $t('page.employees.title'),
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
        },
      },
    ],
  },
];

export default routes;
