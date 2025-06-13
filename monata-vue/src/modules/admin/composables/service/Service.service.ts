import {ref, reactive, computed} from 'vue';
import type { Service } from '@/modules/admin/stores/model/Service.model';
import {getServices, deleteService} from './Service.component';
import {useRoute, useRouter} from "vue-router";
import { getServiceById, updateService, createService } from './Service.component';
import { ServiceStatus } from '../../stores/enum/Service';

export const useService = () => {
    const route = useRoute();
    const router = useRouter();

    const errors = reactive<Record<string, string[]>>({});

    const services = ref<Service[]>([]);
    const currentPage = ref(1);
    const meta = ref({
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: 0,
        total: 0
    });

    const editingService = ref<any>(null);

    const fetchServices = async () => {
        try {
            const { name, price, status, page, per_page } = route.query;
            const params: Record<string, any> = { 
                page: Number(page) || 1,
                per_page: Number(per_page) || 10
            };

            if (name) params.name = name;
            if (price) params.price = price;
            if (status !== undefined) {
                params.status = Number(status);
            }

            const response = await getServices(params);

            if (response && response.data) {
                services.value = response.data;
                meta.value = response.meta;
                currentPage.value = meta.value.current_page;
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const form = ref({
        name: '',
        price: undefined,
        status: ServiceStatus.Active,
    });

    const searchForm = reactive({
        name: '',
        price: '',
        status: '',
        per_page: '10',
    });

    const handleUpdateService = async () => {
        Object.keys(errors).forEach(key => delete errors[key]);
        if (editingService.value) {
            try {
                const response = await updateService(editingService.value.id, {
                    name: editingService.value.name,
                    price: editingService.value.price,
                    status: editingService.value.status
                });
                await fetchServices();
                editingService.value = null;
            } catch (error: any) {
                if (error.response?.status === 422) {
                    Object.assign(errors, error.response.data.errors);
                    return;
                }
                console.error(error);
                alert('An error occurred while updating the user.');
            }
        }
    };

    const startEdit = (service: any) => {
        Object.keys(errors).forEach(key => delete errors[key]);
        editingService.value = { ...service };
    };

    const cancelEdit = () => {
        editingService.value = null;
    };

    const isCreating = ref(false);

    const startCreate = () => {
        isCreating.value = true;
        form.value = {
            name: '',
            price: undefined,
            status: ServiceStatus.Active
        };
        Object.keys(errors).forEach(key => delete errors[key]);
    };

    const cancelCreate = () => {
        isCreating.value = false;
        form.value = {
            name: '',
            price: undefined,
            status: ServiceStatus.Active
        };
        Object.keys(errors).forEach(key => delete errors[key]);
    };

    const handleCreate = async () => {
        Object.keys(errors).forEach(key => delete errors[key]);
        try {
            await createService(form.value);
            await fetchServices();
            isCreating.value = false;
            form.value = {
                name: '',
                price: undefined,
                status: ServiceStatus.Active
            };
        } catch (error: any) {
            if (error.response?.status === 422) {
                Object.assign(errors, error.response.data.errors);
            } else {
                console.error(error);
                alert('An error occurred while creating the user.');
            }
        }
    };

    const actionDeleteService = async (id: number) => {
        const confirmDelete = confirm('Are you sure you want to delete this user?');
        if (!confirmDelete) return;

        await deleteService(id);    
        await fetchServices();
    };

    const onSearch = () => {
        currentPage.value = 1;
        const query: Record<string, string> = { 
            page: '1',
            per_page: searchForm.per_page
        };
        
        if (searchForm.name) query.name = searchForm.name;
        if (searchForm.price) query.price = searchForm.price;
        if (searchForm.status !== '') query.status = searchForm.status;

        router.push({ query });
    };
    
    const syncFormWithQuery = () => {
        const { name, price, status, per_page } = route.query;
        searchForm.name = name ? String(name) : '';
        searchForm.price = price ? String(price) : '';
        searchForm.status = status !== undefined ? String(status) : '';
        searchForm.per_page = per_page ? String(per_page) : '10';
        
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '';
        return new Intl.NumberFormat('en-GB', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' VNĐ';
      };

    return {
        services,
        meta,
        currentPage,
        searchForm,
        onSearch,
        syncFormWithQuery,
        fetchServices,
        actionDeleteService,
        form,
        errors,
        updateService,
        editingService,
        startEdit,
        cancelEdit,
        handleUpdateService,
        isCreating,
        startCreate,
        cancelCreate,
        handleCreate,
        formatCurrency
    };
};
