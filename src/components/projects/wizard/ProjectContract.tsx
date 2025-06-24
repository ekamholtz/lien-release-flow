
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, FileText, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WizardActions } from './WizardActions';

export interface ContractData {
  type: 'create' | 'upload' | 'skip';
  title?: string;
  description?: string;
  file?: File;
}

interface ProjectContractProps {
  initialContract?: ContractData;
  onBack: () => void;
  onSubmit: (contractData: ContractData) => void;
}

export function ProjectContract({ initialContract, onBack, onSubmit }: ProjectContractProps) {
  const [contractType, setContractType] = useState<'create' | 'upload' | 'skip'>(
    initialContract?.type || 'skip'
  );
  const [title, setTitle] = useState(initialContract?.title || '');
  const [description, setDescription] = useState(initialContract?.description || '');
  const [uploadedFile, setUploadedFile] = useState<File | null>(initialContract?.file || null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleContinue = () => {
    const contractData: ContractData = {
      type: contractType,
      title: contractType === 'create' ? title : undefined,
      description: contractType === 'create' ? description : undefined,
      file: contractType === 'upload' ? uploadedFile || undefined : undefined,
    };
    
    onSubmit(contractData);
  };

  const isValid = () => {
    if (contractType === 'skip') return true;
    if (contractType === 'create') return title.trim() !== '';
    if (contractType === 'upload') return uploadedFile !== null;
    return false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Contract Setup</h3>
        <p className="text-sm text-muted-foreground">
          Create a new contract, upload an existing one, or skip this step for now.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Create Contract Option */}
        <Card 
          className={`cursor-pointer transition-all ${
            contractType === 'create' ? 'ring-2 ring-cnstrct-orange' : 'hover:shadow-md'
          }`}
          onClick={() => setContractType('create')}
        >
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Create New</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-0">
            <p className="text-sm text-muted-foreground">
              Create a contract template that can be customized and sent for signature
            </p>
          </CardContent>
        </Card>

        {/* Upload Contract Option */}
        <Card 
          className={`cursor-pointer transition-all ${
            contractType === 'upload' ? 'ring-2 ring-cnstrct-orange' : 'hover:shadow-md'
          }`}
          onClick={() => setContractType('upload')}
        >
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <FileUp className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Upload Existing</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-0">
            <p className="text-sm text-muted-foreground">
              Upload a contract document that you've already prepared
            </p>
          </CardContent>
        </Card>

        {/* Skip Option */}
        <Card 
          className={`cursor-pointer transition-all ${
            contractType === 'skip' ? 'ring-2 ring-cnstrct-orange' : 'hover:shadow-md'
          }`}
          onClick={() => setContractType('skip')}
        >
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <CardTitle className="text-lg">Skip for Now</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-0">
            <p className="text-sm text-muted-foreground">
              Continue without a contract and add one later if needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Contract Form */}
      {contractType === 'create' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="contract-title">Contract Title</Label>
              <Input
                id="contract-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter contract title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contract-description">Description (Optional)</Label>
              <Textarea
                id="contract-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the contract terms"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Upload Contract Form */}
      {contractType === 'upload' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="contract-file">Contract Document</Label>
              <Input
                id="contract-file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="mt-1"
              />
              {uploadedFile && (
                <p className="text-sm text-green-600 mt-2">
                  Selected: {uploadedFile.name}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <WizardActions
        onBack={onBack}
        onNext={handleContinue}
        nextDisabled={!isValid()}
      />
    </div>
  );
}
