import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data, error } = await supabase
    .from('v_control_plazos_plus')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (data && data.length > 0) {
    console.log(JSON.stringify(data[0], null, 2))
  } else {
    console.log('No hay datos en v_control_plazos_plus')
  }
}

main()
