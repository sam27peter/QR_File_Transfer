function createSessionId() {

    const timestamp =
        Date.now().toString(36);

    const randomPart =
        crypto.randomUUID()
        .replace(/-/g, "")
        .slice(0, 8);

    return `${timestamp}-${randomPart}`;
}


function bytesToBase64(bytes) {

    let binary = "";

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        const chunk =
            bytes.subarray(
                i,
                i + chunkSize
            );

        binary += String.fromCharCode(
            ...chunk
        );
    }

    return btoa(binary);
}


function createDataFrame(
    sessionId,
    frameId,
    totalFrames,
    payload
) {

    return {
        version: 1,
        type: "DATA",
        sessionId: sessionId,
        frameId: frameId,
        totalFrames: totalFrames,
        payload: bytesToBase64(payload)
    };
}


function serializeFrame(frame) {

    return JSON.stringify(frame);
}


export {
    createSessionId,
    createDataFrame,
    serializeFrame
};