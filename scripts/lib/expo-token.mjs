/**
 * Validação de personal access token do Expo contra a API oficial.
 *
 * O EAS CLI usa GraphQL em https://api.expo.dev/graphql — usamos o mesmo
 * endpoint para obter a resposta real do servidor em vez de adivinhar o
 * formato do token.
 */

const GRAPHQL_URL = 'https://api.expo.dev/graphql';

const VIEWER_QUERY = `
  query ViewerQuery {
    viewer {
      id
      username
      email
    }
  }
`;

/** Remove acentos invisíveis, espaços e aspas que quebram o token. */
export function sanitizeToken(raw) {
  if (!raw) return '';
  let t = String(raw).trim();
  // aspas envolventes (comum ao copiar de um terminal ou de um JSON)
  t = t.replace(/^["']|["']$/g, '');
  // quebras de linha / tabs / espaços internos
  t = t.replace(/\s+/g, '');
  // caracteres de controle / zero-width
  t = t.replace(/[\u0000-\u001f\u007f\u200b-\u200d\ufeff]/g, '');
  return t;
}

/**
 * @returns {Promise<{ok: boolean, reason?: string, detail?: string, viewer?: object}>}
 */
export async function checkExpoToken(rawToken) {
  const token = sanitizeToken(rawToken);

  if (!token) {
    return { ok: false, reason: 'vazio', detail: 'Nenhum token informado.' };
  }

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'psi-app-token-check',
      },
      body: JSON.stringify({ query: VIEWER_QUERY }),
    });

    const text = await res.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        ok: false,
        reason: 'resposta inesperada',
        detail: `HTTP ${res.status}: ${text.slice(0, 300)}`,
      };
    }

    if (json.errors?.length) {
      const messages = json.errors.map((e) => {
        const code = e.extensions?.code ? ` [${e.extensions.code}]` : '';
        return `${e.message}${code}`;
      });
      return {
        ok: false,
        reason: 'token recusado pela API',
        detail: messages.join(' | '),
        status: res.status,
      };
    }

    if (json.data?.viewer) {
      return { ok: true, viewer: json.data.viewer, status: res.status };
    }

    return {
      ok: false,
      reason: 'resposta inesperada',
      detail: `HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`,
    };
  } catch (err) {
    return { ok: false, reason: 'erro de rede', detail: err.message };
  }
}

/** Descrição curta do token, para conferência visual (sem expor o valor). */
export function describeToken(rawToken) {
  const t = sanitizeToken(rawToken);
  if (!t) return '(vazio)';
  return `len=${t.length} | início="${t.slice(0, 4)}" | fim="${t.slice(-4)}"`;
}
