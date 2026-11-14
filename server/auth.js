import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

export async function getAuthenticatedSupabase(req, res) {
  const authorization = req.headers.authorization || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!accessToken) {
    res.status(401).json({ error: 'Sign in to continue.' })
    return null
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(503).json({ error: 'Supabase is not configured for serverless requests.' })
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      res.status(401).json({ error: 'Your session is invalid or has expired. Sign in again.' })
      return null
    }
    return { supabase, user }
  } catch (error) {
    console.error('Supabase authentication request failed:', error instanceof Error ? error.message : 'Unknown error')
    res.status(502).json({ error: 'Could not verify your session. Please try again.' })
    return null
  }
}
