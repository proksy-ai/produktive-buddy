import { db } from "@/lib/db";
import { buildCalendar } from "@/lib/ics";
import { isShareExpired } from "@/modules/calendar/application/share-service";
import { getActiveTermContext, getUserSessions } from "@/modules/schedule/application/schedule-service";

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

  const share = user
    ? null
    : await db.calendarShare.findUnique({
        where: { token },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

  if (!user && (!share || share.revokedAt || isShareExpired(share))) {
    return new Response("Not found", { status: 404 });
  }

  const owner = user ?? share!.user;

  const [ctx, sessions] = await Promise.all([
    getActiveTermContext(owner.id),
    getUserSessions(owner.id, {
      from: share?.startsOn ?? undefined,
      to: share?.endsOn ?? undefined,
    }),
  ]);

  const calName = ctx
    ? `Produktive Buddy · ${ctx.programName} ${ctx.termName}${share ? " · shared" : ""}`
    : "Produktive Buddy Schedule";
  const body = buildCalendar(sessions, calName);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="produktive-buddy.ics"',
      "Cache-Control": "public, max-age=900",
    },
  });
}
