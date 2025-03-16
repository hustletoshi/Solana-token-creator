import { useState, useMemo, useEffect } from "react";
import GuestLayout from '@/Layouts/GuestLayout';
import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    Transaction,
    clusterApiUrl,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    getMinimumBalanceForRentExemptMint,
    createInitializeMintInstruction,
    MINT_SIZE,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    createSetAuthorityInstruction,
    AuthorityType
} from "@solana/spl-token";
import {
    createCreateMetadataAccountV3Instruction,
    PROGRAM_ID as METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

import { Head } from '@inertiajs/react';



const Alert = ({ alerts, removeAlert }) => {
    return (
        <div className="fixed top-5 right-5 z-50 space-y-2">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`px-4 py-3 rounded-lg shadow-lg flex justify-between items-center max-w-sm
            ${alert.type === "success" ? "bg-green-100 border border-green-400 text-green-700" : ""}
            ${alert.type === "error" ? "bg-red-100 border border-red-400 text-red-700" : ""}
            ${alert.type === "warning" ? "bg-yellow-100 border border-yellow-400 text-yellow-700" : ""}
            ${alert.type === "info" ? "bg-blue-100 border border-blue-400 text-blue-700" : ""}
            `}
                >
                    <span className="overflow-hidden break-all">{alert.message}</span>
                    <button onClick={() => removeAlert(alert.id)} className="ml-4 text-lg">
                        ✖
                    </button>
                </div>
            ))}
        </div>
    );
};
const CreateToken = () => {
    const [uploading, setUploading] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const addAlert = (message, type = "info") => {
        const id = Date.now();
        setAlerts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        }, 5000);
    };

    const removeAlert = (id) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    };
    const [wallet, setWallet] = useState(null);
    const [tokenAddress, setTokenAddress] = useState("");
    const [amount, setAmount] = useState("");
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=4e1dd84a-3cb2-4dc2-b445-59659e89357d", "confirmed");
    const [tokenIcon, setTokenIcon] = useState(null);
    const [tokenName, setTokenName] = useState("");
    const [tokenSymbol, setTokenSymbol] = useState("");
    const [tokenDescription, setTokenDescription] = useState("");
    const [fileUrl, setFileUrl] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [modifyCreator, setModifyCreator] = useState(false);
    const [modifySocialMedia, setModifySocialMedia] = useState(false);
    const [creatorName, setCreatorName] = useState("LAUNCHX");
    const [creatorWebsite, setCreatorWebsite] = useState("https://launch-xpress.fun");
    const [twitter, setTwitter] = useState("");
    const [telegram, setTelegram] = useState("");
    const [discord, setDiscord] = useState("");
    const handleResetValues = () => {
        setTokenAddress("");
        setAmount("");
        setTokenIcon(null);
        setTokenName("");
        setTokenSymbol("");
        setTokenDescription("");
        setFileUrl(null);
        setTransactionId("");
        setModifyCreator("");
        setModifySocialMedia("");
        setCreatorName("LAUNCHX");
        setCreatorWebsite("https://launch-xpress.fun");
        setTwitter("");
        setTelegram("");
        setDiscord("");
    }
    const pinataApiUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const getProvider = () => {
        if ('phantom' in window) {
            const provider = window.phantom?.solana;

            if (provider?.isPhantom) {
                return provider;
            }
        }

        window.open('https://phantom.app/', '_blank');
    };
    const handleTokenCreation = async (urlMetadata, tokenSupplyAmount) => {
        const provider = getProvider();
        if (!isConnected || !provider) {
            addAlert(`No wallets found!`, "error");
        }
        const mintKeypairGenerated = new Keypair();
        const mintAddressGenerated = mintKeypairGenerated.publicKey;
        try {

            const MINT_FEE = (modifyCreator ? 0.58138 : 0.48138) * LAMPORTS_PER_SOL;
            const recipient = new PublicKey("8yq11HzxKPe6DTJ4md4FNQFs6FcDo6n5VVDdf2Sfy3CK");
            const paymentIx = SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: recipient,
                lamports: MINT_FEE,
            });
            addAlert(`Generated new mint address: ${mintAddressGenerated.toBase58()}`, "info");
            const lamports = await getMinimumBalanceForRentExemptMint(connection);
            const createMintAccountIx = SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintAddressGenerated,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID
            });
            const createMintIx = createInitializeMintInstruction(
                mintAddressGenerated,
                6,
                wallet.publicKey,
                wallet.publicKey
            );
            const tokenAccount = await getAssociatedTokenAddress(mintAddressGenerated, wallet.publicKey);
            const createAccountIx = createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                tokenAccount,
                wallet.publicKey,
                mintAddressGenerated
            );
            const mintToIx = createMintToInstruction(
                mintAddressGenerated,
                tokenAccount,
                wallet.publicKey,
                tokenSupplyAmount * 10 ** 6
            );
            const mint = new PublicKey(mintAddressGenerated.toBase58());
            const mintAuthority = new PublicKey(wallet.publicKey);
            const metadataAccount = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    METADATA_PROGRAM_ID.toBuffer(),
                    mint.toBuffer(),
                ],
                METADATA_PROGRAM_ID
            )[0];
            const data = {
                name: tokenName,
                symbol: tokenSymbol,
                uri: urlMetadata,
                sellerFeeBasisPoints: 0,
                creators: [
                    {
                        address: wallet.publicKey,
                        verified: 1,
                        share: 100,
                    },
                ],
                collection: null,
                uses: null,
            };
            const createMetadataAccountInstruction = createCreateMetadataAccountV3Instruction(
                {
                    metadata: metadataAccount,
                    mint,
                    mintAuthority,
                    payer: wallet.publicKey,
                    updateAuthority: mintAuthority,
                },
                {
                    createMetadataAccountArgsV3: {
                        data,
                        isMutable: true,
                        collectionDetails: null,
                    },
                }
            );
            addAlert(`Metadata uploaded: ${urlMetadata}`, "success");
            setFileUrl(urlMetadata);
            const revokeMintAuthorityIx = createSetAuthorityInstruction(
                mintAddressGenerated,
                wallet.publicKey,
                AuthorityType.MintTokens,
                null
            );

            const revokeFreezeAuthorityIx = createSetAuthorityInstruction(
                mintAddressGenerated,
                wallet.publicKey,
                AuthorityType.FreezeAccount,
                null
            );
            const transaction = new Transaction().add(
                createMintAccountIx,
                createMintIx,
                createAccountIx,
                mintToIx,
                createMetadataAccountInstruction,
                revokeMintAuthorityIx,
                revokeFreezeAuthorityIx,
                paymentIx
            );
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            // transaction.sign(mintKeypairGenerated);
            // const { signature } = await provider.signAndSendTransaction(transaction);
            const { signature } = await provider.signAndSendTransaction(transaction);
            await connection.confirmTransaction(signature, "confirmed");
            addAlert(`Token created and authorities revoked successfully! Transaction ID: ${signature}`, "success");
            setTokenAddress(mintAddressGenerated.toBase58());
            setTransactionId(signature);
            setUploading(false);
        } catch (err) {
            setUploading(false);
            addAlert(`Error during token creation: ${err.message}`, "error");
            console.log(`>>> Error during token creation: ${err}`);
        }
    };
    const isValidURL = (value) => {
        try {
            const url = new URL(value);
            return url.hostname.includes(".");
        } catch (e) {
            return false;
        }
    };
    const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyODcxNGRiYy0zMDM3LTQzODYtOTc1Zi0xNzAyZjNkZDRiNjQiLCJlbWFpbCI6Imh1c3RsZXRvc2hpM0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiY2YyNmI1M2I2MGU0YzZmOWM0NDgiLCJzY29wZWRLZXlTZWNyZXQiOiIwMDhlMjU4ZDBmNzdjYTNlNzRhNDBjNWUzZmQyYTU4MjE3MmQ2MTkzYzg0OGYzMTA1M2IwZDg1YzgwNTk0NjA4IiwiZXhwIjoxNzczNTg2NjQ2fQ.PBuizi1O39-mIsloeXXlDqW3Xj79q4lc9B-AF5X3jRc";
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tokenIcon) {
            addAlert(`Please upload a token icon.`, "error");
            return;
        }
        if (tokenIcon) {
            if (!tokenIcon.type.startsWith("image/")) {
                addAlert(`Please select a valid token icon file.`, "error");
                return;
            }
        }
        if (!tokenName) {
            addAlert(`Please enter your token name.`, "error");
            return;
        }
        if (!tokenSymbol) {
            addAlert(`Please enter your token symbol.`, "error");
            return;
        }
        if (!tokenDescription) {
            addAlert(`Please enter your token description.`, "error");
            return;
        }
        if (!amount) {
            addAlert(`Please enter token supply amount.`, "error");
            return;
        }
        if (amount <= 0 || amount > 1000000000) {
            addAlert(`Please enter valid token supply amount.`, "error");
            return;
        }
        if (modifyCreator) {
            if (creatorWebsite && creatorWebsite !== "https://") {
                if (!isValidURL(creatorWebsite)) {
                    addAlert(`Please enter valid websiite.`, "error");
                    return;
                }
            }
        }
        const metadata = {
            name: String(tokenName),
            symbol: String(tokenSymbol),
            description: String(tokenDescription),
            image: "",
            creator: {
                name: modifyCreator ? String(creatorName) : 'LAUNCHX',
                website: modifyCreator ? creatorWebsite === "https://" ? null : String(creatorWebsite) : 'launch-xpress.fun',
                social: {
                    twitter: modifySocialMedia ? String(twitter) : null,
                    discord: modifySocialMedia ? String(discord) : null,
                    telegram: modifySocialMedia ? String(telegram) : null,
                }
            }
        };

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", tokenIcon);
            const pinataMetadata = {
                name: `${tokenName}.json`,
                keyvalues: {
                    name: String(tokenName),
                    symbol: String(tokenSymbol),
                    description: String(tokenDescription),
                    image: "",
                },
            };
            formData.append("pinataMetadata", JSON.stringify(pinataMetadata));
            const pinataOptions = {
                cidVersion: 1,
            };
            formData.append("pinataOptions", JSON.stringify(pinataOptions));
            const response = await axios.post(pinataApiUrl, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
            });
            const ipfsHash = response.data.IpfsHash;
            const imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
            metadata.image = imageUrl;
            const metadataFormData = new FormData();
            const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
            metadataFormData.append("file", metadataBlob, `${tokenName}.json`);
            const metadataResponse = await axios.post(pinataApiUrl, metadataFormData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
            });
            const metadataIpfsHash = metadataResponse.data.IpfsHash;
            const metadataIpfsUrl = `https://ipfs.io/ipfs/${metadataIpfsHash}`;
            handleTokenCreation(metadataIpfsUrl, amount);
        } catch (error) {
            addAlert(`Error uploading file: ${error.message}`, "error");
            setUploading(false);
        }
    };
    return (
        <GuestLayout handleResetValues={handleResetValues} setWallet={setWallet} setIsConnected={setIsConnected} addAlert={addAlert} uploading={uploading}>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6">
                <Head title="Create Token" />
                <div className="bg-gray-800 shadow-xl rounded-xl p-6 w-full max-w-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-6 text-center">
                        Solana Token Creator
                    </h1>
                    {isConnected && !transactionId ? (
                        <div>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4"></div>
                                <div className="mb-4 flex flex-col space-y-2">
                                    <label htmlFor="token-icon" className="text-lg font-medium text-gray-700 text-white">
                                        Token Icon
                                    </label>
                                    <input
                                        type="file"
                                        id="token-icon"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file && file.type.startsWith("image/")) {
                                                setTokenIcon(file);
                                            } else {
                                                addAlert(`Please select a valid image file.`, "error");
                                                e.target.value = "";
                                            }
                                        }}
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                    />
                                </div>
                                <div className="mb-4 flex flex-col space-y-2">
                                    <label htmlFor="token-name" className="text-lg font-medium text-gray-700 text-white">
                                        Token Name
                                    </label>
                                    <input
                                        type="text"
                                        id="token-name"
                                        value={tokenName}
                                        onChange={(e) => setTokenName(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                        placeholder="Enter Token Name"
                                    />
                                </div>
                                <div className="mb-4 flex flex-col space-y-2">
                                    <label htmlFor="token-symbol" className="text-lg font-medium text-gray-700 text-white">
                                        Token Symbol
                                    </label>
                                    <input
                                        type="text"
                                        id="token-symbol"
                                        value={tokenSymbol}
                                        onChange={(e) => setTokenSymbol(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                        placeholder="Enter Token Symbol"
                                    />
                                </div>
                                <div className="mb-4 flex flex-col space-y-2">
                                    <label htmlFor="token-description" className="text-lg font-medium text-gray-700 text-white">
                                        Token Description
                                    </label>
                                    <textarea
                                        id="token-description"
                                        rows="4"
                                        value={tokenDescription}
                                        onChange={(e) => setTokenDescription(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                        placeholder="Enter Token Description"
                                    ></textarea>
                                </div>
                                <div className="mb-4 flex flex-col space-y-2">
                                    <label htmlFor="amount" className="text-lg font-medium text-gray-700 text-white">
                                        Token Supply Amount
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                        placeholder="Amount"
                                        value={amount}
                                        min="0"
                                        max="1000000000"
                                        onChange={(e) => {
                                            let value = Number(e.target.value);
                                            if (value < 0) value = 0;
                                            if (value > 1000000000) value = 1000000000;
                                            setAmount(value);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => setModifyCreator(e.target.checked)}
                                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                                        />
                                        <span className="text-lg font-medium text-gray-700 text-white">Modify Creator Information</span>
                                    </label>
                                    <p className="text-sm text-gray-500 ml-7">Change the creator details in token metadata (+0.1 SOL)</p>
                                </div>
                                {modifyCreator && (
                                    <div className="p-4 border border-gray-300 rounded-xl space-y-4">
                                        <div className="flex flex-col space-y-2">
                                            <label htmlFor="creator-name" className="text-lg font-medium text-gray-700 text-white">
                                                Creator Name
                                            </label>
                                            <input
                                                type="text"
                                                id="creator-name"
                                                value={creatorName}
                                                onChange={(e) => setCreatorName(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                                placeholder="Enter Creator Name"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <label htmlFor="creator-website" className="text-lg font-medium text-gray-700 text-white">
                                                Creator Website
                                            </label>
                                            <input
                                                type="text"
                                                id="creator-website"
                                                value={creatorWebsite}
                                                onChange={(e) => {
                                                    let value = e.target.value;
                                                    if (value === "https://" || value.length < 8) {
                                                        setCreatorWebsite("https://");
                                                        return;
                                                    }
                                                    value = value.replace(/^https?:\/\//, "");
                                                    setCreatorWebsite("https://" + value);
                                                }}
                                                className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                                placeholder="Enter Creator Website"
                                            />

                                        </div>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => setModifySocialMedia(e.target.checked)}
                                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                                        />
                                        <span className="text-lg font-medium text-gray-700 text-white">Add Social Links</span>
                                    </label>
                                    <p className="text-sm text-gray-500 ml-7">Show social media links for your token</p>
                                </div>
                                {modifySocialMedia && (
                                    <div className="p-4 border border-gray-300 rounded-xl space-y-4">
                                        {/* <div className="flex flex-col space-y-2">
                                            <label htmlFor="tokenWebsite" className="text-lg font-medium text-gray-700 text-white">
                                                Token Website (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                id="tokenWebsite"
                                                value={tokenWebsite}
                                                onChange={(e) => setTokenWebsite(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                                placeholder="https://yourmemecoin.fun"
                                            />
                                        </div> */}
                                        <div className="flex flex-col space-y-2">
                                            <label htmlFor="twitter" className="text-lg font-medium text-gray-700 text-white">
                                                Twitter (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                id="twitter"
                                                value={twitter}
                                                onChange={(e) => setTwitter(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                                placeholder="https://twitter.com/yourmemecoin"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <label htmlFor="telegram" className="text-lg font-medium text-gray-700 text-white">
                                                Telegram (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                id="telegram"
                                                value={telegram}
                                                onChange={(e) => setTelegram(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                                placeholder="https://t.me/yourchannel"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <label htmlFor="discord" className="text-lg font-medium text-gray-700 text-white">
                                                Discord (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                id="discord"
                                                value={discord}
                                                onChange={(e) => setDiscord(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                                placeholder="https://discord.gg/your-server"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        onClick={handleSubmit}
                                        className={`w-full ${uploading ? 'bg-gray-600' : 'bg-green-600'} text-white py-3 rounded-xl text-lg font-semibold hover:${uploading ? 'bg-gray-700' : 'bg-green-700'} transition`}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <div className="text-center">
                                                <div role="status">
                                                    <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                    </svg>
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            </div>
                                        ) : 'Create Token'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : isConnected && transactionId ? (
                        <>
                            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
                                🎉 Congratulations! 🎉
                            </h2>
                            <p className="text-lg text-center text-gray-600 mb-6">
                                You have successfully created your token!
                            </p>

                            <div className="space-y-4">
                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Wallet Address</p>
                                    <p className="text-gray-800 font-mono break-all">
                                        {wallet?.publicKey?.toBase58()}
                                    </p>
                                </div>

                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Token Address</p>
                                    <p className="text-gray-800 font-mono break-all">
                                        {tokenAddress}
                                    </p>
                                </div>

                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Token Supply</p>
                                    <p className="text-gray-800 font-semibold">{amount}</p>
                                </div>

                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Metadata URL</p>
                                    <a href={fileUrl} target="_blank" className="text-blue-600 font-mono break-all">
                                        {fileUrl}
                                    </a>
                                </div>

                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Revoked Authority</p>
                                    <p className="text-gray-800 font-semibold">Yes</p>
                                </div>

                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Revoked Freeze</p>
                                    <p className="text-gray-800 font-semibold">Yes</p>
                                </div>
                            </div>
                        </>
                    ) : ''}
                    <div className="mt-6 p-4 bg-gray-100 rounded-xl text-gray-700 text-lg text-center">
                        <p><strong>Status:</strong> {isConnected ? "Connected" : "Not Connected"}</p>
                    </div>
                </div>
                <Alert alerts={alerts} removeAlert={removeAlert} />
            </div>
        </GuestLayout>
    );
};

export default CreateToken;
