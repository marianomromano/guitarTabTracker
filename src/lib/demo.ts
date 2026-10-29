import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tabs } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function readDemoUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.is_anonymous ? user.id : null;
}

// Called only with the source ID verified from the request's previous Auth session.
export async function claimDemoTabs(signedInUserId: string, demoUserId: string) {
  if (signedInUserId === demoUserId) return 0;
  const db = await getDb();
  return db.transaction(async (tx) => {
    const source = await tx.select().from(tabs).where(eq(tabs.userId, demoUserId));
    for (const tab of source) {
      await tx.insert(tabs).values({ ...tab, id: crypto.randomUUID(), userId: signedInUserId })
        .onConflictDoNothing({ target: [tabs.userId, tabs.trackId, tabs.instrument] });
    }
    await tx.delete(tabs).where(and(eq(tabs.userId, demoUserId)));
    return source.length;
  });
}
