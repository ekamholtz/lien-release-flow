
import React, { useState } from 'react';
import { Sparkles, X, Send, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function AiAssistant() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  return (
    <Card className={`fixed bottom-4 right-4 shadow-lg ${isExpanded ? 'w-80 h-96' : 'w-64'}`}>
      <CardHeader className="p-3 bg-construction-600 text-white rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI Payment Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-white hover:bg-construction-700 rounded-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-white hover:bg-construction-700 rounded-full"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className={`p-3 ${isExpanded ? 'h-[calc(100%-96px)] overflow-y-auto' : 'h-20'}`}>
        <div className="bg-construction-50 p-2 rounded-lg mb-3">
          <p className="text-xs text-construction-800">
            👋 Hi there! I can help you with payments, invoices, and lien releases. What would you like to do today?
          </p>
        </div>
        
        {isExpanded && (
          <>
            <div className="bg-construction-50 p-2 rounded-lg mb-3">
              <p className="text-xs text-construction-800">
                Here are some things I can help with:
              </p>
              <ul className="text-xs text-construction-800 list-disc list-inside mt-1">
                <li>Creating invoices and payment links</li>
                <li>Understanding lien release requirements</li>
                <li>Setting up integrations with accounting software</li>
                <li>Payment process guidance</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <div className="flex w-full gap-2">
          <Input 
            placeholder="Ask a question..." 
            className="text-xs h-8"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button size="icon" className="h-8 w-8 bg-construction-600 hover:bg-construction-700">
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
