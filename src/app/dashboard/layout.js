'use client';

import PropTypes from 'prop-types';
// auth
// components
import DashboardLayout from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export default function Layout({ children }) {
  return (
    // <AuthGuard>
    <DashboardLayout>{children}</DashboardLayout>
    // </AuthGuard>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
};
