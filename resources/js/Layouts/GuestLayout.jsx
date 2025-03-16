import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useEffect, useMemo, useState } from 'react';
import { FaCoins, FaWater, FaChartLine, FaBars, FaMoneyBillWave } from "react-icons/fa";
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Logo from "@/Assets/Images/logo-xlauncher.png";

export default function Guest({ children, handleResetValues, setWallet, setIsConnected, addAlert, uploading }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
    const ConnectButton = ({ setIsConnected, uploading, setWallet }) => {
        const { connected, select, connect, disconnect, wallets } = useWallet();
        useEffect(() => {
            setIsConnected(connected);
            if(connected){
                if (wallets.length > 0 && wallets[0].adapter) {
                    setWallet(wallets[0].adapter);
                }
            }
        }, [connected]);
        const handleConnect = async () => {
            if (!connected) {
                try {
                    if (wallets.length > 0) {
                        handleResetValues();
                        await select(wallets[0].adapter.name);
                        await connect();
                    } else {
                        handleResetValues();
                        addAlert(`No wallets found!`, "error");
                    }
                } catch (error) {
                    addAlert(`Wallet connection failed: ${error.message}`, "error");
                }
            } else {
                disconnect();
            }
        };

        return (
            <button onClick={handleConnect} disabled={uploading} className={`${uploading ? "bg-gray-600" : connected ? "bg-red-600" : "bg-blue-600"} px-4 py-2 rounded-lg relative`}>
                {uploading ? (
                    <div className="text-center">
                        <div role="status">
                            <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : connected ? "Disconnect Wallet" : "Connect Wallet"}
            </button>
        );
    };
    useEffect(() => {
        const calculateTimeLeft = () => {
          const now = new Date();
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);
          const difference = endOfDay - now;

          return {
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / (1000 * 60)) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
          setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);
    return (
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <div>
                    <header className="bg-gray-900 text-white py-4 px-6 flex items-center justify-between">
                        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                            <FaBars className="text-2xl" />
                        </button>
                        <div className="flex items-center gap-2">
                            <img src={Logo} alt="Logo" className="h-8 w-8" />
                            <h1 className="text-sm font-extrabold uppercase text-purple-500 relative z-10"
                                style={{ textShadow: "-0.5px -0.5px 0 #1E3A8A, 0.5px -0.5px 0 #1E3A8A, -0.5px 0.5px 0 #1E3A8A, 0.5px 0.5px 0 #1E3A8A" }}>
                            LAUNCH
                            </h1>
                            <h1 className="text-base font-extrabold uppercase text-blue-400 relative z-10"
                                style={{ textShadow: "-1px -1px 0 #1E3A8A, 1px -1px 0 #1E3A8A, -1px 1px 0 #1E3A8A, 1px 1px 0 #1E3A8A" }}>
                            XPRESS
                            </h1>
                        </div>
                        <nav className="hidden md:flex gap-6">
                            <Link href="/create-coin" className={`flex items-center gap-2 hover:text-gray-300 ${location.pathname === '/create-coin' ? 'text-blue-400' : ''}`}>
                                <FaCoins /> Create Coin
                            </Link>
                            <a href="https://raydium.io/liquidity-pools/" target='_blank' className="flex items-center gap-2 hover:text-gray-300">
                                <FaWater /> Create liquidity
                            </a>
                            <a href="https://raydium.io/portfolio/" target='_blank' className="flex items-center gap-2 hover:text-gray-300">
                                <FaMoneyBillWave /> Manage Liquidity
                            </a>
                            <Link href="/trending" className={`flex items-center gap-2 hover:text-gray-300 ${location.pathname === '/trending' ? 'text-blue-400' : ''}`}>
                                <FaChartLine /> Copy Trending Coins
                            </Link>
                            {/* <a href='#' onClick={(e)=>e.preventDefault()} className={`flex items-center gap-2 hover:text-gray-300 px-4 py-2 rounded-lg relative ${location.pathname === '/trending' ? 'text-blue-400' : ''}`}>
                                <FaChartLine /> Copy Trending Coins
                                <span className="absolute top-0 right-0 bg-red-500 text-[10px] text-white px-1 py-0.5 rounded-full -mt-2 -mr-1">
                                    Coming Soon
                                </span>
                            </a> */}
                        </nav>
                        {menuOpen && (
                            <div className={`absolute top-16 left-0 w-full bg-gray-800 p-4 flex flex-col items-center space-y-4 md:hidden`}>
                            <Link href="/create-coin" className={`flex items-center gap-2 hover:text-gray-300 ${location.pathname === '/create-coin' ? 'text-blue-400' : ''}`}>
                                <FaCoins /> Create Coin
                            </Link>
                            <a href="https://raydium.io/liquidity-pools/" target='_blank' className="flex items-center gap-2 hover:text-gray-300">
                                <FaWater /> Create liquidity
                            </a>
                            <a href="https://raydium.io/portfolio/" target='_blank' className="flex items-center gap-2 hover:text-gray-300">
                                <FaMoneyBillWave /> Manage Liquidity
                            </a>
                            <Link href="/trending" className={`flex items-center gap-2 hover:text-gray-300 ${location.pathname === '/trending' ? 'text-blue-400' : ''}`}>
                                <FaChartLine /> Copy Trending Coins
                            </Link>
                            </div>
                        )}
                        <ConnectButton setIsConnected={setIsConnected} uploading={uploading} setWallet={setWallet}/>
                    </header>
                    <div className="border-t border-gray-700"></div>
                    {/* <div className="bg-red-600 text-white text-center py-2 text-sm font-semibold">
                        Create your coin for only 0.1 SOL - Offer ends in: {`${timeLeft.hours}`.padStart(2, "0")} HRS : {`${timeLeft.minutes}`.padStart(2, "0")} MIN : {`${timeLeft.seconds}`.padStart(2, "0")} SEC
                    </div> */}
                    <div >
                        {children}
                    </div>
                    <div className="border-t border-gray-700"></div>

                    <footer className="bg-gray-900 text-white py-6 border-t border-gray-700">
                        <div className="max-w-5xl mx-auto px-6 text-center">
                            <p className="text-lg font-semibold text-purple-400">Welcome to Launch Xpress!</p>
                            <p className="text-sm text-gray-400 mt-2">
                                We offer a fully functional tool for creating tokens—because who doesn’t love bringing ideas to life? This is all about fun and creativity, not financial strategy.
                                We are not financial advisors, and we do not provide financial advice. The content and tools on our site are for entertainment purposes only and should not be interpreted
                                as investment guidance or a promise of profits. Our token creation tool works like a charm, but it’s up to you to decide what to do with it—just don’t treat it as a get-rich-quick scheme!
                                For serious financial moves, please consult a qualified professional. Enjoy crafting your tokens and having a good time—that’s what we’re here for!
                            </p>

                            {/* Divider */}
                            <div className="my-6 border-t border-gray-700"></div>

                            {/* Social Links */}
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                <a href="https://x.com/LaunchXpressFun/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                                    <span>🚀 Follow us on X</span>
                                </a>
                                <span className="text-gray-500 hidden md:block">|</span>
                                <a href="https://t.me/LaunchXpress" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 flex items-center gap-2">
                                    <span>💬 Join Our Telegram Group</span>
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>
            </WalletModalProvider>
        </WalletProvider>
    );
}
