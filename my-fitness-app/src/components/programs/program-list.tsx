// ================================
// 1. PRIMEIRO: ATUALIZAR O PROGRAM-LIST COMPONENT
// ================================

'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';

interface Program {
  program_id: number;
  title: string;
  description?: string;
  category: string;
  difficulty_level: string;
  duration_weeks?: number;
  price: any;
  trainer_first_name?: string;
  trainer_last_name?: string;
  program_rating?: number;
  review_count?: number;
  subscriber_count?: number;
  is_featured?: boolean;
  created_at: string;
  // ✅ Adicionar campo para status de inscrição
  is_subscribed?: boolean;
}

interface ProgramListProps {
  filters?: {
    category?: string;
    difficulty?: string;
    search?: string;
    featured?: boolean;
  };
}

export function ProgramList({ filters }: ProgramListProps) {
  const { user } = useAuth(); // ✅ Hook de autenticação
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<Record<number, boolean>>({});

  console.log('🚀 [PROGRAM_LIST] Component mounted with filters:', filters);

  useEffect(() => {
    const fetchPrograms = async () => {
      console.log('🔵 [PROGRAM_LIST] Starting fetch...');
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        
        if (filters?.search && filters.search.trim()) {
          searchParams.append('search', filters.search.trim());
        }
        if (filters?.category) {
          searchParams.append('category', filters.category);
        }
        if (filters?.difficulty) {
          searchParams.append('difficulty', filters.difficulty);
        }
        if (filters?.featured) {
          searchParams.append('featured', 'true');
        }

        const queryString = searchParams.toString();
        const url = `/api/programs${queryString ? `?${queryString}` : ''}`;
        
        console.log('🔵 [PROGRAM_LIST] Fetching URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🔵 [PROGRAM_LIST] Response data:', data);

        if (data.success) {
          let programsArray: Program[] = Array.isArray(data.data) ? data.data : [];
          
          // ✅ Se o usuário está logado, verificar inscrições
          if (user && programsArray.length > 0) {
            programsArray = await checkUserSubscriptions(programsArray);
          }

          console.log('✅ [PROGRAM_LIST] Programs loaded:', programsArray.length);
          setPrograms(programsArray);
        } else {
          console.error('❌ [PROGRAM_LIST] API returned error:', data.error);
          setError(data.error || 'Failed to load programs');
          setPrograms([]);
        }

      } catch (err) {
        console.error('❌ [PROGRAM_LIST] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Network error occurred');
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [filters?.search, filters?.category, filters?.difficulty, filters?.featured, user]);

  // ✅ Função para verificar inscrições do usuário
  const checkUserSubscriptions = async (programsList: Program[]): Promise<Program[]> => {
    try {
      console.log('🔵 [PROGRAM_LIST] Checking user subscriptions...');
      
      const token = localStorage.getItem('accessToken');
      if (!token) return programsList;

      const response = await fetch('/api/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const subscriptions = Array.isArray(data.data) ? data.data : [];
        
        // Marcar programas como inscritos
        return programsList.map(program => ({
          ...program,
          is_subscribed: subscriptions.some((sub: any) => 
            sub.program_id === program.program_id && sub.status === 'active'
          )
        }));
      }
    } catch (error) {
      console.error('❌ [PROGRAM_LIST] Error checking subscriptions:', error);
    }
    
    return programsList;
  };

  // ✅ Função para se inscrever em um programa
  const handleJoinProgram = async (programId: number) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setLoadingSubscriptions(prev => ({ ...prev, [programId]: true }));

    try {
      console.log('🔵 [PROGRAM_LIST] Joining program:', programId);

      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId') || user.user_id;

      if (!token) {
        alert('Please login again');
        window.location.href = '/login';
        return;
      }

      console.log('🔵 [PROGRAM_LIST] Using token:', token.substring(0, 20) + '...');
      console.log('🔵 [PROGRAM_LIST] User ID:', userId);

      const response = await fetch(`/api/programs/${programId}/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(userId && { 'x-user-id': userId.toString() })
        },
        body: JSON.stringify({
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        }),
      });

      console.log('🔵 [PROGRAM_LIST] Join response status:', response.status);
      const data = await response.json();
      console.log('🔵 [PROGRAM_LIST] Join response data:', data);

      if (response.ok && data.success) {
        console.log('✅ [PROGRAM_LIST] Successfully joined program');

        setPrograms(prev => prev.map(program =>
          program.program_id === programId
            ? { ...program, is_subscribed: true, subscriber_count: (program.subscriber_count || 0) + 1 }
            : program
        ));

        alert('Successfully joined the program!');
      } else {
        console.error('❌ [PROGRAM_LIST] Failed to join program:', data);
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        } else {
          alert('Failed to join program: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('❌ [PROGRAM_LIST] Join error:', error);
      alert('Network error occurred while joining program');
    } finally {
      setLoadingSubscriptions(prev => ({ ...prev, [programId]: false }));
    }
  };

  // ✅ Função para cancelar inscrição
  const handleUnjoinProgram = async (programId: number) => {
    if (!user) return;

    const confirmUnjoin = confirm('Are you sure you want to leave this program? You will lose access to all workouts and progress.');
    if (!confirmUnjoin) return;

    setLoadingSubscriptions(prev => ({ ...prev, [programId]: true }));

    try {
      console.log('🔵 [PROGRAM_LIST] Leaving program:', programId);

      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId') || user.user_id;

      if (!token) {
        alert('Please login again');
        window.location.href = '/login';
        return;
      }

      console.log('🔵 [PROGRAM_LIST] Using token for unjoin:', token.substring(0, 20) + '...');
      console.log('🔵 [PROGRAM_LIST] User ID for unjoin:', userId);

      const response = await fetch(`/api/programs/${programId}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(userId && { 'x-user-id': userId.toString() })
        },
      });

      console.log('🔵 [PROGRAM_LIST] Unjoin response status:', response.status);
      const data = await response.json();
      console.log('🔵 [PROGRAM_LIST] Unjoin response data:', data);

      if (response.ok && data.success) {
        console.log('✅ [PROGRAM_LIST] Successfully left program');

        setPrograms(prev => prev.map(program =>
          program.program_id === programId
            ? {
                ...program,
                is_subscribed: false,
                subscriber_count: Math.max(0, (program.subscriber_count || 1) - 1)
              }
            : program
        ));

        alert('Successfully left the program');
      } else {
        console.error('❌ [PROGRAM_LIST] Failed to leave program:', data);
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        } else {
          alert('Failed to leave program: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('❌ [PROGRAM_LIST] Unjoin error:', error);
      alert('Network error occurred while leaving program');
    } finally {
      setLoadingSubscriptions(prev => ({ ...prev, [programId]: false }));
    }
  };

  const programsArray = Array.isArray(programs) ? programs : [];

  const formatPrice = (price: any) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return numPrice === 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading programs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 font-medium mb-2">Error Loading Programs</div>
          <div className="text-red-500 text-sm mb-4">{error}</div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-100"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (programsArray.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
          <p className="text-gray-500 mb-6">
            {Object.values(filters || {}).some(Boolean) 
              ? 'No programs match your current filters. Try adjusting your search criteria.'
              : 'No programs are available yet. Check back later or create the first program!'
            }
          </p>
          <div className="space-x-2">
            <Link href="/programs/create">
              <Button>Create First Program</Button>
            </Link>
            {Object.values(filters || {}).some(Boolean) && (
              <Button variant="outline" onClick={() => window.location.href = '/programs'}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programsArray.map((program) => (
          <Card key={program.program_id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(program.difficulty_level)}`}>
                  {program.difficulty_level}
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(program.price)}
                </span>
              </div>
              <CardTitle className="line-clamp-2 text-lg">
                {program.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm line-clamp-3">
                {program.description || 'No description available.'}
              </p>
              
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {program.category}
                </span>
                {program.duration_weeks && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {program.duration_weeks} weeks
                  </span>
                )}
                {/* ✅ Badge de status de inscrição */}
                {program.is_subscribed && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    ✓ Joined
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  {program.trainer_first_name && (
                    <span>by {program.trainer_first_name} {program.trainer_last_name}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {program.program_rating && program.program_rating > 0 && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {program.program_rating.toFixed(1)}
                    </span>
                  )}
                  {program.subscriber_count && program.subscriber_count > 0 && (
                    <span>{program.subscriber_count} enrolled</span>
                  )}
                </div>
              </div>

              {/* ✅ Botões de ação */}
              <div className="space-y-2">
                <Link href={`/programs/${program.program_id}`}>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                
                {user ? (
                  program.is_subscribed ? (
                    <Button 
                      variant="danger" 
                      className="w-full"
                      onClick={() => handleUnjoinProgram(program.program_id)}
                      disabled={loadingSubscriptions[program.program_id]}
                    >
                      {loadingSubscriptions[program.program_id] ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Leaving...
                        </>
                      ) : (
                        'Leave Program'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleJoinProgram(program.program_id)}
                      disabled={loadingSubscriptions[program.program_id]}
                    >
                      {loadingSubscriptions[program.program_id] ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Joining...
                        </>
                      ) : (
                        program.price === 0 || formatPrice(program.price) === 'Free' ? 'Join Free' : `Join - ${formatPrice(program.price)}`
                      )}
                    </Button>
                  )
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = '/login'}
                  >
                    Login to Join
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}