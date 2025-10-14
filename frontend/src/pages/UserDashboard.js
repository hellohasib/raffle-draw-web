import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { raffleAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Calendar, 
  Users, 
  Trophy, 
  Play, 
  Eye, 
  Edit, 
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const UserDashboard = () => {
  const [raffleDraws, setRaffleDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const fetchRaffleDraws = async () => {
    try {
      const response = await raffleAPI.getRaffleDraws();
      setRaffleDraws(response.data.data.raffleDraws);
    } catch (error) {
      toast.error('Failed to fetch raffle draws');
      console.error('Error fetching raffle draws:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRaffle = async (e) => {
    e.preventDefault();
    try {
      const raffleData = {
        ...newRaffle,
        maxParticipants: newRaffle.maxParticipants ? parseInt(newRaffle.maxParticipants) : null,
        drawDate: new Date(newRaffle.drawDate).toISOString()
      };

      const response = await raffleAPI.createRaffleDraw(raffleData);
      setRaffleDraws([response.data.data.raffleDraw, ...raffleDraws]);
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

  const handleDeleteRaffle = async (id) => {
    if (window.confirm('Are you sure you want to delete this raffle draw?')) {
      try {
        await raffleAPI.deleteRaffleDraw(id);
        setRaffleDraws(raffleDraws.filter(raffle => raffle.id !== id));
        toast.success('Raffle draw deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete raffle draw');
        console.error('Error deleting raffle draw:', error);
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
        return <XCircle className="h-4 w-4" />;
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
          <h1 className="text-2xl font-bold text-gray-900">My Raffle Draws</h1>
          <p className="text-gray-600">Manage and conduct your raffle draw events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Raffle Draw
        </button>
      </div>

      {/* Raffle Draws Grid */}
      {raffleDraws.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No raffle draws</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new raffle draw.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Raffle Draw
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {raffleDraws.map((raffle) => (
            <div key={raffle.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {raffle.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(raffle.status)}`}>
                      {getStatusIcon(raffle.status)}
                      <span className="ml-1 capitalize">{raffle.status}</span>
                    </span>
                  </div>
                </div>
                
                {raffle.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {raffle.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(raffle.drawDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    {raffle.participants?.length || 0} participants
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Trophy className="h-4 w-4 mr-2" />
                    {raffle.prizes?.length || 0} prizes
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Link
                    to={`/raffle/${raffle.id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  
                  <div className="flex space-x-2">
                    {raffle.status === 'active' && (
                      <Link
                        to={`/raffle/${raffle.id}`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Conduct Draw
                      </Link>
                    )}
                    
                    {raffle.status !== 'completed' && (
                      <button
                        onClick={() => handleDeleteRaffle(raffle.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={newRaffle.isPublic}
                    onChange={(e) => setNewRaffle({ ...newRaffle, isPublic: e.target.checked })}
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                    Public raffle draw
                  </label>
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
