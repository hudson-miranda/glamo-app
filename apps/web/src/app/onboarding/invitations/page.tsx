'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Building2,
  Check,
  X,
  Loader2,
  ArrowLeft,
  Clock,
  MapPin,
  Briefcase,
  RefreshCw,
  Inbox,
  ArrowRight,
} from 'lucide-react';

interface Invitation {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantLogo?: string;
  tenantAddress?: string;
  role: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchInvitations();
  }, [router]);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'}/invitations/received`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (err) {
      console.error('Erro ao buscar convites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
    setProcessingId(invitationId);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'}/invitations/${invitationId}/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} convite`);
      }

      // Atualizar lista de convites
      fetchInvitations();

      // Se aceitou, pode redirecionar para o dashboard do estabelecimento
      if (action === 'accept') {
        // Poderia redirecionar para o dashboard específico do tenant
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const processedInvitations = invitations.filter(inv => inv.status !== 'pending');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-ruby-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/onboarding" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <button 
            onClick={fetchInvitations}
            className="inline-flex items-center gap-2 text-sm text-ruby-600 hover:text-ruby-700 font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ruby-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-ruby-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Seus Convites
          </h1>
          <p className="text-gray-500">
            Estabelecimentos que te convidaram para fazer parte da equipe
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Convites Pendentes ({pendingInvitations.length})
            </h2>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start gap-4">
                    {/* Logo/Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-ruby-500/25">
                      {invitation.tenantLogo ? (
                        <img 
                          src={invitation.tenantLogo} 
                          alt={invitation.tenantName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {invitation.tenantName}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 bg-ruby-50 text-ruby-700 px-2.5 py-1 rounded-full">
                          <Briefcase className="w-3.5 h-3.5" />
                          {invitation.role}
                        </span>
                        {invitation.tenantAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {invitation.tenantAddress}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mt-2">
                        Convidado por <span className="font-medium text-gray-700">{invitation.invitedBy}</span> em {formatDate(invitation.createdAt)}
                      </p>

                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expira em {formatDate(invitation.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleInvitation(invitation.id, 'reject')}
                      disabled={processingId === invitation.id}
                      className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingId === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Recusar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleInvitation(invitation.id, 'accept')}
                      disabled={processingId === invitation.id}
                      className="flex-1 py-3 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-medium hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {processingId === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Aceitar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No pending invitations */}
        {pendingInvitations.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum convite pendente
            </h3>
            <p className="text-gray-500 mb-6">
              Você não possui convites pendentes no momento. Quando um estabelecimento te convidar, você verá aqui.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-ruby-600 hover:text-ruby-700 font-semibold transition-colors"
            >
              Voltar para o início
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Processed invitations */}
        {processedInvitations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-gray-400" />
              Histórico ({processedInvitations.length})
            </h2>
            <div className="space-y-3">
              {processedInvitations.map((invitation) => (
                <div 
                  key={invitation.id} 
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-75"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-700 truncate">
                      {invitation.tenantName}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {invitation.role}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    invitation.status === 'accepted' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : invitation.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {invitation.status === 'accepted' ? 'Aceito' : 
                     invitation.status === 'rejected' ? 'Recusado' : 'Expirado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue button if has accepted invitations */}
        {processedInvitations.some(inv => inv.status === 'accepted') && (
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="block w-full py-4 px-6 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 text-center"
            >
              Ir para o Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
