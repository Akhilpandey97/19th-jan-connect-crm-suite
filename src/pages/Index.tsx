import { useState, useRef } from 'react';
import { Lead } from '@/hooks/useLeads';
import { useCallLogs, CallType } from '@/hooks/useCallLogs';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import LeadsPanel from '@/components/LeadsPanel';
import CallActivity from '@/components/CallActivity';
import DialPad from '@/components/DialPad';
import CRMIntegrations from '@/components/CRMIntegrations';
import SettingsPanel from '@/components/SettingsPanel';
import ActiveCallSheet from '@/components/ActiveCallSheet';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('leads');
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentCallNumber, setCurrentCallNumber] = useState('');
  const [currentCallName, setCurrentCallName] = useState<string | undefined>();
  const callStartTime = useRef<number>(0);
  const { toast } = useToast();
  const { createCallLog } = useCallLogs();

  const handleCall = (phone: string, name?: string) => {
    setCurrentCallNumber(phone);
    setCurrentCallName(name);
    setIsCallActive(true);
    callStartTime.current = Date.now();
  };

  const handleEndCall = () => {
    const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
    
    // Log the call to the database
    createCallLog.mutate({
      phone: currentCallNumber,
      contact_name: currentCallName || null,
      duration: duration > 2 ? duration : 0, // If under 2 seconds, consider it missed/cancelled
      type: duration > 2 ? 'outgoing' : 'missed',
      lead_id: null,
      notes: null,
      outcome: null,
    });

    setIsCallActive(false);
    toast({
      title: 'Call Ended',
      description: duration > 2 
        ? `Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
        : 'Call was not connected',
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'leads':
        return <LeadsPanel onCall={handleCall} />;
      case 'activity':
        return <CallActivity onCall={handleCall} />;
      case 'dialpad':
        return <DialPad onCall={(number) => handleCall(number)} />;
      case 'integrations':
        return <CRMIntegrations />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <LeadsPanel onCall={handleCall} />;
    }
  };

  return (
    <MobileLayout>
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <ActiveCallSheet
        isOpen={isCallActive}
        onClose={handleEndCall}
        phoneNumber={currentCallNumber}
        contactName={currentCallName}
      />
    </MobileLayout>
  );
};

export default Index;
