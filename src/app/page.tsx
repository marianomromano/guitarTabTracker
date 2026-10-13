import { redirect } from "next/navigation";
import { Splash } from "@/components/splash";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (session.isSignedIn) {
    redirect("/library");
  }

  return <Splash clerkEnabled={session.clerkEnabled} isDemo={session.isDemo} />;
}
