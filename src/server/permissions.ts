export const isAdmin = (role: string) => role === 'ADMIN';
export const isManager = (role: string) => role === 'MANAGER' || role === 'ORGANIZER';
export const canManageUsers = (role: string) => isAdmin(role) || isManager(role);
export const canEditUsers = (role: string) => isAdmin(role);
export const canManageData = (role: string) => isAdmin(role) || isManager(role) || role === 'USER';

export const canAccessOwnerData = (role: string, userId: string, ownerId: string | null | undefined) =>
  isAdmin(role) || isManager(role) || ownerId === userId;
