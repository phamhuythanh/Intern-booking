import { api, csrf } from "@/modules/admin/lib/axios";
import type { Contact } from "../../stores/model/Contact.model";

interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export const getContacts = async (params: { page?: number }): Promise<{ 
  data: Contact[]; 
  meta: Meta;
}> => {
  const response = await api.get('/contacts', {
      params: {
          ...params,
          page: params.page
      }
  });

  return {
      data: response.data.data,
      meta: response.data.meta
  };
};

export const getContactById = async (id: number): Promise<Contact> => {
    const response = await api.get(`/contacts/${id}`);

    return response.data.data;
};

export const sendMail = async (data: Partial<Contact>, id: number) => {
  const response = await api.post(`/contacts/${id}/send-mail`, data);

  return response.data.data;
};
