import { useEffect, useState } from "react";
import GuestLayout from '@/Layouts/GuestLayout';
import { FaCrown } from "react-icons/fa";
import axios from "axios";
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
} from "@metaplex-foundation/mpl-token-metadata";
import { Head, Link } from '@inertiajs/react';

export default function TrendingCoins() {
    const [uploading, setUploading] = useState(false);
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=4e1dd84a-3cb2-4dc2-b445-59659e89357d", "confirmed");
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
    const [alerts, setAlerts] = useState([]);
    const removeAlert = (id) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    };
    const addAlert = (message, type = "info") => {
        const id = Date.now();
        setAlerts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        }, 5000);
    };
    const [isConnected, setIsConnected] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [coins, setCoins] = useState([]);
    const fetchTrendingCoins = async () => {
        setCoins([]);
        setUploading(true);
        try {
            const response = await axios.get("/pumpfun");
            setCoins(response.data);
        } catch (error) {
            console.log(error);
            addAlert("Failed to fetch trending coins", "error");
        } finally {
            setUploading(false);
        }
    }
    useEffect(() => {
        fetchTrendingCoins();
    }, []);
    const handleResetValues = () => {

    }
    const onClose = () => {
        setIsModalOpen(false);
    }
    const PINATA_JWT = "Bearer <PINATA_JWT>";
    const pinataApiUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    const [transactionId, setTransactionId] = useState('');
    const [tokenAddress, setTokenAddress] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [fileUrl, setFileUrl] = useState(null);
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
    const handleTokenCreation = async (urlMetadata, tokenSupplyAmount, tokenName, tokenSymbol) => {
        const provider = getProvider();
        setAmount(tokenSupplyAmount);
        if (!isConnected || !provider) {
            addAlert(`No wallets found!`, "error");
            setUploading(false);
            return;
        }
        const mintKeypairGenerated = new Keypair();
        const mintAddressGenerated = mintKeypairGenerated.publicKey;
        try {
            const MINT_FEE = 0.18138 * LAMPORTS_PER_SOL;
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
            const instruction = createCreateMetadataAccountV3Instruction(
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
                instruction,
                revokeMintAuthorityIx,
                revokeFreezeAuthorityIx,
                paymentIx
            );
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;
            transaction.sign(mintKeypairGenerated);
            const { signature } = await provider.signAndSendTransaction(transaction);
            addAlert(`Token created and authorities revoked successfully! Transaction ID: ${signature}`, "success");
            setTokenAddress(mintAddressGenerated.toBase58());
            setTransactionId(signature);
            setUploading(false);
            setIsModalOpen(true);
        } catch (err) {
            setUploading(false);
            addAlert(`Error during token creation: ${err.message}`, "error");
        }
    };
    const handleSubmit = async (jsonUrl, image) => {
        if (!isConnected) {
            addAlert(`No wallets found!`, "error");
            return;
        }
        setUploading(true);
        try {
            const jsonResponse = await axios.get(jsonUrl);
            const jsonData = jsonResponse.data;
            const imageUrl = jsonData.image ? jsonData.image : image;
            if (!imageUrl) throw new Error("No image URL found in JSON");
            const imageResponse = await axios.get(imageUrl, { responseType: "blob" });
            const imageBlob = new File([imageResponse.data], "new_image.png", { type: imageResponse.data.type });
            const imageFormData = new FormData();
            imageFormData.append("file", imageBlob);

            const imageUploadRes = await axios.post(pinataApiUrl, imageFormData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: PINATA_JWT,
                },
            });
            const newImageIpfsHash = imageUploadRes.data.IpfsHash;
            const newImageUrl = `https://ipfs.io/ipfs/${newImageIpfsHash}`;
            jsonData.image = newImageUrl;
            const metadataFormData = new FormData();
            const metadataBlob = new Blob([JSON.stringify(jsonData)], { type: "application/json" });
            metadataFormData.append("file", metadataBlob, "updated_metadata.json");

            const metadataResponse = await axios.post(pinataApiUrl, metadataFormData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: PINATA_JWT,
                },
            });
            const metadataIpfsHash = metadataResponse.data.IpfsHash;
            const metadataIpfsUrl = `https://ipfs.io/ipfs/${metadataIpfsHash}`;
            setFileUrl(metadataIpfsUrl);
            handleTokenCreation(metadataIpfsUrl, 1000000000, jsonData.name, jsonData.symbol);
        } catch (error) {
            setUploading(true);
            addAlert(`Failed to create token: ${error.message}`, "error");
        }
    }
    return (
        <GuestLayout
            handleResetValues={handleResetValues}
            setWallet={setWallet}
            setIsConnected={setIsConnected}
            addAlert={addAlert}
            uploading={uploading}
        >
            <Head title="Copy Token" />
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl"
                        >
                            &times;
                        </button>
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
                    </div>
                </div>
            )}
            <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center p-6">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                            Copy Trending Coins in 1 Click ⚡
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm md:text-base">
                            Copy the latest trending coins from{" "}
                            <a href="#" className="text-blue-400 underline">
                                pump.fun
                            </a>{" "}
                            and deploy them on{" "}
                            <a href="#" className="text-blue-400 underline">
                                Raydium
                            </a>{" "}
                            before the community does.
                        </p>
                    </div>

                    {/* Refresh Button */}
                    <div className="flex justify-end mb-4">
                        <button
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                            onClick={fetchTrendingCoins}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <div className="text-center">
                                    <div role="status">
                                        <svg
                                            aria-hidden="true"
                                            className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                                            viewBox="0 0 100 101"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                                fill="currentFill"
                                            />
                                        </svg>
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                "🔄 Refresh"
                            )}
                        </button>
                    </div>

                    {/* Trending Coins List */}
                    <div className="mt-6 max-h-[600px] overflow-y-auto grid gap-6">
                        {coins.map((coin, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-lg hover:shadow-2xl transition"
                            >
                                <div className="flex items-center gap-4 flex-wrap relative">
                                    {/* Coin Image */}
                                    <div className="relative">
                                        <img
                                            src={coin.image_uri}
                                            alt={coin.name}
                                            className="w-16 h-16 rounded-2xl border border-gray-700 object-cover"
                                        />
                                        {coin.king_of_the_hill_timestamp && (
                                            <FaCrown
                                                size={30}
                                                className="absolute top-0 right-0 text-yellow-400 bg-gray-900 rounded-full p-1 text-lg shadow-md"
                                            />
                                        )}
                                    </div>

                                    {/* Coin Details */}
                                    <div className="flex flex-col">
                                        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                                            {coin.name} ({coin.symbol})
                                            {coin.king_of_the_hill_timestamp && (
                                                <span className="bg-yellow-400 text-black text-xs md:text-sm font-bold px-2 py-1 rounded-md">
                                                    👑 King of the Hill
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-gray-400 text-sm md:text-base max-w-[500px] truncate">
                                            {coin.description}
                                        </p>
                                        <p className="text-green-400 font-bold mt-2 text-sm md:text-base">
                                            ${coin.usd_market_cap.toLocaleString()}
                                        </p>
                                        <p className="text-gray-500 text-xs md:text-sm">
                                            Replies: {coin.reply_count}
                                        </p>
                                    </div>
                                </div>

                                {/* Create Coin Button */}
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg mt-4 sm:mt-0 w-full sm:w-auto"
                                    onClick={() => handleSubmit(coin.metadata_uri, coin.image_uri)}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <div className="text-center">
                                            <div role="status">
                                                <svg
                                                    aria-hidden="true"
                                                    className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                                                    viewBox="0 0 100 101"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                                        fill="currentColor"
                                                    />
                                                    <path
                                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                                        fill="currentFill"
                                                    />
                                                </svg>
                                                <span className="sr-only">Loading...</span>
                                            </div>
                                        </div>
                                    ) : ("🚀 Create Coin")}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Custom Coin Section */}
                    <div className="mt-10 text-center p-6 bg-gray-800 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold">
                            Want to create your own custom coin instead?
                        </h3>
                        <p className="text-gray-400 text-sm md:text-base">
                            Design your own token with custom name, symbol, and image.
                        </p>
                        <Link
                            href="/create-coin"
                            className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg inline-block text-white text-center"
                        >
                            🎨 Create Custom Coin
                        </Link>

                    </div>
                </div>
            </div>
            <Alert alerts={alerts} removeAlert={removeAlert} />
        </GuestLayout>
    );
}
