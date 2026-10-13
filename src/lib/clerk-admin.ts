function clerkSecret() {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) {
    throw new Error("Clerk is not configured.");
  }
  return key;
}

async function clerkFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${clerkSecret()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = (await response.json()) as T & {
    errors?: { message?: string }[];
  };

  if (!response.ok) {
    const message = data.errors?.[0]?.message ?? `Clerk request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

type ClerkUser = {
  id: string;
};

export async function findClerkUserIdByEmail(email: string) {
  const users = await clerkFetch<ClerkUser[] | { data?: ClerkUser[] }>(
    `/users?email_address=${encodeURIComponent(email)}&limit=1`,
  );
  const list = Array.isArray(users) ? users : users.data ?? [];
  return list[0]?.id ?? null;
}

export async function verifyClerkPassword(userId: string, password: string) {
  try {
    await clerkFetch(`/users/${userId}/verify_password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function createClerkSignInTicket(userId: string) {
  const token = await clerkFetch<{ token: string }>("/sign_in_tokens", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      expires_in_seconds: 120,
    }),
  });
  return token.token;
}
