import { renderBrandIcon } from "@/lib/brand-icon";

export const dynamic = "force-static";

export function GET() {
  return renderBrandIcon(512);
}
