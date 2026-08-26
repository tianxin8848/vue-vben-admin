import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:map',
      order: 2,
      title: $t('page.fuximap.title'),
      authority: ['admin', 'user'],
    },
    name: 'FuxiMap',
    path: '/fuximap',
    redirect: '/fuximap/customers',
    children: [
      {
        name: 'FuxiMapCustomers',
        path: 'customers',
        component: () => import('#/views/fuximap/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:map-pinned',
          title: $t('page.fuximap.customerDistribution'),
          authority: ['admin', 'user'],
        },
      },
    ],
  },
];

export default routes;
