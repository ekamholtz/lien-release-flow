import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the data to your backend API
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Support ticket submitted",
        description: "We've received your message and will get back to you soon.",
      });
      
      // Reset the form
      setFormData({
        name: '',
        email: '',
        comment: ''
      });
    } catch (error) {
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
          <CardTitle className="text-2xl font-bold">Contact Support</CardTitle>
          <CardDescription>
            Fill out the form below and our support team will get back to you as soon as possible.
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
            
            <div className="space-y-2">
              <label htmlFor="comment" className="block text-sm font-medium">
                How can we help?
              </label>
              <Textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Please describe your issue or question..."
                required
                className="w-full min-h-[150px]"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-cnstrct-orange hover:bg-cnstrct-orange/90"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
