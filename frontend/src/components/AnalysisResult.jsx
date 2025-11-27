import React from 'react';
import useAnalysisStore from '../store/useAnalysisStore';
import { CheckCircle, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import ShareButtons from './ShareButtons';

const AnalysisResult = () => {
    const { result, status, error } = useAnalysisStore();

    if (status === 'error') {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
                <XCircle className="w-5 h-5" />
                <p>{error}</p>
            </div>
        );
    }

    if (status !== 'completed' || !result) return null;

    const getStatusColor = (assessment) => {
        if (assessment.includes('CONFIÁVEL')) return 'bg-green-100 text-green-800 border-green-200';
        if (assessment.includes('SUSPEITO')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    const getStatusIcon = (assessment) => {
        if (assessment.includes('CONFIÁVEL')) return <CheckCircle className="w-6 h-6" />;
        if (assessment.includes('SUSPEITO')) return <AlertTriangle className="w-6 h-6" />;
        return <XCircle className="w-6 h-6" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className={`p-6 rounded-xl border flex items-start gap-4 ${getStatusColor(result.assessment)}`}>
                <div className="mt-1">{getStatusIcon(result.assessment)}</div>
                <div>
                    <h3 className="text-xl font-bold mb-1">{result.assessment}</h3>
                    <p className="opacity-90">
                        {result.assessment.includes('SUSPEITO')
                            ? 'A lógica do texto apresenta falhas ou as premissas não puderam ser verificadas.'
                            : 'O texto apresenta uma estrutura lógica válida e premissas verificadas.'}
                    </p>
                </div>
            </div>

            {/* Logic Analysis */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 p-1 rounded">🧠</span> Análise Lógica
                </h3>

                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-semibold">Conclusão Identificada</p>
                        <p className="font-medium text-gray-900">"{result.nlp.conclusion ? result.nlp.conclusion.text : 'Não identificada'}"</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex-1 h-2 rounded-full ${result.logic.isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`font-medium ${result.logic.isValid ? 'text-green-600' : 'text-red-600'}`}>
                            {result.logic.isValid ? 'Estrutura Válida' : 'Salto Lógico Detectado'}
                        </span>
                    </div>

                    {!result.logic.isValid && (
                        <p className="text-sm text-gray-600">
                            As premissas apresentadas não garantem necessariamente que a conclusão seja verdadeira.
                        </p>
                    )}
                </div>
            </div>

            {/* Fact Check */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 p-1 rounded">🔎</span> Verificação de Fatos
                </h3>

                <div className="space-y-3">
                    {result.fact_check.map((fact, idx) => (
                        <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-gray-900">"{fact.premise_text}"</p>
                                {fact.verified ? (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Verificado
                                    </span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                                        Não verificado
                                    </span>
                                )}
                            </div>

                            {fact.sources && fact.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs text-gray-500 mb-2">Fontes encontradas:</p>
                                    <div className="space-y-2">
                                        {fact.sources.map((source, sIdx) => (
                                            <a
                                                key={sIdx}
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                {source.name}: {source.data}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <ShareButtons assessment={result.assessment} inputText={result.input} />
        </div>
    );
};

export default AnalysisResult;
