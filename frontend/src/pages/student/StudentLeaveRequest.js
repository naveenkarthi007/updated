import React, { useState, useEffect } from 'react';
import { leavesAPI } from '../../services/api';
import { Card, Button, Input, Badge, Table, Modal, Spinner } from '../../components/ui';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function StudentLeaveRequest() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    reason: ''
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      // Backend automatically checks the currently logged-in student, but we can pass student_id if our schema binds it.
      // Wait, in studentPortal we usually fetch based on req.user.id but leaveCtrl is generic.
      // We will pass student_id to getAll filter.
      const res = await leavesAPI.getAll({ student_id: user.student_id });
      setLeaves(res.data.data);
    } catch (err) {
      toast.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.student_id) {
       fetchLeaves();
    } else if (user) {
       // User exists but has no linked student profile — stop the spinner
       setLoading(false);
    }
    // eslint-disable-next-line
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user.student_id) return toast.error('Student profile not linked. Cannot request leave.');
    
    try {
      setSubmitLoading(true);
      await leavesAPI.create({ ...formData, student_id: user.student_id });
      toast.success('Leave request submitted');
      setIsModalOpen(false);
      setFormData({ from_date: '', to_date: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pending request?')) return;
    try {
      await leavesAPI.delete(id);
      toast.success('Request deleted');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete request');
    }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
    return <Badge variant={map[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outpass / Leave Request</h1>
          <p className="text-sm text-gray-500 mt-1">Request permission to leave the hostel</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Apply for Leave
        </Button>
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-bold mb-4">Leave History</h2>
        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table 
              columns={[
                { key: 'from_date', label: 'From Date', render: (val) => new Date(val).toLocaleDateString() },
                { key: 'to_date', label: 'To Date', render: (val) => new Date(val).toLocaleDateString() },
                { key: 'duration', label: 'Duration', render: (_, row) => `${Math.ceil((new Date(row.to_date) - new Date(row.from_date)) / (1000 * 60 * 60 * 24)) + 1} Day(s)` },
                { key: 'reason', label: 'Reason', render: (val) => <div className="max-w-xs truncate" title={val}>{val}</div> },
                { key: 'status', label: 'Status', render: (val) => getStatusBadge(val) },
                { key: 'actions', label: 'Actions', render: (_, row) => (
                  row.status === 'pending' ? (
                    <Button size="sm" variant="outline" onClick={() => handleDelete(row.id)} className="text-red-600 border-red-200">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null
                )}
              ]}
              data={leaves} 
            />
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Outpass">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              type="date"
              label="From Date" 
              required 
              value={formData.from_date} 
              onChange={e => setFormData({...formData, from_date: e.target.value})} 
            />
            <Input 
              type="date"
              label="To Date" 
              required 
              value={formData.to_date} 
              onChange={e => setFormData({...formData, to_date: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave</label>
            <textarea
              required
              className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary min-h-[100px] p-3 border"
              placeholder="Provide a valid reason for your leave request..."
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
