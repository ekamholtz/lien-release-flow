export type ExtendedContract = {
    objectId: string;
    id: string;
    title: string;
    note: string;
    status: string;
    file: string;
    certificate?: string;
    owner: string;
    createdAt: string;
    updatedAt?: string;
    signers?: {
        name: string;
        email: string;
        phone?: string;
    }[];
    audit_trail?: {
        email: string;
        viewed?: string;
        signed?: string;
    }[];
    redirect_url?: string;
    projects?: {
        name: string;
    };
};
