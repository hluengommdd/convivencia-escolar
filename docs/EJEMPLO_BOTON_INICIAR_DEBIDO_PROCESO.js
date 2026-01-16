/**
 * ✅ IMPLEMENTADO EN: CaseDetailPanel.jsx
 * 
 * El botón "Iniciar debido proceso" ya está implementado en el panel
 * de detalle de casos activos.
 * 
 * Ubicación: src/components/CaseDetailPanel.jsx
 * 
 * Cuando el usuario hace clic:
 * 1. Llama a iniciarDebidoProceso(caseId, 10)
 * 2. El RPC start_due_process setea:
 *    - seguimiento_started_at = now()
 *    - indagacion_start_date = hoy (UTC)
 *    - indagacion_due_date = start_date + 10 días hábiles
 *    - status = "En Seguimiento"
 * 3. Navega a /seguimientos/:caseId
 * 4. El caso ahora aparece en v_control_alertas con SLA activo
 */

// Código implementado:

import { iniciarDebidoProceso } from '../api/db'

async function handleIniciarDebidoProceso() {
  try {
    await iniciarDebidoProceso(caso.id, 10)
    navigate(`/seguimientos/${caso.id}`)
  } catch (e) {
    console.error(e)
    alert(e?.message || 'Error al iniciar debido proceso')
  }
}

// Botón en el render:
<button onClick={handleIniciarDebidoProceso} className="btn-primary w-full">
  🚀 Iniciar debido proceso
</button>
