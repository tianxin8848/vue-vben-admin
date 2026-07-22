import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: 0,
      title: $t('page.workspace.title'),
    },
    name: 'Workspace',
    path: '/workspace',
    redirect: '/workspace/index',
    children: [
      {
        name: 'WorkspaceHome',
        path: 'index',
        component: () => import('#/views/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:home',
          title: $t('page.workspace.home'),
        },
      },
      {
        name: 'WorkspaceProfile',
        path: 'profile',
        component: () => import('#/views/workspace/profile.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:user',
          title: $t('page.workspace.profile'),
        },
      },
    ],
  },
];

export default routes;