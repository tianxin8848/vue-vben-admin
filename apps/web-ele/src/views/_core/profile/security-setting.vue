<script setup lang="ts">
import { computed } from 'vue';

import { ProfileSecuritySetting } from '@vben/common-ui';
import { $t } from '@vben/locales';

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: $t('profile.securityAccountPassword'),
      description: $t('profile.securityPasswordStrengthStrong'),
    },
    {
      value: true,
      fieldName: 'securityPhone',
      label: $t('profile.securityPhone'),
      description: $t('profile.securityPhoneBound'),
    },
    {
      value: true,
      fieldName: 'securityQuestion',
      label: $t('profile.securityQuestion'),
      description: $t('profile.securityQuestionUnset'),
    },
    {
      value: true,
      fieldName: 'securityEmail',
      label: $t('profile.securityEmail'),
      description: $t('profile.securityEmailBound'),
    },
    {
      value: false,
      fieldName: 'securityMfa',
      label: $t('profile.securityMfa'),
      description: $t('profile.securityMfaUnbound'),
    },
  ];
});
</script>
<template>
  <ProfileSecuritySetting :form-schema="formSchema" />
</template>
