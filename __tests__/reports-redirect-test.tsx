import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import PatientReportsRedirect from '@/app/patients/[patientId]/reports';

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;

describe('Rota legada /patients/[id]/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redireciona para a tela de detalhes, fonte única dos prontuários', async () => {
    mockedUseLocalSearchParams.mockReturnValue({ patientId: 'p1' });

    await render(<PatientReportsRedirect />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/patients/p1/details');
    });
  });
});
