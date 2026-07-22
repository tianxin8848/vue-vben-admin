import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:home',
      order: 0,
      title: $t('page.workspace.title'),
    },
    name: 'Workspace',
    path: '/employee',
    redirect: '/employee',
    children: [
      {
        name: 'WorkspaceHome',
        path: '',
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
      // ─── 员工自助：请假相关 ─────────────────────────────────────────
      {
        name: 'EmployeeLeaveApply',
        path: 'leave',
        component: () => import('#/views/leave/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:clipboard-list',
          title: $t('page.leave.list'),
        },
      },
      {
        name: 'EmployeeMyLeave',
        path: 'my-leave',
        component: () => import('#/views/leave/my-leave/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:user-circle',
          title: $t('page.leave.myLeave'),
        },
      },
      {
        name: 'EmployeeMyRecords',
        path: 'my-records',
        component: () => import('#/views/leave/my-records/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:history',
          title: $t('page.leave.myRecords'),
        },
      },
      {
        name: 'LeaveDetail',
        path: 'leave/detail/:id',
        component: () => import('#/views/leave/detail/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-text',
          title: $t('page.leave.detail'),
        },
      },
    ],
  },
];

export default routes;
