export async function generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptFile(file: File, key: CryptoKey): Promise<{ encryptedBlob: Blob, iv: Uint8Array }> {
    const fileBuffer = await file.arrayBuffer();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        fileBuffer
    );

    return {
        encryptedBlob: new Blob([encryptedContent]),
        iv
    };
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
}
