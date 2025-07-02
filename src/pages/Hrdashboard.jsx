import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/hrDashboard.css';

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [summary, setSummary] = useState({});

  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  useEffect(() => {
    axios.get('hr/summary/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSummary(res.data))
      .catch(() => console.error('Error fetching summary'));

    axios.get('hr/users/', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setUsers(res.data))
      .catch(() => console.error('Error loading users'));

    axios.get('hr/regularizations/', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setRequests(res.data))
      .catch(() => console.error('Error loading regularizations'));
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleAction = async (id, action) => {
    const confirm = window.confirm(`Are you sure you want to ${action} this request?`);
    if (!confirm) return;

    try {
      await axios.post(`manager/regularizations/${id}/${action}/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRequests(prev =>
        prev.map(req =>
          req.id === id ? { ...req, status: action, approved_by_name: username } : req
        )
      );
    } catch {
      alert('❌ Failed to update request');
    }
  };

  const fetchAttendance = async (userId, date = '') => {
    try {
      const res = await axios.get(`hr/attendance/?user_id=${userId}&date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(res.data);
    } catch {
      console.error('Failed to fetch attendance');
    }
  };

  const capitalize = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  const canShowButtons = (req) => {
    return role === 'hr' && req.status === 'pending' &&
      (!req.approved_by_name || req.approved_by_name === '---');
  };

  return (
    <div className="hr-dashboard">
      {/* 🔝 Top Bar */}
      <div className="top-bar">
        <h2> Welcome, {username} ({role})</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      {/* 🔄 Tab Menu */}
      <div className="tab-bar">
        <button onClick={() => setActiveTab('summary')}> Summary</button>
        <button onClick={() => setActiveTab('users')}> Users</button>
        <button onClick={() => setActiveTab('requests')}> Requests</button>
        <button onClick={() => setActiveTab('attendance')}> Attendance</button>
      </div>

      {/* ✅ SUMMARY */}
      {activeTab === 'summary' && (
        <section className="summary-cards">
          <div className="card blue"><h4>👥 Present Today</h4><p>{summary.present_today || 0}</p></div>
          <div className="card green"><h4>✅ On Time</h4><p>{summary.on_time || 0}</p></div>
          <div className="card orange"><h4>⏰ Late Arrivals</h4><p>{summary.late_arrivals || 0}</p></div>
          <div className="card red"><h4>📩 Pending Requests</h4><p>{summary.pending_requests || 0}</p></div>
        </section>
      )}

      {/* ✅ USERS */}
      {activeTab === 'users' && (
        <section>
          <h3> All Users</h3>
          <table>
            <thead>
              <tr><th>ID</th><th>Full Name</th><th>Email</th><th>Role</th></tr>
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

      {/* ✅ REQUESTS */}
      {activeTab === 'requests' && (
        <section>
          <h3> Regularization Requests</h3>
          <table>
            <thead>
              <tr><th>Employee</th><th>Date</th><th>Reason</th><th>Status</th><th>Approved By</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.user_name}</td>
                  <td>{req.date}</td>
                  <td>{req.reason}</td>
                  <td>{capitalize(req.status)}</td>
                  <td>{req.approved_by_name || '---'}</td>
                  <td>
                    {canShowButtons(req) && (
                      <>
                        <button className="approve" onClick={() => handleAction(req.id, 'approve')}>Approve</button>
                        <button className="reject" onClick={() => handleAction(req.id, 'reject')}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ✅ ATTENDANCE */}
      {activeTab === 'attendance' && (
        <section>
          <h3> View Attendance</h3>

          <select
            value={selectedEmployee}
            onChange={(e) => {
              setSelectedEmployee(e.target.value);
              fetchAttendance(e.target.value, filterDate);
            }}
          >
            <option value="">-- Select Employee --</option>
            {users
              .filter(user => user.role === 'employee')
              .map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              if (selectedEmployee) fetchAttendance(selectedEmployee, e.target.value);
            }}
            style={{ margin: '10px 0', padding: '6px' }}
          />

          {attendance.length > 0 && (
            <table>
              <thead>
                <tr><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Total Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={i}>
                    <td>{a.date}</td>
                    <td>{a.check_in ? new Date(a.check_in).toLocaleString() : '---'}</td>
                    <td>{a.check_out ? new Date(a.check_out).toLocaleString() : '---'}</td>
                    <td>{a.total_hours} hrs</td>
                    <td>{a.status === 'green' ? ' Present' : ' Issue'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
};

export default HRDashboard;
