import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

export default function ReviewPdfPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        base64,
        fileName,
        email,
        name,
        phone,
        title,
        note,
        description,
        timeToCompleteDays,
        sendInOrder,
        enableOTP,
        allowModifications,
        autoReminder
    } = location.state || {};

    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [signatureBoxes, setSignatureBoxes] = useState<any[]>([]);
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");


    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!base64) return;

        const loadPdf = async () => {
            try {
                const binary = atob(base64);
                const uint8Array = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    uint8Array[i] = binary.charCodeAt(i);
                }

                const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
                setPdfDoc(pdf);
                setNumPages(pdf.numPages);
                setCurrentPage(1);

                const thumbs: string[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 });
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) continue;
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    thumbs.push(canvas.toDataURL());
                }
                setThumbnails(thumbs);
            } catch (error) {
                toast.error("Failed to load PDF document.");
            }
        };

        loadPdf();
    }, [base64]);

    useEffect(() => {
        const renderPage = async () => {
            if (!pdfDoc || !canvasRef.current) return;

            try {
                const page = await pdfDoc.getPage(currentPage);
                const A4_WIDTH = 595;
                const viewport = page.getViewport({ scale: 1 });
                const scale = A4_WIDTH / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                const context = canvas.getContext("2d");
                if (!context) return;

                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;

                await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

                renderSignatureBoxes();
            } catch (error) {
                toast.error("Failed to render PDF page.");
            }
        };

        renderPage();
    }, [pdfDoc, currentPage, signatureBoxes]);

    const renderSignatureBoxes = () => {
        const container = pdfContainerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const existing = container.querySelectorAll(".signature-box");
        existing.forEach((el) => el.remove());

        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvas.clientWidth / canvas.width;
        const scaleY = canvas.clientHeight / canvas.height;

        signatureBoxes.filter(b => b.page === currentPage).forEach(box => {
            const div = document.createElement("div");
            div.className = "signature-box";
            div.style.position = "absolute";
            div.style.left = `${box.x / scaleX}px`;
            div.style.top = `${box.y / scaleY}px`;
            div.style.width = `${box.w / scaleX}px`;
            div.style.height = `${box.h / scaleY}px`;
            div.style.background = "rgba(0,119,255,0.2)";
            div.style.border = "2px dashed #0077ff";
            div.style.zIndex = "10";
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.style.padding = "0 10px";
            div.style.fontWeight = "bold";
            div.innerHTML = `Signature <button class='signature-close'>&times;</button>`;

            div.querySelector(".signature-close")?.addEventListener("click", () => {
                setSignatureBoxes((prev) => prev.filter(b => !(b.page === currentPage && b.x === box.x && b.y === box.y)));
                div.remove();
            });

            let offsetX = 0;
            let offsetY = 0;
            const onMouseDown = (e: MouseEvent) => {
                if ((e.target as HTMLElement).classList.contains("signature-close")) return;
                offsetX = e.offsetX;
                offsetY = e.offsetY;
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            };

            const onMouseMove = (e: MouseEvent) => {
                const containerRect = container.getBoundingClientRect();
                const x = e.clientX - containerRect.left - offsetX;
                const y = e.clientY - containerRect.top - offsetY;
                div.style.left = `${x}px`;
                div.style.top = `${y}px`;
            };

            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                const newRect = div.getBoundingClientRect();
                const newBox = {
                    page: currentPage,
                    x: (newRect.left - canvasRect.left) * (canvas.width / canvasRect.width),
                    y: (newRect.top - canvasRect.top) * (canvas.height / canvasRect.height),
                    w: box.w,
                    h: box.h,
                };
                setSignatureBoxes((prev) => [
                    ...prev.filter(b => !(b.page === currentPage && b.x === box.x && b.y === box.y)),
                    newBox
                ]);
            };

            div.addEventListener("mousedown", onMouseDown);
            container.appendChild(div);
        });
    };

    const addSignatureBox = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const boxWidth = 150;
        const boxHeight = 50;
        const left = canvas.width - boxWidth - 20;
        const top = canvas.height - boxHeight - 20;

        const newBox = {
            page: currentPage,
            x: left,
            y: top,
            w: boxWidth,
            h: boxHeight,
        };

        setSignatureBoxes((prev) => [...prev, newBox]);
    };

    const sendForSigning = async () => {
        if (!email || !name || !title || !base64) {
            toast.error("Missing required fields");
            return;
        }

        if (signatureBoxes.length === 0) {
            toast.error("Please add at least one signature box before submitting.");
            return;
        }
        setStatus("sending");
        try {
            const { data, error } = await supabase.functions.invoke("send-pdf-signature", {
                body: {
                    file: base64,
                    email,
                    name,
                    phone,
                    title,
                    note,
                    description,
                    timeToCompleteDays,
                    sendInOrder,
                    enableOTP,
                    allowModifications,
                    autoReminder,
                    signers: [
                        {
                            role: "contractor",
                            signing_order: 1,
                            email,
                            name,
                            phone: phone || "",
                            widgets: signatureBoxes.map((box, index) => ({
                                type: "signature",
                                page: box.page,
                                x: box.x,
                                y: box.y,
                                w: box.w,
                                h: box.h,
                                name: `signature_${index + 1}`,
                            }))
                        }
                    ]
                },
            });

            if (error) {
                setStatus("error");
                toast.error("Failed to send document for signing.");
                return;
            }

            toast.success("Document sent successfully!");
            navigate(-1);
        } catch (err) {
            setStatus("error");
            toast.error("Something went wrong.");
        }
    };

    return (
        <AppLayout>
            <div className="p-6">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                </div>

                <div className="flex gap-4">
                    {thumbnails.length > 0 && (
                        <div className="w-24 overflow-y-auto max-h-[500px] border rounded p-2">
                            {thumbnails.map((thumb, index) => (
                                <img
                                    key={index}
                                    src={thumb}
                                    alt={`Page ${index + 1}`}
                                    className={`mb-2 border cursor-pointer rounded ${currentPage === index + 1 ? "ring-2 ring-blue-500" : ""}`}
                                    onClick={() => setCurrentPage(index + 1)}
                                />
                            ))}
                        </div>
                    )}

                    <div ref={pdfContainerRef} className="relative border rounded w-fit mx-auto">
                        <canvas ref={canvasRef} className="block max-w-full h-auto" />
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={addSignatureBox}
                        className="bg-blue-600 text-white px-4 py-2 rounded">
                        Add Signature Box
                    </button>

                    <Button onClick={sendForSigning} disabled={status === "sending"}>
                        {status === "sending" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            "Submit"
                        )}
                    </Button>
                </div>

                <style>{`
          .signature-box {
            cursor: move;
            user-select: none;
          }
          .signature-close {
            background: none;
            border: none;
            font-size: 16px;
            font-weight: bold;
            color: #ff0000;
            cursor: pointer;
          }
        `}</style>
            </div>
        </AppLayout>
    );
}
