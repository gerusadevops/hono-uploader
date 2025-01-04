import { TEST_SERVER_PORT } from './globaltest';
import { HonoUploader, UploadedFile } from '../model/HonoUploader/HonoUploader';

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HonoStorageDisk } from '../model/HonoUploader/storage/HonoStorageDisk';
import { HonoStorageS3 } from '../model/HonoUploader/storage/s3/HonoStorageS3';
import { amazonS3Configurator } from '../model/HonoUploader/storage/s3/IHonoStorageS3Constructor';
import { UploadOptionsImages } from '../model/HonoUploader/HonoUploaderOptions';
import { HonoUploaderS3Deleter } from '../model/HonoUploader/storage/s3/HonoUploaderS3Deleter';


const app = new Hono();
app.use(logger());

app.get('/', (c) => c.text('Hello Bun!'));

//DISK STORAGE
const diskStorage = new HonoStorageDisk(__dirname + '/testUploads');
const honoUploader = new HonoUploader(diskStorage);
app.post('/upload', honoUploader.single('file'), (c) => c.json({ location: c.get('file').location }));

app.post('/upload/image', honoUploader.single('file', UploadOptionsImages), (c) => c.json({ location: c.get('file').location }));

app.post('/upload/many', honoUploader.array('files'), (c) => c.json({ locations: c.get('files').map((f: UploadedFile) => f.location) }));





const bucketName = process.env.AWS_S3_BUCKET_NAME!;
const keyId = process.env.AWS_S3_ACCESS_KEY!;
const keySecret = process.env.AWS_S3_KEY_SECRET!;
const region = process.env.AWS_S3_DATA_REGION!;

const s3Config = amazonS3Configurator(keyId, keySecret, bucketName, region);
const s3Storage = new HonoStorageS3(s3Config, { path: 'test' });
const s3Uploader = new HonoUploader(s3Storage);

app.post('/uploadS3', s3Uploader.single('file'), (c) => c.json({ location: c.get('file').location }));

app.post('/uploadS3/image', s3Uploader.single('file', UploadOptionsImages), (c) => c.json({ location: c.get('file').location }));

app.post('/uploadS3/many', s3Uploader.array('files'), (c) => c.json({ locations: c.get('files').map((f: UploadedFile) => f.location) }));

app.delete('/delete/s3/files', async (c) => {
    const { files } = await c.req.json();
    const honoDeleter = new HonoUploaderS3Deleter(s3Config);
    const deleted = await Promise.all(files.map(async (f: string) => {
        return await honoDeleter.deleteFileFromAmazonUrl(f);
    }));
    console.log(deleted);
    return c.json({ deleted });
});

export default {
    fetch: app.fetch,
    port: TEST_SERVER_PORT
}
