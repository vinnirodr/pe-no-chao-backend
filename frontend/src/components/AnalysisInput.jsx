import React from 'react';
import useAnalysisStore from '../store/useAnalysisStore';
import { Send, Loader2 } from 'lucide-react';

const AnalysisInput = () => {
    const { inputText, setInputText, analyzeText, status } = useAnalysisStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputText.trim().length >= 10) {
            analyzeText(inputText);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Verificar Informação</h2>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <textarea
                        className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-gray-700 placeholder-gray-400"
                        placeholder="Cole aqui a notícia ou texto que você quer verificar (mínimo 10 caracteres)..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={status === 'analyzing'}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {inputText.length} caracteres
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={status === 'analyzing' || inputText.length < 10}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {status === 'analyzing' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Analisar
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AnalysisInput;
