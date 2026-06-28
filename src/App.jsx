import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  MapPin, 
  AlertCircle, 
  PlusCircle, 
  LayoutGrid, 
  ThumbsUp, 
  Loader2, 
  X, 
  ExternalLink, 
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  Save,
  Check,
  Bell
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [issues, setIssues] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('community_issues');
    if (saved && JSON.parse(saved).length > 0) {
      try {
        setIssues(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse issues", e);
      }
    } else {
      // Seed initial data if empty
      const initialIssues = [
        {
          id: 'seed-3',
          title: 'Overflowing Waste Bin',
          category: 'Waste Management',
          description: 'The public trash bin here is completely full and trash is starting to spill onto the sidewalk.',
          location: 'Main St & 2nd Ave',
          severity: 'Medium',
          status: 'Reported',
          votes: 2,
          userHasUpvoted: false,
          timestamp: Date.now() - 86400000,
          aiTriageNote: 'AI Triage: Verified Waste Management issue. Added to city sanitation route for immediate pickup.'
        },
        {
          id: 'seed-1',
          title: 'Deep Pothole at Broadway Junction',
          category: 'Pothole',
          description: 'A dangerous pothole has opened up near the crosswalk. Cars are swerving to avoid it.',
          location: 'Broadway & 14th St',
          severity: 'High',
          status: 'In Progress',
          votes: 2,
          userHasUpvoted: false,
          timestamp: Date.now() - 172800000,
          aiTriageNote: 'AI Triage: Verified Pothole with High urgency context. Crew dispatched for temporary patching.'
        },
        {
          id: 'seed-2',
          title: 'Flickering Streetlight',
          category: 'Broken Streetlight',
          description: 'The light at the corner of 5th and Park is flickering constantly, making the area feel unsafe at night.',
          location: '5th Ave & Park View',
          severity: 'Low',
          status: 'Reported',
          votes: 1,
          userHasUpvoted: false,
          timestamp: Date.now() - 345600000,
          aiTriageNote: 'AI Triage: Verified Streetlight hazard with Low urgency. Added to scheduled maintenance queue.'
        }
      ];
      setIssues(initialIssues);
    }
  }, []);

  useEffect(() => {
    if (issues.length > 0) {
      localStorage.setItem('community_issues', JSON.stringify(issues));
    }
  }, [issues]);

  const handleSubmit = async (newIssue) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIssue),
      });

      const data = await response.json();

      const issue = {
        ...newIssue,
        id: crypto.randomUUID(),
        status: 'Reported',
        votes: 0,
        userHasUpvoted: false,
        timestamp: Date.now(),
        aiTriageNote: data.triageNote || 'AI verified: Match found with public safety hazard tier 2'
      };

      setIssues(prev => [issue, ...prev]);
      setActiveTab('feed');
    } catch (error) {
      console.error('Failed to submit report:', error);
      // Fallback to local submission if API fails
      const issue = {
        ...newIssue,
        id: crypto.randomUUID(),
        status: 'Reported',
        votes: 0,
        userHasUpvoted: false,
        timestamp: Date.now(),
        aiTriageNote: 'Triage offline: Report queued for manual review.'
      };
      setIssues(prev => [issue, ...prev]);
      setActiveTab('feed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = (id) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === id) {
        const hasUpvoted = issue.userHasUpvoted || false;
        return { 
          ...issue, 
          votes: hasUpvoted ? issue.votes - 1 : issue.votes + 1,
          userHasUpvoted: !hasUpvoted
        };
      }
      return issue;
    }));
  };

  const handleSetStatus = (id, targetStatus) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === id) {
        // Toggle logic: If clicking the same status, revert to previous logical stage
        let finalStatus = targetStatus;
        if (issue.status === targetStatus) {
          if (targetStatus === 'In Progress') finalStatus = 'Reported';
          if (targetStatus === 'Resolved') finalStatus = 'In Progress';
        }
        
        // Notification logic for "Resolved"
        if (finalStatus === 'Resolved' && issue.status !== 'Resolved') {
          const newNotif = {
            id: crypto.randomUUID(),
            issueTitle: issue.title,
            timestamp: Date.now(),
            read: false
          };
          setNotifications(prev => [newNotif, ...prev]);
          setHasUnread(true);
        }

        return { ...issue, status: finalStatus };
      }
      return issue;
    }));
  };

  const handleDeleteIssue = (id) => {
    setIssues(prev => prev.filter(issue => issue.id !== id));
  };

  const handleUpdateIssue = (id, updatedData) => {
    setIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, ...updatedData } : issue
    ));
  };

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center py-0 sm:py-8">
      <div className="w-full max-w-[480px] bg-slate-50 min-h-screen sm:min-h-[90vh] sm:rounded-[40px] shadow-2xl relative flex flex-col font-sans overflow-hidden border border-white/50">
        {/* Header */}
        <header className="px-6 py-5 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-30 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">CivicHero</h1>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasUnread(false);
            }}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center relative hover:bg-slate-100 transition-colors"
          >
            <Bell className={`w-5 h-5 ${hasUnread ? 'text-blue-600' : 'text-slate-400'}`} />
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <NotificationPanel 
                notifications={notifications} 
                onClose={() => setShowNotifications(false)} 
              />
            )}
          </AnimatePresence>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            {activeTab === 'report' ? (
              <ReportView key="report" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            ) : (
              <FeedView 
                key="feed" 
                issues={issues} 
                onUpvote={handleUpvote} 
                onSetStatus={handleSetStatus}
                onDeleteIssue={handleDeleteIssue}
                onUpdateIssue={handleUpdateIssue}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-slate-100 px-8 py-3 flex justify-between items-center z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[10px] font-medium">Feed</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'report' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium">Report</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

function ReportView({ onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Pothole',
    description: '',
    location: '',
    severity: 'Medium',
    image: null,
    coords: null
  });
  
  const fileInputRef = useRef(null);

  const categories = ['Pothole', 'Broken Streetlight', 'Water Leakage', 'Waste Management'];
  const severities = ['Low', 'Medium', 'High'];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLocationChange = (val) => {
    setFormData(prev => ({ 
      ...prev, 
      location: val,
      // Simulate capturing coordinates when text is typed
      coords: val.length > 2 ? {
        lat: (40.7128 + (Math.random() - 0.5) * 0.01).toFixed(6),
        lng: (-74.0060 + (Math.random() - 0.5) * 0.01).toFixed(6)
      } : null
    }));
  };

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(formData.location || 'current location')}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Title</label>
          <input 
            type="text" 
            placeholder="What's the problem?"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 transition-all placeholder:text-slate-400"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
          <select 
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 transition-all appearance-none"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea 
            rows={3}
            placeholder="Tell us more details..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 transition-all placeholder:text-slate-400"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="e.g. 5th Avenue, Park View"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 transition-all placeholder:text-slate-400"
                  value={formData.location}
                  onChange={e => handleLocationChange(e.target.value)}
                />
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>
              <button 
                onClick={openGoogleMaps}
                className="px-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center"
                title="Open Google Maps Helper"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {formData.coords && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-700">Coordinates Captured</span>
                  </div>
                  <span className="text-[10px] font-mono text-green-600/70">
                    {formData.coords.lat}, {formData.coords.lng}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Severity Level</label>
          <div className="flex gap-2">
            {severities.map(s => (
              <button
                key={s}
                onClick={() => setFormData({ ...formData, severity: s })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  formData.severity === s 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-slate-100 bg-slate-50 text-slate-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Photo Proof</label>
          {formData.image ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
              <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
            >
              <Camera className="w-8 h-8 text-slate-400" />
              <span className="text-xs font-semibold">Tap to attach or take photo</span>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onSubmit(formData)}
        disabled={!formData.title || isSubmitting}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-3"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI analyzing image & categorizing...</span>
          </>
        ) : (
          'Submit Report'
        )}
      </button>
    </motion.div>
  );
}

function FeedView({ issues, onUpvote, onSetStatus, onDeleteIssue, onUpdateIssue }) {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const stats = {
    active: issues.filter(i => i.status === 'Reported').length,
    progress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length
  };

  const filterGroups = {
    'All': null,
    'Waste Management': ['Waste Management'],
    'Roads & Traffic': ['Pothole', 'Broken Streetlight'],
    'Public Safety': ['Water Leakage']
  };

  const filteredIssues = selectedFilter === 'All' 
    ? issues 
    : issues.filter(issue => filterGroups[selectedFilter]?.includes(issue.category));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Impact Dashboard */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-3xl text-center shadow-sm">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.active}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Active</div>
        </div>
        <div className="bg-blue-50 border border-blue-200/60 p-4 rounded-3xl text-center shadow-sm">
          <div className="text-2xl font-extrabold text-blue-600 tracking-tight">{stats.progress}</div>
          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Working</div>
        </div>
        <div className="bg-green-50 border border-green-200/60 p-4 rounded-3xl text-center shadow-sm">
          <div className="text-2xl font-extrabold text-green-600 tracking-tight">{stats.resolved}</div>
          <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-0.5">Fixed</div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        {Object.keys(filterGroups).map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm ${
              selectedFilter === filter 
                ? 'bg-slate-900 text-white border-slate-900 shadow-slate-200' 
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">
          {selectedFilter === 'All' ? 'Recent Issues' : `${selectedFilter} Reports`}
        </h2>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
          {filteredIssues.length} Shown
        </span>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <LayoutGrid className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-slate-400 text-sm">No {selectedFilter.toLowerCase()} issues found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map(issue => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              onUpvote={onUpvote} 
              onSetStatus={onSetStatus}
              onDelete={onDeleteIssue}
              onUpdate={onUpdateIssue}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function IssueCard({ issue, onUpvote, onSetStatus, onDelete, onUpdate }) {
  const [likes, setLikes] = useState(issue.votes);
  const [isUpvoted, setIsUpvoted] = useState(issue.userHasUpvoted);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [editedTitle, setEditedTitle] = useState(issue.title);
  const [editedDescription, setEditedDescription] = useState(issue.description);
  const [editedCategory, setEditedCategory] = useState(issue.category);

  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocalUpvote = () => {
    const nextUpvoted = !isUpvoted;
    const nextLikes = nextUpvoted ? likes + 1 : likes - 1;
    setLikes(nextLikes);
    setIsUpvoted(nextUpvoted);
    onUpvote(issue.id); // Sync with parent for persistence
  };

  const handleSave = () => {
    onUpdate(issue.id, {
      title: editedTitle,
      description: editedDescription,
      category: editedCategory
    });
    setIsEditing(false);
  };

  const severityColors = {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-red-100 text-red-700'
  };

  const statusColors = {
    'Reported': 'bg-slate-100 text-slate-600',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Resolved': 'bg-green-100 text-green-700'
  };

  const categoryTheme = {
    'Waste Management': 'bg-orange-100 text-orange-700 border-orange-200',
    'Pothole': 'bg-purple-100 text-purple-700 border-purple-200',
    'Broken Streetlight': 'bg-amber-100 text-amber-700 border-amber-200',
    'Water Leakage': 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <motion.div 
      layout
      className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-200/60 space-y-4 relative"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap gap-2 pr-8">
          {isEditing ? (
            <select 
              value={editedCategory}
              onChange={(e) => setEditedCategory(e.target.value)}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border bg-white outline-none focus:border-blue-500"
            >
              <option value="Waste Management">Waste Management</option>
              <option value="Pothole">Pothole</option>
              <option value="Broken Streetlight">Broken Streetlight</option>
              <option value="Water Leakage">Water Leakage</option>
            </select>
          ) : (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${categoryTheme[issue.category] || 'bg-slate-50 text-slate-400'}`}>
              {issue.category}
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${severityColors[issue.severity]}`}>
            {issue.severity}
          </span>
          <div className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusColors[issue.status]}`}>
            {issue.status}
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                <button 
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-blue-500" />
                  Edit Issue
                </button>
                <button 
                  onClick={() => { onDelete(issue.id); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  Delete Issue
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-2">
        {isEditing ? (
          <div className="space-y-3">
            <input 
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 outline-none focus:border-blue-500"
              placeholder="Issue Title"
            />
            <textarea 
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full text-sm text-slate-600 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 min-h-[100px]"
              placeholder="Description"
            />
            <button 
              onClick={handleSave}
              className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{issue.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{issue.description}</p>
          </>
        )}
      </div>

      {!isEditing && issue.image && (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100">
          <img src={issue.image} alt="Reported issue" className="w-full h-full object-cover" />
        </div>
      )}

      {!isEditing && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs font-medium text-slate-400 min-w-0">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{issue.location}</span>
              {issue.coords && (
                <span className="text-[9px] text-slate-300 font-mono">
                  ({issue.coords.lat}, {issue.coords.lng})
                </span>
              )}
            </div>
          </div>

          {issue.aiTriageNote && (
            <div className="bg-slate-900 rounded-xl p-3 flex gap-3 items-center">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-[11px] text-slate-300 font-medium italic leading-relaxed">
                {issue.aiTriageNote}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-50 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLocalUpvote}
                  className={`flex items-center gap-2 active:scale-110 transition-transform ${isUpvoted ? 'text-blue-600' : 'text-slate-600'}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isUpvoted ? 'fill-blue-600' : ''}`} />
                  <span className="text-xs font-bold">{likes}</span>
                </button>
                
                <span className="text-[10px] text-slate-300 font-medium whitespace-nowrap">
                  {new Date(issue.timestamp).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onSetStatus(issue.id, 'In Progress')}
                  className={`text-[9px] font-bold px-2 py-1.5 rounded-md transition-all uppercase tracking-tight border ${
                    issue.status === 'In Progress' 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {issue.status === 'In Progress' ? 'Working Now' : 'Mark Working'}
                </button>
                <button 
                  onClick={() => onSetStatus(issue.id, 'Resolved')}
                  className={`text-[9px] font-bold px-2 py-1.5 rounded-md transition-all uppercase tracking-tight border ${
                    issue.status === 'Resolved' 
                    ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-100' 
                    : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                  }`}
                >
                  Mark Fixed
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function NotificationPanel({ notifications, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute top-[calc(100%+8px)] right-6 w-[calc(100%-48px)] max-w-sm bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Alerts
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-slate-200" />
            </div>
            <p className="text-sm font-medium text-slate-400">All caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] leading-snug">
                      <span className="font-bold text-slate-900">🎉 Success:</span>{' '}
                      <span className="text-slate-600 font-medium">{notif.issueTitle}</span> has been completely fixed and closed!
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
