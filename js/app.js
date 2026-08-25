import {
    createSessionId,
    createDataFrame,
    serializeFrame
} from "./protocol.js";

import QRCode from "qrcode";


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
// QR ELEMENTS
// ============================================

const qrCanvas =
    document.getElementById("qrCanvas");

const currentFrame =
    document.getElementById("currentFrame");

const totalFrames =
    document.getElementById("totalFrames");

const sessionIdElement =
    document.getElementById("sessionId");

const qrStatus =
    document.getElementById("qrStatus");


// ============================================
// TRANSMISSION ELEMENTS
// ============================================

const fpsSelect =
    document.getElementById("fpsSelect");

const startTransmission =
    document.getElementById("startTransmission");

const stopTransmission =
    document.getElementById("stopTransmission");

const transmissionProgress =
    document.getElementById(
        "transmissionProgress"
    );

const elapsedTime =
    document.getElementById("elapsedTime");

const transmissionStatus =
    document.getElementById(
        "transmissionStatus"
    );


// ============================================
// CONFIGURATION
// ============================================

const CHUNK_SIZE = 1024;

const QR_SIZE = 300;

const QR_MARGIN = 2;

const QR_ERROR_CORRECTION =
    "M";


// ============================================
// TRANSMISSION STATE
// ============================================

let frames = [];

let transmissionRunning = false;

let transmissionStartTime = 0;

let currentFrameIndex = 0;


// ============================================
// FILE SELECTION
// ============================================

fileInput.addEventListener(
    "change",
    handleFileSelection
);


// ============================================
// START / STOP BUTTONS
// ============================================

startTransmission.addEventListener(
    "click",
    startQRTransmission
);

stopTransmission.addEventListener(
    "click",
    stopQRTransmission
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
    // Reset previous transmission
    // ----------------------------------------

    stopQRTransmission();


    frames = [];

    currentFrameIndex = 0;


    // ----------------------------------------
    // Display file information
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
        // 1. Read file into memory
        // ------------------------------------

        const arrayBuffer =
            await file.arrayBuffer();

        const bytes =
            new Uint8Array(arrayBuffer);

        bytesLoaded.textContent =
            `${bytes.length.toLocaleString()} bytes`;


        // ------------------------------------
        // 2. Split file into chunks
        // ------------------------------------

        const chunks =
            splitIntoChunks(
                bytes,
                CHUNK_SIZE
            );

        const totalChunkCount =
            chunks.length;

        chunkSize.textContent =
            `${CHUNK_SIZE.toLocaleString()} bytes`;

        totalChunksElement.textContent =
            totalChunkCount.toLocaleString();


        // ------------------------------------
        // 3. Reconstruct file
        // ------------------------------------

        const reconstructed =
            reconstructFromChunks(
                chunks
            );

        reconstructedBytes.textContent =
            `${reconstructed.length.toLocaleString()} bytes`;


        // ------------------------------------
        // 4. Verify chunk integrity
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
        // 5. Create transfer session
        // ------------------------------------

        const sessionId =
            createSessionId();


        sessionIdElement.textContent =
            sessionId;


        // ------------------------------------
        // 6. Create protocol frames
        // ------------------------------------

        frames = [];

        for (
            let i = 0;
            i < chunks.length;
            i++
        ) {

            const frame =
                createDataFrame(
                    sessionId,
                    i,
                    totalChunkCount,
                    chunks[i]
                );

            frames.push(frame);
        }


        // ------------------------------------
        // 7. Display frame information
        // ------------------------------------

        totalFrames.textContent =
            frames.length;

        currentFrame.textContent =
            "0";

        transmissionProgress.textContent =
            "0%";

        elapsedTime.textContent =
            "0.00 s";


        // ------------------------------------
        // 8. Display first frame
        // ------------------------------------

        await displayFrame(0);


        // ------------------------------------
        // 9. Enable transmission
        // ------------------------------------

        startTransmission.disabled =
            false;

        stopTransmission.disabled =
            true;


        transmissionStatus.textContent =
            "Ready to transmit";

        qrStatus.textContent =
            "Frame 0 ready ✓";


        // ------------------------------------
        // Debug information
        // ------------------------------------

        console.log(
            "================================"
        );

        console.log(
            "SENDER 5 - SEQUENTIAL QR STREAM"
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
            "================================"
        );


    } catch (error) {

        console.error(
            "File processing failed:",
            error
        );

        chunkIntegrity.textContent =
            "ERROR";

        qrStatus.textContent =
            "QR generation failed ✗";

        transmissionStatus.textContent =
            "Error";
    }
}


// ============================================
// DISPLAY ONE FRAME
// ============================================

