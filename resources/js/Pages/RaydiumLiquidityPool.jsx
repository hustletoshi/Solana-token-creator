import { useEffect, useState } from "react";
import GuestLayout from '@/Layouts/GuestLayout';
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
    CREATE_CPMM_POOL_PROGRAM,
    CREATE_CPMM_POOL_FEE_ACC,
    Raydium,
    TxVersion,
} from '@raydium-io/raydium-sdk';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from 'bn.js';

const QUOTE_TOKEN = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL
const CPMM_PROGRAM_ID = CREATE_CPMM_POOL_PROGRAM;

const DEFAULT_FEE_CONFIG = {
    id: "D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2",
    index: 0,
    protocolFeeRate: 1200,
    tradeFeeRate: 2500,
    fundFeeRate: 40000,
    createPoolFee: "150000000"
};

export default function RaydiumLiquidityPool() {
    const [isConnected, setIsConnected] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [raydium, setRaydium] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState("");
    const [amountTokenA, setAmountTokenA] = useState("");
    const [amountTokenB, setAmountTokenB] = useState("");
    const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

    const [alerts, setAlerts] = useState([]);
    const removeAlert = (id) => setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    const addAlert = (message, type = "info") => {
        const id = Date.now();
        setAlerts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setAlerts((prev) => prev.filter((alert) => alert.id !== id)), 5000);
    };
    useEffect(() => {
        if (wallet) {
          fetchTokens();
        }
    }, [wallet]);
    const Alert = ({ alerts, removeAlert }) => (
        <div className="fixed top-5 right-5 z-50 space-y-2">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`px-4 py-3 rounded-lg shadow-lg flex justify-between items-center max-w-sm
                        ${alert.type === "success" ? "bg-green-100 border border-green-400 text-green-700" : ""}
                        ${alert.type === "error" ? "bg-red-100 border border-red-400 text-red-700" : ""}
                        ${alert.type === "warning" ? "bg-yellow-100 border border-yellow-400 text-yellow-700" : ""}
                        ${alert.type === "info" ? "bg-blue-100 border border-blue-400 text-blue-700" : ""}`}
                >
                    <span className="overflow-hidden break-all">{alert.message}</span>
                    <button onClick={() => removeAlert(alert.id)} className="ml-4 text-lg">✖</button>
                </div>
            ))}
        </div>
    );

    const initSdk = async () => {
        if (raydium) return raydium;
        if (!wallet || !wallet.publicKey) {
            addAlert("Wallet not connected or invalid", "warning");
            console.log("Wallet invalid:", wallet);
            return null;
        }

        try {
            console.log("Initializing SDK with wallet publicKey:", wallet.publicKey.toBase58());
            const sdk = await Raydium.load({
                owner: wallet.publicKey, // Use publicKey only
                connection,
                cluster: "mainnet",
                disableFeatureCheck: true,
                disableLoadToken: true,
                blockhashCommitment: "finalized",
            });
            console.log("SDK initialized:", sdk);
            setRaydium(sdk);
            addAlert("Raydium SDK initialized", "success");
            return sdk;
        } catch (error) {
            console.error("SDK initialization failed:", error);
            addAlert(`Failed to initialize Raydium SDK: ${error.message}`, "error");
            return null;
        }
    };
    const fetchTokens = async () => {
        if (!wallet) {
            addAlert("Wallet not connected", "error");
            return;
        }

        try {
            const walletPublicKey = new PublicKey(wallet.publicKey);
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
                programId: TOKEN_PROGRAM_ID
            });
            const tokensList = tokenAccounts.value.map((account) => {
                const tokenMint = account.account.data.parsed.info.mint;
                return tokenMint;
            });

            setTokens(tokensList.length ? tokensList : ["No tokens found"]);
        } catch (error) {
            console.error("Error fetching tokens:", error);
            addAlert("Failed to fetch tokens", "error");
        }
    };
    const createPool = async () => {
        const MINT_TOKEN = new PublicKey(selectedToken);
        if (!wallet || !isConnected || !wallet.publicKey) {
            addAlert("Please connect your wallet first", "warning");
            return;
        }
        if (!amountTokenA || !amountTokenB) {
            addAlert("Please enter amounts for both tokens", "warning");
            return;
        }
        setUploading(true);
        try {
            const raydiumInstance = raydium || (await initSdk());
            if (!raydiumInstance) throw new Error("Raydium SDK not initialized");

            const mintA = {
                address: MINT_TOKEN.toBase58(),
                programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                decimals: 6,
            };
            const mintB = {
                address: QUOTE_TOKEN.toBase58(),
                programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                decimals: 9,
            };
            const tokenAAmountBN = new BN(Number(amountTokenA) * Math.pow(10, mintA.decimals));
            const tokenBAmountBN = new BN(Number(amountTokenB) * Math.pow(10, mintB.decimals));
            const { execute, transaction } = await raydiumInstance.cpmm.createPool({
                programId: CPMM_PROGRAM_ID,
                poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
                mintA,
                mintB,
                mintAAmount: tokenAAmountBN,
                mintBAmount: tokenBAmountBN,
                startTime: new BN(Math.floor(Date.now() / 1000)),
                feeConfig: DEFAULT_FEE_CONFIG,
                associatedOnly: true,
                ownerInfo: {
                    useSOLBalance: true,
                    feePayer: wallet.publicKey,
                },
                txVersion: TxVersion.V0,
            });
            const signedTx = await wallet.signTransaction(transaction);
            const txId = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: false,
                preflightCommitment: "confirmed",
            });
            await connection.confirmTransaction({
                signature: txId,
                blockhash: transaction.recentBlockhash,
                lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
            });
            addAlert(`CP-Swap pool created successfully! TxID: ${txId}`, "success");
        } catch (error) {
            if (error instanceof Error && error.message.includes("Simulation failed")) {
                const logs = error.logs || [];
                addAlert(`Error creating pool: Simulation failed. Logs: ${logs.join("\n")}`, "error");
            } else {
                addAlert(`Error creating pool: ${error.message}`, "error");
            }
        } finally {
            setUploading(false);
        }
    };

    const refreshPools = async () => {
        console.log("Refreshing pools...");
    };

    const addCustomPool = () => {

    };
    useEffect(() => {
        console.log("Wallet state updated:", wallet);
        if (wallet && isConnected) initSdk();
    }, [wallet, isConnected]);

    const handleResetValues = () => {};

    return (
        <GuestLayout
            handleResetValues={handleResetValues}
            setWallet={setWallet}
            setIsConnected={setIsConnected}
            addAlert={addAlert}
            uploading={uploading}
        >
            <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center py-10">
                <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Create Raydium Liquidity Pool</h2>
                        <label className="block text-sm mb-2">For which token would you like to create a pool?</label>

                        <select
                            className="w-full p-2 bg-gray-700 text-white rounded-md"
                            value={selectedToken}
                            onChange={(e) => setSelectedToken(e.target.value)}
                        >
                            <option value="">Choose your token</option>
                            {tokens.map((token, index) => (
                            <option key={index} value={token}>{token}</option>
                            ))}
                        </select>

                        {selectedToken && (
                            <>
                                <div className="mb-4 flex flex-col space-y-2">
                                    <label htmlFor="amount" className="text-lg font-medium text-gray-700 text-white">
                                        Amount Token A
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                        placeholder="Amount"
                                        value={amountTokenA}
                                        min="0"
                                        max="1000000000"
                                        onChange={(e) => {
                                            let value = Number(e.target.value);
                                            if (value < 0) value = 0;
                                            if (value > 1000000000) value = 1000000000;
                                            setAmountTokenA(value);
                                        }}
                                    />
                                </div>
                                <div className="mb-4 flex flex-col space-y-2">
                                    <label htmlFor="amount" className="text-lg font-medium text-gray-700 text-white">
                                        Amount Token B
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-gray-800 text-white placeholder-gray-400"
                                        placeholder="Amount"
                                        value={amountTokenB}
                                        min="0.000000001"
                                        max="1000000000"
                                        onChange={(e) => {
                                            let value = Number(e.target.value);
                                            if (value < 0) value = 0;
                                            if (value > 1000000000) value = 1000000000;
                                            setAmountTokenB(value);
                                        }}
                                    />
                                </div>
                                <button
                                className="mt-4 w-full p-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
                                onClick={createPool}
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
                                    ) : ( "Create Pool")}
                                </button>
                            </>
                        )}
                </div>


            <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-semibold mb-2">Your Raydium Pools</h3>
                <p className="text-sm mb-4">You don't have any active Raydium pools with liquidity on this address.</p>
                <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                onClick={refreshPools}
                >
                Refresh
                </button>
            </div>

            <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-md mt-6">
                <label className="block text-sm mb-2">Can't find your pool? Add it manually:</label>
                <input
                type="text"
                className="w-full p-2 bg-gray-700 text-white rounded-md mb-2"
                placeholder="Enter pool creation transaction ID"
                onChange={(e) => setPoolId(e.target.value)}
                />
                <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                onClick={addCustomPool}
                >
                Add Custom Pool
                </button>
            </div>
            </div>
            <Alert alerts={alerts} removeAlert={removeAlert} />
        </GuestLayout>
    );
}