import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      email: credentials.email.trim(), // ✅ Changed from username to email
      password: credentials.password,
    };

    try {
      const res = await axios.post('http://localhost:8000/api/login/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { access, refresh, user } = res.data;

      if (!access || !user) {
        throw new Error('Invalid response from server');
      }

      // ✅ Store details
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('username', user.full_name); // ✅ use full_name
      localStorage.setItem('role', user.role);

      // ✅ Redirect based on role
      const role = user?.role?.toLowerCase();
      switch (role) {
        case 'employee':
          navigate('/employee-dashboard');
          break;
        case 'manager':
          navigate('/manager-dashboard');
          break;
        case 'hr':
          navigate('/hr-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
      const msg =
        err.response?.status === 401
          ? ' Invalid email or password'
          : err.response?.data?.error || ' Something went wrong. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="login-container">
      <h2> Login</h2>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          name="email"
          placeholder="Email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>

        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          Not registered? <a href="/register">Register here</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
