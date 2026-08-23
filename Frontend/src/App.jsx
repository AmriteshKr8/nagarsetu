import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Layout
import MainLayout from './components/MainLayout.jsx';

// Import Pages
import Home from './pages/Home.jsx';
import OfficerLogin from './pages/OfficerLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DepartmentIssues from './pages/DepartmentIssues.jsx';
import FormWrapper from './pages/FormWrapper.jsx';
import Form from './pages/Form.jsx';

// Import Styles
import './styles/Landing.css'; 

export default function App() {
  return (
    <>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<Form />} />
        <Route path="/login" element={<OfficerLogin />} />
        <Route path="/officer" element={<AdminDashboard />} />
        <Route path="/issues" element={<DepartmentIssues />} />
      </Route>
    </Routes>
    </>
  );
}