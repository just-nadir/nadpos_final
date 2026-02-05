import { useCallback, useEffect, useState } from 'react';
import { createRestaurant, deleteRestaurant, getRestaurants, updateRestaurant } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Restaurant, CreateRestaurantPayload, UpdateRestaurantPayload } from '../types/api';

export const useRestaurants = () => {
  const { showToast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error('Failed to fetch restaurants', error);
      showToast("Ma'lumotlarni yuklashda xatolik", 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const saveRestaurant = async (
    payload: CreateRestaurantPayload | UpdateRestaurantPayload,
    id?: string | null
  ) => {
    setSubmitting(true);
    try {
      if (id) {
        await updateRestaurant(id, payload as UpdateRestaurantPayload);
        showToast('Restoran muvaffaqiyatli yangilandi', 'success');
      } else {
        await createRestaurant(payload as CreateRestaurantPayload);
        showToast("Yangi restoran muvaffaqiyatli qo'shildi", 'success');
      }
      await fetchRestaurants();
    } catch (error) {
      console.error('Failed to save restaurant', error);
      showToast("Xatolik yuz berdi! Telefon raqam band bo'lishi mumkin.", 'error');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const removeRestaurant = async (id: string) => {
    setSubmitting(true);
    try {
      await deleteRestaurant(id);
      showToast("Restoran muvaffaqiyatli o'chirildi", 'success');
      await fetchRestaurants();
    } catch (error) {
      console.error('Failed to delete restaurant', error);
      showToast("O'chirishda xatolik bo'ldi", 'error');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    restaurants,
    loading,
    submitting,
    fetchRestaurants,
    saveRestaurant,
    removeRestaurant,
  };
};

