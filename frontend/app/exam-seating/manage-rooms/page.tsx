"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BuildingOfficeIcon, PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface Room {
  id: string;
  num_rows: number;
  num_cols: number;
  capacity: number;
}

export default function ManageRoomsPage() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    num_rows: 5,
    num_cols: 6
  });

  useEffect(() => {
    if (token) {
      fetchRooms();
    }
  }, [token]);

  const fetchRooms = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5001/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRooms(data);
      } else if (data.error) {
        showMessage(data.error, 'error');
        setRooms([]);
      } else {
        setRooms([]);
      }
    } catch (error: any) {
      showMessage(error.message || 'Failed to fetch rooms', 'error');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingRoom) {
        // Update existing room
        const response = await fetch(`http://localhost:5001/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            num_rows: formData.num_rows,
            num_cols: formData.num_cols
          })
        });

        if (!response.ok) throw new Error('Failed to update room');
        showMessage('Room updated successfully!', 'success');
      } else {
        // Create new room
        const response = await fetch('http://localhost:5001/rooms', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create room');
        }
        showMessage('Room created successfully!', 'success');
      }

      fetchRooms();
      closeModal();
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm(`Are you sure you want to delete room ${roomId}?`)) return;
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5001/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete room');

      showMessage('Room deleted successfully!', 'success');
      fetchRooms();
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const openModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        id: room.id,
        num_rows: room.num_rows || 5,
        num_cols: room.num_cols || 6
      });
    } else {
      setEditingRoom(null);
      setFormData({ id: '', num_rows: 5, num_cols: 6 });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({ id: '', num_rows: 5, num_cols: 6 });
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <main className="container mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/exam-seating" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Exam Seating
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 mr-3 text-blue-600" />
            Manage Exam Rooms
          </h1>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Room
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Rooms Grid */}
      {loading ? (
        <div className="text-center py-12">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BuildingOfficeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Exam Rooms Found</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first exam room</p>
          <button
            onClick={() => openModal()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{room.id}</h3>
                  <p className="text-sm text-gray-500">Exam Hall</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal(room)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Rows:</span>
                  <span className="font-semibold">{room.num_rows}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Columns:</span>
                  <span className="font-semibold">{room.num_cols}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total Capacity:</span>
                  <span className="font-bold text-blue-600">{room.capacity} seats</span>
                </div>
              </div>

              {/* Visual Grid Preview */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Layout Preview:</p>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${Math.min(room.num_cols, 6)}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: Math.min(room.num_rows * room.num_cols, 24) }).map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-blue-300 rounded-sm"></div>
                  ))}
                  {room.num_rows * room.num_cols > 24 && (
                    <div className="col-span-full text-xs text-gray-500 text-center mt-1">
                      +{room.num_rows * room.num_cols - 24} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingRoom}
                  required
                  placeholder="e.g., CR-101, HALL-A"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rows
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.num_rows}
                  onChange={(e) => setFormData({ ...formData, num_rows: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.num_cols}
                  onChange={(e) => setFormData({ ...formData, num_cols: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total Capacity:</span>{' '}
                  {formData.num_rows * formData.num_cols} seats
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </main>
    </ProtectedRoute>
  );
}
