import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './lib/api';
import { Spinner } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Mentors from './pages/Mentors';
import MentorDetail from './pages/MentorDetail';
import History from './pages/History';

export default function App() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api('/auth/me') });

  useEffect(() => {
    const onLogout = () => qc.setQueryData(['me'], null);
    window.addEventListener('am:logout', onLogout);
    return () => window.removeEventListener('am:logout', onLogout);
  }, [qc]);

  if (me.isLoading) return <Spinner />;
  if (!me.data) return <Login />;

  return (
    <Layout manager={me.data}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/mentors/:id" element={<MentorDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
