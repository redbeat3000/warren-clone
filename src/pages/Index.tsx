import MainLayout from "../components/layout/MainLayout";
import { useAutomationEngine } from '../components/automation/AutomationEngine';

const Index = () => {
  // Initialize automation engine
  useAutomationEngine();
  
  return <MainLayout />;
};

export default Index;