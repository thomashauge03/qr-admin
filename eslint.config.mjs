import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /*
       * Appen er en statisk eksport: window og Supabase-data finnes ikke når
       * sidene forhåndsrendres, så tilstanden må settes i en effekt etter
       * hydrering. Regelen kom med eslint-config-next 16 og ville gjort
       * henting ved oppstart til en feil på hver side.
       */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  // android/ og ios/ har Capacitor-kopier av out/, og de er generert kode.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'android/**',
    'ios/**',
    '.claude/**',
  ]),
])

export default eslintConfig
