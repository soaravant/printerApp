export async function performLogin(username: string, password: string): Promise<{ ok: true } | { ok: false; code: string; httpStatus?: number }> {
  const res = await fetch("/api/auth/custom-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  let payload: any = null
  try { payload = await res.json() } catch {}
  if (!res.ok) {
    const code = String(payload?.error || "server_error")
    return { ok: false, code, httpStatus: res.status }
  }

  const { token } = payload || {}
  const { signInWithCustomToken } = await import("./firebase-auth")
  const { auth } = await import("./firebase-app")
  await signInWithCustomToken(auth, token)
  return { ok: true }
}


