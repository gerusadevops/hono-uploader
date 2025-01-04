"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HonoStorageDisk: () => HonoStorageDisk,
  HonoStorageS3: () => HonoStorageS3,
  HonoUpload: () => HonoUpload,
  HonoUploadError: () => HonoUploadError,
  HonoUploadS3Deleter: () => HonoUploadS3Deleter,
  UploadOptionsDefault: () => UploadOptionsDefault,
  UploadOptionsImages: () => UploadOptionsImages,
  amazonS3Configurator: () => amazonS3Configurator,
  digitalOceanSpacesS3Configurator: () => digitalOceanSpacesS3Configurator
});
module.exports = __toCommonJS(index_exports);

// src/model/HonoUpload/HonoUploadError.ts
var HonoUploadError = /* @__PURE__ */ ((HonoUploadError2) => {
  HonoUploadError2["FILE_NOT_FOUND"] = "file.upload.error.file_not_found";
  HonoUploadError2["FILES_NOT_FOUND"] = "file.upload.error.files_not_found";
  HonoUploadError2["EXPECTED_ARRAY_OF_FILES"] = "file.upload.error.expected_array_of_files";
  HonoUploadError2["INVALID_FILE"] = "file.upload.error.invalid_file";
  HonoUploadError2["INVALID_FILE_TYPE"] = "file.upload.error.invalid_file_type";
  HonoUploadError2["FILE_TOO_BIG"] = "file.upload.error.file_too_big";
  HonoUploadError2["EMPTY_FILE"] = "file.upload.error.empty_file";
  HonoUploadError2["EMPTY_FILENAME"] = "file.upload.error.empty_filename";
  return HonoUploadError2;
})(HonoUploadError || {});

// src/model/HonoUpload/HonoUpload.ts
var import_factory = require("hono/factory");

// src/model/HonoUpload/storage/HonoStorageDisk.ts
var import_node_path = __toESM(require("path"));
var import_promises = __toESM(require("fs/promises"));
var HonoStorageDisk = class {
  route;
  constructor(route = __dirname) {
    this.route = route;
  }
  async saveFile(file, filename) {
    const filenameSanitizado = filename.replace(/[^a-zA-Z0-9.]/g, "");
    const finalPath = import_node_path.default.join(this.route, filenameSanitizado);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await import_promises.default.writeFile(finalPath, bytes);
    return finalPath;
  }
};

// src/model/HonoUpload/HonoUploadOptions.ts
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

// src/model/HonoUpload/HonoUpload.ts
var import_http_exception = require("hono/http-exception");
var HonoUpload = class {
  storage;
  constructor(storage) {
    this.storage = storage || new HonoStorageDisk();
  }
  validateFileIntegrity(file, uploadOptions) {
    if (file == null) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.file_not_found" /* FILE_NOT_FOUND */ });
    if (file.size == 0) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.empty_file" /* EMPTY_FILE */ });
    if (file.name == void 0 || file.name == "") throw new import_http_exception.HTTPException(400, { message: "file.upload.error.empty_filename" /* EMPTY_FILENAME */ });
    if (uploadOptions.fileMimeFilter(file) == false) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.invalid_file_type" /* INVALID_FILE_TYPE */ });
    if (uploadOptions.maxFileSizeBytes && file.size > uploadOptions.maxFileSizeBytes) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.file_too_big" /* FILE_TOO_BIG */ });
  }
  optionalSingle(fieldName, uploadOptions = UploadOptionsDefault) {
    return (0, import_factory.createMiddleware)(async (c, next) => {
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
    return (0, import_factory.createMiddleware)(async (c, next) => {
      const body = await c.req.parseBody();
      const file = body[fieldName];
      if (file == null) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.file_not_found" /* FILE_NOT_FOUND */ });
      if (file instanceof File == false) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.invalid_file" /* INVALID_FILE */ });
      this.validateFileIntegrity(file, uploadOptions);
      const filename = uploadOptions.getFileKey(file);
      const finalPath = await this.storage.saveFile(file, filename);
      c.set("file", { location: finalPath, file });
      await next();
    });
  }
  array(fieldName, uploadOptions = UploadOptionsDefault) {
    return (0, import_factory.createMiddleware)(async (c, next) => {
      const body = await c.req.formData();
      let filesArray = body.getAll(fieldName);
      if (filesArray === null) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.files_not_found" /* FILES_NOT_FOUND */ });
      if (filesArray instanceof File === true) filesArray = [filesArray];
      if (filesArray instanceof Array === false) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.expected_array_of_files" /* EXPECTED_ARRAY_OF_FILES */ });
      for (const file of filesArray) {
        if (file instanceof File === false) throw new import_http_exception.HTTPException(400, { message: "file.upload.error.invalid_file" /* INVALID_FILE */ });
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

// src/model/HonoUpload/storage/s3/HonoStorageS3.ts
var import_lib_storage = require("@aws-sdk/lib-storage");
var import_path = __toESM(require("path"));
var HonoStorageS3 = class {
  s3Client;
  bucketOptions;
  basePath;
  constructor(s3Config, path3) {
    this.basePath = path3.path;
    this.s3Client = s3Config.s3Client;
    this.bucketOptions = s3Config.bucketConfig;
  }
  async saveFile(file, filename) {
    const filenameSanitizado = filename.replace(/[^a-zA-Z0-9.]/g, "");
    const key = import_path.default.join(this.basePath, filenameSanitizado);
    const upload = new import_lib_storage.Upload({
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

// src/model/HonoUpload/storage/s3/HonoUploaderS3Deleter.ts
var import_client_s3 = require("@aws-sdk/client-s3");
var HonoUploadS3Deleter = class {
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
      const deleteObjectInstruction = new import_client_s3.DeleteObjectCommand(params);
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
      const deleteObjectInstruction = new import_client_s3.DeleteObjectCommand(params);
      await s3Client.send(deleteObjectInstruction);
      return true;
    } catch (err) {
      console.error("Error deleting file from S3: ", err);
      return false;
    }
  }
};

// src/model/HonoUpload/storage/s3/IHonoStorageS3Constructor.ts
var import_client_s32 = require("@aws-sdk/client-s3");
function amazonS3Configurator(accessKeyId, accessKeySecret, bucketName, region, acl = "public-read") {
  console.table({ accessKeyId, accessKeySecret, bucketName, region });
  const s3Client = new import_client_s32.S3Client({
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
  const s3Client = new import_client_s32.S3Client({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HonoStorageDisk,
  HonoStorageS3,
  HonoUpload,
  HonoUploadError,
  HonoUploadS3Deleter,
  UploadOptionsDefault,
  UploadOptionsImages,
  amazonS3Configurator,
  digitalOceanSpacesS3Configurator
});
