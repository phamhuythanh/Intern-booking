import { api } from '@/modules/admin/lib/axios'
import type { Admin } from '../../stores/model/Admin.model'

interface Meta {
  current_page: number
  from: number
  last_page: number
  path: string
  per_page: number
  to: number
  total: number
}

export const getAdmins = async (params: {
  page?: number
}): Promise<{
  data: Admin[]
  meta: Meta
}> => {
  const response = await api.get('/admin-accounts', {
    params: {
      ...params,
      page: params.page,
    },
  })

  return {
    data: response.data.data,
    meta: response.data.meta,
  }
}

export const getAdminById = async (id: number): Promise<Admin> => {
  const response = await api.get(`/admin-accounts/${id}`)

  return response.data.data
}

export const createAdmin = async (admin: Partial<Admin>) => {
  const response = await api.post('/admin-accounts', admin)

  return response.data.data
}

export const updateAdmin = async (id: number, admin: Partial<Admin>) => {
  const response = await api.put(`/admin-accounts/${id}`, admin)

  return response.data
}

export const deleteAdmin = async (id: number): Promise<void> => {
  await api.delete(`/admin-accounts/${id}`, { data: { id } })
}
