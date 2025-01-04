// node_modules/tsup/assets/esm_shims.js
import { fileURLToPath } from "url";
import path from "path";
var getFilename = () => fileURLToPath(import.meta.url);
var getDirname = () => path.dirname(getFilename());
var __dirname = /* @__PURE__ */ getDirname();

// src/model/HonoUploader/HonoUploaderError.ts
var HonoUploaderError = /* @__PURE__ */ ((HonoUploaderError2) => {
  HonoUploaderError2["FILE_NOT_FOUND"] = "file.upload.error.file_not_found";
  HonoUploaderError2["FILES_NOT_FOUND"] = "file.upload.error.files_not_found";
  HonoUploaderError2["EXPECTED_ARRAY_OF_FILES"] = "file.upload.error.expected_array_of_files";
  HonoUploaderError2["INVALID_FILE"] = "file.upload.error.invalid_file";
  HonoUploaderError2["INVALID_FILE_TYPE"] = "file.upload.error.invalid_file_type";
  HonoUploaderError2["FILE_TOO_BIG"] = "file.upload.error.file_too_big";
  HonoUploaderError2["EMPTY_FILE"] = "file.upload.error.empty_file";
  HonoUploaderError2["EMPTY_FILENAME"] = "file.upload.error.empty_filename";
  return HonoUploaderError2;
})(HonoUploaderError || {});

// src/model/HonoUploader/HonoUploader.ts
import { createMiddleware } from "hono/factory";

// src/model/HonoUploader/storage/HonoStorageDisk.ts
import path2 from "node:path";
import fs from "node:fs/promises";
var HonoStorageDisk = class {
  route;
  constructor(route = __dirname) {
    this.route = route;
  }
  async saveFile(file, filename) {
    const filenameSanitizado = filename.replace(/[^a-zA-Z0-9.]/g, "");
    const finalPath = path2.join(this.route, filenameSanitizado);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await fs.writeFile(finalPath, bytes);
    return finalPath;
  }
};

// src/model/HonoUploader/HonoUploaderOptions.ts
var UploadOptionsDefault = {
  getFileKey: (file) => {
    const sanitized = encodeURIComponent(file.name);
    return `${Date.now()}_${sanitized}`;
  },
  fileMimeFilter: (file) => {
    const mimie = file.type;
    if (mimie == null || mimie == "") return false;
    return true;
  },
  maxFileSizeBytes: 1024 * 1024,
  // 1MB
  required: false
};
var UploadOptionsImages = {
  getFileKey: (file) => `${Date.now()}_${file.name}`,
  fileMimeFilter: (file) => {
    const mime = file.type;
    return mime === "image/jpeg" || mime === "image/png";
  },
  maxFileSizeBytes: 1024 * 1024,
  // 1MB
  required: false
};

// src/model/HonoUploader/HonoUploader.ts
import { HTTPException } from "hono/http-exception";
var HonoUploader = class {
  storage;
  constructor(storage) {
    this.storage = storage || new HonoStorageDisk();
  }
  validateFileIntegrity(file, uploadOptions) {
    if (file == null) throw new HTTPException(400, { message: "file.upload.error.file_not_found" /* FILE_NOT_FOUND */ });
    if (file.size == 0) throw new HTTPException(400, { message: "file.upload.error.empty_file" /* EMPTY_FILE */ });
    if (file.name == void 0 || file.name == "") throw new HTTPException(400, { message: "file.upload.error.empty_filename" /* EMPTY_FILENAME */ });
    if (uploadOptions.fileMimeFilter(file) == false) throw new HTTPException(400, { message: "file.upload.error.invalid_file_type" /* INVALID_FILE_TYPE */ });
    if (uploadOptions.maxFileSizeBytes && file.size > uploadOptions.maxFileSizeBytes) throw new HTTPException(400, { message: "file.upload.error.file_too_big" /* FILE_TOO_BIG */ });
  }
  optionalSingle(fieldName, uploadOptions = UploadOptionsDefault) {
    return createMiddleware(async (c, next) => {
      const body = await c.req.parseBody();
      const file = body[fieldName];
      let finalPath = null;
      if (file != null) {
        if (file instanceof File == false) throw new Error("Invalid file");
        this.validateFileIntegrity(file, uploadOptions);
        const filename = uploadOptions.getFileKey(file);
        finalPath = await this.storage.saveFile(file, filename);
        c.set("file", { location: finalPath, file });
      }
      await next();
    });
  }
  single(fieldName, uploadOptions = UploadOptionsDefault) {
    return createMiddleware(async (c, next) => {
      const body = await c.req.parseBody();
      const file = body[fieldName];
      if (file == null) throw new HTTPException(400, { message: "file.upload.error.file_not_found" /* FILE_NOT_FOUND */ });
      if (file instanceof File == false) throw new HTTPException(400, { message: "file.upload.error.invalid_file" /* INVALID_FILE */ });
      this.validateFileIntegrity(file, uploadOptions);
      const filename = uploadOptions.getFileKey(file);
      const finalPath = await this.storage.saveFile(file, filename);
      c.set("file", { location: finalPath, file });
      await next();
    });
  }
  array(fieldName, uploadOptions = UploadOptionsDefault) {
    return createMiddleware(async (c, next) => {
      const body = await c.req.formData();
      let filesArray = body.getAll(fieldName);
      if (filesArray === null) throw new HTTPException(400, { message: "file.upload.error.files_not_found" /* FILES_NOT_FOUND */ });
      if (filesArray instanceof File === true) filesArray = [filesArray];
      if (filesArray instanceof Array === false) throw new HTTPException(400, { message: "file.upload.error.expected_array_of_files" /* EXPECTED_ARRAY_OF_FILES */ });
      for (const file of filesArray) {
        if (file instanceof File === false) throw new HTTPException(400, { message: "file.upload.error.invalid_file" /* INVALID_FILE */ });
      }
      const actualFiles = filesArray;
      const filesLocation = await Promise.all(actualFiles.map(async (file) => {
        const currentfile = file;
        this.validateFileIntegrity(currentfile, uploadOptions);
        const filename = uploadOptions.getFileKey(currentfile);
        const finalPath = await this.storage.saveFile(currentfile, filename);
        return { location: finalPath, file: currentfile };
      }));
      c.set("files", filesLocation);
      await next();
    });
  }
};

