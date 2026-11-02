import { CheckInAppointment, AvailableUnit, StaffUser, FlowStep } from '../staff/types';

export type ManagerTab = 
  | 'dashboard'
  | 'facility'
  | 'facility_photos'
  | 'unit_types'
  | 'checkout'
  | 'queue'
  | 'support'
  | 'profile'
  | 'settings';

export type { CheckInAppointment, AvailableUnit, StaffUser, FlowStep };
