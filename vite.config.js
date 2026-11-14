import { Buffer } from 'node:buffer'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const apiRoutes = {
  '/api/generate-quiz': () => import('./api/generate-quiz.js'),
  '/api/index-document': () => import('./api/index-document.js'),
  '/api/tutor': () => import('./api/tutor.js'),
}

async function readJsonBody(req, res) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 2 * 1024 * 1024) {
      res.statusCode = 413
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Request body is too large.' }))
      return null
    }
    chunks.push(chunk)
  }
  if (!size) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Request body must be valid JSON.' }))
    return null
  }
}

function localServerlessApi() {
  return {
    name: 'local-serverless-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, '')
      const serverEnvironment = {
        GEMINI_API_KEY: env.GEMINI_API_KEY,
        GEMINI_MODEL: env.GEMINI_MODEL,
        SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
        SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
      }
      for (const [name, value] of Object.entries(serverEnvironment)) {
        if (value) process.env[name] = value
      }

      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname
        const loadRoute = apiRoutes[pathname]
        if (!loadRoute) {
          next()
          return
        }

        const runRoute = async () => {
          const body = await readJsonBody(req, res)
          if (body === null) return
          req.body = body
          try {
            const { default: handler } = await loadRoute()
            await handler(req, {
              status(code) {
                res.statusCode = code
                return this
              },
              setHeader(name, value) {
                res.setHeader(name, value)
                return this
              },
              json(value) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify(value))
                return this
              },
            })
          } catch (error) {
            console.error(`Local API route ${pathname} failed:`, error)
            if (!res.writableEnded) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'The local API request failed. Check the development server output.' }))
            }
          }
        }
        runRoute()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localServerlessApi()],
})
