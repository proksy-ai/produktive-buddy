import { db } from "@/lib/db";
import { buildCalendar } from "@/lib/ics";
import { getActiveTermContext, getUserSessions } from "@/lib/schedule";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/i, "");

  const user = await db.user.findUnique({
    where: { calendarToken: token },
    select: { id: true, name: true },
  });

  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  const [ctx, sessions] = await Promise.all([
    getActiveTermContext(user.id),
    getUserSessions(user.id),
  ]);

  const calName = ctx
    ? `Kairo · ${ctx.programName} ${ctx.termName}`
    : "Kairo Schedule";
  const body = buildCalendar(sessions, calName);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="kairo.ics"',
      "Cache-Control": "public, max-age=900",
    },
  });
}
