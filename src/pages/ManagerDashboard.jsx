import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/managerDashboard.css';

const ManagerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState({ requests: true, attendance: true });

  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  // Fetch pending regularizations
  useEffect(() => {
    axios.get('manager/regularizations/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        const pending = res.data.filter(req => req.status === 'pending');
        setRequests(pending);
      })
      .catch(() => console.error('Error fetching regularizations'))
      .finally(() => setLoading(prev => ({ ...prev, requests: false })));
  }, [token]);

  // Fetch team attendance
  useEffect(() => {
    axios.get('manager/attendance/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setAttendance(res.data))
      .catch(() => console.error('Error fetching attendance'))
      .finally(() => setLoading(prev => ({ ...prev, attendance: false })));
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleAction = async (id, action) => {
    if (!window.confirm(`Confirm to ${action} this request?`)) return;

    try {
      await axios.post(`manager/regularizations/${id}/${action}/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch {
      alert('❌ Failed to update request.');
    }
  };

  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

  const formatTime = datetime =>
    datetime ? new Date(datetime).toLocaleTimeString('en-IN') : '---';

  return (
    <div className="manager-dashboard">
      {/* Top bar */}
      <div className="top-bar">
        <h2> Welcome, {username} ({role})</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      {/* Regularization Requests */}
      <section>
        <h3> Pending Regularization Requests</h3>
        {loading.requests ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="empty-msg"> No pending requests.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.user_name}</td>
                  <td>{req.date}</td>
                  <td>{req.reason}</td>
                  <td>
                    <span className={`badge status-${req.status}`}>
                      {capitalize(req.status)}
                    </span>
                  </td>
                  <td>
                    <button className="approve" onClick={() => handleAction(req.id, 'approve')}>
                       Approve
                    </button>
                    <button className="reject" onClick={() => handleAction(req.id, 'reject')}>
                       Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Team Attendance */}
      <section>
        <h3> Team Attendance Report</h3>
        {loading.attendance ? (
          <p>Loading attendance...</p>
        ) : attendance.length === 0 ? (
          <p className="empty-msg">No attendance records found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((item, idx) => (
                <tr
                  key={idx}
                  className={item.total_hours >= 9 ? 'green-row' : 'red-row'}
                >
                  <td>{item.user_name}</td>
                  <td>{item.date}</td>
                  <td>{formatTime(item.check_in)}</td>
                  <td>{formatTime(item.check_out)}</td>
                  <td>{item.total_hours.toFixed(2)} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default ManagerDashboard;
