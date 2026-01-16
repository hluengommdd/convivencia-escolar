import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Leer variables de entorno
const envFile = readFileSync(join(__dirname, '.env.local'), 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim()
  }
})

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
)

async function test() {
  console.log('🔍 Consultando v_control_alertas...\n')
  
  const { data, error } = await supabase
    .from('v_control_alertas')
    .select('case_id, dias_restantes, alerta_urgencia')
    .limit(3)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('✅ Resultados:')
  console.table(data)
  console.log('\n📊 Total de registros:', data?.length || 0)
}

test()
