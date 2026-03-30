import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/axios';
export function useUploadFile() {
    return useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append('video', file);
            const response = await api.post('/analyses/upload', formData);
            return response.data;
        }
    });
}
export function useUploadYoutube() {
    return useMutation({
        mutationFn: async (url) => {
            const response = await api.post('/analyses/youtube', { url });
            return response.data;
        }
    });
}
