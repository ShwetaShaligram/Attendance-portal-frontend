import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/register.css';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',       // ✅ Full name instead of username
    email: '',
    password: '',
    confirm_password: '',
    role: 'employee',
    manager: '',
  });

  const [managers, setManagers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ✅ Fetch managers (GET /api/managers/)
  useEffect(() => {
    axios
      axios.get(import.meta.env.VITE_API_URL + '/managers/', {
        headers: { Authorization: undefined }, // No auth needed
      })
      .then((res) => setManagers(res.data))
      .catch((err) => {
        console.error('Error fetching managers:', err);
        setError('Could not load managers list.');
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
      ...formData,
      manager: formData.role === 'employee' ? formData.manager : null,
    };

    try {
      const response = await axios.post(import.meta.env.VITE_API_URL + '/register/', dataToSend, {
        headers: { 'Content-Type': 'application/json' },
      });

      setMessage('✅ Registered successfully!');
      setError('');

      setTimeout(() => navigate('/'), 1500); // redirect to login
    } catch (err) {
      const errData = err.response?.data;
      console.error('🚨 Registration Error:', errData);

      if (errData?.password) {
        setError(`Password Error: ${errData.password[0]}`);
      } else if (errData?.non_field_errors) {
        setError(`${errData.non_field_errors[0]}`);
      } else if (errData?.email) {
        setError(`Email Error: ${errData.email[0]}`);
      } else {
        setError('Registration failed. Please check your details.');
      }

      setMessage('');
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>

      {message && <p className="msg success">{message}</p>}
      {error && <p className="msg error">{error}</p>}

      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm Password"
          value={formData.confirm_password}
          onChange={handleChange}
          required
        />

        <select name="role" onChange={handleChange} value={formData.role}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
        </select>

        {formData.role === 'employee' && (
          <select
            name="manager"
            value={formData.manager}
            onChange={handleChange}
            required
          >
            <option value="">Select Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.full_name}
              </option>
            ))}
          </select>
        )}

        <button type="submit">Register</button>

        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          Already registered? <a href="/">Login here</a>
        </p>
      </form>
    </div>
  );
};

export default Register;
