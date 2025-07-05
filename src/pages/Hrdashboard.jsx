// HRDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/hrDashboard.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({});
  const [checkinMsg, setCheckinMsg] = useState('');
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ date: '', reason: '' });
  const [regularizations, setRegularizations] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, usersRes, regRes, myRegRes] = await Promise.all([
          axios.get('hr/summary/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('hr/users/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('hr/regularizations/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('hr/my-regularizations/', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setSummary(summaryRes.data);
        setUsers(usersRes.data);
        setRequests(regRes.data);
        setRegularizations(myRegRes.data);
        fetchAttendance(username); // ✅ HR chi initial attendance load
      } catch (err) {
        console.error('Data fetch failed', err);
      }
    };

    fetchData();
  }, [token, username]);

  const fetchAttendance = (usernameOrId, date = '') => {
    const param = isNaN(usernameOrId) ? `username=${usernameOrId}` : `user_id=${usernameOrId}`;
    axios.get(`hr/attendance/?${param}&date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setAttendance(res.data))
      .catch(() => setError('Failed to load attendance.'));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleCheckIn = async () => {
    try {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(9, 30, 0, 0);

      if (now > cutoff) {
        const confirmLate = window.confirm('⚠️ You are checking in late! You may need to submit a regularization request.');
        if (!confirmLate) return;
      }

      const res = await axios.post('employee/checkin/', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCheckinMsg(res.data.message);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setCheckinMsg(err.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await axios.post('employee/checkout/', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCheckoutMsg(res.data.message);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setCheckoutMsg(err.response?.data?.error || 'Check-out failed');
    }
  };

  const handleRegularize = async (e) => {
    e.preventDefault();
    const alreadyExists = regularizations.some(req => req.date === form.date);
    if (alreadyExists) {
      alert(`⚠️ You already submitted a request for ${form.date}. Only one per day allowed.`);
      return;
    }

    try {
      await axios.post('hr-manager/regularize/', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg('✅ Request submitted!');
      setError('');
      setForm({ date: '', reason: '' });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setMsg('');
      setError('❌ Failed to submit request.');
    }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.post(`admin/regularizations/${id}/${action}/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(prev =>
        prev.map(req => req.id === id ? { ...req, status: action, approved_by_name: username } : req)
      );
      setMsg(`✅ Request ${action}d`);
      setTimeout(() => setMsg(''), 2000);
    } catch {
      setError(`❌ Failed to ${action}`);
      setTimeout(() => setError(''), 2000);
    }
  };

  const formatDate = (str) => new Date(str).toLocaleString('en-IN');
  const capitalize = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : '';

  const getTileClass = ({ date }) => {
    const entry = attendance.find(att => new Date(att.date).toDateString() === date.toDateString());
    if (!entry) return null;
    const { is_late, is_regularized, total_hours } = entry;
    const sufficientHours = total_hours >= 9;
    if (!is_late && sufficientHours) return 'green-tile';
    if (is_late && sufficientHours && is_regularized) return 'green-tile';
    return 'red-tile';
  };

  const canShowButtons = (req) => req.status === 'pending' && req.user_name !== username;

  return (
    <div className="layout">
      <div className="sidebar">
        <h3>HR Panel</h3>
        <ul>
          <li onClick={() => setActiveTab('summary')}>📈 Summary</li>
          <li onClick={() => setActiveTab('calendar')}>📅 Attendance Calendar</li>
          <li onClick={() => setActiveTab('table')}>📊 Attendance Table</li>
          <li onClick={() => setActiveTab('regularize')}>✍️ Submit Regularization</li>
          <li onClick={() => setActiveTab('history')}>📜 My Requests</li>
          <li onClick={() => setActiveTab('requests')}>📝 All Regularizations</li>
          <li onClick={() => setActiveTab('users')}>👥 All Users</li>
          <li onClick={handleLogout}>🚪 Logout</li>
        </ul>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <h2>Welcome, {username} ({role})</h2>
          <div className="btn-group">
            <button onClick={handleCheckIn}>Check In</button>
            <button onClick={handleCheckOut}>Check Out</button>
          </div>
        </div>

        {checkinMsg && <p className="info-msg">{checkinMsg}</p>}
        {checkoutMsg && <p className="info-msg">{checkoutMsg}</p>}
        {msg && <p className="success-msg">{msg}</p>}
        {error && <p className="error-msg">{error}</p>}

        {activeTab === 'summary' && (
          <section className="summary-cards">
            <div className="card blue"><h4>👥 Present Today</h4><p>{summary.present_today || 0}</p></div>
            <div className="card green"><h4>✅ On Time</h4><p>{summary.on_time || 0}</p></div>
            <div className="card orange"><h4>⏰ Late Arrivals</h4><p>{summary.late_arrivals || 0}</p></div>
            <div className="card red"><h4>📩 Pending Requests</h4><p>{summary.pending_requests || 0}</p></div>
          </section>
        )}

        {activeTab === 'calendar' && (
          <section>
            <h3>Attendance Calendar</h3>
            <Calendar tileClassName={getTileClass} />
          </section>
        )}

        {activeTab === 'table' && (
          <section>
            <h3>View Attendance</h3>
            <div style={{ marginBottom: '10px' }}>
              <select value={selectedUser} onChange={(e) => {
                setSelectedUser(e.target.value);
                fetchAttendance(e.target.value, selectedDate);
              }}>
                <option value="">-- Select Employee --</option>
            
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
              <input type="date" value={selectedDate} onChange={(e) => {
                setSelectedDate(e.target.value);
                if (selectedUser) fetchAttendance(selectedUser, e.target.value);
              }} />
            </div>
            <table>
              <thead><tr><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Total Hours</th><th>Status</th></tr></thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={i} className={a.status === 'green' ? 'green' : 'red'}>
                    <td>{a.date}</td>
                    <td>{formatDate(a.check_in)}</td>
                    <td>{a.check_out ? formatDate(a.check_out) : '---'}</td>
                    <td>{a.total_hours.toFixed(2)} hrs</td>
                    <td>
                      {a.status === 'green' ? '✅ Present' : '❌ Issue'}
                      {a.is_late && <div className="tag late">Late</div>}
                      {a.is_regularized && <div className="tag reg">Regularized</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'regularize' && (
          <section>
            <h3>Submit Regularization</h3>
            <form onSubmit={handleRegularize}>
              <input type="date" name="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <textarea name="reason" placeholder="Reason for regularization" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
              <button type="submit">Submit</button>
            </form>
          </section>
        )}

        {activeTab === 'history' && (
          <section>
            <h3>My Regularization Requests</h3>
            {regularizations.length === 0 ? (
              <p>No regularization requests yet.</p>
            ) : (
              <table><thead><tr><th>Date</th><th>Reason</th><th>Status</th></tr></thead><tbody>
                {regularizations.map((req, i) => (
                  <tr key={i}><td>{req.date}</td><td>{req.reason}</td><td>{capitalize(req.status)}</td></tr>
                ))}
              </tbody></table>
            )}
          </section>
        )}

        {activeTab === 'requests' && (
  <section>
    <h3>All Regularization Requests</h3>
    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Date</th>
          <th>Reason</th>
          <th>Status</th>
          <th>Approved By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {requests
          .filter(req => req.submitted_by_role === 'employee') // ✅ Only show employee-submitted requests
          .map(req => (
            <tr key={req.id}>
              <td>{req.user_name}</td>
              <td>{req.date}</td>
              <td>{req.reason}</td>
              <td>{capitalize(req.status)}</td>
              <td>{req.approved_by_name || '---'}</td>
              <td>
                {canShowButtons(req) && (
                  <>
                    <button className="approve" onClick={() => handleAction(req.id, 'approve')}>
                      Approve
                    </button>
                    <button className="reject" onClick={() => handleAction(req.id, 'reject')}>
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </section>
)}


        {activeTab === 'users' && (
          <section>
            <h3>All Users</h3>
            <table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>
              {users.map(user => (
                <tr key={user.id}><td>{user.id}</td><td>{user.full_name}</td><td>{user.email}</td><td>{user.role}</td></tr>
              ))}
            </tbody></table>
          </section>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;
