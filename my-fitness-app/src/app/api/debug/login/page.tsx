'use client';

import React, { useState, useEffect } from 'react';

interface CookieInfo {
  timestamp: string;
  rawCookies: string;
  cookieCount: number;
  cookieArray: string[];
  hasRefreshToken: boolean;
  refreshTokenDetails: {
    exists: boolean;
    value: string;
    length: number;
    preview: string;
  } | null;
  allCookieParsed: Record<string, string>;
}

interface TestResult {
  step: string;
  data: any;
}

export default function CookieDebugComponent() {
  const [cookieInfo, setCookieInfo] = useState<CookieInfo>({
    timestamp: '',
    rawCookies: '',
    cookieCount: 0,
    cookieArray: [],
    hasRefreshToken: false,
    refreshTokenDetails: null,
    allCookieParsed: {}
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const analyzeCookies = (): CookieInfo => {
    const cookies = document.cookie;
    const cookieArray = cookies.split(';').map(cookie => cookie.trim());
    
    const info: CookieInfo = {
      timestamp: new Date().toISOString(),
      rawCookies: cookies,
      cookieCount: cookieArray.length,
      cookieArray: cookieArray,
      hasRefreshToken: cookies.includes('refreshToken'),
      refreshTokenDetails: null,
      allCookieParsed: {}
    };

    // Parse individual cookies
    cookieArray.forEach(cookie => {
      if (cookie) {
        const [name, value] = cookie.split('=');
        if (name && value) {
          info.allCookieParsed[name.trim()] = value.trim();
        }
      }
    });

    // Check specifically for refreshToken
    if (info.allCookieParsed.refreshToken) {
      info.refreshTokenDetails = {
        exists: true,
        value: info.allCookieParsed.refreshToken,
        length: info.allCookieParsed.refreshToken.length,
        preview: info.allCookieParsed.refreshToken.substring(0, 50) + '...'
      };
    }

    setCookieInfo(info);
    return info;
  };

  const testRefreshTokenEndpoint = async () => {
    const results: TestResult[] = [];
    
    try {
      results.push({
        step: '1. Analisando cookies antes do teste',
        data: analyzeCookies()
      });

      results.push({
        step: '2. Testando endpoint de refresh token...',
        data: 'Fazendo POST para /api/auth/refresh-token'
      });

      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.json();
      
      results.push({
        step: '3. Resposta do endpoint',
        data: {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseData
        }
      });

      results.push({
        step: '4. Cookies após a requisição',
        data: analyzeCookies()
      });

    } catch (error) {
      results.push({
        step: 'ERRO',
        data: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    }

    setTestResults(results);
  };

  const clearAllCookies = () => {
    // Limpar todos os cookies possíveis
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Também tentar limpar com diferentes paths e domains
    const domains = [window.location.hostname, '.' + window.location.hostname, 'localhost', '.localhost'];
    const paths = ['/', ''];
    
    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
      });
    });
    
    setTimeout(analyzeCookies, 500);
  };

  const testManualCookie = () => {
    // Tentar definir um cookie de teste manualmente
    document.cookie = "testCookie=testValue; path=/; max-age=3600";
    setTimeout(analyzeCookies, 500);
  };

  useEffect(() => {
    analyzeCookies();
    
    // Verificar cookies a cada 5 segundos
    const interval = setInterval(analyzeCookies, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🍪 Debug de Cookies e Refresh Token
        </h1>

        {/* Informações dos Cookies */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            📊 Estado Atual dos Cookies
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(cookieInfo, null, 2)}
            </pre>
          </div>
        </div>

        {/* Controles de Teste */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            🧪 Testes e Ações
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={testRefreshTokenEndpoint}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              🔄 Testar Refresh Endpoint
            </button>
            
            <button
              onClick={analyzeCookies}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              📊 Atualizar Info
            </button>
            
            <button
              onClick={clearAllCookies}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              🗑️ Limpar Cookies
            </button>
            
            <button
              onClick={testManualCookie}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              🧪 Cookie de Teste
            </button>
          </div>
        </div>

        {/* Resultados dos Testes */}
        {testResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              📋 Resultados do Teste de Refresh
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
              {testResults.map((result, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <h3 className="font-medium text-gray-800 mb-2">
                    {result.step}
                  </h3>
                  <pre className="text-sm bg-white p-2 rounded border overflow-auto whitespace-pre-wrap">
                    {typeof result.data === 'object' 
                      ? JSON.stringify(result.data, null, 2)
                      : result.data
                    }
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Visual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg text-center font-medium ${
            cookieInfo.hasRefreshToken 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {cookieInfo.hasRefreshToken ? '✅ Refresh Token Presente' : '❌ Refresh Token Ausente'}
          </div>
          
          <div className={`p-4 rounded-lg text-center font-medium ${
            cookieInfo.cookieCount > 0
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-300'
          }`}>
            📊 {cookieInfo.cookieCount} Cookie(s) Total
          </div>
          
          <div className={`p-4 rounded-lg text-center font-medium ${
            cookieInfo.allCookieParsed?.testCookie
              ? 'bg-purple-100 text-purple-800 border border-purple-300' 
              : 'bg-gray-100 text-gray-800 border border-gray-300'
          }`}>
            🧪 {cookieInfo.allCookieParsed?.testCookie ? 'Cookie de Teste OK' : 'Sem Cookie de Teste'}
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">📝 Instruções:</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Faça login normalmente em outra aba</li>
            <li>2. Volte aqui e clique em "Atualizar Info"</li>
            <li>3. Verifique se o Refresh Token aparece</li>
            <li>4. Se não aparecer, teste o endpoint de refresh</li>
            <li>5. Se o cookie de teste não funcionar, há problema de configuração</li>
          </ol>
        </div>
      </div>
    </div>
  );
}