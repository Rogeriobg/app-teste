import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

/**
 * Rota legada `/patients/[patientId]/reports`.
 *
 * O prontuário de um paciente tem **uma única fonte**: a tela de detalhes
 * (`/patients/[patientId]/details`), que lista os prontuários ativos e
 * arquivados e concentra todo o CRUD (criar, editar, arquivar,
 * restaurar, excluir).
 *
 * Antes existia aqui uma segunda tela com o **mesmo** CRUD — o QA-6
 * registrou a duplicidade como bug médio: qualquer correção precisava
 * ser feita em dois lugares e as duas listas podiam divergir.
 *
 * Esta rota agora só redireciona, para que links antigos continuem
 * funcionando sem manter código duplicado.
 */
export default function PatientReportsRedirect() {
  const { patientId } = useLocalSearchParams<{ patientId?: string | string[] }>();
  const id = typeof patientId === 'string' ? patientId : String(patientId ?? '');

  useEffect(() => {
    router.replace(`/patients/${id}/details`);
  }, [id]);

  return null;
}
