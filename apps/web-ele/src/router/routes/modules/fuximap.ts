import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:map',
      order: 2,
      title: '客户地图',
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
          title: '客户分布',
          authority: ['admin', 'user'],
        },
      },
    ],
  },
];

export default routes;
