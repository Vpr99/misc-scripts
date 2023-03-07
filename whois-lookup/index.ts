import { readFile, writeFile } from "fs/promises";
import { z } from "zod";
import { run, sleep } from "../utils";
import { parse } from "./parser";

const customerSchema = z.object({
  Website: z.string(),
});

async function parseWebsites() {
  // Read the CSV.
  const input = await readFile(__dirname + "/input/raw.csv", {
    encoding: "utf8",
  });
  // Parse it into an array of objects.
  const rows = await parse(input);

  // Store all sites in a Set so they're automatically deduped.
  const sites = new Set<string>();

  // Grab the "Website" property from each row and add it to the Set if present.
  for (const row of rows) {
    const { Website } = customerSchema.parse(row);
    if (Website !== "") {
      sites.add(Website);
    }
  }

  // Currently we're tracking registrars and nameservers.
  const registrars: Record<string, number> = {};
  const nameservers: Record<string, number> = {};

  // For stats & logging.
  const total = sites.size;
  let count = 1;
  let timeouts = 0;

  for await (const site of sites) {
    console.log(`Site: ${count} / ${total} (${site})`);
    count++;
    try {
      const res = await run(
        `whois ${site} | grep -E "Name Server: |Registrar: "`
      );
      const registrarMatch = res.match(/(Registrar: )(.*)/);
      const nameserverMatch = res.match(/(Name Server: )(.*)/);
      if (registrarMatch) {
        const registrar = registrarMatch[2];
        if (!(registrar in registrars)) {
          registrars[registrar] = 1;
        } else {
          registrars[registrar] = registrars[registrar] + 1;
        }
      }

      if (nameserverMatch) {
        const ns = nameserverMatch[2];
        if (!(ns in nameservers)) {
          nameservers[ns] = 1;
        } else {
          nameservers[ns] = nameservers[ns] + 1;
        }
      }

      await sleep(750);
    } catch (e) {
      console.log(`Timeout: ${site}`);
      timeouts++;
      await sleep(750);
    }
  }

  console.log(`
🎉 Done!
———
Timeouts: ${timeouts}
Wrote registrars to "/output/registrars.json"
Wrote nameservers to "/output/nameservers.json"
`);

  await writeFile(
    __dirname + "/output/registrars.json",
    JSON.stringify(registrars),
    { encoding: "utf8" }
  );
  await writeFile(
    __dirname + "/output/nameservers.json",
    JSON.stringify(nameservers),
    { encoding: "utf8" }
  );
}

parseWebsites();
