import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  agreementId: string;
  signedUrl: string;
  checkStatus: () => void;
};

export const AgreementStatusCard: React.FC<Props> = ({
  agreementId,
  signedUrl,
  checkStatus,
}) => {
  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <p className="text-sm font-semibold">Agreement ID: {agreementId}</p>
        <Button onClick={checkStatus}>Check Status</Button>
        {signedUrl && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Download Signed PDF
          </a>
        )}
      </CardContent>
    </Card>
  );
};
