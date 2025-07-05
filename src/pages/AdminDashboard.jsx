import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/hrDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');

  // Fetch users and requests
  useEffect(() => {
    axios.get('admin/users/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsers(res.data))
      .catch(() => console.error('Failed to load users'));

    axios.get('admin/regularizations/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setRegularizations(res.data))
      .catch(() => console.error('Failed to load regularizations'));
  }, [token]);

  const fetchAttendance = () => {
    if (!selectedUser || !selectedDate) return;
    const url = `admin/attendance/?user_id=${selectedUser}&date=${selectedDate}`;
    axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAttendance(res.data))
      .catch(() => console.error('Failed to fetch attendance'));
  };

  const handleAdminAction = async (id, action) => {
    const confirm = window.confirm(`Are you sure you want to ${action} this request?`);
    if (!confirm) return;
    try {
      await axios.post(`admin/regularizations/${id}/${action}/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`✅ Request ${action}d successfully`);
      setRegularizations(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('❌ Failed to perform action');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const pendingCount = regularizations.filter(r => r.status === 'pending').length;

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Admin Panel</h3>
        <ul>
          <li onClick={() => setActiveTab('users')}>👥 All Users</li>
          <li onClick={() => setActiveTab('requests')}>
            📩 All Requests
            {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          </li>
          <li onClick={() => setActiveTab('attendance')}>📅 Attendance Viewer</li>
          <li onClick={handleLogout}>🚪 Logout</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <h2>👑 Welcome Admin ({username})</h2>
        </div>

        {activeTab === 'users' && (
          <section>
            <h3>👥 All Users</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'requests' && (
          <section>
            <h3>📩 All Regularization Requests</h3>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Approved By</th>
                  <th>Submitted By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regularizations.map((r, i) => (
                  <tr key={i}>
                    <td>{r.user_name}</td>
                    <td>{r.date}</td>
                    <td>{r.reason}</td>
                    <td>
                      <span className={`badge status-${r.status}`}>{r.status}</span>
                    </td>
                    <td>{r.approved_by_name || '---'}</td>
                    <td>{r.submitted_by_role || 'employee'}</td>
                    <td>
                      {(r.status === 'pending' && (r.submitted_by_role === 'hr' || r.submitted_by_role === 'manager')) ? (
                        <>
                          <button className="approve" onClick={() => handleAdminAction(r.id, 'approve')}>Approve</button>
                          <button className="reject" onClick={() => handleAdminAction(r.id, 'reject')}>Reject</button>
                        </>
                      ) : (
                        '--'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'attendance' && (
          <section>
            <h3>📅 Attendance Viewer</h3>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value=''>-- Select User --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <button onClick={fetchAttendance}>Fetch</button>

            {attendance.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a, i) => (
                    <tr key={i}>
                      <td>{a.date}</td>
                      <td>{a.check_in || '---'}</td>
                      <td>{a.check_out || '---'}</td>
                      <td>{a.total_hours} hrs</td>
                      <td>{a.status === 'green' ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
