import { GenshinClient } from "./genshinClient.js";

async function main() {
    const client = new GenshinClient({
        uid: "894577157",
        server: "os_asia",
        ltoken: "v2_CAISDGM5b3FhcTNzM2d1OBokMGQxMmE4YTItMjQxZi00NTQwLTk1NjMtZThiMzM1NWNjZjBkIIri1cgGKL_fvJ0HMK2o0bIBQgtiYnNfb3ZlcnNlYVhq.CnEVaQAAAAAB.MEYCIQC3T9HYqcVi0Jr0OzC6gphV3CH-96808ob24LJCHvPH4wIhAKpPKWmKh04E2N55vrqXkixWImZG2oWIvh5T-dvmkl1I",
        ltuid: "374625325"
    });

    try {
        const result = await client.getAll();
        console.log("=== Genshin Daily Note ===");
        console.dir(result, { depth: null });
        console.log("=========================");
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

main();
