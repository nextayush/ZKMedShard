import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DoctorVerify from './pages/DoctorVerify'; // Import new page
import PrivateRoute from './components/PrivateRoute';
import Nav from './components/Nav';

export default function App() {
  return (
    <div className="app">
      <Nav />
      {/* Temporary Nav for testing - usually this goes in Nav component */}
      <div style={{ padding: '10px 20px', background: '#f0f0f0', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
        <small>Quick Links: </small>
        <Link to="/" style={{ marginRight: '15px' }}>Patient Dashboard</Link>
        <Link to="/doctor">Doctor Portal</Link>
      </div>

      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Patient Route */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Doctor Route - Protected so only logged in users (Doctors) can verify */}
          <Route
            path="/doctor"
            element={
              <PrivateRoute>
                <DoctorVerify />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}