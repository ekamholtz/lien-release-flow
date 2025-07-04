
import { toast } from "sonner";

export interface QboAuthResponse {
  intuit_oauth_url?: string;
  debug?: any;
  error?: string;
}

export async function initiateQboAuth(accessToken: string, companyId: string): Promise<QboAuthResponse> {
  try {
    console.log("Initiating QBO auth process");
    console.log("Company ID:", companyId);
    console.log("Access token present:", !!accessToken);
    console.log("Access token length:", accessToken?.length || 0);
    
    if (!accessToken) {
      throw new Error("No access token provided");
    }
    
    if (!companyId) {
      throw new Error("No company ID provided");
    }
    
    const functionUrl = "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize";
    
    console.log("Calling QBO authorize function:", functionUrl);
    
    const requestHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };
    
    console.log("Request headers:", {
      hasAuthorization: !!requestHeaders.Authorization,
      authHeaderLength: requestHeaders.Authorization?.length || 0
    });
    
    const response = await fetch(functionUrl, {
      method: "GET",
      headers: requestHeaders
    });

    console.log("QBO authorize response status:", response.status);
    console.log("QBO authorize response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("QBO authorize error details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      let errorMessage = `Connection failed (${response.status})`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
        
        if (response.status === 401) {
          errorMessage = "Authentication failed. Please refresh the page and try again.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again in a few moments.";
        }
        
        return {
          error: errorMessage,
          debug: errorJson.debug || {}
        };
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        return {
          error: errorMessage,
          debug: { originalError: errorText }
        };
      }
    }

    const responseText = await response.text();
    console.log("QBO authorize response body length:", responseText.length);
    
    let responseData: QboAuthResponse;
    try {
      responseData = JSON.parse(responseText);
      console.log("QBO authorization response parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse successful response:", parseError);
      throw new Error("Invalid response from server");
    }
    
    // Store the company_id in session storage for retrieval after OAuth redirection
    if (companyId) {
      sessionStorage.setItem('qbo_company_id', companyId);
      console.log("Stored company ID in session storage:", companyId);
    }
    
    return responseData;

  } catch (error: any) {
    console.error("QBO connection error:", error);
    
    let userMessage = "Failed to connect to QuickBooks Online";
    
    if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
      userMessage = "Network error. Please check your connection and try again.";
    } else if (error.message?.includes("authentication") || error.message?.includes("token")) {
      userMessage = "Authentication error. Please refresh the page and try again.";
    }
    
    toast.error(userMessage);
    throw new Error(userMessage);
  }
}
