import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { studentsAPI, roomsAPI } from '../../../services/api';
import { Input, Select, Textarea, Modal } from '../../../components/ui';
import BulkUploadModal from '../../../components/ui/BulkUploadModal';
import { Upload } from 'lucide-react';

const COLORS = {
  primarybg: '#EEF1F9',
  secondarybg: '#FFFFFF',
  primary: '#7D53F6',
  primarydull: '#9F74F7',
  green: '#008000',
  pending: '#F0B041',
  red: '#DC2626',
  primarytext: '#000000',
  secondarytext: '#5F6388',
  scroll: '#D1D1D1',
  scrollHover: '#9CA3AF',
  skyblue: '#0388FC',
};

const DEPTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD'];

const defaultForm = {
  name: '',
  register_no: '',
  department: 'CSE',
  year: 1,
  phone: '',
  email: '',
  address: '',
  joined_date: '',
};

const pageSize = 15;

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    dept: '',
    year: '',
  });
  const [modal, setModal] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [allotRoomId, setAllotRoomId] = useState('');

  const loadStudents = useCallback(() => {
    setLoading(true);

    studentsAPI
      .getAll({
        search,
        ...filters,
        page,
        limit: pageSize,
      })
      .then((res) => {
        setStudents(res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {
        toast.error('Failed to load students.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [search, filters, page]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const resetModalState = () => {
    setModal(null);
    setSelected(null);
    setAllotRoomId('');
    setRooms([]);
  };

  const handleInput = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openAdd = () => {
    setSelected(null);
    setForm(defaultForm);
    setModal('add');
  };

  const openEdit = (student) => {
    setSelected(student);
    setForm({
      name: student.name || '',
      register_no: student.register_no || '',
      department: student.department || 'CSE',
      year: student.year || 1,
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      joined_date: student.joined_date?.slice(0, 10) || '',
    });
    setModal('edit');
  };

  const openView = (student) => {
    setSelected(student);
    setModal('view');
  };

  const openAllot = async (student) => {
    try {
      setSelected(student);
      const res = await roomsAPI.getAll({ status: 'available' });
      const availableRooms = (res.data.data || []).filter(
        (room) => room.occupied < room.capacity
      );
      setRooms(availableRooms);
      setAllotRoomId('');
      setModal('allot');
    } catch {
      toast.error('Failed to load available rooms.');
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      if (modal === 'add') {
        await studentsAPI.create(form);
        toast.success('Student added successfully.');
      } else if (modal === 'edit' && selected?.id) {
        await studentsAPI.update(selected.id, form);
        toast.success('Student updated successfully.');
      }

      resetModalState();
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student record?')) return;

    try {
      await studentsAPI.delete(id);
      toast.success('Student deleted successfully.');
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed.');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleExport = async () => {
    try {
      const res = await studentsAPI.exportCSV();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.csv';
      a.click();

      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully.');
    } catch {
      toast.error('Export failed.');
    }
  };

  const handleAllocate = async () => {
    if (!selected?.id || !allotRoomId) return;

    setSaving(true);
    try {
      const { allocationsAPI } = await import('../services/api');
      await allocationsAPI.allocate({
        student_id: selected.id,
        room_id: Number(allotRoomId),
      });

      toast.success('Room allocated successfully.');
      resetModalState();
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Allocation failed.');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const FormBody = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => handleInput('name', e.target.value)}
          placeholder="Enter full name"
        />
      </div>

      <Input
        label="Register No"
        value={form.register_no}
        onChange={(e) => handleInput('register_no', e.target.value)}
        placeholder="e.g. 22CS001"
        disabled={modal === 'edit'}
      />

      <Select
        label="Department"
        value={form.department}
        onChange={(e) => handleInput('department', e.target.value)}
      >
        {DEPTS.map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </Select>

      <Select
        label="Year"
        value={form.year}
        onChange={(e) => handleInput('year', Number(e.target.value))}
      >
        {[1, 2, 3, 4].map((year) => (
          <option key={year} value={year}>
            Year {year}
          </option>
        ))}
      </Select>

      <Input
        label="Phone Number"
        value={form.phone}
        onChange={(e) => handleInput('phone', e.target.value)}
        placeholder="10-digit mobile number"
      />

      <Input
        label="Email Address"
        type="email"
        value={form.email}
        onChange={(e) => handleInput('email', e.target.value)}
        placeholder="student@email.com"
      />

      <Input
        label="Joining Date"
        type="date"
        value={form.joined_date}
        onChange={(e) => handleInput('joined_date', e.target.value)}
      />

      <div className="md:col-span-2">
        <Textarea
          label="Address"
          value={form.address}
          onChange={(e) => handleInput('address', e.target.value)}
          placeholder="Enter student address"
        />
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{
        background: 'transparent',
        color: COLORS.primarytext,
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div
          className="rounded-[28px] p-6 md:p-8 border shadow-sm"
          style={{
            backgroundColor: COLORS.secondarybg,
            borderColor: '#D8DCF0',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[2px]"
                style={{ color: COLORS.skyblue }}
              >
                Hostel Management
              </p>
              <h1
                className="text-3xl md:text-4xl font-bold mt-1"
                style={{ color: COLORS.primary }}
              >
                Student Records
              </h1>
              <p className="text-sm mt-2" style={{ color: COLORS.secondarytext }}>
                Manage student details and room allocation in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2"
                  style={{
                    borderColor: '#D8DCF0',
                    backgroundColor: COLORS.secondarybg,
                    color: COLORS.primarytext,
                  }}
                >
                  <Upload size={16} />
                  Import Students
                </button>

              <button
                onClick={openAdd}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: COLORS.primary,
                  color: COLORS.secondarybg,
                  boxShadow: '0 10px 25px rgba(125, 83, 246, 0.25)',
                }}
              >
                + Add Student
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5 border mb-6"
            style={{
              backgroundColor: '#F9FAFD',
              borderColor: '#D8DCF0',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr] gap-3">
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: COLORS.secondarytext }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  value={search}
                  placeholder="Search by name, register no, or room..."
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none border"
                  style={{
                    backgroundColor: COLORS.secondarybg,
                    borderColor: '#D8DCF0',
                    color: COLORS.primarytext,
                  }}
                />
              </div>

              <select
                value={filters.dept}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, dept: e.target.value }));
                  setPage(1);
                }}
                className="rounded-xl px-4 py-3 text-sm outline-none border"
                style={{
                  backgroundColor: COLORS.secondarybg,
                  borderColor: '#D8DCF0',
                  color: COLORS.primarytext,
                }}
              >
                <option value="">All Departments</option>
                {DEPTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={filters.year}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, year: e.target.value }));
                  setPage(1);
                }}
                className="rounded-xl px-4 py-3 text-sm outline-none border"
                style={{
                  backgroundColor: COLORS.secondarybg,
                  borderColor: '#D8DCF0',
                  color: COLORS.primarytext,
                }}
              >
                <option value="">All Years</option>
                {[1, 2, 3, 4].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>

            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: '#D8DCF0',
              backgroundColor: COLORS.secondarybg,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr style={{ backgroundColor: COLORS.primarybg }}>
                    {[
                      'Roll No',
                      'Student Name',
                      'Department & Year',
                      'Room',
                      'Phone',
                      'Actions',
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-5 py-4 text-left text-[11px] uppercase tracking-[1.4px] font-bold border-b"
                        style={{
                          color: COLORS.primary,
                          borderColor: '#D8DCF0',
                        }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-12"
                        style={{ color: COLORS.secondarytext }}
                      >
                        Loading student records...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-12"
                        style={{ color: COLORS.secondarytext }}
                      >
                        No student records found.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-[#F8F9FD] transition-colors"
                        style={{ borderBottom: '1px solid #D8DCF0' }}
                      >
                        <td className="px-5 py-4 font-mono text-[12px]">
                          {student.register_no}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{
                                backgroundColor: 'rgba(125,83,246,0.12)',
                                color: COLORS.primary,
                              }}
                            >
                              {student.name
                                ?.split(' ')
                                .map((word) => word[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold">{student.name}</p>
                              <p
                                className="text-[12px]"
                                style={{ color: COLORS.secondarytext }}
                              >
                                {student.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4" style={{ color: COLORS.secondarytext }}>
                          {student.department} • Year {student.year}
                        </td>

                        <td className="px-5 py-4">
                          {student.room_number
                            ? `${student.block?.[0] || ''}-${student.room_number}`
                            : '—'}
                        </td>

                        <td
                          className="px-5 py-4 font-mono text-[12px]"
                          style={{ color: COLORS.secondarytext }}
                        >
                          {student.phone || '—'}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openView(student)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                              style={{
                                backgroundColor: COLORS.skyblue,
                                color: COLORS.secondarybg,
                              }}
                            >
                              View
                            </button>

                            <button
                              onClick={() => openEdit(student)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                              style={{
                                backgroundColor: COLORS.primary,
                                color: COLORS.secondarybg,
                              }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(student.id)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                              style={{
                                backgroundColor: COLORS.red,
                                color: COLORS.secondarybg,
                              }}
                            >
                              Delete
                            </button>

                            {!student.room_id && (
                              <button
                                onClick={() => openAllot(student)}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                                style={{
                                  backgroundColor: COLORS.pending,
                                  color: COLORS.secondarybg,
                                }}
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {total > pageSize && (
              <div
                className="flex flex-col md:flex-row items-center justify-between gap-3 px-5 py-4 border-t"
                style={{ borderColor: '#D8DCF0' }}
              >
                <p className="text-sm" style={{ color: COLORS.secondarytext }}>
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{' '}
                  {total}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50"
                    style={{
                      borderColor: '#D8DCF0',
                      backgroundColor: COLORS.secondarybg,
                    }}
                  >
                    Previous
                  </button>

                  <span
                    className="px-3 text-sm font-medium"
                    style={{ color: COLORS.secondarytext }}
                  >
                    {page} / {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50"
                    style={{
                      borderColor: '#D8DCF0',
                      backgroundColor: COLORS.secondarybg,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Import Students"
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'register_no', label: 'Register No' },
          { key: 'department', label: 'Department' },
          { key: 'year', label: 'Year' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'address', label: 'Address' }
        ]}
        sampleData={[
          { name: 'John Doe', register_no: '22CS001', department: 'CSE', year: '1', phone: '1234567890', email: 'john@example.com', address: '123 Main St' }
        ]}
        uploadEndpoint="/bulk/students"
        onSuccess={() => { setIsBulkModalOpen(false); loadStudents(); }}
      />

      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={resetModalState}
        title={modal === 'add' ? 'Add New Student' : 'Edit Student'}
        size="lg"
      >
        <FormBody />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#D8DCF0]">
          <button
            onClick={resetModalState}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
            style={{
              borderColor: '#D8DCF0',
              backgroundColor: COLORS.secondarybg,
              color: COLORS.primarytext,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.secondarybg,
            }}
          >
            {modal === 'add' ? 'Add Student' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal
        open={modal === 'view'}
        onClose={resetModalState}
        title="Student Profile"
        size="md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-[#D8DCF0]">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{
                  backgroundColor: COLORS.primary,
                  color: COLORS.secondarybg,
                }}
              >
                {selected.name
                  ?.split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)}
              </div>

              <div>
                <h3 className="text-xl font-bold" style={{ color: COLORS.primary }}>
                  {selected.name}
                </h3>
                <p
                  className="font-mono text-[12px]"
                  style={{ color: COLORS.secondarytext }}
                >
                  {selected.register_no}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                ['Department', selected.department],
                ['Year', `Year ${selected.year}`],
                ['Phone', selected.phone || 'N/A'],
                ['Email', selected.email || 'N/A'],
                [
                  'Room',
                  selected.room_number
                    ? `${selected.room_number} (Block ${selected.block})`
                    : 'Unassigned',
                ],
                ['Joined Date', selected.joined_date?.slice(0, 10) || 'N/A'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p
                    className="text-[11px] uppercase tracking-[1.5px] font-bold mb-1.5"
                    style={{ color: COLORS.secondarytext }}
                  >
                    {label}
                  </p>
                  <p style={{ color: COLORS.primarytext }}>{value}</p>
                </div>
              ))}

              {selected.address && (
                <div className="md:col-span-2">
                  <p
                    className="text-[11px] uppercase tracking-[1.5px] font-bold mb-1.5"
                    style={{ color: COLORS.secondarytext }}
                  >
                    Address
                  </p>
                  <p style={{ color: COLORS.primarytext }}>{selected.address}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-[#D8DCF0]">
              <button
                onClick={() => openEdit(selected)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: COLORS.skyblue,
                  color: COLORS.secondarybg,
                }}
              >
                Edit
              </button>

              {!selected.room_id && (
                <button
                  onClick={() => openAllot(selected)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.secondarybg,
                  }}
                >
                  Allocate Room
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modal === 'allot'}
        onClose={resetModalState}
        title="Allocate Room"
        size="md"
      >
        {selected && (
          <div className="space-y-5">
            <p className="text-sm" style={{ color: COLORS.secondarytext }}>
              Allocating room for{' '}
              <span className="font-semibold" style={{ color: COLORS.primarytext }}>
                {selected.name}
              </span>
            </p>

            <div>
              <label
                className="block text-[12px] font-semibold mb-2"
                style={{ color: COLORS.primary }}
              >
                Select Available Room
              </label>

              <select
                value={allotRoomId}
                onChange={(e) => setAllotRoomId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none border"
                style={{
                  backgroundColor: COLORS.secondarybg,
                  borderColor: '#D8DCF0',
                  color: COLORS.primarytext,
                }}
              >
                <option value="">Choose a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number} (Block {room.block}) • {room.occupied}/
                    {room.capacity} occupied
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-[#D8DCF0]">
              <button
                onClick={resetModalState}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
                style={{
                  borderColor: '#D8DCF0',
                  backgroundColor: COLORS.secondarybg,
                  color: COLORS.primarytext,
                }}
              >
                Cancel
              </button>

              <button
                disabled={!allotRoomId || saving}
                onClick={handleAllocate}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: COLORS.green,
                  color: COLORS.secondarybg,
                }}
              >
                Allocate
              </button>
            </div>
          </div>
        )}
      </Modal>


    </div>
  );
}
