import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/managerDashboard.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [attendance, setAttendance] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [form, setForm] = useState({ date: '', reason: '' });
  const [checkinMsg, setCheckinMsg] = useState('');
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  const fetchMyAttendance = () => {
    axios.get('employee/attendance/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setAttendance(res.data))
      .catch(() => setError('❌ Failed to load attendance.'));
  };

  const fetchTeamAttendance = () => {
    axios.get('manager/attendance/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setTeamAttendance(res.data))
      .catch(() => console.error('Error fetching team attendance'));
  };

  const fetchTeamRequests = () => {
    axios.get('manager/regularizations/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        const pending = res.data.filter(req => req.status === 'pending');
        setRequests(pending);
      })
      .catch(() => console.error('Error fetching requests'));
  };

  const fetchMyRequests = () => {
    axios.get('hr/my-regularizations/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setMyRequests(res.data))
      .catch(() => console.error('Error fetching my requests'));
  };

  useEffect(() => {
    fetchMyAttendance();
    fetchTeamAttendance();
    fetchTeamRequests();
    fetchMyRequests();
  }, []);

  const handleCheckIn = async () => {
    try {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(9, 30, 0, 0);
      if (now > cutoff) {
        const confirmLate = window.confirm('⚠️ You are checking in late. Submit regularization?');
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
    try {
      await axios.post('hr-manager/regularize/', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg('✅ Request submitted');
      setForm({ date: '', reason: '' });
      fetchMyRequests();
    } catch {
      setError('❌ Failed to submit');
    }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.post(`manager/regularizations/${id}/${action}/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch {
      alert('❌ Failed to update request');
    }
  };

  const getTileClass = ({ date }) => {
    const entry = attendance.find(a => new Date(a.date).toDateString() === date.toDateString());
    if (!entry) return null;
    const { is_late, is_regularized, total_hours } = entry;
    const sufficient = total_hours >= 9;
    if (!is_late && sufficient) return 'green-tile';
    if (is_late && sufficient && is_regularized) return 'green-tile';
    return 'red-tile';
  };

  const formatDate = str => new Date(str).toLocaleString('en-IN');
  const capitalize = str => str ? str[0].toUpperCase() + str.slice(1) : '';
  const formatTime = datetime => datetime ? new Date(datetime).toLocaleTimeString('en-IN') : '---';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h3>Manager Panel</h3>
        <ul>
          <li onClick={() => setActiveTab('calendar')}>📅 My Attendance Calendar</li>
          <li onClick={() => setActiveTab('table')}>📊 My Attendance Table</li>
          <li onClick={() => setActiveTab('regularize')}>✍️ Submit Regularization</li>
          <li onClick={() => setActiveTab('my-requests')}>📜 My Requests</li>
          <li onClick={() => setActiveTab('requests')}>📝 Team Requests</li>
          <li onClick={() => setActiveTab('team')}>👥 Team Attendance</li>
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

        {activeTab === 'calendar' && (
          <section>
            <h3>My Attendance Calendar</h3>
            <Calendar tileClassName={getTileClass} />
          </section>
        )}

        {activeTab === 'table' && (
          <section>
            <h3>My Attendance Records</h3>
            <table>
              <thead><tr><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Total Hours</th></tr></thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={i} className={a.status === 'green' ? 'green' : 'red'}>
                    <td>{a.date}</td>
                    <td>{formatDate(a.check_in)}</td>
                    <td>{a.check_out ? formatDate(a.check_out) : '---'}</td>
                    <td>{a.total_hours.toFixed(2)} hrs</td>
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
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <textarea placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
              <button type="submit">Submit</button>
            </form>
          </section>
        )}

        {activeTab === 'my-requests' && (
          <section>
            <h3>My Regularization Requests</h3>
            {myRequests.length === 0 ? (
              <p>No requests yet.</p>
            ) : (
              <table className="styled-request-table">
                <thead><tr><th>Date</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                  {myRequests.map((req, i) => (
                    <tr key={i}>
                      <td>{req.date}</td>
                      <td>{req.reason}</td>
                      <td><span className={`status-tag ${req.status}`}>{capitalize(req.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {activeTab === 'requests' && (
          <section>
            <h3>Pending Requests from Team</h3>
            <table>
              <thead><tr><th>Employee</th><th>Date</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td>{req.user_name}</td>
                    <td>{req.date}</td>
                    <td>{req.reason}</td>
                    <td>{capitalize(req.status)}</td>
                    <td>
                      <button className="approve" onClick={() => handleAction(req.id, 'approve')}>Approve</button>
                      <button className="reject" onClick={() => handleAction(req.id, 'reject')}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'team' && (
          <section>
            <h3>Team Attendance</h3>
            <table>
              <thead><tr><th>Employee</th><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Total Hours</th></tr></thead>
              <tbody>
                {teamAttendance.map((item, i) => (
                  <tr key={i} className={item.total_hours >= 9 ? 'green-row' : 'red-row'}>
                    <td>{item.user_name}</td>
                    <td>{item.date}</td>
                    <td>{formatTime(item.check_in)}</td>
                    <td>{formatTime(item.check_out)}</td>
                    <td>{item.total_hours.toFixed(2)} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
