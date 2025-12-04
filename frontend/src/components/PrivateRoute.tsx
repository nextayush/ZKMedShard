import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../services/auth';

type Props = {
  children: JSX.Element;
};

export default function PrivateRoute({ children }: Props) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
