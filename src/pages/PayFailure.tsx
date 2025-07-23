import { AppLayout } from "@/components/AppLayout";
import { XCircle } from "lucide-react";

export default function PayFailure() {
    return (
        <AppLayout>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
                    <XCircle className="mx-auto text-red-500" size={64} />
                    <h1 className="mt-4 text-2xl font-semibold text-red-700">
                        Payment failed
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Unfortunately, your payment did not go through. Please try again or contact support.
                    </p>
                    <div className="mt-6">
                        <a
                            href="/dasboard"
                            className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
