import React, { useEffect } from 'react';
import useAnalysisStore from '../store/useAnalysisStore';
import { Clock, Activity, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
    const { publicHistory, stats, fetchHistory, fetchStats } = useAnalysisStore();

    useEffect(() => {
        fetchHistory();
        fetchStats();
    }, []);

    return (
        <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" /> Painel da Comunidade
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-sm text-gray-500">Total Analisado</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-sm text-gray-500">Conteúdo Suspeito</p>
                    <p className="text-2xl font-bold text-red-600">{stats.suspect}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-sm text-gray-500">Taxa de Desinformação</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {stats.total > 0 ? Math.round((stats.suspect / stats.total) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* Recent History */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-700">Verificações Recentes</h3>
                </div>
                <div className="divide-y">
                    {publicHistory.length === 0 ? (
                        <p className="p-6 text-center text-gray-500">Nenhuma verificação recente.</p>
                    ) : (
                        publicHistory.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.overall_assessment.includes('SUSPEITO')
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                        {item.overall_assessment}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-800 line-clamp-2">"{item.input_text}"</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
