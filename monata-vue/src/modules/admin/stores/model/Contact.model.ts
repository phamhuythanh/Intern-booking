export interface Contact {
    id: number;
    user_id?: number;
    guest_name?: string;
    guest_email?: string;
    title: string;
    content: string;
    content_reply?: string;
    status: number;
}
