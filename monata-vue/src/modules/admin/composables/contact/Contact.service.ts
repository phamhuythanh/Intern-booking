import {ref, reactive, computed} from 'vue';
import type { Contact } from '../../stores/model/Contact.model';
import {getContacts, getContactById, sendMail} from './Contact.component';
import {useRoute, useRouter} from "vue-router";

export const useContact = () => {
    const route = useRoute();
    const router = useRouter();

    const contacts = ref<Contact[]>([]);
    const currentPage = ref(1);
    const meta = ref({
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: 0,
        total: 0
    });

    const fetchContacts = async () => {
        try {
            const { user_id, guest_name, guest_email, status, page, per_page } = route.query;
            const params: Record<string, any> = { 
                page: Number(page) || 1,
                per_page: Number(per_page) || 10
            };

            if (user_id) params.user_id = user_id;
            if (guest_name) params.guest_name = guest_name;
            if (guest_email) params.guest_email = guest_email;
            if (status !== undefined) {
                params.status = Number(status);
            }

            const response = await getContacts(params);

            if (response && response.data) {
                contacts.value = response.data;
                meta.value = response.meta;
                currentPage.value = meta.value.current_page;
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const searchForm = reactive({
        user_id: '',
        guest_name: '',
        guest_email: '',
        status: '',
        per_page: '10',
    });

    const onSearch = () => {
        currentPage.value = 1;
        const query: Record<string, string> = { 
            page: '1',
            per_page: searchForm.per_page
        };
        
        if (searchForm.user_id) query.user_id = searchForm.user_id;
        if (searchForm.guest_name) query.guest_name = searchForm.guest_name;
        if (searchForm.guest_email) query.guest_email = searchForm.guest_email;
        if (searchForm.status !== '') query.status = searchForm.status;

        router.push({ query });
    };
    
    const syncFormWithQuery = () => {
        const { user_id, guest_name, guest_email, status, per_page } = route.query;
        searchForm.user_id = user_id ? String(user_id) : '';
        searchForm.guest_name = guest_name ? String(guest_name) : '';
        searchForm.guest_email = guest_email ? String(guest_email) : '';
        searchForm.status = status !== undefined ? String(status) : '';
        searchForm.per_page = per_page ? String(per_page) : '10';
        
    };

    const isContactModalOpen = ref(false);

    const selectedContact = ref(null);

    const showContactModal = (contact) => {
        selectedContact.value = contact;
        isContactModalOpen.value = true;
    };

    const closeContactModal = () => {
        isContactModalOpen.value = false;
        selectedContact.value = null;
    };

    return {
        contacts,
        meta,
        currentPage,
        searchForm,
        onSearch,
        syncFormWithQuery,
        fetchContacts,
        isContactModalOpen,
        selectedContact,
        showContactModal,
        closeContactModal,
    };
};
