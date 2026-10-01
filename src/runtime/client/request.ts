export interface LocalRequestOptions {
  body?: unknown
  token?: string
}

export function localRequest(
  method: 'GET' | 'POST' | 'DELETE',
  options: LocalRequestOptions = {}
): RequestInit {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-nuxtjp-local-runtime': '1'
  }
  let body: string | undefined
  if (options.body !== undefined) {
    body = JSON.stringify(options.body)
    headers['content-type'] = 'application/json'
  }
  if (options.token) headers.authorization = `Bearer ${options.token}`
  return {
    method,
    headers,
    ...(body === undefined ? {} : { body }),
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    mode: 'cors'
  }
}
