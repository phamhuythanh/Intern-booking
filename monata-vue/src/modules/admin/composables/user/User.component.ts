import { api } from "@/modules/admin/lib/axios";
import type { User } from "../../stores/model/User.model";

interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export const getUsers = async (params: { page?: number }): Promise<{ 
  data: User[]; 
  meta: Meta;
}> => {
  const response = await api.get('/users', {
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

export const getUserById = async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);

    return response.data.data;
};

export const createUser = async (user: Partial<User>) => {
  const response = await api.post('/users', user);

  return response.data.data;
};

export const updateUser = async (id: number, user: Partial<User>) => {
  const response = await api.put(`/users/${id}`, user);

  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
};
