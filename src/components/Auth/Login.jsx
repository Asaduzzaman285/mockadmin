import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Import external CSS file

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    try {
      axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
      axios.defaults.headers.post['Content-Type'] = 'application/json';
      const response = await axios.post('https://mocktestadminapi.lyricistsassociationbd.com/api/v1/login', {
        email,
        password,
      });

      if (response.data.status === 'success') {
        localStorage.setItem('authToken', response.data.data.user.access_token);
        localStorage.setItem('userName', response.data.data.user.name);
        navigate('/admin/home');
      } else {
        setError('Invalid email/username or password.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
      <h2 className="text-center mb-4">
  {/* <img src="/assets/lyricist-logo.png" alt="Logo" width="150" /> */}
</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="text"
            name="email"
            id="email"
            className="form-control"
            placeholder="Enter your email "
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            className="form-control"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">Login</button>
      </form>
    </div>
  );
};

export default Login;
