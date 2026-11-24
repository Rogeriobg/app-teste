import { AppProvider, useApp } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import PsychologistDashboard from './src/screens/PsychologistDashboard';
import PatientsScreen from './src/screens/PatientsScreen';
import PatientReportsScreen from './src/screens/PatientReportsScreen';

function MainNavigator() {
  const { currentUser, activeScreen, selectedPatientId, selectedPatientName } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (activeScreen === 'patients') {
    return <PatientsScreen />;
  }

  if (activeScreen === 'reports' && selectedPatientId && selectedPatientName) {
    return (
      <PatientReportsScreen
        route={{ params: { patientId: selectedPatientId, patientName: selectedPatientName } }}
      />
    );
  }

  return <PsychologistDashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <MainNavigator />
    </AppProvider>
  );
}
