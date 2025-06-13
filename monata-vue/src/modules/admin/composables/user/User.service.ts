import {ref, reactive, computed} from 'vue';
import type { User } from '@/modules/admin/stores/model/User.model';
import {getUsers, deleteUser} from './User.component';
import {useRoute, useRouter} from "vue-router";
import { getUserById, updateUser, createUser } from './User.component';
import { UserStatus } from '../../stores/enum/User';
import { ServiceStatus } from '../../stores/enum/Service';

export const useUser = () => {
    const route = useRoute();
    const router = useRouter();

    const errors = reactive<Record<string, string[]>>({});

    const users = ref<User[]>([]);
    const currentPage = ref(1);
    const meta = ref({
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: 0,
        total: 0
    });

    const editingUser = ref<any>(null);
    const isLoading = ref(false)

    const fetchUsers = async () => {
        try {
            const { name, email, phone, status, page, per_page } = route.query;
            const params: Record<string, any> = { 
                page: Number(page) || 1,
                per_page: Number(per_page) || 10
            };

            if (name) params.name = name;
            if (email) params.email = email;
            if (phone) params.phone = phone;
            if (status !== undefined) {
                params.status = Number(status);
            }

            console.log('Fetching users with params:', params);
            const response = await getUsers(params);
            console.log('Users response:', response);

            if (response && response.data) {
                users.value = response.data;
                meta.value = response.meta;
                currentPage.value = meta.value.current_page;
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const formCreate = ref({
        name: '',
        email: '',
        phone: '',
        status: UserStatus.Active,
        password: '',
        password_confirmation: '',
    });

    const searchForm = reactive({
        name: '',
        email: '',
        phone: '',
        status: '',
        per_page: '10',
    });

    const handleUpdateUser = async () => {
        Object.keys(errors).forEach(key => delete errors[key]);
        if (editingUser.value) {
            try {
                const response = await updateUser(editingUser.value.id, {
                    name: editingUser.value.name,
                    email: editingUser.value.email,
                    phone: editingUser.value.phone,
                    status: editingUser.value.status
                });
                await fetchUsers();
                editingUser.value = null;
            } catch (error: any) {
                if (error.response?.status === 422) {
                    Object.assign(errors, error.response.data.errors);
                    return;
                }
                console.error(error);
                alert('An error occurred while updateting the user.');
            }
        }
    };

    const startEdit = (user: any) => {
        Object.keys(errors).forEach(key => delete errors[key]);
        editingUser.value = { ...user };
    };

    const cancelEdit = () => {
        editingUser.value = null;
    };

    const handleCreate = async () => {
        Object.keys(errors).forEach(key => delete errors[key]);
        isLoading.value = true
        try {
            await createUser(formCreate.value);
            await fetchUsers();
            formCreate.value = {
                name: '',
                email: '',
                phone: '',
                status: UserStatus.Active,
                password: '',
                password_confirmation: '',
            };
            return true;
        } catch (error: any) {
            if (error.response?.status === 422) {
                Object.assign(errors, error.response.data.errors);
            } else {
                console.error(error);
                alert('An error occurred while creating the user.');
            }
            return false;
        } finally {
            isLoading.value = false
        }
    };

    const actionDeleteUser = async (id: number) => {
        const confirmDelete = confirm('Are you sure you want to delete this user?');
        if (!confirmDelete) return;

        await deleteUser(id);    
        await fetchUsers();
    };

    const onSearch = () => {
        currentPage.value = 1;
        const query: Record<string, string> = { 
            page: '1',
            per_page: searchForm.per_page
        };
        
        if (searchForm.name) query.name = searchForm.name;
        if (searchForm.email) query.email = searchForm.email;
        if (searchForm.phone) query.phone = searchForm.phone;
        if (searchForm.status !== '') query.status = searchForm.status;

        console.log('Search query:', query);
        router.push({ query });
    };
    
    const syncFormWithQuery = () => {
        const { name, email, phone, status, per_page } = route.query;
        searchForm.name = name ? String(name) : '';
        searchForm.email = email ? String(email) : '';
        searchForm.phone = phone ? String(phone) : '';
        searchForm.status = status !== undefined ? String(status) : '';
        searchForm.per_page = per_page ? String(per_page) : '10';
        
        console.log('Synced form values:', searchForm);
    };

    const changePassword = (user: any) => {
        console.log(user);
    };

    return {
        users,
        meta,
        currentPage,
        searchForm,
        onSearch,
        syncFormWithQuery,
        fetchUsers,
        actionDeleteUser,
        formCreate,
        errors,
        updateUser,
        editingUser,
        startEdit,
        cancelEdit,
        handleUpdateUser,
        handleCreate,
        changePassword,
        isLoading
    };
};
