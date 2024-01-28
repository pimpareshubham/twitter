import React, { useEffect, useState } from 'react';
import logo from '../images/logo.png';
import './Sidebar.css';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Sidebar() {
    const user = useSelector((state) => state.userReducer);

    const [userDetailss, setUserDetails] = useState({
        profileImg: '',
    });
    const [loading, setLoading] = useState(true);

    

    useEffect(() => {

        const CONFIG_OBJ = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + localStorage.getItem('token'),
            },
        };
        const getUserDetails = async () => {
            try {
                if (user.user._id) {
                    const response = await axios.get(`${API_BASE_URL}/userDetails/${user.user._id}`, CONFIG_OBJ);
                    setUserDetails(response.data.userDetails);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to fetch user details',
                });
            }
        };
        getUserDetails()
    }, [user]);

    return (
        <div className="sidebar-body sidebar">
            <img src={logo} height={'60vh'} className="ms-3 logo" alt="Logo" />
            <div className="d-flex flex-column mt-3 ms-4 menu">
                <NavLink className="menu-item fw-bold p-2 ps-3" to="/home">
                    <i className="fa-solid fa-house me-3 icons"></i>
                </NavLink>
                <NavLink className="menu-item fw-bold p-2 ps-3" to="/profile">
                    <i className="fa-solid fa-user me-3 icons"></i>
                </NavLink>
                <NavLink className="menu-item fw-bold p-2 ps-3" to="/login">
                    <i className="fa-solid fa-right-from-bracket me-3 icons"></i>
                </NavLink>
                <div className="position-absolute bottom-0 pb-4 d-flex flex-column profile-section">
                    {/* {loading && <div>Loading...</div>} */}

                    {userDetailss && !loading && userDetailss.profileImg && (
                        <>
                            {/* <img
                                src={userDetailss.profileImg}
                                height={'20vh'}
                                className="profilepic"
                                alt="Profile"
                            /> */}
                            <p className="fw-bold">@{userDetailss.fullName}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
