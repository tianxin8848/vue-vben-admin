import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:home',
      order: 0,
      title: $t('page.workspace.title'),
      authority: ['user'],
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
          authority: ['user'],
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
          authority: ['user'],
        },
      },
      // ─── 员工自助：报销 ──────────────────────────────────────────
      {
        name: 'EmployeeClaims',
        path: 'claims',
        component: () => import('#/views/claim/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:receipt',
          title: '报销管理',
          authority: ['user'],
        },
      },
      // ─── 员工自助：请假详情（菜单隐藏，从列表跳转） ──────────────
      {
        name: 'LeaveDetail',
        path: 'leave/detail/:id',
        component: () => import('#/views/leave/detail/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-text',
          title: $t('page.leave.detail'),
          authority: ['user'],
        },
      },
    ],
  },
];

export default routes;
