import {
    createSessionId,
    createDataFrame,
    serializeFrame
} from "./protocol.js";
const fileInput = document.getElementById("fileInput");

const fileInfo = document.getElementById("fileInfo");

const fileName = document.getElementById("fileName");
const fileType = document.getElementById("fileType");
const fileSize = document.getElementById("fileSize");
const bytesLoaded = document.getElementById("bytesLoaded");

const chunkSize = document.getElementById("chunkSize");
const totalChunksElement = document.getElementById("totalChunks");

const reconstructedBytes =
    document.getElementById("reconstructedBytes");

const chunkIntegrity =
    document.getElementById("chunkIntegrity");

const CHUNK_SIZE = 1024;

fileInput.addEventListener(
    "change",
    handleFileSelection
);


async function handleFileSelection(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    // -----------------------------
    // 1. Display file information
    // -----------------------------

    fileName.textContent = file.name;

    fileType.textContent =
        file.type || "Unknown";

    fileSize.textContent =
        formatFileSize(file.size);

    fileInfo.classList.remove("hidden");


    try {

        // -----------------------------
        // 2. Read file into memory
        // -----------------------------

        const arrayBuffer =
            await file.arrayBuffer();

        const bytes =
            new Uint8Array(arrayBuffer);

        bytesLoaded.textContent =
            `${bytes.length.toLocaleString()} bytes`;


        // -----------------------------
        // 3. Split file into chunks
        // -----------------------------

        const chunks =
            splitIntoChunks(
                bytes,
                CHUNK_SIZE
            );

        const totalChunks =
            chunks.length;

        chunkSize.textContent =
            `${CHUNK_SIZE.toLocaleString()} bytes`;

        totalChunksElement.textContent =
            totalChunks.toLocaleString();


        // -----------------------------
        // 4. Reconstruct file
        // -----------------------------

        const reconstructed =
            reconstructFromChunks(chunks);


        reconstructedBytes.textContent =
            `${reconstructed.length.toLocaleString()} bytes`;


        // -----------------------------
        // 5. Verify integrity
        // -----------------------------

        const isValid =
            compareBytes(
                bytes,
                reconstructed
            );


        if (isValid) {

            chunkIntegrity.textContent =
                "PASS ✓";

        } else {

            chunkIntegrity.textContent =
                "FAILED ✗";
        }


        // -----------------------------
        // 6. Debug information
        // -----------------------------

        console.log(
            "File loaded successfully"
        );

        console.log(
            "File name:",
            file.name
        );

        console.log(
            "Original bytes:",
            bytes.length
        );

        console.log(
            "Chunk size:",
            CHUNK_SIZE
        );

        console.log(
            "Total chunks:",
            totalChunks
        );

        console.log(
            "Reconstructed bytes:",
            reconstructed.length
        );

        console.log(
            "Chunk integrity:",
            isValid
        );

        console.log(
            "First chunk:",
            chunks[0]
        );

        console.log(
            "Last chunk:",
            chunks[chunks.length - 1]
        );


    } catch (error) {

        console.error(
            "File processing failed:",
            error
        );

        chunkIntegrity.textContent =
            "ERROR";
    }
}


/*
 * Split the file into fixed-size chunks.
 */
function splitIntoChunks(
    bytes,
    chunkSize
) {

    const chunks = [];

    for (
        let offset = 0;
        offset < bytes.length;
        offset += chunkSize
    ) {

        const chunk =
            bytes.slice(
                offset,
                offset + chunkSize
            );

        chunks.push(chunk);
    }

    return chunks;
}


/*
 * Reconstruct the original byte array
 * from the chunks.
 */
function reconstructFromChunks(chunks) {

    let totalLength = 0;

    for (const chunk of chunks) {

        totalLength +=
            chunk.length;
    }


    const reconstructed =
        new Uint8Array(
            totalLength
        );


    let offset = 0;


    for (const chunk of chunks) {

        reconstructed.set(
            chunk,
            offset
        );

        offset +=
            chunk.length;
    }


    return reconstructed;
}


/*
 * Compare two Uint8Arrays byte by byte.
 */
function compareBytes(
    original,
    reconstructed
) {

    if (
        original.length !==
        reconstructed.length
    ) {

        return false;
    }


    for (
        let i = 0;
        i < original.length;
        i++
    ) {

        if (
            original[i] !==
            reconstructed[i]
        ) {

            return false;
        }
    }


    return true;
}


/*
 * Convert bytes into a
 * human-readable file size.
 */
function formatFileSize(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    const size =
        bytes /
        Math.pow(
            1024,
            index
        );


    return `${size.toFixed(2)} ${units[index]}`;
}