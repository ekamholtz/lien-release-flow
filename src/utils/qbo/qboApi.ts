
import { toast } from "sonner";

export interface QboAuthResponse {
  intuit_oauth_url?: string;
  debug?: any;
}

export async function initiateQboAuth(accessToken: string, companyId: string): Promise<QboAuthResponse> {
  try {
    console.log("Starting QBO connection process");
    
    const functionUrl = "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize";
    
    console.log("Calling QBO authorize function");
    
    const response = await fetch(functionUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ",
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("QBO authorize error details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      // Parse error response if possible
      let debugInfo = {};
      try {
        const errorJson = JSON.parse(errorText);
        debugInfo = errorJson.debug || {};
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      
      throw new Error(`Connection failed: ${errorText || response.statusText}`);
    }

    // Fix the TypeScript deep recursion issue by using a simpler approach
    const responseText = await response.text();
    const responseData = JSON.parse(responseText) as QboAuthResponse;
    
    console.log("QBO authorization response received");
    
    // Store the company_id in session storage for retrieval after OAuth redirection
    sessionStorage.setItem('qbo_company_id', companyId);
    
    return responseData;

  } catch (error: any) {
    console.error("QBO connection error:", error);
    toast.error(error.message || "Failed to connect to QuickBooks Online");
    throw error;
  }
}
