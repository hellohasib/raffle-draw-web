import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { raffleAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Upload,
  FileSpreadsheet,
  FileText,
  Search,
  Settings,
  Trash2,
  XCircle,
  Mail,
  Phone,
  Briefcase,
  Ticket,
  Loader2
} from 'lucide-react';

const defaultParticipant = {
  name: '',
  email: '',
  phone: '',
  designation: ''
};

const PAGE_SIZE = 10;

const RaffleParticipants = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [raffle, setRaffle] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newParticipant, setNewParticipant] = useState(defaultParticipant);
  const [bulkText, setBulkText] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(defaultParticipant);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchRaffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRaffle = async (showToast = false) => {
    try {
      if (raffle) {
        setRefreshing(true);
      }
      const response = await raffleAPI.getRaffleDraw(id);
      const raffleData = response.data.data.raffleDraw;
      setRaffle(raffleData);
      setParticipants(raffleData.participants || []);
      if (showToast) {
        toast.success('Participants refreshed');
      }
    } catch (error) {
      toast.error('Failed to load raffle participants');
      console.error('Error fetching raffle participants:', error);
      if (!raffle) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    const term = searchTerm.toLowerCase();
    return participants.filter((participant) => {
      const fields = [
        participant.name,
        participant.email,
        participant.phone,
        participant.designation,
        participant.ticketNumber
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return fields.some((value) => value.includes(term));
    });
  }, [participants, searchTerm]);

  const totalPages = useMemo(() => {
    if (filteredParticipants.length === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredParticipants.length / PAGE_SIZE));
  }, [filteredParticipants.length]);

  const currentParticipants = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredParticipants.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredParticipants, page]);

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredParticipants.length / PAGE_SIZE));
    if (page > newTotalPages) {
      setPage(newTotalPages);
    }
    if (filteredParticipants.length === 0 && page !== 1) {
      setPage(1);
    }
  }, [filteredParticipants, page]);

  const resetForm = () => {
    setNewParticipant(defaultParticipant);
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!raffle) return;

    if (!newParticipant.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      await raffleAPI.addParticipant(raffle.id, {
        ...newParticipant,
        name: newParticipant.name.trim(),
        email: newParticipant.email.trim() || null,
        phone: newParticipant.phone.trim() || null,
        designation: newParticipant.designation.trim() || null
      });
      resetForm();
      await fetchRaffle(true);
      setPage(1);
      toast.success('Participant added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add participant');
      console.error('Error adding participant:', error);
    }
  };

  const handleBulkAdd = async () => {
    if (!raffle || !bulkText.trim()) return;

    const lines = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast.error('Please provide at least one participant entry');
      return;
    }

    try {
      for (const line of lines) {
        const parts = line.split(',').map((part) => part.trim());
        const [name, email, phone, designation] = parts;
        if (!name) {
          toast.warning(`Skipping entry without name: ${line}`);
          continue;
        }

        await raffleAPI.addParticipant(raffle.id, {
          name,
          email: email || null,
          phone: phone || null,
          designation: designation || null
        });
      }

      setBulkText('');
      await fetchRaffle(true);
      setPage(1);
      toast.success(`${lines.length} entries processed`);
    } catch (error) {
      toast.error('Failed to process bulk participants');
      console.error('Error bulk adding participants:', error);
    }
  };

  const processFile = (file) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['csv', 'xlsx', 'xls'];

    if (allowedTypes.includes(file.type) || allowedExts.includes(fileExt)) {
      setUploadFile(file);
    } else {
      toast.error('Please select a CSV or Excel file');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!raffle || !uploadFile) return;
    setUploadLoading(true);

    try {
      const response = await raffleAPI.uploadParticipants(raffle.id, uploadFile);
      const { errors, addedParticipants } = response.data.data;

      await fetchRaffle(true);
      setPage(1);
      setUploadFile(null);
      document.getElementById('participants-file-upload').value = '';

      if (errors.length > 0) {
        toast.warning(`Upload finished with ${errors.length} warnings. ${addedParticipants} participants added.`);
        console.warn('Upload errors:', errors);
      } else {
        toast.success(`${addedParticipants} participants added successfully!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload participants');
      console.error('Error uploading participants:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    handleDrag(e);
    if (e.dataTransfer?.items?.length) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    handleDrag(e);
    setDragActive(false);
  };

  const handleDrop = (e) => {
    handleDrag(e);
    setDragActive(false);
    if (e.dataTransfer?.files?.length) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const startEditing = (participant) => {
    setEditingId(participant.id);
    setEditData({
      name: participant.name || '',
      email: participant.email || '',
      phone: participant.phone || '',
      designation: participant.designation || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData(defaultParticipant);
    setSavingId(null);
  };

  const handleUpdateParticipant = async (participantId) => {
    if (!raffle) return;

    if (!editData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = {
      name: editData.name.trim(),
      email: editData.email.trim() || null,
      phone: editData.phone.trim() || null,
      designation: editData.designation.trim() || null
    };

    setSavingId(participantId);
    try {
      await raffleAPI.updateParticipant(raffle.id, participantId, payload);
      toast.success('Participant updated');
      await fetchRaffle();
      cancelEditing();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update participant');
      console.error('Error updating participant:', error);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    if (!raffle) return;

    const confirm = window.confirm('Are you sure you want to delete this participant? This action cannot be undone.');
    if (!confirm) return;

    setDeletingId(participantId);
    try {
      await raffleAPI.deleteParticipant(raffle.id, participantId);
      toast.success('Participant removed');
      await fetchRaffle();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete participant');
      console.error('Error deleting participant:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const startIndex = filteredParticipants.length === 0 ? 0 : (page - 1) * PAGE_SIZE;
  const endIndex = filteredParticipants.length === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, filteredParticipants.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!raffle) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
            <p className="text-sm text-gray-500">{raffle.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchRaffle(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Refreshing
              </>
            ) : (
              'Refresh'
            )}
          </button>
          <Link
            to={`/raffle/${raffle.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            View Raffle
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">All Participants ({participants.length})</h2>
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search participants"
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No participants found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or add new participants.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentParticipants.map((participant) => {
                        const isEditing = editingId === participant.id;
                        const isSaving = savingId === participant.id;
                        const isDeleting = deletingId === participant.id;

                        return (
                          <tr key={participant.id} className={participant.isWinner ? 'bg-yellow-50' : ''}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editData.name}
                                  onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                              ) : (
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-900">{participant.name}</span>
                                  {participant.isWinner && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Winner
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    type="email"
                                    value={editData.email}
                                    onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="Email"
                                  />
                                  <input
                                    type="text"
                                    value={editData.phone}
                                    onChange={(e) => setEditData((prev) => ({ ...prev, phone: e.target.value }))}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="Phone"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="flex items-center text-sm text-gray-600">
                                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                    {participant.email || '—'}
                                  </p>
                                  <p className="flex items-center text-sm text-gray-600">
                                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                    {participant.phone || '—'}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editData.designation}
                                  onChange={(e) => setEditData((prev) => ({ ...prev, designation: e.target.value }))}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  placeholder="Designation"
                                />
                              ) : (
                                <p className="flex items-center text-sm text-gray-600">
                                  <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                                  {participant.designation || '—'}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <p className="flex items-center text-sm text-gray-600">
                                <Ticket className="h-4 w-4 mr-1 text-gray-400" />
                                {participant.ticketNumber}
                              </p>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={cancelEditing}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                                      disabled={isSaving}
                                      type="button"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleUpdateParticipant(participant.id)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
                                      disabled={isSaving}
                                    >
                                      {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditing(participant)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 disabled:bg-gray-200 disabled:text-gray-400"
                                      disabled={participant.isWinner}
                                      title={participant.isWinner ? 'Cannot edit a winner' : 'Edit participant'}
                                    >
                                      <Settings className="h-3 w-3 mr-1" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteParticipant(participant.id)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400"
                                      disabled={participant.isWinner || isDeleting}
                                      title={participant.isWinner ? 'Cannot delete a winner' : 'Delete participant'}
                                    >
                                      {isDeleting ? (
                                        'Deleting...'
                                      ) : (
                                        <>
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Delete
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredParticipants.length > PAGE_SIZE && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-white border-t border-gray-200 space-y-3 sm:space-y-0">
                    <p className="text-sm text-gray-500">
                      Showing {startIndex + 1} - {endIndex} of {filteredParticipants.length}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Bulk Add Participants (Text)</h3>
            <div className="space-y-3">
              <textarea
                rows={6}
                placeholder="Enter participants (one per line):\nName, Email, Phone, Designation\nJohn Doe, john@example.com, 123-456-7890, Manager"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <button
                onClick={handleBulkAdd}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add All Participants
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Participant</h3>
            <form onSubmit={handleAddParticipant} className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                required
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="email"
                placeholder="Email"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Phone"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newParticipant.phone}
                onChange={(e) => setNewParticipant((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Designation"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={newParticipant.designation}
                onChange={(e) => setNewParticipant((prev) => ({ ...prev, designation: e.target.value }))}
              />
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Participant
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Upload from File (CSV/Excel)</h3>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <FileSpreadsheet className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-400' : 'text-gray-400'}`} />
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => document.getElementById('participants-file-upload').click()}
                    className="cursor-pointer focus:outline-none"
                  >
                    <span className="mt-2 block text-sm font-medium text-gray-900 hover:text-blue-600">
                      {dragActive ? 'Drop files here' : 'Drop files here or click to browse'}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">CSV or Excel files only (Max 5MB)</span>
                  </button>
                  <input
                    id="participants-file-upload"
                    name="participants-file-upload"
                    type="file"
                    className="sr-only"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </div>

                {uploadFile && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {uploadFile.name.endsWith('.csv') ? (
                          <FileText className="h-5 w-5 text-blue-600 mr-2" />
                        ) : (
                          <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                        )}
                        <span className="text-sm font-medium text-blue-900 truncate">{uploadFile.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-600">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFile(null);
                            document.getElementById('participants-file-upload').value = '';
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleFileUpload}
              disabled={!uploadFile || uploadLoading}
              className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploadLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Participants
                </>
              )}
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Tips</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Participants marked as winners cannot be edited or deleted.</li>
              <li>Use the search to quickly filter by name, email, phone, or ticket number.</li>
              <li>Bulk entries should be comma-separated (Name, Email, Phone, Designation).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleParticipants;

