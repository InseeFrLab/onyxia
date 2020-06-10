import { useLocalStorage } from '@rehooks/local-storage';

const BETA_TEST_KEY = 'betatest';
const useBetaTest = () => useLocalStorage<boolean>(BETA_TEST_KEY);

export default useBetaTest;
