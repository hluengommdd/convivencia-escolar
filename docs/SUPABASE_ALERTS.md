Supabase Alerting & Uptime checks

1) Objetivo
- Detectar caídas, errores RPC y problemas de rendimiento en Supabase.

2) Uptime simple (recomendado)
- Usa UptimeRobot (free) para hacer un check HTTP a tu frontend y/o a una RPC proxy en tu backend.
- URL a monitorizar (ejemplos):
  - Frontend público: https://tu-dominio.vercel.app/
  - RPC proxy: crea un endpoint en tu backend que haga un `rpc('stats_kpis')` y devuelve 200 OK.

3) Check directo a RPC (más robusto)
- Crea un pequeño endpoint (serverless) que llame a una RPC crítica, por ejemplo `stats_kpis` o `stats_mayor_nivel`.
- Monitoriza ese endpoint en UptimeRobot cada 5 minutos.

4) Logs y alertas en Supabase
- Revisa Project → Logs regularmente.
- Si tu plan lo permite, configura alertas en la sección de métricas del proyecto.

5) Recomendaciones de configuración
- No uses `service_role` keys en el cliente.
- Asegura `VITE_SUPABASE_ANON_KEY` en Vercel.
- Configura un responsable para recibir alertas (Slack/email).

6) Scripts de comprobación manual
- Curl ejemplo para test RPC:
```
curl -s -X POST "https://whlbmsibablwrfvivknn.supabase.co/rest/v1/rpc/stats_kpis" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"desde":"2026-01-01","hasta":"2026-12-31"}' | jq .
```

7) Integración con Slack/GitHub
- UptimeRobot puede enviar alertas a Slack.
- Configura un canal #infra-alerts y añade el webhook.

8) Plan de respuesta
- 1) Ver logs → 2) Validar RLS y Storage → 3) Revertir deploy si fue la causa → 4) Notificar equipo

---

Si quieres, puedo crear un small serverless endpoint (Vercel Function) que haga la llamada RPC y sirva como health-check para UptimeRobot. ¿Lo quieres creado aquí y empujado al repo?