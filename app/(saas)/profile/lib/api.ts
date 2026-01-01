import api from '@/lib/api';

export const getProfileData = async (): Promise<{
  profile: Record<string, unknown>;
}> => {
  return api('/api/profiles/');
};

export const updateProfileData = async (
  data: Record<string, unknown>
): Promise<{ message: string }> => {
  return api('/api/profiles/update/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
