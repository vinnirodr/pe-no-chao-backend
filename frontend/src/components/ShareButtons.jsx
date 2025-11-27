import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

const ShareButtons = ({ assessment, inputText }) => {
    const [copied, setCopied] = useState(false);

    const shareText = `🚨 *Pé no Chão - Verificação*\n\n` +
        `🔍 *Status:* ${assessment}\n` +
        `📄 *Texto:* "${inputText.substring(0, 50)}${inputText.length > 50 ? '...' : ''}"\n\n` +
        `Verifique você também em: http://localhost:3000`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

    return (
        <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Compartilhar Resultado
            </h4>

            <div className="flex gap-3">
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                >
                    WhatsApp
                </a>

                <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                >
                    X (Twitter)
                </a>

                <button
                    onClick={handleCopy}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                </button>
            </div>
        </div>
    );
};

export default ShareButtons;
