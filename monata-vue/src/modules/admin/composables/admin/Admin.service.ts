import { ref, reactive, computed } from 'vue'
import type { Admin } from '@/modules/admin/stores/model/Admin.model'
import { getAdmins, deleteAdmin } from './Admin.component'
import { useRoute, useRouter } from 'vue-router'
import { getAdminById, updateAdmin, createAdmin } from './Admin.component'

export const useAdmin = () => {
  const route = useRoute()
  const router = useRouter()

  const errors = reactive<Record<string, string[]>>({})

  const admins = ref<Admin[]>([])
  const currentPage = ref(1)
  const meta = ref({
    current_page: 1,
    from: 1,
    last_page: 1,
    per_page: 10,
    to: 0,
    total: 0,
  })

  const editingAdmin = ref<any>(null)
  const isLoading = ref(false)

  const fetchAdmins = async () => {
    try {
      const { name, email, phone, page, per_page } = route.query
      const params: Record<string, any> = {
        page: Number(page) || 1,
        per_page: Number(per_page) || 10,
      }

      if (name) params.name = name
      if (email) params.email = email
      if (phone) params.phone = phone

      console.log('Fetching admins with params:', params)
      const response = await getAdmins(params)
      console.log('Admins response:', response)

      if (response && response.data) {
        admins.value = response.data
        meta.value = response.meta
        currentPage.value = meta.value.current_page
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }

  const formCreate = ref({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })

  const searchForm = reactive({
    name: '',
    email: '',
    phone: '',
    per_page: '10',
  })

  const handleUpdateAdmin = async () => {
    Object.keys(errors).forEach((key) => delete errors[key])
    if (editingAdmin.value) {
      try {
        const response = await updateAdmin(editingAdmin.value.id, {
          name: editingAdmin.value.name,
          email: editingAdmin.value.email,
          phone: editingAdmin.value.phone,
        })
        await fetchAdmins()
        editingAdmin.value = null
      } catch (error: any) {
        if (error.response?.status === 422) {
          Object.assign(errors, error.response.data.errors)
          return
        }
        console.error(error)
        alert('An error occurred while updateting the admin.')
      }
    }
  }

  const startEdit = (admin: any) => {
    Object.keys(errors).forEach((key) => delete errors[key])
    editingAdmin.value = { ...admin }
  }

  const cancelEdit = () => {
    editingAdmin.value = null
  }

  const handleCreate = async () => {
    Object.keys(errors).forEach((key) => delete errors[key])
    isLoading.value = true
    try {
      await createAdmin(formCreate.value)
      await fetchAdmins()
      formCreate.value = {
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
      }
      return true
    } catch (error: any) {
      if (error.response?.status === 422) {
        Object.assign(errors, error.response.data.errors)
      } else {
        console.error(error)
        alert('An error occurred while creating the admin.')
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  const actionDeleteAdmin = async (id: number) => {
    const confirmDelete = confirm('Are you sure you want to delete this admin?')
    if (!confirmDelete) return

    await deleteAdmin(id)
    await fetchAdmins()
  }

  const onSearch = () => {
    currentPage.value = 1
    const query: Record<string, string> = {
      page: '1',
      per_page: searchForm.per_page,
    }

    if (searchForm.name) query.name = searchForm.name
    if (searchForm.email) query.email = searchForm.email
    if (searchForm.phone) query.phone = searchForm.phone

    console.log('Search query:', query)
    router.push({ query })
  }

  const syncFormWithQuery = () => {
    const { name, email, phone, per_page } = route.query
    searchForm.name = name ? String(name) : ''
    searchForm.email = email ? String(email) : ''
    searchForm.phone = phone ? String(phone) : ''
    searchForm.per_page = per_page ? String(per_page) : '10'

    console.log('Synced form values:', searchForm)
  }

  const changePassword = (admin: any) => {
    console.log(admin)
  }

  return {
    admins,
    meta,
    currentPage,
    searchForm,
    onSearch,
    syncFormWithQuery,
    fetchAdmins,
    actionDeleteAdmin,
    formCreate,
    errors,
    updateAdmin,
    editingAdmin,
    startEdit,
    cancelEdit,
    handleUpdateAdmin,
    handleCreate,
    changePassword,
    isLoading,
  }
}
