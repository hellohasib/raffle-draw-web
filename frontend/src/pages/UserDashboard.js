import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { raffleAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Users, 
  Trophy, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  UserPlus,
  Play,
  Shuffle,
  Lock
} from 'lucide-react';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [raffleDraws, setRaffleDraws] = useState([]);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drawStatus, setDrawStatus] = useState(null);
  
  const [newRaffle, setNewRaffle] = useState({
    title: '',
    description: '',
    drawDate: '',
    maxParticipants: '',
    isPublic: true
  });

  useEffect(() => {
    fetchRaffleDraws();
  }, []);

  useEffect(() => {
    if (selectedRaffle) {
      fetchDrawStatus(selectedRaffle.id);
    }
  }, [selectedRaffle]);

  const fetchRaffleDraws = async () => {
    try {
      const response = await raffleAPI.getRaffleDraws();
      const fetchedRaffles = response.data.data.raffleDraws;
      setRaffleDraws(fetchedRaffles);

      if (selectedRaffle) {
        const updatedSelection = fetchedRaffles.find((raffle) => raffle.id === selectedRaffle.id);
        if (updatedSelection) {
          setSelectedRaffle(updatedSelection);
        } else {
          setSelectedRaffle(null);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch raffle draws');
      console.error('Error fetching raffle draws:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawStatus = async (raffleId) => {
    try {
      const response = await raffleAPI.getDrawStatus(raffleId);
      setDrawStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching draw status:', error);
    }
  };

  const handleCreateRaffle = async (e) => {
    e.preventDefault();
    try {
      const raffleData = {
        ...newRaffle,
        maxParticipants: newRaffle.maxParticipants ? parseInt(newRaffle.maxParticipants) : null,
        drawDate: new Date(newRaffle.drawDate).toISOString(),
        status: 'active' // Set to active immediately for conducting draws
      };

      const response = await raffleAPI.createRaffleDraw(raffleData);
      setRaffleDraws([response.data.data.raffleDraw, ...raffleDraws]);
      setSelectedRaffle(response.data.data.raffleDraw);
      setShowCreateModal(false);
      setNewRaffle({
        title: '',
        description: '',
        drawDate: '',
        maxParticipants: '',
        isPublic: true
      });
      toast.success('Raffle draw created successfully!');
    } catch (error) {
      toast.error('Failed to create raffle draw');
      console.error('Error creating raffle draw:', error);
    }
  };

  const handleDrawPrize = (prizeId) => {
    if (!selectedRaffle) return;
    navigate(`/raffle/${selectedRaffle.id}?prize=${prizeId}`);
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
      case 'closed':
        return 'bg-purple-100 text-purple-800';
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
        return <XCircle className="h-4 w-4" />;
      case 'closed':
        return <Lock className="h-4 w-4" />;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raffle Draw Dashboard</h1>
          <p className="text-gray-600">Create and conduct raffle draws with participants and prizes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Raffle Draw
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Raffle Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Raffle Draw</h3>
            
      {raffleDraws.length === 0 ? (
              <div className="text-center py-8">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-2 text-sm font-medium text-gray-900">No raffle draws</h4>
                <p className="mt-1 text-sm text-gray-500">Create your first raffle draw to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {raffleDraws.map((raffle) => (
                  <div
                    key={raffle.id}
                    onClick={() => setSelectedRaffle(raffle)}
                    className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                      selectedRaffle?.id === raffle.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{raffle.title}</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/raffle/${raffle.id}`);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                          title="View Dramatic Draw Page"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Draw Page
                        </button>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(raffle.status)}`}>
                        {getStatusIcon(raffle.status)}
                        <span className="ml-1 capitalize">{raffle.status}</span>
                      </span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {raffle.participants?.length || 0}
                      </span>
                      <span className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        {raffle.prizes?.length || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Raffle Management */}
        <div className="lg:col-span-2">
          {selectedRaffle ? (
            <div className="space-y-6">
              {/* Raffle Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{selectedRaffle.title}</h3>
                </div>
                
                {selectedRaffle.description && (
                  <p className="text-gray-600 mb-4">{selectedRaffle.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Participants</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedRaffle.participants?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Trophy className="h-8 w-8 text-yellow-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-900">Prizes</p>
                        <p className="text-2xl font-bold text-yellow-600">{selectedRaffle.prizes?.length || 0}</p>
                      </div>
                  </div>
                  </div>
                </div>

                {/* Management Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate(`/raffle/${selectedRaffle.id}/participants`)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Participants
                  </button>
                  <button
                    onClick={() => navigate(`/raffle/${selectedRaffle.id}?tab=prizes`)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Manage Prizes
                  </button>
                </div>
              </div>

              {/* Draw Status */}
              {drawStatus && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Draw Status</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{drawStatus.drawnCount}</p>
                      <p className="text-sm text-gray-500">Drawn</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{drawStatus.remainingCount}</p>
                      <p className="text-sm text-gray-500">Remaining</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">{drawStatus.totalPrizes}</p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                  </div>

                  {drawStatus.drawnPrizes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Winners</h4>
                      <div className="space-y-2">
                        {drawStatus.drawnPrizes.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium text-green-900">{item.prize.name}</p>
                              <p className="text-sm text-green-700">{item.winner.name}</p>
                            </div>
                            <span className="text-sm font-medium text-green-600">Position {item.prize.position}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {drawStatus.nextPrize && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Next Prize to Draw</h4>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-blue-900">{drawStatus.nextPrize.name}</p>
                          <p className="text-sm text-blue-700">Position {drawStatus.nextPrize.position}</p>
                        </div>
                      <button
                          onClick={() => handleDrawPrize(drawStatus.nextPrize.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                          <Shuffle className="h-4 w-4 mr-1" />
                          Draw Winner
                      </button>
                      </div>
                    </div>
                    )}
                </div>
              )}
              </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No raffle selected</h3>
              <p className="mt-1 text-sm text-gray-500">Select a raffle draw from the left panel to manage participants and prizes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Raffle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Raffle Draw</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateRaffle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newRaffle.title}
                    onChange={(e) => setNewRaffle({ ...newRaffle, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newRaffle.description}
                    onChange={(e) => setNewRaffle({ ...newRaffle, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Draw Date</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newRaffle.drawDate}
                    onChange={(e) => setNewRaffle({ ...newRaffle, drawDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Participants (optional)</label>
                  <input
                    type="number"
                    min="1"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newRaffle.maxParticipants}
                    onChange={(e) => setNewRaffle({ ...newRaffle, maxParticipants: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default UserDashboard;
