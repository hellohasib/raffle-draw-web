import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { raffleAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  Clock,
  Gift,
  User,
  Mail,
  Phone,
  Ticket,
  ArrowLeft,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const RaffleDraw = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [raffleDraw, setRaffleDraw] = useState(null);
  const [drawStatus, setDrawStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRaffleDraw();
    fetchDrawStatus();
  }, [id]);

  const fetchRaffleDraw = async () => {
    try {
      const response = await raffleAPI.getRaffleDraw(id);
      setRaffleDraw(response.data.data.raffleDraw);
    } catch (error) {
      toast.error('Failed to fetch raffle draw');
      console.error('Error fetching raffle draw:', error);
    }
  };

  const fetchDrawStatus = async () => {
    try {
      const response = await raffleAPI.getDrawStatus(id);
      setDrawStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching draw status:', error);
    }
  };

  const handleDrawAll = async () => {
    if (window.confirm('Are you sure you want to draw all winners at once?')) {
      setDrawing(true);
      try {
        const response = await raffleAPI.conductDraw(id, 'all');
        toast.success('Raffle draw completed successfully!');
        await fetchRaffleDraw();
        await fetchDrawStatus();
      } catch (error) {
        toast.error('Failed to conduct raffle draw');
        console.error('Error conducting draw:', error);
      } finally {
        setDrawing(false);
      }
    }
  };

  const handleDrawPrize = async (prizeId) => {
    setDrawing(true);
    try {
      const response = await raffleAPI.drawPrize(id, prizeId);
      toast.success(`Winner drawn for ${response.data.data.prize.name}!`);
      await fetchRaffleDraw();
      await fetchDrawStatus();
    } catch (error) {
      toast.error('Failed to draw winner');
      console.error('Error drawing prize:', error);
    } finally {
      setDrawing(false);
    }
  };

  const handleResetDraw = async () => {
    if (window.confirm('Are you sure you want to reset the draw? This will clear all winners.')) {
      try {
        await raffleAPI.resetDraw(id);
        toast.success('Draw reset successfully!');
        await fetchRaffleDraw();
        await fetchDrawStatus();
      } catch (error) {
        toast.error('Failed to reset draw');
        console.error('Error resetting draw:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!raffleDraw) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Raffle draw not found</h3>
        <p className="mt-1 text-sm text-gray-500">The raffle draw you're looking for doesn't exist.</p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{raffleDraw.title}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(raffleDraw.status)}`}>
                {getStatusIcon(raffleDraw.status)}
                <span className="ml-1 capitalize">{raffleDraw.status}</span>
              </span>
              <span className="text-sm text-gray-500">
                <Calendar className="inline h-4 w-4 mr-1" />
                {new Date(raffleDraw.drawDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {raffleDraw.status === 'active' && drawStatus?.remainingCount > 0 && (
            <>
              <button
                onClick={handleDrawAll}
                disabled={drawing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {drawing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Draw All Winners
              </button>
              {drawStatus?.drawnCount > 0 && (
                <button
                  onClick={handleResetDraw}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Draw
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Draw Status Banner */}
      {drawStatus && (
        <div className={`rounded-md p-4 ${
          drawStatus.drawStatus === 'completed' 
            ? 'bg-green-50 border border-green-200' 
            : drawStatus.drawStatus === 'in_progress'
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${
                drawStatus.drawStatus === 'completed' 
                  ? 'text-green-400' 
                  : drawStatus.drawStatus === 'in_progress'
                  ? 'text-blue-400'
                  : 'text-gray-400'
              }`}>
                {drawStatus.drawStatus === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : drawStatus.drawStatus === 'in_progress' ? (
                  <Play className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  drawStatus.drawStatus === 'completed' 
                    ? 'text-green-800' 
                    : drawStatus.drawStatus === 'in_progress'
                    ? 'text-blue-800'
                    : 'text-gray-800'
                }`}>
                  {drawStatus.drawStatus === 'completed' 
                    ? 'Draw Completed' 
                    : drawStatus.drawStatus === 'in_progress'
                    ? 'Draw In Progress'
                    : 'Draw Not Started'}
                </h3>
                <p className={`text-sm ${
                  drawStatus.drawStatus === 'completed' 
                    ? 'text-green-700' 
                    : drawStatus.drawStatus === 'in_progress'
                    ? 'text-blue-700'
                    : 'text-gray-700'
                }`}>
                  {drawStatus.drawnCount} of {drawStatus.totalPrizes} prizes drawn
                </p>
              </div>
            </div>
            {drawStatus.nextPrize && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Next Prize</p>
                <p className="text-sm text-gray-600">{drawStatus.nextPrize.name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'prizes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Prizes ({raffleDraw.prizes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'participants'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Participants ({raffleDraw.participants?.length || 0})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Description */}
          {raffleDraw.description && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{raffleDraw.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Gift className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Prizes</dt>
                      <dd className="text-lg font-medium text-gray-900">{raffleDraw.prizes?.length || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Participants</dt>
                      <dd className="text-lg font-medium text-gray-900">{raffleDraw.participants?.length || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Winners Drawn</dt>
                      <dd className="text-lg font-medium text-gray-900">{drawStatus?.drawnCount || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prizes Tab */}
      {activeTab === 'prizes' && (
        <div className="space-y-4">
          {raffleDraw.prizes?.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prizes</h3>
              <p className="mt-1 text-sm text-gray-500">No prizes have been added to this raffle draw yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {raffleDraw.prizes?.map((prize) => (
                <div key={prize.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{prize.name}</h3>
                      <span className="text-sm font-medium text-gray-500">#{prize.position}</span>
                    </div>
                    
                    {prize.description && (
                      <p className="text-sm text-gray-600 mb-4">{prize.description}</p>
                    )}
                    
                    {prize.value && (
                      <p className="text-sm font-medium text-green-600 mb-4">
                        Value: ${prize.value}
                      </p>
                    )}

                    {prize.winner ? (
                      <div className="border-t pt-4">
                        <div className="flex items-center">
                          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Winner</p>
                            <p className="text-sm text-gray-600">{prize.winner.name}</p>
                            <p className="text-xs text-gray-500">{prize.winner.email}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">No winner yet</span>
                          {raffleDraw.status === 'active' && drawStatus?.nextPrize?.id === prize.id && (
                            <button
                              onClick={() => handleDrawPrize(prize.id)}
                              disabled={drawing}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                            >
                              {drawing ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3 mr-1" />
                              )}
                              Draw Winner
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          {raffleDraw.participants?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No participants</h3>
              <p className="mt-1 text-sm text-gray-500">No participants have joined this raffle draw yet.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {raffleDraw.participants?.map((participant) => (
                  <li key={participant.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                              {participant.isWinner && (
                                <Trophy className="ml-2 h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <Mail className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              {participant.email}
                              {participant.phone && (
                                <>
                                  <span className="mx-2">•</span>
                                  <Phone className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                  {participant.phone}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Ticket className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {participant.ticketNumber}
                          </div>
                          {participant.isWinner && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Winner
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RaffleDraw;
