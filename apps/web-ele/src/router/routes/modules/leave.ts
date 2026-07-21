import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:calendar',
      order: 2,
      title: $t('page.leave.title'),
    },
    name: 'Leave',
    path: '/leave',
    children: [
      {
        name: 'LeaveList',
        path: 'list',
        component: () => import('#/views/leave/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:clipboard-list',
          title: $t('page.leave.list'),
        },
      },
      {
        name: 'LeaveDetail',
        path: 'detail/:id',
        component: () => import('#/views/leave/detail/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-text',
          title: $t('page.leave.detail'),
        },
      },
      {
        name: 'LeaveWorkflow',
        path: 'workflow',
        component: () => import('#/views/leave/workflow/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:git-branch',
          title: $t('page.leave.workflow'),
        },
      },
    ],
  },
];

export default routes;
