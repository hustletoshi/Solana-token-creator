import { useState } from "react";

const TokenSelect = ({ tokens, selectedToken, setSelectedToken }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-full">
            {/* Display Selected Token */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
            >
                {selectedToken ? (
                    <div className="flex items-center gap-3">
                        <img
                            src={selectedToken.image || "https://via.placeholder.com/30"}
                            alt={selectedToken.name}
                            className="w-6 h-6 rounded-full"
                        />
                        <span>{selectedToken.name} ({selectedToken.symbol})</span>
                        <span className="ml-auto text-gray-400 text-sm">{selectedToken.amount} Tokens</span>
                    </div>
                ) : (
                    <span className="text-gray-400">Choose your token</span>
                )}
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
            {isOpen && (
                <ul className="absolute w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                    {tokens.length > 0 ? (
                        tokens.map((token, index) => (
                            <li
                                key={index}
                                onClick={() => {
                                    setSelectedToken(token);
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer transition"
                            >
                                <img
                                    src={token.image || "https://via.placeholder.com/30"}
                                    alt={token.name}
                                    className="w-6 h-6 rounded-full"
                                />
                                <span>{token.name} ({token.symbol})</span>
                                <span className="ml-auto text-gray-400 text-sm">{token.amount} Tokens</span>
                            </li>
                        ))
                    ) : (
                        <li className="p-3 text-gray-400">No tokens found</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default TokenSelect;
