
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, FileInput, FileCheck, Receipt, FolderPlus } from 'lucide-react';

export function ActionButtons() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <Link to="/create-invoice" className="w-full">
        <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
          <Receipt className="h-5 w-5" />
          <span>Create Invoice</span>
        </Button>
      </Link>
      
      <Link to="/create-bill" className="w-full">
        <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
          <FileText className="h-5 w-5" />
          <span>Create Bill</span>
        </Button>
      </Link>
      
      <Link to="/create-project" className="w-full">
        <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
          <FolderPlus className="h-5 w-5" />
          <span>Create Project</span>
        </Button>
      </Link>
      
      <Link to="/lien-release" className="w-full">
        <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
          <FileCheck className="h-5 w-5" />
          <span>Lien Release</span>
        </Button>
      </Link>
      
      <Link to="/documents" className="w-full">
        <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
          <FileInput className="h-5 w-5" />
          <span>Upload Document</span>
        </Button>
      </Link>
    </div>
  );
}
