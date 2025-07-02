import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../css/employeeDashboard.css';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [attendance, setAttendance] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [form, setForm] = useState({ date: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [checkinMsg, setCheckinMsg] = useState('');
  const [checkoutMsg, setCheckoutMsg] = useState('');

  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  useEffect(() => {
    axios.get('employee/attendance/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setAttendance(res.data))
      .catch(() => setError('Failed to load attendance.'));

    axios.get('employee/my-regularizations/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setRegularizations(res.data))
      .catch(() => console.error('Failed to load requests'));
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleCheckIn = async () => {
    try {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(10,6); // 10.6AM

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
    try {
      await axios.post('employee/regularize/', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg('✅ Request submitted!');
      setError('');
      setForm({ date: '', reason: '' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setMsg('');
      setError('❌ Failed to submit request.');
    }
  };

  const formatDate = (str) => new Date(str).toLocaleString('en-IN');

  const getTileClass = ({ date }) => {
    const entry = attendance.find(att => new Date(att.date).toDateString() === date.toDateString());
    if (entry) {
      return entry.status === 'green' ? 'green-tile' : 'red-tile';
    }
    return null;
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Employee Panel</h3>
        <ul>
          <li onClick={() => setActiveTab('calendar')}>📅 Attendance Calendar</li>
          <li onClick={() => setActiveTab('table')}>📊 Attendance Table</li>
          <li onClick={() => setActiveTab('regularize')}>📩 Submit Regularization</li>
          <li onClick={() => setActiveTab('history')}>📜 My Requests</li>
          <li onClick={handleLogout}>🚪 Logout</li>
        </ul>
      </div>

      {/* Main Content */}
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

        {activeTab === 'calendar' && (
          <section>
            <h3> Attendance Calendar</h3>
            <Calendar tileClassName={getTileClass} />
          </section>
        )}

        {activeTab === 'table' && (
          <section>
            <h3> Attendance Table</h3>
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
                {attendance.map((item, idx) => (
                  <tr key={idx} className={item.status === 'green' ? 'green' : 'red'}>
                    <td>{item.date}</td>
                    <td>{formatDate(item.check_in)}</td>
                    <td>{item.check_out ? formatDate(item.check_out) : '---'}</td>
                    <td>{item.total_hours.toFixed(2)} hrs</td>
                    <td>
                      {item.status === 'green' ? 'Present' : 'Issue'}
                      {item.is_late && <div className="tag late">Late</div>}
                      {item.is_regularized && <div className="tag reg">Regularized</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'regularize' && (
          <section>
            <h3> Submit Regularization</h3>
            <form onSubmit={handleRegularize}>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
              <textarea
                name="reason"
                placeholder="Reason for late check-in or less hours"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              />
              <button type="submit">Submit</button>
            </form>
            {msg && <p className="success">{msg}</p>}
            {error && <p className="error">{error}</p>}
          </section>
        )}

        {activeTab === 'history' && (
          <section>
            <h3> My Regularization Requests</h3>
            {regularizations.length === 0 ? (
              <p>No regularization requests yet.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Date</th><th>Reason</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {regularizations.map((req, i) => (
                    <tr key={i}>
                      <td>{req.date}</td>
                      <td>{req.reason}</td>
                      <td>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</td>
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

export default EmployeeDashboard;
