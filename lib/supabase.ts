import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// You will get these from your Supabase Dashboard -> Project Settings -> API
const supabaseUrl = "https://umfmcsacgffjsyourttg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZm1jc2FjZ2ZmanN5b3VydHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTI3NDcsImV4cCI6MjA4Njg2ODc0N30.mLkiDuHac19lpySivBonYBbwrkfOKdSb2F3_lKIdywE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
