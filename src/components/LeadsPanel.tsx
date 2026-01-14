import { useState } from 'react';
import { Search, Plus, Filter, TrendingUp, Phone, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeads, Lead, LeadStatus } from '@/hooks/useLeads';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LeadDetailSheet from '@/components/LeadDetailSheet';

interface LeadsPanelProps {
  onCall: (phone: string, name: string, leadId?: string) => void;
  onWhatsApp: (phone: string, name: string, leadId?: string) => void;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-primary/20 text-primary border-primary/30',
  qualified: 'bg-accent/20 text-accent border-accent/30',
  proposal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  negotiation: 'bg-warning/20 text-warning border-warning/30',
  won: 'bg-success/20 text-success border-success/30',
  lost: 'bg-destructive/20 text-destructive border-destructive/30',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const LeadsPanel = ({ onCall, onWhatsApp }: LeadsPanelProps) => {
  const { leads, isLoading, createLead, updateLead, deleteLead } = useLeads();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    source: '',
    notes: '',
    value: '',
    status: 'new' as LeadStatus,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      phone: '',
      email: '',
      source: '',
      notes: '',
      value: '',
      status: 'new',
    });
    setEditingLead(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone) return;

    const leadData = {
      name: formData.name,
      company: formData.company || null,
      phone: formData.phone,
      email: formData.email || null,
      source: formData.source || null,
      notes: formData.notes || null,
      value: formData.value ? parseFloat(formData.value) : null,
      status: formData.status,
    };

    if (editingLead) {
      updateLead.mutate({ id: editingLead.id, ...leadData });
    } else {
      createLead.mutate(leadData);
    }

    resetForm();
    setIsAddSheetOpen(false);
  };

  const handleEdit = (lead: Lead) => {
    setFormData({
      name: lead.name,
      company: lead.company || '',
      phone: lead.phone,
      email: lead.email || '',
      source: lead.source || '',
      notes: lead.notes || '',
      value: lead.value?.toString() || '',
      status: lead.status,
    });
    setEditingLead(lead);
    setIsAddSheetOpen(true);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      lead.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    won: leads.filter((l) => l.status === 'won').length,
    totalValue: leads.reduce((sum, l) => sum + (l.value || 0), 0),
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-xl z-10 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Leads</h1>
            <p className="text-sm text-muted-foreground">{stats.total} total leads</p>
          </div>
          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => resetForm()}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center glow-primary"
              >
                <Plus className="w-5 h-5 text-primary-foreground" />
              </motion.button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85%] bg-background rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Acme Inc"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@acme.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Source</Label>
                    <Input
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="Website, Referral..."
                    />
                  </div>
                  <div>
                    <Label>Deal Value ($)</Label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: LeadStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add notes about this lead..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={!formData.name || !formData.phone}>
                  {editingLead ? 'Update Lead' : 'Create Lead'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="glass-card p-3 text-center">
            <p className="text-lg font-bold text-primary">{stats.new}</p>
            <p className="text-[10px] text-muted-foreground">New</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-lg font-bold text-accent">{stats.qualified}</p>
            <p className="text-[10px] text-muted-foreground">Qualified</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-lg font-bold text-success">{stats.won}</p>
            <p className="text-[10px] text-muted-foreground">Won</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">${(stats.totalValue / 1000).toFixed(0)}k</p>
            <p className="text-[10px] text-muted-foreground">Pipeline</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border h-11"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', ...Object.keys(statusLabels)].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as LeadStatus | 'all')}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {status === 'all' ? 'All' : statusLabels[status as LeadStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No leads found</p>
            <Button variant="link" onClick={() => setIsAddSheetOpen(true)}>
              Add your first lead
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredLeads.map((lead, index) => {
              const initials = lead.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass-card p-4 cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 bg-gradient-to-br from-primary to-accent">
                      <AvatarFallback className="bg-transparent text-primary-foreground font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[lead.status]}`}>
                          {statusLabels[lead.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{lead.company || 'No company'}</p>
                      <p className="text-xs text-muted-foreground/70">{lead.phone}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {lead.value && (
                        <span className="text-sm font-medium text-success">${lead.value.toLocaleString()}</span>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCall(lead.phone, lead.name, lead.id);
                          }}
                          className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center"
                        >
                          <Phone className="w-3.5 h-3.5 text-success" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(lead);
                          }}
                          className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-primary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLead.mutate(lead.id);
                          }}
                          className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {lead.source && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] text-muted-foreground">
                        Source: <span className="text-primary">{lead.source}</span>
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onCall={onCall}
        onWhatsApp={onWhatsApp}
        onStatusChange={(leadId, newStatus) => {
          updateLead.mutate({ id: leadId, status: newStatus });
        }}
      />
    </div>
  );
};

export default LeadsPanel;
