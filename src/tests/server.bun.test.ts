import { HonoUploadError } from "../model/HonoUpload/HonoUpload";
import { TEST_SERVER_PORT } from "./globaltest";
import fs from "fs";


describe('File Upload', () => {

    const APIURL = `http://localhost:${TEST_SERVER_PORT}`;

    it('test server connection', async () => {
        const response = await fetch(APIURL);
        expect(response.status).toBe(200);
    });

    it('upload file with name', async () => {
        const file = fs.readFileSync('./src/tests/testfiles/santa.png');
        console.log("File size: " + file.length);

        const fileblob = new Blob([file], { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', fileblob, 'santa.png');

        const response = await fetch(`${APIURL}/upload`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ location: expect.any(String) });
    });

    it('upload file without name', async () => {
        const file = fs.readFileSync('./src/tests/testfiles/santa.png');
        console.log("File size: " + file.length);

        const fileblob = new Blob([file], { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', fileblob);

        const response = await fetch(`${APIURL}/upload`, {
            method: 'POST',
            body: formData,
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toBe(HonoUploadError.EMPTY_FILENAME);
    })
});