import {
    createSessionId,
    createDataFrame,
    serializeFrame
} from "./protocol.js";


// ============================================
// DOM ELEMENTS
// ============================================

const fileInput =
    document.getElementById("fileInput");

const fileInfo =
    document.getElementById("fileInfo");

const fileName =
    document.getElementById("fileName");

const fileType =
    document.getElementById("fileType");

const fileSize =
    document.getElementById("fileSize");

const bytesLoaded =
    document.getElementById("bytesLoaded");

const chunkSize =
    document.getElementById("chunkSize");

const totalChunksElement =
    document.getElementById("totalChunks");

const reconstructedBytes =
    document.getElementById("reconstructedBytes");

const chunkIntegrity =
    document.getElementById("chunkIntegrity");


// ============================================
// CONFIGURATION
// ============================================

const CHUNK_SIZE = 1024;


// ============================================
// FILE SELECTION
// ============================================

fileInput.addEventListener(
    "change",
    handleFileSelection
);


// ============================================
// MAIN FILE PROCESSING
// ============================================

async function handleFileSelection(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }


    // ----------------------------------------
    // 1. Display file information
    // ----------------------------------------

    fileName.textContent =
        file.name;

    fileType.textContent =
        file.type || "Unknown";

    fileSize.textContent =
        formatFileSize(file.size);

    fileInfo.classList.remove("hidden");


    try {

        // ------------------------------------
        // 2. Read file into memory
        // ------------------------------------

        const arrayBuffer =
            await file.arrayBuffer();

        const bytes =
            new Uint8Array(arrayBuffer);

        bytesLoaded.textContent =
            `${bytes.length.toLocaleString()} bytes`;


        // ------------------------------------
        // 3. Split file into chunks
        // ------------------------------------

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


        // ------------------------------------
        // 4. Reconstruct file
        // ------------------------------------

        const reconstructed =
            reconstructFromChunks(
                chunks
            );

        reconstructedBytes.textContent =
            `${reconstructed.length.toLocaleString()} bytes`;


        // ------------------------------------
        // 5. Verify chunk integrity
        // ------------------------------------

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


        // ------------------------------------
        // 6. Create transfer session
        // ------------------------------------

        const sessionId =
            createSessionId();


        // ------------------------------------
        // 7. Create protocol frames
        // ------------------------------------

        const frames = [];

        for (
            let i = 0;
            i < chunks.length;
            i++
        ) {

            const frame =
                createDataFrame(
                    sessionId,
                    i,
                    totalChunks,
                    chunks[i]
                );

            frames.push(frame);
        }


        // ------------------------------------
        // 8. Debug frame information
        // ------------------------------------

        console.log(
            "================================"
        );

        console.log(
            "FRAME PROTOCOL"
        );

        console.log(
            "================================"
        );

        console.log(
            "Session ID:",
            sessionId
        );

        console.log(
            "Total frames:",
            frames.length
        );

        console.log(
            "First frame:",
            frames[0]
        );

        console.log(
            "Serialized first frame:",
            serializeFrame(frames[0])
        );

        console.log(
            "Serialized frame size:",
            serializeFrame(frames[0]).length,
            "characters"
        );

        console.log(
            "Last frame:",
            frames[frames.length - 1]
        );

        console.log(
            "================================"
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


// ============================================
// CHUNKING
// ============================================

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


// ============================================
// RECONSTRUCTION
// ============================================

function reconstructFromChunks(
    chunks
) {

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


// ============================================
// BYTE COMPARISON
// ============================================

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


// ============================================
// FILE SIZE FORMATTER
// ============================================

function formatFileSize(
    bytes
) {

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