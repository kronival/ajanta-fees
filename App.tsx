
import React, { useState, useContext, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DataProvider, DataContext } from './context/DataContext';
import { Page, Role, User } from './types';
import StudentsPage from './components/pages/StudentsPage';
import PaymentsPage from './students/PaymentsPage';
import ReportsPage from './components/pages/ReportsPage';
import DashboardPage from './components/pages/DashboardPage';
import { DashboardIcon, StudentsIcon, PaymentIcon, ReportsIcon, SettingsIcon, LogoutIcon, EditIcon, PlusIcon, MenuIcon, CloseIcon, DeleteIcon } from './components/Icons';
import Modal from './components/common/Modal';
import { ACADEMIC_YEAR } from './constants';

// --- User Form ---
interface UserFormProps {
  user?: User | null;
  onSave: (user: User | Omit<User, 'id'>) => void;
  onClose: () => void;
  existingUsernames: string[];
  isSaving: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onClose, existingUsernames, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: Role.Accountant
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({ 
        name: user.name,
        username: user.username, 
        password: user.password || '',
        role: user.role
      });
    } else {
      // Reset for new user
      setFormData({
        name: '',
        username: '',
        password: '',
        role: Role.Accountant
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!user;
    if (existingUsernames.includes(formData.username) && (!isEditing || formData.username !== user.username)) {
      setError('Username already exists.');
      return;
    }
    if (!formData.password && !isEditing) { // Password required for new user
      setError('Password cannot be empty.');
      return;
    }
    if (!formData.name || !formData.username) {
        setError('Name and Username are required.');
        return;
    }

    const dataToSave = { ...formData };
    if (isEditing && !dataToSave.password) {
      // Don't overwrite with empty password if not provided
      delete (dataToSave as any).password; 
    }

    if (isEditing) {
        onSave({ ...user, ...dataToSave });
    } else {
        onSave(dataToSave);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
        <input type="text" name="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
        <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            {Object.values(Role).map(role => (
                <option key={role} value={role}>{role}</option>
            ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{user ? 'New Password (optional)' : 'Password'}</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={user ? "Leave blank to keep current" : ""} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
        <button type="submit" disabled={isSaving} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};


// --- Settings Page ---
const SettingsPage: React.FC = () => {
  const { users, updateUser, addUser, deleteUser, classFees, updateClassSessionFee } = useContext(DataContext);
  const { user: currentUser } = useContext(AuthContext);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [editingFeeClass, setEditingFeeClass] = useState<string | null>(null);
  const [feeEdits, setFeeEdits] = useState<{ [className: string]: string }>({});
  const [isSavingFee, setIsSavingFee] = useState<string | null>(null);
  const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });


  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };
  
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (userData: User | Omit<User, 'id'>) => {
    setIsSavingUser(true);
    if ('id' in userData) {
        await updateUser(userData);
    } else {
        await addUser(userData as Omit<User, 'id'>);
    }
    setIsSavingUser(false);
    handleCloseUserModal();
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if(deletingUser) {
        setIsDeletingUser(true);
        await deleteUser(deletingUser.id);
        setIsDeletingUser(false);
        setDeletingUser(null);
    }
  }

  const handleEditFee = (className: string, currentAmount: number) => {
    setEditingFeeClass(className);
    setFeeEdits(prev => ({ ...prev, [className]: String(currentAmount) }));
  }

  const handleSaveFee = async (className: string) => {
    const newAmount = parseFloat(feeEdits[className]);
    if(!isNaN(newAmount) && newAmount >= 0) {
        setIsSavingFee(className);
        await updateClassSessionFee(className, ACADEMIC_YEAR, newAmount);
        setIsSavingFee(null);
    }
    setEditingFeeClass(null);
  }

  const handleCancelEditFee = () => {
    setEditingFeeClass(null);
  }
  
  return (
      <div className="p-4 md:p-6 lg:p-8 space-y-10">
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
                <button onClick={handleOpenAddUser} className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                    <PlusIcon />
                    Add User
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-4">
                            <button onClick={() => handleOpenEditUser(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 flex items-center gap-1">
                              <EditIcon />
                            </button>
                            <button onClick={() => setDeletingUser(user)} disabled={user.id === currentUser?.id} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 flex items-center gap-1 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed">
                                <DeleteIcon />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>

        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">Fee Structure ({ACADEMIC_YEAR})</h1>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Annual Fee</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {classFees.map(cf => {
                            const currentFee = cf.fee_structure[ACADEMIC_YEAR] || 0;
                            const isEditing = editingFeeClass === cf.class_name;
                            const isSavingThisFee = isSavingFee === cf.class_name;
                            return (
                                <tr key={cf.class_name}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{cf.class_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {isEditing ? (
                                            <input 
                                                type="number" 
                                                value={feeEdits[cf.class_name] || ''}
                                                onChange={e => setFeeEdits(prev => ({ ...prev, [cf.class_name]: e.target.value }))}
                                                className="w-32 p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        ) : (
                                            currencyFormatter.format(currentFee)
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {isEditing ? (
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => handleSaveFee(cf.class_name)} disabled={isSavingThisFee} className="text-white bg-green-600 hover:bg-green-700 text-xs py-1 px-2 rounded disabled:bg-green-400 disabled:cursor-not-allowed">
                                                    {isSavingThisFee ? 'Saving...' : 'Save'}
                                                </button>
                                                <button onClick={handleCancelEditFee} className="text-gray-700 bg-gray-200 hover:bg-gray-300 text-xs py-1 px-2 rounded dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEditFee(cf.class_name, currentFee)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 flex items-center gap-1">
                                                <EditIcon className="w-4 h-4" /> Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={editingUser ? `Edit User: ${editingUser.name}`: 'Add New User'}>
          <UserForm 
            user={editingUser}
            onSave={handleSaveUser}
            onClose={handleCloseUserModal}
            existingUsernames={users.map(u => u.username)}
            isSaving={isSavingUser}
          />
        </Modal>

        {deletingUser && (
            <Modal isOpen={!!deletingUser} onClose={() => setDeletingUser(null)} title="Confirm Deletion">
                <div className="text-gray-800 dark:text-gray-200">
                    <p>Are you sure you want to permanently delete user <span className="font-bold">{deletingUser.name} ({deletingUser.username})</span>?</p>
                    <p className="text-sm text-red-500 mt-2">This action cannot be undone.</p>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setDeletingUser(null)} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        Cancel
                    </button>
                    <button onClick={handleDeleteUser} disabled={isDeletingUser} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed">
                        {isDeletingUser ? 'Deleting...' : 'Delete User'}
                    </button>
                </div>
            </Modal>
        )}
      </div>
  );
};

// --- Login Screen ---
const LoginScreen: React.FC<{ onLogin: (username: string, password: string) => boolean }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!onLogin(username, password)) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Fees Management System</h2>
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div>
            <label htmlFor="username-input" className="sr-only">Username</label>
            <input
              id="username-input"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password-input" className="sr-only">Password</label>
            <input
              id="password-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Sidebar Navigation ---
const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Sidebar: React.FC<{
  user: User;
  currentPage: Page;
  setPage: (page: Page) => void;
  onLogout: () => void;
}> = ({ user, currentPage, setPage, onLogout }) => {
  const { isConnected, refreshData } = useContext(DataContext);
  const navItems = [
    { page: 'Dashboard', icon: <DashboardIcon className="w-5 h-5"/>, roles: [Role.Admin, Role.Accountant, Role.Teacher, Role.Parent] },
    { page: 'Students', icon: <StudentsIcon className="w-5 h-5"/>, roles: [Role.Admin, Role.Accountant, Role.Teacher] },
    { page: 'Payments', icon: <PaymentIcon className="w-5 h-5"/>, roles: [Role.Admin, Role.Accountant, Role.Parent] },
    { page: 'Reports', icon: <ReportsIcon className="w-5 h-5"/>, roles: [Role.Admin, Role.Accountant] },
    { page: 'Settings', icon: <SettingsIcon className="w-5 h-5"/>, roles: [Role.Admin] },
  ].filter(item => item.roles.includes(user.role));

  return (
    <div className="flex flex-col flex-shrink-0 w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
      <div className="flex items-center justify-center h-16 border-b dark:border-gray-700 flex-shrink-0">
        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">School Fees</span>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.page}
            icon={item.icon}
            label={item.page}
            isActive={currentPage === item.page}
            onClick={() => setPage(item.page as Page)}
          />
        ))}
      </nav>
      <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
        <div className="mb-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
            <div className="flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {isConnected ? 'SQL Connected' : 'Mock Data'}
                </span>
            </div>
            {!isConnected && (
                <button onClick={refreshData} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Retry Connection">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
            )}
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{user.name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
        <button onClick={onLogout} className="w-full flex items-center mt-4 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md">
           <LogoutIcon className="w-5 h-5" />
           <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
};

// --- Main Application Layout ---
const AppLayout: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if (!user) return null;

  useEffect(() => {
    // Default page based on role
    const roleDefaultPages: { [key in Role]?: Page } = {
        [Role.Admin]: 'Dashboard',
        [Role.Accountant]: 'Payments',
        [Role.Teacher]: 'Students',
        [Role.Parent]: 'Payments'
    };
    setCurrentPage(roleDefaultPages[user.role] || 'Dashboard');
  }, [user.role]);

  const handleSetPage = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false); // Close sidebar on navigation
  }

  const renderPage = () => {
    switch(currentPage) {
        case 'Students': return <StudentsPage />;
        case 'Payments': return <PaymentsPage />;
        case 'Reports': return user.role === Role.Admin || user.role === Role.Accountant ? <ReportsPage /> : null;
        case 'Settings': return user.role === Role.Admin ? <SettingsPage /> : null;
        case 'Dashboard':
        default:
            return <DashboardPage />;
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      {/* Overlay for mobile */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar user={user} currentPage={currentPage} setPage={handleSetPage} onLogout={logout}/>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
            <button onClick={() => setIsSidebarOpen(true)}>
                <MenuIcon className="h-6 w-6 text-gray-600 dark:text-gray-300"/>
            </button>
            <span className="text-lg font-bold text-gray-800 dark:text-white">{currentPage}</span>
            <div className="w-6"></div>
        </header>

        <main className="flex-1 overflow-y-auto">
            {renderPage()}
        </main>
      </div>
    </div>
  );
};


// --- App Component ---
const AppContent: React.FC = () => {
  const { user, login } = useContext(AuthContext);
  return user ? <AppLayout /> : <LoginScreen onLogin={login} />;
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DataProvider>
  );
};

export default App;
