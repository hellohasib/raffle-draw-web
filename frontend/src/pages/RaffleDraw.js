import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { raffleAPI } from '../services/api';
import { toast } from 'react-toastify';
import DramaticDrawModal from '../components/DramaticDrawModal';
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
  AlertCircle,
  Edit,
  Trash2,
  X,
  Check,
  Plus,
  Download,
  Lock
} from 'lucide-react';

const RaffleDraw = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [raffleDraw, setRaffleDraw] = useState(null);
  const [drawStatus, setDrawStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get tab from URL parameter or default to 'overview'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  
  const [showDramaticDraw, setShowDramaticDraw] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [modalParticipants, setModalParticipants] = useState([]);
  
  // Prize editing states
  const [editingPrizeId, setEditingPrizeId] = useState(null);
  const [editPrizeData, setEditPrizeData] = useState({ name: '', description: '', value: '', position: '' });
  const [savingPrizeId, setSavingPrizeId] = useState(null);
  const [deletingPrizeId, setDeletingPrizeId] = useState(null);

  // Participant editing states
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [editParticipantData, setEditParticipantData] = useState({ name: '', email: '', phone: '', designation: '' });
  const [savingParticipantId, setSavingParticipantId] = useState(null);
  const [deletingParticipantId, setDeletingParticipantId] = useState(null);

  // Add new modals
  const [showAddPrizeModal, setShowAddPrizeModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [newPrize, setNewPrize] = useState({ name: '', description: '', value: '', position: '' });
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', phone: '', designation: '' });

  useEffect(() => {
    fetchRaffleDraw();
    fetchDrawStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRaffleDraw = async () => {
    try {
      const response = await raffleAPI.getRaffleDraw(id);
      setRaffleDraw(response.data.data.raffleDraw);
    } catch (error) {
      toast.error('Failed to fetch raffle draw');
      console.error('Error fetching raffle draw:', error);
    } finally {
      setLoading(false);
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

  const getEligibleParticipants = () => {
    return raffleDraw?.participants?.filter(participant => !participant.isWinner) || [];
  };

  const handleDrawPrize = (prizeId) => {
    const prize = raffleDraw.prizes.find(p => p.id === prizeId);
    if (!prize) {
      toast.error('Prize not found.');
      return;
    }

    const eligibleParticipants = getEligibleParticipants();
    if (eligibleParticipants.length === 0) {
      toast.info('No eligible participants remaining for this draw.');
      return;
    }

    setModalParticipants(eligibleParticipants);
    setSelectedPrize(prize);
    setShowDramaticDraw(true);
  };

  const handleDramaticDrawComplete = async () => {
    try {
      // Call the API to draw the winner
      const response = await raffleAPI.drawPrize(id, selectedPrize.id);
      
      // Extract the winner data from the response
      const winnerData = response.data.data.winner;
      
      toast.success(`Winner drawn for ${selectedPrize.name}!`);
      
      // Refresh the data
      await fetchRaffleDraw();
      await fetchDrawStatus();
      
      // Return the winner data to the modal
      return winnerData;
    } catch (error) {
      toast.error('Failed to draw winner');
      console.error('Error drawing prize:', error);
      throw error; // Re-throw so the modal knows there was an error
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

  const handleRedrawPrize = async (prizeId, prizeName) => {
    if (window.confirm(`Are you sure you want to redraw for "${prizeName}"? This will clear the current winner and allow you to draw again.`)) {
      try {
        const response = await raffleAPI.redrawPrize(id, prizeId);
        toast.success(response.data.message || `Winner cleared for ${prizeName}. You can now draw again.`);
        await fetchRaffleDraw();
        await fetchDrawStatus();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to redraw prize');
        console.error('Error redrawing prize:', error);
      }
    }
  };

  const handleMarkAsClosed = async () => {
    if (window.confirm('Are you sure you want to mark this raffle draw as closed? Once closed, no further edits, deletes, or draws will be allowed.')) {
      try {
        const response = await raffleAPI.markAsClosed(id);
        toast.success(response.data.message || 'Raffle draw marked as closed');
        await fetchRaffleDraw();
        await fetchDrawStatus();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to mark as closed');
        console.error('Error marking as closed:', error);
      }
    }
  };

  const handleDownloadWinners = async (format = 'csv') => {
    try {
      const response = await raffleAPI.downloadWinners(id, format);
      
      if (format === 'csv') {
        // Create blob and download for CSV
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${raffleDraw.title.replace(/[^a-z0-9]/gi, '_')}_winners_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Winners list downloaded successfully');
      } else {
        // For JSON, trigger download manually
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${raffleDraw.title.replace(/[^a-z0-9]/gi, '_')}_winners_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Winners list downloaded successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download winners list');
      console.error('Error downloading winners:', error);
    }
  };

  // Prize management functions
  const startEditingPrize = (prize) => {
    setEditingPrizeId(prize.id);
    setEditPrizeData({
      name: prize.name || '',
      description: prize.description || '',
      value: prize.value || '',
      position: prize.position || ''
    });
  };

  const cancelEditingPrize = () => {
    setEditingPrizeId(null);
    setEditPrizeData({ name: '', description: '', value: '', position: '' });
    setSavingPrizeId(null);
  };

  const handleUpdatePrize = async (prizeId) => {
    if (!editPrizeData.name.trim()) {
      toast.error('Prize name is required');
      return;
    }

    const prizeDataToUpdate = {
      name: editPrizeData.name.trim(),
      description: editPrizeData.description.trim() || null,
      value: editPrizeData.value ? parseFloat(editPrizeData.value) : null,
      position: editPrizeData.position ? parseInt(editPrizeData.position) : null
    };

    setSavingPrizeId(prizeId);

    try {
      await raffleAPI.updatePrize(id, prizeId, prizeDataToUpdate);
      toast.success('Prize updated successfully');
      await fetchRaffleDraw();
      cancelEditingPrize();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update prize');
      console.error('Error updating prize:', error);
    } finally {
      setSavingPrizeId(null);
    }
  };

  const handleDeletePrize = async (prizeId) => {
    if (!window.confirm('Are you sure you want to delete this prize?')) {
      return;
    }

    setDeletingPrizeId(prizeId);

    try {
      await raffleAPI.deletePrize(id, prizeId);
      toast.success('Prize deleted successfully');
      await fetchRaffleDraw();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete prize');
      console.error('Error deleting prize:', error);
    } finally {
      setDeletingPrizeId(null);
    }
  };

  // Participant management functions
  const startEditingParticipant = (participant) => {
    setEditingParticipantId(participant.id);
    setEditParticipantData({
      name: participant.name || '',
      email: participant.email || '',
      phone: participant.phone || '',
      designation: participant.designation || ''
    });
  };

  const cancelEditingParticipant = () => {
    setEditingParticipantId(null);
    setEditParticipantData({ name: '', email: '', phone: '', designation: '' });
    setSavingParticipantId(null);
  };

  const handleUpdateParticipant = async (participantId) => {
    if (!editParticipantData.name.trim()) {
      toast.error('Participant name is required');
      return;
    }

    const participantDataToUpdate = {
      name: editParticipantData.name.trim(),
      email: editParticipantData.email.trim() || null,
      phone: editParticipantData.phone.trim() || null,
      designation: editParticipantData.designation.trim() || null
    };

    setSavingParticipantId(participantId);

    try {
      await raffleAPI.updateParticipant(id, participantId, participantDataToUpdate);
      toast.success('Participant updated successfully');
      await fetchRaffleDraw();
      cancelEditingParticipant();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update participant');
      console.error('Error updating participant:', error);
    } finally {
      setSavingParticipantId(null);
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    if (!window.confirm('Are you sure you want to delete this participant?')) {
      return;
    }

    setDeletingParticipantId(participantId);

    try {
      await raffleAPI.deleteParticipant(id, participantId);
      toast.success('Participant deleted successfully');
      await fetchRaffleDraw();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete participant');
      console.error('Error deleting participant:', error);
    } finally {
      setDeletingParticipantId(null);
    }
  };

  // Add new prize
  const handleAddPrize = async (e) => {
    e.preventDefault();
    if (!newPrize.name.trim()) {
      toast.error('Prize name is required');
      return;
    }

    try {
      await raffleAPI.addPrize(id, {
        name: newPrize.name.trim(),
        description: newPrize.description.trim() || null,
        value: newPrize.value ? parseFloat(newPrize.value) : null,
        position: newPrize.position ? parseInt(newPrize.position) : null
      });
      toast.success('Prize added successfully');
      await fetchRaffleDraw();
      setNewPrize({ name: '', description: '', value: '', position: '' });
      setShowAddPrizeModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add prize');
      console.error('Error adding prize:', error);
    }
  };

  // Add new participant
  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!newParticipant.name.trim()) {
      toast.error('Participant name is required');
      return;
    }

    try {
      await raffleAPI.addParticipant(id, {
        name: newParticipant.name.trim(),
        email: newParticipant.email.trim() || null,
        phone: newParticipant.phone.trim() || null,
        designation: newParticipant.designation.trim() || null
      });
      toast.success('Participant added successfully');
      await fetchRaffleDraw();
      setNewParticipant({ name: '', email: '', phone: '', designation: '' });
      setShowAddParticipantModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add participant');
      console.error('Error adding participant:', error);
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
        return <AlertCircle className="h-4 w-4" />;
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
          {drawStatus?.drawnCount > 0 && raffleDraw.status !== 'closed' && (
            <button
              onClick={() => handleDownloadWinners('csv')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              title="Download winners as CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Winners
            </button>
          )}
          {(raffleDraw.status === 'active' || raffleDraw.status === 'completed') && raffleDraw.status !== 'closed' && (
            <button
              onClick={handleMarkAsClosed}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              title="Mark as closed (no further edits allowed)"
            >
              <Lock className="h-4 w-4 mr-2" />
              Mark as Closed
            </button>
          )}
          {raffleDraw.status === 'active' && drawStatus?.drawnCount > 0 && (
            <button
              onClick={handleResetDraw}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Draw
            </button>
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
            onClick={() => setActiveTab('draw')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'draw'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Play className="inline h-4 w-4 mr-1" />
            Draw
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'prizes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Gift className="inline h-4 w-4 mr-1" />
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
            <Users className="inline h-4 w-4 mr-1" />
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

      {/* Draw Tab */}
      {activeTab === 'draw' && (
        <div className="space-y-4">
          {raffleDraw.prizes?.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prizes</h3>
              <p className="mt-1 text-sm text-gray-500">Add prizes first before conducting the draw.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {raffleDraw.prizes?.map((prize) => (
                <div key={prize.id} className="bg-white overflow-hidden shadow rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-colors">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{prize.name}</h3>
                      <span className="text-sm font-medium text-gray-500">#{prize.position}</span>
                    </div>
                    
                    {prize.description && (
                      <p className="text-sm text-gray-600 mb-4">{prize.description}</p>
                    )}

                    {prize.winner ? (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Winner</p>
                              <p className="text-sm text-gray-600">{prize.winner.name}</p>
                              <p className="text-xs text-gray-500">{prize.winner.phone}</p>
                              {prize.winner.designation && (
                                <p className="text-xs text-gray-500">{prize.winner.designation}</p>
                              )}
                            </div>
                          </div>
                          {raffleDraw.status === 'active' && raffleDraw.status !== 'closed' && (
                            <button
                              onClick={() => handleRedrawPrize(prize.id, prize.name)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 shadow-sm"
                              title="Clear winner and redraw"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Redraw
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">No winner yet</span>
                          {raffleDraw.status === 'active' && raffleDraw.status !== 'closed' && (
                            <button
                              onClick={() => handleDrawPrize(prize.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
                            >
                              <Play className="h-4 w-4 mr-2" />
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

      {/* Prizes Tab */}
      {activeTab === 'prizes' && (
        <div className="space-y-4">
          {/* Add New Prize Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddPrizeModal(true)}
              disabled={raffleDraw.status === 'completed' || raffleDraw.status === 'closed'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={raffleDraw.status === 'completed' || raffleDraw.status === 'closed' ? `Cannot add prizes to ${raffleDraw.status} raffle` : 'Add a new prize'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Prize
            </button>
          </div>

          {raffleDraw.prizes?.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prizes</h3>
              <p className="mt-1 text-sm text-gray-500">No prizes have been added to this raffle draw yet.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {raffleDraw.prizes?.map((prize) => {
                  const isEditing = editingPrizeId === prize.id;
                  const isSaving = savingPrizeId === prize.id;
                  const isDeleting = deletingPrizeId === prize.id;
                  const hasWinner = !!prize.winner;

                  return (
                    <li key={prize.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Position */}
                          <div className="col-span-1">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPrizeData.position}
                                onChange={(e) => setEditPrizeData((prev) => ({ ...prev, position: e.target.value }))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="#"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-500">#{prize.position}</span>
                            )}
                          </div>

                          {/* Name */}
                          <div className="col-span-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPrizeData.name}
                                onChange={(e) => setEditPrizeData((prev) => ({ ...prev, name: e.target.value }))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Prize name"
                              />
                            ) : (
                              <div className="flex items-center">
                                <Gift className="h-4 w-4 text-primary-500 mr-2" />
                                <p className="text-sm font-medium text-gray-900">{prize.name}</p>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          <div className="col-span-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPrizeData.description}
                                onChange={(e) => setEditPrizeData((prev) => ({ ...prev, description: e.target.value }))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Description (optional)"
                              />
                            ) : (
                              <p className="text-sm text-gray-600 truncate">{prize.description || '-'}</p>
                            )}
                          </div>

                          {/* Winner/Status */}
                          <div className="col-span-2">
                            {hasWinner ? (
                              <div className="flex items-center">
                                <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                                <span className="text-sm text-gray-900 truncate">{prize.winner.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No winner</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-end space-x-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={cancelEditingPrize}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                                  disabled={isSaving}
                                  type="button"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdatePrize(prize.id)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                  disabled={isSaving}
                                  type="button"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                              </>
                            ) : (
                              <>
                                {hasWinner && raffleDraw.status === 'active' && raffleDraw.status !== 'closed' && (
                                  <button
                                    onClick={() => handleRedrawPrize(prize.id, prize.name)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                    title="Clear winner and redraw"
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Redraw
                                  </button>
                                )}
                                <button
                                  onClick={() => startEditingPrize(prize)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 disabled:bg-gray-200 disabled:text-gray-400"
                                  disabled={hasWinner}
                                  title={hasWinner ? 'Cannot edit a prize with a winner' : 'Edit prize'}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePrize(prize.id)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400"
                                  disabled={hasWinner || isDeleting}
                                  title={hasWinner ? 'Cannot delete a prize with a winner' : 'Delete prize'}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          {/* Add New Participant Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddParticipantModal(true)}
              disabled={raffleDraw.status === 'completed' || raffleDraw.status === 'closed'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={raffleDraw.status === 'completed' || raffleDraw.status === 'closed' ? `Cannot add participants to ${raffleDraw.status} raffle` : 'Add a new participant'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Participant
            </button>
          </div>

          {raffleDraw.participants?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No participants</h3>
              <p className="mt-1 text-sm text-gray-500">No participants have joined this raffle draw yet.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {raffleDraw.participants?.map((participant) => {
                  const isEditing = editingParticipantId === participant.id;
                  const isSaving = savingParticipantId === participant.id;
                  const isDeleting = deletingParticipantId === participant.id;
                  const isWinner = participant.isWinner;

                  return (
                    <li key={participant.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Avatar & Name */}
                          <div className="col-span-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editParticipantData.name}
                                    onChange={(e) => setEditParticipantData((prev) => ({ ...prev, name: e.target.value }))}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="Name"
                                  />
                                ) : (
                                  <div className="flex items-center">
                                    <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                                    {isWinner && (
                                      <Trophy className="ml-2 h-4 w-4 text-yellow-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="col-span-4">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="email"
                                  value={editParticipantData.email}
                                  onChange={(e) => setEditParticipantData((prev) => ({ ...prev, email: e.target.value }))}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  placeholder="Email"
                                />
                                <input
                                  type="tel"
                                  value={editParticipantData.phone}
                                  onChange={(e) => setEditParticipantData((prev) => ({ ...prev, phone: e.target.value }))}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  placeholder="Phone"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Mail className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                  {participant.email || '-'}
                                </div>
                                {participant.phone && (
                                  <div className="flex items-center mt-1">
                                    <Phone className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                    {participant.phone}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Designation */}
                          <div className="col-span-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editParticipantData.designation}
                                onChange={(e) => setEditParticipantData((prev) => ({ ...prev, designation: e.target.value }))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Designation"
                              />
                            ) : (
                              <p className="text-sm text-gray-600">{participant.designation || '-'}</p>
                            )}
                          </div>

                          {/* Ticket & Winner Status */}
                          <div className="col-span-1">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center text-xs text-gray-500">
                                <Ticket className="flex-shrink-0 mr-1 h-3 w-3" />
                                {participant.ticketNumber}
                              </div>
                              {isWinner && (
                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Winner
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-end space-x-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={cancelEditingParticipant}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                                  disabled={isSaving}
                                  type="button"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateParticipant(participant.id)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                  disabled={isSaving}
                                  type="button"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditingParticipant(participant)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 disabled:bg-gray-200 disabled:text-gray-400"
                                  disabled={isWinner}
                                  title={isWinner ? 'Cannot edit a winner' : 'Edit participant'}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteParticipant(participant.id)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400"
                                  disabled={isWinner || isDeleting}
                                  title={isWinner ? 'Cannot delete a winner' : 'Delete participant'}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Dramatic Draw Modal */}
      <DramaticDrawModal
        isOpen={showDramaticDraw}
        onClose={() => {
          setShowDramaticDraw(false);
          setSelectedPrize(null);
          setModalParticipants([]);
        }}
        prize={selectedPrize}
        participants={modalParticipants}
        onDrawComplete={handleDramaticDrawComplete}
      />

      {/* Add Prize Modal */}
      {showAddPrizeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Prize</h3>
                <button
                  onClick={() => {
                    setShowAddPrizeModal(false);
                    setNewPrize({ name: '', description: '', value: '', position: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddPrize} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prize Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={newPrize.name}
                      onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                      placeholder="e.g., 1st Place"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="number"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={newPrize.position}
                      onChange={(e) => setNewPrize({ ...newPrize, position: e.target.value })}
                      placeholder="e.g., 1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newPrize.description}
                    onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                    placeholder="e.g., Grand Prize"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newPrize.value}
                    onChange={(e) => setNewPrize({ ...newPrize, value: e.target.value })}
                    placeholder="e.g., $500 or Gift Card"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPrizeModal(false);
                      setNewPrize({ name: '', description: '', value: '', position: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Add Prize
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Participant</h3>
                <button
                  onClick={() => {
                    setShowAddParticipantModal(false);
                    setNewParticipant({ name: '', email: '', phone: '', designation: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddParticipant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newParticipant.phone}
                    onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={newParticipant.designation}
                    onChange={(e) => setNewParticipant({ ...newParticipant, designation: e.target.value })}
                    placeholder="e.g., Manager"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddParticipantModal(false);
                      setNewParticipant({ name: '', email: '', phone: '', designation: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Add Participant
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

export default RaffleDraw;
