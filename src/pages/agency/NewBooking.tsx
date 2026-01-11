import React from 'react';
import { MultiPackageBooking } from '../../components/booking';

export const AgencyNewBooking: React.FC = () => {
  return <MultiPackageBooking userRole="agency_admin" />;
};
