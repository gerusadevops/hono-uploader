import type { HonoFileStorageOption } from "../interface/HonoStorageOption";
import path from "node:path";
import fs from "node:fs/promises";

export class HonoStorageDisk implements HonoFileStorageOption {
    route: string;

    constructor(route: string = __dirname) {
        this.route = route;
    }
    async saveFile(file: File, filename: string): Promise<string> {
        const filenameSanitizado = filename.replace(/[^a-zA-Z0-9.]/g,'');
        const finalPath = path.join(this.route, filenameSanitizado);
        
        const bytes = new Uint8Array(await file.arrayBuffer());
         await fs.writeFile(finalPath, bytes);
        return finalPath;
    }
}