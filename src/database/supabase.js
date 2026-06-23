// 1. Importação forçada do leitor de URL
import { setupURLPolyfill } from 'react-native-url-polyfill';
setupURLPolyfill();

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// 2. Colocamos as strings DIRETAMENTE dentro do createClient
export const supabase = createClient(
  'https://njbwijgmfyndxnbymcqn.supabase.co',
  'sb_publishable_jAEcZbG1PHGdpz-15icFug_uRWJQuIY',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);