# Hono Upload

Hono Upload is a powerful and flexible file upload library for Node.js and Bun, designed to handle various file types and storage options, including local disk storage and Amazon S3. It provides a simple API for uploading files, validating file types, and managing file storage.

## Motivation

The motivation behind Hono Upload is to provide a robust and easy-to-use solution for file uploads in Bun and Node.js applications using Hono. Whether you need to store files locally or in the cloud, Hono Upload offers a consistent and reliable interface for handling file uploads.

## Features

- Supports multiple storage options: local disk and Amazon S3
- Validates file types and sizes
- Handles single and multiple file uploads
- Provides detailed error messages for invalid uploads

## Installation

To install Hono Upload, use npm or yarn:

```bash
npm install hono-upload
```

## Usage

### Local Disk Storage

To upload files to local disk storage using Hono framework, use the following example:

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HonoUpload, UploadedFile } from 'hono-upload';
import { HonoStorageDisk } from 'hono-upload/storage/HonoStorageDisk';

const app = new Hono();
app.use(logger());

const diskStorage = new HonoStorageDisk('./uploads');
const honoUploader = new HonoUpload(diskStorage);

app.post('/upload', honoUploader.single('file'), (c) => c.json({ location: c.get('file').location }));

app.post('/upload/many', honoUploader.array('files'), (c) => c.json({ locations: c.get('files').map((f: UploadedFile) => f.location) }));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

### Amazon S3 Storage

To upload files to Amazon S3 using Hono framework, use the following example:

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HonoUpload, UploadedFile } from 'hono-upload';
import { HonoStorageS3 } from 'hono-upload/storage/s3/HonoStorageS3';
import { amazonS3Configurator } from 'hono-upload/storage/s3/IHonoStorageS3Constructor';

const app = new Hono();
app.use(logger());

const bucketName = process.env.AWS_S3_BUCKET_NAME!;
const keyId = process.env.AWS_S3_ACCESS_KEY!;
const keySecret = process.env.AWS_S3_KEY_SECRET!;
const region = process.env.AWS_S3_DATA_REGION!;

const s3Config = amazonS3Configurator(keyId, keySecret, bucketName, region);
const s3Storage = new HonoStorageS3(s3Config, { path: 'test' });
const s3Uploader = new HonoUpload(s3Storage);

app.post('/uploadS3', s3Uploader.single('file'), (c) => c.json({ location: c.get('file').location }));

app.post('/uploadS3/many', s3Uploader.array('files'), (c) => c.json({ locations: c.get('files').map((f: UploadedFile) => f.location) }));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Error Handling

Hono Upload provides detailed error messages for invalid uploads. Here are some common errors:

- `HonoUploadError.EMPTY_FILENAME`: The uploaded file has an empty filename.
- `HonoUploadError.FILE_TOO_BIG`: The uploaded file exceeds the size limit.
- `HonoUploadError.INVALID_FILE_TYPE`: The uploaded file type is not allowed.
- `HonoUploadError.EMPTY_FILE`: The uploaded file is empty.

## Testing

To run the tests, use the following command:

```bash
bun test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License

Hono Upload is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
