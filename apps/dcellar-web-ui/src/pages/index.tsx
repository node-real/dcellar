import Welcome from '../components/welcome';
import { SPProvider } from '@/context/GlobalContext/SPProvider';

export default function Home() {
  return (
    <SPProvider>
      <Welcome />
    </SPProvider>
  );
}
