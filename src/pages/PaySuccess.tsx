import { CheckCircle } from "lucide-react";

export default function PaySuccess() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
                <CheckCircle className="mx-auto text-green-500" size={64} />
                <h1 className="mt-4 text-2xl font-semibold text-green-700">
                    Payment successful!
                </h1>
                <p className="mt-2 text-gray-600">
                    Thank you for your payment. A confirmation has been sent to your email.
                </p>
                <div className="mt-6">
                    <a
                        href="/dashboard"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition"
                    >
                        Go to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
