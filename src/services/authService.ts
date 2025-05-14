
import { supabase } from '@/integrations/supabase/client';

export const authService = {
  forgotPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      throw error;
    }
  },
  
  resetPassword: async (password: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) {
      throw error;
    }
  }
};
