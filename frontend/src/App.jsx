import React, { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Sidebar de Navegación */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-lg">
        <div className="p-5 text-xl font-bold text-white border-b border-slate-800">
          Ayuntamiento Hmo
          <span className="block text-xs font-normal text-slate-400">Panel de Administración</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            📊 Dashboard e Indicadores
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'catalog' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            🏢 Dependencias y QR
          </button>
          <button 
            onClick={() => setActiveTab('improvements')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'improvements' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            🛠️ Acciones de Mejora
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          Rol: Administrador General
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Navbar Superior */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <h1 className="text-lg font-semibold text-gray-800 capitalize">
            {activeTab === 'dashboard' && 'Resumen General y Métricas'}
            {activeTab === 'catalog' && 'Catálogo de Dependencias y Servicios'}
            {activeTab === 'improvements' && 'Seguimiento de Acciones de Mejora'}
          </h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Administrador Contraloría</span>
            <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>

        {/* Contenido Dinámico */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-8">
          
          {/* Mensaje de Presentación Institucional */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido al Portal de Gestión y Calidad Ciudadana</h2>
            <p className="text-gray-600 mt-1">
              Plataforma institucional para la captura, análisis automatizado de experiencias y seguimiento de compromisos de mejora en los servicios del Ayuntamiento de Hermosillo.
            </p>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Tarjetas KPI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-500 font-medium">Satisfacción Promedio</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">4.2 / 5.0</p>
                  <span className="text-xs text-green-600 font-semibold mt-1 inline-block">↑ +0.3 este mes</span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-500 font-medium">Evaluaciones Totales</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">1,482</p>
                  <span className="text-xs text-gray-500 mt-1 inline-block">Registradas vía QR</span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-500 font-medium">Dependencias Activas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">18</p>
                  <span className="text-xs text-blue-600 font-semibold mt-1 inline-block">100% operando</span>
                </div>
              </div>

              {/* Contenedores para las Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80 flex flex-col justify-center items-center">
                  <p className="text-gray-400 font-medium">[ Gráfica de Distribución de Sentimientos - Chart.js ]</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80 flex flex-col justify-center items-center">
                  <p className="text-gray-400 font-medium">[ Gráfica de Calificaciones por Dependencia - Chart.js ]</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-600">Aquí se listarán las dependencias, servicios y sus códigos QR generados correspondientes a la HU01.</p>
            </div>
          )}

          {activeTab === 'improvements' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-600">Aquí se validarán y visualizarán los compromisos de mejora registrados por los enlaces.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
