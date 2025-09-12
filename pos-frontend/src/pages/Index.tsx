
import { PosProvider } from '@/context/PosContext';
import PosPage from './PosPage';

const Index = () => {
  return (
    <PosProvider>
      <PosPage />
    </PosProvider>
  );
};

export default Index;