// src/model/HonoUploader/storage/s3/HonoStorageS3.ts
import { Upload } from "@aws-sdk/lib-storage";
import path3 from "path";
var HonoStorageS3 = class {
  s3Client;
  bucketOptions;
  basePath;
  constructor(s3Config, path4) {
    this.basePath = path4.path;
    this.s3Client = s3Config.s3Client;
    this.bucketOptions = s3Config.bucketConfig;
  }
  async saveFile(file, filename) {
    const filenameSanitizado = filename.replace(/[^a-zA-Z0-9.]/g, "");
    const key = path3.join(this.basePath, filenameSanitizado);
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketOptions.bucketName,
        Key: key,
        ACL: this.bucketOptions.acl,
        Body: file
      }
    });
    const resultado = await upload.done();
    const location = resultado.Location;
    if (location == null) throw new Error("No se pudo subir el archivo");
    return location;
  }
};

// src/model/HonoUploader/storage/s3/HonoUploaderS3Deleter.ts
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
var HonoUploaderS3Deleter = class {
  s3Configuration;
  constructor(s3Configuration) {
    this.s3Configuration = s3Configuration;
  }
  async deleteFileFromAmazonUrl(url) {
    const { s3Client, bucketConfig } = this.s3Configuration;
    const key = url.split(`amazonaws.com/${bucketConfig.bucketName}/`)[1];
    const params = {
      Bucket: bucketConfig.bucketName,
      Key: key
    };
    try {
      const deleteObjectInstruction = new DeleteObjectCommand(params);
      await s3Client.send(deleteObjectInstruction);
      return url;
    } catch (err) {
      console.error("Error deleting file from S3: ", err);
      return null;
    }
  }
  async deleteFileFromDigitalOceanUrl(url) {
    const { s3Client, bucketConfig } = this.s3Configuration;
    const key = url.split("digitaloceanspaces.com/")[1];
    const params = {
      Bucket: bucketConfig.bucketName,
      Key: key
    };
    try {
      const deleteObjectInstruction = new DeleteObjectCommand(params);
      await s3Client.send(deleteObjectInstruction);
      return true;
    } catch (err) {
      console.error("Error deleting file from S3: ", err);
      return false;
    }
  }
};

// src/model/HonoUploader/storage/s3/IHonoStorageS3Constructor.ts
import { S3Client } from "@aws-sdk/client-s3";
function amazonS3Configurator(accessKeyId, accessKeySecret, bucketName, region, acl = "public-read") {
  console.table({ accessKeyId, accessKeySecret, bucketName, region });
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey: accessKeySecret
    },
    forcePathStyle: true
  });
  const s3BucketOptions = { bucketName, acl };
  return { s3Client, bucketConfig: s3BucketOptions };
}
function digitalOceanSpacesS3Configurator(accessKeyId, accessKeySecret, bucketName, acl = "public-read") {
  const s3Client = new S3Client({
    endpoint: "https://nyc3.digitaloceanspaces.com",
    forcePathStyle: false,
    region: "us-east-1",
    credentials: {
      accessKeyId,
      secretAccessKey: accessKeySecret
    }
  });
  const s3BucketOptions = { bucketName, acl };
  return { s3Client, bucketConfig: s3BucketOptions };
}
export {
  HonoStorageDisk,
  HonoStorageS3,
  HonoUploader,
  HonoUploaderError,
  HonoUploaderS3Deleter,
  UploadOptionsDefault,
  UploadOptionsImages,
  amazonS3Configurator,
  digitalOceanSpacesS3Configurator
};
