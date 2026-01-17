import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ondubkofktxgfzwgihwp.supabase.co" 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZHVia29ma3R4Z2Z6d2dpaHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0Mzc5NjMsImV4cCI6MjA4MzAxMzk2M30.ab2w-vpTbFaFbSGwX7uzWFxfKPRTDv_Um3U3H8QFCGM"
export const supabase = createClient(supabaseUrl, supabaseKey)