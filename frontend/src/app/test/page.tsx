import { useState } from 'react';
import { apiClient } from '@/shared/api/client';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint: string, method: () => Promise<any>) => {
    try {
      setLoading(true);
      const result = await method();
      setResults((prev: any) => ({ ...prev, [endpoint]: { success: true, data: result } }));
    } catch (error) {
      setResults((prev: any) => ({ 
        ...prev, 
        [endpoint]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const testEndpoints = [
    { name: 'Health Check', method: () => fetch('http://localhost:8080/health').then(r => r.json()) },
    { name: 'Get Levels', method: () => apiClient.getLevels() },
    { name: 'Get Level 2001', method: () => apiClient.getLevel(2001) },
    { name: 'Get Level 2002', method: () => apiClient.getLevel(2002) },
    { name: 'Get Level 2003', method: () => apiClient.getLevel(2003) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>
        
        <div className="grid gap-4 mb-8">
          {testEndpoints.map((test) => (
            <Button
              key={test.name}
              onClick={() => testAPI(test.name, test.method)}
              disabled={loading}
              className="w-full"
            >
              Test {test.name}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {Object.entries(results).map(([endpoint, result]: [string, any]) => (
            <div key={endpoint} className="bg-white p-4 rounded-lg border">
              <h3 className="font-bold text-lg mb-2">{endpoint}</h3>
              <div className={`p-3 rounded ${
                result.success ? 'bg-[#00e3c1]/10 border border-[#00e3c1]/30' : 'bg-red-50 border border-red-200'
              }`}>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
