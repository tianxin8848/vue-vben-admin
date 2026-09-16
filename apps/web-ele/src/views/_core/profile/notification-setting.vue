<script setup lang="ts">
import { computed } from 'vue';

import { ProfileNotificationSetting } from '@vben/common-ui';
import { $t } from '@vben/locales';

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: $t('profile.notifyAccount'),
      description: $t('profile.notifyAccountDesc'),
    },
    {
      value: true,
      fieldName: 'systemMessage',
      label: $t('profile.notifySystemMessage'),
      description: $t('profile.notifySystemDesc'),
    },
    {
      value: true,
      fieldName: 'todoTask',
      label: $t('profile.notifyTodoTask'),
      description: $t('profile.notifyTodoDesc'),
    },
  ];
});
</script>
<template>
  <ProfileNotificationSetting :form-schema="formSchema" />
</template>
