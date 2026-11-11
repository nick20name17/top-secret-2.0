import { defineConfig } from 'react-doctor/api'

export default defineConfig({
  noScore: true,
  customRulesOnly: true,
  rules: {
    'react-doctor/no-set-state-in-render': 'off',
    'react-doctor/no-nested-component-definition': 'off',
    'react-doctor/no-derived-state-effect': 'off',
    'react-doctor/rendering-hydration-no-flicker': 'off',
    'react-doctor/query-no-rest-destructuring': 'off',
    'react-doctor/query-stable-query-client': 'off',
    'react-doctor/unused-export': 'error',
    'react-doctor/unused-type': 'error',
    'react-doctor/unused-dependency': 'error',
    'react-doctor/hooks-no-nan-in-deps': 'error',
    'react-doctor/forwarded-set-state-in-effect': 'error',
    'react-doctor/no-cascading-set-state': 'error',
    'react-doctor/no-collapse-request-error-to-empty-state': 'error',
  },
  ignore: {
    files: ['src/routeTree.gen.ts'],
  },
})
