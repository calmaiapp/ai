import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://modjpklljhkwesysezvc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZGpwa2xsamhrd2VzeXNlenZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODA1MTQsImV4cCI6MjA4MzM1NjUxNH0.KW4rzrHBFY73HlYMK2MtCELjeFpQzBWE9iheT6JGiO8'

export const supabase = createClient(supabaseUrl, supabaseKey)
