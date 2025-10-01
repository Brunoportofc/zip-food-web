// Placeholder para next-auth
export const getServerSession = (...args: any[]) => {
  return Promise.resolve({ user: { id: 'mock-user-id', name: 'Mock User', email: 'mock@example.com' } });
};
