import { useState } from 'react';
import { Contact } from '@/types/crm';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import ContactsList from '@/components/ContactsList';
import RecentCalls from '@/components/RecentCalls';
import DialPad from '@/components/DialPad';
import CRMIntegrations from '@/components/CRMIntegrations';
import SettingsPanel from '@/components/SettingsPanel';
import ActiveCallSheet from '@/components/ActiveCallSheet';
import ContactDetailSheet from '@/components/ContactDetailSheet';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('contacts');
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentCallNumber, setCurrentCallNumber] = useState('');
  const [currentCallName, setCurrentCallName] = useState<string | undefined>();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  const { toast } = useToast();

  const handleCall = (phoneOrContact: string | Contact, name?: string) => {
    if (typeof phoneOrContact === 'string') {
      setCurrentCallNumber(phoneOrContact);
      setCurrentCallName(name);
    } else {
      setCurrentCallNumber(phoneOrContact.phone);
      setCurrentCallName(phoneOrContact.name);
    }
    setIsCallActive(true);
    setIsContactSheetOpen(false);
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactSheetOpen(true);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    toast({
      title: 'Call Ended',
      description: `Duration: ${Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'contacts':
        return <ContactsList onCall={handleCall} onContactClick={handleContactClick} />;
      case 'recents':
        return <RecentCalls onCall={(phone, name) => handleCall(phone, name)} />;
      case 'dialpad':
        return <DialPad onCall={(number) => handleCall(number)} />;
      case 'integrations':
        return <CRMIntegrations />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <ContactsList onCall={handleCall} onContactClick={handleContactClick} />;
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

      <ContactDetailSheet
        contact={selectedContact}
        isOpen={isContactSheetOpen}
        onClose={() => setIsContactSheetOpen(false)}
        onCall={handleCall}
      />
    </MobileLayout>
  );
};

export default Index;
