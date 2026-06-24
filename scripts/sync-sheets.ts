import "dotenv/config";

import { syncAllSheetSources, syncSheetSource } from "../src/lib/sheets/sync";

const sheetSourceId = process.argv[2];

async function main() {
  console.log(
    sheetSourceId
      ? `Syncing sheet source ${sheetSourceId}...`
      : "Syncing all sheet sources...",
  );
  const results = sheetSourceId
    ? [await syncSheetSource(sheetSourceId)]
    : await syncAllSheetSources();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
