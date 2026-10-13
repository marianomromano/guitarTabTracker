"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useSignIn } from "@clerk/nextjs/legacy";
import { passwordSignInAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordSignIn() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isLoaded || !signIn || !setActive) return;

    setError(null);
    setPending(true);
    try {
      const result = await passwordSignInAction({ email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const attempt = await signIn.create({
        strategy: "ticket",
        ticket: result.ticket,
      });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.push("/library");
        router.refresh();
        return;
      }

      window.location.assign(`/library?__clerk_ticket=${encodeURIComponent(result.ticket)}`);
    } catch {
      setError("Could not sign in right now. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle() {
    if (!isLoaded || !signIn) return;
    setError(null);
    await signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/library",
    });
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171410] p-6">
      <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Welcome back</p>
      <h1 className="font-heading mt-2 text-2xl">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Use your password. No email code.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <Input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="submit"
          disabled={pending || !isLoaded}
          className="bg-gold text-black hover:bg-gold/90"
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-white/15"
        onClick={signInWithGoogle}
        disabled={!isLoaded}
      >
        Continue with Google
      </Button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/sign-up" className="text-gold underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
