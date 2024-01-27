import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Feed from '../components/Feed';
import './Home.css';

export default function Home() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className={`d-flex flex-row ${sidebarVisible ? 'toggled' : ''}`}>
      <Sidebar />
      <Feed />
      <button
        className="btn btn-primary d-block d-md-none"
        onClick={toggleSidebar}
      >
        Toggle Sidebar
      </button>
    </div>
  );
}
