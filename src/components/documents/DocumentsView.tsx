import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Document {
  id: string;
  name: string;
  type: string;
  category: 'registration' | 'minutes' | 'policies' | 'financial' | 'legal' | 'other';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
  description?: string;
}

const sampleDocuments: Document[] = [
  {
    id: '1',
    name: 'Chama Registration Certificate',
    type: 'PDF',
    category: 'registration',
    size: '2.3 MB',
    uploadedBy: 'Blessing Hamisi',
    uploadedAt: '2024-01-15',
    version: 1,
    description: 'Official registration certificate from Ministry of Co-operatives'
  },
  {
    id: '2',
    name: 'Monthly Meeting Minutes - January 2024',
    type: 'DOCX',
    category: 'minutes',
    size: '1.1 MB',
    uploadedBy: 'Jacob Ogol',
    uploadedAt: '2024-01-31',
    version: 2,
    description: 'Minutes from January monthly general meeting'
  },
  {
    id: '3',
    name: 'Loan Policy Document',
    type: 'PDF',
    category: 'policies',
    size: '956 KB',
    uploadedBy: 'Warren Odhiambo',
    uploadedAt: '2024-01-10',
    version: 3,
    description: 'Updated loan terms, conditions and procedures'
  },
  {
    id: '4',
    name: 'Financial Audit Report 2023',
    type: 'PDF',
    category: 'financial',
    size: '3.2 MB',
    uploadedBy: 'Warren Odhiambo',
    uploadedAt: '2024-01-05',
    version: 1,
    description: 'Annual financial audit conducted by external auditor'
  }
];

const documentCategories = [
  { id: 'all', name: 'All Documents', icon: FolderIcon },
  { id: 'registration', name: 'Registration', icon: DocumentTextIcon },
  { id: 'minutes', name: 'Meeting Minutes', icon: DocumentTextIcon },
  { id: 'policies', name: 'Policies', icon: DocumentTextIcon },
  { id: 'financial', name: 'Financial', icon: DocumentTextIcon },
  { id: 'legal', name: 'Legal', icon: DocumentTextIcon },
  { id: 'other', name: 'Other', icon: DocumentTextIcon }
];

export default function DocumentsView() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const filteredDocuments = sampleDocuments.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'registration': return 'bg-blue-100 text-blue-800';
      case 'minutes': return 'bg-green-100 text-green-800';
      case 'policies': return 'bg-purple-100 text-purple-800';
      case 'financial': return 'bg-yellow-100 text-yellow-800';
      case 'legal': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (type: string) => {
    return DocumentTextIcon; // Could expand to show different icons for different file types
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
          <p className="text-muted-foreground mt-1">Store and manage Chama documents, certificates, and minutes</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Upload Document</span>
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Document upload functionality will be implemented with storage integration.
              </p>
              <Button onClick={() => setIsUploadOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold text-foreground mt-2">{sampleDocuments.length}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold text-foreground mt-2">7.6 MB</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <FolderIcon className="h-6 w-6 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recent Uploads</p>
              <p className="text-2xl font-bold text-foreground mt-2">3</p>
              <p className="text-sm text-muted-foreground mt-1">This week</p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <ArrowDownTrayIcon className="h-6 w-6 text-accent" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold text-foreground mt-2">{documentCategories.length - 1}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <FolderIcon className="h-6 w-6 text-warning" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {documentCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document, index) => {
          const FileIcon = getFileIcon(document.type);
          return (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="card-elevated p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{document.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className={getCategoryColor(document.category)}>
                        {document.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">v{document.version}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {document.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{document.type}</span>
                  <span className="text-muted-foreground">{document.size}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Uploaded by</p>
                    <p className="font-medium text-foreground">{document.uploadedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">{new Date(document.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <EyeIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <ArrowDownTrayIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                  <TrashIcon className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <DocumentTextIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
          </p>
          <Button onClick={() => setIsUploadOpen(true)}>
            Upload Document
          </Button>
        </motion.div>
      )}
    </div>
  );
}