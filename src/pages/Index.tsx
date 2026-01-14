import { useState } from 'react';
import { useCallLogs } from '@/hooks/useCallLogs';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import LeadsPanel from '@/components/LeadsPanel';
import CallActivity from '@/components/CallActivity';
import DialPad from '@/components/DialPad';
import CRMIntegrations from '@/components/CRMIntegrations';
import SettingsPanel from '@/components/SettingsPanel';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('leads');
  const { toast } = useToast();
  const { createCallLog } = useCallLogs();

  const handleCall = (phone: string, name?: string) => {
    // Format phone number for India (add +91 if not present)
    let formattedPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = '+' + formattedPhone;
      } else if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      }
    }
    
    // Log the call attempt
    createCallLog.mutate({
      phone: formattedPhone,
      contact_name: name || null,
      duration: 0,
      type: 'outgoing',
      lead_id: null,
      notes: null,
      outcome: null,
    });

    toast({
      title: 'Opening Phone',
      description: `Calling ${name || formattedPhone}`,
    });
    
    // Open native phone dialer with tel: protocol
    window.location.href = `tel:${formattedPhone}`;
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
    </MobileLayout>
  );
};

export default Index;