async function displayFrame(
    frameIndex
) {

    if (
        frameIndex < 0 ||
        frameIndex >= frames.length
    ) {

        return;
    }


    const frame =
        frames[frameIndex];


    const serializedFrame =
        serializeFrame(
            frame
        );


    // ----------------------------------------
    // Generate QR
    // ----------------------------------------

    await QRCode.toCanvas(
        qrCanvas,
        serializedFrame,
        {
            width: QR_SIZE,
            margin: QR_MARGIN,
            errorCorrectionLevel:
                QR_ERROR_CORRECTION
        }
    );


    // ----------------------------------------
    // Update UI
    // ----------------------------------------

    currentFrame.textContent =
        frame.frameId;

    totalFrames.textContent =
        frame.totalFrames;

    sessionIdElement.textContent =
        frame.sessionId;


    const progress =
        (
            (frameIndex + 1) /
            frames.length
        ) * 100;


    transmissionProgress.textContent =
        `${progress.toFixed(1)}%`;


    qrStatus.textContent =
        `Frame ${frame.frameId} displayed ✓`;


    console.log(
        "Displaying frame:",
        frame.frameId,
        "/",
        frame.totalFrames
    );
}


// ============================================
// START SEQUENTIAL QR TRANSMISSION
// ============================================

async function startQRTransmission() {

    if (
        transmissionRunning ||
        frames.length === 0
    ) {

        return;
    }


    transmissionRunning =
        true;

    transmissionStartTime =
        performance.now();


    currentFrameIndex = 0;


    startTransmission.disabled =
        true;

    stopTransmission.disabled =
        false;

    fpsSelect.disabled =
        true;


    transmissionStatus.textContent =
        "Transmitting...";


    console.log(
        "================================"
    );

    console.log(
        "QR TRANSMISSION STARTED"
    );

    console.log(
        "FPS:",
        fpsSelect.value
    );

    console.log(
        "Total frames:",
        frames.length
    );

    console.log(
        "================================"
    );


    while (
        transmissionRunning &&
        currentFrameIndex < frames.length
    ) {

        const frameStartTime =
            performance.now();


        await displayFrame(
            currentFrameIndex
        );


        if (!transmissionRunning) {
            break;
        }


        currentFrameIndex++;


        updateElapsedTime();


        // ------------------------------------
        // Calculate frame interval
        // ------------------------------------

        const fps =
            Number(
                fpsSelect.value
            );


        const frameInterval =
            1000 / fps;


        const processingTime =
            performance.now() -
            frameStartTime;


        const remainingDelay =
            Math.max(
                0,
                frameInterval -
                processingTime
            );


        if (
            currentFrameIndex <
            frames.length
        ) {

            await sleep(
                remainingDelay
            );
        }
    }


    // ========================================
    // TRANSMISSION FINISHED
    // ========================================

    if (
        transmissionRunning &&
        currentFrameIndex >= frames.length
    ) {

        transmissionRunning =
            false;


        updateElapsedTime();


        transmissionProgress.textContent =
            "100%";


        currentFrame.textContent =
            frames.length - 1;


        transmissionStatus.textContent =
            "Transmission complete ✓";


        qrStatus.textContent =
            "All frames transmitted ✓";


        console.log(
            "================================"
        );

        console.log(
            "QR TRANSMISSION COMPLETE"
        );

        console.log(
            "Total frames:",
            frames.length
        );

        console.log(
            "Elapsed time:",
            elapsedTime.textContent
        );

        console.log(
            "================================"
        );
    }


    startTransmission.disabled =
        false;

    stopTransmission.disabled =
        true;

    fpsSelect.disabled =
        false;
}


// ============================================
// STOP TRANSMISSION
// ============================================

function stopQRTransmission() {

    if (!transmissionRunning) {

        startTransmission.disabled =
            frames.length === 0;

        stopTransmission.disabled =
            true;

        fpsSelect.disabled =
            false;

        return;
    }


    transmissionRunning =
        false;


    startTransmission.disabled =
        false;

    stopTransmission.disabled =
        true;

    fpsSelect.disabled =
        false;


    transmissionStatus.textContent =
        "Transmission stopped";


    qrStatus.textContent =
        `Stopped at frame ${currentFrameIndex}`;


    console.log(
        "QR transmission stopped."
    );
}


// ============================================
// UPDATE ELAPSED TIME
// ============================================

function updateElapsedTime() {

    if (!transmissionStartTime) {
        return;
    }


    const elapsed =
        (
            performance.now() -
            transmissionStartTime
        ) / 1000;


    elapsedTime.textContent =
        `${elapsed.toFixed(2)} s`;
}


// ============================================
// SLEEP / DELAY
// ============================================

function sleep(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
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