import { HonoUploaderError } from "../model/HonoUploader/HonoUploaderError";
import { TEST_SERVER_PORT } from "./globaltest";
import fs from "fs";

const APIURL = `http://localhost:${TEST_SERVER_PORT}`;

const santaFile = fs.readFileSync('./src/tests/testfiles/santa.jpeg');
const santaFileBlob = new Blob([santaFile], { type: 'image/jpeg' });
const santaFilename = "sanata.jpeg";

const batmanFile = fs.readFileSync('./src/tests/testfiles/batman.jpeg');
const batmanFileBlob = new Blob([batmanFile], { type: 'image/jpeg' });
const batmanFilename = "batman.jpeg";

const bigImageFile = fs.readFileSync('./src/tests/testfiles/bigimage.png');
const bigImageFileBlob = new Blob([bigImageFile], { type: 'image/png' });
const bigImageFilename = "bigimage.png";

const samplePDF = fs.readFileSync('./src/tests/testfiles/sample.pdf');
const samplePDFBlob = new Blob([samplePDF], { type: 'application/pdf' });
const samplePDFFilename = "sample.pdf";

const uploadedS3Files: string[] = [];


beforeAll(() => {
    deleteLocalUploadedFiles();
});

afterAll(() => {
    deleteFilesFromS3();
    deleteLocalUploadedFiles();
});

describe('Environment setup', () => {
    it('should have the test file', () => {
        expect(santaFile).toBeDefined();
    });

    it('test server connection', async () => {
        const response = await fetch(APIURL);
        expect(response.status).toBe(200);
    });
});

describe('File upload disk storage', () => {

    it('upload file with name returns location object', async () => {

        const formData = new FormData();
        formData.append('file', santaFileBlob, santaFilename);

        const response = await fetch(`${APIURL}/upload`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ location: expect.any(String) });
    });

    it('upload file without name returns 400', async () => {
        const formData = new FormData();
        formData.append('file', santaFileBlob);

        const response = await fetch(`${APIURL}/upload`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.EMPTY_FILENAME);
    });

    it('Upload big file, exciding file limit', async () => {
        const formData = new FormData();
        formData.append('file', bigImageFileBlob, bigImageFilename);

        const response = await fetch(`${APIURL}/upload`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.FILE_TOO_BIG);
    });

    it('Upload file with malicious filename', async () => {

        const formData = new FormData();
        formData.append('file', santaFileBlob, '../../santa.jpeg"');

        const response = await fetch(`${APIURL}/upload`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(200);
    });

    it('Upload file with no MIME', async () => {
        const formData = new FormData();
        formData.append('file', new Blob(), 'empty.jpeg');

        const response = await fetch(`${APIURL}/upload`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(400);
    });

    it('Upload file with invalid MIME', async () => {
        const formData = new FormData();
        formData.append('file', samplePDFBlob, samplePDFFilename);

        const response = await fetch(`${APIURL}/upload/image`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.INVALID_FILE_TYPE);
    });

    it('upload many files', async () => {
        const formData = new FormData();
        formData.append('files', santaFileBlob, santaFilename);
        formData.append('files', batmanFileBlob, batmanFilename);

        const response = await fetch(`${APIURL}/upload/many`, {
            method: 'POST',
            body: formData,

        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ locations: [expect.any(String), expect.any(String)] });
    });

    it('upload many files with one empty file', async () => {
        const formData = new FormData();
        formData.append('files', santaFileBlob, santaFilename);
        formData.append('files', new Blob(), 'empty.jpeg');

        const response = await fetch(`${APIURL}/upload/many`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.EMPTY_FILE);
    });

    it('upload many files with one big file', async () => {
        const formData = new FormData();
        formData.append('files', santaFileBlob, santaFilename);
        formData.append('files', bigImageFileBlob, bigImageFilename);

        const response = await fetch(`${APIURL}/upload/many`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.FILE_TOO_BIG);
    });
});

describe('File upload s3 storage', () => {
    it('upload to s3', async () => {
        const formData = new FormData();
        formData.append('file', santaFileBlob, santaFilename);

        const response = await fetch(`${APIURL}/uploadS3`, {
            method: 'POST',
            body: formData,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ location: expect.any(String) });
        uploadedS3Files.push(data.location);
    });

    it('upload to s3 with invalid MIME', async () => {
        const formData = new FormData();
        formData.append('file', samplePDFBlob, samplePDFFilename);

        const response = await fetch(`${APIURL}/uploadS3/image`, {
            method: 'POST',
            body: formData,
        });
        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.INVALID_FILE_TYPE);
    });

    it('upload to s3 with big file', async () => {
        const formData = new FormData();
        formData.append('file', bigImageFileBlob, bigImageFilename);

        const response = await fetch(`${APIURL}/uploadS3`, {
            method: 'POST',
            body: formData,
        });
        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.FILE_TOO_BIG);
    });

    it('upload to s3 with empty file', async () => {
        const formData = new FormData();
        formData.append('file', new Blob(), 'empty.jpeg');

        const response = await fetch(`${APIURL}/uploadS3`, {
            method: 'POST',
            body: formData,
        });
        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.EMPTY_FILE);
    });

    it('upload many files to s3', async () => {
        const formData = new FormData();
        formData.append('files', santaFileBlob, santaFilename);
        formData.append('files', batmanFileBlob, batmanFilename);

        const response = await fetch(`${APIURL}/uploadS3/many`, {
            method: 'POST',
            body: formData,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(await data).toEqual({ locations: [expect.any(String), expect.any(String)] });
        uploadedS3Files.push(...data.locations);
    });

    it('upload many files to s3 with one empty file', async () => {
        const formData = new FormData();
        formData.append('files', santaFileBlob, santaFilename);
        formData.append('files', new Blob(), 'empty.jpeg');

        const response = await fetch(`${APIURL}/uploadS3/many`, {
            method: 'POST',
            body: formData,
        });
        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.EMPTY_FILE);
    });

    it('upload many files to s3 with one big file', async () => {
        const formData = new FormData();
        formData.append('files', santaFileBlob, santaFilename);
        formData.append('files', bigImageFileBlob, bigImageFilename);

        const response = await fetch(`${APIURL}/uploadS3/many`, {
            method: 'POST',
            body: formData,
        });
        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploaderError.FILE_TOO_BIG);
    });



});

async function deleteLocalUploadedFiles() {
    fs.readdirSync('./src/tests/testUploads').forEach(file => {
        if (file !== '.gitkeep') {
            fs.unlinkSync(`./src/tests/testUploads/${file}`);
        }
    });

}
async function deleteFilesFromS3() {

    console.log("Deliting files from S3");

    const result = await fetch(`${APIURL}/delete/s3/files`, {
        method: 'DELETE',
        body: JSON.stringify({ files: uploadedS3Files }),
    });

    const data = await result.json();
    const deletedFiles = data.deleted;
    console.log(deletedFiles);
    console.log("Files deleted from S3");

}

