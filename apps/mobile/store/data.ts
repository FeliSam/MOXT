import { createLoadCoreData } from '@moxt/shared/data/createLoadCoreData.js';

import { supabase } from '../services/supabase';
import { setParcels } from './parcels';
import { setTransfers } from './transfers';

export const loadCoreData = createLoadCoreData({
  supabase,
  setTransfers,
  setParcels,
});
