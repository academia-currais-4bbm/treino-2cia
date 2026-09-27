-- Treino 2ª CIA — v67.68.65
-- Auditoria fiel à mesma cadeia usada por ranking_constancia.
-- Execute uma única vez no Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.admin_auditar_ranking_2cia_v676865(
  p_token_militar uuid,
  p_matricula text,
  p_mes text
)
RETURNS TABLE(
  jornada text,
  jornada_inicio timestamptz,
  jornada_fim timestamptz,
  validacao_encontrada boolean,
  validado_em timestamptz,
  jornada_pontuou boolean,
  momento_atividade timestamptz,
  categoria text,
  atividade_elegivel boolean,
  workout jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin boolean := false;
BEGIN
  -- Reutiliza a autorização administrativa já existente no projeto.
  SELECT COALESCE((to_jsonb(x)->>'administrador')::boolean, false)
    INTO v_admin
  FROM public.verificar_admin_militar(p_token_militar) x
  LIMIT 1;

  IF COALESCE(v_admin, false) <> true THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH atividades AS (
    SELECT
      workout.item AS w,
      CASE
        WHEN COALESCE(workout.item->>'date','') <> ''
          THEN (workout.item->>'date')::timestamptz
        ELSE NULL::timestamptz
      END AS momento,
      public.categoria_ranking_2cia_v6741(workout.item) AS cat
    FROM public.dados_militares dm
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(dm.dados->'workouts')='array' THEN dm.dados->'workouts'
        ELSE '[]'::jsonb
      END
    ) workout(item)
    WHERE public.normalizar_matricula(dm.matricula)=public.normalizar_matricula(p_matricula)
  ),
  com_jornada AS (
    SELECT a.w, a.momento, a.cat, j.chave, j.inicio, j.fim
    FROM atividades a
    CROSS JOIN LATERAL public.janela_servico_2cia(a.momento) j
    WHERE a.momento IS NOT NULL
      AND LEFT(j.chave,7)=p_mes
  ),
  com_validacao AS (
    SELECT
      c.*,
      (
        SELECT MIN(vs.validado_em)
        FROM public.validacoes_servico vs
        WHERE public.normalizar_matricula(vs.matricula)=public.normalizar_matricula(p_matricula)
          AND vs.validado_em >= c.inicio
          AND vs.validado_em < c.fim
      ) AS v_validado_em
    FROM com_jornada c
  ),
  jornadas AS (
    SELECT
      chave,
      BOOL_OR(cat IS NOT NULL) AS tem_elegivel,
      BOOL_OR(v_validado_em IS NOT NULL) AS tem_validacao
    FROM com_validacao
    GROUP BY chave
  )
  SELECT
    c.chave,
    c.inicio,
    c.fim,
    (c.v_validado_em IS NOT NULL),
    c.v_validado_em,
    (j.tem_elegivel AND j.tem_validacao),
    c.momento,
    c.cat,
    (c.cat IS NOT NULL),
    c.w
  FROM com_validacao c
  JOIN jornadas j ON j.chave=c.chave
  ORDER BY c.inicio DESC, c.momento ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_auditar_ranking_2cia_v676865(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_auditar_ranking_2cia_v676865(uuid,text,text) TO anon, authenticated;
