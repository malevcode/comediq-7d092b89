
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cotfweyhlglpjmgqxwqx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvdGZ3ZXlobGdscGptZ3F4d3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDU0OTEsImV4cCI6MjA2NDIyMTQ5MX0.cgAtNE4qE4dgeHUu_Q1yQEJBimQlDoy8yDDC_if8GuY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
