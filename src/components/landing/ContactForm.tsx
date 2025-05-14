
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ContactForm() {
  const location = useLocation();
  const isDemo = new URLSearchParams(location.search).get('demo') === 'true';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    companySize: '',
    comment: '',
    interests: {
      accountsPayable: false,
      accountsReceivable: false,
      lienRelease: false,
      qboIntegration: false,
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set the title and description based on whether it's a demo request or regular contact
  const title = isDemo ? "Request a Demo" : "Contact Support";
  const description = isDemo 
    ? "Fill out the form below to schedule a personalized demo of our platform."
    : "Fill out the form below and our support team will get back to you as soon as possible.";
  const buttonText = isDemo ? "Request Demo" : "Submit Ticket";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        [name]: checked
      }
    }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      companySize: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert interests object to array of selected interests
      const selectedInterests = Object.entries(formData.interests)
        .filter(([_, isSelected]) => isSelected)
        .map(([interest]) => interest);
      
      // Send the data to our new Supabase edge function
      const response = await fetch(
        "https://oknofqytitpxmlprvekn.functions.supabase.co/send-contact-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            company: formData.company,
            companySize: formData.companySize,
            message: formData.comment,
            interests: selectedInterests,
            isDemo: isDemo,
            source: document.referrer || 'direct',
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      toast({
        title: isDemo ? "Demo request submitted" : "Support ticket submitted",
        description: isDemo 
          ? "We've received your demo request. Our team will contact you soon to schedule a personalized demo."
          : "We've received your message and will get back to you soon.",
      });
      
      // Reset the form
      setFormData({
        name: '',
        email: '',
        company: '',
        companySize: '',
        comment: '',
        interests: {
          accountsPayable: false,
          accountsReceivable: false,
          lienRelease: false,
          qboIntegration: false,
        }
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Something went wrong",
        description: "Your message couldn't be sent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                className="w-full"
              />
            </div>
            
            {isDemo && (
              <>
                <div className="space-y-2">
                  <label htmlFor="company" className="block text-sm font-medium">
                    Company Name
                  </label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Your company name"
                    required={isDemo}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="companySize" className="block text-sm font-medium">
                    Company Size
                  </label>
                  <Select value={formData.companySize} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Company Size</SelectLabel>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501+">501+ employees</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium mb-2">
                    Which features are you most interested in?
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="accountsPayable" 
                        checked={formData.interests.accountsPayable} 
                        onCheckedChange={(checked) => handleCheckboxChange('accountsPayable', checked as boolean)}
                      />
                      <Label htmlFor="accountsPayable">Accounts Payable Management</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="accountsReceivable" 
                        checked={formData.interests.accountsReceivable} 
                        onCheckedChange={(checked) => handleCheckboxChange('accountsReceivable', checked as boolean)}
                      />
                      <Label htmlFor="accountsReceivable">Accounts Receivable Management</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="lienRelease" 
                        checked={formData.interests.lienRelease} 
                        onCheckedChange={(checked) => handleCheckboxChange('lienRelease', checked as boolean)}
                      />
                      <Label htmlFor="lienRelease">Lien Release Workflows</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="qboIntegration" 
                        checked={formData.interests.qboIntegration} 
                        onCheckedChange={(checked) => handleCheckboxChange('qboIntegration', checked as boolean)}
                      />
                      <Label htmlFor="qboIntegration">QuickBooks Online Integration</Label>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <label htmlFor="comment" className="block text-sm font-medium">
                {isDemo ? "What are your main challenges?" : "How can we help?"}
              </label>
              <Textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                placeholder={isDemo 
                  ? "Please describe your current payment processes and challenges..." 
                  : "Please describe your issue or question..."}
                required
                className="w-full min-h-[150px]"
              />
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-cnstrct-orange hover:bg-cnstrct-orange/90"
              >
                {isSubmitting ? 'Submitting...' : buttonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
