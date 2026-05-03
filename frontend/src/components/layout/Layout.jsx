import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <main className="mt-16 p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;