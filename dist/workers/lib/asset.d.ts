export interface AssetPayment {
    id: string;
    customer: string;
    value: number;
    status: string;
    dueDate: string;
    description?: string;
}
export interface AssetCustomer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    mobilePhone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    postalCode?: string;
}
export declare const assetApi: {
    createCustomer(data: Omit<AssetCustomer, "id">): Promise<AssetCustomer>;
    getCustomer(id: string): Promise<AssetCustomer>;
    createPayment(data: Omit<AssetPayment, "id">): Promise<AssetPayment>;
    getPayment(id: string): Promise<AssetPayment>;
    listPayments(params?: {
        customer?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        data: AssetPayment[];
    }>;
};
