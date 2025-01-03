import { TEST_SERVER_PORT } from './globaltest';
import { HonoUpload } from '../model/HonoUpload/HonoUpload';

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HonoStorageDisk } from '../model/HonoUpload/storage/HonoStorageDisk';


const app = new Hono();
app.use(logger());

app.get('/', (c) => c.text('Hello Bun!'));

const diskStorage = new HonoStorageDisk(__dirname + '/testUploads');
const honoUploader = new HonoUpload(diskStorage);
app.post('/upload', honoUploader.single('file'), (c) => c.json({ location: c.get('file').location }));


export default {
    fetch: app.fetch,
    port: TEST_SERVER_PORT
}
