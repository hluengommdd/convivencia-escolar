#!/usr/bin/env bash
# Small checklist script with curl commands to test Supabase RPCs and the health endpoint

set -euo pipefail

SUPABASE_URL="https://whlbmsibablwrfvivknn.supabase.co"
ANON_KEY="${VITE_SUPABASE_ANON_KEY:-YOUR_ANON_KEY}"

echo "1) Call health endpoint (deployed on Vercel):"
echo "   curl -s https://<your-vercel-app>/api/health-check | jq ."

echo
echo "2) Call RPC stats_mayor_nivel via Supabase REST API:"
echo "   curl -s -X POST \"
echo "     ${SUPABASE_URL}/rest/v1/rpc/stats_mayor_nivel \"
echo "     -H \"apikey: ${ANON_KEY}\" \"
echo "     -H \"Authorization: Bearer ${ANON_KEY}\" \"
echo "     -H \"Content-Type: application/json\" \"
echo "     -d '{\"desde\":\"2026-01-01\",\"hasta\":\"2026-12-31\"}' | jq ."

echo
echo "3) Call RPC stats_promedio_seguimientos_por_caso:"
echo "   curl -s -X POST ${SUPABASE_URL}/rest/v1/rpc/stats_promedio_seguimientos_por_caso -H \"apikey: ${ANON_KEY}\" -H \"Authorization: Bearer ${ANON_KEY}\" -H \"Content-Type: application/json\" -d '{\"desde\":\"2026-01-01\",\"hasta\":\"2026-12-31\"}' | jq ."

echo
echo "4) Direct sanity checks (counts):"
echo "   curl -s -X POST ${SUPABASE_URL}/rest/v1/rpc/raw_sql \" -H \"apikey: ${ANON_KEY}\" -H \"Authorization: Bearer ${ANON_KEY}\" -H \"Content-Type: application/json\" -d '{\"query\": \"SELECT count(*) FROM case_followups WHERE action_date BETWEEN ''2026-01-01'' AND ''2026-12-31'';\"}' | jq . || true"

echo
echo "Replace placeholders before running. You can also run these manually in Supabase SQL Editor."
