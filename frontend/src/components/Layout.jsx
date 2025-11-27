import React from 'react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🦶</span>
                        <h1 className="text-xl font-bold text-gray-800">Pé no Chão</h1>
                    </div>
                    <nav>
                        <a href="#" className="text-gray-600 hover:text-blue-600 text-sm font-medium">Sobre</a>
                    </nav>
                </div>
            </header>

            <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8">
                {children}
            </main>

            <footer className="bg-white border-t py-6 mt-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>© 2025 Pé no Chão. Combate à desinformação com lógica.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
