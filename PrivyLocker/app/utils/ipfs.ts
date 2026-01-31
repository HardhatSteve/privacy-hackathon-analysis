import axios from "axios";

export const uploadToPinata = async (fileBlob: Blob, name: string): Promise<string | null> => {
    const JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

    if (!JWT) {
        console.error("Pinata JWT is missing in .env");
        alert("Pinata JWT missing! Please add NEXT_PUBLIC_PINATA_JWT to your .env file.");
        return null;
    }

    const formData = new FormData();
    formData.append("file", fileBlob);

    const metadata = JSON.stringify({
        name: name,
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
        cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            maxBodyLength: Infinity,
            headers: {
                "Authorization": `Bearer ${JWT}`,
            },
        });
        return res.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading to Pinata:", error);
        alert("Upload to IPFS failed. Check console.");
        return null;
    }
};
